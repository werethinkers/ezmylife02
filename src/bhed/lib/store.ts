import { create } from "zustand";
import { deleteMyMedia } from "./cloud";
import { withNewMapCharge } from "./credits";
import {
  idbAllCharts,
  idbDeleteBlob,
  idbDeleteChart,
  idbDeleteVersion,
  idbDeleteVersions,
  idbGetBlob,
  idbGetVersion,
  idbPutBlob,
  idbPutChart,
  idbPutVersion,
  idbVersions,
} from "./db";
import {
  chartToJson,
  chartToMarkdown,
  chartToOpml,
  chartToZip,
  downloadBlob,
  fileBase,
  importJson,
  importMarkdown,
  importOpml,
  readImportText,
  unzip,
  type ImportedChart,
} from "./impex";
import { makeSampleChart, withDeeperAhimsa } from "./sample";
import {
  ensureMedia,
  ownerOf,
  pushChart,
  reconcileAccount,
  removeCloudChart,
  setOwner,
  touchChart,
} from "./sync";
import {
  childTitle,
  cloneNode,
  collectMediaIds,
  containsId,
  depthOf,
  detach,
  emptyChart,
  findNode,
  findParent,
  insertChild,
  makeNode,
  mapNode,
  moveSibling,
  patchInTree,
  retitle,
} from "./tree";
import {
  depthLabel,
  displayTitle,
  isMapStyle,
  kindFromMime,
  type BhedNode,
  type Chart,
  type MapStyle,
  type NodePatch,
  type ViewMode,
} from "./types";

export type ChartMeta = { id: string; title: string; updatedAt: number };
export type SaveState = "local" | "saving" | "saved" | "error";

const MAX_FILE = 40 * 1024 * 1024;

type State = {
  ready: boolean;
  booting: boolean;
  error: string | null;
  accountId: string | null;
  saveState: SaveState;
  charts: ChartMeta[];
  chart: Chart | null;
  urls: Record<string, string>;
  focusId: string | null;
  selectedId: string | null;
  mode: ViewMode;
  mapStyle: MapStyle;
  query: string;
  adoptAccount: (userId: string | null) => Promise<void>;
  createChart: () => Promise<void>;
  openChart: (id: string) => Promise<void>;
  deleteChart: (id: string) => Promise<void>;
  duplicateChart: (id: string) => Promise<void>;
  patchNode: (id: string, patch: NodePatch) => void;
  addChild: (parentId: string) => void;
  addChildren: (parentId: string, count: number, names?: string[]) => void;
  removeNode: (id: string) => void;
  moveNode: (id: string, dir: -1 | 1) => void;
  duplicateNode: (id: string) => void;
  toggleCollapsed: (id: string) => void;
  foldLevels: (id: string, levels: number | "all") => void;
  goDeeper: (id: string) => void;
  addMediaFiles: (nodeId: string, files: File[]) => Promise<void>;
  removeMedia: (nodeId: string, mediaId: string) => Promise<void>;
  makeCover: (nodeId: string, mediaId: string) => void;
  setMode: (mode: ViewMode) => void;
  setMapStyle: (style: MapStyle) => void;
  setSelected: (id: string | null) => void;
  setQuery: (query: string) => void;
  importFile: (file: File) => Promise<void>;
  exportChart: (kind: "json" | "md" | "opml" | "zip") => Promise<number>;
  listVersions: (chartId: string) => Promise<{ id: string; title: string; savedAt: number }[]>;
  restoreVersion: (versionId: string) => Promise<void>;
  saveToCloud: () => Promise<{ files: number; skipped: number }>;
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let adoptToken = 0;
let pushing = false;
let pendingChart: Chart | null = null;

function metas(charts: Chart[]): ChartMeta[] {
  return charts
    .map((chart) => ({ id: chart.id, title: chart.title, updatedAt: chart.updatedAt }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function remember() {
  if (typeof localStorage === "undefined") return;
  const state = useBhed.getState();
  localStorage.setItem(
    "bhed-prabhed-prefs",
    JSON.stringify({
      mode: state.mode,
      mapStyle: state.mapStyle,
      activeId: state.chart?.id ?? null,
    }),
  );
}

function readPrefs(): { mode?: string; mapStyle?: string; activeId?: string | null } {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("bhed-prabhed-prefs") || "{}") as {
      mode?: string;
      mapStyle?: string;
      activeId?: string | null;
    };
  } catch {
    return {};
  }
}

function stamp(chartId: string) {
  touchChart(chartId);
  const accountId = useBhed.getState().accountId;
  setOwner(chartId, accountId ?? (ownerOf(chartId) === "guest" ? "guest" : ownerOf(chartId)));
  if (accountId) setOwner(chartId, accountId);
}

async function drainPush() {
  if (pushing) return;
  pushing = true;
  try {
    while (pendingChart && useBhed.getState().accountId) {
      const next = pendingChart;
      pendingChart = null;
      useBhed.setState({ saveState: "saving" });
      await pushChart(next);
    }
    if (useBhed.getState().accountId && !pendingChart) useBhed.setState({ saveState: "saved" });
  } catch {
    if (useBhed.getState().accountId) useBhed.setState({ saveState: "error" });
  } finally {
    pushing = false;
    if (pendingChart && useBhed.getState().accountId) void drainPush();
  }
}

function enqueuePush(chart: Chart) {
  if (!useBhed.getState().accountId) return;
  pendingChart = chart;
  void drainPush();
}

function scheduleSave(chart: Chart) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void idbPutChart(chart).then(() => enqueuePush(chart));
    void rememberVersion(chart);
  }, 280);
}

async function rememberVersion(chart: Chart) {
  const signature = JSON.stringify(chart.root);
  const rows = await idbVersions(chart.id);
  const latest = rows[0];
  if (latest && JSON.stringify(latest.chart.root) === signature) return;
  const now = Date.now();
  const title = displayTitle(chart.root.title);
  if (latest && now - latest.savedAt < 25000) {
    await idbPutVersion({ ...latest, title, savedAt: now, chart });
    return;
  }
  await idbPutVersion({
    id: crypto.randomUUID(),
    chartId: chart.id,
    title,
    savedAt: now,
    chart,
  });
  const all = await idbVersions(chart.id);
  await Promise.all(all.slice(20).map((row) => idbDeleteVersion(row.id)));
}

async function flush() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  const chart = useBhed.getState().chart;
  if (!chart) return;
  await idbPutChart(chart);
  if (useBhed.getState().accountId) {
    pendingChart = chart;
    await drainPush();
  }
}

function revokeUrls(urls: Record<string, string>) {
  for (const url of Object.values(urls)) URL.revokeObjectURL(url);
}

async function urlsFor(chart: Chart): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  for (const id of new Set(collectMediaIds(chart.root))) {
    const blob = await idbGetBlob(id);
    if (blob) urls[id] = URL.createObjectURL(blob);
  }
  return urls;
}

async function dropOrphans(ids: string[]) {
  if (!ids.length) return;
  await flush();
  const charts = await idbAllCharts();
  const live = new Set<string>();
  for (const chart of charts) {
    for (const id of collectMediaIds(chart.root)) live.add(id);
  }
  const current = useBhed.getState().urls;
  const next = { ...current };
  let changed = false;
  const gone: string[] = [];
  for (const id of ids) {
    if (live.has(id)) continue;
    await idbDeleteBlob(id);
    gone.push(id);
    if (next[id]) {
      URL.revokeObjectURL(next[id]);
      delete next[id];
      changed = true;
    }
  }
  if (changed) useBhed.setState({ urls: next });
  if (gone.length && useBhed.getState().accountId) {
    for (const id of gone) {
      try {
        await deleteMyMedia({ data: id });
      } catch {
        /* local copy is already gone */
      }
    }
  }
}

function commit(chart: Chart) {
  stamp(chart.id);
  useBhed.setState((state) => {
    const rest = state.charts.filter((item) => item.id !== chart.id);
    return {
      chart,
      charts: [{ id: chart.id, title: chart.title, updatedAt: chart.updatedAt }, ...rest].sort(
        (a, b) => b.updatedAt - a.updatedAt,
      ),
    };
  });
  scheduleSave(chart);
}

function focusAfterRemoval(root: BhedNode, removed: BhedNode, parent: BhedNode | null) {
  const state = useBhed.getState();
  const fallback = parent?.id ?? root.id;
  const focusGone = state.focusId === removed.id || containsId(removed, state.focusId ?? "");
  const selectedGone = state.selectedId === removed.id || containsId(removed, state.selectedId ?? "");
  if (focusGone || selectedGone) {
    useBhed.setState({
      focusId: focusGone ? fallback : state.focusId,
      selectedId: selectedGone ? fallback : state.selectedId,
    });
  }
}

function visibleCharts(all: Chart[], accountId: string | null): Chart[] {
  return all.filter((chart) => {
    const owner = ownerOf(chart.id);
    if (!accountId) return owner === "guest";
    return owner === accountId || owner === "guest";
  });
}

async function loadVisible(accountId: string | null) {
  let all = await idbAllCharts();
  let changed = false;
  all = await Promise.all(
    all.map(async (chart) => {
      const next = withDeeperAhimsa(chart);
      if (!next) return chart;
      await idbPutChart(next);
      if (useBhed.getState().accountId && ownerOf(chart.id) === useBhed.getState().accountId) enqueuePush(next);
      changed = true;
      return next;
    }),
  );
  if (changed) all = await idbAllCharts();
  let visible = visibleCharts(all, accountId);
  if (!accountId && !visible.length) {
    const sample = makeSampleChart();
    setOwner(sample.id, "guest");
    await idbPutChart(sample);
    visible = [sample];
  }
  visible.sort((a, b) => b.updatedAt - a.updatedAt);
  const prefs = readPrefs();
  const current = useBhed.getState().chart;
  const active =
    (current && visible.find((chart) => chart.id === current.id)) ||
    visible.find((chart) => chart.id === prefs.activeId) ||
    visible[0] ||
    null;
  if (active && useBhed.getState().accountId) await ensureMedia(active);
  revokeUrls(useBhed.getState().urls);
  const urls = active ? await urlsFor(active) : {};
  const same = current?.id === active?.id;
  useBhed.setState({
    charts: metas(visible),
    chart: active,
    urls,
    focusId: same ? useBhed.getState().focusId ?? active?.root.id ?? null : active?.root.id ?? null,
    selectedId: same ? useBhed.getState().selectedId ?? active?.root.id ?? null : active?.root.id ?? null,
    mode: prefs.mode === "map" ? "map" : "table",
    mapStyle: isMapStyle(prefs.mapStyle) ? prefs.mapStyle : useBhed.getState().mapStyle,
  });
}

async function keepImported(imported: ImportedChart) {
  for (const item of imported.media) await idbPutBlob(item.id, item.blob);
  const now = Date.now();
  const chart: Chart = {
    id: crypto.randomUUID(),
    title: imported.root.title,
    root: imported.root,
    createdAt: now,
    updatedAt: now,
  };
  stamp(chart.id);
  await idbPutChart(chart);
  enqueuePush(chart);
  revokeUrls(useBhed.getState().urls);
  const urls = await urlsFor(chart);
  useBhed.setState((state) => ({
    chart,
    urls,
    charts: [{ id: chart.id, title: chart.title, updatedAt: chart.updatedAt }, ...state.charts],
    focusId: chart.root.id,
    selectedId: chart.root.id,
    mode: "table",
    query: "",
  }));
  remember();
}

// Making a new map (blank, copied or imported) costs credits; everything else is free.
function gateNewMaps(actions: State): State {
  return {
    ...actions,
    createChart: async () => {
      await withNewMapCharge(() => actions.createChart());
    },
    duplicateChart: async (id) => {
      await withNewMapCharge(() => actions.duplicateChart(id));
    },
    importFile: async (file) => {
      await withNewMapCharge(() => actions.importFile(file));
    },
  };
}

export const useBhed = create<State>((set, get) => gateNewMaps({
  ready: false,
  booting: false,
  error: null,
  accountId: null,
  saveState: "local",
  charts: [],
  chart: null,
  urls: {},
  focusId: null,
  selectedId: null,
  mode: "table",
  mapStyle: "cascade",
  query: "",

  adoptAccount: async (userId) => {
    const token = ++adoptToken;
    if (get().ready && get().accountId === userId && !get().booting) return;
    await flush();
    if (token !== adoptToken) return;
    set({ booting: true, accountId: userId, error: null });
    try {
      if (userId) await reconcileAccount(userId);
      if (token !== adoptToken) return;
      await loadVisible(userId);
      if (token !== adoptToken) return;
      set({
        ready: true,
        booting: false,
        saveState: userId ? "saved" : "local",
        error: null,
      });
      remember();
    } catch {
      if (token !== adoptToken) return;
      set({
        ready: true,
        booting: false,
        accountId: userId,
        saveState: userId ? "error" : "local",
        error: null,
      });
      try {
        await loadVisible(userId);
      } catch (localErr) {
        set({
          error: localErr instanceof Error ? localErr.message : "Could not open saved charts",
        });
      }
    }
  },

  createChart: async () => {
    await flush();
    const chart = emptyChart();
    stamp(chart.id);
    await idbPutChart(chart);
    enqueuePush(chart);
    revokeUrls(get().urls);
    set((state) => ({
      chart,
      urls: {},
      charts: [{ id: chart.id, title: chart.title, updatedAt: chart.updatedAt }, ...state.charts],
      focusId: chart.root.id,
      selectedId: chart.root.id,
      mode: "table",
      query: "",
    }));
    remember();
  },

  openChart: async (id) => {
    if (get().chart?.id === id) return;
    await flush();
    const accountId = get().accountId;
    const chart = visibleCharts(await idbAllCharts(), accountId).find((item) => item.id === id) ?? null;
    if (!chart) return;
    if (accountId) await ensureMedia(chart);
    revokeUrls(get().urls);
    const urls = await urlsFor(chart);
    set({
      chart,
      urls,
      focusId: chart.root.id,
      selectedId: chart.root.id,
      query: "",
      mode: "table",
    });
    remember();
  },

  deleteChart: async (id) => {
    await flush();
    const all = await idbAllCharts();
    const target = all.find((chart) => chart.id === id);
    const mediaIds = target ? collectMediaIds(target.root) : [];
    if (get().accountId && ownerOf(id) === get().accountId) {
      try {
        await removeCloudChart(id);
      } catch {
        set({ saveState: "error" });
      }
    }
    await idbDeleteChart(id);
    await idbDeleteVersions(id);
    setOwner(id, "guest");
    for (const mediaId of mediaIds) {
      const stillUsed = all.some((chart) => chart.id !== id && collectMediaIds(chart.root).includes(mediaId));
      if (!stillUsed) await idbDeleteBlob(mediaId);
    }
    const remaining = visibleCharts(
      all.filter((chart) => chart.id !== id),
      get().accountId,
    ).sort((a, b) => b.updatedAt - a.updatedAt);
    if (get().chart?.id === id) {
      revokeUrls(get().urls);
      const next = remaining[0] ?? null;
      if (next && get().accountId) await ensureMedia(next);
      const urls = next ? await urlsFor(next) : {};
      set({
        charts: metas(remaining),
        chart: next,
        urls,
        focusId: next?.root.id ?? null,
        selectedId: next?.root.id ?? null,
      });
    } else {
      set({ charts: metas(remaining) });
    }
    remember();
  },

  duplicateChart: async (id) => {
    await flush();
    const all = await idbAllCharts();
    const source = all.find((chart) => chart.id === id) ?? (get().chart?.id === id ? get().chart : null);
    if (!source) return;
    const now = Date.now();
    const root = cloneNode(source.root);
    root.title = `${displayTitle(source.root.title)} copy`;
    root.collapsed = false;
    const chart: Chart = {
      id: crypto.randomUUID(),
      title: root.title,
      root,
      createdAt: now,
      updatedAt: now,
    };
    stamp(chart.id);
    await idbPutChart(chart);
    enqueuePush(chart);
    revokeUrls(get().urls);
    const urls = await urlsFor(chart);
    set((state) => ({
      chart,
      urls,
      charts: [{ id: chart.id, title: chart.title, updatedAt: chart.updatedAt }, ...state.charts],
      focusId: chart.root.id,
      selectedId: chart.root.id,
      mode: "table",
    }));
    remember();
  },

  patchNode: (id, patch) => {
    const chart = get().chart;
    if (!chart || !findNode(chart.root, id)) return;
    commit(retitle(chart, patchInTree(chart.root, id, patch)));
  },

  addChild: (parentId) => {
    const chart = get().chart;
    if (!chart) return;
    const parent = findNode(chart.root, parentId);
    if (!parent) return;
    const child = makeNode({
      title: childTitle(depthOf(chart.root, parentId), parent.children.length + 1),
      collapsed: false,
    });
    const root = insertChild(chart.root, parentId, child);
    commit(retitle(chart, root));
    set({ selectedId: child.id });
  },

  addChildren: (parentId, count, names) => {
    const chart = get().chart;
    if (!chart) return;
    const parent = findNode(chart.root, parentId);
    if (!parent) return;
    const titled = names?.map((name) => name.trim()).filter(Boolean).slice(0, 200);
    const total = titled?.length ? titled.length : Math.floor(count);
    if (!Number.isFinite(total) || total < 1) return;
    const depth = depthOf(chart.root, parentId);
    let index = parent.children.length;
    const children = parent.children.slice();
    const capped = Math.min(total, 200);
    for (let i = 0; i < capped; i += 1) {
      index += 1;
      children.push(makeNode({ title: titled?.[i] || `${depthLabel(depth + 1)} ${index}`, collapsed: true }));
    }
    const root = patchInTree(chart.root, parentId, { collapsed: false });
    const next = retitle(chart, insertPatchedChildren(root, parentId, children));
    commit(next);
  },

  removeNode: (id) => {
    const chart = get().chart;
    if (!chart || id === chart.root.id) return;
    const parent = findParent(chart.root, id);
    const { next, removed } = detach(chart.root, id);
    if (!removed) return;
    const mediaIds = collectMediaIds(removed);
    commit(retitle(chart, next));
    focusAfterRemoval(next, removed, parent);
    void dropOrphans(mediaIds);
  },

  moveNode: (id, dir) => {
    const chart = get().chart;
    if (!chart) return;
    const root = moveSibling(chart.root, id, dir);
    if (root === chart.root) return;
    commit(retitle(chart, root));
  },

  duplicateNode: (id) => {
    const chart = get().chart;
    if (!chart || id === chart.root.id) return;
    const node = findNode(chart.root, id);
    const parent = findParent(chart.root, id);
    if (!node || !parent) return;
    const copy = cloneNode(node);
    copy.title = `${displayTitle(node.title)} copy`;
    const index = parent.children.findIndex((child) => child.id === id);
    commit(retitle(chart, insertChild(chart.root, parent.id, copy, index + 1)));
    set({ selectedId: copy.id });
  },

  toggleCollapsed: (id) => {
    const chart = get().chart;
    if (!chart) return;
    const node = findNode(chart.root, id);
    if (!node) return;
    commit(retitle(chart, patchInTree(chart.root, id, { collapsed: !node.collapsed })));
  },

  foldLevels: (id, levels) => {
    const chart = get().chart;
    if (!chart) return;
    const node = findNode(chart.root, id);
    if (!node) return;
    const openThrough = levels === "all" ? Number.POSITIVE_INFINITY : Math.max(1, levels);
    const fold = (current: BhedNode, depth: number): BhedNode => ({
      ...current,
      collapsed: current.children.length > 0 && depth >= openThrough,
      children: current.children.map((child) => fold(child, depth + 1)),
    });
    commit(retitle(chart, mapNode(chart.root, id, () => fold(node, 0))));
  },

  goDeeper: (id) => {
    const chart = get().chart;
    if (!chart || !findNode(chart.root, id)) return;
    commit(retitle(chart, patchInTree(chart.root, id, { collapsed: false })));
    set({ focusId: id, selectedId: id, mode: "table" });
    if (typeof document === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      document.getElementById(`bhed-${id}`)?.scrollIntoView({
        block: "start",
        behavior: reduce ? "auto" : "smooth",
      });
    });
  },

  addMediaFiles: async (nodeId, files) => {
    const chart = get().chart;
    if (!chart || !files.length) return;
    const node = findNode(chart.root, nodeId);
    if (!node) return;
    const accepted = files.filter((file) => file.size <= MAX_FILE);
    if (!accepted.length) throw new Error("Files need to be 40MB or smaller");
    const chartId = chart.id;
    const refs = [];
    const urls = { ...get().urls };
    for (const file of accepted) {
      if (get().chart?.id !== chartId) return;
      const id = crypto.randomUUID();
      const kind = kindFromMime(file.type, file.name);
      await idbPutBlob(id, file);
      refs.push({ id, name: file.name || "media", mime: file.type || "application/octet-stream", kind });
      urls[id] = URL.createObjectURL(file);
    }
    const latest = get().chart;
    if (!latest || latest.id !== chartId) return;
    const live = findNode(latest.root, nodeId);
    if (!live) return;
    set({ urls });
    const root = patchMedia(latest.root, nodeId, [...live.media, ...refs], false);
    commit(retitle(latest, root));
    if (accepted.length !== files.length) {
      throw new Error("Added the smaller files. One file was over 40MB and was skipped.");
    }
  },

  removeMedia: async (nodeId, mediaId) => {
    const chart = get().chart;
    if (!chart) return;
    const node = findNode(chart.root, nodeId);
    if (!node) return;
    const root = patchMedia(
      chart.root,
      nodeId,
      node.media.filter((item) => item.id !== mediaId),
      node.collapsed,
    );
    commit(retitle(chart, root));
    await dropOrphans([mediaId]);
  },

  makeCover: (nodeId, mediaId) => {
    const chart = get().chart;
    if (!chart) return;
    const node = findNode(chart.root, nodeId);
    if (!node) return;
    const chosen = node.media.find((item) => item.id === mediaId);
    if (!chosen) return;
    const media = [chosen, ...node.media.filter((item) => item.id !== mediaId)];
    commit(retitle(chart, patchMedia(chart.root, nodeId, media, node.collapsed)));
  },

  setMode: (mode) => {
    set({ mode });
    remember();
  },

  setMapStyle: (mapStyle) => {
    set({ mapStyle });
    remember();
  },

  setSelected: (selectedId) => set({ selectedId }),
  setQuery: (query) => set({ query }),

  importFile: async (file) => {
    await flush();
    const name = file.name.replace(/\.[^.]+$/, "") || "Imported chart";
    const lower = file.name.toLowerCase();
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
      const entries = await unzip(bytes);
      const chartFile = entries.find((entry) => /(^|\/)chart\.json$/i.test(entry.name));
      if (chartFile) {
        const files = new Map<string, Blob>();
        for (const entry of entries) {
          if (entry.name.endsWith("/")) continue;
          files.set(entry.name, new Blob([new Uint8Array(entry.data)]));
        }
        const imported = await importJson(new TextDecoder().decode(chartFile.data), files);
        await keepImported(imported);
        return;
      }
    }
    const text = await readImportText(file);
    const trimmed = text.trim();
    const head = trimmed.slice(0, 1200).toLowerCase();
    const looksOpml =
      lower.endsWith(".opml") ||
      lower.endsWith(".xml") ||
      head.includes("<opml") ||
      head.includes("<outline");
    const imported = looksOpml
      ? importOpml(text, name)
      : lower.endsWith(".json") || trimmed.startsWith("{") || trimmed.startsWith("[")
        ? await importJson(text)
        : await importMarkdown(text, name);
    await keepImported(imported);
  },

  exportChart: async (kind) => {
    await flush();
    const chart = get().chart;
    if (!chart) throw new Error("Nothing to export");
    const base = fileBase(displayTitle(chart.root.title));
    const getBlob = (id: string) => idbGetBlob(id);
    if (kind === "zip") {
      const packed = await chartToZip(chart, getBlob);
      downloadBlob(`${base}.bhed.zip`, packed.blob);
      return packed.files;
    }
    if (kind === "opml") {
      const opml = await chartToOpml(chart, getBlob);
      downloadBlob(`${base}.opml`, new Blob([opml], { type: "text/xml;charset=utf-8" }));
      return collectMediaIds(chart.root).length;
    }
    if (kind === "md") {
      const markdown = await chartToMarkdown(chart, getBlob);
      downloadBlob(`${base}.md`, new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
      return collectMediaIds(chart.root).length;
    }
    const json = await chartToJson(chart, getBlob);
    downloadBlob(`${base}.bhed.json`, new Blob([json], { type: "application/json" }));
    return collectMediaIds(chart.root).length;
  },

  listVersions: async (chartId) => {
    const rows = await idbVersions(chartId);
    return rows.map((row) => ({ id: row.id, title: row.title, savedAt: row.savedAt }));
  },

  restoreVersion: async (versionId) => {
    await flush();
    const version = await idbGetVersion(versionId);
    if (!version) throw new Error("That version is gone");
    const current = get().chart;
    if (current && current.id === version.chartId) {
      await idbPutVersion({
        id: crypto.randomUUID(),
        chartId: current.id,
        title: displayTitle(current.root.title),
        savedAt: Date.now(),
        chart: current,
      });
    }
    const chart: Chart = { ...version.chart, id: version.chartId, updatedAt: Date.now() };
    stamp(chart.id);
    await idbPutChart(chart);
    enqueuePush(chart);
    revokeUrls(get().urls);
    const urls = await urlsFor(chart);
    const currentFocus = get().focusId;
    const focusId = currentFocus && findNode(chart.root, currentFocus) ? currentFocus : chart.root.id;
    set((state) => {
      const rest = state.charts.filter((item) => item.id !== chart.id);
      return {
        chart,
        urls,
        focusId,
        selectedId: chart.root.id,
        charts: [{ id: chart.id, title: chart.title, updatedAt: chart.updatedAt }, ...rest].sort(
          (a, b) => b.updatedAt - a.updatedAt,
        ),
      };
    });
  },

  saveToCloud: async () => {
    const accountId = get().accountId;
    if (!accountId) throw new Error("Sign in to save");
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    const current = get().chart;
    if (current) await idbPutChart(current);
    const charts = (await idbAllCharts()).filter((chart) => {
      const owner = ownerOf(chart.id);
      return owner === accountId || owner === "guest";
    });
    if (!charts.length) throw new Error("Nothing to save");
    set({ saveState: "saving" });
    try {
      let files = 0;
      let skipped = 0;
      for (const chart of charts) {
        const result = await pushChart(chart, chart.id === current?.id);
        setOwner(chart.id, accountId);
        files += result.files;
        skipped += result.skipped;
      }
      set({ saveState: "saved" });
      return { files, skipped };
    } catch (err) {
      set({ saveState: "error" });
      const message = err instanceof Error ? err.message : "Could not save to your account";
      if (message === "Unauthorized") throw new Error("Sign in, then save again");
      throw err instanceof Error ? err : new Error(message);
    }
  },
}));

function insertPatchedChildren(root: BhedNode, parentId: string, children: BhedNode[]): BhedNode {
  const swap = (node: BhedNode): BhedNode => {
    if (node.id === parentId) return { ...node, children, collapsed: false };
    let changed = false;
    const nextChildren = node.children.map((child) => {
      const next = swap(child);
      if (next !== child) changed = true;
      return next;
    });
    return changed ? { ...node, children: nextChildren } : node;
  };
  return swap(root);
}

function patchMedia(root: BhedNode, id: string, media: BhedNode["media"], collapsed: boolean): BhedNode {
  const swap = (node: BhedNode): BhedNode => {
    if (node.id === id) return { ...node, media, collapsed };
    let changed = false;
    const children = node.children.map((child) => {
      const next = swap(child);
      if (next !== child) changed = true;
      return next;
    });
    return changed ? { ...node, children } : node;
  };
  return swap(root);
}
