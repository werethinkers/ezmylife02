import { supabase } from "@/integrations/supabase/client";
import { emitCreditPrompt } from "@/lib/creditPrompt";
import { PREVIEW_RUN_EVENT } from "@/apps/lib/preview";

/*
 * The AI step of a file app.
 *
 * A file app runs in a sandboxed frame with no account, no keys and no way to call EzYourLife. When the developer
 * saved an AI step for it (dev_app_versions.spec, engine "api"), the page calls
 *
 *     const result = await window.ezyourlife.ai({ yearVibe: "...", rating: 8 });
 *
 * and this file does the rest:
 *  - BRIDGE_SCRIPT is put at the top of the app's page. It defines window.ezyourlife.ai, which posts the inputs to the
 *    page around the frame and waits for the answer.
 *  - runAiStep (below) runs in the store page, as the signed-in visitor: it calls dev-app-run, which reads the
 *    instructions on the server and charges the visitor per result (or, in a developer's preview, runs a free test run).
 *    The frame never sees a token, a price or an instruction.
 *
 * The answer is the parsed JSON object when the step is set to JSON, otherwise text. Failures reject with an Error whose
 * `code` is one of: login, credits, limit, busy, unavailable, failed. A page should keep its own fallback for all of them.
 */

export interface AiTarget {
  toolId: string;
  /** Set in a developer's or admin's preview: free test runs of this version. Never set on the live page. */
  previewVersionId?: string;
}

export const AI_REQUEST = "ezyl:ai";
export const AI_RESPONSE = "ezyl:ai-result";

/** Runs inside the frame. Plain ES5-style JavaScript so any page can take it. */
export const BRIDGE_SCRIPT = `(function(){
  if (window.ezyourlife) return;
  var pending = {}, n = 0;
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.type !== "${AI_RESPONSE}" || !pending[d.id]) return;
    var p = pending[d.id]; delete pending[d.id]; clearTimeout(p.t);
    if (d.ok) { p.resolve(d.result); return; }
    var err = new Error(d.error || "The AI step could not run."); err.code = d.code || "failed"; p.reject(err);
  });
  window.ezyourlife = {
    version: 1,
    ai: function (inputs) {
      return new Promise(function (resolve, reject) {
        var id = "a" + (++n) + "_" + Date.now();
        var t = setTimeout(function () {
          delete pending[id];
          var err = new Error("The AI step took too long."); err.code = "failed"; reject(err);
        }, 150000);
        pending[id] = { resolve: resolve, reject: reject, t: t };
        try { parent.postMessage({ type: "${AI_REQUEST}", id: id, inputs: inputs === undefined ? {} : inputs }, "*"); }
        catch (x) { clearTimeout(t); delete pending[id]; var err = new Error("The AI step could not start."); err.code = "failed"; reject(err); }
      });
    }
  };
})();`;

/** Puts the bridge at the very start of the page's head without disturbing the doctype (a script before it would start quirks mode). */
export function injectBridge(html: string): string {
  const tag = `<script>${BRIDGE_SCRIPT}</script>`;
  const head = /<head(\s[^>]*)?>/i.exec(html);
  if (head) return html.slice(0, head.index + head[0].length) + tag + html.slice(head.index + head[0].length);
  const root = /<html(\s[^>]*)?>/i.exec(html);
  if (root) return html.slice(0, root.index + root[0].length) + `<head>${tag}</head>` + html.slice(root.index + root[0].length);
  const doctype = /^\s*<!doctype[^>]*>/i.exec(html);
  if (doctype) return html.slice(0, doctype[0].length) + tag + html.slice(doctype[0].length);
  return tag + html;
}

class BridgeError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/** The store-page side: one call of the step as the signed-in visitor. Resolves with the result, throws BridgeError. */
export async function runAiStep(target: AiTarget, inputs: unknown, fetchImpl: typeof fetch = fetch): Promise<unknown> {
  const preview = !!target.previewVersionId;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    if (!preview) emitCreditPrompt({ kind: "login" });
    throw new BridgeError("login", "Please sign in to use the AI part of this app.");
  }
  let res: Response;
  try {
    res = await fetchImpl(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dev-app-run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        tool_id: target.toolId,
        inputs: inputs && typeof inputs === "object" && !Array.isArray(inputs) ? inputs : {},
        action: "generate",
        ...(preview ? { preview_version_id: target.previewVersionId } : {}),
      }),
    });
  } catch {
    throw new BridgeError("unavailable", "Could not reach the AI service. Please try again.");
  }
  let body: { ok?: boolean; result?: unknown; error?: string; message?: string; credits_required?: number; balance?: number } = {};
  try {
    body = JSON.parse(await res.text());
  } catch {
    /* an empty or non-JSON error body */
  }
  if (res.ok && body.ok && body.result !== undefined && body.result !== null) {
    if (preview) window.dispatchEvent(new CustomEvent(PREVIEW_RUN_EVENT));
    else emitCreditPrompt({ kind: "charged" });
    return body.result;
  }
  if (res.status === 401) {
    if (!preview) emitCreditPrompt({ kind: "login" });
    throw new BridgeError("login", body.message || "Please sign in to use the AI part of this app.");
  }
  if (res.status === 402) {
    emitCreditPrompt({ kind: "buy", required: body.credits_required, balance: body.balance });
    throw new BridgeError("credits", body.message || "You need more credits for the AI part of this app.");
  }
  if (res.status === 429) throw new BridgeError("limit", body.message || "Too many test runs for today.");
  if (res.status === 404 || res.status === 503) throw new BridgeError("unavailable", body.message || "The AI part of this app is not available right now. You were not charged.");
  throw new BridgeError("failed", body.message || body.error || "The AI step failed. You were not charged.");
}

/** Listens for the frame's requests and answers them. Returns the cleanup. */
export function serveAiBridge(frame: () => HTMLIFrameElement | null, target: AiTarget, fetchImpl?: typeof fetch): () => void {
  let busy = false;
  const onMessage = async (e: MessageEvent) => {
    const f = frame();
    const d = e.data as { type?: string; id?: unknown; inputs?: unknown } | null;
    // Only the frame we drew may ask, and only with a request of the right shape.
    if (!f || e.source !== f.contentWindow || !d || d.type !== AI_REQUEST || typeof d.id !== "string" || d.id.length > 64) return;
    const reply = (msg: Record<string, unknown>) => f.contentWindow?.postMessage({ type: AI_RESPONSE, id: d.id, ...msg }, "*");
    if (busy) return reply({ ok: false, code: "busy", error: "The AI step is already working on a request." });
    busy = true;
    try {
      reply({ ok: true, result: await runAiStep(target, d.inputs, fetchImpl) });
    } catch (err) {
      reply({ ok: false, code: err instanceof BridgeError ? err.code : "failed", error: err instanceof Error ? err.message : "The AI step failed." });
    } finally {
      busy = false;
    }
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}
