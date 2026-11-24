import { defineTool } from "../sdk";
import { z } from "zod";
import { SITE, dbMessage, devClient, fail, latestVersion, notSignedIn, text } from "./dev-shared";

/*
 * dev_next_step: the one tool that tells Claude exactly what to do next for an app, so the whole job
 * ("build me this app on ezyourlife", "publish this there") runs without guessing.
 *
 * The decision is a plain function (nextStep) of facts the database already holds; it never asks the model to
 * judge. It reads nothing about prices: the cost estimate and the suggested price live only in the admin queue.
 */

export interface AppFacts {
  kind: "ai" | "hosted";
  status: string; // the version's state
  hasFile: boolean;
  hasStep: boolean;
  images: number;
  checks: { id: string; status: string; label: string; detail: string }[] | null;
  passed: boolean;
  live: boolean;
}

export interface Next {
  step: string;
  tool: string | null;
  say: string;
  /** Items the developer must decide or do themselves; empty when Claude can carry on alone. */
  needs_developer: string[];
}

const HINT: Record<string, (f: AppFacts) => Next | null> = {
  code_secrets: () => ({ step: "remove_keys", tool: null, say: "Remove the key from the app's code (never ask the developer to paste one). If the app needs AI, move the call into the AI step: dev_save_ai_step, and have the page call window.ezyourlife.ai(inputs). Then upload again.", needs_developer: [] }),
  aicall: () => ({ step: "use_ai_step_in_page", tool: null, say: "Replace the app's old server call (fetch to /api/...) with `await window.ezyourlife.ai(inputs)`, keep the page's own fallback for when it throws, rebuild and upload again.", needs_developer: [] }),
  aistep: () => ({ step: "save_ai_step", tool: "dev_save_ai_step", say: "Save (or fix) the AI step: system = the instructions from the old server code, task = what to produce and the exact layout, inputs = every value the page sends, fallback = what the page shows without AI, json = true if the page expects an object.", needs_developer: [] }),
  aitested: () => ({ step: "test_run", tool: "dev_test_run", say: "Run the AI step once with a realistic example (the app's own sample input, exactly as the page sends it). Read the answer: is it correct, specific, in the layout the page expects, free of invented facts? If not, improve ai.system / ai.task with dev_save_ai_step and run again. Checks cannot pass until a run of this exact step succeeded.", needs_developer: [] }),
  tested: () => ({ step: "test_run", tool: "dev_test_run", say: "Run the definition once with a realistic example and read the answer. Improve the instructions if it is wrong or generic.", needs_developer: [] }),
  duplicates: () => ({ step: "similar_note", tool: "dev_save_app", say: "A similar app exists. Tell the developer which one, ask how theirs differs (who it is for, what it adds), and save their words as listing.similar_note. The team decides.", needs_developer: ["How is this app different from the similar app(s)? One or two sentences in your own words."] }),
  images: (f) => ({ step: "screenshots", tool: "dev_add_image", say: `Add real screenshots of the running app (${f.images} so far; 3 or more is best, up to 6, each under 400 KB, png/jpeg/webp). Never mock pictures.`, needs_developer: [] }),
  promo: () => ({ step: "promo_text", tool: "dev_save_app", say: "Fill in the promo part of the listing (headline, features, how it works, FAQs) from what the app really does.", needs_developer: [] }),
  listing: () => ({ step: "listing", tool: "dev_save_app", say: "Complete the store listing: name, short and full description, category (from dev_get_standards), support email and charge options.", needs_developer: ["A support email address people can write to."] }),
  name: () => ({ step: "name", tool: "dev_save_app", say: "Choose a different name; this one is taken or too close to another app.", needs_developer: ["A different app name."] }),
};

export function nextStep(f: AppFacts): Next {
  if (f.status === "submitted") return { step: "waiting", tool: "dev_get_status", say: "The version is with the EzYourLife team. Nothing to do but wait; check dev_get_status for their answer.", needs_developer: [] };
  if (f.status === "approved" && f.live) return { step: "live", tool: null, say: "This version is live. To change the app, upload the new build (that starts the next version).", needs_developer: [] };
  if (f.kind === "hosted" && !f.hasFile) {
    return {
      step: "upload",
      tool: "dev_import_project",
      say: "Upload the built app. Best: dev_import_project (a GitHub repo). Otherwise dev_get_upload_link from Claude Code. If this cloud workspace cannot reach EzYourLife: build the app (npm install --legacy-peer-deps, npm run build), zip the dist folder, send it to the developer with the file-sending tool, and tell them to drop it on the app's page (editor link from dev_get_preview_link) under 'Upload a built app'.",
      needs_developer: [],
    };
  }
  if (!f.checks) return { step: "run_checks", tool: "dev_run_checks", say: "Run the checks.", needs_developer: [] };
  const fails = f.checks.filter((c) => c.status === "fail");
  // Fix in a sensible order: the code first, then the AI step, then the proof it works, then the listing.
  const order = ["code_secrets", "aicall", "aistep", "aisecrets", "aitested", "tested", "name", "listing", "images", "promo", "duplicates"];
  fails.sort((a, b) => (order.indexOf(a.id) + 99) % 99 - (order.indexOf(b.id) + 99) % 99);
  for (const c of fails) {
    const h = HINT[c.id]?.(f);
    if (h) return { ...h, say: `${h.say}\n(Check "${c.label}": ${c.detail})` };
  }
  if (fails.length) return { step: "fix", tool: "dev_run_checks", say: `Fix: ${fails.map((c) => `${c.label} (${c.detail})`).join("; ")}. Then run the checks again.`, needs_developer: [] };
  if (f.passed) {
    return {
      step: "preview_then_submit",
      tool: "dev_get_preview_link",
      say: "All checks passed. Give the developer the preview link so they can try the real app (the AI part works there, free test runs). Show them what was built and, in plain words, what visitors will pay: nothing to open the app; credits per AI result, set by the EzYourLife team. Ask whether to send it for review; only then call dev_submit_for_review.",
      needs_developer: ["Try the preview and say whether to send it for review."],
    };
  }
  return { step: "run_checks", tool: "dev_run_checks", say: "Run the checks again.", needs_developer: [] };
}

export const devNextStep = defineTool({
  name: "dev_next_step",
  title: "What to do next for a developer app",
  description:
    "Tells you the exact next action for an app, from where it stands now (nothing uploaded, AI step missing, not test-run yet, listing or screenshots missing, ready for the preview, with the team). Call it after every change and when unsure; do what it says, and stop to ask the developer only for items it lists under needs_developer. It runs the checks itself. It never shows a price: the cost is worked out by EzYourLife and only the admin sees and sets the price.",
  inputSchema: { app_id: z.string().uuid() },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ app_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notSignedIn();
    const sb = devClient(ctx);
    try {
      const { data: app, error } = await sb.from("dev_apps").select("tool_id, kind, status, live_version_id").eq("id", app_id).maybeSingle();
      if (error) return fail(dbMessage(error.message));
      if (!app) return fail("App not found.");
      const v = await latestVersion(sb, app_id);
      if (!v) return fail("App not found.");
      const [{ count: withFile }, { count: images }] = await Promise.all([
        sb.from("dev_app_versions").select("id", { count: "exact", head: true }).eq("id", v.id).neq("html", ""),
        sb.from("dev_app_images").select("id", { count: "exact", head: true }).eq("version_id", v.id),
      ]);
      const hasFile = app.kind === "ai" ? !!v.spec : (withFile ?? 0) > 0;
      let qa = v.qa;
      const editable = v.status === "draft" || v.status === "changes_requested";
      if (editable && (hasFile || v.spec)) {
        const { data, error: qerr } = await sb.rpc("dev_run_qa", { _version_id: v.id });
        if (qerr) return fail(dbMessage(qerr.message));
        qa = data;
      }
      const facts: AppFacts = {
        kind: app.kind === "ai" ? "ai" : "hosted",
        status: v.status,
        hasFile,
        hasStep: !!v.spec,
        images: images ?? 0,
        checks: qa?.checks ?? null,
        passed: !!qa?.passed,
        live: app.live_version_id === v.id,
      };
      const n = nextStep(facts);
      const head = `App ${SITE}/tool/${app.tool_id}, version ${v.version_no} (${v.status}). Next: ${n.step}${n.tool ? ` → ${n.tool}` : ""}`;
      const ask = n.needs_developer.length ? `\n\nAsk the developer:\n${n.needs_developer.map((x) => `- ${x}`).join("\n")}` : "\n\nNo question for the developer needed: do it, then call dev_next_step again.";
      return text(`${head}\n\n${n.say}${ask}`, { ...n, version_no: v.version_no, state: v.status, checks_passed: facts.passed });
    } catch (e) {
      return fail(dbMessage(e instanceof Error ? e.message : String(e)));
    }
  },
});
