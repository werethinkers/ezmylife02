import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";
import { AppIcon } from "@/components/store/AppIcon";
import { ROLES, CONTEXT_AWARE } from "../workflows";
import { suggestNext, useJourney, useRecordVisit } from "../lib/journey";
import { cn } from "@/lib/utils";

/**
 * Shown on every app: the follow-on apps this person is likely to need next. Apps that read the
 * shared client and numbers say so, because the details carry over without retyping.
 */
export function NextApps({ toolId }: { toolId: string }) {
  useRecordVisit(toolId);
  const { data: j, update } = useJourney();
  const { data: catalog = [] } = useToolsCatalog();
  const [hidden, setHidden] = useState(false);
  const live = (id: string) => catalog.some((t) => t.id === id && t.is_live);
  const next = suggestNext(toolId, j, live);
  const rolesHere = ROLES.filter((r) => r.steps.some((s) => s.toolId === toolId));
  if (hidden || !next.length) return null;
  const carry = CONTEXT_AWARE.has(toolId);

  return (
    <aside className="border-b border-border/40 bg-sand/50" aria-label="Apps you may need next">
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="font-semibold">You may need this too</span>
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
              <Link key={s.id} to={`/tool/${s.id}`} className="group flex w-[15.5rem] shrink-0 snap-start items-center gap-2.5 rounded-xl border-2 border-ink bg-card px-2.5 py-2 transition-colors hover:border-primary/50">
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
