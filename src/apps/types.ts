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

export type AppDef = DocAppDef | TrackerDef | ChatAppDef | VisionAppDef | ImageAppDef | CustomAppDef;
