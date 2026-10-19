// ezyourlife-upload.mjs: sends one app file to EzYourLife with a one-time upload key.
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
