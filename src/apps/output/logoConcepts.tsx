import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Maximize2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { NeedsCredits, errorText } from "../lib/api";
import { downloadBlob, dataUrlToBlob } from "../lib/files";
import { runFlagship } from "../flagship/api";

/*
 * Turns a Brand Identity Kit's "Logo directions" section into 3 real images, automatically, the
 * moment a kit finishes — each direction is its own 30-credit image call (the same one the manual
 * "Make brand visuals" picker uses), fired in parallel, each failing or retrying on its own so one
 * bad generation never costs the other two or the text kit. The caller (PlanApp) holds the 3
 * results and which one is picked for the mock-ups below, keyed by result id, so switching
 * between two results already generated in this visit — or just re-rendering — never re-fires
 * them; it's kept in memory only, so leaving and coming back later does start them again.
 */

export interface LogoDirection {
  title: string;
  description: string;
}

export interface LogoSlot extends LogoDirection {
  status: "pending" | "ready" | "error";
  url?: string;
}

export interface LogoState {
  slots: LogoSlot[];
  selected: number;
}

/** "1. **Hand-thrown mark** — a simple pot silhouette..." → the 3 logo directions, numbered or bulleted. */
export function extractLogoDirections(markdown: string): LogoDirection[] {
  const m = markdown.match(/^#{1,6}\s*logo directions\b.*$/im);
  if (!m || m.index === undefined) return [];
  const rest = markdown.slice(m.index + m[0].length);
  const end = rest.search(/\n#{1,6}\s/);
  const section = rest.slice(0, end === -1 ? rest.length : end);
  const items: string[] = [];
  for (const raw of section.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m2 = line.match(/^(?:\d+[.)]|[-*])\s+(.*)$/);
    if (m2) items.push(m2[1]);
    else if (items.length) items[items.length - 1] += ` ${line}`;
  }
  return items.slice(0, 3).map((raw, i) => {
    const cleaned = raw.replace(/\*\*/g, "");
    // Try an em dash first (what the prompts' "Name — description" style actually uses), then a
    // colon (no space needed before it), then a plain " - "; a hyphen inside a word like
    // "Hand-thrown" never matches any of these, so it can't be mistaken for a separator.
    const m = cleaned.match(/^(.{3,60}?)\s*—\s*(.+)$/) ?? cleaned.match(/^(.{3,60}?):\s(.+)$/) ?? cleaned.match(/^(.{3,60}?)\s-\s(.+)$/);
    return m ? { title: m[1].trim(), description: m[2].trim() } : { title: `Direction ${i + 1}`, description: cleaned };
  });
}

function Slot({ slot, i, selected, onSelect, onRetry, onPreview }: { slot: LogoSlot; i: number; selected: boolean; onSelect: () => void; onRetry: () => void; onPreview: () => void }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border-2 transition-colors", selected ? "border-teal" : "border-ink")}>
      <div className="relative aspect-square w-full bg-sand">
        {slot.status === "pending" && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground" aria-live="polite">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-[11px]">Making this concept…</span>
          </div>
        )}
        {slot.status === "error" && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-xs text-muted-foreground">
            <span>Couldn't make this one. You weren't charged.</span>
            <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2 text-[11px]" onClick={onRetry}>
              <RotateCcw className="h-3 w-3" /> Retry
            </Button>
          </div>
        )}
        {slot.status === "ready" && slot.url && (
          <>
            <button type="button" onClick={onSelect} className="block h-full w-full" aria-pressed={selected} aria-label={`Use "${slot.title}" in the brand mock-ups below`}>
              <img src={slot.url} alt={slot.title} className="h-full w-full object-contain p-2" />
            </button>
            {selected && <span className="absolute left-1.5 top-1.5 rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold text-white">Selected</span>}
            <div className="absolute bottom-1.5 right-1.5 flex gap-1">
              <Button size="icon" variant="secondary" className="h-7 w-7" onClick={onPreview} aria-label="View full size">
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7"
                onClick={async () => downloadBlob(await dataUrlToBlob(slot.url as string), `logo-concept-${i + 1}.png`)}
                aria-label="Download this concept"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}
      </div>
      <div className="space-y-0.5 bg-card p-2.5">
        <p className="truncate text-xs font-bold">{slot.title}</p>
        <p className="line-clamp-2 text-[11px] text-muted-foreground">{slot.description}</p>
      </div>
    </div>
  );
}

export function LogoConcepts({
  toolId,
  resultId,
  text,
  state,
  onStateChange,
}: {
  toolId: string;
  resultId: string | null;
  text: string;
  state?: LogoState;
  onStateChange: (id: string, state: LogoState) => void;
}) {
  const directions = extractLogoDirections(text);
  const startedFor = useRef<string | null>(null);
  const inFlight = useRef<Set<number>>(new Set());
  const stateRef = useRef<LogoState>(state ?? { slots: [], selected: 0 });
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  useEffect(() => {
    if (state) stateRef.current = state;
  }, [state]);

  const generateOne = async (id: string, i: number) => {
    if (inFlight.current.has(i)) return;
    inFlight.current.add(i);
    const patch = (p: Partial<LogoSlot>) => {
      const slots = stateRef.current.slots.map((s, j) => (j === i ? { ...s, ...p } : s));
      const next = { ...stateRef.current, slots };
      stateRef.current = next;
      onStateChange(id, next);
    };
    patch({ status: "pending", url: undefined });
    try {
      const slot = stateRef.current.slots[i];
      const prompt = `${slot.title}: ${slot.description}\n\nA single, clean, minimal logo mark or wordmark concept, vector-style, centred alone on a plain white background. No mockup, no other objects, no extra text beyond the brand name if the direction itself describes a wordmark.`;
      const { output } = await runFlagship<string>(toolId, "image", { prompt });
      patch({ status: "ready", url: output });
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
      patch({ status: "error" });
    } finally {
      inFlight.current.delete(i);
    }
  };

  useEffect(() => {
    if (!resultId || !directions.length || startedFor.current === resultId) return;
    startedFor.current = resultId;
    if (!stateRef.current.slots.length) {
      const slots: LogoSlot[] = directions.map((d) => ({ ...d, status: "pending" }));
      const next: LogoState = { slots, selected: 0 };
      stateRef.current = next;
      onStateChange(resultId, next);
      slots.forEach((_, i) => void generateOne(resultId, i));
    } else {
      // Resuming a past result: finish anything left stuck "pending" from an interrupted session;
      // anything already ready or failed stays as it is, so revisiting never re-spends credits.
      stateRef.current.slots.forEach((s, i) => {
        if (s.status === "pending") void generateOne(resultId, i);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultId, directions.length]);

  if (!resultId || !directions.length || !state?.slots.length) return null;

  return (
    <div className="space-y-3">
      <p className="text-[15px] font-bold">Logo concepts</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {state.slots.map((slot, i) => (
          <Slot
            key={i}
            slot={slot}
            i={i}
            selected={state.selected === i}
            onSelect={() => onStateChange(resultId, { ...state, selected: i })}
            onRetry={() => void generateOne(resultId, i)}
            onPreview={() => setPreviewIndex(i)}
          />
        ))}
      </div>
      <Dialog open={previewIndex !== null} onOpenChange={(o) => !o && setPreviewIndex(null)}>
        <DialogContent className="max-w-xl">
          <DialogTitle>{previewIndex !== null ? state.slots[previewIndex]?.title : ""}</DialogTitle>
          {previewIndex !== null && state.slots[previewIndex]?.url && (
            <div className="space-y-3">
              <img src={state.slots[previewIndex].url} alt={state.slots[previewIndex].title} className="max-h-[70vh] w-full rounded-xl border border-black/10 object-contain" />
              <Button
                size="sm"
                className="gap-1.5"
                onClick={async () => downloadBlob(await dataUrlToBlob(state.slots[previewIndex!].url as string), `logo-concept-${previewIndex! + 1}.png`)}
              >
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
