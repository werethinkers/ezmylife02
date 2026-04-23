import { supabase } from "@/integrations/supabase/client";

export type Role = "user" | "model";
export interface VirasatMessage {
  role: Role;
  text: string;
  createdAt?: string;
}

async function invoke<T>(action: string, body: Record<string, any> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("virasat-ai", {
    body: { action, ...body },
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export const virasatService = {
  nextQuestion: (history: VirasatMessage[]) =>
    invoke<{ text: string }>("next_question", { history }),
  refineResponse: (text: string) =>
    invoke<{ text: string }>("refine_response", { text }),
  tts: (text: string) => invoke<{ audio: string }>("tts", { text }),
  chapterOutline: (history: VirasatMessage[]) =>
    invoke<{ outline: { title: string; synopsis: string }[] }>("chapter_outline", { history }),
  generateBook: (history: VirasatMessage[], style: string) =>
    invoke<{ book: string }>("generate_book", { history, style }),
};
