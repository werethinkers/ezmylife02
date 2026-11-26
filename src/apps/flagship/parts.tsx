import { useEffect, useRef, useState } from "react";
import { Check, Download, ImagePlus, Loader2, Mic, MicOff, Send, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/common/Markdown";
import { cn } from "@/lib/utils";
import { FieldInput, serializeValues } from "../shell/Fields";
import { OutputPanel } from "../shell/OutputPanel";
import { NeedsCredits, errorText } from "../lib/api";
import { downloadBlob, dataUrlToBlob } from "../lib/files";
import type { Field, FormValues } from "../types";
import type { FlagshipDef } from "./types";
import { runFlagship } from "./api";
import { BrandBoard } from "../output/brandBoard";
import { BrandMockups } from "../output/brandMockups";
import { LogoConcepts, type LogoState } from "../output/logoConcepts";
import { SectionRegen } from "../output/sectionRegen";
import { markdownToBlocks } from "../output/markdown";
import { extractPalette, roledSwatches } from "../output/palette";
import { extractFonts, extractTagline } from "../output/typography";
import type { BrandContext } from "../lib/handoff";

/** The brand's colours, fonts, tagline and (once picked) logo, for "Use in…" — see ../lib/handoff. */
function brandContextFrom(text: string, logos?: LogoState): BrandContext {
  const { title, blocks } = markdownToBlocks(text);
  const { palette } = extractPalette(blocks);
  const fonts = extractFonts(text);
  const selected = logos?.slots[logos.selected];
  return {
    name: title || "Your brand",
    tagline: extractTagline(text),
    colors: roledSwatches(palette).map(({ swatch }) => `${swatch.hex.toUpperCase()} (${swatch.name})`),
    fonts: fonts.heading || fonts.body ? fonts : undefined,
    logoUrl: selected?.status === "ready" ? selected.url : undefined,
  };
}

export const card = "rounded-2xl border-2 border-ink bg-card p-4 shadow-block sm:p-5";

export function emptyValues(fields: Field[]): FormValues {
  const v: FormValues = {};
  for (const f of fields) v[f.key] = f.type === "rows" ? (f.defaultRows ?? []).map((r) => ({ ...r })) : f.default ?? "";
  return v;
}

export const missingFields = (fields: Field[], v: FormValues) =>
  fields.filter((f) => f.required && !(typeof v[f.key] === "string" ? (v[f.key] as string).trim() : (v[f.key] as unknown[])?.length));

export const inputsOf = (fields: Field[], v: FormValues) => serializeValues(fields, v);

/** A grid of form fields, with "Fill in an example". */
export function FieldGrid({
  toolId,
  fields,
  values,
  onChange,
  sample,
  disabled,
}: {
  toolId: string;
  fields: Field[];
  values: FormValues;
  onChange: (v: FormValues) => void;
  sample?: FormValues;
  disabled?: boolean;
}) {
  if (!fields.length) return null;
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <FieldInput key={f.key} field={f} idPrefix={toolId} value={values[f.key]} onChange={(x) => onChange({ ...values, [f.key]: x })} />
        ))}
      </div>
      {sample && (
        <Button type="button" variant="ghost" size="sm" className="mt-3 gap-1.5" disabled={disabled} onClick={() => onChange({ ...values, ...sample })}>
          <Wand2 className="h-3.5 w-3.5" /> Fill in an example
        </Button>
      )}
    </div>
  );
}

/** What the finished result contains. While it is being made, the items tick off one by one. */
export function YouGet({ items, working, title = "What you get" }: { items: string[]; working?: boolean; title?: string }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (!working) {
      setDone(0);
      return;
    }
    const t = setInterval(() => setDone((d) => Math.min(d + 1, items.length - 1)), 2600);
    return () => clearInterval(t);
  }, [working, items.length]);
  return (
    <div className={cn(card, working && "bg-sand")} aria-live="polite">
      <p className="flex items-center gap-2 text-[15px] font-bold">
        {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {working ? "Writing your result — usually 20 to 60 seconds" : title}
      </p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {items.map((s, i) => (
          <li key={s} className={cn("flex items-start gap-2", working && i > done && "text-muted-foreground")}>
            {working && i === done ? (
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Check className={cn("mt-0.5 h-4 w-4 shrink-0", working && i > done ? "opacity-30" : "text-teal")} />
            )}
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Speech-to-text in the browser (no AI cost). Hidden where the browser cannot do it. */
export function VoiceButton({ onText, lang = "en-IN" }: { onText: (t: string) => void; lang?: string }) {
  const [on, setOn] = useState(false);
  const rec = useRef<{ stop: () => void } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = typeof window !== "undefined" ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
  useEffect(() => () => rec.current?.stop(), []);
  if (!SR) return null;
  const toggle = () => {
    if (on) {
      rec.current?.stop();
      return;
    }
    const r = new SR();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript;
      if (t.trim()) onText(t.trim());
    };
    r.onend = () => setOn(false);
    r.onerror = () => setOn(false);
    rec.current = r;
    r.start();
    setOn(true);
  };
  return (
    <Button type="button" size="icon" variant={on ? "default" : "outline"} className={cn("h-10 w-10 shrink-0", on && "animate-pulse")} onClick={toggle} aria-label={on ? "Stop speaking" : "Speak your answer"} aria-pressed={on}>
      {on ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}

interface Msg {
  role: "user" | "assistant";
  content: string;
}

/** Questions about the finished result, 2 credits each. */
function FollowUp({ toolId, result }: { toolId: string; result: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setMsgs([]), [result]);
  const ask = async () => {
    const text = q.trim();
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setQ("");
    setBusy(true);
    try {
      const { output } = await runFlagship<string>(toolId, "ask", { result, messages: next.slice(-8) });
      setMsgs([...next, { role: "assistant", content: output }]);
    } catch (e) {
      setMsgs(msgs);
      setQ(text);
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={card}>
      <p className="text-[15px] font-bold">Ask about your result</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Ask what anything means, or ask for one part to be rewritten — cheaper than a full revision, at 2 credits a question.</p>
      {msgs.length > 0 && (
        <div className="mt-3 space-y-2">
          {msgs.map((m, i) => (
            <div key={i} className={cn("rounded-xl px-3 py-2 text-sm", m.role === "user" ? "ml-8 bg-primary text-primary-foreground" : "mr-4 bg-muted/60")}>
              {m.role === "user" ? m.content : <Markdown className="text-sm prose-p:my-1">{m.content}</Markdown>}
            </div>
          ))}
        </div>
      )}
      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <Textarea rows={1} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Explain the second table in simple words" className="min-h-10 resize-none" aria-label="Your question" />
        <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={busy || !q.trim()} aria-label="Ask">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

/** AI pictures made from the result, 30 credits each. */
function Pictures({ toolId, label, ideas }: { toolId: string; label: string; ideas: string[] }) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [pics, setPics] = useState<string[]>([]);
  const make = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    try {
      const { output } = await runFlagship<string>(toolId, "image", { prompt });
      setPics((p) => [output, ...p]);
    } catch (e) {
      if (!(e instanceof NeedsCredits)) toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={card}>
      <p className="flex items-center gap-2 text-[15px] font-bold">
        <ImagePlus className="h-4 w-4" /> {label}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">Optional. 30 credits a picture, charged only when it is made.</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ideas.map((i) => (
          <button key={i} type="button" onClick={() => setPrompt(i)} className="rounded-full border-2 border-ink/30 px-3 py-1 text-xs font-semibold hover:border-ink hover:bg-sun">
            {i}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <Textarea rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the picture" aria-label="Describe the picture" />
        <Button onClick={make} disabled={busy || !prompt.trim()} className="shrink-0 gap-1.5">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Make
        </Button>
      </div>
      {pics.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {pics.map((src, i) => (
            <div key={i} className="group relative overflow-hidden rounded-xl border-2 border-ink">
              <img src={src} alt={`Picture ${pics.length - i}`} className="aspect-square w-full object-cover" />
              <Button size="sm" variant="secondary" className="absolute bottom-2 right-2 h-7 gap-1" onClick={async () => downloadBlob(await dataUrlToBlob(src), `${toolId}-picture-${pics.length - i}.png`)}>
                <Download className="h-3.5 w-3.5" /> Save
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** The finished result with every action: save, share, revise, ask about it, add pictures. */
export function ResultView({
  toolId,
  def,
  text,
  title,
  fileName,
  onRefine,
  refining,
  onEdit,
  refineChips,
  resultId,
  logoState,
  onLogoStateChange,
  category,
  onSectionPatched,
}: {
  toolId: string;
  def: FlagshipDef;
  text: string;
  title: string;
  fileName: string;
  onRefine?: (instruction: string) => void;
  refining?: boolean;
  onEdit?: (t: string) => void;
  /** Overrides def.refineChips (e.g. to drop a chip that doesn't apply to what was submitted). */
  refineChips?: string[];
  /** This result's own id (e.g. r.activeId) — scopes the 3 auto-generated logo concepts to this
   *  one result, so a different result (or a brand-new version) gets its own fresh set. Brand
   *  Identity Kit only; every other flagship app can leave these out. */
  resultId?: string | null;
  logoState?: LogoState;
  onLogoStateChange?: (id: string, state: LogoState) => void;
  /** The form's own category/role value, shown on the visiting-card mock-up. */
  category?: string;
  /** Saves a result whose text was just patched by a 2-credit section regeneration (see
   *  SectionRegen) back into the caller's saved copy — not just updated on screen like onEdit.
   *  Works on any flagship result; leave it out to simply not offer the control. */
  onSectionPatched?: (next: string) => void;
}) {
  const isBrandKit = toolId === "brand-identity-studio";
  const brand = isBrandKit ? brandContextFrom(text, logoState) : undefined;
  const selectedLogo = logoState?.slots[logoState.selected];
  const selectedLogoUrl = selectedLogo?.status === "ready" ? selectedLogo.url : undefined;

  return (
    <div className="space-y-4">
      {def.note && <p className="rounded-xl border-2 border-ink/20 bg-sand px-3 py-2 text-xs text-muted-foreground">{def.note}</p>}
      <BrandBoard text={text} fallbackName={title} />
      {isBrandKit && resultId && onLogoStateChange && (
        <>
          <LogoConcepts toolId={toolId} resultId={resultId} text={text} state={logoState} onStateChange={onLogoStateChange} />
          <BrandMockups text={text} category={category} fallbackName={title} logoUrl={selectedLogoUrl} />
        </>
      )}
      {onSectionPatched && <SectionRegen toolId={toolId} text={text} onPatched={onSectionPatched} />}
      <OutputPanel
        toolId={toolId}
        text={text}
        title={title}
        fileName={fileName}
        onRefine={onRefine}
        refining={refining}
        refineChips={refineChips ?? def.refineChips ?? ["Make it shorter", "Add more detail", "Translate to Hindi", "Make it more formal"]}
        sendTo={def.related}
        editable={!!onEdit}
        onEdit={onEdit}
        brand={brand}
        logoUrls={logoState?.slots.filter((s) => s.status === "ready" && s.url).map((s) => s.url as string)}
      />
      <FollowUp toolId={toolId} result={text} />
      {def.pictures && <Pictures toolId={toolId} label={def.pictures.label} ideas={def.pictures.ideas} />}
    </div>
  );
}
