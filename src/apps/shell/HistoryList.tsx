import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HistoryItem {
  id: string;
  at: number;
  title: string;
  output: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputs?: any;
}

export const HISTORY_LIMIT = 15;

export function addHistory(list: HistoryItem[] | undefined, item: HistoryItem): HistoryItem[] {
  return [{ ...item, output: item.output.slice(0, 60_000) }, ...(list ?? []).filter((h) => h.id !== item.id)].slice(0, HISTORY_LIMIT);
}

const when = (t: number) => {
  const d = new Date(t);
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

/** Recent results for an app — open one again or delete it. */
export function HistoryList({
  items,
  activeId,
  onOpen,
  onDelete,
}: {
  items: HistoryItem[];
  activeId?: string | null;
  onOpen: (h: HistoryItem) => void;
  onDelete: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3">
      <p className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Clock className="h-3.5 w-3.5" /> Recent
      </p>
      <ul className="mt-2 space-y-0.5">
        {items.map((h) => (
          <li key={h.id} className="group flex items-center gap-1">
            <button
              type="button"
              onClick={() => onOpen(h)}
              className={`min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${activeId === h.id ? "bg-muted font-medium" : ""}`}
            >
              <span className="block truncate">{h.title}</span>
              <span className="text-[11px] text-muted-foreground">{when(h.at)}</span>
            </button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-60 group-hover:opacity-100"
              onClick={() => onDelete(h.id)}
              aria-label={`Delete ${h.title}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
