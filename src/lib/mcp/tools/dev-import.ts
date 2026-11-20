import { defineTool } from "../sdk";
import { z } from "zod";
import { MAX_APP_BYTES, PART_UNITS, looksLikeHtml, splitParts, utf8Bytes } from "../../devUploadParts";
import { bundleProject, type BundleResult } from "../../devBundle";
import { serverEnv, supabaseKey, supabaseUrl } from "../env";
import { dbMessage, devClient, fail, notSignedIn, text } from "./dev-shared";

/*
 * File apps arrive as a whole built project (a folder with index.html and its scripts, styles,
 * images and data), never as a hand-made single HTML file. Claude's cloud workspaces can reach
 * GitHub but not EzYourLife's database, and a big project cannot travel inside a tool call. So:
 *  - dev_import_project: Claude pushes the build folder (for example dist/) to GitHub; this server
 *    reads every file in it, packs them with bundleProject (src/lib/devBundle.ts) into the one
 *    document the store's sandbox runs, and stores that in parts. Works from every Claude.
 *  - dev_get_upload_link: a one-time key and a script that packs a local build folder with the same
 *    bundleProject and sends it; for Claude Code on a computer, and private projects.
 * Either way it lands in the developer's editable version and must pass the checks and an admin's
 * approval before anyone else can use it.
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


/** Optional read-only token for private repos, set as the EZYL_GITHUB_TOKEN secret on the server. */
const githubToken = () => serverEnv("EZYL_GITHUB_TOKEN");

const MAX_PROJECT_FILES = 600;
const MAX_PROJECT_BYTES = 30_000_000;
const SKIP = /(^|\/)(\.git|node_modules|\.DS_Store|Thumbs\.db)(\/|$)|\.map$/i;

/** Reads a response body as bytes, up to maxBytes. */
async function readBytes(res: Response, maxBytes: number, what: string): Promise<Uint8Array> {
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length > maxBytes) throw new Error(`${what} is ${(bytes.length / 1e6).toFixed(1)} MB, over the limit.`);
  return bytes;
}

/** Every file of one folder in a GitHub repo at a branch, tag or commit, keyed by its path inside that folder. */
export async function fetchProjectFromGithub(repo: string, dir: string, ref: string, fetchImpl: typeof fetch = fetch) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('Give the repo as "owner/name".');
  const folder = dir.trim().replace(/^\/+|\/+$/g, "");
  if (folder.split("/").some((p) => p === "..")) throw new Error("Give the build folder's path inside the repo, like dist.");
  const token = githubToken();
  const headers: Record<string, string> = { "User-Agent": "ezyourlife-developer-connector", "X-GitHub-Api-Version": "2022-11-28" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const base = `https://api.github.com/repos/${repo}`;

  const c = await fetchImpl(`${base}/commits/${encodeURIComponent(ref)}`, { headers: { ...headers, Accept: "application/vnd.github.sha" } });
  if (c.status === 404 || c.status === 403 || c.status === 401 || c.status === 422) {
    throw new Error(
      token
        ? `GitHub could not find ${repo} at ${ref}, or EzYourLife's read token has no access to that repo.`
        : `GitHub could not find ${repo} at ${ref}. If the repo is private, use dev_get_upload_link from Claude Code, or ask the EzYourLife team for read access.`,
    );
  }
  if (!c.ok) throw new Error(`GitHub answered ${c.status} for ${repo}.`);
  const commit = (await c.text()).trim().slice(0, 40);

  const t = await fetchImpl(`${base}/git/trees/${commit}?recursive=1`, { headers: { ...headers, Accept: "application/vnd.github+json" } });
  if (!t.ok) throw new Error(`GitHub answered ${t.status} listing the files of ${repo}.`);
  const tree = (await t.json()) as { truncated?: boolean; tree: { path: string; type: string; sha: string; size?: number }[] };
  if (tree.truncated) throw new Error("The repo has too many files for GitHub to list at once. Put the build folder in a smaller repo.");
  const prefix = folder ? `${folder}/` : "";
  const blobs = tree.tree.filter((e) => e.type === "blob" && e.path.startsWith(prefix) && !SKIP.test(e.path.slice(prefix.length)));
  if (!blobs.length) throw new Error(`There are no files in ${folder || "the repo root"} at ${commit.slice(0, 7)}. Build the app and push the build folder first.`);
  if (!blobs.some((e) => e.path === `${prefix}index.html`)) {
    const near = tree.tree.filter((e) => e.type === "blob" && /(^|\/)index\.html$/.test(e.path)).map((e) => e.path.replace(/\/?index\.html$/, "") || "(root)");
    throw new Error(`There is no index.html in ${folder || "the repo root"}.${near.length ? ` Folders with one: ${near.slice(0, 5).join(", ")}.` : ""} Give the folder of the built app (usually dist).`);
  }
  if (blobs.length > MAX_PROJECT_FILES) throw new Error(`The folder has ${blobs.length} files; the limit is ${MAX_PROJECT_FILES}. Leave out source maps and files the app does not use.`);
  const total = blobs.reduce((n, e) => n + (e.size ?? 0), 0);
  if (total > MAX_PROJECT_BYTES) throw new Error(`The folder is ${(total / 1e6).toFixed(1)} MB; the limit is 30 MB before packing (10 MB after).`);

  const files: Record<string, Uint8Array> = {};
  const queue = [...blobs];
  const worker = async () => {
    for (let e = queue.shift(); e; e = queue.shift()) {
      const url = token
        ? `${base}/git/blobs/${e.sha}`
        : `https://raw.githubusercontent.com/${repo}/${commit}/${e.path.split("/").map(encodeURIComponent).join("/")}`;
      const res = await fetchImpl(url, { headers: token ? { ...headers, Accept: "application/vnd.github.raw+json" } : { "User-Agent": headers["User-Agent"] } });
      if (!res.ok) throw new Error(`GitHub answered ${res.status} for ${e.path}.`);
      files[e.path.slice(prefix.length)] = await readBytes(res, MAX_PROJECT_BYTES, e.path);
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  return { files, commit };
}

/** What the developer's Claude needs to hear about a packed project. */
export function bundleSummary(r: BundleResult, bytes: number) {
  const lines = [`Packed ${r.used.length} files${r.modules ? ` (${r.modules} JavaScript modules)` : ""} into ${Math.ceil(bytes / 1024)} KB.`];
  if (r.missing.length) lines.push(`Not in the folder, so they will not load: ${r.missing.slice(0, 10).join(", ")}${r.missing.length > 10 ? ` and ${r.missing.length - 10} more` : ""}.`);
  if (r.unused.length) lines.push(`Left out because nothing uses them: ${r.unused.slice(0, 10).join(", ")}${r.unused.length > 10 ? ` and ${r.unused.length - 10} more` : ""}.`);
  for (const n of r.notes) lines.push(n);
  return lines.join("\n");
}

export const devImportProject = defineTool({
  name: "dev_import_project",
  title: "Import a built app project from GitHub",
  description:
    "FILE APPS: imports the developer's whole built app, every file in its build folder (index.html with its JavaScript, CSS, images, fonts and data files; for Vite, React, Vue or Svelte this is dist/ after npm run build). Push that folder to a GitHub repo, then call this with the repo, the folder and the commit. The EzYourLife server reads every file, packs them into the form the store's sandbox runs (code-split pages, styles, pictures and data files keep working), stores it in the app's editable version and records the repo and commit. Then call dev_run_checks.",
  inputSchema: {
    app_id: z.string().uuid(),
    github: z.object({
      repo: z.string().describe('"owner/name", e.g. "werethinkers/meeting-notes".'),
      dir: z.string().max(300).optional().describe('The build folder inside the repo, e.g. "dist". Leave out if index.html is at the repo root.'),
      ref: z.string().optional().describe("Branch, tag or commit. Default main. A commit SHA pins exactly what you tested."),
    }),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  handler: async ({ app_id, github }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    try {
      const repo = github.repo.trim();
      const dir = (github.dir ?? "").trim().replace(/^\/+|\/+$/g, "");
      const ref = (github.ref || "main").trim();
      const got = await fetchProjectFromGithub(repo, dir, ref);
      const packed = bundleProject(got.files);
      if (!looksLikeHtml(packed.html)) return fail("The folder's index.html is not an HTML page.");
      const bytes = utf8Bytes(packed.html);
      if (bytes > MAX_APP_BYTES) {
        return fail(`Packed, the app is ${(bytes / 1e6).toFixed(1)} MB; the limit is 10 MB. Shrink big pictures, videos and fonts, or leave out what the app does not need.`);
      }
      const source = { kind: "github-project", repo, path: dir || "/", ref, commit: got.commit, via: "connector" };
      const saved = await uploadText(devClient(ctx), app_id, packed.html, source);
      return text(
        `Imported ${repo}/${dir || ""} @ ${got.commit.slice(0, 7)} into version ${saved.version_no}.\n${bundleSummary(packed, bytes)}\nNext: dev_run_checks, then dev_get_preview_link.`,
        { ...saved, source, files: packed.used.length, modules: packed.modules, missing: packed.missing, unused: packed.unused, notes: packed.notes },
      );
    } catch (e) {
      return fail(dbMessage(e instanceof Error ? e.message : String(e)));
    }
  },
});

/** The upload script: packs a local build folder with the same bundleProject the server uses, then sends it in parts. */
export const UPLOAD_SCRIPT = `// ezyourlife-upload.mjs: packs a built app folder (index.html and its files) and sends it to EzYourLife with a one-time upload key.
// Usage: node ezyourlife-upload.mjs <build-folder> <key> <supabase-url> <publishable-key>   (Node 18.17+)
import { readFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
const [dir, key, url, anon] = process.argv.slice(2);
if (!dir || !key || !url || !anon) { console.error("Usage: node ezyourlife-upload.mjs <build-folder> <key> <supabase-url> <publishable-key>"); process.exit(1); }
const bundleProject = (${bundleProject.toString()});
const SKIP = ${SKIP.toString()};
const files = {};
let total = 0;
for (const e of await readdir(dir, { recursive: true, withFileTypes: true })) {
  if (!e.isFile()) continue;
  const full = join(e.parentPath ?? e.path, e.name);
  const rel = relative(dir, full).split(sep).join("/");
  if (SKIP.test(rel)) continue;
  files[rel] = new Uint8Array(await readFile(full));
  total += files[rel].length;
  if (Object.keys(files).length > ${MAX_PROJECT_FILES} || total > ${MAX_PROJECT_BYTES}) { console.error("The folder is too big: at most ${MAX_PROJECT_FILES} files and 30 MB. Point at the build folder (for example dist), not the project."); process.exit(1); }
}
let packed;
try { packed = bundleProject(files); } catch (err) { console.error(err.message); process.exit(1); }
const text = packed.html;
const bytes = Buffer.byteLength(text, "utf8");
if (bytes > ${MAX_APP_BYTES}) { console.error("Packed, the app is " + (bytes / 1e6).toFixed(1) + " MB; the limit is 10 MB."); process.exit(1); }
const parts = [];
for (let i = 0; i < text.length; ) {
  let end = Math.min(i + ${PART_UNITS}, text.length);
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
console.log("Packed " + packed.used.length + " files (" + Math.round(bytes / 1024) + " KB) as version " + done.version_no + ".");
if (packed.missing.length) console.log("Not in the folder, so they will not load: " + packed.missing.slice(0, 10).join(", "));
for (const n of packed.notes) console.log(n);
console.log("Next: run the checks (dev_run_checks).");
`;

export const devGetUploadLink = defineTool({
  name: "dev_get_upload_link",
  title: "One-time upload link for a local app project",
  description:
    "FILE APPS, for Claude Code or any computer that can reach ezyourlife's database (also the way for private projects): returns a one-time key (valid 1 hour, one upload) and a Node script that packs a local build folder (index.html and every file it uses, for example dist/ after npm run build) exactly as dev_import_project does and sends it to the app's editable version. From a cloud workspace that can only reach GitHub, use dev_import_project.",
  inputSchema: {
    app_id: z.string().uuid(),
    folder: z.string().max(300).optional().describe("The local build folder you will send, e.g. dist. For the record and the command."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ app_id, folder }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    try {
      const { data, error } = await devClient(ctx).rpc("dev_begin_upload", {
        _app_id: app_id,
        _source: { kind: "upload", via: "upload-link", file_name: folder ?? undefined },
        _with_key: true,
      });
      if (error) return fail(dbMessage(error.message));
      const url = supabaseUrl();
      const anon = supabaseKey();
      const command = `node ezyourlife-upload.mjs ${folder || "dist"} ${data.key} ${url} ${anon}`;
      return text(
        `One-time upload key, valid until ${data.expires_at} for one upload.\n\n1. Build the app (for example npm run build).\n2. Save this script as ezyourlife-upload.mjs:\n\n${UPLOAD_SCRIPT}\n3. Run:\n${command}\n\nThe publishable key in the command is public; the upload key is the secret part, so don't share it. Then call dev_run_checks.`,
        { key: data.key, expires_at: data.expires_at, supabase_url: url, publishable_key: anon, command, script: UPLOAD_SCRIPT },
      );
    } catch (e) {
      return fail(dbMessage(e instanceof Error ? e.message : String(e)));
    }
  },
});
