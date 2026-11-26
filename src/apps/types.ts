import type { ComponentType, LazyExoticComponent, ReactNode } from "react";

/** Keys of the shared business profile used to prefill forms across apps. */
export type ProfileKey =
  | "businessName"
  | "ownerName"
  | "industry"
  | "city"
  | "state"
  | "phone"
  | "email"
  | "address"
  | "gstin"
  | "website"
  | "products"
  | "audience"
  | "tone"
  | "language";

export type FieldType = "text" | "textarea" | "number" | "money" | "date" | "select" | "chips" | "rows";

export interface RowColumn {
  key: string;
  label: string;
  type?: "text" | "number" | "money" | "date" | "select";
  options?: string[];
  placeholder?: string;
}

export interface Field {
  /** Sent to the AI as the label for this value. */
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  /** Prefill from the shared business profile. */
  profile?: ProfileKey;
  /** Takes half the width on wide screens. */
  half?: boolean;
  help?: string;
  default?: string;
  rows?: number;
  /** For type "rows": the columns of the small table. */
  columns?: RowColumn[];
  /** For type "rows": rows shown when the form opens. */
  defaultRows?: Record<string, string>[];
  /** Fills from text sent by another app ("Use in…"). */
  acceptsHandoff?: boolean;
  /** Prefill from the shared workspace context (client, last invoice…). */
  ctxKey?: CtxKey;
  /** Longest text/textarea value accepted (enforced on typing, with a counter near the limit). */
  maxLength?: number;
}

export type CtxKey = "clientName" | "clientGstin" | "clientAddress" | "service" | "fee" | "invoiceNumber" | "invoiceTotal";

export type FormValues = Record<string, string | Record<string, string>[]>;

interface BaseDef {
  /** One line under the title. */
  intro: string;
  /** 2–4 short "how it works" steps. */
  steps?: string[];
  /** Other apps that pair well with this one (tool ids). */
  related?: string[];
  /** Price before the first run creates the server price row (must match the server spec). */
  credits: number;
}

export interface DocAppDef extends BaseDef {
  engine: "doc";
  fields: Field[];
  cta: string;
  /** Extra values worked out in the browser and sent with the form (e.g. discount maths). */
  compute?: (v: FormValues) => Record<string, string>;
  /** Live panel shown under the form (calculators, previews). */
  preview?: (v: FormValues) => ReactNode;
  refineChips?: string[];
  /** Example values to show what a good input looks like, item tables included. */
  sample?: FormValues;
  /** Name of the document for downloads, e.g. "safety-protocol". */
  fileName: string;
}

export type ColumnType = "text" | "number" | "money" | "date" | "time" | "select" | "rating" | "check";

export interface TrackerColumn {
  key: string;
  label: string;
  type: ColumnType;
  options?: string[];
  required?: boolean;
  /** Read-only value worked out from the row. */
  computed?: (row: TrackerRow) => number | string;
  /** Hide on small screens. */
  minor?: boolean;
}

export type TrackerRow = Record<string, string> & { id: string };

export interface TrackerDef extends BaseDef {
  engine: "tracker";
  itemName: string;
  columns: TrackerColumn[];
  summary?: (rows: TrackerRow[]) => { label: string; value: string; tone?: "good" | "warn" | "bad" }[];
  rowTone?: (row: TrackerRow) => "warn" | "bad" | undefined;
  aiLabel: string;
  /** Extra settings sent with the AI request (e.g. shift timings). */
  settings?: Field[];
  sample: Omit<TrackerRow, "id">[];
  fileName: string;
}

export interface ChatAppDef extends BaseDef {
  engine: "chat";
  welcome: string;
  suggestions: string[];
  /** Let people add PDFs / text files as context. */
  documents?: boolean;
  documentHint?: string;
}

export interface VisionAppDef extends BaseDef {
  engine: "vision";
  cta: string;
  mode: "text" | "fields";
  instructionsLabel?: string;
  fileName: string;
  /** Most pictures or pages per run, when the app sets its own limit (developer AI apps). */
  maxImages?: number;
}

export interface ImageAppDef extends BaseDef {
  engine: "image";
  promptLabel: string;
  promptPlaceholder: string;
  styles: string[];
  aspects: string[];
  /** Adds a fixed instruction in front of the prompt (e.g. "3D render"). */
  promptPrefix?: string;
  allowReference?: boolean;
  ideas: string[];
}

export interface CustomAppDef extends BaseDef {
  engine: "custom";
  component: LazyExoticComponent<ComponentType<{ toolId: string }>>;
}

/** An official page a fact came from (exam rules, tax rates, legal limits). Shown on the app. */
export interface Source {
  label: string;
  url: string;
  /** When the page was read, e.g. "12 Oct 2026". */
  checked: string;
}

export interface CalcResult {
  label: string;
  value: string;
  /** The headline figure, shown large. */
  main?: boolean;
  tone?: "good" | "warn" | "bad";
}

export interface CalcOutput {
  results: CalcResult[];
  /** Two-part split shown as a bar, e.g. amount invested vs interest earned. */
  split?: { label: string; value: number }[];
  /** Year-by-year (or similar) breakdown. */
  table?: { columns: string[]; rows: string[][] };
  /** One plain line under the result. */
  note?: string;
}

export interface CalcDef extends BaseDef {
  engine: "calc";
  /** Inputs, using the same field types as document apps (number, money, date, select). */
  fields: Field[];
  /** The formula. Runs in the browser on every change; return { error } when an input is unusable. */
  calc: (v: Record<string, string>) => CalcOutput | { error: string };
  sample: Record<string, string>;
  sources?: Source[];
  fileName: string;
}

/** Converters live in src/apps/lib/convert.ts; the def names one by key. */
export type ConverterId =
  | "images-to-pdf"
  | "pdf-to-jpg"
  | "merge-pdf"
  | "split-pdf"
  | "rotate-pdf"
  | "pdf-to-text"
  | "heic-to-jpg"
  | "image-to-jpg"
  | "image-to-webp"
  | "image-to-png";

export interface ConvertDef extends BaseDef {
  engine: "convert";
  converter: ConverterId;
  /** The file picker's accept attribute. */
  accept: string;
  /** Plain words for what to add, e.g. "PDF files". */
  acceptLabel: string;
  multiple: boolean;
  /** Settings shown next to the files (select fields only). */
  options?: Field[];
  cta: string;
  /** What comes out, e.g. "one PDF". */
  outputLabel: string;
  fileName: string;
}

/** One file an exam or ID form asks for (photo, signature, thumb impression…). */
export interface PresetItem {
  key: string;
  label: string;
  /** Exact size in pixels, when the rules give one. */
  width?: number;
  height?: number;
  /** Pixel limits, when the rules give a range instead (any can be left out). */
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  /** Allowed shape (width ÷ height), when the rules give one. */
  aspectRule?: [number, number];
  /** Shape to crop to when there is no exact size (must sit inside aspectRule). */
  aspect?: number;
  /** Our output size when the rules set no pixel size at all. Shown as our choice, not a rule. */
  outW?: number;
  outH?: number;
  /** File-size limits in KB, as far as the rules give them. */
  minKB?: number;
  maxKB?: number;
  /** "photo" crops a face; "ink" cleans paper to white and trims the margins. */
  mode: "photo" | "ink";
  /** Background the rules ask for, in plain words. */
  background?: string;
  /** Short rules people get wrong, from the official page. */
  rules: string[];
  /** Text the applicant must write by hand (e.g. a declaration), shown to copy. */
  handwrite?: string;
}

export interface PresetDef extends BaseDef {
  engine: "preset";
  /** Name of the exam or form, e.g. "IBPS PO". */
  exam: string;
  items: PresetItem[];
  sources: Source[];
  /** One plain line on anything the official page leaves to the applicant. */
  note?: string;
}

export type { AppDef } from "./appDefs";
