import type { WorkspaceProfile } from "../lib/workspace";

export interface BulkColumn {
  key: string;
  label: string;
  example?: string;
  required?: boolean;
}

/** One finished item: an optional file for the ZIP and an optional row for results.csv. */
export interface BulkResult {
  name: string;
  text?: string;
  blob?: Blob;
  ext?: string;
  csvRow?: Record<string, string | number>;
}

export interface BulkEnv {
  toolId: string;
  profile: WorkspaceProfile;
}

interface Base {
  /** One line shown above the runner. */
  note?: string;
  /** Most items per batch. */
  max?: number;
  /** The work happens in the browser: charge the app's price per item with tool-charge. */
  chargeLocal?: boolean;
  /** Credits per item when it differs from the app price (e.g. per angle × angles). */
  unitsPerItem?: number;
}

export interface RowsBulk extends Base {
  mode: "rows";
  columns: BulkColumn[];
  run: (row: Record<string, string>, env: BulkEnv) => Promise<BulkResult>;
}

export interface FilesBulk extends Base {
  mode: "files";
  accept: string;
  run: (file: File, env: BulkEnv) => Promise<BulkResult>;
}

/** Image tools that already have a dedicated upload-many-files flow (BulkDropzone). */
export interface DropzoneBulk {
  mode: "dropzone";
  configId: string;
}

export type BulkSpec = RowsBulk | FilesBulk | DropzoneBulk;
