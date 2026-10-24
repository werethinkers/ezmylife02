/* Where a business's records live.
   Signed in: the owner's own rows in the database (biz_workspaces, biz_records), saved one action at a time with biz_apply.
   Not signed in: this device only (localStorage), so anyone can try it at once; it can be moved to an account later. */

import { supabase } from "@/integrations/supabase/client";
import type { AnyRec, Change, Workspace } from "./types";
import type { Db } from "./engine";

export interface BizStore {
  mode: "local" | "cloud";
  listWorkspaces(): Promise<Workspace[]>;
  load(wsId: string): Promise<AnyRec[]>;
  create(db: Db): Promise<void>;
  apply(wsId: string, ch: Change): Promise<void>;
  rename(wsId: string, name: string): Promise<void>;
  remove(wsId: string): Promise<void>;
}

/* ---------- This device ---------- */

const KEY = "ez-my-business:v1";
interface LocalData { workspaces: Workspace[]; recs: Record<string, AnyRec[]> }

function readLocal(): LocalData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as LocalData;
  } catch {
    /* private window or blocked storage: start empty */
  }
  return { workspaces: [], recs: {} };
}
function writeLocal(d: LocalData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    throw new Error("This browser could not save. Sign in to keep your business safe in your account.");
  }
}

export const localStore: BizStore = {
  mode: "local",
  async listWorkspaces() {
    return readLocal().workspaces;
  },
  async load(wsId) {
    return readLocal().recs[wsId] ?? [];
  },
  async create(db) {
    const d = readLocal();
    d.workspaces.push(db.ws);
    d.recs[db.ws.id] = db.recs;
    writeLocal(d);
  },
  async apply(wsId, ch) {
    const d = readLocal();
    const ws = d.workspaces.find((w) => w.id === wsId);
    if (!ws) throw new Error("Business not found on this device.");
    const rm = new Set(ch.remove);
    const up = new Map(ch.upsert.map((r) => [r.id, r]));
    const cur = (d.recs[wsId] ?? []).filter((r) => !rm.has(r.id));
    const ids = new Set(cur.map((r) => r.id));
    d.recs[wsId] = [...cur.map((r) => up.get(r.id) ?? r), ...ch.upsert.filter((r) => !ids.has(r.id))];
    if (ch.settings) ws.settings = { ...ws.settings, ...ch.settings };
    writeLocal(d);
  },
  async rename(wsId, name) {
    const d = readLocal();
    const ws = d.workspaces.find((w) => w.id === wsId);
    if (ws) ws.name = name;
    writeLocal(d);
  },
  async remove(wsId) {
    const d = readLocal();
    d.workspaces = d.workspaces.filter((w) => w.id !== wsId);
    delete d.recs[wsId];
    writeLocal(d);
  },
};

export const hasLocalData = () => readLocal().workspaces.length > 0;
export const clearLocal = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
};

/* ---------- The owner's account ---------- */

/* eslint-disable @typescript-eslint/no-explicit-any */
const table = (name: string) => supabase.from(name as any) as any;
const rpc = (fn: string, args: Record<string, unknown>) => (supabase.rpc as any)(fn, args) as Promise<{ data: any; error: { message: string; code?: string } | null }>;

function friendly(e: { message: string; code?: string }): Error {
  if (e.code === "23505" || /biz_workspaces_slug/.test(e.message)) return new Error("That website address is taken. Try another one.");
  return new Error(e.message);
}

export function cloudStore(userId: string): BizStore {
  return {
    mode: "cloud",
    async listWorkspaces() {
      const { data, error } = await table("biz_workspaces").select("id, name, type_id, settings, created_at").eq("user_id", userId).order("created_at");
      if (error) throw friendly(error);
      return (data ?? []) as Workspace[];
    },
    async load(wsId) {
      const out: AnyRec[] = [];
      const page = 1000;
      for (let from = 0; ; from += page) {
        const { data, error } = await table("biz_records").select("id, kind, data, created_at, updated_at").eq("workspace_id", wsId).order("created_at").order("id").range(from, from + page - 1);
        if (error) throw friendly(error);
        out.push(...((data ?? []) as AnyRec[]));
        if (!data || data.length < page) break;
      }
      return out;
    },
    async create(db) {
      const { error } = await table("biz_workspaces").insert({ id: db.ws.id, user_id: userId, name: db.ws.name, type_id: db.ws.type_id, settings: {} });
      if (error) throw friendly(error);
      for (let i = 0; i < db.recs.length || i === 0; i += 1500) {
        await this.apply(db.ws.id, { upsert: db.recs.slice(i, i + 1500), remove: [], settings: i === 0 ? db.ws.settings : undefined, notes: [] });
      }
    },
    async apply(wsId, ch) {
      const { error } = await rpc("biz_apply", { p_workspace: wsId, p_upsert: ch.upsert, p_remove: ch.remove, p_settings: ch.settings ?? {} });
      if (error) throw friendly(error);
    },
    async rename(wsId, name) {
      const { error } = await table("biz_workspaces").update({ name, updated_at: new Date().toISOString() }).eq("id", wsId);
      if (error) throw friendly(error);
    },
    async remove(wsId) {
      const { error } = await table("biz_workspaces").delete().eq("id", wsId);
      if (error) throw friendly(error);
    },
  };
}

/** Moves every business kept on this device into the signed-in account, then clears the device copy. */
export async function moveLocalToCloud(userId: string): Promise<number> {
  const d = readLocal();
  const cloud = cloudStore(userId);
  for (const ws of d.workspaces) await cloud.create({ ws, recs: d.recs[ws.id] ?? [] });
  clearLocal();
  return d.workspaces.length;
}

/* ---------- Public website ---------- */

export interface PublicSite {
  name: string; type_id: string; about?: string; colour: string; take_orders: boolean; city?: string; address?: string; phone?: string;
  labels?: { product: string; products: string; order: string };
  items: { id: string; name: string; price: number; unit: string; type: "product" | "service" }[];
}

export async function fetchPublicSite(slug: string): Promise<PublicSite | null> {
  const { data, error } = await rpc("biz_public_site", { p_slug: slug });
  if (error) throw new Error(error.message);
  return (data as PublicSite) ?? null;
}

export async function sendSiteOrder(slug: string, input: { kind: "order" | "lead"; name: string; phone: string; items: { id: string; qty: number }[]; note: string; due?: string }): Promise<string> {
  const { data, error } = await rpc("biz_site_order", { p_slug: slug, p_kind: input.kind, p_name: input.name, p_phone: input.phone, p_items: input.items, p_note: input.note, p_due: input.due ?? null });
  if (error) throw new Error(error.message);
  return data as string;
}
