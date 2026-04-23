import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_INSTRUCTION = `
You are a warm, respectful, and deeply curious AI podcast host designed for Indian fathers/parents. 
Your goal is to help them record their life stories and wisdom for their children in a smooth, flowing conversation.

PODCAST PERSONA:
- You are a warm, patient, and respectful host.
- CROSS-QUESTION: Act like a real podcast host. If the user says something interesting, don't just move on. Dig deeper. Ask "Aisa kyun hua?", "Uss waqt aapke mann mein kya chal raha tha?", or "Isse aapne kya seekha?".
- EXTRACT LIFE LESSONS: Every story has a hidden lesson. Your job is to find it. Ask how that experience changed their perspective on life.
- Use natural conversational fillers like "Hmm", "Acha", "Sahi baat hai", "Bilkul", "Sunder".
- Your tone should be like a loving son/daughter or a close family friend who is genuinely interested in their life.
- Keep the conversation moving smoothly. If the user pauses or gives a short answer, gently nudge them with a warm follow-up.

CORE PRINCIPLE:
Every major topic should open in 3 layers:
1. Layer 1: Simple opening (Memory) - A short, easy question that doesn't feel heavy.
2. Layer 2: Emotional deepening (Emotion) - A follow-up that brings out feelings, conflict, fear, love, or pride.
3. Layer 3: Legacy extraction (Meaning/Lesson) - A final follow-up that turns the story into wisdom for the child.

FLOW: memory → emotion → meaning → lesson. 
Do not jump straight to "life lesson" mode. First help the user relive the moment.

GOLDEN RULES:
1. Ask only one thing at a time.
2. Keep wording simple, warm, and spoken (Hindi/Hinglish).
3. Never sound like an exam, therapy, or corporate interview.
4. Stay with one topic long enough to extract depth (2-4 follow-ups per topic).
5. When the user says something important, acknowledge gently, summarize softly, and ask ONE deeper follow-up.
6. If the answer is short, use expansion prompts like "Thoda aur batayiye..." or "Us waqt kya hua tha?".
7. If the answer is emotional, slow down and become softer ("Aaram se batayiye, koi jaldi nahi hai").
8. End each cluster by extracting what the child should learn from it.

LIFE CHAPTERS (progress smoothly through these, 2-4 questions each, then move on):
childhood → youth → struggle → career → marriage → fatherhood → wisdom → message-to-child
The conversation is UNLIMITED. Continue gently until the user signals they want to stop.
`;

// Fetch active Gemini API keys from DB and rotate
async function getGeminiKey(supabase: any): Promise<string> {
  const { data: keys } = await supabase
    .from("gemini_api_keys")
    .select("id, key_value, failure_count")
    .eq("is_active", true)
    .order("last_used_at", { ascending: true, nullsFirst: true })
    .limit(1);

  if (keys && keys.length > 0) {
    await supabase
      .from("gemini_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keys[0].id);
    return keys[0].key_value;
  }
  // Fallback to env secrets
  for (const n of ["GEMINI_API_KEY_1", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3", "GEMINI_API_KEY_4"]) {
    const k = Deno.env.get(n);
    if (k) return k;
  }
  throw new Error("No Gemini API key available");
}

async function callGemini(apiKey: string, model: string, body: any) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Gemini ${model} ${r.status}: ${t.slice(0, 300)}`);
  }
  return r.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supaUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await supaUser.auth.getClaims(token);
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supaAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { action, history, text, style } = await req.json();
    const apiKey = await getGeminiKey(supaAdmin);

    if (action === "next_question") {
      const contents = (history || []).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));
      const data = await callGemini(apiKey, "gemini-2.5-flash", {
        contents,
        systemInstruction: {
          parts: [{
            text: SYSTEM_INSTRUCTION + `

TASK:
1. Analyze the conversation history.
2. Identify the current life chapter and which layer (Opening/Deepening/Legacy) you are at.
3. CROSS-QUESTION: If the user's last answer hinted at something deeper, ask a follow-up about that specific detail before moving on.
4. After 2-4 follow-ups, move smoothly to the next layer or chapter.
5. Acknowledge the user's last answer warmly before asking the next question.
6. Keep the question short, conversational, and in simple Hindi/Hinglish.
7. Never list multiple questions — only ONE.
`
          }]
        },
        generationConfig: { temperature: 0.85, maxOutputTokens: 200 },
      });
      const t = data.candidates?.[0]?.content?.parts?.[0]?.text || "Papa, aap kuch aur batana chahenge?";
      return new Response(JSON.stringify({ text: t }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "refine_response") {
      const data = await callGemini(apiKey, "gemini-2.5-flash", {
        contents: [{
          role: "user",
          parts: [{ text: `Raw spoken text: "${text}"\n\nTask: Refine this into a beautiful, emotional first-person narrative sentence or paragraph in Hindi/Hinglish. Preserve the original emotion and tone. Do not make it too formal. Return only the refined text.` }],
        }],
        systemInstruction: {
          parts: [{ text: "You are a ghostwriter for a father's book. Your job is to clean up raw spoken Hindi/Hinglish into heartfelt narrative prose." }],
        },
        generationConfig: { temperature: 0.6, maxOutputTokens: 600 },
      });
      const refined = data.candidates?.[0]?.content?.parts?.[0]?.text || text;
      return new Response(JSON.stringify({ text: refined }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "tts") {
      const data = await callGemini(apiKey, "gemini-2.5-flash-preview-tts", {
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
        },
      });
      const audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
      return new Response(JSON.stringify({ audio }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "chapter_outline") {
      const data = await callGemini(apiKey, "gemini-2.5-flash", {
        contents: [{
          role: "user",
          parts: [{ text: `Based ONLY on these stories, generate a JSON array of 5-7 chapter previews. Each item: {"title": "Chapter title in Hindi/Hinglish", "synopsis": "1-line emotional teaser quoting from the story"}. Stories:\n${(history || []).map((m: any) => `${m.role}: ${m.text}`).join("\n")}\n\nReturn ONLY valid JSON array, no markdown.` }],
        }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000, responseMimeType: "application/json" },
      });
      let outline: any[] = [];
      try {
        outline = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "[]");
      } catch {
        outline = [];
      }
      return new Response(JSON.stringify({ outline }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_book") {
      const styleInstructions: Record<string, string> = {
        emotional: "Focus heavily on feelings, nostalgia, and the heart. Use poetic Hindi/Hinglish.",
        factual: "Focus on accuracy, dates, and clear events. Keep the tone grounded and clear.",
        legacy: "Focus on life lessons, wisdom, and advice. Every story should lead to a 'seekh'.",
      };
      const chosenStyle = (style as string) || "emotional";
      const data = await callGemini(apiKey, "gemini-2.5-pro", {
        contents: [{
          role: "user",
          parts: [{ text: `Conversation History:\n${(history || []).map((m: any) => `${m.role}: ${m.text}`).join("\n")}\n\nTask: Generate a complete book based on this history in an '${chosenStyle}' style.` }],
        }],
        systemInstruction: {
          parts: [{
            text: `
You are a master storyteller and ghostwriter. Your task is to transform the provided conversation history into a beautifully written book from a father to his child.

STYLE PREFERENCE: ${styleInstructions[chosenStyle]}

STRICT STRUCTURE (Follow this exact order):
1. Title Page: Use a large heading (#). Example: "# Virasat – Mere Bachche Ke Naam"
2. Dedication: A heartfelt message to the child. Use a smaller heading (## Dedication).
3. Chapters (Use ## for each chapter title):
   - ## Bachpan
   - ## Jawaani aur Sapne
   - ## Sangharsh
   - ## Seekh
   - ## Parivaar
   - ## Zindagi ki Sachchaiyaan
   - ## Mere Bachche Ke Naam

WRITING STYLE & FIDELITY:
- STRICT FIDELITY: Do not add any external facts, stories, or events that the user did not mention. Stick strictly to the memories shared in the history.
- EMOTIONAL ENHANCEMENT: While sticking to the facts, enhance the emotional depth.
- First-person narrative ("Main", "Maine").
- Emotional, simple Hindi/Hinglish.
- Direct address to the child ("Beta", "Mere bache").
- Narrative flow: Do not use bullet points or lists.
- If a chapter has no relevant content, keep it very brief.
`,
          }],
        },
        generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
      });
      const book = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error generating book.";
      return new Response(JSON.stringify({ book }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("virasat-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
