import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { gb } from "../lib/business";
import { useMemo } from "react";
import { CopyButton } from "../components/CopyButton";
import { Panel, useBusinessData } from "../components/dash";
import { generateKeywords } from "../lib/generate";


export default function Keywords() {
  const { id } = useParams() as { id: string; sid: string };
  const { biz } = useBusinessData(id);
  const groups = useMemo(() => (biz ? generateKeywords(biz) : []), [biz]);
  if (!biz) return null;
  const total = groups.reduce((n, g) => n + g.keywords.length, 0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Keywords</h2>
          <p className="text-sm text-muted-foreground">{total} keywords from your products, business type and {biz.locations.length} location(s).</p>
        </div>
        <CopyButton text={groups.flatMap((g) => g.keywords).join("\n")} label="Copy all" />
      </div>
      {groups.map((g) => (
        <Panel key={g.title} title={`${g.title} · ${g.keywords.length}`} hint={g.hint} action={<CopyButton text={g.keywords.join("\n")} size="icon" variant="ghost" />}>
          <div className="flex flex-wrap gap-1.5">
            {g.keywords.map((k) => (
              <span key={k} className="rounded-md bg-secondary px-2 py-1 text-sm">{k}</span>
            ))}
          </div>
        </Panel>
      ))}
      <p className="text-xs text-muted-foreground">
        Built from what you entered, not search-volume data. Check the important ones in Google Trends or Search Console before spending on ads.
        Adding more products or locations adds more keywords.
      </p>
    </div>
  );
}
