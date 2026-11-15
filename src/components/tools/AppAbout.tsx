import { useMemo } from "react";
import { APPS } from "@/apps/registry";
import { categoryInfo, goalOf, giveGetFor } from "@/data/goals";
import { appKindOf } from "@/data/appKind";
import { appDetail } from "@/lib/appDetail";

/*
 * "About this app": the same app-specific text the build writes into the page for search engines
 * (scripts/prerender-apps.mjs), so a visitor and a crawler read the same words. Built from the
 * app's own definition; see src/lib/appDetail.ts.
 */
export function AppAbout({ toolId, name, description, category }: { toolId: string; name: string; description?: string; category: string }) {
  const detail = useMemo(() => {
    const info = categoryInfo(category);
    const { give, get } = giveGetFor(category, { kind: appKindOf(toolId, category) });
    return appDetail({ name, description, category }, APPS[toolId], { categoryLine: info.line, give, get, goalName: goalOf(category).name });
  }, [toolId, name, description, category]);

  if (!detail.sections.length) return null;
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
