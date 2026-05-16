import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Save, Wand2, CheckCircle2, Circle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ToolRow {
  id: string;
  name: string;
  description: string;
  demo_input: string | null;
  demo_output: string | null;
}

export default function ToolDemoEditor() {
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [working, setWorking] = useState<"" | "gen" | "save" | "bulk">("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tools_catalog")
      .select("id,name,description,demo_input,demo_output")
      .eq("is_live", true)
      .order("name");
    setTools((data as ToolRow[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = tools;
    if (onlyMissing) list = list.filter((t) => !t.demo_input || !t.demo_output);
    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter((t) => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
    }
    return list;
  }, [tools, filter, onlyMissing]);

  const stats = useMemo(() => {
    const done = tools.filter((t) => t.demo_input && t.demo_output).length;
    return { done, total: tools.length };
  }, [tools]);

  const pick = (t: ToolRow) => {
    setSelected(t.id);
    setInput(t.demo_input || "");
    setOutput(t.demo_output || "");
  };

  const regenerate = async (save: boolean) => {
    if (!selected) return;
    setWorking("gen");
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-tool-demo", {
        body: { tool_id: selected, save },
      });
      if (error) throw error;
      setInput((data as { input: string }).input);
      setOutput((data as { output: string }).output);
      toast({ title: save ? "Generated & saved" : "Generated (preview)" });
      if (save) load();
    } catch (e) {
      toast({ title: "Generation failed", description: String(e), variant: "destructive" });
    } finally { setWorking(""); }
  };

  const save = async () => {
    if (!selected) return;
    setWorking("save");
    const { error } = await supabase
      .from("tools_catalog")
      .update({ demo_input: input || null, demo_output: output || null })
      .eq("id", selected);
    setWorking("");
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Saved" });
    load();
  };

  const bulkFillMissing = async () => {
    const missing = tools.filter((t) => !t.demo_input || !t.demo_output);
    if (!missing.length) { toast({ title: "Nothing to generate" }); return; }
    if (!confirm(`Generate demos for ${missing.length} apps via Gemini? This may take a few minutes.`)) return;
    setWorking("bulk");
    let ok = 0, fail = 0;
    for (const t of missing) {
      try {
        const { error } = await supabase.functions.invoke("regenerate-tool-demo", { body: { tool_id: t.id, save: true } });
        if (error) throw error;
        ok++;
      } catch { fail++; }
      // small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 800));
    }
    setWorking("");
    toast({ title: `Bulk done: ${ok} ok, ${fail} failed` });
    load();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle>Demo Examples Editor</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{stats.done}/{stats.total} filled</Badge>
            <Button size="sm" variant="outline" onClick={() => setOnlyMissing((v) => !v)}>
              {onlyMissing ? "Show all" : "Show missing only"}
            </Button>
            <Button size="sm" onClick={bulkFillMissing} disabled={working === "bulk"}>
              {working === "bulk" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Wand2 className="h-4 w-4 mr-1" />}
              Generate all missing
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-[320px_1fr] gap-4">
          <div className="space-y-2">
            <Input placeholder="Search by name or id…" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <div className="border border-border rounded-md max-h-[60vh] overflow-auto">
              {loading ? (
                <div className="p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 inline animate-spin mr-1" /> Loading…</div>
              ) : filtered.map((t) => {
                const filled = !!(t.demo_input && t.demo_output);
                return (
                  <button
                    key={t.id}
                    onClick={() => pick(t)}
                    className={`w-full text-left px-3 py-2 text-sm border-b border-border/40 hover:bg-muted flex items-center gap-2 ${selected === t.id ? "bg-muted" : ""}`}
                  >
                    {filled ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                    <span className="truncate">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-muted-foreground"> · {t.id}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {!selected ? (
              <div className="text-sm text-muted-foreground p-8 text-center">Select an app from the list to edit its demo.</div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => regenerate(false)} disabled={working === "gen"}>
                    {working === "gen" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Regenerate (preview)
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => regenerate(true)} disabled={working === "gen"}>
                    <Sparkles className="h-4 w-4 mr-1" /> Regenerate & save
                  </Button>
                  <Button size="sm" onClick={save} disabled={working === "save"}>
                    {working === "save" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Save edits
                  </Button>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Demo Input (what the user types)</label>
                  <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Demo Output (markdown supported)</label>
                  <Textarea value={output} onChange={(e) => setOutput(e.target.value)} rows={14} className="font-mono text-xs" />
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
