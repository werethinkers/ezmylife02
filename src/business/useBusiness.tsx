/* The open business, shared by every section of the app. run() applies an action at once on screen,
   saves it, and tells the owner what happened by itself. */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Change, Workspace } from "./types";
import { applyChange, dailySweep, type Db } from "./engine";
import { type BizStore, cloudStore, hasLocalData, localStore, moveLocalToCloud } from "./store";

const CURRENT = "ez-my-business:current";
const SWEEP = "ez-my-business:sweep";

export type Action = (db: Db) => Change | { change: Change };

interface BizCtx {
  store: BizStore;
  ready: boolean;
  error: string | null;
  workspaces: Workspace[];
  db: Db | null;
  saving: boolean;
  /** Runs one action. Returns the Change, or null when the action said no (the reason is shown). */
  run: (action: Action, opts?: { quiet?: boolean }) => Change | null;
  select: (id: string) => void;
  refresh: () => Promise<void>;
  create: (db: Db) => Promise<void>;
  rename: (name: string) => Promise<void>;
  removeCurrent: () => Promise<void>;
  localWaiting: boolean;
  moveToAccount: () => Promise<void>;
}

const Ctx = createContext<BizCtx | null>(null);

const getItem = (k: string) => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const setItem = (k: string, v: string) => {
  try { localStorage.setItem(k, v); } catch { /* fine without it */ }
};

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const store = useMemo(() => (user ? cloudStore(user.id) : localStore), [user]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [db, setDb] = useState<Db | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [localWaiting, setLocalWaiting] = useState(false);
  const dbRef = useRef<Db | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  dbRef.current = db;

  const openWs = useCallback(async (list: Workspace[], id?: string | null) => {
    const ws = list.find((w) => w.id === id) ?? list[0];
    if (!ws) { setDb(null); return; }
    const recs = await store.load(ws.id);
    let next: Db = { ws, recs };
    setItem(CURRENT, ws.id);
    const day = new Date().toISOString().slice(0, 10);
    if (getItem(`${SWEEP}:${ws.id}`) !== day) {
      const ch = dailySweep(next);
      if (ch) { next = applyChange(next, ch); await store.apply(ws.id, ch).catch(() => undefined); }
      setItem(`${SWEEP}:${ws.id}`, day);
    }
    setDb(next);
  }, [store]);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      await queue.current.catch(() => undefined);
      const list = await store.listWorkspaces();
      setWorkspaces(list);
      await openWs(list, dbRef.current?.ws.id ?? getItem(CURRENT));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your business.");
    } finally {
      setReady(true);
    }
  }, [store, openWs]);

  useEffect(() => {
    if (authLoading) return;
    setReady(false);
    setLocalWaiting(!!user && hasLocalData());
    void refresh();
  }, [authLoading, user, refresh]);

  // Website orders and enquiries arrive in the database, so look again when the owner comes back to the tab.
  useEffect(() => {
    if (store.mode !== "cloud") return;
    const onFocus = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [store, refresh]);

  const run = useCallback((action: Action, opts?: { quiet?: boolean }): Change | null => {
    const cur = dbRef.current;
    if (!cur) return null;
    let ch: Change;
    try {
      const out = action(cur);
      ch = "change" in out ? out.change : out;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That did not work.");
      return null;
    }
    const next = applyChange(cur, ch);
    dbRef.current = next;
    setDb(next);
    if (!opts?.quiet && ch.notes.length) {
      const [first, ...rest] = ch.notes;
      toast.success(first, { description: rest.length ? rest.join(". ") + "." : undefined, duration: 3500 + rest.length * 1200 });
    }
    setSaving(true);
    const wsId = cur.ws.id;
    queue.current = queue.current.then(() => store.apply(wsId, ch)).then(
      () => setSaving(false),
      (e) => {
        setSaving(false);
        toast.error(`Not saved: ${e instanceof Error ? e.message : "please try again"}`);
        void refresh();
      },
    );
    return ch;
  }, [store, refresh]);

  const create = useCallback(async (newDb: Db) => {
    await store.create(newDb);
    setWorkspaces((w) => [...w, newDb.ws]);
    setItem(CURRENT, newDb.ws.id);
    setDb(newDb);
  }, [store]);

  const select = useCallback((id: string) => { void openWs(workspaces, id); }, [openWs, workspaces]);

  const rename = useCallback(async (name: string) => {
    const cur = dbRef.current;
    if (!cur || !name.trim()) return;
    await store.rename(cur.ws.id, name.trim());
    setDb({ ...cur, ws: { ...cur.ws, name: name.trim() } });
    setWorkspaces((list) => list.map((w) => (w.id === cur.ws.id ? { ...w, name: name.trim() } : w)));
  }, [store]);

  const removeCurrent = useCallback(async () => {
    const cur = dbRef.current;
    if (!cur) return;
    await store.remove(cur.ws.id);
    const rest = workspaces.filter((w) => w.id !== cur.ws.id);
    setWorkspaces(rest);
    await openWs(rest, rest[0]?.id);
  }, [store, workspaces, openWs]);

  const moveToAccount = useCallback(async () => {
    if (!user) return;
    const n = await moveLocalToCloud(user.id);
    setLocalWaiting(false);
    toast.success(`${n === 1 ? "Your business is" : `${n} businesses are`} now saved in your account`);
    await refresh();
  }, [user, refresh]);

  const value = useMemo<BizCtx>(() => ({ store, ready, error, workspaces, db, saving, run, select, refresh, create, rename, removeCurrent, localWaiting, moveToAccount }),
    [store, ready, error, workspaces, db, saving, run, select, refresh, create, rename, removeCurrent, localWaiting, moveToAccount]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBusiness(): BizCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBusiness needs BusinessProvider");
  return c;
}
