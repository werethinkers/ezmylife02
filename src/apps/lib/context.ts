import { useEffect, useRef } from "react";
import { useAppStore } from "./store";
import { useWorkspace, type WorkspaceProfile } from "./workspace";

/*
 * Shared context pipeline (Workspace Builder, phase 2): details entered once — the client,
 * the engagement, this month's numbers, the last invoice — flow into every tool in the
 * workspace, and tools write back what they produce (e.g. invoice totals → Tax Estimator).
 */

export interface WorkClient {
  name?: string;
  gstin?: string;
  address?: string;
  state?: string;
  email?: string;
  phone?: string;
}

export interface WorkContext {
  client?: WorkClient;
  engagement?: { service?: string; fee?: string; start?: string; end?: string };
  money?: { monthlyRevenue?: number; monthlyExpenses?: number; gstRate?: number };
  lastInvoice?: { number?: string; subtotal?: number; gst?: number; total?: number; items?: { description: string; quantity: number; rate: number }[] };
  /** Workspace session currently open (set from /workspace). */
  session?: { id: string; name: string; role: string; tools: string[]; done: string[] };
  /** Saved client list for professionals who serve several clients (e.g. accountants). */
  clients?: WorkClient[];
  savedAt?: number;
}

export function ctxValue(ctx: WorkContext, key: import("../types").CtxKey): string | undefined {
  switch (key) {
    case "clientName": return ctx.client?.name;
    case "clientGstin": return ctx.client?.gstin;
    case "clientAddress": return ctx.client?.address;
    case "service": return ctx.engagement?.service;
    case "fee": return ctx.engagement?.fee;
    case "invoiceNumber": return ctx.lastInvoice?.number;
    case "invoiceTotal": return ctx.lastInvoice?.total ? String(Math.round(ctx.lastInvoice.total * 100) / 100) : undefined;
  }
}

export function useWorkContext() {
  const { data, update, syncState } = useAppStore<WorkContext>("_context", {});
  const merge = (patch: Partial<WorkContext>) =>
    update((prev) => {
      const next: Partial<WorkContext> = { ...patch };
      for (const k of ["client", "engagement", "money", "lastInvoice"] as const) {
        if (patch[k]) (next as Record<string, unknown>)[k] = { ...(prev[k] ?? {}), ...patch[k] };
      }
      return next;
    });
  return { ctx: data, merge, replace: update, syncState };
}

/**
 * Runs `apply` once, after the saved context and business profile have loaded, so a tool can
 * prefill its empty fields. Returns nothing; tools keep full control of their own state.
 */
export function usePrefill(apply: (ctx: WorkContext, profile: WorkspaceProfile) => void) {
  const { ctx, syncState } = useWorkContext();
  const ws = useWorkspace();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    const ready = syncState !== "syncing" && ws.syncState !== "syncing";
    const t = setTimeout(() => {
      if (done.current) return;
      done.current = true;
      apply(ctx, ws.profile);
    }, ready ? 0 : 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncState, ws.syncState]);
}

/** Writes a value back to the shared context after the user stops typing. */
export function useWriteBack<T>(value: T, toPatch: (v: T) => Partial<WorkContext> | null, delay = 800) {
  const { merge } = useWorkContext();
  const first = useRef(true);
  const key = JSON.stringify(value);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const p = toPatch(value);
      if (p) merge(p);
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
