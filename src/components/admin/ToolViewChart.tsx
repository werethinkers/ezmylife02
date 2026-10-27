import { useMemo } from "react";
import { CollapsibleCard } from "@/components/admin/CollapsibleCard";
import { BarChart3 } from "lucide-react";
import type { ToolViewStat } from "@/hooks/useToolViewCounts";

interface Props {
  stats: Map<string, ToolViewStat>;
  toolNames: Map<string, string>;
}

export function ToolViewChart({ stats, toolNames }: Props) {
  const top = useMemo(() => {
    return Array.from(stats.values())
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, 10);
  }, [stats]);

  const max = top[0]?.view_count ?? 1;

  return (
    <CollapsibleCard title={<><BarChart3 className="h-4 w-4" /> Top 10 Most-Viewed Tools</>}>
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No tool views recorded yet. Data appears once visitors open /tool/* pages.
        </p>
      ) : (
        <div className="space-y-2">
          {top.map((s) => {
            const name = toolNames.get(s.tool_id) ?? s.tool_id;
            const pct = Math.max(4, Math.round((s.view_count / max) * 100));
            return (
              <div key={s.tool_id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate flex-1 mr-2">{name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {s.view_count.toLocaleString()} views · {s.unique_visitors.toLocaleString()} unique
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CollapsibleCard>
  );
}
