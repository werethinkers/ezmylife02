import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Laptop, Loader2, Maximize2, Moon, RotateCcw, Search, Smartphone, Star, Sun, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PageSeo } from "@/components/seo/PageSeo";
import { isAdmin } from "@/lib/devApps";
import twAnimateCss from "./tw-animate.css?raw";
import previewFrameCss from "./previewFrameCss.css?raw";
import { hind400, hind600, unbounded700 } from "./frameFonts";
import working from "./workingComponents.json";

/*
 * Private component gallery (/admin/components), for admins only.
 *
 * Browses the open component directory at github.com/wundercorp/awesome-components (MIT licence;
 * the designs inside it belong to their original authors). Nothing from that repo is copied into
 * this codebase: the list, screenshots and DOM snapshots are read from GitHub at a pinned commit,
 * and each snapshot is drawn inside a sandboxed frame, either as published or re-themed with our
 * own colours, fonts, outlines and block shadows. Before a component goes on a public page it is
 * rebuilt in our code, after checking its author's licence.
 *
 * The page is not in src/lib/seo/pages.ts, so it gets no static HTML or sitemap entry, and
 * robots.txt already keeps crawlers out of /admin.
 */

const REPO = "wundercorp/awesome-components";
const COMMIT = "87e9f787c81ce3fc9c73d37f890fb3e8d2d19ef6";
const RAW = `https://raw.githubusercontent.com/${REPO}/${COMMIT}/`;
const TREE = `https://github.com/${REPO}/tree/${COMMIT}/`;
const PICKS_KEY = "ez-component-picks";
const PAGE = 24;

type Entry = {
  author: string;
  authorName?: string;
  component: string;
  componentName?: string;
  variant: string;
  variantName?: string;
  path: string;
  promptPath: string;
  htmlPath: string;
  screenshotPath: string;
};
type Works = "moves" | "responds";
type Item = Entry & { id: string; name: string; folder: string; haystack: string; works: Works };

/* Only components that passed scripts/component-gallery-check.cjs are listed: they move on their own or react to hover or click. */
const WORKING = working.items as Record<string, Works>;

/* Our internal labels never show on the site, even on private pages, so names using them are reworded. */
const RELABEL: [RegExp, string][] = [
  [/\bheroes\b/gi, "Top banners"],
  [/\bhero\b/gi, "Top banner"],
  [/\bflagship\b/gi, "Showcase"],
  [/\bcomplex\b/gi, "Advanced"],
];
const relabel = (s: string) => RELABEL.reduce((t, [re, to]) => t.replace(re, to), s);

const KINDS: { id: string; label: string; re: RegExp }[] = [
  { id: "buttons", label: "Buttons", re: /button|cta/ },
  { id: "cards", label: "Cards", re: /card/ },
  { id: "prices", label: "Prices", re: /pricing|price|plan|subscription/ },
  { id: "forms", label: "Forms & sign in", re: /form|input|login|sign-?in|sign-?up|auth|contact|otp|search/ },
  { id: "banners", label: "Top banners", re: /hero|landing|header|banner/ },
  { id: "menus", label: "Menus & tabs", re: /nav|menu|sidebar|dock|tab/ },
  { id: "text", label: "Text effects", re: /text|typing|typewriter|word|letter|title|heading/ },
  { id: "backgrounds", label: "Backgrounds", re: /background|gradient|grid|aurora|beam|particle|wave|shader/ },
  { id: "reviews", label: "Reviews", re: /testimonial|review|rating/ },
  { id: "charts", label: "Charts & numbers", re: /chart|graph|stat|dashboard|counter|metric|kpi/ },
  { id: "loaders", label: "Loaders", re: /loader|spinner|loading|skeleton|progress/ },
  { id: "popups", label: "Pop-ups", re: /modal|dialog|drawer|toast|popover|tooltip|sheet/ },
  { id: "footers", label: "Footers", re: /footer/ },
  { id: "galleries", label: "Galleries", re: /gallery|carousel|slider|marquee|image/ },
];

function readPicks(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(PICKS_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function savePicks(p: string[]) {
  try {
    localStorage.setItem(PICKS_KEY, JSON.stringify(p));
  } catch {
    /* private window: picks last until the tab closes */
  }
}

async function loadDirectory(): Promise<Item[]> {
  const res = await fetch(`${RAW}data/components.json`);
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  const rows = (await res.json()) as Entry[];
  return rows.filter((r) => WORKING[`${r.author}/${r.component}/${r.variant}`]).map((r) => {
    const base = relabel(r.componentName || r.component);
    const name = r.variant === "default" ? base : `${base} · ${relabel(r.variantName || r.variant)}`;
    return {
      ...r,
      id: `${r.author}/${r.component}/${r.variant}`,
      works: WORKING[`${r.author}/${r.component}/${r.variant}`],
      name,
      folder: r.path.replace(/\/README\.md$/, ""),
      haystack: `${r.component} ${r.componentName ?? ""} ${r.variant} ${r.author} ${r.authorName ?? ""}`.toLowerCase(),
    };
  });
}

/* ---------- the preview frame ---------- */

const SHADCN_LIGHT = `--background:0 0% 100%;--foreground:240 10% 3.9%;--card:0 0% 100%;--card-foreground:240 10% 3.9%;--popover:0 0% 100%;--popover-foreground:240 10% 3.9%;--primary:240 5.9% 10%;--primary-foreground:0 0% 98%;--secondary:240 4.8% 95.9%;--secondary-foreground:240 5.9% 10%;--muted:240 4.8% 95.9%;--muted-foreground:240 3.8% 46.1%;--accent:240 4.8% 95.9%;--accent-foreground:240 5.9% 10%;--destructive:0 84.2% 60.2%;--destructive-foreground:0 0% 98%;--border:240 5.9% 90%;--input:240 5.9% 90%;--ring:240 5.9% 10%;--radius:0.5rem;`;
const SHADCN_DARK = `--background:240 10% 3.9%;--foreground:0 0% 98%;--card:240 10% 3.9%;--card-foreground:0 0% 98%;--popover:240 10% 3.9%;--popover-foreground:0 0% 98%;--primary:0 0% 98%;--primary-foreground:240 5.9% 10%;--secondary:240 3.7% 15.9%;--secondary-foreground:0 0% 98%;--muted:240 3.7% 15.9%;--muted-foreground:240 5% 64.9%;--accent:240 3.7% 15.9%;--accent-foreground:0 0% 98%;--destructive:0 62.8% 30.6%;--destructive-foreground:0 0% 98%;--border:240 3.7% 15.9%;--input:240 3.7% 15.9%;--ring:240 4.9% 83.9%;--radius:0.5rem;`;
/* Same values as :root in src/index.css. */
const OURS = `--background:39 100% 96%;--foreground:0 0% 7%;--card:0 0% 100%;--card-foreground:0 0% 7%;--popover:0 0% 100%;--popover-foreground:0 0% 7%;--primary:326 78% 38%;--primary-foreground:0 0% 100%;--secondary:37 52% 91%;--secondary-foreground:0 0% 7%;--muted:37 52% 91%;--muted-foreground:0 0% 29%;--accent:47 100% 50%;--accent-foreground:0 0% 7%;--destructive:4 76% 48%;--destructive-foreground:0 0% 100%;--border:0 0% 7%;--input:0 0% 7%;--ring:221 100% 55%;--radius:0.875rem;--ink:0 0% 7%;--pink:312 100% 78%;--sun:47 100% 50%;--teal:169 70% 45%;--sky:220 100% 78%;--lime:77 90% 58%;--coral:15 100% 67%;`;

const TOKENS = ["background", "foreground", "card", "card-foreground", "popover", "popover-foreground", "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground", "accent", "accent-foreground", "destructive", "destructive-foreground", "border", "input", "ring"];

type Look = "ours" | "original";

function frameDoc(html: string, look: Look, dark: boolean): string {
  const origin = window.location.origin;
  const colors = TOKENS.map((t) => `--color-${t}:hsl(var(--${t}));`).join("");
  const brand = look === "ours" ? ["ink", "pink", "sun", "teal", "sky", "lime", "coral"].map((t) => `--color-${t}:hsl(var(--${t}));`).join("") : "";
  const vars = look === "ours" ? OURS : dark ? SHADCN_DARK : SHADCN_LIGHT;
  const ours =
    look === "ours"
      ? `@font-face{font-family:Unbounded;font-weight:700;font-display:swap;src:url(${unbounded700}) format("woff2")}
@font-face{font-family:Hind;font-weight:400;font-display:swap;src:url(${hind400}) format("woff2")}
@font-face{font-family:Hind;font-weight:600;font-display:swap;src:url(${hind600}) format("woff2")}
@theme{--font-sans:Hind,system-ui,sans-serif;--font-display:Unbounded,Hind,system-ui,sans-serif;
--shadow-2xs:3px 3px 0 0 hsl(0 0% 7%);--shadow-xs:3px 3px 0 0 hsl(0 0% 7%);--shadow-sm:3px 3px 0 0 hsl(0 0% 7%);--shadow-md:3px 3px 0 0 hsl(0 0% 7%);--shadow-lg:5px 5px 0 0 hsl(0 0% 7%);--shadow-xl:7px 7px 0 0 hsl(0 0% 7%);--shadow-2xl:7px 7px 0 0 hsl(0 0% 7%)}
body{font-family:Hind,system-ui,sans-serif}
h1,h2,h3{font-family:Unbounded,Hind,system-ui,sans-serif}
[class~="border"]{border-width:2px}`
      : "";
  return `<!doctype html><html class="${look === "original" && dark ? "dark" : ""}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>:root{${vars}}</style>
<style type="text/tailwindcss">
@custom-variant dark (&:where(.dark, .dark *));
@theme inline{${colors}${brand}--radius-sm:calc(var(--radius) - 4px);--radius-md:calc(var(--radius) - 2px);--radius-lg:var(--radius);--radius-xl:calc(var(--radius) + 4px)}
@layer base{*{border-color:var(--color-border)}body{background:var(--color-background);color:var(--color-foreground)}}
${twAnimateCss}
${previewFrameCss}
${ours}
</style>
<script src="${origin}/vendor/tailwind-browser-4.1.11.js"></script>
</head><body>${html}</body></html>`;
}

function useFrameWidth(ref: React.RefObject<HTMLDivElement>) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function useComponentHtml(item: Item, enabled = true) {
  return useQuery({
    queryKey: ["component-html", item.htmlPath],
    enabled,
    queryFn: async () => {
      const r = await fetch(RAW + item.htmlPath);
      if (!r.ok) throw new Error(`GitHub answered ${r.status}`);
      return r.text();
    },
    staleTime: Infinity,
  });
}

/** True while the element is on screen or just off it, so only nearby cards run a live preview. */
function useNearViewport(ref: React.RefObject<HTMLElement>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return near;
}

const CARD_W = 960;
const CARD_H = 720;

/* One card: a big live preview (hover effects, CSS animations and transitions run), then name, author and pick. */
function PreviewCard({ item, picked, onPick, onOpen }: { item: Item; picked: boolean; onPick: () => void; onOpen: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const near = useNearViewport(box);
  const w = useFrameWidth(box);
  const [run, setRun] = useState(0);
  const html = useComponentHtml(item, near);
  const srcDoc = useMemo(() => (html.data ? frameDoc(html.data, "ours", false) : ""), [html.data]);
  const scale = w ? w / CARD_W : 0.4;

  const tool = "p-2 rounded-lg border-2 border-ink bg-card hover:bg-sun shadow-block-sm";
  return (
    <div className="block-card overflow-hidden flex flex-col">
      <div ref={box} className="group relative aspect-[4/3] overflow-hidden border-b-2 border-ink bg-secondary">
        <img src={RAW + item.screenshotPath} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
        {near && srcDoc && (
          <iframe
            key={run}
            title={`${item.name} live preview`}
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            className="absolute left-0 top-0 border-0 bg-background"
            style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: "0 0" }}
          />
        )}
        <span className={`absolute left-3 top-3 z-10 rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-semibold ${item.works === "moves" ? "bg-lime" : "bg-sky"}`}>
          {item.works === "moves" ? "Moves" : "Responds"}
        </span>
        {near && html.isLoading && <Loader2 className="absolute right-3 bottom-3 h-4 w-4 animate-spin text-muted-foreground" />}
        <div className="absolute right-3 top-3 flex gap-2 opacity-100 sm:opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button className={tool} onClick={() => setRun((r) => r + 1)} aria-label="Replay animation" title="Replay"><RotateCcw className="h-4 w-4" /></button>
          <button className={tool} onClick={onOpen} aria-label={`Open ${item.name} full size`} title="Full size"><Maximize2 className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="p-3 flex items-start gap-2">
        <button className="min-w-0 grow text-left" onClick={onOpen}>
          <p className="font-semibold leading-snug line-clamp-2">{item.name}</p>
          <p className="text-xs text-muted-foreground truncate">by {item.authorName || item.author}</p>
        </button>
        <button onClick={onPick} className="p-1.5 rounded-md hover:bg-secondary" aria-label={picked ? "Remove from picks" : "Pick"} aria-pressed={picked}>
          <Star className={`h-4 w-4 ${picked ? "fill-sun" : ""}`} />
        </button>
      </div>
    </div>
  );
}

function Preview({ item, picked, onPick, onClose }: { item: Item; picked: boolean; onPick: () => void; onClose: () => void }) {
  const [look, setLook] = useState<Look>("ours");
  const [dark, setDark] = useState(false);
  const [device, setDevice] = useState<"laptop" | "phone">(() => (window.innerWidth < 768 ? "phone" : "laptop"));
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const boxW = useFrameWidth(box);

  const html = useComponentHtml(item);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const srcDoc = useMemo(() => (html.data ? frameDoc(html.data, look, dark) : ""), [html.data, look, dark]);
  const frameW = device === "laptop" ? 1280 : 390;
  const frameH = device === "laptop" ? 800 : 780;
  const scale = boxW ? Math.min(1, boxW / frameW) : 1;

  const copyPrompt = async () => {
    const r = await fetch(RAW + item.promptPath);
    const text = await r.text();
    const ours =
      "\n\n## Ezyourlife look\n\nRebuild this inside the Ezyourlife repo in its own style (docs/design.md): cream page, white cards, thick ink outlines (border-2 border-ink) with hard block shadows (shadow-block-sm / shadow-block), Unbounded headings (font-display), Hind body text, solid brand colours (bg-pink, bg-sun, bg-teal, bg-sky, bg-lime), plain words. Use our shadcn parts from src/components/ui where they fit. Check the original author's licence first.\n";
    await navigator.clipboard.writeText(text + ours);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const seg = (on: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold border-2 border-ink ${on ? "bg-sun" : "bg-card hover:bg-secondary"}`;

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 p-2 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label={item.name} onClick={onClose}>
      <div className="mx-auto max-w-[1340px] bg-background border-2 border-ink rounded-2xl shadow-block-lg p-3 sm:p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg sm:text-xl leading-tight break-words">{item.name}</h2>
            <p className="text-sm text-muted-foreground">by {item.authorName || item.author}</p>
          </div>
          <button onClick={onClose} className="p-2 border-2 border-ink rounded-lg bg-card hover:bg-secondary" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg overflow-hidden -space-x-0.5">
            <button className={seg(look === "ours")} onClick={() => setLook("ours")}>Our style</button>
            <button className={seg(look === "original")} onClick={() => setLook("original")}>As published</button>
          </div>
          <div className="inline-flex rounded-lg overflow-hidden -space-x-0.5">
            <button className={seg(device === "laptop")} onClick={() => setDevice("laptop")} aria-label="Laptop size"><Laptop className="h-4 w-4" /> Laptop</button>
            <button className={seg(device === "phone")} onClick={() => setDevice("phone")} aria-label="Phone size"><Smartphone className="h-4 w-4" /> Phone</button>
          </div>
          {look === "original" && (
            <button className={`${seg(false)} rounded-lg`} onClick={() => setDark((d) => !d)}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {dark ? "Light" : "Dark"}
            </button>
          )}
          <button className={`${seg(false)} rounded-lg`} onClick={() => setRun((r) => r + 1)}>
            <RotateCcw className="h-4 w-4" /> Replay
          </button>
          <span className="grow" />
          <button className={`${seg(picked)} rounded-lg`} onClick={onPick}>
            <Star className={`h-4 w-4 ${picked ? "fill-ink" : ""}`} /> {picked ? "Picked" : "Pick"}
          </button>
          <button className={`${seg(false)} rounded-lg`} onClick={copyPrompt}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy build prompt"}
          </button>
          <a className={`${seg(false)} rounded-lg`} href={TREE + item.folder} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> Source
          </a>
        </div>

        <div ref={box} className="mt-4 w-full">
          {html.isLoading && (
            <div className="h-64 grid place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
          )}
          {html.isError && <p className="p-6 text-center">Could not load this component from GitHub. Try again in a minute.</p>}
          {html.data && (
            <div className="mx-auto border-2 border-ink rounded-xl overflow-hidden bg-card" style={{ width: frameW * scale, height: frameH * scale }}>
              <iframe
                key={`${look}-${dark}-${run}`}
                title={`${item.name} preview`}
                sandbox="allow-scripts"
                srcDoc={srcDoc}
                style={{ width: frameW, height: frameH, transform: `scale(${scale})`, transformOrigin: "0 0", border: 0, display: "block" }}
              />
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Hover effects, CSS animations and transitions run here. Motion driven by script code (for example spring or scroll effects) is only a frozen snapshot. "Our style" swaps in our colours, fonts, ink outlines and block shadows. To use one on the site, copy its build prompt and give it to Claude; the original author's licence is checked before anything goes live.
        </p>
      </div>
    </div>
  );
}

/* ---------- the page ---------- */

export default function ComponentGallery() {
  const admin = useQuery({ queryKey: ["dev-is-admin"], queryFn: isAdmin, staleTime: 10 * 60 * 1000 });
  const dir = useQuery({ queryKey: ["component-directory", COMMIT], queryFn: loadDirectory, enabled: admin.data === true, staleTime: Infinity });

  const [q, setQ] = useState("");
  const [kind, setKind] = useState<string | null>(null);
  const [onlyPicks, setOnlyPicks] = useState(false);
  const [works, setWorks] = useState<Works | null>(null);
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<Item | null>(null);
  const [picks, setPicks] = useState<string[]>(readPicks);
  const [copiedList, setCopiedList] = useState(false);

  useEffect(() => setShown(PAGE), [q, kind, onlyPicks, works]);

  const togglePick = (id: string) =>
    setPicks((p) => {
      const next = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
      savePicks(next);
      return next;
    });

  const results = useMemo(() => {
    const all = dir.data ?? [];
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const re = KINDS.find((k) => k.id === kind)?.re;
    const pickSet = new Set(picks);
    return all.filter(
      (it) =>
        (!onlyPicks || pickSet.has(it.id)) &&
        (!works || it.works === works) &&
        (!re || re.test(it.component)) &&
        words.every((w) => it.haystack.includes(w)),
    );
  }, [dir.data, q, kind, onlyPicks, works, picks]);

  const copyList = async () => {
    const byId = new Map((dir.data ?? []).map((it) => [it.id, it]));
    const lines = picks.map((id) => byId.get(id)).filter(Boolean).map((it) => `- ${it!.name} (by ${it!.authorName || it!.author}): ${TREE}${it!.folder}`);
    await navigator.clipboard.writeText(`Components picked for Ezyourlife:\n${lines.join("\n")}\n`);
    setCopiedList(true);
    setTimeout(() => setCopiedList(false), 1800);
  };

  const chip = (on: boolean) => `px-3 py-1.5 rounded-full text-sm font-semibold border-2 border-ink whitespace-nowrap ${on ? "bg-sun" : "bg-card hover:bg-secondary"}`;

  return (
    <div className="min-h-screen bg-background">
      <PageSeo title="Component gallery | EZYOURLIFE" description="Private gallery of interface parts." path="/admin/components" noindex />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-[1500px]">
        {admin.isLoading && <p className="p-8">Checking your access…</p>}
        {!admin.isLoading && admin.data !== true && <p className="p-8">This page is for admins only.</p>}
        {admin.data === true && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Private · admins only</p>
                <h1 className="font-display text-2xl sm:text-3xl mt-1">Component gallery</h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Ready-made interface parts from an open component library. Only components that visibly work are listed: they move on their own, or react when you hover or click. Open one to see it in our style, on a laptop or a phone, then pick the ones we should build into the site.
                </p>
              </div>
              {picks.length > 0 && (
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-ink bg-pink font-semibold shadow-block-sm" onClick={copyList}>
                  {copiedList ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copiedList ? "Copied" : `Copy my ${picks.length} picks`}
                </button>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <label className="relative grow max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search, e.g. pricing, login, testimonial"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border-2 border-ink bg-card"
                />
              </label>
              <button className={chip(onlyPicks)} onClick={() => setOnlyPicks((v) => !v)}>
                <Star className={`inline h-3.5 w-3.5 mr-1 -mt-0.5 ${onlyPicks ? "fill-ink" : ""}`} />My picks ({picks.length})
              </button>
              <button className={chip(works === "moves")} onClick={() => setWorks(works === "moves" ? null : "moves")}>Moves on its own</button>
              <button className={chip(works === "responds")} onClick={() => setWorks(works === "responds" ? null : "responds")}>Responds to hover or click</button>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              <button className={chip(kind === null)} onClick={() => setKind(null)}>All</button>
              {KINDS.map((k) => (
                <button key={k.id} className={chip(kind === k.id)} onClick={() => setKind(kind === k.id ? null : k.id)}>{k.label}</button>
              ))}
            </div>

            {dir.isLoading && (
              <div className="py-20 grid place-items-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="mt-2">Loading the library…</p>
              </div>
            )}
            {dir.isError && <p className="py-12 text-center">Could not reach GitHub to load the library. Try again in a minute.</p>}

            {dir.data && (
              <>
                <p className="mt-4 text-sm text-muted-foreground">{results.length.toLocaleString("en-IN")} components</p>
                <div className="mt-3 grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {results.slice(0, shown).map((it) => (
                    <PreviewCard key={it.id} item={it} picked={picks.includes(it.id)} onPick={() => togglePick(it.id)} onOpen={() => setOpen(it)} />
                  ))}
                </div>
                {results.length > shown && (
                  <div className="mt-8 text-center">
                    <button className="px-5 py-2.5 rounded-lg border-2 border-ink bg-card font-semibold shadow-block-sm" onClick={() => setShown((s) => s + PAGE)}>
                      Show more
                    </button>
                  </div>
                )}
                {results.length === 0 && <p className="py-12 text-center text-muted-foreground">Nothing matches. Try another word.</p>}
              </>
            )}
          </>
        )}
      </main>
      {open && <Preview item={open} picked={picks.includes(open.id)} onPick={() => togglePick(open.id)} onClose={() => setOpen(null)} />}
    </div>
  );
}
