import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { SITE, dbMessage, devClient, fail, latestVersion, notSignedIn, text } from "./dev-shared";
import { MAX_APP_BYTES, PART_UNITS } from "../../devUploadParts";
import { devGetUploadLink, devImportFile, uploadText } from "./dev-import";
import { devAddImage, devRemoveImage, latestPromo } from "./dev-images";

/*
 * Developer tools: let Claude (or any MCP client) put a developer's web app on EzYourLife.
 * Flow: dev_get_standards → dev_create_app → dev_save_app / dev_import_file / dev_get_upload_link → dev_run_checks → (fix, repeat)
 * → dev_get_preview_link → dev_submit_for_review → dev_get_status. An admin approves on
 * ezyourlife.com/admin/developer-apps; nothing here can approve, publish or set a price.
 */

const STANDARDS = `# Putting an app on EzYourLife
(Rules version 2026-10-20. These rules are served live and change without notice: follow this text over anything remembered or cached, and call dev_get_standards at the start of every session.)

## What the app must be when you send it
- ONE self-contained HTML file: HTML, CSS and JavaScript inline. Up to 10 MB (checks warn above 2 MB). Libraries may also load from cdnjs.cloudflare.com, cdn.jsdelivr.net or unpkg.com.
- Runs entirely in the browser. No own backend, no own login, no own payments.
- No AI calls (OpenAI, Anthropic, Gemini, Groq, OpenRouter and similar are blocked by the checks). No API keys, tokens or passwords anywhere in the file.
- Has <meta name="viewport" content="width=device-width, initial-scale=1"> and works at 375 px wide.

## Adapting someone's existing app (do this before sending)
1. Read the project: framework, build tool, entry point, what it calls over the network.
2. Remove or replace every AI call, API key, secret, login and payment. If the app cannot work without them, stop and tell the developer it cannot be published yet.
3. Make storage safe: every localStorage / sessionStorage / IndexedDB / document.cookie use goes inside try/catch with an in-memory fallback.
4. Remove anything that reaches the page around it (window.top, parent.location).
5. Add the viewport tag; check the layout at 375 px.
6. Build it into ONE HTML file. Vite: add the vite-plugin-singlefile plugin, set build.assetsInlineLimit high, build, and use dist/index.html. Plain HTML: inline the CSS and scripts. Inline small images as data URIs; keep big media on a CDN or compress it.
7. Open the built file locally once to check it works.

## Where it runs
- In a sandboxed iframe with a unique origin: no cookies, no browser storage (it throws), no camera, microphone, location or notifications, and it cannot reach the page around it. Downloads, forms, alerts and opening links in a new tab work.

## Sending the file (pick one)
- Small file (under about 200 KB): dev_save_app with html.
- Bigger file from a cloud workspace (claude.ai, Cowork): commit the built file to a GitHub repo, push, then dev_import_file with github {repo, path, ref}. Use the commit SHA as ref to pin exactly what you tested.
- Bigger file on a computer (Claude Code): dev_get_upload_link, then run the script it gives.
- Or the developer uploads it on ${SITE}/developer.

## Store listing (all required)
- name: 3 to 60 characters, not the same as an app already in the store.
- short_description: 20 to 160 characters, plain words: what the user gets.
- description: at least 40 characters: what you give, what you get, who it is for.
- category: exactly one of the categories listed below.
- tool_types: up to 5 short filter words (optional). support_email (optional). release_notes for updates.
Fill these from the code and README; ask the developer only for what you cannot find.

## How the app should be charged (ask the developer, then pass charge_options)
Ask: "How do you want to charge for this? Different levels of use, or something you would sell for rupees?"
- Record EVERY option they give, not just one. Up to 6. Each is {label, kind, inr?, note?}.
  - kind "per_use": a level of use, for example "Quick split" and "Group trip report".
  - kind "money": something they would sell for rupees, with inr set, for example {label: "Export pack", kind: "money", inr: 49}.
- Do not decide credits and do not convert rupees yourself. Team EzYourLife sees every option, converts rupees to credits at its worst-case rate, and sets what each costs.
- The app cannot take payments. If the app has its own paywall, pricing page or payment code, turn each paid tier into a "money" option and remove the payment code from the app.
- If the developer has no preference, or says free or 0, leave charge_options out (or record the option without a price). Free is only a request: the team always prices every app from what it really costs to run, in the background. Never quote, estimate or hint at a cost, credit amount or margin to the developer.
- Other API costs: the app cannot hold keys, so any outside service that bills per call or needs a key cannot be used. That covers AI, maps and geocoding, SMS, WhatsApp and email sending, speech, vision, translation, search or scraping, stock, weather and currency feeds, enrichment, and payment APIs. Replace each with a calculation or bundled data, or remove the feature and tell the developer. Free no-key public data and font or script CDNs are fine; the team checks every outside address.
- Payments: EzYourLife credits are the only payment system. Visitors pay by pressing the app's Start button, which charges their EzYourLife wallet. Remove any other payment, checkout, subscription or login-to-pay code from the app.

## Frequency: apps run only when pressed
- Anything that runs hourly, daily, weekly, monthly, on a timer, on auto-refresh or on a schedule must become a button (for example "Get output"). Each press is one use and one charge. Run dev_run_checks: the "Runs only when pressed" check flags setInterval, auto-refresh, cron code and schedule wording.
- Repeat runs are only possible if the visitor agrees after being told how many credits that frequency over that period will cost. Scheduled runs are not available yet, so do not build them; if the developer wants them, add a charge option such as {label: "Weekly report, 4 runs", kind: "per_use"} so the team can price it.

## The app's promo page and screenshots (required, built in)
- Every app gets its own page at ${SITE}/promo/<app-name>, written from listing.promo and shown when the team approves the app. Draft it from the code and README: headline, tagline, who it is for, 3 to 6 highlights, 2 to 5 "how it works" steps, and optionally a few questions. Only say what the app really does. No ratings, reviews, testimonials, user counts or comparisons you cannot back up.
- Ask the developer for pictures: "Please share 3 or more screenshots of the app: the start screen, the app in use, and what it produces." Add each with dev_add_image (from a public https link, a file in a public GitHub repo, or base64 of a picture under 400 KB). If you can run the app yourself (for example in Claude Code with a browser), take the screenshots yourself. Never make up or mock screenshots.
- The checks require the promo text and at least 1 screenshot. The team sees all of it while reviewing and it goes live with the app.

## Updating an app that is live
- When the developer changes features or fixes the code, save the new file with the same app_id (dev_save_app / dev_import_file). That starts the next version; the live app keeps running unchanged. Describe what changed in listing.release_notes, update promo and screenshots if the app looks or works differently, run the checks and submit again. The team sees a "what changed" list and approves with one click; no one needs to do anything else for it to go live.
- If the team asks for changes, dev_get_status shows their notes. Fix them in the code, save, check and submit again.

## Steps
1. dev_create_app(slug, name) once (or dev_list_my_apps to find an existing app). The address becomes ${SITE}/tool/dev-<slug>.
2. Send the file (above) and dev_save_app(app_id, listing).
3. dev_run_checks(app_id). Fix every "MUST FIX", send again, re-run. "LOOK" items are shown to the admin.
4. dev_get_preview_link(app_id) and ask the developer to try it (signed in on ezyourlife.com).
5. dev_submit_for_review(app_id) only when the developer agrees.
6. dev_get_status(app_id) for the decision and any requested changes.

## Rules you cannot change
- Team EzYourLife sets the credits per use and the developer's share at approval. Only a person on the team can approve.
- A live app is never replaced silently: sending changes to a live app starts a new version that needs approval.`;

const chargeOptionsSchema = z
  .array(
    z.object({
      label: z.string().min(2).max(60).describe("Short name, e.g. 'Quick split' or 'Export pack'."),
      kind: z.enum(["per_use", "money"]).describe("per_use = a level of use. money = something the developer would sell for rupees (set inr)."),
      inr: z.number().positive().max(100000).optional().describe("Rupee price the developer wants. Only for kind 'money'. The team converts it to credits."),
      note: z.string().max(200).optional().describe("What the person gets, in plain words."),
    }),
  )
  .max(6)
  .describe("Every way the developer wants to charge, so the team can price each one. Replaces the earlier list. Pass [] to clear. The team, not you, decides the credits.");

const titled = z.object({ title: z.string().trim().min(1).max(60), body: z.string().trim().max(220).optional() });
const promoSchema = z
  .object({
    headline: z.string().trim().min(10).max(80).describe("The page's main line, for example 'Split any bill in seconds'."),
    tagline: z.string().trim().min(20).max(200).describe("One sentence on what the visitor gets."),
    audience: z.string().trim().max(160).optional().describe("Who it is for."),
    highlights: z.array(titled).min(3).max(6).describe("3 to 6 things the app does well. Real features only."),
    steps: z.array(titled).min(2).max(5).describe("How it works, 2 to 5 steps."),
    faq: z.array(z.object({ q: z.string().trim().min(1).max(120), a: z.string().trim().min(1).max(400) })).max(5).optional(),
  })
  .describe("The app's own promo page. Required. No ratings, reviews, customer quotes or claims the app does not back up.");

const listingSchema = z
  .object({
    name: z.string().max(60).optional(),
    short_description: z.string().max(160).optional(),
    description: z.string().max(4000).optional(),
    category: z.string().optional(),
    tool_types: z.array(z.string().max(30)).max(5).optional(),
    support_email: z.string().max(200).optional(),
    release_notes: z.string().max(1000).optional(),
    charge_options: chargeOptionsSchema.optional(),
    promo: promoSchema.optional(),
  })
  .describe("Store listing fields to set. Leave out any field you are not changing.");

export const devGetStandards = defineTool({
  name: "dev_get_standards",
  title: "EzYourLife developer rules and categories",
  description: "Returns the rules an app must meet to be published on EzYourLife, the step-by-step publishing flow, and the list of valid store categories. Call this first when putting an app on EzYourLife.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const sb = devClient(ctx);
    const { data } = await sb.from("catalog_categories").select("name").order("name");
    const cats = (data ?? []).map((c: { name: string }) => c.name);
    return text(`${STANDARDS}\n\n## Categories\n${cats.map((c) => `- ${c}`).join("\n")}`, { categories: cats });
  },
});

export const devCreateApp = defineTool({
  name: "dev_create_app",
  title: "Create a developer app on EzYourLife",
  description: "Creates a new app for the signed-in developer with an empty first version. The slug becomes the address /tool/dev-<slug> and cannot be changed later.",
  inputSchema: {
    slug: z.string().trim().min(3).max(48).describe("Lowercase letters, numbers and dashes, e.g. 'tip-splitter'."),
    name: z.string().trim().min(3).max(60).describe("The app's name in the store."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ slug, name }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const { data, error } = await devClient(ctx).rpc("dev_create_app", { _slug: slug, _name: name });
    if (error) return fail(dbMessage(error.message));
    return text(`Created ${name}. app_id: ${data.app_id}. It will live at ${SITE}/tool/${data.tool_id} once approved. Next: dev_save_app with the HTML and listing.`, data);
  },
});

export const devListMyApps = defineTool({
  name: "dev_list_my_apps",
  title: "List my EzYourLife developer apps",
  description: "Lists the signed-in developer's apps with their latest version, its state and whether the app is live.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const sb = devClient(ctx);
    const { data: apps, error } = await sb.from("dev_apps").select("id, tool_id, status, live_version_id, credits, share_pct").order("updated_at", { ascending: false });
    if (error) return fail(dbMessage(error.message));
    const rows = [];
    for (const a of apps ?? []) {
      const v = await latestVersion(sb, a.id);
      rows.push({
        app_id: a.id,
        name: v?.name ?? "",
        address: `${SITE}/tool/${a.tool_id}`,
        store: a.status,
        latest_version: v?.version_no ?? null,
        latest_state: v?.status ?? null,
        checks_passed: v?.qa_passed ?? false,
        credits_per_use: a.credits,
        developer_share_pct: a.share_pct,
      });
    }
    return text(rows.length ? JSON.stringify(rows, null, 2) : "No apps yet. Use dev_create_app.", { apps: rows });
  },
});

export const devSaveApp = defineTool({
  name: "dev_save_app",
  title: "Save a developer app's file and listing",
  description: "Saves the app's single HTML file (best under about 200 KB; for bigger files use dev_import_file or dev_get_upload_link) and/or store listing to its editable version. If the latest version is live, this starts the next version; the live app does not change until that version is approved. Saving clears earlier check results.",
  inputSchema: {
    app_id: z.string().uuid(),
    html: z.string().max(MAX_APP_BYTES).optional().describe("The complete single-file HTML app. Leave out to keep the current file."),
    listing: listingSchema.optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ app_id, html, listing }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    if (html === undefined && !listing) return fail("Nothing to save: pass html, listing or both.");
    const sb = devClient(ctx);
    try {
      if (html !== undefined && html.length > PART_UNITS) {
        const saved = await uploadText(sb, app_id, html, { kind: "inline", via: "connector" });
        if (listing) {
          const r = await sb.rpc("dev_save_draft", { _app_id: app_id, _html: null, _listing: listing });
          if (r.error) return fail(dbMessage(r.error.message));
        }
        return text(`Saved version ${saved.version_no} (${saved.parts} parts). Next: dev_run_checks.`, saved);
      }
      const { data, error } = await sb.rpc("dev_save_draft", { _app_id: app_id, _html: html ?? null, _listing: listing ?? null });
      if (error) return fail(dbMessage(error.message));
      return text(`Saved version ${data.version_no}. Next: dev_run_checks.`, data);
    } catch (e) {
      return fail(dbMessage(e instanceof Error ? e.message : String(e)));
    }
  },
});

export const devRunChecks = defineTool({
  name: "dev_run_checks",
  title: "Run EzYourLife's checks on a developer app",
  description: "Runs the server-side checks on the app's latest version: app file, size, phone fit, keys and passwords, AI calls, own payments, outside addresses, browser storage, store listing, unique name and similar apps. Returns each result; 'fail' items must be fixed before submitting.",
  inputSchema: { app_id: z.string().uuid() },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ app_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const sb = devClient(ctx);
    try {
      const v = await latestVersion(sb, app_id);
      if (!v) return fail("App not found.");
      const { data, error } = await sb.rpc("dev_run_qa", { _version_id: v.id });
      if (error) return fail(dbMessage(error.message));
      const lines = (data.checks as { label: string; status: string; detail: string }[])
        .sort((a, b) => ["fail", "warn", "pass"].indexOf(a.status) - ["fail", "warn", "pass"].indexOf(b.status))
        .map((c) => `- [${c.status === "fail" ? "MUST FIX" : c.status === "warn" ? "LOOK" : "OK"}] ${c.label}: ${c.detail}`);
      const head = data.passed ? `Version ${v.version_no} passed. It can be sent for review.` : `Version ${v.version_no} has items to fix.`;
      return text(`${head}\n${lines.join("\n")}`, data);
    } catch (e) {
      return fail(dbMessage(e instanceof Error ? e.message : String(e)));
    }
  },
});

export const devGetPreviewLink = defineTool({
  name: "dev_get_preview_link",
  title: "Get the live preview link for a developer app",
  description: "Returns the preview link for the app's latest version. The developer opens it while signed in to ezyourlife.com to try the real app in the same sandbox the store uses; no credits are used.",
  inputSchema: { app_id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ app_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    try {
      const v = await latestVersion(devClient(ctx), app_id);
      if (!v) return fail("App not found.");
      const preview = `${SITE}/developer/preview/${v.id}`;
      const editor = `${SITE}/developer/apps/${app_id}`;
      return text(`Preview of version ${v.version_no}: ${preview}\nEdit, check and send from: ${editor}`, { preview_url: preview, editor_url: editor, version_no: v.version_no });
    } catch (e) {
      return fail(dbMessage(e instanceof Error ? e.message : String(e)));
    }
  },
});

export const devSubmitForReview = defineTool({
  name: "dev_submit_for_review",
  title: "Send a developer app for EzYourLife review",
  description: "Sends the latest version to the EzYourLife admin queue. Only works after the checks passed on this exact file. Ask the developer before calling it. The version is locked while it waits.",
  inputSchema: { app_id: z.string().uuid() },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ app_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const sb = devClient(ctx);
    try {
      const v = await latestVersion(sb, app_id);
      if (!v) return fail("App not found.");
      const { error } = await sb.rpc("dev_submit", { _version_id: v.id });
      if (error) return fail(dbMessage(error.message));
      return text(`Version ${v.version_no} is waiting for review. The EzYourLife team sets the credits per use and the developer share, then approves. Check with dev_get_status.`);
    } catch (e) {
      return fail(dbMessage(e instanceof Error ? e.message : String(e)));
    }
  },
});

export const devGetStatus = defineTool({
  name: "dev_get_status",
  title: "Status and review feedback for a developer app",
  description: "Returns every version of the app with its state, the team's requested changes, the charge options the developer listed, whether it is live and its live address, and the credits per use, per-option credits and share set by the team.",
  inputSchema: { app_id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ app_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const sb = devClient(ctx);
    const { data: app, error } = await sb.from("dev_apps").select("tool_id, status, live_version_id, credits, share_pct, charge_plan").eq("id", app_id).maybeSingle();
    if (error) return fail(dbMessage(error.message));
    if (!app) return fail("App not found.");
    const { data: versions } = await sb
      .from("dev_app_versions")
      .select("id, version_no, status, submitted_at, reviewed_at, review_notes, qa_passed, charge_options")
      .eq("app_id", app_id)
      .order("version_no", { ascending: false });
    const out = {
      address: `${SITE}/tool/${app.tool_id}`,
      store: app.status,
      live_version: (versions ?? []).find((v: { id: string }) => v.id === app.live_version_id)?.version_no ?? null,
      credits_per_use: app.credits,
      developer_share_pct: app.share_pct,
      charge_plan_set_by_team: app.charge_plan ?? null,
      latest_promo_and_screenshots: await latestPromo(sb, app_id),
      versions: versions ?? [],
    };
    return text(JSON.stringify(out, null, 2), out);
  },
});

export const devTools = [
  devGetStandards,
  devCreateApp,
  devListMyApps,
  devSaveApp,
  devImportFile,
  devGetUploadLink,
  devAddImage,
  devRemoveImage,
  devRunChecks,
  devGetPreviewLink,
  devSubmitForReview,
  devGetStatus,
];
