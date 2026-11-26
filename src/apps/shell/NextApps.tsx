import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { useToolsCatalog, type CatalogTool } from "@/hooks/useToolsCatalog";
import { AppIcon } from "@/components/store/AppIcon";
import { resolveToolMedia } from "@/lib/toolMedia";
import { ROLES, CONTEXT_AWARE } from "../workflows";
import { suggestNext, useJourney, useRecordVisit, type NextSuggestion } from "../lib/journey";
import { cn } from "@/lib/utils";

const initialsOf = (name: string) =>
  name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "AI";

/** One refined, dark/gradient cross-sell card — the tool's own preview image when it has one. */
function RefinedCard({ tool, s, carry }: { tool: CatalogTool; s: NextSuggestion; carry: boolean }) {
  const media = useMemo(() => resolveToolMedia(tool.id, tool.category, tool), [tool]);
  const [imgFailed, setImgFailed] = useState(false);
  const hasPreview = !!media.previewImageUrl && !imgFailed;
  return (
    <Link
      to={`/tool/${tool.id}`}
      className="group relative flex min-h-[180px] w-[80%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl text-white transition hover:-translate-y-0.5 sm:w-auto sm:shrink"
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
            <div className="h-full w-full bg-gradient-to-br from-[#1A1A1F] to-[#111111]" />
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#F472D0]/25 blur-2xl" aria-hidden />
          </>
        )}
        {hasPreview && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" aria-hidden />}
      </div>
      <div className="relative flex items-center justify-between p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10 text-xs font-bold">
          {initialsOf(tool.name)}
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/70 group-hover:text-white" />
      </div>
      <div className="relative p-4 pt-0">
        <p className="line-clamp-2 font-bold leading-snug">{tool.name}</p>
        <p className="mt-1 line-clamp-2 text-xs text-white/70">
          {s.learned ? "You often open this next" : s.why ?? tool.description}
          {CONTEXT_AWARE.has(s.id) && carry ? " · pre-filled" : ""}
        </p>
        <span className="relative mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#111111]">Try it →</span>
      </div>
    </Link>
  );
}

/**
 * Shown on every app: the follow-on apps this person is likely to need next. Apps that read the
 * shared client and numbers say so, because the details carry over without retyping.
 */
export function NextApps({
  toolId,
  variant = "default",
  pinned,
}: {
  toolId: string;
  variant?: "default" | "refined";
  /** Shows exactly these apps instead of the learned/journey suggestions — for a page whose
   * design calls out specific cross-sell apps by name. Opt-in; every other caller keeps the
   * dynamic, role-aware suggestions. */
  pinned?: string[];
}) {
  useRecordVisit(toolId);
  const { data: j, update } = useJourney();
  const { data: catalog = [] } = useToolsCatalog();
  const [hidden, setHidden] = useState(false);
  const live = (id: string) => catalog.some((t) => t.id === id && t.is_live);
  const next = pinned ? pinned.filter(live).map((id) => ({ id, learned: false })) : suggestNext(toolId, j, live);
  const rolesHere = ROLES.filter((r) => r.steps.some((s) => s.toolId === toolId));
  if (hidden || !next.length) return null;
  const carry = CONTEXT_AWARE.has(toolId);

  if (variant === "refined") {
    return (
      <section className="mt-12 border-t border-black/[0.08] pt-10 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-black/15 bg-[#C8E967] px-3 py-1 text-xs font-bold uppercase text-[#111111]">
            Next, you may need
          </span>
          {carry && <span className="text-xs text-black/50 dark:text-white/50">Your details carry over</span>}
          {rolesHere.length > 1 && (
            <select
              value={j.role ?? ""}
              onChange={(e) => update({ role: e.target.value || undefined })}
              className="ml-auto h-8 max-w-[11rem] rounded-full border border-black/10 bg-white px-3 text-xs text-[#111111] dark:border-white/15 dark:bg-[#1F1F24] dark:text-white"
              aria-label="Tailor suggestions to what you do"
            >
              <option value="">I am a…</option>
              {rolesHere.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setHidden(true)}
            className={cn("rounded-full p-1.5 text-black/40 hover:bg-black/5 dark:text-white/40 dark:hover:bg-white/10", rolesHere.length > 1 ? "" : "ml-auto")}
            aria-label="Hide suggestions"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
          {next.map((s) => {
            const t = catalog.find((x) => x.id === s.id);
            if (!t) return null;
            return <RefinedCard key={s.id} tool={t} s={s} carry={carry} />;
          })}
        </div>
      </section>
    );
  }

  return (
    <aside className="border-y-2 border-ink bg-sky/40" aria-label="Apps you may need next">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center gap-2 text-xs">
          <Sparkles className="h-4 w-4 shrink-0 text-ink" />
          <span className="text-sm font-bold">Next, you may need</span>
          {carry && <span className="hidden text-muted-foreground sm:inline">· your details carry over</span>}
          {rolesHere.length > 1 && (
            <select
              value={j.role ?? ""}
              onChange={(e) => update({ role: e.target.value || undefined })}
              className="ml-auto h-7 max-w-[11rem] rounded-full border border-border/70 bg-background px-2 text-[11px] text-muted-foreground"
              aria-label="Tailor suggestions to what you do"
            >
              <option value="">I am a…</option>
              {rolesHere.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          )}
          <button type="button" onClick={() => setHidden(true)} className={cn("rounded-full p-1 text-muted-foreground hover:bg-muted", rolesHere.length > 1 ? "" : "ml-auto")} aria-label="Hide suggestions">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 flex snap-x gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {next.map((s) => {
            const t = catalog.find((x) => x.id === s.id);
            if (!t) return null;
            return (
              <Link key={s.id} to={`/tool/${s.id}`} className="group flex w-[15.5rem] shrink-0 snap-start items-center gap-2.5 rounded-xl border-2 border-ink bg-card px-2.5 py-2 transition-colors hover:border-ink">
                <AppIcon toolId={t.id} category={t.category} name={t.name} size="sm" className="h-9 w-9" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold group-hover:text-primary">{t.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {s.learned ? "You often open this next" : s.why ?? t.description}
                    {CONTEXT_AWARE.has(s.id) && carry ? " · pre-filled" : ""}
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
