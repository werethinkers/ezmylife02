import { useMemo } from "react";
import { APPS } from "@/apps/registry";
import { categoryInfo, goalOf, giveGetFor } from "@/data/goals";
import { appKindOf } from "@/data/appKind";
import { appDetail } from "@/lib/appDetail";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

/*
 * "About this app": the same app-specific text the build writes into the page for search engines
 * (scripts/prerender-apps.mjs), so a visitor and a crawler read the same words. Built from the
 * app's own definition; see src/lib/appDetail.ts.
 *
 * `wide` is an opt-in layout for Studio tool pages (card grid + accordion FAQ, matching their wider
 * container); every other caller keeps the original narrow prose layout by leaving it out.
 */
export function AppAbout({ toolId, name, description, category, wide }: { toolId: string; name: string; description?: string; category: string; wide?: boolean }) {
  const detail = useMemo(() => {
    const info = categoryInfo(category);
    const { give, get } = giveGetFor(category, { kind: appKindOf(toolId, category) });
    return appDetail({ name, description, category }, APPS[toolId], { categoryLine: info.line, give, get, goalName: goalOf(category).name });
  }, [toolId, name, description, category]);

  if (!detail.sections.length) return null;

  if (!wide) {
    return (
      <section aria-label={`About ${name}`} className="mx-auto w-full max-w-3xl px-4 py-10">
        <h2 className="font-display text-2xl font-bold">About {name}</h2>
        {detail.sections.map((s) => (
          <div key={s.heading} className="mt-6">
            <h3 className="text-lg font-bold">{s.heading}</h3>
            {s.paragraphs?.map((p) => (
              <p key={p} className="mt-1 text-muted-foreground">{p}</p>
            ))}
            {s.items?.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
        <h3 className="mt-8 text-lg font-bold">Questions about {name}</h3>
        {detail.faqs.map(([q, a]) => (
          <div key={q} className="mt-3">
            <p className="font-semibold">{q}</p>
            <p className="text-muted-foreground">{a}</p>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section aria-label={`About ${name}`} className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="font-display text-2xl font-bold text-[#111111] dark:text-white">About {name}</h2>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {detail.sections.map((s) => (
          <div key={s.heading} className="rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/10 dark:bg-[#16161A]">
            <h3 className="text-base font-bold text-[#111111] dark:text-white">{s.heading}</h3>
            {s.paragraphs?.map((p) => (
              <p key={p} className="mt-2 text-sm text-black/60 dark:text-white/60">{p}</p>
            ))}
            {s.items?.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black/60 dark:text-white/60">
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>

      <h3 className={cn("mt-10 font-display text-xl font-bold text-[#111111] dark:text-white")}>Questions about {name}</h3>
      <Accordion type="single" collapsible className="mt-4 rounded-3xl border border-black/[0.08] bg-white px-5 dark:border-white/10 dark:bg-[#16161A]">
        {detail.faqs.map(([q, a], i) => (
          <AccordionItem key={q} value={`faq-${i}`} className="border-black/[0.08] dark:border-white/10">
            <AccordionTrigger className="text-left text-sm font-semibold text-[#111111] hover:no-underline dark:text-white">{q}</AccordionTrigger>
            <AccordionContent className="text-sm text-black/60 dark:text-white/60">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
