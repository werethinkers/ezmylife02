import { useState } from "react";
import { useAppStore, uid } from "../lib/store";
import { addHistory, type HistoryItem } from "../shell/HistoryList";

/** Saved results for a flagship app (synced to the account when signed in) and the one on screen. */
export function useResults(toolId: string) {
  const store = useAppStore<{ history: HistoryItem[]; savedAt?: number }>(toolId, { history: [] });
  const [output, setOutput] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const save = (title: string, text: string, inputs?: any, id = activeId ?? uid()) => {
    const item: HistoryItem = { id, at: Date.now(), title: title.slice(0, 60), output: text, inputs };
    setOutput(text);
    setActiveId(id);
    store.update((d) => ({ history: addHistory(d.history, item) }));
    requestAnimationFrame(() => document.getElementById(`${toolId}-output`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const open = (h: HistoryItem) => {
    setOutput(h.output);
    setActiveId(h.id);
  };
  const remove = (id: string) => {
    store.update((d) => ({ history: (d.history ?? []).filter((h) => h.id !== id) }));
    if (id === activeId) {
      setOutput("");
      setActiveId(null);
    }
  };
  const reset = () => {
    setOutput("");
    setActiveId(null);
  };
  return { store, history: store.data.history ?? [], output, setOutput, activeId, save, open, remove, reset, newId: uid };
}
