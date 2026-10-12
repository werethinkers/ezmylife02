import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GOALS, KIND_TEXT, type AppKind } from "@/data/goals";
import { useRefreshGroupings, type AdminCategory } from "@/hooks/useCategoryRows";

const KIND_LABEL: Record<AppKind, string> = {
  quick: "Works in a few taps (type a line, get an answer)",
  document: "Opens a document maker (fill a form, get a document)",
  sheet: "Opens a sheet (rows that add up)",
  photo: "Opens a photo editor",
  file: "Opens a file converter (add files, download new ones)",
};

/**
 * Make a new category, or change the wording and place of an existing one. A category's name is
 * what every app stores, so it cannot be renamed here; everything else can.
 */
export function CategoryDialog({
  open,
  onOpenChange,
  existing,
  knownNames,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: AdminCategory | null;
  knownNames: string[];
  onSaved?: (name: string) => void;
}) {
  const refresh = useRefreshGroupings();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("business");
  const [line, setLine] = useState("");
  const [give, setGive] = useState("");
  const [get, setGet] = useState("");
  const [kind, setKind] = useState<AppKind>("document");
  const [order, setOrder] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? "");
    setGoal(existing?.goal ?? "business");
    setLine(existing?.line ?? "");
    setGive(existing?.give ?? "");
    setGet(existing?.get_text ?? "");
    setKind((existing?.kind as AppKind) ?? "document");
    setOrder(String(existing?.sort_order ?? 0));
  }, [open, existing]);

  const save = async () => {
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.length < 2 || clean.length > 40) return toast.error("Give the category a name of 2 to 40 characters");
    if (!existing && knownNames.some((n) => n.toLowerCase() === clean.toLowerCase())) return toast.error(`There is already a category called "${clean}"`);
    if (!give.trim() || !get.trim()) return toast.error('Say what people give the app and what they get back ("You give / You get")');
    setSaving(true);
    const row = {
      name: existing?.name ?? clean,
      goal,
      line: line.trim(),
      give: give.trim(),
      get_text: get.trim(),
      kind,
      doc_give: existing?.doc_give ?? null,
      doc_get: existing?.doc_get ?? null,
      sort_order: Math.max(0, parseInt(order, 10) || 0),
      updated_at: new Date().toISOString(),
    };
    // upsert: a built-in category that is not in the table yet is saved on its first edit.
    const { error } = await supabase.from("catalog_categories").upsert(row, { onConflict: "name" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(existing ? "Category saved" : `Category "${row.name}" created`);
    refresh();
    onSaved?.(row.name);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? `Edit "${existing.name}"` : "New category"}</DialogTitle>
          <DialogDescription>
            {existing
              ? "Changes show on the home page and the apps page for every app in this category."
              : "It appears on the home page and the apps page as soon as an app is put in it."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!existing && (
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Real Estate" maxLength={40} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Which goal does it sit under on the home page?</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GOALS.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name} — {g.line}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>One plain line about it</Label>
            <Input value={line} onChange={(e) => setLine(e.target.value)} placeholder="Listings, rent receipts and agreements." maxLength={90} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>You give</Label>
              <Input value={give} onChange={(e) => setGive(e.target.value)} placeholder="the property details" maxLength={70} />
            </div>
            <div className="space-y-1.5">
              <Label>You get</Label>
              <Input value={get} onChange={(e) => setGet(e.target.value)} placeholder="a ready listing or agreement" maxLength={70} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>How its apps open</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as AppKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_TEXT) as AppKind[]).map((k) => (
                  <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Position inside its goal</Label>
            <Input value={order} onChange={(e) => setOrder(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="w-24" />
            <p className="text-xs text-muted-foreground">1 shows first, 2 next… Leave 0 to put the category with the most apps first.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : existing ? "Save" : "Create category"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
