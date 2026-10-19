import { supabase } from "@/integrations/supabase/client";
import { MAX_APP_BYTES, PART_UNITS, splitParts, utf8Bytes } from "@/lib/devUploadParts";

/*
 * Developer apps: outside developers submit a single-file web app, test it in a sandboxed
 * preview, run the server checks and send it for review. An admin approves it with one click.
 * Database: supabase/migrations/20261020010000_developer_apps.sql (types not regenerated yet,
 * so these calls go through an untyped client, like the influencer admin page).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await db.rpc(name, args);
  if (error) throw new Error(cleanError(error.message));
  return data as T;
}

/** Postgres errors arrive with their raise text; keep just the sentence people can act on. */
export function cleanError(message: string): string {
  if (/function .* does not exist|could not find the function|schema cache/i.test(message)) {
    return "The developer database is not set up yet. Ask the EzYourLife team to apply the developer-apps update.";
  }
  return message.replace(/^ERROR:\s*/i, "");
}

export type VersionStatus = "draft" | "submitted" | "changes_requested" | "approved" | "rejected" | "superseded";
export type AppStatus = "draft" | "live" | "unlisted";
export type CheckStatus = "pass" | "warn" | "fail";

export interface QaCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface QaDuplicate {
  tool_id: string;
  name: string;
  source: "store" | "developer";
  score: number;
}

export interface QaReport {
  checks: QaCheck[];
  duplicates: QaDuplicate[];
  hosts: string[];
  bytes: number;
  passed: boolean;
  ran_at: string;
}

export interface DevApp {
  id: string;
  developer_id: string;
  tool_id: string;
  status: AppStatus;
  live_version_id: string | null;
  credits: number | null;
  share_pct: number | null;
  created_at: string;
  updated_at: string;
}

/** How a version's app file arrived (reported by the uploader; shown to admins). */
export interface FileSource {
  kind?: "inline" | "upload" | "github" | "url";
  via?: string;
  repo?: string;
  path?: string;
  ref?: string;
  commit?: string;
  url?: string;
  file_name?: string;
  bytes?: number;
  at?: string;
}

export interface DevVersion {
  id: string;
  app_id: string;
  version_no: number;
  status: VersionStatus;
  source: FileSource | null;
  name: string;
  short_description: string;
  description: string;
  category: string | null;
  tool_types: string[];
  support_email: string | null;
  release_notes: string | null;
  qa: QaReport | null;
  qa_passed: boolean;
  qa_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  name?: string;
  short_description?: string;
  description?: string;
  category?: string;
  tool_types?: string[];
  support_email?: string;
  release_notes?: string;
}

const VERSION_COLUMNS =
  "id, app_id, version_no, status, source, name, short_description, description, category, tool_types, support_email, release_notes, qa, qa_passed, qa_at, submitted_at, reviewed_at, review_notes, created_at, updated_at";

export const MAX_HTML_BYTES = MAX_APP_BYTES;

/** Plain words for each version state, for developers and admins alike. */
export const VERSION_TEXT: Record<VersionStatus, { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "bg-muted" },
  submitted: { label: "Waiting for review", tone: "bg-sun" },
  changes_requested: { label: "Changes asked", tone: "bg-coral" },
  approved: { label: "Live", tone: "bg-teal" },
  rejected: { label: "Not accepted", tone: "bg-coral" },
  superseded: { label: "Earlier version", tone: "bg-muted" },
};

export const CHECK_TEXT: Record<CheckStatus, { label: string; tone: string }> = {
  pass: { label: "OK", tone: "bg-teal" },
  warn: { label: "Look", tone: "bg-sun" },
  fail: { label: "Must fix", tone: "bg-coral" },
};

// ----- developer -----

export async function listMyApps(): Promise<{ app: DevApp; latest: DevVersion | null; live: DevVersion | null }[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data: apps, error } = await db.from("dev_apps").select("*").eq("developer_id", u.user.id).order("updated_at", { ascending: false });
  if (error) throw new Error(cleanError(error.message));
  if (!apps?.length) return [];
  const { data: versions, error: vErr } = await db
    .from("dev_app_versions")
    .select(VERSION_COLUMNS)
    .in("app_id", (apps as DevApp[]).map((a) => a.id))
    .order("version_no", { ascending: false });
  if (vErr) throw new Error(cleanError(vErr.message));
  return (apps as DevApp[]).map((app) => {
    const mine = (versions as DevVersion[]).filter((v) => v.app_id === app.id);
    return { app, latest: mine[0] ?? null, live: mine.find((v) => v.id === app.live_version_id) ?? null };
  });
}

export async function getApp(appId: string): Promise<{ app: DevApp; versions: DevVersion[] }> {
  const { data: app, error } = await db.from("dev_apps").select("*").eq("id", appId).maybeSingle();
  if (error) throw new Error(cleanError(error.message));
  if (!app) throw new Error("App not found.");
  const { data: versions, error: vErr } = await db
    .from("dev_app_versions")
    .select(VERSION_COLUMNS)
    .eq("app_id", appId)
    .order("version_no", { ascending: false });
  if (vErr) throw new Error(cleanError(vErr.message));
  return { app: app as DevApp, versions: (versions ?? []) as DevVersion[] };
}

/** The app file of one version. Readable by its developer and by admins only. */
export async function getVersionHtml(versionId: string): Promise<{ html: string; name: string; version_no: number; app_id: string; status: VersionStatus }> {
  const { data, error } = await db.from("dev_app_versions").select("html, name, version_no, app_id, status").eq("id", versionId).maybeSingle();
  if (error) throw new Error(cleanError(error.message));
  if (!data) throw new Error("Preview not found, or you are not signed in as its developer or an admin.");
  return data;
}

export const createApp = (slug: string, name: string) =>
  rpc<{ app_id: string; tool_id: string; version_id: string; version_no: number }>("dev_create_app", { _slug: slug, _name: name });

export const saveDraft = (appId: string, html: string | null, listing: Listing | null) =>
  rpc<{ version_id: string; version_no: number }>("dev_save_draft", { _app_id: appId, _html: html, _listing: listing });

/**
 * Sends an app file of any size up to 10 MB. Small pasted HTML is saved directly; files go
 * through an upload session in parts of under 1 MB, joined and size-checked on the server.
 */
export async function uploadHtml(
  appId: string,
  html: string,
  opts: { fileName?: string; onProgress?: (done: number, total: number) => void } = {},
): Promise<{ version_id: string; version_no: number }> {
  const bytes = utf8Bytes(html);
  if (bytes > MAX_APP_BYTES) throw new Error(`The file is ${Math.ceil(bytes / 1e5) / 10} MB, over the 10 MB limit.`);
  if (!opts.fileName && html.length <= PART_UNITS) return saveDraft(appId, html, null);
  const parts = splitParts(html);
  const begin = await rpc<{ upload_id: string }>("dev_begin_upload", {
    _app_id: appId,
    _source: { kind: opts.fileName ? "upload" : "inline", via: "web", file_name: opts.fileName },
    _with_key: false,
  });
  for (let n = 0; n < parts.length; n++) {
    opts.onProgress?.(n, parts.length);
    await rpc("dev_upload_part", { _upload_id: begin.upload_id, _part_no: n + 1, _data: parts[n] });
  }
  opts.onProgress?.(parts.length, parts.length);
  return rpc("dev_finish_upload", { _upload_id: begin.upload_id, _bytes: bytes, _parts: parts.length });
}

/** One line saying where a version's file came from. */
export function sourceText(s: FileSource | null | undefined): string {
  if (!s) return "";
  if (s.kind === "github") return `GitHub ${s.repo ?? ""}${s.path ? ` · ${s.path}` : ""}${s.commit ? ` @ ${s.commit.slice(0, 7)}` : s.ref ? ` @ ${s.ref}` : ""}`;
  if (s.kind === "url") return `Link ${s.url ?? ""}`;
  if (s.kind === "upload") return `Uploaded${s.file_name ? ` ${s.file_name}` : ""}${s.via === "upload-link" ? " (upload link)" : s.via === "web" ? " (web)" : ""}`;
  return s.via === "connector" ? "Sent by Claude" : "Pasted";
}

export const runChecks = (versionId: string) => rpc<QaReport>("dev_run_qa", { _version_id: versionId });

export const submitVersion = (versionId: string) => rpc<{ ok: boolean }>("dev_submit", { _version_id: versionId });

export const withdrawVersion = (versionId: string) => rpc<{ ok: boolean }>("dev_withdraw", { _version_id: versionId });

// ----- store categories (for the listing form) -----

export async function listCategories(): Promise<string[]> {
  const { data } = await db.from("catalog_categories").select("name").order("name");
  return ((data ?? []) as { name: string }[]).map((c) => c.name);
}

// ----- admin -----

export interface QueueItem {
  version_id: string;
  version_no: number;
  name: string;
  short_description: string;
  description: string;
  category: string | null;
  tool_types: string[];
  support_email: string | null;
  release_notes: string | null;
  source: FileSource | null;
  qa: QaReport | null;
  qa_passed: boolean;
  qa_at: string | null;
  submitted_at: string;
  bytes: number;
  html_sha256: string | null;
  app_id: string;
  tool_id: string;
  app_status: AppStatus;
  credits: number | null;
  share_pct: number | null;
  live_version_no: number | null;
  developer_email: string | null;
}

export interface AdminAppRow {
  app_id: string;
  tool_id: string;
  status: AppStatus;
  credits: number | null;
  share_pct: number | null;
  updated_at: string;
  live_version_no: number | null;
  latest_version_no: number | null;
  latest_status: VersionStatus | null;
  name: string | null;
  developer_email: string | null;
}

export const adminQueue = () => rpc<QueueItem[]>("admin_dev_queue");
export const adminApps = () => rpc<AdminAppRow[]>("admin_dev_apps");
export const adminApprove = (versionId: string, credits: number, sharePct: number) =>
  rpc<{ ok: boolean; tool_id: string; path: string; version_no: number }>("admin_dev_approve", {
    _version_id: versionId,
    _credits: credits,
    _share_pct: sharePct,
  });
export const adminRequestChanges = (versionId: string, notes: string, reject = false) =>
  rpc<{ ok: boolean }>("admin_dev_request_changes", { _version_id: versionId, _notes: notes, _reject: reject });
export const adminSetListed = (appId: string, listed: boolean) =>
  rpc<{ ok: boolean; status: AppStatus }>("admin_dev_set_listed", { _app_id: appId, _listed: listed });

export async function isAdmin(): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  return data === true;
}

// ----- published apps -----

export async function getHostedApp(toolId: string): Promise<{ tool_id: string; name: string; html: string; version_no: number } | null> {
  const { data, error } = await db.rpc("get_hosted_app", { _tool_id: toolId });
  if (error) return null;
  return data ?? null;
}

/** Developer apps have catalogue ids that start with "dev-". */
export const isDeveloperApp = (toolId: string | undefined) => !!toolId && toolId.startsWith("dev-");

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

export const kb = (bytes: number) => `${Math.max(1, Math.ceil(bytes / 1024))} KB`;

export const when = (s: string | null) =>
  s ? new Date(s).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";
