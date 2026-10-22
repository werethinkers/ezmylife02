import JSZip from "jszip";
import { bundleProject, type BundleResult } from "./devBundle";

/*
 * A built app as a .zip, packed in the developer's browser.
 *
 * Claude's cloud workspace cannot always reach EzYourLife's database, so when it has built the app (for Vite, React, Vue
 * or Svelte that is the dist/ folder after npm run build) it sends the person a zip. They drop it on the app's page in
 * /developer, and this turns it into the one document the store's sandbox runs, with exactly the rules the connector
 * uses (./devBundle.ts). Nothing here needs a terminal.
 */

const SKIP = /(^|\/)(\.git|node_modules|__MACOSX|\.DS_Store|Thumbs\.db)(\/|$)|\.map$/i;
export const MAX_ZIP_FILES = 600;
export const MAX_ZIP_BYTES = 30_000_000;

/** A problem the person can fix; the message says how. */
export class ZipProblem extends Error {}

export interface PackedZip {
  html: string;
  result: BundleResult;
  /** The folder inside the zip that held index.html ("" for the top). */
  root: string;
  fileCount: number;
}

/** Folders a build usually goes to; an index.html in one of them beats a source index.html next to package.json. */
const BUILD_DIR = /(^|\/)(dist|build|out|public_html|www)\/$/i;

export async function packZip(file: Blob): Promise<PackedZip> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new ZipProblem("That file is not a readable .zip. Zip the built app folder (the one with index.html) and try again.");
  }
  const entries = Object.values(zip.files).filter((f) => !f.dir && !SKIP.test(f.name));
  if (!entries.length) throw new ZipProblem("The zip has no files in it.");
  if (entries.length > MAX_ZIP_FILES) {
    throw new ZipProblem(`The zip has ${entries.length} files; the limit is ${MAX_ZIP_FILES}. Zip only the built app folder (without node_modules or source maps).`);
  }

  const indexes = entries.map((e) => e.name).filter((n) => /(^|\/)index\.html$/i.test(n));
  if (!indexes.length) {
    const source = entries.some((e) => /(^|\/)package\.json$/i.test(e.name));
    throw new ZipProblem(
      source
        ? "This zip is the app's source code (it has package.json but no index.html). Build it first (npm run build) and zip the dist folder, or ask Claude to do it."
        : "There is no index.html in this zip. Zip the built app folder so index.html is inside.",
    );
  }
  const rank = (n: string) => {
    const dir = n.slice(0, n.length - "index.html".length);
    return (BUILD_DIR.test(dir) ? 0 : 100) + dir.split("/").length;
  };
  const entry = [...indexes].sort((a, b) => rank(a) - rank(b) || a.length - b.length)[0];
  const root = entry.slice(0, entry.length - "index.html".length);

  const inside = entries.filter((e) => e.name.startsWith(root));
  const files: Record<string, Uint8Array> = {};
  let total = 0;
  for (const e of inside) {
    const bytes = await e.async("uint8array");
    total += bytes.length;
    if (total > MAX_ZIP_BYTES) throw new ZipProblem(`The app is over ${MAX_ZIP_BYTES / 1e6} MB before packing. Leave out files the app does not use.`);
    files[e.name.slice(root.length)] = bytes;
  }

  const html = new TextDecoder().decode(files["index.html"] ?? new Uint8Array());
  if (/<script[^>]+src=["']\/?src\/[^"']+\.(tsx?|jsx)["']/i.test(html)) {
    throw new ZipProblem("This index.html is the source page (it loads /src/main.tsx). Build the app first (npm run build) and zip the dist folder, or ask Claude to do it.");
  }

  const result = bundleProject(files);
  return { html: result.html, result, root, fileCount: inside.length };
}

/** One sentence for the person: what went in, and what to know about it. */
export function packSummary(p: PackedZip): string {
  const lines = [`Packed ${p.result.used.length} of ${p.fileCount} files into ${Math.ceil(new Blob([p.html]).size / 1024)} KB.`];
  if (p.result.missing.length) lines.push(`Files the app asks for but the zip does not have: ${p.result.missing.slice(0, 5).join(", ")}${p.result.missing.length > 5 ? "…" : ""}.`);
  return lines.join(" ");
}
