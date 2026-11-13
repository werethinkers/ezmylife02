import { useEffect, useRef, useState } from "react";
import { makePdf, type MadePdf } from "./render";
import type { PdfDoc } from "./types";

export type PreparedPdf =
  | { state: "idle" | "making"; done: number; total: number; previous?: MadePdf }
  | { state: "ready"; pdf: MadePdf }
  | { state: "error" };

/** One PDF at a time on the page, so several results never fight over the off-screen stage. */
let queue: Promise<unknown> = Promise.resolve();

/**
 * Makes the PDF in the background as soon as a result is there (and again after an edit,
 * once typing stops), so "Download PDF" is instant. No AI call: it is made from the same text.
 */
export function usePreparedPdf(doc: PdfDoc | null, { wait = 600, enabled = true } = {}): PreparedPdf {
  const [state, setState] = useState<PreparedPdf>({ state: "idle", done: 0, total: 0 });
  const key = doc && enabled ? JSON.stringify(doc) : "";
  const run = useRef(0);

  useEffect(() => {
    if (!key || !doc) {
      setState({ state: "idle", done: 0, total: 0 });
      return;
    }
    const id = ++run.current;
    const keep = (s: PreparedPdf) => (s.state === "ready" ? s.pdf : s.state === "making" ? s.previous : undefined);
    setState((s) => ({ state: "making", done: 0, total: 0, previous: keep(s) }));
    const t = setTimeout(() => {
      queue = queue
        .catch(() => undefined)
        .then(async () => {
          if (id !== run.current) return;
          try {
            const pdf = await makePdf(doc, (done, total) => {
              if (id === run.current) setState((s) => ({ state: "making", done, total, previous: keep(s) }));
            });
            if (id === run.current) setState({ state: "ready", pdf });
          } catch (e) {
            console.error("PDF failed", e);
            if (id === run.current) setState({ state: "error" });
          }
        });
    }, wait);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, wait]);

  return state;
}
