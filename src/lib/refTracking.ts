// Influencer link attribution for /?ref=CODE.
//
// The decision logic is kept pure (no browser APIs) so it can be tested directly.
// Rules:
//   - A code is remembered for 30 days (last touch wins if a visitor arrives
//     through a different influencer's link).
//   - A click is only counted the first time a visitor arrives on a given code,
//     so reloading the page does not inflate an influencer's click count.
//   - Nothing identifying is stored: the visitor id is a random local value.

export const REF_KEY = "ez_ref";
export const VISITOR_KEY = "ez_visitor";
export const REF_WINDOW_DAYS = 30;
const WINDOW_MS = REF_WINDOW_DAYS * 24 * 60 * 60 * 1000;
export const CODE_RE = /^[a-z0-9-]{3,20}$/;

export type StoredRef = { code: string; at: number; tracked?: boolean };

export function normaliseCode(raw: unknown): string | null {
  const code = String(raw ?? "").trim().toLowerCase();
  return CODE_RE.test(code) ? code : null;
}

/** Pulls ?ref= (or ?utm_source= style aliases) out of a query string. */
export function parseRefParam(search: string): string | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  } catch {
    return null;
  }
  for (const key of ["ref", "code"]) {
    const found = normaliseCode(params.get(key));
    if (found) return found;
  }
  return null;
}

/** Is a stored attribution still inside its window? */
export function activeCode(stored: StoredRef | null, nowMs: number): string | null {
  if (!stored || !normaliseCode(stored.code)) return null;
  if (!Number.isFinite(stored.at) || nowMs - stored.at > WINDOW_MS) return null;
  return stored.code;
}

export type RefDecision = {
  next: StoredRef | null;
  /** Write `next` back to storage. */
  changed: boolean;
  /** Count a click for this code now. */
  trackCode: string | null;
};

/**
 * Decides what to store and whether to count a click.
 * `incoming` is the code from the URL this page load, or null.
 */
export function decideRef(
  stored: StoredRef | null,
  incoming: string | null,
  nowMs: number,
): RefDecision {
  const code = normaliseCode(incoming);
  const live = activeCode(stored, nowMs);

  if (!code) {
    // No code in the URL. Keep a live one, drop an expired one.
    if (live) return { next: stored, changed: false, trackCode: null };
    return { next: null, changed: stored !== null, trackCode: null };
  }

  // Same code, already counted: refresh the window but do not count again.
  if (live === code && stored?.tracked) {
    return { next: { code, at: nowMs, tracked: true }, changed: true, trackCode: null };
  }

  // New code, or the same one that was never successfully counted.
  return { next: { code, at: nowMs, tracked: true }, changed: true, trackCode: code };
}

// ---------- browser layer ----------

function readStored(): StoredRef | null {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.code !== "string") return null;
    return { code: parsed.code, at: Number(parsed.at), tracked: !!parsed.tracked };
  } catch {
    return null;
  }
}

function writeStored(next: StoredRef | null) {
  try {
    if (next) localStorage.setItem(REF_KEY, JSON.stringify(next));
    else localStorage.removeItem(REF_KEY);
  } catch {
    /* private mode or storage disabled: attribution is best-effort */
  }
}

/** A random local id so one visitor reloading does not look like many. */
export function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return "anon";
  }
}

/** The code to send with a purchase, if any. */
export function getRefCode(): string | null {
  return activeCode(readStored(), Date.now());
}

/**
 * Runs on page load. Stores any ?ref= code and returns the code whose click
 * should be counted (null if there is nothing new to count).
 */
export function captureRef(search: string, nowMs = Date.now()): string | null {
  const decision = decideRef(readStored(), parseRefParam(search), nowMs);
  if (decision.changed) writeStored(decision.next);
  return decision.trackCode;
}
