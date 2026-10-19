import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { MAX_APP_BYTES, looksLikeHtml, splitParts, utf8Bytes } from "../../devUploadParts";
import { dbMessage, devClient, fail, notSignedIn, text } from "./dev-shared";

/*
 * Bigger app files. Claude's cloud workspaces can reach GitHub but not EzYourLife's database,
 * and a multi-megabyte file cannot travel inside a tool call. So:
 *  - dev_import_file: Claude pushes the built single-file app to GitHub (or any https link);
 *    this server fetches it and stores it in parts. Works from every Claude.
 *  - dev_get_upload_link: a one-time key and a small script; Claude Code on a computer (or any
 *    machine that can reach ezyourlife's database) sends the local file directly.
 * Either way the file lands in the developer's editable version and must pass the checks and
 * an admin's approval before anyone else can use it.
 */

type Sb = ReturnType<typeof devClient>;

/** Stores a whole file through an upload session, in parts. Returns the version it went into. */
export async function uploadText(sb: Sb, appId: string, html: string, source: Record<string, unknown>) {
  const bytes = utf8Bytes(html);
  if (bytes > MAX_APP_BYTES) throw new Error(`The file is ${Math.ceil(bytes / 1e5) / 10} MB, over the 10 MB limit.`);
  const parts = splitParts(html);
  const begin = await sb.rpc("dev_begin_upload", { _app_id: appId, _source: source, _with_key: false });
  if (begin.error) throw new Error(dbMessage(begin.error.message));
  const uploadId = begin.data.upload_id as string;
  for (let n = 0; n < parts.length; n++) {
    const r = await sb.rpc("dev_upload_part", { _upload_id: uploadId, _part_no: n + 1, _data: parts[n] });
    if (r.error) throw new Error(dbMessage(r.error.message));
  }
  const done = await sb.rpc("dev_finish_upload", { _upload_id: uploadId, _bytes: bytes, _parts: parts.length });
  if (done.error) throw new Error(dbMessage(done.error.message));
  return { ...(done.data as { version_id: string; version_no: number }), bytes, parts: parts.length };
}

const BLOCKED_HOST = /^(localhost|.*\.local|.*\.internal|.*\.localdomain|metadata\.google\.internal)$/i;

/** Only public https addresses: no IP literals, no local or internal names. */
export function checkPublicUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("That is not a valid link.");
  }
  if (u.protocol !== "https:") throw new Error("Only https links can be imported.");
  if (u.username || u.password) throw new Error("Links with a username or password are not accepted.");
  const host = u.hostname.toLowerCase();
  if (BLOCKED_HOST.test(host) || /^[\d.]+$/.test(host) || host.includes(":") || host.startsWith("[")) {
    throw new Error("Use a public web address, not an IP address or a local name.");
  }
  return u;
}

/** Reads a response body up to maxBytes, stopping early instead of loading something huge. */
export async function readLimited(res: Response, maxBytes = MAX_APP_BYTES): Promise<string> {
  const declared = Number(res.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new Error(`The file is ${(declared / 1e6).toFixed(1)} MB. The limit is 10 MB.`);
  if (!res.body) return await res.text();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("The file is larger than 10 MB. The limit is 10 MB.");
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.length;
  }
  return new TextDecoder("utf-8").decode(all);
}

/** Optional read-only token for private repos, set as the EZYL_GITHUB_TOKEN secret on the server. */
const githubToken = () => (typeof process !== "undefined" ? process.env.EZYL_GITHUB_TOKEN || "" : "");

/** Fetches one file from a GitHub repo at a branch, tag or commit, and the commit it resolved to. */
export async function fetchFromGithub(repo: string, path: string, ref: string, fetchImpl: typeof fetch = fetch) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('Give the repo as "owner/name".');
  const clean = path.replace(/^\/+/, "");
  if (!clean || clean.split("/").some((p) => p === ".." || p === "")) throw new Error("Give the file's path inside the repo, like dist/index.html.");
  const token = githubToken();
  const headers: Record<string, string> = { "User-Agent": "ezyourlife-developer-connector", "X-GitHub-Api-Version": "2022-11-28" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const base = `https://api.github.com/repos/${repo}`;
  const res = await fetchImpl(`${base}/contents/${clean.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`, {
    headers: { ...headers, Accept: "application/vnd.github.raw+json" },
  });
  if (res.status === 404 || res.status === 403 || res.status === 401) {
    throw new Error(
      token
        ? `GitHub could not find ${repo}/${clean} at ${ref}, or EzYourLife's read token has no access to that repo.`
        : `GitHub could not find ${repo}/${clean} at ${ref}. If the repo is private, EzYourLife needs a read token for it (ask the team), or make the file public.`,
    );
  }
  if (!res.ok) throw new Error(`GitHub answered ${res.status} for ${repo}/${clean}.`);
  const body = await readLimited(res);
  let commit: string | null = null;
  try {
    const c = await fetchImpl(`${base}/commits/${encodeURIComponent(ref)}`, { headers: { ...headers, Accept: "application/vnd.github.sha" } });
    if (c.ok) commit = (await c.text()).trim().slice(0, 40) || null;
  } catch {
    commit = null;
  }
  return { html: body, commit };
}

const UPLOAD_SCRIPT = `// ezyourlife-upload.mjs: sends one app file to EzYourLife with a one-time upload key.
// Usage: node ezyourlife-upload.mjs <file.html> <key> <supabase-url> <publishable-key>   (Node 18+)
import { readFile } from "node:fs/promises";
const [file, key, url, anon] = process.argv.slice(2);
if (!file || !key || !url || !anon) { console.error("Usage: node ezyourlife-upload.mjs <file.html> <key> <supabase-url> <publishable-key>"); process.exit(1); }
const text = await readFile(file, "utf8");
const bytes = Buffer.byteLength(text, "utf8");
if (bytes > 10000000) { console.error(file + " is " + (bytes / 1e6).toFixed(1) + " MB; the limit is 10 MB."); process.exit(1); }
const parts = [];
for (let i = 0; i < text.length; ) {
  let end = Math.min(i + 300000, text.length);
  const c = text.charCodeAt(end - 1);
  if (end < text.length && c >= 0xd800 && c <= 0xdbff) end -= 1;
  parts.push(text.slice(i, end)); i = end;
}
const call = async (fn, body) => {
  const r = await fetch(url + "/rest/v1/rpc/" + fn, { method: "POST", headers: { apikey: anon, Authorization: "Bearer " + anon, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error((j && j.message) || "HTTP " + r.status);
  return j;
};
for (let n = 0; n < parts.length; n++) { await call("dev_keyed_upload_part", { _key: key, _part_no: n + 1, _data: parts[n] }); console.log("part " + (n + 1) + "/" + parts.length); }
const done = await call("dev_keyed_upload_finish", { _key: key, _bytes: bytes, _parts: parts.length });
console.log("Uploaded " + Math.round(bytes / 1024) + " KB as version " + done.version_no + ". Next: run the checks (dev_run_checks).");
`;

export const devImportFile = defineTool({
  name: "dev_import_file",
  title: "Import a big app file from GitHub or a link",
  description:
    "For app files too big to pass inline (anything over about 200 KB, up to 10 MB). Push the built single-file app (for example dist/index.html) to a GitHub repo, then call this with the repo, path and branch or commit; or give a public https link to the file. The EzYourLife server fetches it, stores it in the app's editable version and records where it came from. Then call dev_run_checks.",
  inputSchema: {
    app_id: z.string().uuid(),
    github: z
      .object({
        repo: z.string().describe('"owner/name", e.g. "werethinkers/tip-splitter".'),
        path: z.string().describe("Path of the built HTML file in the repo, e.g. dist/index.html."),
        ref: z.string().optional().describe("Branch, tag or commit. Default main. A commit SHA pins exactly what you tested."),
      })
      .optional(),
    url: z.string().optional().describe("A public https link that returns the HTML file itself (not a web page about it)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  handler: async ({ app_id, github, url }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    if (!!github === !!url) return fail("Give either github {repo, path, ref} or url, not both.");
    try {
      let html: string;
      let source: Record<string, unknown>;
      if (github) {
        const ref = (github.ref || "main").trim();
        const got = await fetchFromGithub(github.repo.trim(), github.path.trim(), ref);
        html = got.html;
        source = { kind: "github", repo: github.repo.trim(), path: github.path.trim(), ref, commit: got.commit ?? undefined, via: "connector" };
      } else {
        const u = checkPublicUrl(url!.trim());
        const res = await fetch(u.toString(), { redirect: "follow", headers: { "User-Agent": "ezyourlife-developer-connector" } });
        if (!res.ok) return fail(`The link answered ${res.status}.`);
        if (res.url) checkPublicUrl(res.url);
        html = await readLimited(res);
        source = { kind: "url", url: u.toString(), via: "connector" };
      }
      if (!looksLikeHtml(html)) return fail("That file is not an HTML page. Import the built single-file app (HTML with its CSS and JavaScript inside).");
      const saved = await uploadText(devClient(ctx), app_id, html, source);
      const where = github ? `${github.repo}/${github.path}${source.commit ? ` @ ${String(source.commit).slice(0, 7)}` : ""}` : url;
      return text(
        `Imported ${Math.ceil(saved.bytes / 1024)} KB from ${where} into version ${saved.version_no} (${saved.parts} part${saved.parts === 1 ? "" : "s"}). Next: dev_run_checks, then dev_get_preview_link.`,
        { ...saved, source },
      );
    } catch (e) {
      return fail(dbMessage(e instanceof Error ? e.message : String(e)));
    }
  },
});

export const devGetUploadLink = defineTool({
  name: "dev_get_upload_link",
  title: "One-time upload link for a local app file",
  description:
    "For Claude Code or any computer that can reach ezyourlife's database: returns a one-time key (valid 1 hour, one file) and a small Node script that sends a local HTML file (up to 10 MB) to the app's editable version. Use dev_import_file instead from a cloud workspace that can only reach GitHub.",
  inputSchema: {
    app_id: z.string().uuid(),
    file_name: z.string().max(200).optional().describe("Name of the file you will send, for the record."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ app_id, file_name }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const { data, error } = await devClient(ctx).rpc("dev_begin_upload", {
      _app_id: app_id,
      _source: { kind: "upload", via: "upload-link", file_name: file_name ?? undefined },
      _with_key: true,
    });
    if (error) return fail(dbMessage(error.message));
    const url = process.env.SUPABASE_URL!;
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const command = `node ezyourlife-upload.mjs ${file_name || "dist/index.html"} ${data.key} ${url} ${anon}`;
    return text(
      `One-time upload key, valid until ${data.expires_at} for one file.\n\n1. Save this script as ezyourlife-upload.mjs:\n\n${UPLOAD_SCRIPT}\n2. Run:\n${command}\n\nThe publishable key in the command is public; the upload key is the secret part, so don't share it. Then call dev_run_checks.`,
      { key: data.key, expires_at: data.expires_at, supabase_url: url, publishable_key: anon, command, script: UPLOAD_SCRIPT },
    );
  },
});
