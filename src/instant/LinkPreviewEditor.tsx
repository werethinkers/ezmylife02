import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Palette, Image as ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Content, Product, Theme } from "./types";
import { describe } from "./meta";
import { drawPhotoPreview, drawShareCard } from "./shareImage";
import { shrinkImage } from "./media";
import { DESC_MAX, TITLE_MAX, pagePhotos, suggestedMessage, type SharePrefs } from "./sharePrefs";

const CHOICES: { id: SharePrefs["image"]; label: string; hint: string; Icon: typeof Palette }[] = [
  { id: "card", label: "Designed card", hint: "Made from your page", Icon: Palette },
  { id: "photo", label: "A photo from my page", hint: "Pick one below", Icon: ImageIcon },
  { id: "upload", label: "My own picture", hint: "Upload from your phone", Icon: Upload },
];

/** The parts of the choices that matter when checking for unsaved changes. */
const same = (p: SharePrefs) => JSON.stringify([p.image, p.image === "photo" ? p.photo : "", p.image === "upload" ? p.upload : "", p.title?.trim() ?? "", p.description?.trim() ?? "", p.message]);

/**
 * Lets the owner choose what people see when the link is shared: the picture, the title and the
 * line under it, and the words that go with the link. A live preview shows it the way WhatsApp will.
 * onSave stores the choices and rebuilds the link preview.
 */
export function LinkPreviewEditor({ product, theme, content, url, link, prefs, onSave }: {
  product: Product; theme: Theme; content: Content; url: string; link?: string | null; prefs: SharePrefs;
  onSave: (draft: SharePrefs) => Promise<{ prefs?: SharePrefs } | unknown>;
}) {
  const own = useMemo(() => describe(product, content), [product, content]);
  const photos = useMemo(() => pagePhotos(content), [content]);
  const [draft, setDraft] = useState<SharePrefs>(() => ({ ...prefs, photo: prefs.photo ?? photos[0] }));
  const [shot, setShot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<SharePrefs>) => { setDraft((d) => ({ ...d, ...patch })); setSaved(false); setError(""); };

  // The picture shown in the preview, drawn the same way the link preview will be.
  useEffect(() => {
    let live = true;
    setBusy(true);
    const make = async (): Promise<string | null> => {
      if (draft.image === "upload") return draft.upload ?? null;
      if (draft.image === "photo") return draft.photo ? (await drawPhotoPreview(draft.photo)).toDataURL("image/jpeg", 0.7) : null;
      return (await drawShareCard(product, theme, content, url, "Link preview")).toDataURL("image/jpeg", 0.7);
    };
    make().then((s) => live && setShot(s), () => { if (live) { setShot(null); setError("That picture couldn't be loaded here. Try another one."); } }).finally(() => live && setBusy(false));
    return () => { live = false; };
  }, [draft.image, draft.photo, draft.upload, product, theme, content, url]);

  const pickFile = async (file?: File) => {
    if (!file) return;
    setError("");
    try {
      const small = await shrinkImage(file, 1600);
      const cv = await drawPhotoPreview(small);
      set({ image: "upload", upload: cv.toDataURL("image/jpeg", 0.86) });
    } catch (e) { setError(e instanceof Error ? e.message : "That picture couldn't be used."); }
  };

  const dirty = same(draft) !== same(prefs);
  const title = draft.title?.trim() || own.title;
  const desc = draft.description?.trim() || own.desc;
  const domain = (link || url).replace(/^https?:\/\//, "").split("/")[0];

  const save = async () => {
    setSaving(true); setError("");
    try {
      const r = (await onSave(draft)) as { prefs?: SharePrefs } | undefined;
      if (r?.prefs) setDraft((d) => ({ ...r.prefs!, photo: r.prefs!.photo ?? d.photo }));
      setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't update the preview. Try again."); }
    finally { setSaving(false); }
  };

  return (
    <section className="grid gap-5" aria-labelledby="lp-h">
      <div className="grid gap-1">
        <h2 id="lp-h" className="font-display text-xl font-extrabold">Choose what people see</h2>
        <p className="text-sm text-muted-foreground">This is the picture and words that show up when you send your link on WhatsApp, Instagram or Facebook.</p>
      </div>

      <figure className="grid gap-2" aria-label="Preview of your link">
        <figcaption className="text-xs font-bold uppercase tracking-wide text-muted-foreground">How it looks when you send it</figcaption>
        <div className="max-w-sm overflow-hidden rounded-2xl border-2 border-ink bg-white text-ink shadow-block-sm">
          <div className="relative aspect-[1200/630] w-full bg-cream">
            {shot ? <img src={shot} alt="Link preview picture" className={cn("h-full w-full object-cover", busy && "opacity-60")} /> : <div className="grid h-full place-items-center text-sm text-muted-foreground">{busy ? "Drawing…" : "No picture yet"}</div>}
          </div>
          <div className="grid gap-0.5 border-t-2 border-ink px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wide text-ink/60">{domain}</p>
            <p className="line-clamp-2 text-sm font-bold leading-snug">{title}</p>
            <p className="line-clamp-2 text-xs leading-snug text-ink/70">{desc}</p>
          </div>
        </div>
      </figure>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-bold">Picture</legend>
        <div role="radiogroup" aria-label="Preview picture" className="grid gap-2 sm:grid-cols-3">
          {CHOICES.map(({ id, label, hint, Icon }) => {
            const on = draft.image === id;
            const disabled = id === "photo" && photos.length === 0;
            return (
              <button key={id} type="button" role="radio" aria-checked={on} disabled={disabled}
                onClick={() => { if (id === "upload" && !draft.upload) fileRef.current?.click(); else set({ image: id }); }}
                className={cn("flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-colors sm:flex-col sm:items-start",
                  on ? "border-ink bg-sun shadow-block-sm" : "border-ink/30 bg-card hover:border-ink", disabled && "cursor-not-allowed opacity-50")}>
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="grid leading-tight"><span className="text-sm font-bold">{label}</span><span className="text-xs text-ink/70">{disabled ? "Add photos to your page first" : hint}</span></span>
              </button>
            );
          })}
        </div>

        {draft.image === "photo" && photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Photos from your page">
            {photos.map((p, i) => (
              <button key={p} type="button" role="radio" aria-checked={draft.photo === p} onClick={() => set({ photo: p })} aria-label={`Photo ${i + 1}`}
                className={cn("relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2", draft.photo === p ? "border-ink shadow-block-sm" : "border-ink/30")}>
                <img src={p} alt="" className="h-full w-full object-cover" loading="lazy" />
                {draft.photo === p && <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-sun text-ink"><Check className="h-3 w-3" /></span>}
              </button>
            ))}
          </div>
        )}

        {draft.image === "upload" && (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" className="h-11" onClick={() => fileRef.current?.click()}><ImagePlus className="mr-2 h-4 w-4" /> {draft.upload ? "Choose a different picture" : "Choose a picture"}</Button>
            <p className="text-xs text-muted-foreground">Wide pictures work best. We crop it to fit.</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Upload a preview picture" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} />
      </fieldset>

      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <label htmlFor="lp-title" className="text-sm font-bold">Title</label>
          <Input id="lp-title" value={draft.title ?? ""} maxLength={TITLE_MAX} placeholder={own.title} onChange={(e) => set({ title: e.target.value })} />
          <p className="text-xs text-muted-foreground">{(draft.title ?? "").length}/{TITLE_MAX}. Leave empty to use the suggested title.</p>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="lp-desc" className="text-sm font-bold">Line under the title</label>
          <Textarea id="lp-desc" rows={2} value={draft.description ?? ""} maxLength={DESC_MAX} placeholder={own.desc} onChange={(e) => set({ description: e.target.value })} />
          <p className="text-xs text-muted-foreground">{(draft.description ?? "").length}/{DESC_MAX}. Leave empty to use the suggested line.</p>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="lp-msg" className="text-sm font-bold">Message that goes with the link</label>
          <Textarea id="lp-msg" rows={4} value={draft.message ?? suggestedMessage(product, content)} maxLength={400} onChange={(e) => set({ message: e.target.value })} />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Your link is added on its own line after these words.</span>
            {draft.message !== undefined && <button type="button" className="font-semibold underline" onClick={() => set({ message: undefined })}>Use the suggested message</button>}
          </div>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border-2 border-ink bg-coral/30 px-3 py-2 text-sm">{error}</p>}
      <div className="grid gap-2">
        <Button type="button" className="h-12 border-2 border-ink bg-sun text-ink shadow-block-sm hover:bg-sun" onClick={save} disabled={saving || busy || (!dirty && saved)}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating your link…</> : saved && !dirty ? <><Check className="mr-2 h-4 w-4" /> Link updated</> : "Save and update my link"}
        </Button>
        {saved && !dirty && <p className="text-xs text-muted-foreground">Done. The link below now shows your choices. If you already sent the old link, WhatsApp may keep the old preview in that chat, so send the new link again.</p>}
      </div>
    </section>
  );
}
