import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { SITE, dbMessage, devClient, fail, latestVersion, notSignedIn, text } from "./dev-shared";

/*
 * Developer tools: let Claude (or any MCP client) put a developer's web app on EzYourLife.
 * Flow: dev_get_standards → dev_create_app → dev_save_app → dev_run_checks → (fix, repeat)
 * → dev_get_preview_link → dev_submit_for_review → dev_get_status. An admin approves on
 * ezyourlife.com/admin/developer-apps; nothing here can approve, publish or set a price.
 */

const STANDARDS = `# Putting an app on EzYourLife

## What an app must be
- ONE self-contained HTML file: HTML, CSS and JavaScript inline. Up to 2 MB. Libraries may load from cdnjs.cloudflare.com, cdn.jsdelivr.net or unpkg.com.
- A React / Vue / Svelte / Vite app must be built into a single HTML file first (inline the JS and CSS bundles; inline small images as data URIs).
- Runs entirely in the browser. No own backend, no own login, no own payments.
- No AI calls (OpenAI, Anthropic, Gemini, Groq, OpenRouter and similar are blocked by the checks). No API keys, tokens or passwords anywhere in the file.
- Add <meta name="viewport" content="width=device-width, initial-scale=1"> and make it work at 375 px wide.

## Where it runs
- In a sandboxed iframe with a unique origin: no cookies, no localStorage/sessionStorage/IndexedDB (they throw — wrap any use in try/catch and keep state in memory), no camera, microphone, location or notifications, and it cannot reach the page around it.
- Downloads, forms, alerts and opening links in a new tab work.

## Store listing (all required)
- name: 3–60 characters, not the same as an app already in the store.
- short_description: 20–160 characters, plain words: what the user gets.
- description: at least 40 characters: what you give, what you get, who it is for.
- category: exactly one of the categories listed below.
- tool_types: up to 5 short filter words (optional). support_email (optional). release_notes for updates.

## Steps
1. dev_create_app(slug, name) once. The app's address becomes ${SITE}/tool/dev-<slug>.
2. dev_save_app(app_id, html, listing). Fill the listing from the code and README; ask the user only for what you cannot find.
3. dev_run_checks(app_id). Fix every "Must fix" item, save again, re-run. "Look" items are shown to the admin.
4. dev_get_preview_link(app_id) and ask the user to try it (signed in on ezyourlife.com).
5. dev_submit_for_review(app_id) only when the user agrees.
6. dev_get_status(app_id) to see the decision and any requested changes.

## Rules you cannot change
- Team EzYourLife sets the credits per use and the developer's share at approval.
- A live app is never replaced silently: saving changes to a live app starts a new version that needs approval.`;

const listingSchema = z
  .object({
    name: z.string().max(60).optional(),
    short_description: z.string().max(160).optional(),
    description: z.string().max(4000).optional(),
    category: z.string().optional(),
    tool_types: z.array(z.string().max(30)).max(5).optional(),
    support_email: z.string().max(200).optional(),
    release_notes: z.string().max(1000).optional(),
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
  description: "Saves the app's single HTML file and/or store listing to its editable version. If the latest version is live, this starts the next version; the live app does not change until that version is approved. Saving clears earlier check results.",
  inputSchema: {
    app_id: z.string().uuid(),
    html: z.string().max(2_000_000).optional().describe("The complete single-file HTML app. Leave out to keep the current file."),
    listing: listingSchema.optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ app_id, html, listing }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    if (html === undefined && !listing) return fail("Nothing to save: pass html, listing or both.");
    const { data, error } = await devClient(ctx).rpc("dev_save_draft", { _app_id: app_id, _html: html ?? null, _listing: listing ?? null });
    if (error) return fail(dbMessage(error.message));
    return text(`Saved version ${data.version_no}. Next: dev_run_checks.`, data);
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
  description: "Returns every version of the app with its state, the team's requested changes, whether it is live and its live address, and the credits per use and share set by the team.",
  inputSchema: { app_id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ app_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const sb = devClient(ctx);
    const { data: app, error } = await sb.from("dev_apps").select("tool_id, status, live_version_id, credits, share_pct").eq("id", app_id).maybeSingle();
    if (error) return fail(dbMessage(error.message));
    if (!app) return fail("App not found.");
    const { data: versions } = await sb
      .from("dev_app_versions")
      .select("id, version_no, status, submitted_at, reviewed_at, review_notes, qa_passed")
      .eq("app_id", app_id)
      .order("version_no", { ascending: false });
    const out = {
      address: `${SITE}/tool/${app.tool_id}`,
      store: app.status,
      live_version: (versions ?? []).find((v: { id: string }) => v.id === app.live_version_id)?.version_no ?? null,
      credits_per_use: app.credits,
      developer_share_pct: app.share_pct,
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
  devRunChecks,
  devGetPreviewLink,
  devSubmitForReview,
  devGetStatus,
];
