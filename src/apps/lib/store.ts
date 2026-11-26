import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/*
 * Saved data for an app (tracker rows, recent results, drafts).
 *
 * Kept in this browser straight away and, when signed in, synced to the user's own row in
 * `tool_sessions` (one row per user + app, protected by row-level security) so it follows
 * them to other devices. The newest copy wins.
 */

export interface AppData {
  savedAt?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const localKey = (uid: string | undefined, toolId: string) => `ez.app.${uid ?? "guest"}.${toolId}`;

function readLocal(key: string): AppData | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as AppData) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, data: AppData) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* storage full or blocked: the cloud copy still saves */
  }
}

export function useAppStore<T extends AppData>(toolId: string, initial: T) {
  const { user } = useAuth();
  const uid = user?.id;
  const key = localKey(uid, toolId);
  const [data, setData] = useState<T>(() => ({ ...initial, ...(readLocal(key) as T | null) }));
  const [syncState, setSyncState] = useState<"local" | "syncing" | "synced" | "error">(uid ? "syncing" : "local");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const self = useRef(Symbol("store"));
  const latest = useRef(data);
  latest.current = data;

  // Load (and reconcile with) the cloud copy when the user is known.
  useEffect(() => {
    let cancelled = false;
    const local = readLocal(key) as T | null;
    setData({ ...initial, ...(local ?? {}) } as T);
    if (!uid) {
      setSyncState("local");
      return;
    }
    setSyncState("syncing");
    supabase
      .from("tool_sessions")
      .select("session_data, updated_at")
      .eq("user_id", uid)
      .eq("tool_id", toolId)
      .maybeSingle()
      .then(({ data: row, error }) => {
        if (cancelled) return;
        if (error) {
          setSyncState("error");
          return;
        }
        const remote = (row?.session_data ?? null) as T | null;
        if (remote && (remote.savedAt ?? 0) > (local?.savedAt ?? 0)) {
          setData({ ...initial, ...remote });
          writeLocal(key, remote);
        }
        setSyncState("synced");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, toolId]);

  const pushRemote = useCallback(
    async (next: T) => {
      if (!uid) return;
      setSyncState("syncing");
      const { error } = await supabase
        .from("tool_sessions")
        .upsert({ user_id: uid, tool_id: toolId, session_data: next as never }, { onConflict: "user_id,tool_id" });
      setSyncState(error ? "error" : "synced");
    },
    [uid, toolId],
  );

  // Keep every component using the same app data in step (e.g. a tool and the workspace bar).
  useEffect(() => {
    const onSync = (e: Event) => {
      const d = (e as CustomEvent<{ key: string; data: T; from: symbol }>).detail;
      if (d.key === key && d.from !== self.current) setData(d.data);
    };
    window.addEventListener("ez:store", onSync);
    return () => window.removeEventListener("ez:store", onSync);
  }, [key]);

  const update = useCallback(
    (patch: Partial<T> | ((prev: T) => Partial<T>)) => {
      setData((prev) => {
        // Another tab or component may have saved newer data; build on the newest copy.
        const local = readLocal(key) as T | null;
        const base = local && (local.savedAt ?? 0) > (prev.savedAt ?? 0) ? ({ ...prev, ...local } as T) : prev;
        const p = typeof patch === "function" ? patch(base) : patch;
        const next = { ...base, ...p, savedAt: Date.now() } as T;
        writeLocal(key, next);
        queueMicrotask(() => window.dispatchEvent(new CustomEvent("ez:store", { detail: { key, data: next, from: self.current } })));
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void pushRemote(latest.current), 1200);
        return next;
      });
    },
    [key, pushRemote],
  );

  // Flush a pending save when leaving the app.
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        void pushRemote(latest.current);
      }
    },
    [pushRemote],
  );

  return { data, update, syncState, signedIn: !!uid };
}

export const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** True when this app has an unsubmitted draft saved on this device (see useResults' draft/saveDraft). */
export function hasDraft(toolId: string, userId?: string): boolean {
  const data = readLocal(localKey(userId, toolId));
  return !!data?.draft;
}

