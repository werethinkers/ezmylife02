import { useId, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, Crop, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { Field, Loose, SuggestionSet } from "../types";
import { shrinkImage } from "../media";
import { PhotoAdjust } from "./PhotoAdjust";
import { GooglePhotosButton } from "@/components/GooglePhotosPicker";
import { resolveImg } from "../parts";
import { isStock } from "../stock";
import { DAYS, canAdjust } from "../util";
import { cn } from "@/lib/utils";

type Props = { field: Field; value: Loose; onChange: (v: Loose) => void; error?: string; compact?: boolean };

export function FieldInput({ field: f, value, onChange, error, compact }: Props) {
  const uid = useId();
  // What the box held before a suggestion replaced it, so a tap on the wrong line is never a loss.
  const [undo, setUndo] = useState<string | null>(null);
  const id = "f-" + f.id + "-" + uid.replace(/:/g, "");
  const label = (
    <label htmlFor={id} className="text-sm font-semibold flex items-baseline justify-between gap-2">
      <span>{f.label}{f.required && <span className="text-destructive"> *</span>}</span>
      {f.max && ["text", "textarea"].includes(f.type) && <span className="text-xs font-normal text-muted-foreground tabular-nums">{String(value ?? "").length}/{f.max}</span>}
    </label>
  );
  const help = f.help && <p className="text-xs text-muted-foreground">{f.help}</p>;
  const err = error && <p className="text-xs text-destructive" role="alert">{error}</p>;
  const wrap = (el: React.ReactNode) => <div className="grid gap-1.5">{label}{el}{help}{err}</div>;

  switch (f.type) {
    case "textarea": {
      const pick = (s: string) => {
        const cur = String(value ?? "");
        setUndo(cur.trim() && cur.trim() !== s ? cur : null);
        onChange(s.slice(0, f.max ?? s.length));
      };
      return wrap(<>
        <Textarea id={id} value={value ?? ""} maxLength={f.max} rows={compact ? 2 : 5} placeholder={f.placeholder} onChange={(e) => { setUndo(null); onChange(e.target.value); }} className="text-base" />
        {undo !== null && (
          <p className="text-xs text-muted-foreground" role="status">
            That line replaced what you wrote. <button type="button" className="font-bold text-foreground underline" onClick={() => { onChange(undo); setUndo(null); }}>Undo</button>
          </p>
        )}
        {((f.suggestionSets && f.suggestionSets.length > 0) || (f.suggestions && f.suggestions.length > 0)) && (
          <SuggestionPicker sets={f.suggestionSets} lines={f.suggestions} onPick={pick} />
        )}
      </>);
    }
    case "toggle":
      return (
        <div className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3">
          <label htmlFor={id} className="text-sm font-semibold">{f.label}</label>
          <Switch id={id} checked={value !== false} onCheckedChange={onChange} />
        </div>
      );
    case "select":
      return wrap(
        <select id={id} value={value ?? f.options?.[0] ?? ""} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-md border bg-background px-3 text-base">
          {f.options?.map((o) => <option key={o}>{o}</option>)}
        </select>,
      );
    case "chips":
      return wrap(<Chips id={id} options={f.options ?? []} max={f.max ?? 20} value={value} onChange={onChange} />);
    case "days": {
      const sel: string[] = Array.isArray(value) ? value : DAYS;
      return wrap(
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map((d) => <button key={d} type="button" aria-pressed={sel.includes(d)} onClick={() => onChange(sel.includes(d) ? sel.filter((x) => x !== d) : DAYS.filter((x) => sel.includes(x) || x === d))}
            className={cn("h-10 rounded-lg border text-sm font-medium", sel.includes(d) ? "bg-primary text-primary-foreground border-primary" : "bg-background")}>{d}</button>)}
        </div>,
      );
    }
    case "photo":
      return wrap(<PhotoPick id={id} value={value} onChange={onChange} />);
    case "gallery": {
      const list: { photo: string; caption?: string }[] = Array.isArray(value) ? value : [];
      return wrap(<Gallery id={id} list={list} max={f.max ?? 8} onChange={onChange} />);
    }
    case "list":
      return wrap(<ListField f={f} value={value} onChange={onChange} />);
    default: {
      const type = f.type === "phone" ? "tel" : f.type === "number" ? "number" : f.type;
      return wrap(<>
        <Input id={id} type={type} value={value ?? ""} maxLength={f.max && f.type !== "number" ? f.max : undefined} placeholder={f.placeholder}
          inputMode={f.type === "phone" ? "numeric" : undefined} className="h-11 text-base"
          onChange={(e) => onChange(f.type === "phone" ? e.target.value.replace(/[^\d +]/g, "").slice(0, 14) : e.target.value)} />
        {/* A text box can offer quick picks (the greeting line): tap one to fill the box, or just type. */}
        {f.type === "text" && f.options && f.options.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label={`${f.label}, quick picks`}>
            {f.options.map((o) => (
              <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)}
                className={cn("rounded-full border px-3 py-1.5 text-sm", value === o ? "border-primary bg-primary text-primary-foreground" : "bg-background")}>{o}</button>
            ))}
          </div>
        )}
      </>);
    }
  }
}

function PhotoPick({ id, value, onChange }: { id: string; value: Loose; onChange: (v: Loose) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const src = resolveImg(value);
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => ref.current?.click()} className="relative h-20 w-20 rounded-xl border-2 border-dashed grid place-items-center overflow-hidden bg-muted/30 shrink-0" aria-label="Choose photo">
        {src ? <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
      </button>
      <div className="grid gap-1">
        <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()}>{src ? "Change photo" : "Add photo"}</Button>
        <GooglePhotosButton max={1} onFiles={async (fs) => { try { setErr(""); onChange(await shrinkImage(fs[0])); } catch (x) { setErr(x instanceof Error ? x.message : "Couldn't use that photo."); } }} />
        {src && canAdjust(value) && <Button type="button" variant="outline" size="sm" onClick={() => setAdjusting(true)}><Crop className="h-4 w-4" /> Adjust</Button>}
        {src && <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>Remove</Button>}
        {err && <p className="text-xs text-destructive">{err}</p>}
      </div>
      <PhotoAdjust open={adjusting} src={src} onClose={() => setAdjusting(false)} onApply={(u) => { onChange(u); setAdjusting(false); }} />
      <input ref={ref} id={id} type="file" accept="image/*,.heic,.heif" className="sr-only" onChange={async (e) => { const fl = e.target.files?.[0]; e.target.value = ""; if (!fl) return; try { setErr(""); onChange(await shrinkImage(fl)); } catch (x) { setErr(x instanceof Error ? x.message : "Couldn't use that photo."); } }} />
    </div>
  );
}

function Gallery({ id, list, max, onChange }: { id: string; list: { photo: string; caption?: string }[]; max: number; onChange: (v: Loose) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [adjustAt, setAdjustAt] = useState<number | null>(null);
  const move = (i: number, d: number) => { const n = [...list]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); onChange(n); };
  const addFiles = async (all: File[]) => {
    const files = all.slice(0, max - list.length);
    setBusy(true); setErr("");
    try {
      const errs: string[] = [];
      const shots = await Promise.all(files.map((x) => shrinkImage(x).catch((er) => { errs.push(er instanceof Error ? er.message : "Couldn't use a photo."); return null; })));
      onChange([...list, ...shots.filter(Boolean).map((photo) => ({ photo: photo as string, caption: "" }))]);
      const skipped = all.length - files.length;
      setErr([errs.length ? `${errs.length} photo${errs.length > 1 ? "s" : ""} couldn't be added. ${errs[0]}` : "", skipped > 0 ? `Only ${max} photos fit, so ${skipped} ${skipped > 1 ? "were" : "was"} left out.` : ""].filter(Boolean).join(" "));
    } finally { setBusy(false); }
  };
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {list.map((it, i) => (
          <div key={i} className="rounded-xl border overflow-hidden bg-muted/20">
            <div className="relative aspect-square">
              {resolveImg(it.photo, "m" + i) && <img src={resolveImg(it.photo, "m" + i)!} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              {isStock(it.photo) && <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">Sample</span>}
              <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="absolute top-1.5 right-1.5 h-8 w-8 rounded-full bg-black/60 text-white grid place-items-center" aria-label={`Remove photo ${i + 1}`}><X className="h-4 w-4" /></button>
              {canAdjust(it.photo) && <button type="button" onClick={() => setAdjustAt(i)} className="absolute bottom-1.5 left-1.5 flex h-8 items-center gap-1 rounded-full bg-black/60 px-2.5 text-xs font-bold text-white" aria-label={`Adjust photo ${i + 1}`}><Crop className="h-4 w-4" /> Adjust</button>}
              <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="h-8 w-8 rounded-full bg-black/60 text-white grid place-items-center disabled:opacity-30" aria-label={`Move photo ${i + 1} earlier`}><ChevronLeft className="h-4 w-4" /></button>
                <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} className="h-8 w-8 rounded-full bg-black/60 text-white grid place-items-center disabled:opacity-30" aria-label={`Move photo ${i + 1} later`}><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
            <input value={it.caption ?? ""} maxLength={40} placeholder="Caption (optional)" onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} className="w-full px-2 py-2 text-sm bg-background border-t outline-none" aria-label={`Caption for photo ${i + 1}`} />
          </div>
        ))}
      </div>
      <PhotoAdjust open={adjustAt !== null} src={adjustAt !== null ? resolveImg(list[adjustAt]?.photo) : null} onClose={() => setAdjustAt(null)}
        onApply={(u) => { if (adjustAt !== null) onChange(list.map((x, j) => (j === adjustAt ? { ...x, photo: u } : x))); setAdjustAt(null); }} />
      {list.some((x) => isStock(x.photo)) && <p className="text-xs text-muted-foreground">Photos marked Sample are free stock photos to show the look. Replace them with your own for the best result.</p>}
      {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
      {list.length < max && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" className="h-11 rounded-xl" disabled={busy} onClick={() => ref.current?.click()}><ImagePlus className="h-4 w-4 mr-2" /> {busy ? "Adding…" : `Add photos (${list.length}/${max})`}</Button>
          <GooglePhotosButton max={max - list.length} disabled={busy} size="default" className="h-11 rounded-xl" onFiles={addFiles} />
        </div>
      )}
      <input ref={ref} id={id} type="file" accept="image/*,.heic,.heif" multiple className="sr-only" onChange={async (e) => {
        const all = Array.from(e.target.files ?? []); e.target.value = "";
        await addFiles(all);
      }} />
    </div>
  );
}

function Chips({ id, options, max, value, onChange }: { id: string; options: string[]; max: number; value: Loose; onChange: (v: Loose) => void }) {
  const sel: string[] = Array.isArray(value) ? value : [];
  const [custom, setCustom] = useState("");
  const all = Array.from(new Set([...options, ...sel]));
  const addCustom = () => { const t = custom.trim(); if (t && !sel.includes(t)) onChange([...sel, t].slice(0, max)); setCustom(""); };
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {all.map((o) => (
          <button key={o} type="button" aria-pressed={sel.includes(o)} onClick={() => onChange(sel.includes(o) ? sel.filter((x) => x !== o) : [...sel, o].slice(0, max))}
            className={cn("px-3 py-2 rounded-full border text-sm", sel.includes(o) ? "bg-primary text-primary-foreground border-primary" : "bg-background")}>{o}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input id={id} value={custom} placeholder="Add your own" maxLength={40} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} />
        <Button type="button" variant="outline" onClick={addCustom}>Add</Button>
      </div>
    </>
  );
}

/**
 * Ready-made lines for a message box. With grouped sets it asks who the card is for and in which language
 * (English, Hinglish or Hindi), then lists full lines to tap; with a plain list it just lists them.
 */
function SuggestionPicker({ sets, lines, onPick }: { sets?: SuggestionSet[]; lines?: string[]; onPick: (s: string) => void }) {
  const whos = useMemo(() => Array.from(new Set((sets ?? []).map((s) => s.who))), [sets]);
  const langs = useMemo(() => Array.from(new Set((sets ?? []).map((s) => s.lang))), [sets]);
  const [who, setWho] = useState(whos[0] ?? "");
  const [lang, setLang] = useState(langs[0] ?? "");
  const grouped = whos.length > 0;
  const items = grouped ? (sets ?? []).filter((s) => s.who === who && s.lang === lang).flatMap((s) => s.items) : lines ?? [];
  const chip = (on: boolean, label: string, set: () => void) => (
    <button key={label} type="button" aria-pressed={on} onClick={set} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", on ? "border-ink bg-ink text-cream" : "bg-background")}>{label}</button>
  );
  return (
    <div className="grid gap-2.5 rounded-2xl border bg-muted/30 p-3">
      <p className="text-xs font-bold">{grouped ? "Need words? Pick who it's for and a language." : "Need words? Tap a line to start."}</p>
      {grouped && (
        <>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Who it's for">{whos.map((w) => chip(w === who, w, () => setWho(w)))}</div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Language">{langs.map((l) => chip(l === lang, l, () => setLang(l)))}</div>
        </>
      )}
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No ready-made lines for this mix yet. Try another language.</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((s, i) => (
            <li key={i}>
              <button type="button" onClick={() => onPick(s)} className="w-full rounded-xl border bg-background p-3 text-left text-sm leading-snug hover:border-foreground">
                <span className="block whitespace-pre-line">{s}</span>
                <span className="mt-1.5 block text-xs font-bold text-primary">Use this line</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A repeating list (services, plans, reviews, dishes, team). Each item folds into one line showing what it holds:
 *  all closed at first, one open at a time, and a new item opens by itself, so a long list stays short. */
function ListField({ f, value, onChange }: { f: Field; value: Loose; onChange: (v: Loose) => void }) {
  const list: Record<string, Loose>[] = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState(-1);
  const set = (i: number, k: string, v: Loose) => onChange(list.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const move = (i: number, d: number) => { const n = [...list]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); onChange(n); if (open === i) setOpen(i + d); };
  const remove = (i: number) => { onChange(list.filter((_, j) => j !== i)); setOpen(-1); };
  const summary = (it: Record<string, Loose>) => {
    const words = (f.item ?? []).filter((sub) => ["text", "textarea", "number", "select", "date", "time"].includes(sub.type)).map((sub) => String(it[sub.id] ?? "").trim()).filter(Boolean);
    return words.slice(0, 2).join(" · ");
  };
  return (
    <div className="grid gap-2">
      {list.length > 0 && <p className="text-xs text-muted-foreground">{list.length} {list.length === 1 ? f.itemLabel?.toLowerCase() : "items"} · tap one to edit it</p>}
      {list.map((it, i) => {
        const isOpen = open === i;
        const sum = summary(it);
        return (
          <div key={i} className={cn("rounded-2xl border bg-muted/20", isOpen && "border-foreground/40 bg-background shadow-sm")}>
            <div className="flex items-center gap-1 pr-1">
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border bg-background text-xs font-bold tabular-nums">{i + 1}</span>
                <span className="grid min-w-0 flex-1">
                  <span className="truncate text-sm font-semibold">{sum || `${f.itemLabel} ${i + 1}`}</span>
                  {!sum && <span className="truncate text-xs text-muted-foreground">Empty · tap to fill</span>}
                </span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
              </button>
              {isOpen && (
                <>
                  <Button type="button" size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
                </>
              )}
              <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)} aria-label={`Remove ${f.itemLabel} ${i + 1}`}><Trash2 className="h-4 w-4" /></Button>
            </div>
            {isOpen && (
              <div className="grid gap-3 border-t px-3 pb-3 pt-3">
                {f.item?.map((sub) => <FieldInput key={sub.id} compact field={sub} value={it[sub.id]} onChange={(v) => set(i, sub.id, v)} />)}
                <Button type="button" variant="outline" size="sm" className="justify-self-end" onClick={() => setOpen(-1)}>Done</Button>
              </div>
            )}
          </div>
        );
      })}
      {list.length < (f.max ?? 12) && (
        <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => { onChange([...list, {}]); setOpen(list.length); }}><Plus className="h-4 w-4 mr-2" /> Add {f.itemLabel}</Button>
      )}
    </div>
  );
}
