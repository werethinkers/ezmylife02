import { useEffect } from "react";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppShell } from "../shell/AppShell";
import { useAppStore } from "../lib/store";
import { useRun } from "../lib/api";
import { downloadText, downloadWord, printMarkdown } from "../lib/files";
import { takeHandoff } from "../lib/handoff";
import { APPS } from "../registry";
import { MarkdownEditor } from "./MarkdownEditor";

export default function RichEditor({ toolId }: { toolId: string }) {
  const def = APPS[toolId];
  const store = useAppStore<{ text: string; title: string; savedAt?: number }>(toolId, { text: "", title: "Untitled document" });
  const { busy, run } = useRun(toolId);
  const text = store.data.text ?? "";

  useEffect(() => {
    const h = takeHandoff(toolId);
    if (h) {
      store.update({ text: h.text, title: `From ${h.fromName}` });
      toast.success(`Opened your result from ${h.fromName}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId]);

  return (
    <AppShell toolId={toolId} intro={def.intro} related={def.related} syncState={store.syncState}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={store.data.title ?? ""} onChange={(e) => store.update({ title: e.target.value })} className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none" aria-label="Document title" />
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => downloadWord(text, store.data.title || "document", store.data.title)}><Download className="h-3.5 w-3.5" /> Word</Button>
        <Button size="sm" variant="outline" onClick={() => downloadText(text, `${store.data.title || "document"}.md`, "text/markdown")}>.md</Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => printMarkdown(text, store.data.title || "Document") || toast.error("Allow pop-ups to print.")}><Printer className="h-3.5 w-3.5" /> PDF</Button>
      </div>
      <MarkdownEditor
        value={text}
        onChange={(v) => store.update({ text: v })}
        busy={busy}
        placeholder="Start writing… Use the bar above for formatting, or the AI actions below."
        onAi={(instruction, t) => run<string>({ inputs: { Instruction: instruction, Text: t.slice(0, 6000) } })}
      />
    </AppShell>
  );
}
