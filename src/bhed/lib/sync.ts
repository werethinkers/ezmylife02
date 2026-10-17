import { deleteMyChart, listMyCharts, loadMyChart, pullMyMedia, putMyMedia, saveMyChart } from "./cloud";
import { coerceChart, idbAllCharts, idbGetBlob, idbPutBlob, idbPutChart } from "./db";
import { collectMediaIds, walk } from "./tree";
import type { Chart, MediaRef } from "./types";

const OWNER_KEY = "bhed-owners";
const TOUCH_KEY = "bhed-touched";
const SYNCED_KEY = "bhed-media-synced";
const CLOUD_MEDIA_MAX = 5 * 1024 * 1024;

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function ownerOf(id: string): string {
  const map = readJson<Record<string, string>>(OWNER_KEY, {});
  return map[id] ?? "guest";
}

export function setOwner(id: string, owner: string) {
  const map = readJson<Record<string, string>>(OWNER_KEY, {});
  map[id] = owner;
  writeJson(OWNER_KEY, map);
}

export function touchChart(id: string) {
  const map = readJson<Record<string, string>>(TOUCH_KEY, {});
  map[id] = "1";
  writeJson(TOUCH_KEY, map);
}

export function isTouched(id: string): boolean {
  return readJson<Record<string, string>>(TOUCH_KEY, {})[id] === "1";
}

function syncedSet(): Set<string> {
  const list = readJson<string[]>(SYNCED_KEY, []);
  return new Set(Array.isArray(list) ? list.filter((id) => typeof id === "string") : []);
}

function markSynced(id: string) {
  const set = syncedSet();
  set.add(id);
  writeJson(SYNCED_KEY, [...set]);
}

function mediaMap(chart: Chart): Map<string, MediaRef> {
  const map = new Map<string, MediaRef>();
  walk(chart.root, (node) => {
    node.media.forEach((item) => map.set(item.id, item));
  });
  return map;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read that file"));
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(data: string, mime: string): Blob {
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime || "application/octet-stream" });
}

export async function pushChart(chart: Chart, force = false): Promise<{ files: number; skipped: number }> {
  await saveMyChart({
    data: {
      id: chart.id,
      title: chart.title,
      document: JSON.stringify(chart),
      createdMs: chart.createdAt,
      updatedMs: chart.updatedAt,
    },
  });
  const refs = mediaMap(chart);
  const synced = force ? new Set<string>() : syncedSet();
  let files = 0;
  let skipped = 0;
  for (const id of collectMediaIds(chart.root)) {
    if (!force && synced.has(id)) continue;
    const ref = refs.get(id);
    const blob = await idbGetBlob(id);
    if (!blob || !ref) {
      skipped += 1;
      continue;
    }
    if (blob.size > CLOUD_MEDIA_MAX) {
      skipped += 1;
      continue;
    }
    const dataBase64 = await blobToBase64(blob);
    await putMyMedia({
      data: {
        chartId: chart.id,
        id,
        name: ref.name,
        mime: ref.mime || blob.type,
        dataBase64,
      },
    });
    markSynced(id);
    synced.add(id);
    files += 1;
  }
  return { files, skipped };
}

export async function ensureMedia(chart: Chart): Promise<void> {
  const missing: string[] = [];
  for (const id of new Set(collectMediaIds(chart.root))) {
    const blob = await idbGetBlob(id);
    if (!blob) missing.push(id);
  }
  for (let i = 0; i < missing.length; i += 12) {
    const chunk = missing.slice(i, i + 12);
    const rows = await pullMyMedia({ data: chunk });
    for (const row of rows) {
      await idbPutBlob(row.id, base64ToBlob(row.data_b64, row.mime));
      markSynced(row.id);
    }
  }
}

export async function removeCloudChart(id: string): Promise<void> {
  await deleteMyChart({ data: id });
}

export async function reconcileAccount(userId: string): Promise<void> {
  const remote = await listMyCharts();
  const local = await idbAllCharts();
  const remoteIds = new Set(remote.map((row) => row.id));
  const guest = local.filter((chart) => ownerOf(chart.id) === "guest" && !remoteIds.has(chart.id));
  for (const chart of guest) {
    await pushChart(chart);
    setOwner(chart.id, userId);
    remoteIds.add(chart.id);
  }

  const fresh = await listMyCharts();
  const localAfter = await idbAllCharts();
  for (const row of fresh) {
    const existing = localAfter.find((chart) => chart.id === row.id) ?? null;
    const remoteUpdated = Number(row.updated_ms) || 0;
    if (existing && existing.updatedAt > remoteUpdated) {
      await pushChart(existing);
      setOwner(existing.id, userId);
      continue;
    }
    if (existing && existing.updatedAt >= remoteUpdated) {
      setOwner(existing.id, userId);
      await ensureMedia(existing);
      continue;
    }
    const document = await loadMyChart({ data: row.id });
    if (!document) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(document);
    } catch {
      continue;
    }
    const chart = coerceChart(parsed);
    if (!chart) continue;
    await idbPutChart(chart);
    setOwner(chart.id, userId);
    await ensureMedia(chart);
  }
}
