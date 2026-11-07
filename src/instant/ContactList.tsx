import { useMemo, useState } from "react";
import { Pencil, Search, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/** One contact in "Send all". name: how the message greets them (editable). saved: as in the phone book. */
export interface ContactRow { id: number; name: string; saved: string; phone: string; on: boolean; tag?: string }

/** 919876543210 → +91 98765 43210 (other numbers keep their digits). */
const prettyPhone = (p: string) => { const d = p.replace(/\D/g, ""); const m = /^(?:91)?([6-9]\d{4})(\d{5})$/.exec(d); return m ? `+91 ${m[1]} ${m[2]}` : d.length > 10 ? `+${d}` : d; };

/** A filter: everyone, ticked, skipped, no number, or one tag ("tag:Driver"). */
type View = "all" | "on" | "off" | "nophone" | `tag:${string}`;
const TAG_ICON: Record<string, string> = { Family: "👪", Driver: "🚗", Delivery: "📦", Help: "🧹", Service: "🔧", "Milk & veg": "🥛", Guard: "💂", Work: "💼", Shop: "🏪", Bank: "🏦", Telecom: "📶", Landlord: "🏠" };
const isWork = (r: ContactRow) => !!r.tag && r.tag !== "Family";
const PAGE = 60;

/**
 * The list people check before sending, built for phones: big tick boxes, names you edit in place
 * (16px so iPhone doesn't zoom), job labels already taken out of the greeting ("Rohit Driver" → "Rohit")
 * with a one-tap way to skip every work contact, search, and quick filters. Long lists show 60 at a time.
 */
export function ContactList({ rows, setRows, reachable }: { rows: ContactRow[]; setRows: (f: (r: ContactRow[]) => ContactRow[]) => void; reachable: (phone: string) => boolean }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("all");
  const [shown, setShown] = useState(PAGE);

  const counts = useMemo(() => ({
    all: rows.length,
    on: rows.filter((r) => r.on).length,
    off: rows.filter((r) => !r.on).length,
    workOn: rows.filter((r) => isWork(r) && r.on).length,
    nophone: rows.filter((r) => !reachable(r.phone)).length,
  }), [rows, reachable]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) =>
      (view === "all" || (view === "on" && r.on) || (view === "off" && !r.on) || (view === "nophone" && !reachable(r.phone)) || view === `tag:${r.tag}`) &&
      (!s || r.name.toLowerCase().includes(s) || r.saved.toLowerCase().includes(s) || r.phone.includes(s.replace(/\D/g, "") || "~")));
  }, [rows, q, view, reachable]);

  const patch = (id: number, p: Partial<ContactRow>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const setAll = (on: boolean) => { const ids = new Set(list.map((r) => r.id)); setRows((rs) => rs.map((r) => (ids.has(r.id) ? { ...r, on } : r))); };
  const skipWork = () => setRows((rs) => rs.map((r) => (isWork(r) ? { ...r, on: false } : r)));
  const tags = [...new Set(rows.filter(isWork).map((r) => r.tag!))].slice(0, 4).join(", ");
  // One chip per tag, biggest group first (Family first when present), with how many of them are ticked.
  const tagGroups = useMemo(() => {
    const m = new Map<string, { n: number; on: number }>();
    for (const r of rows) if (r.tag) { const g = m.get(r.tag) ?? { n: 0, on: 0 }; g.n++; if (r.on) g.on++; m.set(r.tag, g); }
    return [...m.entries()].sort((a, b) => Number(b[0] === "Family") - Number(a[0] === "Family") || b[1].n - a[1].n);
  }, [rows]);
  const activeTag = view.startsWith("tag:") ? view.slice(4) : null;

  const chip = (v: View, label: string, n: number) => n > 0 || v === "all" ? (
    <button type="button" onClick={() => { setView(v); setShown(PAGE); }} aria-pressed={view === v}
      className={cn("h-9 shrink-0 rounded-full border-2 px-3 text-sm font-semibold", view === v ? "border-ink bg-ink text-cream" : "border-ink/30 bg-card")}>
      {label} <span className="tabular-nums opacity-70">{n.toLocaleString("en-IN")}</span>
    </button>
  ) : null;

  return (
    <div className="grid gap-3">
      {counts.workOn > 0 && (
        <div className="grid gap-2 rounded-2xl border-2 border-ink bg-sun/40 p-3">
          <p className="text-sm"><b>{counts.workOn} {counts.workOn === 1 ? "contact is" : "contacts are"} saved with a job or shop label</b> ({tags}). We took the label out of their greeting.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={skipWork} className="h-10 rounded-xl border-2 border-ink bg-card px-4 text-sm font-bold shadow-[2px_2px_0_0_hsl(var(--ink))]">Skip all {counts.workOn}</button>
            <button type="button" onClick={() => { setView(`tag:${tagGroups.find(([t]) => t !== "Family")?.[0] ?? ""}`); setShown(PAGE); }} className="h-10 rounded-xl px-3 text-sm font-semibold underline">Look through them</button>
          </div>
        </div>
      )}

      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder={`Search ${counts.all.toLocaleString("en-IN")} contacts`}
          className="h-12 w-full rounded-xl border-2 border-ink/30 bg-card pl-9 pr-3 text-base focus:border-ink focus:outline-none" aria-label="Search contacts" />
      </label>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {chip("all", "All", counts.all)}
        {chip("on", "Sending", counts.on)}
        {chip("off", "Skipped", counts.off)}
        {chip("nophone", "No number", counts.nophone)}
      </div>

      {tagGroups.length > 0 && (
        // Groups, like Snapchat's chat filters: tap one to see only them, then tick or untick them all at once.
        <div className="grid gap-1.5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Groups</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {tagGroups.map(([t, g]) => (
              <button key={t} type="button" onClick={() => { setView(activeTag === t ? "all" : `tag:${t}`); setShown(PAGE); }} aria-pressed={activeTag === t}
                className={cn("flex h-10 shrink-0 items-center gap-1.5 rounded-full border-2 px-3 text-sm font-semibold", activeTag === t ? "border-ink bg-sun shadow-[2px_2px_0_0_hsl(var(--ink))]" : "border-ink/30 bg-card")}>
                <span aria-hidden="true">{TAG_ICON[t] ?? "🏷️"}</span>{t}
                <span className="tabular-nums text-xs opacity-70">{g.on === g.n ? g.n : `${g.on}/${g.n}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="min-w-0 truncate text-muted-foreground">{activeTag ? <b className="text-foreground">{TAG_ICON[activeTag] ?? ""} {activeTag} · {list.length}</b> : list.length === rows.length ? "Tap a name to change it" : `${list.length.toLocaleString("en-IN")} shown`}</span>
        <span className="flex shrink-0 gap-1">
          <button type="button" className="h-9 rounded-lg px-2 font-semibold underline" onClick={() => setAll(true)}>{activeTag ? `Send to all ${list.length}` : "Tick all"}</button>
          <button type="button" className="h-9 rounded-lg px-2 font-semibold underline" onClick={() => setAll(false)}>{activeTag ? "Skip all" : "Untick all"}</button>
        </span>
      </div>

      <ul className="overflow-hidden rounded-2xl border-2 border-ink bg-card">
        {list.slice(0, shown).map((r) => (
          <li key={r.id} className={cn("flex items-center gap-3 border-b border-ink/10 px-3 py-2 last:border-b-0", !r.on && "bg-muted/40")}>
            <Checkbox checked={r.on} onCheckedChange={(v) => patch(r.id, { on: v === true })} className="h-6 w-6 shrink-0 rounded-md border-2" aria-label={`Send to ${r.name || r.saved}`} />
            <div className={cn("min-w-0 flex-1", !r.on && "opacity-50")}>
              <div className="flex items-center gap-1.5">
                <input value={r.name} onChange={(e) => patch(r.id, { name: e.target.value.slice(0, 30) })} onBlur={(e) => { if (!e.target.value.trim()) patch(r.id, { name: r.saved.slice(0, 30) }); }}
                  enterKeyHint="done" onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                  className="min-w-0 flex-1 truncate border-b-2 border-transparent bg-transparent py-1 text-base font-semibold focus:border-ink focus:outline-none" aria-label={`Name in the message for ${r.saved}`} />
                <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {reachable(r.phone) ? prettyPhone(r.phone) : <span className="text-destructive">{r.phone ? "Number not valid" : "No number"}</span>}
                {r.saved.trim() !== r.name.trim() && <> · saved as “{r.saved}”</>}
              </p>
            </div>
            {r.tag && <span className="shrink-0 rounded-full border-2 border-ink/20 px-2 py-0.5 text-[11px] font-bold">{r.tag}</span>}
          </li>
        ))}
        {list.length === 0 && <li className="flex items-center justify-between gap-2 p-4 text-sm text-muted-foreground">Nobody here.{(q || view !== "all") && <button type="button" className="inline-flex items-center gap-1 font-semibold underline" onClick={() => { setQ(""); setView("all"); }}><X className="h-4 w-4" /> Show everyone</button>}</li>}
      </ul>
      {list.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + PAGE * 2)} className="h-11 rounded-xl border-2 border-ink/30 text-sm font-semibold">Show more ({(list.length - shown).toLocaleString("en-IN")} left)</button>
      )}
    </div>
  );
}
