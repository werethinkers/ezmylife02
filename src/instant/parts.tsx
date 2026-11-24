import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Product, Theme } from "./types";
import { loadThemeFonts } from "./themes";
import { sampleArt } from "./media";
import { stockSrcSet } from "./stock";
import { fill, isMobile, safeImg, waTo } from "./util";
import { submitLead } from "./api";

export function useThemeFonts(theme: Theme) {
  useEffect(() => { loadThemeFonts(theme); }, [theme]);
}

export function resolveImg(src: unknown, key = "x"): string | null {
  const s = safeImg(src);
  if (!s) return null;
  if (s.startsWith("sample:")) return sampleArt(s.slice(7) || key);
  return s;
}

/** A lazy image. Stock photos get a srcset so phones download small files; a photo that fails
 *  to load is hidden instead of showing a broken-image icon. */
export function Img({ src, alt, className, style, sampleKey, sizes = "(min-width: 900px) 50vw, 100vw", eager }: { src: unknown; alt: string; className?: string; style?: CSSProperties; sampleKey?: string; sizes?: string; eager?: boolean }) {
  const s = resolveImg(src, sampleKey);
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [s]);
  if (!s || bad) return null;
  const set = stockSrcSet(s);
  return <img src={s} srcSet={set} sizes={set ? sizes : undefined} alt={alt} className={className} style={style} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setBad(true)} />;
}

/** Shows a fixed action bar only once the element it replaces (usually the hero buttons) has
 *  scrolled out of view, so the bar never covers them. Works inside the builder's scrolled preview too. */
export function useRevealBar<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShow(true); return; }
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, show };
}

/** Font size that keeps the longest word of a headline on one line: words never break mid-word. */
export const fitWords = (text: string) => ({ ["--fit" as string]: String(Math.max(4, ...String(text).split(/\s+/).map((w) => w.length))) }) as CSSProperties;

/* ---------- photo gallery: swipe on phones, a grid on wider screens, tap for full screen ---------- */
export type Photo = { photo: string; caption?: string };
export function Gallery({ photos, title, keyPrefix = "g", layout = "auto" }: { photos: Photo[]; title: string; keyPrefix?: string; layout?: "auto" | "grid" | "strip" }) {
  const [open, setOpen] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const list = photos.filter((p) => resolveImg(p.photo));
  if (!list.length) return null;
  // The gallery sits inside size containers, which would trap a fixed overlay; render it at the page root.
  const root = wrap.current?.closest(".ipr") ?? null;
  return (
    <>
      <div ref={wrap} className={"ip-gal ip-gal-" + layout + (list.length === 1 ? " one" : "")} role="list" aria-label={`${title}: ${list.length} photo${list.length > 1 ? "s" : ""}`}>
        {list.map((g, i) => (
          <figure key={i} role="listitem">
            <button type="button" onClick={() => setOpen(i)} aria-label={`Open photo ${i + 1} of ${list.length}${g.caption ? `: ${g.caption}` : ""}`}>
              <Img src={g.photo} alt={g.caption || `${title} ${i + 1}`} sampleKey={keyPrefix + i} sizes="(min-width: 700px) 40vw, 85vw" />
            </button>
            {g.caption && <figcaption>{g.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {list.length > 1 && <p className="ip-gal-hint" aria-hidden="true">Swipe for more · tap to enlarge</p>}
      {open !== null && root && createPortal(<Lightbox photos={list} start={open} title={title} onClose={() => setOpen(null)} keyPrefix={keyPrefix} />, root)}
    </>
  );
}

export function Lightbox({ photos, start, title, onClose, keyPrefix }: { photos: Photo[]; start: number; title: string; onClose: () => void; keyPrefix: string }) {
  const [i, setI] = useState(start);
  const n = photos.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);
  const touch = useRef<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", k);
    box.current?.focus();
    return () => window.removeEventListener("keydown", k);
  }, [go, onClose]);
  const p = photos[i];
  return (
    <div ref={box} className="ip-lb ip-fixed" role="dialog" aria-modal="true" aria-label={`${title}, photo ${i + 1} of ${n}`} tabIndex={-1}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { const x0 = touch.current; touch.current = null; if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); }}>
      <Img key={i} src={p.photo} alt={p.caption || `${title} ${i + 1}`} sampleKey={keyPrefix + photos.indexOf(p)} sizes="100vw" eager />
      <div className="ip-lb-bar">
        <span>{p.caption || `${i + 1} / ${n}`}</span>
        <button type="button" onClick={onClose} aria-label="Close">✕</button>
      </div>
      {n > 1 && <><button type="button" className="ip-lb-nav prev" onClick={() => go(-1)} aria-label="Previous photo">‹</button><button type="button" className="ip-lb-nav next" onClick={() => go(1)} aria-label="Next photo">›</button></>}
      {n > 1 && <div className="ip-lb-dots" aria-hidden="true">{photos.map((_, j) => <i key={j} className={j === i ? "on" : ""} />)}</div>}
    </div>
  );
}

const svg = (d: ReactNode, fill = false) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
export const Icon = {
  wa: () => svg(<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.7.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />, true),
  phone: () => svg(<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />),
  map: () => svg(<><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>),
  nav: () => svg(<path d="m3 11 18-8-8 18-2-8z" />),
  cal: () => svg(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>),
  clock: () => svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  star: () => svg(<path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" />, true),
  check: () => svg(<path d="M20 6 9 17l-5-5" />),
  plus: () => svg(<path d="M12 5v14M5 12h14" />),
  minus: () => svg(<path d="M5 12h14" />),
  mail: () => svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
  link: () => svg(<><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></>),
  user: () => svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>),
  music: () => svg(<><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>),
  mute: () => svg(<><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /><path d="M3 3l18 18" /></>),
  bag: () => svg(<><path d="M6 7h12l1 14H5z" /><path d="M9 7a3 3 0 0 1 6 0" /></>),
};

/* ---------- confetti: drawn into a canvas that covers its positioned parent ---------- */
const CONFETTI = ["#FF4F8B", "#FFC83D", "#2ECC9A", "#47B2FF", "#C9A7F5"];
type Bit = { x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number; h: number; c: string; life: number; round: boolean };
export function useConfetti(colors: string[] = CONFETTI) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const bits = useRef<Bit[]>([]);
  const raf = useRef(0);
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tick = useCallback(() => {
    const cv = ref.current; if (!cv) { raf.current = 0; return; }
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(r.width * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
    const x = cv.getContext("2d")!; x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, r.width, r.height);
    bits.current = bits.current.filter((p) => p.life < 220 && p.y < r.height + 40);
    for (const p of bits.current) {
      p.life++; p.vy += 0.22; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx + Math.sin(p.life / 12) * 0.6; p.y += p.vy; p.r += p.vr;
      x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.globalAlpha = Math.max(0, 1 - p.life / 220); x.fillStyle = p.c;
      if (p.round) { x.beginPath(); x.arc(0, 0, p.w / 2, 0, 7); x.fill(); } else x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life / 9)));
      x.restore();
    }
    raf.current = bits.current.length ? requestAnimationFrame(tick) : 0;
  }, []);
  const burst = useCallback((clientX?: number, clientY?: number, n = 140, spread = 1.2) => {
    const cv = ref.current; if (!cv || reduce) return;
    const r = cv.getBoundingClientRect();
    const x0 = clientX == null ? r.width / 2 : clientX - r.left, y0 = clientY == null ? r.height * 0.4 : clientY - r.top;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3 * spread, v = 6 + Math.random() * 9;
      bits.current.push({ x: x0, y: y0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, w: 6 + Math.random() * 6, h: 8 + Math.random() * 10, c: colors[i % colors.length], life: 0, round: Math.random() < 0.25 });
    }
    if (!raf.current) raf.current = requestAnimationFrame(tick);
  }, [colors, reduce, tick]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return { ref, burst };
}

/* ---------- music box (synthesised: no audio files to license or load) ---------- */
const N: Record<string, number> = { C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880 };
const TUNES: Record<string, [string, number][]> = {
  birthday: [["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2], ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2], ["G4", .75], ["G4", .25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 2], ["F5", .75], ["F5", .25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 3]],
  gentle: [["C5", 1], ["E5", 1], ["G5", 1], ["E5", 1], ["A4", 1], ["C5", 1], ["E5", 1], ["C5", 1], ["F4", 1], ["A4", 1], ["C5", 1], ["A4", 1], ["G4", 1], ["B4", 1], ["D5", 1], ["G5", 2]],
  festive: [["C5", .5], ["E5", .5], ["G5", .5], ["C5", .5], ["D5", .5], ["F5", .5], ["A5", .5], ["G5", 1.5], ["E5", .5], ["G5", .5], ["C5", .5], ["E5", .5], ["D5", .5], ["C5", 2]],
};
export function useMusicBox(kind: "birthday" | "gentle" | "festive" | "none") {
  const ac = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null);
  const loop = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const note = (f: number, t: number, dur: number, vol: number) => {
    const ctx = ac.current!, out = master.current; if (!out) return;
    ([[1, "sine", 1], [2, "sine", 0.25], [3, "triangle", 0.08]] as [number, OscillatorType, number][]).forEach(([m, type, g]) => {
      const o = ctx.createOscillator(), gn = ctx.createGain();
      o.type = type; o.frequency.value = f * m;
      gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(vol * g, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(2.2, dur + 1.2));
      o.connect(gn).connect(out); o.start(t); o.stop(t + dur + 1.4);
    });
  };
  const playOnce = () => {
    const ctx = ac.current; if (!ctx || kind === "none") return;
    const beat = kind === "birthday" ? 0.42 : 0.5; let t = ctx.currentTime + 0.1;
    TUNES[kind].forEach(([n, d], i) => { note(N[n], t, d * beat, 0.22); if (i % 3 === 0) note(N[n] / 2, t, d * beat, 0.08); t += d * beat; });
    loop.current = window.setTimeout(() => { if (master.current) playOnce(); }, (t - ctx.currentTime) * 1000 + 1600);
  };
  const start = () => {
    if (kind === "none") return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!ac.current) ac.current = new AC();
      if (!master.current) { master.current = ac.current.createGain(); master.current.gain.value = 0.7; master.current.connect(ac.current.destination); }
      ac.current.resume(); setPlaying(true); clearTimeout(loop.current); playOnce();
    } catch { /* audio unavailable */ }
  };
  const stop = () => {
    clearTimeout(loop.current); setPlaying(false);
    const m = master.current; master.current = null;
    if (m && ac.current) { m.gain.setTargetAtTime(0, ac.current.currentTime, 0.08); setTimeout(() => m.disconnect(), 400); }
  };
  const chime = () => {
    const ctx = ac.current; if (!ctx || !master.current) return;
    [N.C5, N.E5, N.G5, N.C5 * 2].forEach((f, i) => note(f, ctx.currentTime + i * 0.08, 0.3, 0.18));
  };
  useEffect(() => () => { clearTimeout(loop.current); master.current?.disconnect(); ac.current?.close().catch(() => undefined); }, []);
  return { playing, start, stop, chime };
}

/* ---------- lead / RSVP / order form ---------- */
export function LeadForm(props: {
  slug?: string; mode: "live" | "preview"; kind: "lead" | "rsvp" | "order";
  button: string; ownerWa?: string; waTemplate?: string; vars: Record<string, unknown>;
  messageLabel?: string; extra?: { id: string; label: string; options: string[] };
  context?: Record<string, unknown>; done: (name: string) => ReactNode;
}) {
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [msg, setMsg] = useState("");
  const [extra, setExtra] = useState(props.extra?.options[0] ?? "");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [sent, setSent] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setErr("Enter your name.");
    if (!isMobile(phone)) return setErr("Enter a 10-digit mobile number, like 98765 43210.");
    setErr(""); setBusy(true);
    try {
      if (props.mode === "live" && props.slug) {
        const ctx = { ...(props.context ?? {}), ...(props.extra ? { [props.extra.id]: extra } : {}) };
        const r = await submitLead(props.slug, props.kind, name.trim(), phone, msg, ctx);
        if (!r.ok) throw new Error(r.reason === "rate_limited" ? "You've already sent this today. We'll be in touch." : r.reason === "phone" ? "Check the mobile number." : "Couldn't send. Try WhatsApp instead.");
      }
      setSent(name.trim());
    } catch (x) { setErr(x instanceof Error ? x.message : "Couldn't send. Try WhatsApp instead."); }
    finally { setBusy(false); }
  };
  if (sent) {
    const wa = props.ownerWa && props.waTemplate ? waTo(props.ownerWa, fill(props.waTemplate, { ...props.vars, lead_name: sent, extra })) : null;
    return (
      <div className="ip-done">
        {props.done(sent)}
        {wa && <a className="ip-btn ip-wa" href={wa} target="_blank" rel="noopener noreferrer"><Icon.wa /> Also send on WhatsApp</a>}
        {props.mode === "preview" && <p className="ip-fine">Preview: on your live page this goes to your Leads list.</p>}
      </div>
    );
  }
  return (
    <form className="ip-form" onSubmit={submit} noValidate>
      <label className="ip-field"><span>Your name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} /></label>
      <label className="ip-field"><span>Mobile number</span><input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d +]/g, "").slice(0, 14))} inputMode="numeric" autoComplete="tel" placeholder="98765 43210" /></label>
      {props.extra && (
        <label className="ip-field"><span>{props.extra.label}</span>
          <select value={extra} onChange={(e) => setExtra(e.target.value)}>{props.extra.options.map((o) => <option key={o}>{o}</option>)}</select>
        </label>
      )}
      {props.messageLabel && <label className="ip-field"><span>{props.messageLabel}</span><textarea value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={500} rows={3} /></label>}
      {err && <p className="ip-err" role="alert">{err}</p>}
      <button className="ip-btn ip-primary" type="submit" disabled={busy}>{busy ? "Sending…" : props.button}</button>
    </form>
  );
}

export function MadeWith({ product, light }: { product: Product; light?: boolean }) {
  return (
    <a className={"ip-made" + (light ? " light" : "")} href={`/make/${product.id}`} target="_top">
      <small>Made with EZYOURLIFE</small><b>Make your own {product.name.toLowerCase()}</b>
    </a>
  );
}

/** CSS shared by every renderer. Family renderers add their own on top. */
export const BASE_CSS = `
.ipr{background:var(--bg);color:var(--tx);font-family:var(--fb);line-height:1.55;-webkit-font-smoothing:antialiased;min-height:100%;position:relative;overflow-x:clip}
.ipr *,.ipr *::before,.ipr *::after{box-sizing:border-box}
.ipr img{max-width:100%;display:block}
.ipr a{color:inherit}
.ipr :focus-visible{outline:3px solid var(--ac2);outline-offset:3px}
.ipr .ip-wrap{max-width:760px;margin-inline:auto;padding-inline:clamp(16px,5cqi,40px);position:relative;container-type:inline-size}
/* Sizes use container units so the builder's phone-sized preview matches a real phone. Fixed bars live outside these containers. */
.ipr .cel-gift,.ipr .biz-hero,.ipr .ev-hero,.ipr .mn-head{container-type:inline-size}
.ipr .ip-btn{appearance:none;border:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:.55em;min-height:54px;padding:0 1.3em;border-radius:999px;font:700 1rem/1 var(--fb);text-decoration:none;transition:transform .2s cubic-bezier(.2,.8,.2,1);-webkit-tap-highlight-color:transparent;text-align:center}
.ipr .ip-btn:active{transform:scale(.97)}
.ipr .ip-btn:disabled{opacity:.6;cursor:default}
.ipr .ip-primary{background:var(--ac);color:var(--on)}
.ipr .ip-ghost{background:transparent;color:var(--tx);box-shadow:inset 0 0 0 1.5px var(--line)}
.ipr .ip-wa{background:#25D366;color:#06260F}
.ipr .ip-form{display:grid;gap:12px}
.ipr .ip-field{display:grid;gap:6px;font-size:.78rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mu)}
.ipr .ip-field input,.ipr .ip-field select,.ipr .ip-field textarea{width:100%;min-height:50px;padding:12px 14px;border-radius:14px;border:1.5px solid var(--line);background:var(--sf);color:var(--tx);font:500 1rem/1.3 var(--fb);letter-spacing:0;text-transform:none}
.ipr .ip-field textarea{min-height:90px;resize:vertical}
.ipr .ip-field input:focus,.ipr .ip-field select:focus,.ipr .ip-field textarea:focus{outline:none;border-color:var(--ac)}
.ipr .ip-err{color:#E5484D;font-size:.9rem;margin:0}
.ipr .ip-fine{font-size:.8rem;color:var(--mu);margin:0}
.ipr .ip-done{display:grid;gap:12px}
.ipr .ip-made{display:grid;gap:2px;margin:40px auto 0;padding:16px 20px;border-radius:18px;background:var(--sf);box-shadow:inset 0 0 0 1.5px var(--line);max-width:420px;text-decoration:none;text-align:center}
.ipr .ip-made small{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--mu)}
.ipr .ip-made b{font-size:1rem}
.ipr .ip-fx{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50}
.ipr .ip-fixed{position:fixed}
.ipr .ip-gal{display:grid;grid-auto-flow:column;grid-auto-columns:82%;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px;margin-inline:calc(-1 * clamp(16px,5cqi,40px));padding-inline:clamp(16px,5cqi,40px);scroll-padding-inline:clamp(16px,5cqi,40px)}
.ipr .ip-gal::-webkit-scrollbar{display:none}
.ipr .ip-gal.one{grid-auto-columns:100%}
.ipr .ip-gal figure{margin:0;scroll-snap-align:start;border-radius:var(--rad,18px);overflow:hidden;background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);display:grid;grid-template-rows:minmax(0,1fr) auto}
.ipr .ip-gal button{all:unset;cursor:zoom-in;display:block;aspect-ratio:4/5;position:relative;overflow:hidden}
.ipr .ip-gal img{width:100%;height:100%;object-fit:cover;transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.ipr .ip-gal button:hover img{transform:scale(1.04)}
.ipr .ip-gal button:focus-visible{outline:3px solid var(--ac2);outline-offset:-3px}
.ipr .ip-gal figcaption{padding:10px 14px;font-size:.88rem;color:var(--mu)}
.ipr .ip-gal-hint{margin:10px 0 0;font-size:.78rem;color:var(--mu);letter-spacing:.04em}
@container (min-width:620px){
  .ipr .ip-gal-auto,.ipr .ip-gal-grid{grid-auto-flow:row;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-columns:auto;overflow:visible;margin-inline:0;padding-inline:0}
  .ipr .ip-gal-auto figure:first-child:not(:only-child){grid-column:span 2;grid-row:span 2}
  .ipr .ip-gal-auto figure:first-child:not(:only-child) button{aspect-ratio:auto;height:100%}
  .ipr .ip-gal-auto.one,.ipr .ip-gal-grid.one{grid-template-columns:1fr}
  .ipr .ip-gal-auto.one button{aspect-ratio:16/9}
  .ipr .ip-gal-auto~.ip-gal-hint,.ipr .ip-gal-grid~.ip-gal-hint{display:none}
}
.ipr .ip-lb{inset:0;z-index:80;background:rgba(6,6,8,.94);display:grid;place-items:center;padding:56px 12px 64px;outline:none;animation:ip-fade .2s ease}
.ipr .ip-lb img{max-width:100%;max-height:100%;object-fit:contain;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.ipr .ip-lb-bar{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px 10px 18px;color:#fff;font:600 .9rem/1.3 var(--fb)}
.ipr .ip-lb-bar button,.ipr .ip-lb-nav{appearance:none;border:0;cursor:pointer;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font:400 1.6rem/1 system-ui;display:grid;place-items:center}
.ipr .ip-lb-bar button{font-size:1.1rem}
.ipr .ip-lb-nav{position:absolute;top:50%;transform:translateY(-50%)}
.ipr .ip-lb-nav.prev{left:10px}.ipr .ip-lb-nav.next{right:10px}
.ipr .ip-lb-dots{position:absolute;bottom:22px;left:0;right:0;display:flex;justify-content:center;gap:6px}
.ipr .ip-lb-dots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.35)}
.ipr .ip-lb-dots i.on{background:#fff;width:18px;border-radius:4px}
@keyframes ip-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.ipr *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;
