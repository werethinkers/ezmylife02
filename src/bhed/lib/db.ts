import type { BhedNode, Chart, MediaRef, TabStyle } from "./types";
import { DEFAULT_STYLE } from "./types";

const DB_NAME = "bhed-prabhed";
const DB_VERSION = 2;

type BlobRec = { mime: string; buffer: ArrayBuffer };

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("charts")) db.createObjectStore("charts", { keyPath: "id" });
      if (!db.objectStoreNames.contains("blobs")) db.createObjectStore("blobs");
      if (!db.objectStoreNames.contains("versions")) {
        const versions = db.createObjectStore("versions", { keyPath: "id" });
        versions.createIndex("chartId", "chartId");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error ?? new Error("Could not open saved charts"));
    };
  });
  return dbPromise;
}

function txRequest<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = run(tx.objectStore(store));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error ?? new Error("Storage failed"));
        tx.onabort = () => reject(tx.error ?? new Error("Storage aborted"));
      }),
  );
}

function isStyle(value: unknown): value is TabStyle {
  if (!value || typeof value !== "object") return false;
  return true;
}

function isNode(value: unknown): value is BhedNode {
  if (!value || typeof value !== "object") return false;
  const node = value as BhedNode;
  return typeof node.id === "string" && typeof node.title === "string" && Array.isArray(node.children);
}

function normalizeNode(value: BhedNode): BhedNode {
  const media: MediaRef[] = Array.isArray(value.media)
    ? value.media.filter((item) => item && typeof item.id === "string")
    : [];
  return {
    id: value.id,
    title: typeof value.title === "string" ? value.title : "",
    body: typeof value.body === "string" ? value.body : "",
    style: { ...DEFAULT_STYLE, ...(isStyle(value.style) ? value.style : {}) },
    collapsed: Boolean(value.collapsed),
    media,
    children: (value.children ?? []).filter(isNode).map(normalizeNode),
  };
}

function isChart(value: unknown): value is Chart {
  if (!value || typeof value !== "object") return false;
  const chart = value as Chart;
  return typeof chart.id === "string" && isNode(chart.root);
}

export function coerceChart(value: unknown): Chart | null {
  if (!isChart(value)) return null;
  return {
    ...value,
    title: typeof value.title === "string" ? value.title : value.root.title,
    createdAt: value.createdAt || Date.now(),
    updatedAt: value.updatedAt || Date.now(),
    root: normalizeNode(value.root),
  };
}

export async function idbAllCharts(): Promise<Chart[]> {
  const rows = await txRequest<Chart[]>("charts", "readonly", (store) => store.getAll());
  return (rows ?? []).map((row) => coerceChart(row)).filter((chart): chart is Chart => chart !== null);
}

export async function idbGetChart(id: string): Promise<Chart | null> {
  const chart = await txRequest<Chart | undefined>("charts", "readonly", (store) => store.get(id));
  return coerceChart(chart);
}

export async function idbPutChart(chart: Chart): Promise<void> {
  await txRequest("charts", "readwrite", (store) => store.put(chart));
}

export async function idbDeleteChart(id: string): Promise<void> {
  await txRequest("charts", "readwrite", (store) => store.delete(id));
}

export async function idbPutBlob(id: string, blob: Blob): Promise<void> {
  const buffer = await blob.arrayBuffer();
  const rec: BlobRec = { mime: blob.type || "application/octet-stream", buffer };
  await txRequest("blobs", "readwrite", (store) => store.put(rec, id));
}

export async function idbGetBlob(id: string): Promise<Blob | null> {
  const rec = await txRequest<BlobRec | undefined>("blobs", "readonly", (store) => store.get(id));
  if (!rec?.buffer) return null;
  return new Blob([rec.buffer], { type: rec.mime || "application/octet-stream" });
}

export async function idbDeleteBlob(id: string): Promise<void> {
  await txRequest("blobs", "readwrite", (store) => store.delete(id));
}

export type ChartVersion = {
  id: string;
  chartId: string;
  title: string;
  savedAt: number;
  chart: Chart;
};

export async function idbPutVersion(version: ChartVersion): Promise<void> {
  await txRequest("versions", "readwrite", (store) => store.put(version));
}

export async function idbGetVersion(id: string): Promise<ChartVersion | null> {
  const row = await txRequest<ChartVersion | undefined>("versions", "readonly", (store) => store.get(id));
  if (!row?.chart) return null;
  const chart = coerceChart(row.chart);
  if (!chart) return null;
  return { ...row, chart };
}

export async function idbVersions(chartId: string): Promise<ChartVersion[]> {
  const db = await openDb();
  const rows = await new Promise<ChartVersion[]>((resolve, reject) => {
    const tx = db.transaction("versions", "readonly");
    const req = tx.objectStore("versions").index("chartId").getAll(chartId);
    req.onsuccess = () => resolve((req.result as ChartVersion[]) ?? []);
    req.onerror = () => reject(req.error ?? new Error("Could not read versions"));
  });
  return rows
    .map((row) => {
      const chart = coerceChart(row.chart);
      return chart ? { ...row, chart } : null;
    })
    .filter((row): row is ChartVersion => row !== null)
    .sort((a, b) => b.savedAt - a.savedAt);
}

export async function idbDeleteVersion(id: string): Promise<void> {
  await txRequest("versions", "readwrite", (store) => store.delete(id));
}

export async function idbDeleteVersions(chartId: string): Promise<void> {
  const rows = await idbVersions(chartId);
  await Promise.all(rows.map((row) => idbDeleteVersion(row.id)));
}
