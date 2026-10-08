import { useEffect } from "react";
import { useAppStore } from "./store";
import { ROLES } from "../workflows";
import { APPS } from "../registry";

/*
 * Which app people open next. Learned per person from their own visits (app A then app B within
 * a few hours), blended with the role workflows and each app's related apps, so every app can
 * suggest the follow-on apps that person is likely to need.
 */

export interface JourneyData {
  last?: { id: string; at: number };
  trans: Record<string, Record<string, number>>;
  role?: string;
  savedAt?: number;
}

const WINDOW = 3 * 60 * 60 * 1000;

export function useJourney() {
  return useAppStore<JourneyData>("_journey", { trans: {} });
}

/** Records that this app was opened, and the step from the previous app. */
export function useRecordVisit(toolId?: string) {
  const { update } = useJourney();
  useEffect(() => {
    if (!toolId) return;
    update((prev) => {
      const trans = { ...(prev.trans ?? {}) };
      const last = prev.last;
      if (last && last.id !== toolId && Date.now() - last.at < WINDOW) {
        trans[last.id] = { ...(trans[last.id] ?? {}), [toolId]: (trans[last.id]?.[toolId] ?? 0) + 1 };
      }
      return { trans, last: { id: toolId, at: Date.now() } };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId]);
}

export interface NextSuggestion { id: string; why?: string; learned: boolean }

export function suggestNext(toolId: string, j: JourneyData, isLive: (id: string) => boolean, limit = 4): NextSuggestion[] {
  const score = new Map<string, number>();
  const why = new Map<string, string>();
  const add = (id: string, s: number, reason?: string) => {
    if (id === toolId || !isLive(id)) return;
    score.set(id, (score.get(id) ?? 0) + s);
    if (reason && !why.has(id)) why.set(id, reason);
  };
  // 1. What this person actually opens next.
  const mine = j.trans?.[toolId] ?? {};
  Object.entries(mine).forEach(([id, n]) => add(id, 2.5 * Math.min(n, 6)));
  // 2. Workflows that contain this app: the next steps, chosen role first.
  for (const r of ROLES) {
    const i = r.steps.findIndex((s) => s.toolId === toolId);
    if (i < 0) continue;
    const w = r.id === j.role ? 3 : 1.4;
    r.steps.slice(i + 1).forEach((s, k) => add(s.toolId, w * Math.pow(0.6, k) * 2, s.why));
    if (i > 0) add(r.steps[i - 1].toolId, w * 0.3, r.steps[i - 1].why);
  }
  // 3. Apps that pair well with this one.
  (APPS[toolId]?.related ?? []).forEach((id, k) => add(id, 1.6 - k * 0.2));
  return Array.from(score.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => ({ id, why: why.get(id), learned: !!mine[id] }));
}
