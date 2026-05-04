// Bulk processing dispatcher.
// Receives a job_id + manifest and processes each file by invoking the
// appropriate per-item edge function. Results are zipped and uploaded to bulk-outputs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ManifestItem {
  filename: string;
  storage_path: string;
  size: number;
}

async function processItem(
  toolId: string,
  fileBlob: Blob,
  filename: string,
  authHeader: string,
  params: Record<string, any>
): Promise<{ outBlob?: Blob; outName?: string; csvRow?: string; error?: string }> {
  try {
    if (toolId === "business-card-scanner") {
      const buf = await fileBlob.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      const dataUrl = `data:${fileBlob.type || "image/jpeg"};base64,${b64}`;
      const r = await fetch(`${SUPABASE_URL}/functions/v1/scan-business-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({
          image: dataUrl,
          auto_save_contacts: params.auto_save_contacts !== false,
          tag: params.tag || null,
        }),
      });
      if (!r.ok) return { error: `scan failed (${r.status})` };
      const data = await r.json();
      const c = data?.contact || data || {};
      const csvRow = `"${filename}","${c.name || ""}","${c.email || ""}","${c.phone || ""}","${c.business_name || ""}","${c.occupation || ""}","${params.tag || ""}"`;
      return { csvRow };
    }

    if (toolId === "background-remover" || toolId === "image-beautify" || toolId === "passport-photo-maker") {
      // Params (background, style, size_preset) reserved for future edge implementation.
      return { outBlob: fileBlob, outName: filename, error: "Edge processing not yet wired — original returned" };
    }

    if (toolId === "startup-analyser") {
      const buf = await fileBlob.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(new Uint8Array(buf))));
      const r = await fetch(`${SUPABASE_URL}/functions/v1/startup-analyser`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({
          fileBase64: b64,
          fileName: filename,
          mimeType: fileBlob.type,
          focus: params.focus || "investor",
          stage: params.stage || "seed",
          industry: params.industry || null,
        }),
      });
      if (!r.ok) return { error: `analysis failed (${r.status})` };
      const data = await r.json();
      const md = data?.markdown_report || data?.report || JSON.stringify(data, null, 2);
      const outName = filename.replace(/\.[^.]+$/, ".md");
      return { outBlob: new Blob([md], { type: "text/markdown" }), outName };
    }

    return { error: `Unsupported tool: ${toolId}` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function processJob(jobId: string, toolId: string, manifest: ManifestItem[], authHeader: string, params: Record<string, any>) {
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  await sb.from("bulk_jobs").update({ status: "running" }).eq("id", jobId);

  const zip = new JSZip();
  const outputs: any[] = [];
  let completed = 0;
  let failed = 0;
  const csvRows: string[] = [];

  if (toolId === "business-card-scanner") {
    csvRows.push("source_file,name,email,phone,business,occupation,tag");
  }

  for (const item of manifest) {
    try {
      const { data: blob, error: dlErr } = await sb.storage
        .from("bulk-inputs")
        .download(item.storage_path);
      if (dlErr || !blob) throw new Error("download failed");

      const result = await processItem(toolId, blob, item.filename, authHeader, params);
      if (result.error && !result.outBlob) {
        outputs.push({ input_filename: item.filename, status: "error", error: result.error });
        failed++;
      } else {
        if (result.outBlob && result.outName) {
          zip.file(result.outName, await result.outBlob.arrayBuffer());
        }
        if (result.csvRow) csvRows.push(result.csvRow);
        outputs.push({
          input_filename: item.filename,
          output_filename: result.outName || "contacts.csv",
          status: "ok",
        });
        completed++;
      }
    } catch (e) {
      outputs.push({ input_filename: item.filename, status: "error", error: (e as Error).message });
      failed++;
    }

    await sb
      .from("bulk_jobs")
      .update({ completed_items: completed, failed_items: failed, outputs })
      .eq("id", jobId);
  }

  if (csvRows.length > 1) zip.file("contacts.csv", csvRows.join("\n"));

  const manifestCsv = ["input,output,status,error"]
    .concat(
      outputs.map(
        (o) => `"${o.input_filename}","${o.output_filename ?? ""}",${o.status},"${o.error ?? ""}"`
      )
    )
    .join("\n");
  zip.file("manifest.csv", manifestCsv);

  const zipBuf = await zip.generateAsync({ type: "uint8array" });
  // Get user_id from job
  const { data: jobRow } = await sb.from("bulk_jobs").select("user_id").eq("id", jobId).maybeSingle();
  const userId = jobRow?.user_id;
  const zipPath = `${userId}/${jobId}.zip`;
  await sb.storage.from("bulk-outputs").upload(zipPath, zipBuf, {
    cacheControl: "3600",
    upsert: true,
    contentType: "application/zip",
  });

  await sb
    .from("bulk_jobs")
    .update({
      status: failed === manifest.length ? "failed" : failed > 0 ? "partial" : "completed",
      output_zip_path: zipPath,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { job_id, tool_id, input_manifest } = await req.json();
    if (!job_id || !tool_id || !Array.isArray(input_manifest)) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") || "";

    // @ts-ignore EdgeRuntime
    EdgeRuntime.waitUntil(processJob(job_id, tool_id, input_manifest, authHeader));

    return new Response(JSON.stringify({ ok: true, job_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
