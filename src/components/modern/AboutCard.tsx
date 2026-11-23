import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CARD } from "./styles";

/** "About this app / website / studio / card" — expandable pitch, give/get lists and a tag-chip row. */
export function AboutCard({
  title,
  description,
  giveItems,
  getItems,
  tags,
}: {
  title: string;
  description?: string;
  giveItems: string[];
  getItems: string[];
  tags: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className={cn("p-5 md:p-7", CARD)}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl font-bold md:text-2xl">{title}</h2>
        {description && (
          <button type="button" onClick={() => setExpanded((e) => !e)} className="shrink-0 text-sm font-bold text-orange-600 md:hidden">
            {expanded ? "Show less" : "Read more →"}
          </button>
        )}
      </div>

      {description && (
        <p className={cn("mt-2 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400", expanded ? "" : "line-clamp-3 md:line-clamp-none")}>
          {description}
        </p>
      )}

      <div className="mt-5 grid gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800 md:grid-cols-2">
        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">What you give</p>
          <ul className="mt-2 space-y-1.5 text-[14px] text-zinc-700 dark:text-zinc-300">
            {giveItems.map((g) => (
              <li key={g} className="flex items-start gap-2">
                <span aria-hidden className="mt-0.5 font-bold text-orange-600">•</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">What you get</p>
          <ul className="mt-2 space-y-1.5 text-[14px] text-zinc-700 dark:text-zinc-300">
            {getItems.map((g) => (
              <li key={g} className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mt-5 flex flex-nowrap gap-2 overflow-x-auto no-scrollbar pt-1">
          {tags.map((t) => (
            <span key={t} className="shrink-0 whitespace-nowrap rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {t}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
