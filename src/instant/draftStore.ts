// Builder drafts live on this device. Text goes to localStorage; when photos make a draft too big
// for it (about 5 MB), the full draft goes to IndexedDB and localStorage keeps a photo-less copy
// with a marker, so nothing is lost on reload or on the sign-in round trip before publishing.
import type { Content } from "./types";

export interface Draft { variantId: string; content: Content; pageId?: string; idb?: boolean }

const key = (id: string) => `ip-draft:${id}`;
const DB = "ip-drafts", STORE = "drafts";

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function idb<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = fn(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

const stripPhotos = (v: unknown): unknown => {
  if (typeof v === "string") return v.startsWith("data:image/") ? "" : v;
  if (Array.isArray(v)) return v.map(stripPhotos);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, stripPhotos(x)]));
  return v;
};

export function readDraft(id: string): Draft | null {
  try { const s = localStorage.getItem(key(id)); return s ? JSON.parse(s) : null; } catch { return null; }
}

/** The full draft, photos included, when the localStorage copy says it lives in IndexedDB. */
export async function readFullDraft(id: string): Promise<Draft | null> {
  try { return (await idb<Draft | undefined>("readonly", (s) => s.get(id))) ?? null; } catch { return null; }
}

export async function writeDraft(id: string, d: Draft): Promise<boolean> {
  try {
    localStorage.setItem(key(id), JSON.stringify({ ...d, idb: false }));
    idb("readwrite", (s) => s.delete(id)).catch(() => undefined);
    return true;
  } catch { /* too big for localStorage: fall through to IndexedDB */ }
  try {
    await idb("readwrite", (s) => s.put(d, id));
    try { localStorage.setItem(key(id), JSON.stringify({ ...d, content: stripPhotos(d.content), idb: true })); } catch { /* text-only copy is best effort */ }
    return true;
  } catch { return false; }
}

export function clearDraft(id: string) {
  try { localStorage.removeItem(key(id)); } catch { /* ignore */ }
  idb("readwrite", (s) => s.delete(id)).catch(() => undefined);
}
