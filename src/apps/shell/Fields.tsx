import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CONTROL, HINT, LABEL } from "../flagship/softInputs";
import type { Field, FormValues, RowColumn } from "../types";

type Rows = Record<string, string>[];

/** One form field, rendered the same way in every app. */
export function FieldInput({
  field,
  value,
  onChange,
  idPrefix,
  controlClassName,
  labelClassName,
  hintClassName,
  variant = "block",
}: {
  field: Field;
  value: string | Rows | undefined;
  onChange: (v: string | Rows) => void;
  idPrefix: string;
  /** Opt-in style override for the input/textarea/select control (default look is unchanged when omitted). */
  controlClassName?: string;
  labelClassName?: string;
  hintClassName?: string;
  /** "soft" is the refined neo-brutalist look (homepage-style fills, no thick borders) — opt-in, so
   * every engine that doesn't pass it keeps today's thick-bordered look unchanged. */
  variant?: "block" | "soft";
}) {
  const id = `${idPrefix}-${field.key.replace(/\W+/g, "-")}`;
  const t = field.type ?? "text";
  const str = typeof value === "string" ? value : "";
  const soft = variant === "soft";
  const ctrlCls = controlClassName ?? (soft ? CONTROL : undefined);
  const lblCls = labelClassName ?? (soft ? LABEL : undefined);
  const hntCls = hintClassName ?? (soft ? HINT : undefined);

  return (
    <div className={cn("space-y-1.5", field.half ? "sm:col-span-1" : "sm:col-span-2")}>
      <Label htmlFor={id} className={cn("text-sm font-semibold", lblCls)}>
        {field.label}
        {field.required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {t === "textarea" ? (
        <Textarea id={id} value={str} rows={field.rows ?? 4} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className={ctrlCls} />
      ) : t === "select" ? (
        <Select value={str || undefined} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id={id} className={ctrlCls}>
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
                  "rounded-full px-3 py-1 text-sm font-semibold transition-colors",
                  soft
                    ? cn(
                        "border",
                        on
                          ? "border-[1.5px] border-[#111111] bg-[#C8E967]/40 text-[#111111] dark:border-white/70 dark:bg-white/15 dark:text-white"
                          : "border-black/15 bg-white text-[#111111] hover:border-[#111111] dark:border-white/20 dark:bg-[#1F1F24] dark:text-white",
                      )
                    : cn("border-2", on ? "border-ink bg-sun text-ink" : "border-ink/30 bg-card text-ink hover:border-ink"),
                )}
              >
                {o}
              </button>
            );
          })}
        </div>
      ) : t === "rows" ? (
        <RowsEditor columns={field.columns ?? []} rows={Array.isArray(value) ? value : field.defaultRows ?? []} onChange={onChange} variant={variant} />
      ) : (
        <Input
          id={id}
          type={t === "number" || t === "money" ? "number" : t === "date" ? "date" : "text"}
          inputMode={t === "number" || t === "money" ? "decimal" : undefined}
          value={str}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={ctrlCls}
        />
      )}
      {field.help && <p className={cn("text-xs text-muted-foreground", hntCls)}>{field.help}</p>}
    </div>
  );
}

/** A small editable table inside a form (line items, criteria, staff…). */
export function RowsEditor({
  columns,
  rows,
  onChange,
  variant = "block",
}: {
  columns: RowColumn[];
  rows: Rows;
  onChange: (r: Rows) => void;
  /** "soft" fixes the fixed-width table's horizontal clipping with a type-sized CSS grid instead
   * (opt-in — every caller that doesn't pass it keeps today's bordered, min-width table). */
  variant?: "block" | "soft";
}) {
  const blank = () => Object.fromEntries(columns.map((c) => [c.key, ""]));
  const set = (i: number, k: string, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  if (variant === "soft") {
    const widthOf = (c: RowColumn) => (c.type === "select" ? "116px" : c.type === "date" ? "124px" : c.type === "number" ? "64px" : c.type === "money" ? "92px" : "minmax(110px,1fr)");
    const template = `${columns.map(widthOf).join(" ")} 32px`;
    const cell = "h-9 w-full rounded-lg border border-black/10 bg-[#F3F4F6] px-2 text-sm text-[#111111] outline-none focus:border-[#111111] focus:bg-white focus:ring-2 focus:ring-[#F472D0]/30 dark:border-white/15 dark:bg-[#1F1F24] dark:text-white dark:focus:border-white";
    return (
      <div className="space-y-2">
        <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
          <div className="hidden gap-2 bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#111111] dark:bg-white/5 dark:text-white sm:grid" style={{ gridTemplateColumns: template }}>
            {columns.map((c) => (
              <span key={c.key} className="truncate">
                {c.label}
              </span>
            ))}
            <span aria-hidden />
          </div>
          <div className="divide-y divide-black/[0.06] dark:divide-white/10">
            {rows.map((r, i) => (
              <div key={i} className="grid gap-2 p-2.5 sm:px-3 sm:py-2" style={{ gridTemplateColumns: template }}>
                {columns.map((c) => (
                  <div key={c.key} className="min-w-0">
                    <span className="mb-1 block text-[10px] font-semibold text-black/40 dark:text-white/40 sm:hidden">{c.label}</span>
                    {c.type === "select" ? (
                      <select className={cell} value={r[c.key] ?? ""} onChange={(e) => set(i, c.key, e.target.value)} aria-label={c.label}>
                        <option value="">—</option>
                        {(c.options ?? []).map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={cell}
                        type={c.type === "number" || c.type === "money" ? "number" : c.type === "date" ? "date" : "text"}
                        inputMode={c.type === "number" || c.type === "money" ? "decimal" : undefined}
                        value={r[c.key] ?? ""}
                        placeholder={c.placeholder}
                        onChange={(e) => set(i, c.key, e.target.value)}
                        aria-label={c.label}
                      />
                    )}
                  </div>
                ))}
                <div className="flex items-end justify-center sm:items-center">
                  <button
                    type="button"
                    onClick={() => onChange(rows.filter((_, j) => j !== i))}
                    aria-label="Remove row"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-black/40 transition hover:bg-black/5 hover:text-black/70 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/80"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange([...rows, blank()])}
          className="inline-flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-1.5 text-xs font-semibold text-[#111111] transition hover:border-[#111111] dark:border-white/20 dark:text-white dark:hover:border-white"
        >
          <Plus className="h-3.5 w-3.5" /> Add row
        </button>
      </div>
    );
  }

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
