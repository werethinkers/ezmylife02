import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
serve(async () => {
  const k = Deno.env.get("GEMINI_API_KEY_1")!;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${k}`);
  const text = await r.text();
  let imgModels: any[] = [];
  try {
    const j = JSON.parse(text);
    imgModels = (j.models || []).filter((m: any) => /image/i.test(m.name)).map((m:any)=>({name:m.name, methods:m.supportedGenerationMethods}));
  } catch {}
  return new Response(JSON.stringify({ status: r.status, imgModels }, null, 2), { headers: { "Content-Type": "application/json" } });
});
