import { serve as stdServe } from "https://deno.land/std@0.168.0/http/server.ts";
import { billed } from "../_shared/billing.ts";

// Every request is signed-in-checked and, for paid actions, charged on the server.
const serve = (handler: (req: Request) => Promise<Response>) =>
  // The keepsake book is the charged result ("virasat"). Interview helpers (next question, tidy-up,
  // Hindi script, reading a question aloud) are free but size-capped below.
  stdServe(billed({ tool: (b) => (b?.action === "book" ? "virasat-book" : null), defaultCredits: () => 10 }, (req) => handler(req)));
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DbKey { id: string; key_value: string; failure_count: number }

function getEnvFallbackKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const k = Deno.env.get(`GEMINI_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  return keys;
}

async function fetchDbKeys(): Promise<DbKey[]> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return [];
    const sb = createClient(url, key);
    const { data, error } = await sb
      .from("gemini_api_keys")
      .select("id,key_value,failure_count")
      .eq("is_active", true)
      .order("failure_count", { ascending: true })
      .order("last_used_at", { ascending: true, nullsFirst: true });
    if (error) return [];
    return (data as DbKey[]) ?? [];
  } catch {
    return [];
  }
}

async function recordKeySuccess(id: string) {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const sb = createClient(url, key);
    await sb.from("gemini_api_keys").update({ last_used_at: new Date().toISOString(), failure_count: 0 }).eq("id", id);
  } catch { /* ignore */ }
}

async function recordKeyFailure(id: string, currentCount: number) {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const sb = createClient(url, key);
    const newCount = currentCount + 1;
    await sb.from("gemini_api_keys").update({ failure_count: newCount, is_active: newCount < 5 }).eq("id", id);
  } catch { /* ignore */ }
}

const SYSTEM_INSTRUCTION = `
You are a warm, respectful, and deeply curious AI podcast host designed for Indian fathers/parents.
Your goal is to help them record their life stories and wisdom for their children in a smooth, flowing conversation.

PODCAST PERSONA:
- You are a warm, patient, and respectful host.
- CROSS-QUESTION: Act like a real podcast host. If the user says something interesting, don't just move on. Dig deeper. Ask "Aisa kyun hua?", "Uss waqt aapke mann mein kya chal raha tha?", or "Isse aapne kya seekha?".
- EXTRACT LIFE LESSONS: Every story has a hidden lesson. Your job is to find it.
- Use natural conversational fillers like "Hmm", "Acha", "Sahi baat hai", "Bilkul", "Sunder".
- Tone: like a loving son/daughter or close family friend who is genuinely interested.

CORE PRINCIPLE — every major topic opens in 3 layers:
1. Memory (simple opening)
2. Emotion (feelings, conflict, fear, love, pride)
3. Meaning/Lesson (legacy extraction)

GOLDEN RULES:
1. Ask only ONE thing at a time.
2. Keep wording simple, warm, spoken (Hindi/Hinglish).
3. Never sound like an exam or interview.
4. Stay with one topic long enough (2-4 follow-ups).
5. Acknowledge → softly summarize → ONE deeper follow-up.
6. If short answer: nudge with "Thoda aur batayiye..." or "Us waqt kya hua tha?".
7. If emotional: slow down, become softer.
8. End each cluster by extracting a "seekh".
9. Conversation can go on as long as the user wants — don't artificially stop.
`;

interface Message { role: "user" | "model"; text: string }

async function callGeminiText(apiKey: string, model: string, contents: unknown, systemInstruction?: string): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: 0.7 },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }
  return await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function callGeminiTTS(apiKey: string, text: string): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
      },
    },
  };
  return await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function withKeyRotation<T>(operation: (apiKey: string) => Promise<{ ok: boolean; result?: T; status?: number }>): Promise<T> {
  const dbKeys = await fetchDbKeys();
  const envKeys = getEnvFallbackKeys();
  const allAttempts: Array<{ apiKey: string; dbKeyId?: string; failureCount?: number }> = [
    ...dbKeys.map((k) => ({ apiKey: k.key_value, dbKeyId: k.id, failureCount: k.failure_count })),
    ...envKeys.map((k) => ({ apiKey: k })),
  ];
  if (allAttempts.length === 0) throw new Error("No Gemini API keys configured");

  let lastErr = "All keys failed";
  for (const attempt of allAttempts) {
    try {
      const { ok, result, status } = await operation(attempt.apiKey);
      if (ok && result !== undefined) {
        if (attempt.dbKeyId) await recordKeySuccess(attempt.dbKeyId);
        return result;
      }
      if (attempt.dbKeyId && (status === 429 || status === 403 || status === 401)) {
        await recordKeyFailure(attempt.dbKeyId, attempt.failureCount ?? 0);
      }
      lastErr = `status ${status}`;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(lastErr);
}

async function getNextQuestion(history: Message[]): Promise<string> {
  const contents = history.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
  const sys = SYSTEM_INSTRUCTION + `

TASK:
1. Analyze the conversation history.
2. Identify the current theme and which layer (Opening / Deepening / Legacy) you are at.
3. CROSS-QUESTION when the user's last answer hinted at something deeper.
4. If layer complete, move to next layer of same theme.
5. If all 3 layers complete, move to a new theme.
6. Acknowledge the user's last answer warmly before asking the next question.
7. Keep the question short, conversational, in simple Hindi/Hinglish.
`;
  return await withKeyRotation<string>(async (apiKey) => {
    const resp = await callGeminiText(apiKey, "gemini-2.5-flash", contents, sys);
    if (!resp.ok) return { ok: false, status: resp.status };
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "Papa, aap kuch aur batana chahenge?";
    return { ok: true, result: text, status: 200 };
  });
}

async function refineResponse(rawText: string): Promise<string> {
  const contents = [{ role: "user", parts: [{ text: `Raw spoken text: "${rawText}"\n\nTask: Refine this into a beautiful, emotional first-person narrative sentence or paragraph in Hindi/Hinglish. Preserve the original emotion and tone. Do not make it too formal.` }] }];
  return await withKeyRotation<string>(async (apiKey) => {
    const resp = await callGeminiText(apiKey, "gemini-2.5-flash", contents, "You are a ghostwriter for a father's book. Clean up raw spoken Hindi/Hinglish into heartfelt narrative prose.");
    if (!resp.ok) return { ok: false, status: resp.status };
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || rawText;
    return { ok: true, result: text, status: 200 };
  });
}

interface MediaSummary { question_index: number | null; type: string; caption?: string }

async function generateBook(
  history: Message[],
  style: "emotional" | "factual" | "legacy",
  childName?: string,
  fatherName?: string,
  media?: MediaSummary[],
): Promise<string> {
  const styleInstructions = {
    emotional: "Focus heavily on feelings, nostalgia, and the heart. Use poetic Hindi/Hinglish.",
    factual: "Focus on accuracy, dates, and clear events. Keep the tone grounded and clear.",
    legacy: "Focus on life lessons, wisdom, and advice. Every story should lead to a 'seekh'.",
  };

  const childAddress = childName?.trim() ? `"${childName}"` : `"Beta" / "Mere bachche"`;
  const fatherIntro = fatherName?.trim() ? `The storyteller is ${fatherName}.` : "";

  const mediaNote = media && media.length > 0
    ? `\nATTACHED MEMORIES (${media.length} item${media.length > 1 ? "s" : ""}): The user has attached ${media.filter((m) => m.type === "image").length} photo(s), ${media.filter((m) => m.type === "video").length} video(s), and ${media.filter((m) => m.type === "audio").length} voice clip(s) at various points. In the relevant chapters, gently acknowledge these with phrases like "(Yahan us pal ki tasveer lagi hai)" or "(Yeh meri awaaz mein bhi hai)" — but ONLY when narratively appropriate. Do NOT invent details about what is in them.`
    : "";

  const sys = `
You are a master storyteller and ghostwriter. This is NOT a publishable book — this is a deeply personal keepsake letter from a parent to their child, meant to be read and treasured by their family.

${fatherIntro}
Address the child as ${childAddress} throughout. The tone is intimate, like a long, loving letter — never academic or generic.

STYLE PREFERENCE: ${styleInstructions[style]}
${mediaNote}

STRICT STRUCTURE:
1. Title Page (#): "# Virasat${childName ? ` – ${childName} Ke Naam` : " – Mere Bachche Ke Naam"}"
2. ## Dedication (a short, warm dedication directly to ${childAddress})
3. Chapters (## each):
   - ## Bachpan
   - ## Jawaani aur Sapne
   - ## Sangharsh
   - ## Seekh
   - ## Parivaar
   - ## Zindagi ki Sachchaiyaan
   - ## Mere Bachche Ke Naam

WRITING STYLE & FIDELITY:
- STRICT FIDELITY: don't add facts not mentioned.
- EMOTIONAL ENHANCEMENT: enhance depth using the feelings the user expressed.
- First-person ("Main", "Maine"). Direct, intimate address.
- Narrative flow — no bullet points.
- Preserve the specific stories verbatim where powerful.
- If a chapter has no relevant content, keep it short and honest — do not invent.
- This is private, for family eyes only. Write like a letter, not a book for publication.
`;
  const contents = [{ role: "user", parts: [{ text: `Conversation History:\n${history.map((m) => `${m.role}: ${m.text}`).join("\n")}\n\nTask: Generate a complete personal keepsake in '${style}' style for ${childAddress}.` }] }];
  return await withKeyRotation<string>(async (apiKey) => {
    // Gemini 2.5 Flash keeps a full keepsake within the app's 1–10 credit range (2.5 Pro costs ~₹10+ per book).
    const resp = await callGeminiText(apiKey, "gemini-2.5-flash", contents, sys);
    if (!resp.ok) return { ok: false, status: resp.status };
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "Error generating book.";
    return { ok: true, result: text, status: 200 };
  });
}

async function tts(text: string): Promise<string> {
  return await withKeyRotation<string>(async (apiKey) => {
    const resp = await callGeminiTTS(apiKey, text);
    if (!resp.ok) return { ok: false, status: resp.status };
    const data = await resp.json();
    const audio = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audio) return { ok: false, status: 500 };
    return { ok: true, result: audio as string, status: 200 };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const body = await req.json();
    const action = body?.action as string;
    // Size caps keep the free interview helpers cheap and stop them being used as a general chatbot.
    const cleanHistory = (h: unknown): Message[] =>
      (Array.isArray(h) ? h : [])
        .filter((m: { role?: string; text?: unknown }) => (m?.role === "user" || m?.role === "model") && typeof m.text === "string")
        .slice(-80)
        .map((m: Message) => ({ ...m, text: m.text.slice(0, 3000) }));
    body.history = cleanHistory(body.history);
    if (typeof body.text === "string") body.text = body.text.slice(0, action === "tts" ? 600 : 3000);

    if (action === "nextQuestion") {
      const result = await getNextQuestion(body.history || []);
      return new Response(JSON.stringify({ text: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "refine") {
      const result = await refineResponse(String(body.text || ""));
      return new Response(JSON.stringify({ text: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "book") {
      const result = await generateBook(
        body.history || [],
        (body.style || "emotional"),
        body.childName,
        body.fatherName,
        body.media || [],
      );
      return new Response(JSON.stringify({ text: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "translate") {
      const text = String(body.text || "");
      if (!text.trim()) {
        return new Response(JSON.stringify({ text: "" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const contents = [{ role: "user", parts: [{ text: `Convert the following Romanized Hindi (Hinglish) text into proper Devanagari Hindi script. Output ONLY the Devanagari text, no explanations, no romanization, no quotes.\n\nText:\n${text}` }] }];
      const result = await withKeyRotation<string>(async (apiKey) => {
        const resp = await callGeminiText(apiKey, "gemini-2.5-flash", contents, "You are an expert Hindi transliterator. Convert Romanized Hindi to Devanagari script accurately and naturally.");
        if (!resp.ok) return { ok: false, status: resp.status };
        const data = await resp.json();
        const out = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("").trim() || text;
        return { ok: true, result: out, status: 200 };
      });
      return new Response(JSON.stringify({ text: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "tts") {
      const result = await tts(String(body.text || ""));
      return new Response(JSON.stringify({ audio: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("virasat-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
