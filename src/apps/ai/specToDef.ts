import type { AppDef, ChatAppDef, DocAppDef, Field, FormValues, VisionAppDef } from "../types";

/*
 * The screen of a developer AI app. The developer (or their Claude) sends a definition, not code; this turns it
 * into the same definition the built-in apps use (src/apps/types.ts), so the real shared screens run it.
 * The AI instructions are not part of this: they stay on the server (supabase/functions/dev-app-run).
 */

export interface AiSpec {
  engine: "doc" | "chat" | "vision";
  intro: string;
  steps?: string[];
  cta?: string;
  fileName?: string;
  fields?: Field[];
  sample?: FormValues;
  refineChips?: string[];
  welcome?: string;
  suggestions?: string[];
  documents?: boolean;
  documentHint?: string;
  instructionsLabel?: string;
  ai?: { model?: string; maxImages?: number; maxTokens?: number };
}

/** Price shown before the first run creates the price row. Real prices are set by the team at approval. */
const PLACEHOLDER_CREDITS = 2;

export function specToDef(spec: AiSpec | null | undefined): AppDef | null {
  if (!spec) return null;
  const base = { intro: spec.intro, steps: spec.steps?.length ? spec.steps : undefined, credits: PLACEHOLDER_CREDITS };
  if (spec.engine === "doc") {
    const def: DocAppDef = {
      ...base,
      engine: "doc",
      fields: spec.fields ?? [],
      cta: spec.cta || "Create",
      refineChips: spec.refineChips?.length ? spec.refineChips : undefined,
      sample: spec.sample && Object.keys(spec.sample).length ? spec.sample : undefined,
      fileName: spec.fileName || "result",
    };
    return def;
  }
  if (spec.engine === "chat") {
    const def: ChatAppDef = {
      ...base,
      engine: "chat",
      welcome: spec.welcome || "Ask me anything about this topic.",
      suggestions: spec.suggestions ?? [],
      documents: spec.documents,
      documentHint: spec.documentHint,
    };
    return def;
  }
  if (spec.engine === "vision") {
    const def: VisionAppDef = {
      ...base,
      engine: "vision",
      cta: spec.cta || "Read it",
      mode: "text",
      instructionsLabel: spec.instructionsLabel,
      fileName: spec.fileName || "result",
      maxImages: spec.ai?.maxImages,
    };
    return def;
  }
  return null;
}
