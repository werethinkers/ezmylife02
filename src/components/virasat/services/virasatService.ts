import { supabase } from "@/integrations/supabase/client";

export interface MediaSummary {
  question_index: number | null;
  type: "image" | "video" | "audio";
  caption?: string;
}

export interface Message {
  role: "user" | "model";
  text: string;
  audio_path?: string;
  media_ids?: string[];
}

export type BookStyle = "emotional" | "factual" | "legacy";

async function call<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("virasat-ai", {
    body: { action, ...payload },
  });
  if (error) throw error;
  return data as T;
}

export async function getNextQuestion(history: Message[]): Promise<string> {
  const data = await call<{ text: string }>("nextQuestion", { history });
  return data.text || "Papa, aap kuch aur batana chahenge?";
}

export async function refineResponse(text: string): Promise<string> {
  try {
    const data = await call<{ text: string }>("refine", { text });
    return data.text || text;
  } catch {
    return text;
  }
}

export async function generateBook(
  history: Message[],
  style: BookStyle,
  opts?: { childName?: string; fatherName?: string; media?: MediaSummary[] },
): Promise<string> {
  const data = await call<{ text: string }>("book", {
    history,
    style,
    childName: opts?.childName || "",
    fatherName: opts?.fatherName || "",
    media: opts?.media || [],
  });
  return data.text || "Error generating book.";
}

export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const data = await call<{ audio: string }>("tts", { text });
    return data.audio || null;
  } catch (e) {
    console.error("TTS failed:", e);
    return null;
  }
}

export async function translateToHindi(text: string): Promise<string> {
  try {
    const data = await call<{ text: string }>("translate", { text });
    return data.text || text;
  } catch (e) {
    console.error("Translate failed:", e);
    return text;
  }
}
