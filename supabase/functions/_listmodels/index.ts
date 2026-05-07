import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
serve(async () => {
  const k = Deno.env.get("GEMINI_API_KEY_1")!;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${k}`);
  const text = await r.text();
  // filter image models
  let names: string[] = [];
  try {
    const j = JSON.parse(text);
    names = (j.models || []).filter((m: any) => /image/i.test(m.name) || (m.supportedGenerationMethods||[]).some((s:string)=>/generateContent/i.test(s) && /image/i.test(m.name))).map((m:any)=>({name:m.name, methods:m.supportedGenerationMethods}));
  } catch {}
  return new Response(JSON.stringify({ status: r.status, names, raw: text.slice(0,2000) }, null, 2), { headers: { "Content-Type": "application/json" } });
});
