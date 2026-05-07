// temp test endpoint
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
serve(async () => {
  const k = Deno.env.get("GEMINI_API_KEY_1")!;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${k}`);
  return new Response(await r.text(), { headers: { "Content-Type": "application/json" } });
});
