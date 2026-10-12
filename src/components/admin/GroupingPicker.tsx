import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GOALS } from "@/data/goals";
import { tagCounts, tagKey } from "@/lib/catalogTags";
import { useCategoryRows } from "@/hooks/useCategoryRows";
import { CategoryDialog } from "./CategoryDialog";

export interface Grouping {
  category: string;
  extra: string[];
  tags: string[];
}

/**
 * The one place an app's groupings are set: its main category, the other categories it should
 * also show under, and its filter types. A line underneath says where it will appear on the site,
 * and a missing category can be made on the spot.
 */
export function GroupingPicker({
  value,
  onChange,
  allTools,
}: {
  value: Grouping;
  onChange: (v: Grouping) => void;
  /** Every app in the catalogue, to suggest the filter types already in use. */
  allTools: { tool_types?: string[] | null }[];
}) {
  const { data: categories = [] } = useCategoryRows();
  const [creating, setCreating] = useState(false);
  const [newTag, setNewTag] = useState("");

  const goalOf = (cat: string) => categories.find((c) => c.name === cat)?.goal;
  const goalName = (cat: string) => GOALS.find((g) => g.id === goalOf(cat))?.name;
  const known = categories.some((c) => c.name === value.category);
  const byGoal = useMemo(
    () => GOALS.map((g) => ({ goal: g, cats: categories.filter((c) => c.goal === g.id) })).filter((x) => x.cats.length),
    [categories],
  );

  const tagList = useMemo(() => tagCounts(allTools), [allTools]);
  const selectedKeys = new Set(value.tags.map(tagKey));
  // Suggested: the types in use that are not picked yet.
  const suggestions = tagList.filter((t) => !selectedKeys.has(t.key)).slice(0, 14);

  const setCategory = (category: string) => onChange({ ...value, category, extra: value.extra.filter((c) => c !== category) });
  const toggleExtra = (c: string) =>
    onChange({ ...value, extra: value.extra.includes(c) ? value.extra.filter((x) => x !== c) : [...value.extra, c] });
  const addTag = (raw: string) => {
    const t = raw.trim().replace(/\s+/g, " ");
    if (!t || selectedKeys.has(tagKey(t))) return setNewTag("");
    // Reuse the spelling already in use so "ai" does not become a second tag next to "AI".
    const existing = tagList.find((x) => x.key === tagKey(t))?.label ?? t;
    onChange({ ...value, tags: [...value.tags, existing] });
    setNewTag("");
  };
  const removeTag = (key: string) => onChange({ ...value, tags: value.tags.filter((t) => tagKey(t) !== key) });

  const placed = [value.category, ...value.extra].filter(Boolean);

  return (
    <div className="space-y-4 rounded-lg border p-3">
      <div className="space-y-1.5">
        <Label>Main category</Label>
        <div className="flex gap-2">
          <Select value={known ? value.category : undefined} onValueChange={setCategory}>
            <SelectTrigger className={cn("flex-1", !value.category && "text-muted-foreground")}>
              <SelectValue placeholder={value.category && !known ? `${value.category} (not set up)` : "Pick a category"} />
            </SelectTrigger>
            <SelectContent>
              {byGoal.map(({ goal, cats }) => (
                <SelectGroup key={goal.id}>
                  <SelectLabel>{goal.name}</SelectLabel>
                  {cats.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={() => setCreating(true)}>
            <Plus className="mr-1 h-4 w-4" /> New category
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Decides the goal it sits under on the home page, and the "you give / you get" wording.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Also show it under <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <div className="flex flex-wrap gap-1.5">
          {categories
            .filter((c) => c.name !== value.category)
            .map((c) => {
              const on = value.extra.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => toggleExtra(c.name)}
                  aria-pressed={on}
                  className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary")}
                >
                  {c.name}
                </button>
              );
            })}
        </div>
        <p className="text-xs text-muted-foreground">For an app people would look for in two places, like a loan agreement (Finance and Legal).</p>
      </div>

      <div className="space-y-1.5">
        <Label>Filter types</Label>
        <div className="flex flex-wrap gap-1.5">
          {value.tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
              {t}
              <button type="button" onClick={() => removeTag(tagKey(t))} aria-label={`Remove ${t}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {value.tags.length === 0 && <span className="text-xs text-muted-foreground">None yet. Pick from below or add one.</span>}
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((t) => (
              <button key={t.key} type="button" onClick={() => addTag(t.label)} className="rounded-full border px-2.5 py-0.5 text-xs hover:border-primary">
                + {t.label} <span className="text-muted-foreground">{t.count}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(newTag);
              }
            }}
            placeholder="Add a new type, e.g. Printable forms"
            maxLength={40}
            className="h-8"
          />
          <Button type="button" size="sm" variant="outline" onClick={() => addTag(newTag)} disabled={!newTag.trim()}>Add</Button>
        </div>
        <p className="text-xs text-muted-foreground">Shown as "Type" filters on the apps page once 3 or more apps share one.</p>
      </div>

      <div className={cn("rounded-md p-2.5 text-xs", known ? "bg-muted/60" : "bg-amber-50 text-amber-900")}>
        {!value.category ? (
          <p className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Pick a main category or the app will not be grouped.</p>
        ) : !known ? (
          <p className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> "{value.category}" is not a set-up category, so this app would land in "More apps". Pick one above or make it with New category.
          </p>
        ) : (
          <div className="space-y-0.5">
            <p className="font-semibold">Where it will show</p>
            {placed.map((c) => (
              <p key={c} className="flex items-center gap-1">
                {goalName(c) ?? "More apps"} <ArrowRight className="h-3 w-3" /> {c}
                {c === value.category && <span className="text-muted-foreground">(main)</span>}
              </p>
            ))}
          </div>
        )}
      </div>

      <CategoryDialog
        open={creating}
        onOpenChange={setCreating}
        knownNames={categories.map((c) => c.name)}
        onSaved={(name) => setCategory(name)}
      />
    </div>
  );
}
