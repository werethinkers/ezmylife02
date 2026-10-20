import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { SITE, dbMessage, devClient, fail, latestVersion, notSignedIn, text } from "./dev-shared";
import { STANDARDS } from "./dev-standards";
import { listingSchema } from "./dev-schemas";
import { devAiTools } from "./dev-ai";
import { MAX_APP_BYTES, PART_UNITS } from "../../devUploadParts";
import { devGetUploadLink, devImportFile, uploadText } from "./dev-import";
import { devAddImage, devRemoveImage, latestPromo } from "./dev-images";

/*
 * Developer tools: let Claude (or any MCP client) put a developer's app on EzYourLife, in any form it arrives.
 * Flow: dev_get_standards → dev_list_my_apps → dev_check_similar → dev_create_app →
 *   AI app: dev_save_ai_app → dev_test_run    |    file app: dev_save_app / dev_import_file / dev_get_upload_link
 * → dev_run_checks → (fix, repeat) → dev_get_preview_link → dev_submit_for_review → dev_get_status.
 * An admin approves on ezyourlife.com/admin/developer-apps; nothing here can approve, publish or set a price.
 * The rules and the conversion playbook are in ./dev-standards.ts (served live by dev_get_standards).
 */

export const devGetStandards = defineTool({
  name: "dev_get_standards",
  title: "EzYourLife developer rules and categories",
  description: "Returns the rules and the conversion playbook for putting an app on EzYourLife in any form (AI Studio export, multi-file project, plain HTML, an app built in Claude), the step-by-step publishing flow, and the list of valid store categories. Call this first when putting an app on EzYourLife, every session.",
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
  description: "Lists the signed-in developer's apps with their kind (AI app or file app), latest version, its state and whether the app is live. Call before creating an app, so updates never make duplicates.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const sb = devClient(ctx);
    const { data: apps, error } = await sb.from("dev_apps").select("id, tool_id, kind, status, live_version_id, credits, share_pct").order("updated_at", { ascending: false });
    if (error) return fail(dbMessage(error.message));
    const rows = [];
    for (const a of apps ?? []) {
      const v = await latestVersion(sb, a.id);
      rows.push({
        app_id: a.id,
        kind: a.kind === "ai" ? "ai_app" : "file_app",
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
  description: "FILE APPS: saves the app's single HTML file (best under about 200 KB; for bigger files use dev_import_file or dev_get_upload_link) and/or store listing to its editable version. For an AI app use dev_save_ai_app instead: sending an HTML file to an AI app that is not live yet turns it into a file app and discards its definition. If the latest version is live, this starts the next version; the live app does not change until that version is approved. Saving clears earlier check results.",
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
  description: "Runs the server-side checks on the app's latest version. File apps: app file, size, phone fit, keys and passwords, AI calls, own payments, outside addresses, browser storage, listing, name, promo, screenshots and similar apps. AI apps: the definition and its fields, instructions, secrets, a successful test run, listing, name, promo, screenshots and similar apps. Returns each result; 'fail' items must be fixed before submitting. Similar apps without a similar_note in the listing are a 'fail'; with a note they are shown to the admin as 'look'.",
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
  description: "Returns the preview link for the app's latest version. The developer opens it while signed in to ezyourlife.com to try the real app as it will look on the site, on a phone-sized or desktop-sized screen. File apps run in the same sandbox the store uses; AI apps run on the real screens and AI (a limited number of free test runs a day). No credits are used.",
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
  description: "Returns every version of the app with its state, the team's requested changes, the charge options and similar_note the developer gave, whether it is live and its live address, and the credits per use, per-option credits and share set by the team.",
  inputSchema: { app_id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ app_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const sb = devClient(ctx);
    const { data: app, error } = await sb.from("dev_apps").select("tool_id, kind, status, live_version_id, credits, share_pct, charge_plan").eq("id", app_id).maybeSingle();
    if (error) return fail(dbMessage(error.message));
    if (!app) return fail("App not found.");
    const { data: versions } = await sb
      .from("dev_app_versions")
      .select("id, version_no, status, submitted_at, reviewed_at, review_notes, qa_passed, charge_options, similar_note")
      .eq("app_id", app_id)
      .order("version_no", { ascending: false });
    const out = {
      address: `${SITE}/tool/${app.tool_id}`,
      kind: app.kind === "ai" ? "ai_app" : "file_app",
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
  ...devAiTools,
  devImportFile,
  devGetUploadLink,
  devAddImage,
  devRemoveImage,
  devRunChecks,
  devGetPreviewLink,
  devSubmitForReview,
  devGetStatus,
];
