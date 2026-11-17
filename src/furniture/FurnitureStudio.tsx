// Furniture Sheets: photo in, technical design sheet out (Gemini), plus views, colourways and room scenes.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Armchair, Boxes, Check, ClipboardCopy, Download, FileSpreadsheet, FileText, Images, Layers, Loader2, Palette, PencilRuler,
  Printer, Ruler, Share2, Sofa, Sparkles, Stamp, Trash2, Wand2, WandSparkles, FolderArchive, ScrollText, History,
} from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BuyCreditsDialog } from "@/components/wallet/BuyCreditsDialog";
import LoginPromptDialog from "@/components/auth/LoginPromptDialog";
import { useToolPricing } from "@/hooks/useToolPricing";
import { useRefreshWallet } from "@/hooks/useWallet";
import { AppCallError } from "@/lib/credits";
import { cn } from "@/lib/utils";
import {
  COLOURWAYS, DEFAULT_PRICES, ROOMS, SHEET_TYPES, STYLE_OPTIONS, TIERS, VIEWS,
  analyzePhoto, bomCsv, convertDims, copyImage, downloadBom, downloadImage, downloadPdf, downloadSpecJson, downloadZip, drawSheet,
  emptyMeta, fileToPhoto, loadItems, makePicture, normaliseSpec, printImage, removeItem, saveItem, shareImage, uid,
  type Item, type Meta, type Output, type OutputKind, type Spec,
} from "./lib";
import { BomEditor, Compare, Dropzone, Field, HScroll, MerlinBar, Panel, Viewer } from "./ui";
import { composeSheet } from "./compose";

const EXAMPLES = [
  { id: "ex-sofa", title: "Curved sofa", line: "Light drafting, full sheet", before: "/furniture-samples/sofa-photo.jpg", after: "/furniture-samples/sofa-sheet-light.jpg" },
  { id: "ex-louis", title: "Carved sofa", line: "Blueprint CAD, full sheet", before: "", after: "/furniture-samples/sofa-sheet-blueprint.jpg" },
  { id: "ex-cornice", title: "Cornice trim", line: "Blueprint CAD, details", before: "", after: "/furniture-samples/cornice-sheet-blueprint.jpg" },
];

const QUICK_EDITS = ["Make the background pure white", "Make all lines thicker and darker", "Add a bigger title above the drawing", "Show all dimensions in inches"];

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const num = (v: string) => (v === "" ? 0 : Math.max(0, Number(v) || 0));

type Busy = { itemId: string; label: string } | null;

export function FurnitureStudio() {
  const refreshWallet = useRefreshWallet();
  const aP = useToolPricing("furniture-analyze");
  const qP = useToolPricing("furniture-sheet-quick");
  const sP = useToolPricing("furniture-sheet");
  const pP = useToolPricing("furniture-sheet-pro");
  const iP = useToolPricing("furniture-image");
  // No price row yet means the first use will create it at the default.
  const price = {
    analyze: aP.costInr > 0 ? aP.creditCost : DEFAULT_PRICES.analyze,
    quick: qP.costInr > 0 ? qP.creditCost : DEFAULT_PRICES.quick,
    standard: sP.costInr > 0 ? sP.creditCost : DEFAULT_PRICES.standard,
    premium: pP.costInr > 0 ? pP.creditCost : DEFAULT_PRICES.premium,
    image: iP.costInr > 0 ? iP.creditCost : DEFAULT_PRICES.image,
  };
  /** What drawing this piece's sheet costs now: the materials-and-parts sheet is made in the browser, so it is free. */
  const sheetCost = (it: Item) => (it.sheetType === "bom" && it.hybrid !== false ? 0 : price[it.tier ?? "standard"]);

  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [outId, setOutId] = useState<string | null>(null);
  const [exampleIx, setExampleIx] = useState(0);
  const [mode, setMode] = useState<"result" | "compare">("result");
  const [open, setOpen] = useState<string | undefined>(undefined); // one accordion open at a time, all closed at first
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [readFirst, setReadFirst] = useState(true);
  const [buy, setBuy] = useState({ open: false, required: 0, balance: 0 });
  const [login, setLogin] = useState(false);
  const [editText, setEditText] = useState("");
  const [colourText, setColourText] = useState("");
  const [qty, setQty] = useState(1);
  const dirty = useRef(new Set<string>());

  // Saved work comes back from this browser.
  useEffect(() => {
    void loadItems().then((all) => { setItems(all); setActiveId(all[0]?.id ?? null); setLoaded(true); });
  }, []);

  // Save changed items shortly after the last change.
  useEffect(() => {
    if (!loaded || !dirty.current.size) return;
    const t = setTimeout(() => {
      for (const id of Array.from(dirty.current)) {
        const it = items.find((i) => i.id === id);
        if (it) void saveItem(it);
        dirty.current.delete(id);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [items, loaded]);

  const active = items.find((i) => i.id === activeId) ?? null;
  const outputs = useMemo(() => (active?.outputs ?? []).slice().sort((a, b) => b.createdAt - a.createdAt), [active]);
  const q = query.trim().toLowerCase();
  const shownItems = q ? items.filter((i) => [i.name, i.spec?.category, i.spec?.style, ...(i.spec?.tags ?? []), ...i.outputs.map((o) => o.label)].join(" ").toLowerCase().includes(q)) : items;
  const shownOutputs = q ? outputs.filter((o) => `${o.label} ${o.kind}`.toLowerCase().includes(q)) : outputs;
  const current: Output | null = outputs.find((o) => o.id === outId) ?? outputs[0] ?? null;

  const patch = useCallback((id: string, fn: (i: Item) => Partial<Item>) => {
    dirty.current.add(id);
    setItems((all) => all.map((i) => (i.id === id ? { ...i, ...fn(i), updatedAt: Date.now() } : i)));
  }, []);

  const setSpec = (it: Item, fn: (s: Spec) => Spec) => patch(it.id, (i) => ({ spec: fn(i.spec ?? normaliseSpec({ name: i.name })) }));
  const setMeta = (it: Item, m: Partial<Meta>) => patch(it.id, (i) => ({ meta: { ...i.meta, ...m } }));

  // ─── adding photos ──────────────────────────────────────────────────────────────────────────
  const addFiles = async (files: File[]) => {
    const made: Item[] = [];
    for (const f of files) {
      try {
        const photo = await fileToPhoto(f);
        made.push({
          id: uid(), name: f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").slice(0, 60) || "Furniture piece", photo,
          meta: emptyMeta(), style: "light", sheetType: "full", unit: "mm", materials: "", notes: "", outputs: [], createdAt: Date.now(), updatedAt: Date.now(),
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "A photo could not be read.");
      }
    }
    if (!made.length) return;
    made.forEach((m) => dirty.current.add(m.id));
    setItems((all) => [...made, ...all]);
    setActiveId(made[0].id);
    setOutId(null);
    toast.success(made.length === 1 ? "Photo added." : `${made.length} photos added.`);
  };

  // ─── running things on the server ───────────────────────────────────────────────────────
  const fail = async (e: unknown) => {
    if (e instanceof AppCallError) {
      if (e.status === 401) return setLogin(true);
      if (e.status === 402) return setBuy({ open: true, required: e.data?.credits_required ?? 0, balance: e.data?.balance ?? 0 });
      return void toast.error(`${e.message || "That did not work."} You were not charged.`);
    }
    toast.error("That did not work. You were not charged.");
  };

  const guard = async <T,>(itemId: string, label: string, run: () => Promise<T>): Promise<T | null> => {
    setBusy({ itemId, label });
    try {
      const r = await run();
      refreshWallet();
      return r;
    } catch (e) {
      await fail(e);
      return null;
    } finally {
      setBusy(null);
    }
  };

  const pushOutput = (id: string, kind: OutputKind, label: string, url: string) => {
    const o: Output = { id: uid(), kind, label, url, createdAt: Date.now() };
    patch(id, (i) => ({ outputs: [...i.outputs, o] }));
    setOutId(o.id);
    setMode("result");
    return o;
  };

  const analyse = async (it: Item): Promise<Item> => {
    const r = await guard(it.id, "Reading the photo", () => analyzePhoto(it.photo));
    if (!r?.spec) return it;
    const fresh = normaliseSpec(r.spec);
    // Sizes the person already typed win over the model's guess.
    const mine = it.spec?.dimensions;
    if (mine && (mine.width || mine.depth || mine.height)) fresh.dimensions = { ...fresh.dimensions, ...Object.fromEntries(Object.entries(mine).filter(([k, v]) => k !== "unit" && Number(v) > 0)) } as Spec["dimensions"];
    const spec = it.unit === "in" ? convertDims(fresh, "in") : fresh;
    patch(it.id, () => ({ spec, name: spec.name }));
    toast.success("Photo read. Check the parts list, then draw the sheet.");
    return { ...it, spec, name: spec.name };
  };

  const sheet = async (it: Item, auto = true): Promise<boolean> => {
    let cur = it;
    if (auto && readFirst && !cur.spec) {
      cur = await analyse(cur);
      if (!cur.spec) return false;
    }
    const label = `${STYLE_OPTIONS.find((s) => s.id === cur.style)?.name} · ${SHEET_TYPES.find((s) => s.id === cur.sheetType)?.name}`;
    // Materials-and-parts sheet: made here from the editable table, no AI picture, no charge.
    if (cur.sheetType === "bom" && cur.hybrid !== false) {
      if (!cur.spec) { toast.error("Read the photo first so there is a parts list to put on the sheet."); return false; }
      const url = await composeSheet(cur, null).catch(() => null);
      if (!url) { toast.error("The sheet could not be made."); return false; }
      pushOutput(cur.id, "sheet", label, url);
      toast.success("Your sheet is ready. It cost no credits.");
      return true;
    }
    const r = await guard(cur.id, "Drawing the sheet. This takes about a minute", () => drawSheet(cur));
    if (!r?.image) return false;
    let url = r.image;
    // The AI drew the drawings; the table, notes and title block are added here as exact text.
    if (r.hybrid) url = await composeSheet(cur, r.image).catch(() => r.image);
    pushOutput(cur.id, "sheet", label, url);
    toast.success("Your design sheet is ready.");
    return true;
  };

  const picture = async (it: Item, kind: OutputKind, label: string, extra: Record<string, string> = {}, source?: string) => {
    const r = await guard(it.id, `Making: ${label}`, () => makePicture(source ?? it.photo, kind, extra));
    if (r?.image) { pushOutput(it.id, kind, label, r.image); toast.success(`${label} is ready.`); return true; }
    return false;
  };

  const drawAll = async () => {
    let done = 0;
    for (const it of items) {
      if (it.outputs.some((o) => o.kind === "sheet")) continue;
      setActiveId(it.id);
      if (!(await sheet(it))) break;
      done += 1;
    }
    if (done) toast.success(`${done} sheet${done > 1 ? "s" : ""} drawn.`);
  };

  const dropOutput = (it: Item, id: string) => { patch(it.id, (i) => ({ outputs: i.outputs.filter((o) => o.id !== id) })); if (outId === id) setOutId(null); };
  const dropItem = async (id: string) => {
    await removeItem(id);
    setItems((all) => { const rest = all.filter((i) => i.id !== id); if (activeId === id) setActiveId(rest[0]?.id ?? null); return rest; });
  };

  const isBusy = !!busy;
  const unsheeted = items.filter((i) => !i.outputs.some((o) => o.kind === "sheet")).length;
  const btn = (credits: number) => <span className="ml-1.5 rounded-full bg-ink/10 px-1.5 py-0.5 text-xs font-bold">{credits} credits</span>;
  const run = (fn: () => void | Promise<unknown>) => () => { if (!isBusy) void fn(); };

  // ─── screen ───────────────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:pt-12">
      <header className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-lime px-3 py-1 text-[13px] font-bold"><PencilRuler className="h-3.5 w-3.5" /> Studio for furniture makers and designers</span>
        <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.08] sm:text-5xl">
          One photo in, a <span className="marker">full design sheet</span> out
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Upload a picture of a sofa, chair, table or any piece. Get a workshop-style sheet with exploded view, sizes, section, details, materials and a parts list. Make catalogue views, new colours and room scenes from the same photo.
        </p>
        <MerlinBar className="mt-6 max-w-2xl" value={query} onChange={setQuery} placeholder="Search your sheets, pictures and parts" />
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* ───────── Left: add photos and set up ───────── */}
        <div className="min-w-0 space-y-5 lg:col-span-5">
          <Dropzone onFiles={addFiles} busy={isBusy} />

          {items.length > 0 && (
            <section aria-label="Your photos">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="font-display text-base font-bold">Your pieces ({shownItems.length}{q ? ` of ${items.length}` : ""})</h2>
                {items.length > 1 && unsheeted > 0 && (
                  <Button size="sm" onClick={run(drawAll)} disabled={isBusy} className="shrink-0">
                    <Layers className="mr-1.5 h-4 w-4" /> Draw all ({unsheeted})
                  </Button>
                )}
              </div>
              <HScroll>
                {shownItems.map((it) => (
                  <div key={it.id} className="group relative shrink-0 [scroll-snap-align:start]">
                    <button
                      type="button"
                      onClick={() => { setActiveId(it.id); setOutId(null); }}
                      aria-pressed={it.id === activeId}
                      className={cn("block w-28 overflow-hidden rounded-2xl border-2 border-ink bg-card text-left shadow-block-sm transition-transform hover:-translate-y-0.5", it.id === activeId && "bg-sun shadow-block")}
                    >
                      <img src={it.photo} alt={it.name} className="aspect-square w-full bg-card object-cover" />
                      <span className="block truncate px-2 py-1.5 text-xs font-bold">{it.name}</span>
                    </button>
                    {it.outputs.length > 0 && <span className="absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ink bg-teal px-1 text-[11px] font-bold">{it.outputs.length}</span>}
                    <button type="button" aria-label={`Remove ${it.name}`} onClick={() => void dropItem(it.id)} className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-card hover:bg-coral group-hover:flex group-focus-within:flex">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {!shownItems.length && <p className="py-4 text-sm text-muted-foreground">Nothing matches “{query}”.</p>}
              </HScroll>
            </section>
          )}

          {active && (
            <div className="block-card space-y-3 bg-sun p-4">
              <div className="flex items-center gap-3">
                <img src={active.photo} alt="" className="h-14 w-14 shrink-0 rounded-xl border-2 border-ink bg-card object-cover" />
                <div className="min-w-0 flex-1">
                  <Input value={active.name} onChange={(e) => patch(active.id, () => ({ name: e.target.value }))} aria-label="Name of this piece" className="h-10 border-2 border-ink bg-card font-display text-[15px] font-bold" />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
                <input type="checkbox" checked={readFirst} onChange={(e) => setReadFirst(e.target.checked)} className="h-4 w-4 accent-ink" />
                Read the photo first so sizes and parts match what you can edit
              </label>
              <div>
                <p className="mb-1.5 text-sm font-bold">Quality</p>
                <HScroll className="pb-1">
                  {TIERS.map((t) => (
                    <button key={t.id} type="button" aria-pressed={(active.tier ?? "standard") === t.id} onClick={() => patch(active.id, () => ({ tier: t.id }))}
                      className={cn("w-40 shrink-0 rounded-xl border-2 border-ink px-3 py-2 text-left", (active.tier ?? "standard") === t.id ? "bg-card shadow-block-sm" : "bg-sun/60")}>
                      <span className="block text-sm font-bold">{t.name}</span>
                      <span className="block text-xs">{active.sheetType === "bom" && active.hybrid !== false ? "free" : `${price[t.id]} credits`}</span>
                    </button>
                  ))}
                </HScroll>
                <p className="text-xs text-ink/80">{TIERS.find((t) => t.id === (active.tier ?? "standard"))?.line}</p>
              </div>
              <HScroll className="pb-1">
                <Button onClick={run(() => analyse(active))} disabled={isBusy} variant="outline" className="shrink-0 border-2 border-ink bg-card">
                  <ScrollText className="mr-1.5 h-4 w-4" /> {active.spec ? "Read again" : "Read photo"}{btn(price.analyze)}
                </Button>
                <Button onClick={run(() => sheet(active))} disabled={isBusy} className="shrink-0">
                  <WandSparkles className="mr-1.5 h-4 w-4" /> Draw sheet{sheetCost(active) === 0 ? <span className="ml-1.5 rounded-full bg-ink/10 px-1.5 py-0.5 text-xs font-bold">free</span> : btn(sheetCost(active))}
                </Button>
              </HScroll>
              <p className="text-[13px] text-ink/80">Credits are used only when a result comes back. A failed try is free.</p>
              {busy?.itemId === active.id && (
                <p role="status" className="flex items-center gap-2 rounded-xl border-2 border-ink bg-card px-3 py-2 text-sm font-bold">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> {busy.label}…
                </p>
              )}
            </div>
          )}

          {active && (
            <Accordion type="single" collapsible value={open ?? ""} onValueChange={(v) => setOpen(v || undefined)} className="space-y-3">
              <Panel id="style" title="Sheet style and type" hint={`${STYLE_OPTIONS.find((s) => s.id === active.style)?.name}, ${SHEET_TYPES.find((s) => s.id === active.sheetType)?.name.toLowerCase()}`} icon={<Palette className="h-4 w-4" />}>
                <p className="mb-2 text-sm font-bold">Drawing style</p>
                <HScroll>
                  {STYLE_OPTIONS.map((s) => (
                    <button key={s.id} type="button" onClick={() => patch(active.id, () => ({ style: s.id }))} aria-pressed={active.style === s.id}
                      className={cn("flex w-44 shrink-0 flex-col gap-2 rounded-2xl border-2 border-ink p-3 text-left [scroll-snap-align:start]", active.style === s.id ? "bg-sun shadow-block-sm" : "bg-card")}>
                      <span className={cn("h-10 w-full rounded-lg border-2 border-ink", s.swatch)} />
                      <span className="text-sm font-bold">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.line}</span>
                    </button>
                  ))}
                </HScroll>
                <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm">
                  <input type="checkbox" checked={active.hybrid !== false} onChange={(e) => patch(active.id, () => ({ hybrid: e.target.checked }))} className="mt-0.5 h-4 w-4 accent-ink" />
                  <span><span className="font-bold">Exact tables (recommended).</span> The AI draws the drawings only; the parts list, materials, notes and title block are added as exact text from your editable table. Cheaper and more accurate. Turn off to let the AI draw everything.</span>
                </label>
                <p className="mb-2 mt-4 text-sm font-bold">What goes on the sheet</p>
                <HScroll>
                  {SHEET_TYPES.map((s) => (
                    <button key={s.id} type="button" onClick={() => patch(active.id, () => ({ sheetType: s.id }))} aria-pressed={active.sheetType === s.id}
                      className={cn("w-40 shrink-0 rounded-2xl border-2 border-ink p-3 text-left [scroll-snap-align:start]", active.sheetType === s.id ? "bg-sun shadow-block-sm" : "bg-card")}>
                      <span className="block text-sm font-bold">{s.name}</span>
                      <span className="block text-xs text-muted-foreground">{s.line}</span>
                    </button>
                  ))}
                </HScroll>
              </Panel>

              <Panel id="title" title="Title block" hint="The box in the corner of the sheet" icon={<Stamp className="h-4 w-4" />}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Project"><Input value={active.meta.project} placeholder="Luxury living collection" onChange={(e) => setMeta(active, { project: e.target.value })} /></Field>
                  <Field label="Drawing title"><Input value={active.meta.title} placeholder={`${active.name} technical design sheet`} onChange={(e) => setMeta(active, { title: e.target.value })} /></Field>
                  <Field label="Drawing number"><Input value={active.meta.drawingNo} onChange={(e) => setMeta(active, { drawingNo: e.target.value })} /></Field>
                  <Field label="Revision"><Input value={active.meta.revision} onChange={(e) => setMeta(active, { revision: e.target.value })} /></Field>
                  <Field label="Scale"><Input value={active.meta.scale} onChange={(e) => setMeta(active, { scale: e.target.value })} /></Field>
                  <Field label="Date"><Input value={active.meta.date} onChange={(e) => setMeta(active, { date: e.target.value })} /></Field>
                  <Field label="Drawn by (your studio)" className="sm:col-span-2"><Input value={active.meta.drawnBy} placeholder="Your studio or company name" onChange={(e) => setMeta(active, { drawnBy: e.target.value })} /></Field>
                </div>
              </Panel>

              <Panel id="size" title="Sizes and units" hint={active.spec?.dimensions.width ? `${active.spec.dimensions.width} × ${active.spec.dimensions.depth} × ${active.spec.dimensions.height} ${active.unit}` : "Type your own, or let the photo reading guess"} icon={<Ruler className="h-4 w-4" />}>
                <div className="mb-3 inline-flex rounded-full border-2 border-ink bg-card p-1" role="group" aria-label="Units">
                  {(["mm", "in"] as const).map((u) => (
                    <button key={u} type="button" aria-pressed={active.unit === u}
                      onClick={() => patch(active.id, (i) => ({ unit: u, spec: i.spec && i.unit !== u ? convertDims(i.spec, u) : i.spec }))}
                      className={cn("rounded-full px-4 py-1 text-sm font-bold", active.unit === u && "bg-sun")}>
                      {u === "mm" ? "Millimetres" : "Inches"}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(["width", "depth", "height", "seatHeight"] as const).map((k) => (
                    <Field key={k} label={k === "seatHeight" ? "Seat height" : k[0].toUpperCase() + k.slice(1)}>
                      <Input inputMode="decimal" value={active.spec?.dimensions[k] || ""} placeholder="auto"
                        onChange={(e) => setSpec(active, (s) => ({ ...s, dimensions: { ...s.dimensions, [k]: num(e.target.value), unit: active.unit } }))} />
                    </Field>
                  ))}
                </div>
                <p className="mt-2 text-[13px] text-muted-foreground">Leave a box empty and the sheet picks a sensible size. Sizes you type are used on every drawing.</p>
              </Panel>

              <Panel id="parts" title="Parts list and materials" hint={active.spec ? `${active.spec.parts.length} parts, ${active.spec.materials.length} materials. Edit them, then draw again` : "Appears after the photo is read"} icon={<Boxes className="h-4 w-4" />}>
                {active.spec ? (
                  <BomEditor parts={active.spec.parts} materials={active.spec.materials} onParts={(parts) => setSpec(active, (s) => ({ ...s, parts }))} onMaterials={(materials) => setSpec(active, (s) => ({ ...s, materials }))} />
                ) : (
                  <Button onClick={run(() => analyse(active))} disabled={isBusy}><ScrollText className="mr-2 h-4 w-4" /> Read the photo{btn(price.analyze)}</Button>
                )}
              </Panel>

              <Panel id="colours" title="Colours and materials" hint="Change the fabric or wood on the whole sheet" icon={<Armchair className="h-4 w-4" />}>
                <Textarea value={active.materials} onChange={(e) => patch(active.id, () => ({ materials: e.target.value }))} placeholder="Example: emerald green velvet, walnut legs, brass caps" rows={3} />
                <p className="mb-2 mt-3 text-sm font-bold">Quick picks</p>
                <HScroll>
                  {COLOURWAYS.map((c) => (
                    <button key={c} type="button" onClick={() => patch(active.id, (i) => ({ materials: i.materials ? `${i.materials}, ${c.toLowerCase()}` : c }))}
                      className="shrink-0 rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-semibold hover:bg-sun">{c}</button>
                  ))}
                </HScroll>
              </Panel>

              <Panel id="notes" title="Extra instructions" hint="Anything else the drawing should show" icon={<FileText className="h-4 w-4" />}>
                <Textarea value={active.notes} onChange={(e) => patch(active.id, () => ({ notes: e.target.value }))} placeholder="Example: show a 4th cushion, add USB port detail, use IS standard notes" rows={4} />
              </Panel>
            </Accordion>
          )}
        </div>

        {/* ───────── Right: result and extras ───────── */}
        <div className="min-w-0 space-y-5 lg:col-span-7">
          {active && current ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex rounded-full border-2 border-ink bg-card p-1" role="group" aria-label="View">
                  <button type="button" aria-pressed={mode === "result"} onClick={() => setMode("result")} className={cn("rounded-full px-4 py-1 text-sm font-bold", mode === "result" && "bg-sun")}>Result</button>
                  <button type="button" aria-pressed={mode === "compare"} onClick={() => setMode("compare")} className={cn("rounded-full px-4 py-1 text-sm font-bold", mode === "compare" && "bg-sun")}>Compare with photo</button>
                </div>
                <span className="truncate text-sm font-semibold text-muted-foreground">{current.label}</span>
              </div>
              {mode === "result" ? <Viewer src={current.url} alt={current.label} className="aspect-[3/2] w-full" /> : <Compare before={active.photo} after={current.url} />}
            </>
          ) : active ? (
            <div className="block-card flex aspect-[3/2] flex-col items-center justify-center gap-3 bg-card p-6 text-center">
              {busy?.itemId === active.id ? <Loader2 className="h-8 w-8 animate-spin" /> : <Sofa className="h-10 w-10" />}
              <p className="font-display text-lg font-bold">{busy?.itemId === active.id ? `${busy.label}…` : "Your sheet will show here"}</p>
              <p className="max-w-sm text-sm text-muted-foreground">Press “Draw the sheet” on the left. Open the sections below it first if you want to set the style, sizes or title block.</p>
            </div>
          ) : (
            <>
              <Compare
                before={EXAMPLES[exampleIx].before || EXAMPLES[exampleIx].after}
                after={EXAMPLES[exampleIx].after}
                beforeLabel={EXAMPLES[exampleIx].before ? "Photo" : "Sheet"}
                afterLabel={EXAMPLES[exampleIx].before ? "Design sheet" : "Sheet"}
              />
              <div>
                <h2 className="mb-2 font-display text-base font-bold">Examples (free to look at)</h2>
                <HScroll>
                  {EXAMPLES.map((e, i) => (
                    <button key={e.id} type="button" onClick={() => setExampleIx(i)} aria-pressed={exampleIx === i}
                      className={cn("w-52 shrink-0 overflow-hidden rounded-2xl border-2 border-ink text-left shadow-block-sm [scroll-snap-align:start]", exampleIx === i ? "bg-sun" : "bg-card")}>
                      <img src={e.after} alt={e.title} className="aspect-[3/2] w-full object-cover" />
                      <span className="block px-3 pt-2 text-sm font-bold">{e.title}</span>
                      <span className="block px-3 pb-2 text-xs text-muted-foreground">{e.line}</span>
                    </button>
                  ))}
                </HScroll>
              </div>
            </>
          )}

          {active && shownOutputs.length > 0 && (
            <section aria-label="Results for this piece">
              <h2 className="mb-2 font-display text-base font-bold">Results ({shownOutputs.length})</h2>
              <HScroll>
                {shownOutputs.map((o) => (
                  <div key={o.id} className="group relative shrink-0 [scroll-snap-align:start]">
                    <button type="button" onClick={() => { setOutId(o.id); setMode("result"); }} aria-pressed={current?.id === o.id}
                      className={cn("block w-40 overflow-hidden rounded-2xl border-2 border-ink text-left shadow-block-sm", current?.id === o.id ? "bg-sun" : "bg-card")}>
                      <img src={o.url} alt={o.label} className="aspect-[3/2] w-full bg-card object-cover" />
                      <span className="block truncate px-2 py-1.5 text-xs font-bold">{o.label}</span>
                    </button>
                    <button type="button" aria-label={`Delete ${o.label}`} onClick={() => dropOutput(active, o.id)} className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-card hover:bg-coral group-hover:flex group-focus-within:flex">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </HScroll>
            </section>
          )}

          {active && (
            <Accordion type="single" collapsible value={open ?? ""} onValueChange={(v) => setOpen(v || undefined)} className="space-y-3">
              <Panel id="pictures" title="More pictures from the same photo" hint="Catalogue views, studio shots, colourways, room scenes" icon={<Images className="h-4 w-4" />}>
                <p className="mb-2 text-sm font-bold">Catalogue views <span className="font-normal text-muted-foreground">({price.image} credits each)</span></p>
                <HScroll>
                  {VIEWS.map((v) => (
                    <Button key={v.id} variant="outline" disabled={isBusy} onClick={run(() => picture(active, "view", `${v.name} view`, { view: v.id }))} className="shrink-0 rounded-full border-2 border-ink bg-card">{v.name}</Button>
                  ))}
                </HScroll>
                <p className="mb-2 mt-4 text-sm font-bold">Studio shots</p>
                <HScroll>
                  <Button variant="outline" disabled={isBusy} onClick={run(() => picture(active, "hero", "Catalogue hero shot"))} className="shrink-0 rounded-full border-2 border-ink bg-card">Catalogue hero</Button>
                  <Button variant="outline" disabled={isBusy} onClick={run(() => picture(active, "iso", "Isometric illustration"))} className="shrink-0 rounded-full border-2 border-ink bg-card">Isometric</Button>
                  <Button variant="outline" disabled={isBusy} onClick={run(() => picture(active, "lineart", "Line drawing"))} className="shrink-0 rounded-full border-2 border-ink bg-card">Line drawing for CAD</Button>
                </HScroll>
                <p className="mb-2 mt-4 text-sm font-bold">Room scenes</p>
                <HScroll>
                  {ROOMS.map((r) => (
                    <Button key={r.id} variant="outline" disabled={isBusy} onClick={run(() => picture(active, "scene", `${r.name} scene`, { room: r.id }))} className="shrink-0 rounded-full border-2 border-ink bg-card">{r.name}</Button>
                  ))}
                </HScroll>
                <p className="mb-2 mt-4 text-sm font-bold">Colourways</p>
                <HScroll>
                  {COLOURWAYS.map((c) => (
                    <Button key={c} variant="outline" disabled={isBusy} onClick={run(() => picture(active, "colorway", c, { prompt: c }))} className="shrink-0 rounded-full border-2 border-ink bg-card">{c}</Button>
                  ))}
                </HScroll>
                <div className="mt-3 flex gap-2">
                  <Input value={colourText} onChange={(e) => setColourText(e.target.value)} placeholder="Or type your own: sage green boucle with oak legs" aria-label="Your own colourway" />
                  <Button disabled={isBusy || !colourText.trim()} onClick={run(() => picture(active, "colorway", colourText.trim().slice(0, 40), { prompt: colourText.trim() }))} className="shrink-0">Make it</Button>
                </div>
              </Panel>

              <Panel id="edit" title="Change this picture" hint="Tell it what to fix, in your own words" icon={<Wand2 className="h-4 w-4" />}>
                {current ? (
                  <>
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} placeholder="Example: make the title block text bigger and add a north arrow to the top plan" />
                    <HScroll className="mt-3">
                      {QUICK_EDITS.map((t) => (
                        <button key={t} type="button" onClick={() => setEditText(t)} className="shrink-0 rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-semibold hover:bg-sun">{t}</button>
                      ))}
                    </HScroll>
                    <Button className="mt-3" disabled={isBusy || !editText.trim()} onClick={run(() => picture(active, "edit", `Edit: ${editText.trim().slice(0, 28)}`, { prompt: editText.trim() }, current.url))}>
                      <Sparkles className="mr-2 h-4 w-4" /> Apply the change{btn(price.image)}
                    </Button>
                    <p className="mt-2 text-[13px] text-muted-foreground">The new version is added next to the old one, so nothing is lost.</p>
                  </>
                ) : <p className="text-sm text-muted-foreground">Draw a sheet or make a picture first, then change it here.</p>}
              </Panel>

              <Panel id="spec" title="What the photo shows" hint={active.spec ? `${active.spec.category}${active.spec.style ? `, ${active.spec.style}` : ""}` : "Size, joinery, care and an indicative cost"} icon={<ScrollText className="h-4 w-4" />}>
                {active.spec ? (
                  <div className="space-y-4 text-[15px]">
                    {active.spec.summary && <p>{active.spec.summary}</p>}
                    {active.spec.cost.highINR > 0 && (
                      <div className="rounded-2xl border-2 border-ink bg-sand p-3">
                        <p className="text-sm font-bold">Indicative workshop cost, per piece</p>
                        <p className="font-display text-xl font-extrabold">{inr(active.spec.cost.lowINR)} to {inr(active.spec.cost.highINR)}</p>
                        <label className="mt-2 flex items-center gap-2 text-sm">
                          Pieces
                          <Input type="number" min={1} max={999} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(999, Number(e.target.value) || 1)))} className="h-9 w-20 border-2 border-ink bg-card" />
                          <span className="font-bold">= {inr(active.spec.cost.lowINR * qty)} to {inr(active.spec.cost.highINR * qty)}</span>
                        </label>
                        <p className="mt-2 text-xs text-muted-foreground">{active.spec.cost.note || "A guess from one photo."} Ask your workshop for a real quote.</p>
                      </div>
                    )}
                    {active.spec.joinery.length > 0 && (<div><p className="mb-1 text-sm font-bold">How it is joined</p><ul className="list-disc space-y-1 pl-5">{active.spec.joinery.map((j, i) => <li key={i}>{j}</li>)}</ul></div>)}
                    {active.spec.careNotes.length > 0 && (<div><p className="mb-1 text-sm font-bold">Care</p><ul className="list-disc space-y-1 pl-5">{active.spec.careNotes.map((j, i) => <li key={i}>{j}</li>)}</ul></div>)}
                    {active.spec.tags.length > 0 && <HScroll className="pb-0">{active.spec.tags.map((t) => <span key={t} className="shrink-0 rounded-full border-2 border-ink bg-card px-2.5 py-0.5 text-xs font-semibold">{t}</span>)}</HScroll>}
                    <p className="text-xs text-muted-foreground">Every number is an estimate from one photo. Check sizes and materials before you build.</p>
                  </div>
                ) : <Button onClick={run(() => analyse(active))} disabled={isBusy}><ScrollText className="mr-2 h-4 w-4" /> Read the photo{btn(price.analyze)}</Button>}
              </Panel>

              <Panel id="downloads" title="Download and share" hint="PNG, PDF, parts list, spec, one zip with everything" icon={<Download className="h-4 w-4" />}>
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-bold">This picture</p>
                    <HScroll>
                      <Button variant="outline" disabled={!current} onClick={() => current && void downloadImage(current.url, `${active.name}-${current.label}`)} className="shrink-0 border-2 border-ink bg-card"><Download className="mr-2 h-4 w-4" /> Picture</Button>
                      <Button variant="outline" disabled={!current} onClick={() => current && void downloadPdf(active, current.url).catch(() => toast.error("The PDF could not be made."))} className="shrink-0 border-2 border-ink bg-card"><FileText className="mr-2 h-4 w-4" /> PDF (A3)</Button>
                      <Button variant="outline" disabled={!current} onClick={() => current && void copyImage(current.url).then(() => toast.success("Copied.")).catch(() => toast.error("Your browser did not allow copying."))} className="shrink-0 border-2 border-ink bg-card"><ClipboardCopy className="mr-2 h-4 w-4" /> Copy</Button>
                      <Button variant="outline" disabled={!current} onClick={() => current && void shareImage(current.url, active.name).then((ok) => !ok && toast.message("Sharing is not available here. Use Download.")).catch(() => undefined)} className="shrink-0 border-2 border-ink bg-card"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
                      <Button variant="outline" disabled={!current} onClick={() => current && !printImage(current.url, active.name) && toast.error("Allow pop-ups to print.")} className="shrink-0 border-2 border-ink bg-card"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    </HScroll>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-bold">This piece</p>
                    <HScroll>
                      <Button variant="outline" disabled={!active.spec} onClick={() => active.spec && downloadBom(active.spec, active.name)} className="shrink-0 border-2 border-ink bg-card"><FileSpreadsheet className="mr-2 h-4 w-4" /> Parts list (CSV)</Button>
                      <Button variant="outline" disabled={!active.spec} onClick={() => active.spec && void navigator.clipboard.writeText(bomCsv(active.spec).replace(/","/g, "\t").replace(/"/g, "")).then(() => toast.success("Parts list copied. Paste it into Excel or Sheets."))} className="shrink-0 border-2 border-ink bg-card"><ClipboardCopy className="mr-2 h-4 w-4" /> Copy parts list</Button>
                      <Button variant="outline" disabled={!active.spec} onClick={() => downloadSpecJson(active)} className="shrink-0 border-2 border-ink bg-card"><Check className="mr-2 h-4 w-4" /> Spec (JSON)</Button>
                      <Button variant="outline" disabled={!active.outputs.length} onClick={() => void downloadZip(active).catch(() => toast.error("The zip could not be made."))} className="shrink-0 border-2 border-ink bg-card"><FolderArchive className="mr-2 h-4 w-4" /> Everything (zip)</Button>
                    </HScroll>
                  </div>
                </div>
              </Panel>

              <Panel id="saved" title="Saved on this device" hint={`${items.length} piece${items.length === 1 ? "" : "s"} kept in this browser`} icon={<History className="h-4 w-4" />}>
                <p className="text-sm text-muted-foreground">Your photos and results are kept in this browser so you can come back to them. They are not uploaded anywhere except while a picture is being made. Download what you want to keep for good.</p>
                <Button variant="outline" className="mt-3 border-2 border-ink bg-card" onClick={() => { if (window.confirm("Remove every saved piece from this browser?")) { void Promise.all(items.map((i) => removeItem(i.id))).then(() => { setItems([]); setActiveId(null); setOutId(null); }); } }}>
                  <Trash2 className="mr-2 h-4 w-4" /> Clear saved work
                </Button>
              </Panel>
            </Accordion>
          )}
        </div>
      </div>

      <BuyCreditsDialog open={buy.open} onOpenChange={(v) => setBuy((b) => ({ ...b, open: v }))} required={buy.required} balance={buy.balance} />
      <LoginPromptDialog open={login} onOpenChange={setLogin} />
    </div>
  );
}

export default FurnitureStudio;
