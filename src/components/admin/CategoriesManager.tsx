import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Pencil, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GOALS } from "@/data/goals";
import { tagCounts } from "@/lib/catalogTags";
import { useCategoryRows, useRefreshGroupings, type AdminCategory } from "@/hooks/useCategoryRows";
import { CategoryDialog } from "./CategoryDialog";
import { GroupingPicker, type Grouping } from "./GroupingPicker";

interface GroupingTool {
  id: string;
  name: string;
  category: string;
  tool_types: string[];
  extra_categories?: string[];
  is_live: boolean;
  created_at: string;
}

const NEW_DAYS = 14;
const MIN_APPS_FOR_CHIP = 3;

/**
 * Where every app sits, in one place. Categories can be made and reworded here; apps that were just
 * added (or have no category that exists, or no filter types) are listed so they get grouped before
 * anyone looks for them. Everything saved here shows on the home page and the apps page.
 */
export function CategoriesManager() {
  const refresh = useRefreshGroupings();
  const { data: categories = [] } = useCategoryRows();
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [fixing, setFixing] = useState<GroupingTool | null>(null);
  const [draft, setDraft] = useState<Grouping>({ category: "", extra: [], tags: [] });
  const [saving, setSaving] = useState(false);

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["admin-grouping-tools"],
    queryFn: async (): Promise<GroupingTool[]> => {
      const cols = "id,name,category,tool_types,is_live,created_at";
      let res = await supabase.from("tools_catalog").select(`${cols},extra_categories`).order("created_at", { ascending: false });
      if (res.error) res = (await supabase.from("tools_catalog").select(cols).order("created_at", { ascending: false })) as typeof res;
      if (res.error) throw res.error;
      return (res.data ?? []) as unknown as GroupingTool[];
    },
  });

  const hasExtraColumn = tools.some((t) => "extra_categories" in t);
  const names = useMemo(() => new Set(categories.map((c) => c.name)), [categories]);

  const counts = useMemo(() => {
    const main = new Map<string, number>();
    const also = new Map<string, number>();
    tools.filter((t) => t.is_live).forEach((t) => {
      main.set(t.category, (main.get(t.category) ?? 0) + 1);
      (t.extra_categories ?? []).forEach((c) => also.set(c, (also.get(c) ?? 0) + 1));
    });
    return { main, also };
  }, [tools]);

  // Apps that need someone to look at their grouping, with the reason.
  const needsLook = useMemo(() => {
    const since = Date.now() - NEW_DAYS * 86400000;
    return tools
      .map((t) => {
        const reasons: string[] = [];
        if (!names.has(t.category)) reasons.push(t.category ? `Category "${t.category}" is not set up (shows under More apps)` : "No category");
        if (!(t.tool_types ?? []).length) reasons.push("No filter types");
        if (new Date(t.created_at).getTime() > since) reasons.push("Added in the last 2 weeks");
        return { t, reasons };
      })
      .filter((x) => x.reasons.length > 0 && (x.reasons.length > 1 || !x.reasons[0].startsWith("Added") || x.t.is_live));
  }, [tools, names]);

  const tags = useMemo(() => tagCounts(tools.filter((t) => t.is_live)), [tools]);

  const open = (t: GroupingTool) => {
    setFixing(t);
    setDraft({ category: names.has(t.category) ? t.category : "", extra: (t.extra_categories ?? []).filter((c) => c !== t.category), tags: t.tool_types ?? [] });
  };

  const saveGrouping = async () => {
    if (!fixing) return;
    if (!draft.category) return toast.error("Pick a main category");
    setSaving(true);
    const payload: Record<string, unknown> = { category: draft.category, tool_types: draft.tags };
    if (hasExtraColumn) payload.extra_categories = draft.extra.filter((c) => c !== draft.category);
    const { error } = await supabase.from("tools_catalog").update(payload as never).eq("id", fixing.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${fixing.name} grouped`);
    setFixing(null);
    refresh();
  };

  return (
    <div className="space-y-6">
      {!hasExtraColumn && !isLoading && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            The database has not been updated for editable groupings yet, so "also show under" is switched off and new categories cannot be saved. The update is
            <code className="mx-1 rounded bg-white px-1">supabase/migrations/…_catalog_groupings.sql</code>
            in the repo.
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Categories</CardTitle>
            <CardDescription>The groups on the home page and the apps page, under each goal. App counts are live apps.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-1 h-4 w-4" /> New category
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {GOALS.map((g) => {
            const cats = categories.filter((c) => c.goal === g.id);
            if (!cats.length) return null;
            return (
              <div key={g.id}>
                <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                  <span className="h-3 w-3 rounded-full border" style={{ background: g.color }} aria-hidden /> {g.name}
                </div>
                <div className="divide-y rounded-lg border">
                  {cats.map((c) => (
                    <div key={c.name} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {c.name}
                          {c.sort_order > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">position {c.sort_order}</span>}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{c.line || "No description"}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {counts.main.get(c.name) ?? 0} apps{(counts.also.get(c.name) ?? 0) > 0 ? ` + ${counts.also.get(c.name)} also` : ""}
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" /> Needs a look
            {needsLook.length > 0 && <Badge>{needsLook.length}</Badge>}
          </CardTitle>
          <CardDescription>
            New apps (the last {NEW_DAYS} days), and apps without a set-up category or filter types. Open one to choose where it shows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : needsLook.length === 0 ? (
            <p className="text-sm text-muted-foreground">Every app is grouped. 🎉</p>
          ) : (
            <div className="divide-y rounded-lg border">
              {needsLook.slice(0, 60).map(({ t, reasons }) => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {t.name} <span className="font-mono text-xs font-normal text-muted-foreground">{t.id}</span>
                      {!t.is_live && <Badge variant="secondary" className="ml-2">draft</Badge>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.category || "—"}
                      {(t.extra_categories ?? []).length ? ` + ${(t.extra_categories ?? []).join(", ")}` : ""} · {reasons.join(" · ")}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => open(t)}>
                    Set grouping
                  </Button>
                </div>
              ))}
              {needsLook.length > 60 && <p className="px-3 py-2 text-xs text-muted-foreground">Showing the first 60 of {needsLook.length}.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter types in use</CardTitle>
          <CardDescription>
            The "Type" filter on the apps page. A type needs {MIN_APPS_FOR_CHIP} or more live apps to get a chip; types below that are shown dimmed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Badge key={t.key} variant={t.count >= MIN_APPS_FOR_CHIP ? "default" : "outline"} className={t.count >= MIN_APPS_FOR_CHIP ? "" : "opacity-60"}>
                {t.label} · {t.count}
              </Badge>
            ))}
            {tags.length === 0 && <p className="text-sm text-muted-foreground">No filter types yet.</p>}
          </div>
        </CardContent>
      </Card>

      <CategoryDialog open={creating} onOpenChange={setCreating} knownNames={categories.map((c) => c.name)} />
      <CategoryDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} existing={editing} knownNames={categories.map((c) => c.name)} />

      <Dialog open={!!fixing} onOpenChange={(o) => !o && setFixing(null)}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{fixing?.name}</DialogTitle>
            <DialogDescription>Choose where this app shows on the home page and the apps page.</DialogDescription>
          </DialogHeader>
          <GroupingPicker value={draft} onChange={setDraft} allTools={tools} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFixing(null)}>Cancel</Button>
            <Button onClick={saveGrouping} disabled={saving}>{saving ? "Saving…" : "Save grouping"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
