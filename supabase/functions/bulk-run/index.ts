// Bulk processing dispatcher.
// Runs each item by calling Gemini (via Lovable AI Gateway, with fallback to
// rotating Gemini keys) for AI image tools, or by calling the existing
// per-item edge functions where appropriate. Builds a ZIP and uploads it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface ManifestItem {
  filename: string;
  storage_path: string;
  size: number;
}

// ---------- Gemini key fallback ----------
function envGeminiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const k = Deno.env.get(`GEMINI_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  return keys;
}

async function dbGeminiKeys(sb: any): Promise<string[]> {
  try {
    const { data } = await sb
      .from("gemini_api_keys")
      .select("key_value")
      .eq("is_active", true)
      .order("failure_count", { ascending: true });
    return (data || []).map((r: any) => r.key_value);
  } catch { return []; }
}

// ---------- Image editing (returns PNG blob) ----------
async function blobToDataUrl(b: Blob): Promise<string> {
  const buf = new Uint8Array(await b.arrayBuffer());
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    bin += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return `data:${b.type || "image/png"};base64,${btoa(bin)}`;
}

function base64ToBlob(b64: string, mime = "image/png"): Blob {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/** Try Lovable AI Gateway first, then rotate Gemini API keys. Returns image blob or throws. */
async function editImageWithGemini(
  inputBlob: Blob,
  prompt: string,
  sb: any,
): Promise<Blob> {
  const dataUrl = await blobToDataUrl(inputBlob);

  // 1) Lovable AI Gateway
  if (LOVABLE_API_KEY) {
    try {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          modalities: ["image", "text"],
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const imgs = data?.choices?.[0]?.message?.images;
        const url = imgs?.[0]?.image_url?.url;
        if (url?.startsWith("data:")) {
          const [meta, b64] = url.split(",");
          const mime = meta.match(/data:([^;]+)/)?.[1] || "image/png";
          return base64ToBlob(b64, mime);
        }
      } else {
        console.warn("Lovable AI image edit failed:", r.status);
      }
    } catch (e) {
      console.warn("Lovable AI image edit error:", e);
    }
  }

  // 2) Gemini direct keys
  const keys = Array.from(new Set([...(await dbGeminiKeys(sb)), ...envGeminiKeys()]));
  for (const k of keys) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${k}`;
      const buf = new Uint8Array(await inputBlob.arrayBuffer());
      let bin = "";
      const chunk = 0x8000;
      for (let i = 0; i < buf.length; i += chunk) bin += String.fromCharCode(...buf.subarray(i, i + chunk));
      const inlineData = { mimeType: inputBlob.type || "image/png", data: btoa(bin) };
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }, { inlineData }] }],
        }),
      });
      if (!r.ok) {
        console.warn("Gemini image direct failed:", r.status);
        continue;
      }
      const data = await r.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find((p: any) => p.inlineData?.data);
      if (imgPart) return base64ToBlob(imgPart.inlineData.data, imgPart.inlineData.mimeType || "image/png");
    } catch (e) {
      console.warn("Gemini direct error:", e);
    }
  }
  throw new Error("All image AI providers failed");
}

// ---------- Per-tool prompt builders ----------
function backgroundRemoverPrompt(params: Record<string, any>): string {
  const bg = params.background || "transparent";
  if (bg === "transparent") {
    return "Remove the background from this image completely. Output a PNG with a fully transparent background. Preserve the subject sharply with clean edges. Do not change the subject.";
  }
  if (bg === "white") return "Remove the background and replace with a solid pure white (#ffffff) background. Keep the subject unchanged.";
  if (bg === "black") return "Remove the background and replace with a solid pure black (#000000) background. Keep the subject unchanged.";
  if (bg === "custom") {
    const hex = params.background_hex || "#ffffff";
    return `Remove the background and replace with a solid ${hex} background. Keep the subject unchanged.`;
  }
  return "Remove the background.";
}

function passportPhotoPrompt(params: Record<string, any>): string {
  const sizes: Record<string, string> = {
    india_35x45: "India passport (35x45 mm)",
    us_2x2: "US passport (2x2 inch)",
    schengen_35x45: "Schengen passport (35x45 mm)",
    uk_35x45: "UK passport (35x45 mm)",
  };
  const bg: Record<string, string> = {
    white: "pure white", light_blue: "light blue", red: "red", grey: "neutral grey",
  };
  const size = sizes[params.size_preset] || "passport standard";
  const bgColor = bg[params.background] || "pure white";
  return `Convert this photo into a professional ${size} passport photo. Crop tightly so head and top of shoulders are centered, neutral expression, eyes facing camera, even lighting. Replace the background with a solid ${bgColor} background. Output a clean, print-ready image.`;
}

function beautifyPrompt(params: Record<string, any>): string {
  const styles: Record<string, string> = {
    natural: "natural, subtle skin/lighting enhancement, preserve identity",
    studio: "professional studio portrait look, soft key light, clean background",
    cinematic: "cinematic color grading, soft contrast, filmic mood",
    vivid: "vivid colors, punchy contrast, sharper details",
  };
  const style = styles[params.style] || styles.natural;
  const strength = params.strength || 6;
  return `Enhance this image with a ${style}. Strength ${strength}/10. Preserve the subject's identity, do not change facial features.`;
}

// ---------- Per-item processor ----------
async function processItem(
  toolId: string,
  fileBlob: Blob,
  filename: string,
  authHeader: string,
  params: Record<string, any>,
  sb: any,
  userId: string,
): Promise<{ outBlob?: Blob; outName?: string; csvRow?: string; error?: string }> {
  try {
    if (toolId === "background-remover") {
      const out = await editImageWithGemini(fileBlob, backgroundRemoverPrompt(params), sb);
      return { outBlob: out, outName: filename.replace(/\.[^.]+$/, ".png") };
    }
    if (toolId === "passport-photo-maker") {
      const out = await editImageWithGemini(fileBlob, passportPhotoPrompt(params), sb);
      return { outBlob: out, outName: filename.replace(/\.[^.]+$/, "-passport.png") };
    }
    if (toolId === "image-beautify") {
      const out = await editImageWithGemini(fileBlob, beautifyPrompt(params), sb);
      return { outBlob: out, outName: filename.replace(/\.[^.]+$/, "-beautified.png") };
    }

    if (toolId === "business-card-scanner") {
      const dataUrl = await blobToDataUrl(fileBlob);
      const r = await fetch(`${SUPABASE_URL}/functions/v1/scan-business-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ images: [dataUrl] }),
      });
      if (!r.ok) return { error: `scan failed (${r.status})` };
      const data = await r.json();
      const c = data?.contact || {};
      // Auto-save contact
      if (params.auto_save_contacts !== false && c.name) {
        try {
          await sb.from("meet_nudge_contacts").insert({
            host_id: userId,
            name: c.name,
            email: c.email || null,
            phone: c.phone || null,
            business_name: c.business_name || null,
            occupation: c.occupation || null,
            website: c.website || null,
            linkedin_url: c.linkedin_url || null,
            location: c.location || null,
            event_name: params.tag || null,
          });
        } catch (e) { console.warn("contact insert failed:", e); }
      }
      const csvRow = `"${filename}","${c.name || ""}","${c.email || ""}","${c.phone || ""}","${c.business_name || ""}","${c.occupation || ""}","${params.tag || ""}"`;
      return { csvRow };
    }

    return { error: `Unsupported tool: ${toolId}` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function processJob(jobId: string, toolId: string, manifest: ManifestItem[], authHeader: string, params: Record<string, any>) {
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  await sb.from("bulk_jobs").update({ status: "running" }).eq("id", jobId);
  const { data: jobRow } = await sb.from("bulk_jobs").select("user_id").eq("id", jobId).maybeSingle();
  const userId = jobRow?.user_id;

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

      const result = await processItem(toolId, blob, item.filename, authHeader, params, sb, userId);
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
    const { job_id, tool_id, input_manifest, params } = await req.json();
    if (!job_id || !tool_id || !Array.isArray(input_manifest)) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") || "";

    // @ts-ignore EdgeRuntime
    EdgeRuntime.waitUntil(processJob(job_id, tool_id, input_manifest, authHeader, params || {}));

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
