import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Field, FormValues, RowColumn } from "../types";

type Rows = Record<string, string>[];

/** One form field, rendered the same way in every app. */
export function FieldInput({
  field,
  value,
  onChange,
  idPrefix,
}: {
  field: Field;
  value: string | Rows | undefined;
  onChange: (v: string | Rows) => void;
  idPrefix: string;
}) {
  const id = `${idPrefix}-${field.key.replace(/\W+/g, "-")}`;
  const t = field.type ?? "text";
  const str = typeof value === "string" ? value : "";

  return (
    <div className={cn("space-y-1.5", field.half ? "sm:col-span-1" : "sm:col-span-2")}>
      <Label htmlFor={id} className="text-sm font-semibold">
        {field.label}
        {field.required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {t === "textarea" ? (
        <Textarea id={id} value={str} rows={field.rows ?? 4} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : t === "select" ? (
        <Select value={str || undefined} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id={id}>
            <SelectValue placeholder={field.placeholder ?? "Choose…"} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : t === "chips" ? (
        <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby={id}>
          {(field.options ?? []).map((o) => {
            const on = str.split("|").includes(o);
            return (
              <button
                key={o}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  const set = new Set(str ? str.split("|") : []);
                  if (on) set.delete(o);
                  else set.add(o);
                  onChange(Array.from(set).join("|"));
                }}
                className={cn(
                  "rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors",
                  on ? "border-ink bg-sun text-ink" : "border-ink/30 bg-card text-ink hover:border-ink",
                )}
              >
                {o}
              </button>
            );
          })}
        </div>
      ) : t === "rows" ? (
        <RowsEditor columns={field.columns ?? []} rows={Array.isArray(value) ? value : field.defaultRows ?? []} onChange={onChange} />
      ) : (
        <Input
          id={id}
          type={t === "number" || t === "money" ? "number" : t === "date" ? "date" : "text"}
          inputMode={t === "number" || t === "money" ? "decimal" : undefined}
          value={str}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
    </div>
  );
}

/** A small editable table inside a form (line items, criteria, staff…). */
export function RowsEditor({ columns, rows, onChange }: { columns: RowColumn[]; rows: Rows; onChange: (r: Rows) => void }) {
  const blank = () => Object.fromEntries(columns.map((c) => [c.key, ""]));
  const set = (i: number, k: string, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border-2 border-ink">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="border-b-2 border-ink bg-sand text-left text-xs font-bold text-ink">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-2 py-2 font-bold">
                  {c.label}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-ink/15">
                {columns.map((c) => (
                  <td key={c.key} className="p-1">
                    {c.type === "select" ? (
                      <select
                        className="h-9 w-full rounded-lg border-2 border-ink/30 bg-card px-2 text-sm focus:border-ink focus:outline-none"
                        value={r[c.key] ?? ""}
                        onChange={(e) => set(i, c.key, e.target.value)}
                        aria-label={c.label}
                      >
                        <option value="">—</option>
                        {(c.options ?? []).map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        className="h-8"
                        type={c.type === "number" || c.type === "money" ? "number" : c.type === "date" ? "date" : "text"}
                        inputMode={c.type === "number" || c.type === "money" ? "decimal" : undefined}
                        value={r[c.key] ?? ""}
                        placeholder={c.placeholder}
                        onChange={(e) => set(i, c.key, e.target.value)}
                        aria-label={c.label}
                      />
                    )}
                  </td>
                ))}
                <td className="p-1 text-right">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onChange(rows.filter((_, j) => j !== i))}
                    aria-label="Remove row"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => onChange([...rows, blank()])}>
        <Plus className="h-3.5 w-3.5" /> Add row
      </Button>
    </div>
  );
}

/** Turns form values into the plain text the AI receives (tables become Markdown tables). */
export function serializeValues(fields: Field[], values: FormValues): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = values[f.key];
    if (Array.isArray(v)) {
      const cols = f.columns ?? [];
      const filled = v.filter((r) => cols.some((c) => (r[c.key] ?? "").trim()));
      if (!filled.length) continue;
      out[f.label] =
        `\n| ${cols.map((c) => c.label).join(" | ")} |\n| ${cols.map(() => "---").join(" | ")} |\n` +
        filled.map((r) => `| ${cols.map((c) => (r[c.key] ?? "").replace(/\|/g, "/")).join(" | ")} |`).join("\n");
    } else if (typeof v === "string" && v.trim()) {
      out[f.label] = f.type === "chips" ? v.split("|").join(", ") : v.trim();
    }
  }
  return out;
}

export const num = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export const inr = (n: number) => `₹${(Math.round(n * 100) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
