import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Cloud, HardDrive, Loader2, Sparkles } from "lucide-react";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { resolveToolMedia } from "@/lib/toolMedia";
import { cn } from "@/lib/utils";
import { CONTROL, HINT, LABEL, UNBOUNDED } from "./softInputs";

/*
 * Shared visual pieces for the Studio-tool engines (PlanApp, StudioApp): the refined neo-brutalist
 * look used on Studio tool pages (warm cream canvas with ambient glow, lighter borders, a dark
 * gradient "what you get" preview card, homepage-style form inputs, visual-first cross-sell cards).
 * Kept out of the generic shell (AppShell/StepLabel/flagship/parts) so every other engine — and
 * every non-Studio tool — keeps today's block look untouched.
 */

// Re-exported from ./softInputs (zero-dependency leaf module) so every existing importer of these
// four names from here keeps working unchanged.
export { CONTROL, HINT, LABEL, UNBOUNDED };

export const initialsOf = (name: string) =>
  name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "AI";

/** Splits a label like "Business name (or 'need a name')" into a short label plus a muted hint. */
export function splitLabel(label: string): { label: string; hint?: string } {
  const m = label.match(/^(.*?)\s*\((.+)\)\s*$/);
  return m ? { label: m[1], hint: `(${m[2]})` } : { label };
}

export function SyncChip({ state }: { state: "local" | "syncing" | "synced" | "error" }) {
  const map = {
    local: { Icon: HardDrive, text: "Saved on this device", cls: "text-black/50 dark:text-white/50" },
    syncing: { Icon: Loader2, text: "Saving…", cls: "text-black/50 dark:text-white/50" },
    synced: { Icon: Cloud, text: "Saved to your account", cls: "text-emerald-600 dark:text-emerald-400" },
    error: { Icon: HardDrive, text: "Saved on this device (sync failed)", cls: "text-amber-600 dark:text-amber-400" },
  } as const;
  const { Icon, text, cls } = map[state];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px]", cls)}>
      <Icon className={cn("h-3.5 w-3.5", state === "syncing" && "animate-spin")} /> {text}
    </span>
  );
}

/** What the finished result contains: a dark, visual-first preview card, before (or while) it exists. */
export function WhatYouGet({ items, working, sample = true }: { items: string[]; working: boolean; sample?: boolean }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (!working) {
      setDone(0);
      return;
    }
    const t = setInterval(() => setDone((d) => Math.min(d + 1, items.length - 1)), 2600);
    return () => clearInterval(t);
  }, [working, items.length]);
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl bg-gradient-to-br from-[#18181B] via-[#111111] to-[#1F1523] p-6 text-white">
      <div>
        <p className="flex items-center gap-2 text-[15px] font-bold">
          {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#C8E967]" />}
          {working ? "Making your result — usually 20 to 60 seconds" : "What you get"}
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {items.map((s, i) => (
            <li key={s} className={cn("flex items-start gap-2 text-sm leading-snug", working && i > done && "text-white/40")}>
              {working && i === done ? (
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-white/70" />
              ) : (
                <Check className={cn("mt-0.5 h-4 w-4 shrink-0", working && i > done ? "text-white/25" : "text-[#C8E967]")} />
              )}
              {s}
            </li>
          ))}
        </ul>
      </div>
      {sample && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex -space-x-1" aria-hidden>
            {["#F472D0", "#FACC15", "#C8E967", "#111111"].map((c) => (
              <span key={c} className="h-6 w-6 rounded-full border-2 border-[#111111]" style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="h-6 w-px bg-white/10" aria-hidden />
          <span className="text-xs text-white/60">
            Sample output preview — <span className="font-semibold text-white/80">palette + font pairing</span>
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * One cross-sell card: the tool's own preview image behind a dark fade when it has one (same
 * resolution order as the homepage's ToolCard — original preview, then catalog asset), or the flat
 * dark gradient with its initials when it doesn't.
 */
function WorksWellWithCard({ tool }: { tool: CatalogTool }) {
  const media = useMemo(() => resolveToolMedia(tool.id, tool.category, tool), [tool]);
  const [imgFailed, setImgFailed] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);
  const hasPreview = !!media.previewImageUrl && !imgFailed;
  return (
    <Link
      to={`/tool/${tool.id}`}
      className="group relative flex min-h-[200px] w-[80%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl text-white transition hover:-translate-y-0.5 sm:w-auto sm:shrink"
    >
      <div className="absolute inset-0">
        {hasPreview ? (
          <img
            src={media.previewImageUrl!}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            className={cn("h-full w-full", media.previewFit === "contain" ? "bg-[#111111] object-contain p-2" : "object-cover")}
          />
        ) : (
          <>
            <div className="h-full w-full bg-gradient-to-br from-[#18181B] via-[#111111] to-[#1F1523]" />
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#F472D0]/25 blur-2xl" aria-hidden />
          </>
        )}
        {hasPreview && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" aria-hidden />}
      </div>

      <div className="relative flex items-center justify-between p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10 text-xs font-bold">
          {media.iconUrl && !iconFailed ? (
            <img src={media.iconUrl} alt="" loading="lazy" onError={() => setIconFailed(true)} className="h-full w-full object-cover" />
          ) : (
            initialsOf(tool.name)
          )}
        </span>
        <span className="truncate rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">{tool.category}</span>
      </div>
      <div className="relative p-4 pt-0">
        <p className="font-bold">{tool.name}</p>
        <p className="mt-1 line-clamp-2 text-xs text-white/70">{tool.description}</p>
        <span className="relative mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#111111]">Try it →</span>
      </div>
    </Link>
  );
}

/** This tool's cross-sell row, styled like the homepage's visual-first cards. */
export function WorksWellWith({ ids, cols = 4 }: { ids: string[]; cols?: 3 | 4 }) {
  const { data: catalog = [] } = useToolsCatalog();
  const apps = ids.map((id) => catalog.find((t) => t.id === id && t.is_live)).filter(Boolean) as CatalogTool[];
  if (!apps.length) return null;
  return (
    <section className="mt-12 border-t border-black/10 pt-8 dark:border-white/10">
      <h2 className="font-display text-lg font-bold text-[#111111] dark:text-white" style={UNBOUNDED}>
        Works well with
      </h2>
      <div
        className={cn(
          "mt-4 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0",
          cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4",
        )}
      >
        {apps.map((t) => (
          <WorksWellWithCard key={t.id} tool={t} />
        ))}
      </div>
    </section>
  );
}

/** Ambient warm glow over the cream/dark canvas, behind a Studio tool's hero. */
export function AmbientGlow() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70 dark:opacity-30"
      style={{
        background:
          "radial-gradient(60% 55% at 50% -10%, rgba(250,204,21,0.14), transparent 60%), radial-gradient(45% 45% at 15% 0%, rgba(244,114,208,0.12), transparent 60%), radial-gradient(45% 45% at 85% 0%, rgba(200,233,103,0.14), transparent 60%)",
      }}
      aria-hidden
    />
  );
}
