import type { Field, FormValues } from "../types";

/*
 * Definitions of the flagship apps: the deeper, multi-step apps on six shared shells.
 * The per-app files (src/apps/defs/flagship-<category>.ts) are written by
 * scripts/flagship/generate.mjs from scripts/flagship/data/<category>.mjs — edit the data, not the output.
 * The server half (instructions, prices, picture prompts) is in supabase/functions/_shared/appSpecs/flagship-*.ts.
 */

interface FlagshipBase {
  /** One line under the title. */
  intro: string;
  /** 3 short "how it works" steps. */
  steps: string[];
  related: string[];
  /** Price of the paid step (must match the server spec). */
  credits: number;
  /** Every input field (all pages, for plan and pack apps). */
  fields: Field[];
  /** Example values for "Fill in an example". */
  sample: FormValues;
  /** What the finished result contains, shown before and while it is made. */
  youGet: string[];
  fileName: string;
  refineChips?: string[];
  /** Optional AI pictures made from the result (30 credits each). */
  pictures?: { label: string; ideas: string[] };
  /** One line shown above the result (e.g. "for reference, not legal advice"). */
  note?: string;
}

/** A guided interview (typed or spoken) that becomes a finished book or document (like Virasat). */
export interface InterviewDef extends FlagshipBase {
  engine: "interview";
  /** Answers needed before the result can be made. */
  minAnswers: number;
  /** Most answers the interview takes (the server caps it too). */
  maxAnswers: number;
  /** Offer speaking answers (browser speech-to-text, no AI cost). */
  voice: boolean;
  cta: string;
}

/** Upload documents, photos, a recording or pasted text, and get a deep report (like Startup Analyser). */
export interface AnalyseDef extends FlagshipBase {
  engine: "analyse";
  upload: {
    kinds: ("pdf" | "photo" | "audio" | "text")[];
    label: string;
    hint: string;
    /** The app cannot run without at least one file or pasted text. */
    required: boolean;
  };
  cta: string;
}

/** One photo in, several finished pictures out, charged per picture (like ProductVision 360). */
export interface StudioDef extends FlagshipBase {
  engine: "studio";
  variants: { key: string; label: string; hint: string }[];
  photo: { label: string; hint: string; required: boolean };
}

/** A few short pages of questions that become a full plan (plan) or a bundle of outputs (pack). */
export interface PlanDef extends FlagshipBase {
  engine: "plan" | "pack";
  pages: { title: string; keys: string[] }[];
  cta: string;
}

/** A paid coaching session: guided chat (typed or spoken) that ends with a scored summary. */
export interface CoachDef extends FlagshipBase {
  engine: "coach";
  suggestions: string[];
  voice: boolean;
  /** Turns in one session (the server caps it too). */
  turns: number;
  cta: string;
}

export type FlagshipDef = InterviewDef | AnalyseDef | StudioDef | PlanDef | CoachDef;
