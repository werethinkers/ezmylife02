// Bulk Mode processor.
//
// Safe by design:
//  • The caller must be the signed-in owner of the job (or this function continuing itself).
//  • Tool, files and settings are read from the saved job row, never from the request,
//    and every file must live in the owner's own job folder.
//  • Each item is charged on the server when it succeeds; failed items cost nothing.
//  • Work runs in time-boxed chunks and continues itself, so large batches don't time out.
//  • Each item's output is stored as it finishes; the ZIP is assembled at the end.
import JSZip from "https://esm.sh/jszip@3.10.1";
import { corsHeaders, json } from "../_shared/http.ts";
import { ensurePrice, finishRun, identify, priceOf, startRun, walletBalance } from "../_shared/billing.ts";
import { image } from "../_shared/llm.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CHUNK_MS = 100_000;
const IMAGE_MODEL = "google/gemini-2.5-flash-image"; // ~$0.039/image (cheaper than the 3.1 preview model)

interface ManifestItem {
  filename: string;
  storage_path: string;
  size: number;
}
interface OutputRow {
  input_filename: string;
  output_filename?: string;
  output_path?: string;
  status: "ok" | "error";
  error?: string;
  csv?: string;
}
interface Job {
  id: string;
  user_id: string;
  tool_id: string;
  status: string;
  input_manifest: ManifestItem[];
  outputs: OutputRow[];
  // deno-lint-ignore no-explicit-any
  params: Record<string, any> | null;
  completed_items: number;
  failed_items: number;
}

// Which price each bulk tool is charged at. AI image edits are priced at cost (12 credits).
const PRICE_TOOL: Record<string, { tool: string; credits: number }> = {
  "background-remover": { tool: "bulk-ai-background", credits: 12 },
  "passport-photo-maker": { tool: "bulk-ai-passport", credits: 12 },
  "image-beautify": { tool: "bulk-ai-beautify", credits: 12 },
  "business-card-scanner": { tool: "meet-nudge", credits: 2 },
};

const svc = { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` };

async function loadJob(id: string): Promise<Job | null> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/bulk_jobs?id=eq.${encodeURIComponent(id)}&select=*`, { headers: svc });
  if (!r.ok) return null;
  const rows = (await r.json()) as Job[];
  return rows[0] ?? null;
}

async function patchJob(id: string, patch: Record<string, unknown>) {
  await fetch(`${SUPABASE_URL}/rest/v1/bulk_jobs?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...svc, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  });
}

async function download(bucket: string, path: string): Promise<Blob> {
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`, { headers: svc });
  if (!r.ok) throw new Error(`download failed (${r.status})`);
  return await r.blob();
}

async function upload(bucket: string, path: string, data: Blob | Uint8Array, contentType: string) {
  const payload: Blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: contentType });
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: { ...svc, "Content-Type": contentType, "x-upsert": "true" },
    body: payload,
  });
  if (!r.ok) throw new Error(`upload failed (${r.status})`);
}

async function blobToDataUrl(b: Blob): Promise<string> {
  const buf = new Uint8Array(await b.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return `data:${b.type || "image/png"};base64,${btoa(bin)}`;
}

function dataUrlToBlob(url: string): Blob {
  const [meta, b64] = url.split(",");
  const mime = meta.match(/data:([^;]+)/)?.[1] ?? "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

// deno-lint-ignore no-explicit-any
function prompts(tool: string, p: Record<string, any>): string {
  if (tool === "background-remover") {
    const bg = p.background ?? "transparent";
    if (bg === "white") return "Remove the background and replace it with solid pure white (#ffffff). Keep the subject exactly unchanged with clean edges.";
    if (bg === "black") return "Remove the background and replace it with solid pure black (#000000). Keep the subject exactly unchanged with clean edges.";
    if (bg === "custom") return `Remove the background and replace it with solid ${String(p.background_hex ?? "#ffffff").slice(0, 9)}. Keep the subject exactly unchanged.`;
    return "Remove the background completely and output the subject on a fully transparent background (PNG). Keep the subject sharp with clean edges.";
  }
  if (tool === "passport-photo-maker") {
    const sizes: Record<string, string> = { india_35x45: "India passport (35x45 mm)", us_2x2: "US passport (2x2 inch)", schengen_35x45: "Schengen passport (35x45 mm)", uk_35x45: "UK passport (35x45 mm)" };
    const bg: Record<string, string> = { white: "pure white", light_blue: "light blue", red: "red", grey: "neutral grey" };
    return `Convert this photo into a professional ${sizes[p.size_preset] ?? "passport standard"} photo: head and top of shoulders centred, neutral expression, even lighting, ${bg[p.background] ?? "pure white"} background. Do not change the person's facial features.`;
  }
  const styles: Record<string, string> = {
    natural: "natural, subtle skin and lighting enhancement",
    studio: "professional studio portrait look with soft key light",
    cinematic: "cinematic colour grading with soft contrast",
    vivid: "vivid colours, punchy contrast and sharper details",
  };
  return `Enhance this image with a ${styles[p.style] ?? styles.natural}, strength ${Number(p.strength) || 6}/10. Preserve the subject's identity; do not change facial features.`;
}

async function processItem(job: Job, item: ManifestItem, index: number): Promise<OutputRow> {
  const params = job.params ?? {};
  const blob = await download("bulk-inputs", item.storage_path);

  if (job.tool_id === "business-card-scanner") {
    // Internal call with the service key: scan-business-card does not charge again.
    const r = await fetch(`${SUPABASE_URL}/functions/v1/scan-business-card`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...svc },
      body: JSON.stringify({ images: [await blobToDataUrl(blob)] }),
    });
    if (!r.ok) throw new Error(`scan failed (${r.status})`);
    const c = ((await r.json())?.contact ?? {}) as Record<string, string>;
    if (params.auto_save_contacts !== false && c.name) {
      await fetch(`${SUPABASE_URL}/rest/v1/meet_nudge_contacts`, {
        method: "POST",
        headers: { ...svc, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          host_id: job.user_id,
          name: c.name,
          email: c.email || null,
          phone: c.phone || null,
          business_name: c.business_name || null,
          occupation: c.occupation || null,
          website: c.website || null,
          linkedin_url: c.linkedin_url || null,
          location: c.location || null,
          event_name: params.tag || null,
        }),
      }).catch(() => undefined);
    }
    const csv = [item.filename, c.name, c.email, c.phone, c.business_name, c.occupation, params.tag].map(csvCell).join(",");
    return { input_filename: item.filename, output_filename: "contacts.csv", status: "ok", csv };
  }

  if (!["background-remover", "passport-photo-maker", "image-beautify"].includes(job.tool_id)) {
    throw new Error(`Bulk mode is not available for ${job.tool_id}`);
  }
  const out = await image(prompts(job.tool_id, params), [await blobToDataUrl(blob)], IMAGE_MODEL);
  const suffix = job.tool_id === "passport-photo-maker" ? "-passport" : job.tool_id === "image-beautify" ? "-enhanced" : "";
  const outName = `${String(index + 1).padStart(3, "0")}-${item.filename.replace(/\.[^.]+$/, "")}${suffix}.png`;
  const outPath = `${job.user_id}/${job.id}/items/${outName}`;
  await upload("bulk-outputs", outPath, dataUrlToBlob(out), "image/png");
  return { input_filename: item.filename, output_filename: outName, output_path: outPath, status: "ok" };
}

async function finalise(job: Job, outputs: OutputRow[]) {
  const zip = new JSZip();
  for (const o of outputs) {
    if (o.status === "ok" && o.output_path) {
      try {
        zip.file(o.output_filename!, new Uint8Array(await (await download("bulk-outputs", o.output_path)).arrayBuffer()));
      } catch (e) {
        console.warn("zip add failed", e);
      }
    }
  }
  const csvRows = outputs.filter((o) => o.csv).map((o) => o.csv!);
  if (csvRows.length) zip.file("contacts.csv", ["source_file,name,email,phone,business,occupation,tag", ...csvRows].join("\n"));
  zip.file(
    "manifest.csv",
    ["input,output,status,error", ...outputs.map((o) => [o.input_filename, o.output_filename ?? "", o.status, o.error ?? ""].map(csvCell).join(","))].join("\n"),
  );
  const zipPath = `${job.user_id}/${job.id}.zip`;
  await upload("bulk-outputs", zipPath, await zip.generateAsync({ type: "uint8array" }), "application/zip");
  const failed = outputs.filter((o) => o.status === "error").length;
  await patchJob(job.id, {
    status: failed === outputs.length ? "failed" : failed > 0 ? "partial" : "completed",
    output_zip_path: zipPath,
    completed_at: new Date().toISOString(),
  });
}

async function runChunk(jobId: string) {
  const job = await loadJob(jobId);
  if (!job) return;
  const items = Array.isArray(job.input_manifest) ? job.input_manifest : [];
  const outputs: OutputRow[] = Array.isArray(job.outputs) ? [...job.outputs] : [];
  const price = PRICE_TOOL[job.tool_id];
  if (price) await ensurePrice(price.tool, price.credits);
  const started = Date.now();
  let totalCharged = Number((job as unknown as { total_credits_charged?: number }).total_credits_charged ?? 0);

  for (let i = outputs.length; i < items.length; i++) {
    if (Date.now() - started > CHUNK_MS) {
      // Hand the rest to a fresh invocation so long batches never hit the time limit.
      await fetch(`${SUPABASE_URL}/functions/v1/bulk-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...svc },
        body: JSON.stringify({ job_id: job.id, continue: true }),
      }).catch((e) => console.error("continue failed", e));
      return;
    }
    const item = items[i];
    let row: OutputRow;
    if (!item?.storage_path?.startsWith(`${job.user_id}/${job.id}/`)) {
      row = { input_filename: item?.filename ?? `item ${i + 1}`, status: "error", error: "file not in this job's folder" };
    } else if (!price) {
      row = { input_filename: item.filename, status: "error", error: "Bulk mode is not available for this app" };
    } else {
      const start = await startRun(job.user_id, price.tool).catch(() => null);
      if (!start?.ok || !start.run_id) {
        row = { input_filename: item.filename, status: "error", error: start ? "insufficient_credits" : "billing_unavailable" };
      } else {
        try {
          row = await processItem(job, item, i);
          const done = await finishRun(job.user_id, start.run_id, true);
          totalCharged += done?.charged ?? 0;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await finishRun(job.user_id, start.run_id, false, msg).catch(() => undefined);
          row = { input_filename: item.filename, status: "error", error: msg };
        }
      }
    }
    outputs.push(row);
    await patchJob(job.id, {
      outputs,
      completed_items: outputs.filter((o) => o.status === "ok").length,
      failed_items: outputs.filter((o) => o.status === "error").length,
      total_credits_charged: totalCharged,
    });
  }
  await finalise(job, outputs);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const caller = await identify(req);
    if (!caller) return json({ error: "sign_in_required" }, 401);
    const { job_id } = (await req.json().catch(() => ({}))) as { job_id?: string };
    if (!job_id) return json({ error: "job_id required" }, 400);

    const job = await loadJob(job_id);
    if (!job) return json({ error: "job not found" }, 404);
    if (!caller.internal) {
      if (job.user_id !== caller.userId) return json({ error: "not your job" }, 403);
      if (job.status !== "queued") return json({ error: "job already started" }, 409);
      const price = PRICE_TOOL[job.tool_id];
      if (!price) return json({ error: "Bulk mode is not available for this app" }, 400);
      // Check up front that the whole batch is affordable, so nobody starts a batch that stops halfway.
      await ensurePrice(price.tool, price.credits);
      const each = (await priceOf(price.tool)) ?? price.credits;
      const count = Array.isArray(job.input_manifest) ? job.input_manifest.length : 0;
      const balance = await walletBalance(caller.userId as string);
      if (balance < each * count) {
        await patchJob(job.id, {
          status: "failed",
          error_message: `Not enough credits: ${count} files need ${each * count}, you have ${balance}. Nothing was charged.`,
        });
        return json(
          {
            error: "insufficient_credits",
            credits_required: each * count,
            balance,
            message: `${count} files need ${each * count} credits (${each} each). You have ${balance}.`,
          },
          402,
        );
      }
      await patchJob(job.id, { status: "running" });
    }
    // @ts-ignore EdgeRuntime is provided by the Supabase runtime
    EdgeRuntime.waitUntil(runChunk(job.id).catch(async (e: unknown) => {
      console.error("bulk chunk failed", e);
      await patchJob(job.id, { status: "failed", error_message: e instanceof Error ? e.message : String(e) });
    }));
    return json({ ok: true, job_id: job.id });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
