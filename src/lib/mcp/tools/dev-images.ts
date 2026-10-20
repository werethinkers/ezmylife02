import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { checkPublicUrl } from "./dev-import";
import { dbMessage, devClient, fail, latestVersion, notSignedIn, text } from "./dev-shared";

/*
 * Screenshots for an app's promo page. A picture comes from a public https link, a public GitHub file or
 * base64 (under 400 KB). The server checks the bytes really are a png, jpeg or webp (dev_add_image),
 * keeps at most 6 per version and clears the earlier check results, like any other change.
 */

const MAX_IMAGE_BYTES = 400 * 1024;
const MIMES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };

const toBase64 = (bytes: Uint8Array) => {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};

/** Fetches a public https picture, following at most 3 redirects and re-checking every address. */
async function fetchPicture(raw: string): Promise<{ mime: string; base64: string }> {
  let u = checkPublicUrl(raw);
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(u.toString(), { redirect: "manual", headers: { "User-Agent": "ezyourlife-developer-connector" } });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      u = checkPublicUrl(new URL(res.headers.get("location")!, u).toString());
      continue;
    }
    if (!res.ok) throw new Error(`The picture link answered ${res.status}.`);
    const declared = Number(res.headers.get("content-length") || 0);
    if (declared > MAX_IMAGE_BYTES) throw new Error(`The picture is ${Math.ceil(declared / 1024)} KB. The limit is 400 KB; shrink it first.`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > MAX_IMAGE_BYTES) throw new Error(`The picture is ${Math.ceil(bytes.length / 1024)} KB. The limit is 400 KB; shrink it first.`);
    const ext = u.pathname.split(".").pop()?.toLowerCase() ?? "";
    const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const mime = ["image/png", "image/jpeg", "image/webp"].includes(type) ? type : MIMES[ext];
    if (!mime) throw new Error("Only png, jpeg or webp pictures are accepted.");
    return { mime, base64: toBase64(bytes) };
  }
  throw new Error("The picture link redirects too many times.");
}

export const devAddImage = defineTool({
  name: "dev_add_image",
  title: "Add a screenshot to a developer app's promo page",
  description:
    "Adds one real screenshot (png, jpeg or webp, under 400 KB, up to 6 per version) to the app's editable version. Give a public https link, a file in a public GitHub repo, or base64 data. If the latest version is live this starts the next version; the live app does not change until it is approved. Saving clears earlier check results. Only real screenshots of the app: never made-up or mock pictures.",
  inputSchema: {
    app_id: z.string().uuid(),
    url: z.string().url().optional().describe("Public https link to the picture."),
    github: z.object({ repo: z.string(), path: z.string(), ref: z.string().default("main") }).optional().describe("A picture in a PUBLIC GitHub repo (owner/name, path, branch or commit)."),
    base64: z.string().max(560000).optional().describe("The picture as base64 (no data: prefix). Under 400 KB before encoding."),
    mime: z.enum(["image/png", "image/jpeg", "image/webp"]).optional().describe("Required with base64."),
    caption: z.string().trim().max(140).optional().describe("What the picture shows, in plain words."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  handler: async ({ app_id, url, github, base64, mime, caption }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const given = [url, github, base64].filter((x) => x !== undefined).length;
    if (given !== 1) return fail("Give exactly one of url, github or base64.");
    try {
      let pic: { mime: string; base64: string };
      if (base64 !== undefined) {
        if (!mime) return fail("Give mime with base64.");
        pic = { mime, base64 };
      } else if (url) {
        pic = await fetchPicture(url.trim());
      } else {
        const g = github!;
        if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(g.repo.trim())) return fail('Give the repo as "owner/name".');
        const clean = g.path.replace(/^\/+/, "");
        if (!clean || clean.split("/").some((p) => p === ".." || p === "")) return fail("Give the picture's path inside the repo.");
        pic = await fetchPicture(`https://raw.githubusercontent.com/${g.repo.trim()}/${encodeURIComponent(g.ref)}/${clean.split("/").map(encodeURIComponent).join("/")}`);
      }
      const { data, error } = await devClient(ctx).rpc("dev_add_image", { _app_id: app_id, _mime: pic.mime, _data: pic.base64, _caption: caption ?? null });
      if (error) return fail(dbMessage(error.message));
      return text(`Added screenshot ${data.position} (${data.count} of 6). Run dev_run_checks again; 3 or more screenshots is best.`, data);
    } catch (e) {
      return fail(dbMessage(e instanceof Error ? e.message : String(e)));
    }
  },
});

export const devRemoveImage = defineTool({
  name: "dev_remove_image",
  title: "Remove a screenshot from a developer app",
  description: "Removes one screenshot (by image_id from dev_get_status) from the app's editable version. Clears earlier check results.",
  inputSchema: { image_id: z.string().uuid() },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ image_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const { error } = await devClient(ctx).rpc("dev_remove_image", { _image_id: image_id });
    if (error) return fail(dbMessage(error.message));
    return text("Screenshot removed. Run dev_run_checks again.");
  },
});

/** For dev_get_status: the latest version's promo text and screenshots. */
export async function latestPromo(sb: ReturnType<typeof devClient>, appId: string) {
  const v = await latestVersion(sb, appId);
  if (!v) return null;
  const [{ data: p }, { data: imgs }] = await Promise.all([
    sb.from("dev_app_versions").select("promo").eq("id", v.id).maybeSingle(),
    sb.from("dev_app_images").select("id, position, caption, mime, bytes").eq("version_id", v.id).order("position"),
  ]);
  return { version_no: v.version_no, promo: (p as { promo: unknown } | null)?.promo ?? null, screenshots: imgs ?? [] };
}
