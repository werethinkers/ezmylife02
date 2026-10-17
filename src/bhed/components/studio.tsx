import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Copy, Download, History, Library, Network, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AccountBar } from "@/bhed/components/account-bar";
import { AddCount, DiveTab } from "@/bhed/components/dive-tab";
import { MindMap } from "@/bhed/components/mind-map";
import { TopicEditor } from "@/bhed/components/topic-editor";
import { ancestors, depthOf, findNode, insideStats, splitCounts } from "@/bhed/lib/tree";
import { isImportFile } from "@/bhed/lib/impex";
import { useBhed } from "@/bhed/lib/store";
import { depthLabel, displayTitle, MAP_STYLES, type BhedNode, type MapStyle } from "@/bhed/lib/types";
import { cn } from "@/lib/utils";

const iconBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-3 text-sm text-ink hover:bg-muted";
const quietBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-ink bg-card px-4 text-sm text-ink hover:bg-muted";
const primaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-ink bg-pink px-4 text-sm font-semibold text-ink shadow-block-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

function deepest(node: BhedNode): number {
  if (!node.children.length) return 0;
  return 1 + Math.max(...node.children.map(deepest));
}

function TableLevel({
  focus,
  depth,
  onOpen,
  onAddMany,
  presenting,
}: {
  focus: BhedNode;
  depth: number;
  onOpen: (id: string) => void;
  onAddMany: (count: number, names?: string[]) => void;
  presenting: boolean;
}) {
  const foldLevels = useBhed((state) => state.foldLevels);
  const here = focus.children.length;
  const { next, leaves } = splitCounts(focus);
  const nextLabel = depthLabel(depth + 1);
  const countingBhed = depth === 0;
  const branched = leaves > next;
  const levels = Math.min(6, deepest(focus));
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("count-badge", countingBhed ? "count-bhed" : "count-prabhed")} title={`${here} ${nextLabel}`}>
            {here}
          </span>
          <span className={cn("text-sm font-bold", countingBhed ? "text-bhed" : "text-prabhed")}>
            {here > 0 ? nextLabel : `No ${nextLabel} yet`}
          </span>
          {next > 0 && (
            <>
              <span className={cn("count-badge", branched ? "count-bhed" : "count-prabhed")} title={`${next} directly inside`}>
                {next}
              </span>
              <span className={cn("text-sm font-bold", branched ? "text-bhed" : "text-prabhed")}>
                {branched && depth > 0 ? "भेद" : "प्रभेद"}
              </span>
            </>
          )}
          {branched && (
            <>
              <span className="count-badge count-prabhed" title="Every प्रभेद under those भेद">
                {leaves}
              </span>
              <span className="text-sm font-bold text-prabhed">प्रभेद</span>
            </>
          )}
        </div>
        <AddCount label={nextLabel} hidden={presenting} onAdd={onAddMany} />
      </div>
      {!presenting && focus.children.length > 0 && (
        <div className="fold-bar">
          <button type="button" className="fold-btn" onClick={() => foldLevels(focus.id, 1)}>
            Collapse all
          </button>
          <button type="button" className="fold-btn" onClick={() => foldLevels(focus.id, "all")}>
            Expand all
          </button>
          {levels > 1 && (
            <div className="flex items-center gap-1">
              <span className="px-1 text-xs font-semibold tracking-wide text-muted-foreground">Levels</span>
              {Array.from({ length: levels }, (_, index) => index + 1).map((level) => (
                <button
                  key={level}
                  type="button"
                  className="fold-level"
                  aria-label={`Open ${level} ${level === 1 ? "level" : "levels"}`}
                  onClick={() => foldLevels(focus.id, level)}
                >
                  {level}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {focus.children.length > 0 && (
        <div className="tab-list">
          {focus.children.map((child, index) => (
            <DiveTab
              key={child.id}
              node={child}
              depth={depth + 1}
              index={index}
              siblingCount={focus.children.length}
              number={String(index + 1)}
              onOpen={onOpen}
              presenting={presenting}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function Studio() {
  const ready = useBhed((state) => state.ready);
  const error = useBhed((state) => state.error);
  const charts = useBhed((state) => state.charts);
  const chart = useBhed((state) => state.chart);
  const focusId = useBhed((state) => state.focusId);
  const selectedId = useBhed((state) => state.selectedId);
  const mode = useBhed((state) => state.mode);
  const mapStyle = useBhed((state) => state.mapStyle);
  const query = useBhed((state) => state.query);
  const createChart = useBhed((state) => state.createChart);
  const openChart = useBhed((state) => state.openChart);
  const deleteChart = useBhed((state) => state.deleteChart);
  const duplicateChart = useBhed((state) => state.duplicateChart);
  const addChild = useBhed((state) => state.addChild);
  const addChildren = useBhed((state) => state.addChildren);
  const goDeeper = useBhed((state) => state.goDeeper);
  const toggleCollapsed = useBhed((state) => state.toggleCollapsed);
  const setMode = useBhed((state) => state.setMode);
  const setMapStyle = useBhed((state) => state.setMapStyle);
  const setSelected = useBhed((state) => state.setSelected);
  const setQuery = useBhed((state) => state.setQuery);
  const importFile = useBhed((state) => state.importFile);
  const exportChart = useBhed((state) => state.exportChart);
  const listVersions = useBhed((state) => state.listVersions);
  const restoreVersion = useBhed((state) => state.restoreVersion);

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showMedia, setShowMedia] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<{ id: string; title: string; savedAt: number }[]>([]);
  const importRef = useRef<HTMLInputElement>(null);

  const path = useMemo(() => {
    if (!chart || !focusId) return [];
    return ancestors(chart.root, focusId);
  }, [chart, focusId]);

  const focus = path[path.length - 1] ?? chart?.root ?? null;
  const focusDepth = Math.max(0, path.length - 1);
  const parent = path.length > 1 ? path[path.length - 2]! : null;

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!chart || !q) return [];
    const found: { id: string; crumb: string }[] = [];
    const visit = (node: typeof chart.root, trail: string[]) => {
      const crumb = [...trail, displayTitle(node.title)];
      if (`${node.title}\n${node.body}`.toLowerCase().includes(q)) {
        found.push({ id: node.id, crumb: crumb.join(" / ") });
      }
      node.children.forEach((child) => visit(child, crumb));
    };
    visit(chart.root, []);
    return found;
  }, [chart, query]);

  const runImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      await importFile(file);
      const imported = useBhed.getState().chart;
      const parts = imported ? insideStats(imported.root).total : 0;
      toast.success(parts > 0 ? `Read the mind map · ${parts} parts` : "Imported as a new chart");
      setLibraryOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not import that file");
    }
  };

  const runExport = async (kind: "json" | "md" | "opml" | "zip") => {
    try {
      const files = await exportChart(kind);
      toast.success(files > 0 ? `Download started · ${files} media file${files === 1 ? "" : "s"}` : "Download started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export");
    }
  };

  useEffect(() => {
    if (!historyOpen || !chart) return;
    void listVersions(chart.id).then(setVersions);
  }, [historyOpen, chart, listVersions]);

  return (
    <div
      className="bhed-root flex h-[calc(100dvh-4.5rem)] min-h-[34rem] flex-col bg-background text-ink"
      onDragOver={(event) => {
        if ([...event.dataTransfer.types].includes("Files")) event.preventDefault();
      }}
      onDrop={(event) => {
        const outline = [...event.dataTransfer.files].find(isImportFile);
        if (!outline) return;
        event.preventDefault();
        void runImport(outline);
      }}
    >
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b-2 border-ink px-3 py-2 sm:px-4">
        <button type="button" className={iconBtn} aria-label="Charts" onClick={() => setLibraryOpen(true)}>
          <Library className="size-4" />
          <span className="hidden sm:inline">Charts</span>
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-pink shadow-block-sm" aria-hidden><Network className="size-4" /></span>
          <p className="truncate font-display text-lg leading-none">
            Bhed<span className="hidden md:inline"> Prabhed</span>
          </p>
        </div>
        <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1 sm:gap-2">
          <div className="flex rounded-full bg-muted p-1">
            <button
              type="button"
              aria-pressed={mode === "table"}
              className={cn("h-11 rounded-full px-3 text-sm sm:px-4", mode === "table" ? "bg-card font-semibold text-ink" : "text-muted-foreground")}
              onClick={() => setMode("table")}
            >
              Table
            </button>
            <button
              type="button"
              aria-pressed={mode === "map"}
              className={cn("h-11 rounded-full px-3 text-sm sm:px-4", mode === "map" ? "bg-card font-semibold text-ink" : "text-muted-foreground")}
              onClick={() => setMode("map")}
            >
              Map
            </button>
            <button
              type="button"
              aria-pressed={presenting}
              className={cn("h-11 rounded-full px-3 text-sm sm:px-4", presenting ? "bg-card font-semibold text-ink" : "text-muted-foreground")}
              onClick={() => {
                setPresenting((value) => !value);
                if (!presenting) setShowMedia(false);
              }}
            >
              Present
            </button>
          </div>
          <AccountBar />
          <button type="button" className={iconBtn} aria-label="Import" onClick={() => importRef.current?.click()}>
            <Upload className="size-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <details className="relative">
            <summary className={cn(iconBtn, "list-none")} aria-label="Export">
              <Download className="size-4" />
              <span className="hidden sm:inline">Export</span>
            </summary>
            <div className="menu-pop absolute right-0 z-30 mt-1 w-64 rounded-xl bg-card p-1">
              <button type="button" className={cn(iconBtn, "h-auto w-full flex-col items-start py-2")} onClick={() => void runExport("zip")}>
                <span>Chart with media</span>
                <span className="text-xs font-normal text-muted-foreground">A zip of the chart and every file</span>
              </button>
              <button type="button" className={cn(iconBtn, "h-auto w-full flex-col items-start py-2")} onClick={() => void runExport("json")}>
                <span>Bhed file</span>
                <span className="text-xs font-normal text-muted-foreground">One file, images and video inside</span>
              </button>
              <button type="button" className={cn(iconBtn, "h-auto w-full flex-col items-start py-2")} onClick={() => void runExport("md")}>
                <span>Markdown</span>
                <span className="text-xs font-normal text-muted-foreground">Headings and media</span>
              </button>
              <button type="button" className={cn(iconBtn, "h-auto w-full flex-col items-start py-2")} onClick={() => void runExport("opml")}>
                <span>OPML</span>
                <span className="text-xs font-normal text-muted-foreground">Outline, notes, and smaller pictures</span>
              </button>
            </div>
          </details>
          <button
            type="button"
            className={iconBtn}
            aria-label="Earlier versions"
            aria-pressed={historyOpen}
            onClick={() => setHistoryOpen((value) => !value)}
          >
            <History className="size-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
        <label className="relative order-last w-full sm:order-none sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search this chart"
            placeholder="Search"
            className="h-11 w-full rounded-full border-2 border-ink bg-card pr-3 pl-9 text-sm outline-none"
          />
        </label>
        <input
          ref={importRef}
          type="file"
          accept=".opml,.xml,.mindz,.zip,.md,.markdown,.txt,.json,text/x-opml,text/xml,application/xml,application/octet-stream,text/markdown,application/json,*/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void runImport(file);
          }}
        />
      </header>

      {query.trim() && hits.length > 0 && (
        <div className="shrink-0 border-b-2 border-ink bg-card px-4 py-2">
          <p className="text-xs text-muted-foreground">
            <span className="tabular-nums">{hits.length}</span> matching {hits.length === 1 ? "cell" : "cells"}
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {hits.slice(0, 6).map((hit) => (
              <button key={hit.id} type="button" className={quietBtn} onClick={() => goDeeper(hit.id)}>
                <span className="max-w-64 truncate">{hit.crumb}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "map" && chart && (
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b-2 border-ink px-3 py-2">
          {MAP_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              title={style.hint}
              aria-pressed={mapStyle === style.id}
              className={cn(iconBtn, "shrink-0", mapStyle === style.id && "bg-ink text-background hover:bg-ink")}
              onClick={() => setMapStyle(style.id as MapStyle)}
            >
              {style.label}
            </button>
          ))}
          {selectedId && (
            <button type="button" className={cn(quietBtn, "ml-auto shrink-0")} onClick={() => goDeeper(selectedId)}>
              Open in table
            </button>
          )}
        </div>
      )}
      {mode === "map" && chart && (
        <p className="shrink-0 px-4 pb-1 text-xs text-muted-foreground">A number means that branch is folded. Tap it to open. Tap − to fold.</p>
      )}

      <div className="min-h-0 flex-1">
        {!ready && (
          <div className="flex h-full items-center justify-center px-6">
            <p className="font-display text-2xl">Opening your charts…</p>
          </div>
        )}
        {ready && error && (
          <div className="mx-auto max-w-lg px-6 py-16 text-center">
            <h1 className="font-display text-3xl">Charts didn’t open</h1>
            <p className="mt-3 text-muted-foreground">{error}</p>
          </div>
        )}
        {ready && !error && !chart && (
          <div className="mx-auto max-w-lg px-6 py-16">
            <h1 className="font-display text-4xl text-balance">Start a chart</h1>
            <p className="mt-3 text-muted-foreground">
              One topic becomes a table of भेद. Each of those can open into प्रभेद, and those can open again.
            </p>
            <button type="button" className={cn(primaryBtn, "mt-6")} onClick={() => void createChart()}>
              <Plus className="size-4" />
              New chart
            </button>
          </div>
        )}
        {ready && chart && focus && mode === "table" && (
          <div className="h-full overflow-auto">
            <div className="mx-auto grid max-w-5xl gap-4 px-4 py-4 pb-16">
              {path.length > 1 && (
                <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                  {parent && (
                    <button
                      type="button"
                      className="inline-flex h-11 items-center gap-1 pr-2"
                      aria-label={`Back to ${displayTitle(parent.title)}`}
                      onClick={() => goDeeper(parent.id)}
                    >
                      <ArrowLeft className="size-4" />
                      Back
                    </button>
                  )}
                  {path.slice(0, -1).map((node, index) => (
                    <span key={node.id} className="inline-flex items-center gap-1">
                      {index > 0 && <span aria-hidden>/</span>}
                      <button type="button" className="h-11 hover:text-ink" onClick={() => goDeeper(node.id)}>
                        {displayTitle(node.title)}
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {!presenting ? (
                <TopicEditor node={focus} showMedia={showMedia} onToggleMedia={() => setShowMedia((value) => !value)} />
              ) : (
                focus.body.trim() && <p className="text-pretty text-ink">{focus.body}</p>
              )}
              <TableLevel
                focus={focus}
                depth={focusDepth}
                onOpen={goDeeper}
                onAddMany={(count, names) => addChildren(focus.id, count, names)}
                presenting={presenting}
              />
              {!presenting && (
                <button type="button" className={quietBtn} onClick={() => addChild(focus.id)}>
                  <Plus className="size-4" />
                  Add {depthLabel(focusDepth + 1)}
                </button>
              )}
            </div>
          </div>
        )}
        {ready && chart && mode === "map" && (
          <div className="map-stage">
            <MindMap
              key={`${chart.id}-${mapStyle}`}
              root={chart.root}
              mapStyle={mapStyle}
              selectedId={selectedId}
              onSelect={setSelected}
              onToggle={toggleCollapsed}
            />
            {chart && selectedId && findNode(chart.root, selectedId) && (
              <aside className="map-editor">
                <p className="text-xs font-semibold tracking-wide text-primary">
                  {depthLabel(depthOf(chart.root, selectedId))}
                </p>
                <TopicEditor
                  node={findNode(chart.root, selectedId)!}
                  showMedia={showMedia}
                  onToggleMedia={() => setShowMedia((value) => !value)}
                />
                <button
                  type="button"
                  className={primaryBtn}
                  onClick={() => {
                    goDeeper(selectedId);
                    setMode("table");
                  }}
                >
                  Open this table
                </button>
              </aside>
            )}
          </div>
        )}
      </div>

      {historyOpen && chart && (
        <div className="fixed inset-0 z-40">
          <button type="button" aria-label="Close history" className="absolute inset-0 bg-ink/40" onClick={() => setHistoryOpen(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-80 max-w-full flex-col bg-card">
            <div className="border-b-2 border-ink px-4 py-3">
              <h2 className="font-display text-xl">Earlier versions</h2>
              <p className="mt-1 text-sm text-muted-foreground">A new version is kept as you work. Restoring saves the current chart first.</p>
            </div>
            <ul className="min-h-0 flex-1 overflow-auto px-2 py-2">
              {versions.length === 0 && <li className="px-3 py-4 text-sm text-muted-foreground">No earlier version yet. Edit the chart and one will appear.</li>}
              {versions.map((version) => (
                <li key={version.id}>
                  <button
                    type="button"
                    className="w-full rounded-xl px-3 py-3 text-left hover:bg-muted"
                    onClick={() => {
                      void restoreVersion(version.id)
                        .then(() => listVersions(chart.id).then(setVersions))
                        .then(() => {
                          toast.success("Restored that version");
                          setHistoryOpen(false);
                        })
                        .catch((err) => toast.error(err instanceof Error ? err.message : "Could not restore"));
                    }}
                  >
                    <span className="block font-semibold">{version.title}</span>
                    <span className="block text-xs text-muted-foreground">{formatDistanceToNow(version.savedAt, { addSuffix: true })}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}

      {libraryOpen && (
        <div className="fixed inset-0 z-40">
          <button type="button" aria-label="Close charts" className="absolute inset-0 bg-ink/40" onClick={() => setLibraryOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-full flex-col bg-card">
            <div className="flex items-center justify-between gap-2 border-b-2 border-ink px-4 py-3">
              <div>
                <h2 className="font-display text-xl">Charts</h2>
                <p className="text-sm text-muted-foreground">Topics, split finer and finer.</p>
              </div>
            </div>
            <div className="px-3 py-3">
              <button
                type="button"
                className={cn(primaryBtn, "w-full")}
                onClick={() => {
                  void createChart();
                  setLibraryOpen(false);
                }}
              >
                <Plus className="size-4" />
                New chart
              </button>
            </div>
            <ul className="min-h-0 flex-1 overflow-auto px-2 pb-6">
              {charts.map((item) => {
                const active = item.id === chart?.id;
                return (
                  <li key={item.id} className={cn("mb-1 rounded-xl", active && "bg-pink/30")}>
                    <div className="flex items-center">
                      <button
                        type="button"
                        className="min-w-0 flex-1 px-3 py-2 text-left"
                        onClick={() => {
                          void openChart(item.id);
                          setLibraryOpen(false);
                        }}
                      >
                        <span className="block truncate font-semibold">{displayTitle(item.title)}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDistanceToNow(item.updatedAt, { addSuffix: true })}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Duplicate ${displayTitle(item.title)}`}
                        className="inline-flex size-11 items-center justify-center"
                        onClick={() => void duplicateChart(item.id)}
                      >
                        <Copy className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${displayTitle(item.title)}`}
                        className="inline-flex size-11 items-center justify-center text-primary"
                        onClick={() => setConfirmDelete(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    {confirmDelete === item.id && (
                      <div className="px-3 pb-3">
                        <p className="text-sm text-ink">Delete “{displayTitle(item.title)}”? This cannot be undone.</p>
                        <div className="mt-2 flex gap-2">
                          <button type="button" className={quietBtn} onClick={() => setConfirmDelete(null)}>
                            Cancel
                          </button>
                          <button
                            type="button"
                            className={primaryBtn}
                            onClick={() => {
                              setConfirmDelete(null);
                              void deleteChart(item.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
