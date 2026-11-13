import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "./parts";

/* The Signature kit (Nov 2026): effects for every family's Signature version.
   They are our own re-builds of patterns from free open-source UI libraries (Magic UI, Aceternity UI and
   the 21st.dev community: aurora, meteors, dot and grid patterns, light rays, ripple, sparkles, waves,
   shimmer and gradient text, spotlight cards, tilt cards, border beam, number flip). Plain React and CSS,
   no new packages, and all of them respect "reduce motion".

   Each design gets its own mix, picked from its product id, so no two Signature pages look alike:
   one hero backdrop out of eight, one headline finish out of four and one card finish out of three. */

export type Fx = "aurora" | "meteors" | "grid" | "dots" | "rays" | "orbs" | "ripple" | "waves";
export type Ink = "shimmer" | "gradient" | "underline" | "plain";
export type CardFx = "spot" | "tilt" | "beam";
const FX: Fx[] = ["aurora", "meteors", "grid", "dots", "rays", "orbs", "ripple", "waves"];
const INK: Ink[] = ["shimmer", "gradient", "underline", "plain"];
const CARD: CardFx[] = ["spot", "tilt", "beam"];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** The look of one design's Signature version. Same id, same look, on every visit. */
export function signatureOf(id: string) {
  const h = hash(id);
  return { fx: FX[h % FX.length], ink: INK[(h >>> 5) % INK.length], card: CARD[(h >>> 9) % CARD.length] };
}

/** The class names a renderer adds to its root for the Signature version. */
export const sigClass = (id: string, on: boolean) => {
  if (!on) return "";
  const s = signatureOf(id);
  return ` sig sig-ink-${s.ink} sig-card-${s.card}`;
};

const rnd = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

/** The hero backdrop. Put it first inside a positioned hero; it fills it and never takes clicks. */
export function Backdrop({ id, fx }: { id: string; fx?: Fx }) {
  const kind = fx ?? signatureOf(id).fx;
  const r = rnd(hash(id + kind));
  if (kind === "aurora") return <div className="sig-bd sig-aurora" aria-hidden="true"><i /><i /><i /></div>;
  if (kind === "grid") return <div className="sig-bd sig-grid" aria-hidden="true"><i /></div>;
  if (kind === "dots") return <div className="sig-bd sig-dots" aria-hidden="true" />;
  if (kind === "rays") return <div className="sig-bd sig-rays" aria-hidden="true" />;
  if (kind === "ripple") return <div className="sig-bd sig-ripple" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ ["--i" as string]: i } as CSSProperties} />)}</div>;
  if (kind === "waves") return (
    <div className="sig-bd sig-waves" aria-hidden="true">
      <svg viewBox="0 0 1200 400" preserveAspectRatio="none">
        {[0, 1, 2, 3].map((i) => <path key={i} style={{ ["--i" as string]: i } as CSSProperties} d={`M0 ${220 + i * 34} C 200 ${150 + i * 30}, 400 ${300 + i * 20}, 600 ${220 + i * 30} S 1000 ${140 + i * 36}, 1200 ${230 + i * 28}`} />)}
      </svg>
    </div>
  );
  if (kind === "meteors") return (
    <div className="sig-bd sig-meteors" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${Math.round(r() * 110 - 5)}%`, top: `${Math.round(r() * 40 - 20)}%`, animationDelay: `${(r() * 6).toFixed(2)}s`, animationDuration: `${(3 + r() * 5).toFixed(2)}s` }} />)}
    </div>
  );
  // orbs: soft floating lights, like sparkles seen out of focus
  return (
    <div className="sig-bd sig-orbs" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => { const s = 8 + Math.round(r() * 60); return <i key={i} style={{ left: `${Math.round(r() * 100)}%`, top: `${Math.round(r() * 100)}%`, width: s, height: s, animationDelay: `${(r() * -12).toFixed(2)}s`, ["--c" as string]: `var(--${["ac", "ac2", "ac3"][i % 3]})` } as CSSProperties} />; })}
    </div>
  );
}

/** Cards that follow the finger or mouse: a soft light (spot) or a 3D lean (tilt). One listener per page section. */
export function usePointerFx<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const move = (e: PointerEvent) => {
      const card = (e.target as HTMLElement | null)?.closest?.(".sig-fx") as HTMLElement | null;
      if (!card || !el.contains(card)) return;
      const b = card.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      card.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      card.style.setProperty("--rx", `${((0.5 - y) * 8).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${((x - 0.5) * 10).toFixed(2)}deg`);
    };
    const leave = (e: PointerEvent) => {
      const card = (e.target as HTMLElement | null)?.closest?.(".sig-fx") as HTMLElement | null;
      if (card && !card.contains(e.relatedTarget as Node | null)) { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); }
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerout", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerout", leave); };
  }, []);
  return ref;
}

/** A folded form. Starts closed so the page stays short; opening one closes any other form on the page. */
export function FormFold({ title, hint, children, group = "ip-forms", icon }: { title: ReactNode; hint?: ReactNode; children: ReactNode; group?: string; icon?: ReactNode }) {
  return (
    <details className="ip-fold" {...{ name: group }}>
      <summary>
        <span className="ip-fold-ic" aria-hidden="true">{icon ?? <Icon.mail />}</span>
        <span className="ip-fold-t"><b>{title}</b>{hint && <small>{hint}</small>}</span>
        <span className="ip-fold-x" aria-hidden="true"><Icon.plus /></span>
      </summary>
      <div className="ip-fold-b">{children}</div>
    </details>
  );
}

/** A countdown whose digits flip as they change, seconds included. */
export function FlipCount({ to, labels = ["days", "hours", "mins", "secs"] }: { to: number; labels?: string[] }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = to - now;
  if (left <= 0) return null;
  const parts = [Math.floor(left / 86400000), Math.floor(left / 3600000) % 24, Math.floor(left / 60000) % 60, Math.floor(left / 1000) % 60];
  return (
    <div className="sig-flip" role="timer" aria-label={`${parts[0]} days, ${parts[1]} hours and ${parts[2]} minutes to go`}>
      {parts.map((n, i) => (
        <div key={labels[i]} aria-hidden="true">
          <b key={n} className="sig-flip-n">{String(n).padStart(2, "0")}</b>
          <span>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

/** A row of chips that drifts sideways forever (one line, never wraps). */
export function Marquee({ items, label }: { items: string[]; label: string }) {
  if (!items.length) return null;
  const row = items.length < 6 ? [...items, ...items, ...items] : items;
  return (
    <div className="sig-marq" role="img" aria-label={`${label}: ${items.join(", ")}`}>
      <div className="trk" aria-hidden="true">{[...row, ...row].map((s, i) => <span key={i}>{s}</span>)}</div>
    </div>
  );
}

/** CSS for the kit. Renderers add it after their own CSS, so `.sig` rules win. */
export const SIG_CSS = `
.ipr .sig-bd{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:-1}
.ipr .sig-hero{position:relative;isolation:isolate}
/* aurora */
.ipr .sig-aurora i{position:absolute;width:70%;height:70%;border-radius:50%;filter:blur(60px);opacity:.45;mix-blend-mode:normal;animation:sig-drift 18s ease-in-out infinite alternate}
.ipr .sig-aurora i:nth-child(1){background:var(--ac);left:-15%;top:-25%}
.ipr .sig-aurora i:nth-child(2){background:var(--ac2);right:-20%;top:-10%;animation-duration:22s;animation-delay:-6s}
.ipr .sig-aurora i:nth-child(3){background:var(--ac3);left:20%;bottom:-40%;animation-duration:26s;animation-delay:-12s;opacity:.3}
@keyframes sig-drift{0%{transform:translate(0,0) scale(1)}50%{transform:translate(8%,6%) scale(1.15)}100%{transform:translate(-6%,10%) scale(.95)}}
/* grid with a light beam */
.ipr .sig-grid{background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:36px 36px;-webkit-mask:radial-gradient(ellipse at 50% 0%,#000 25%,transparent 75%);mask:radial-gradient(ellipse at 50% 0%,#000 25%,transparent 75%)}
.ipr .sig-grid i{position:absolute;left:0;right:0;height:120px;background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--ac) 22%,transparent),transparent);animation:sig-scan 7s linear infinite}
@keyframes sig-scan{from{top:-120px}to{top:100%}}
/* dots */
.ipr .sig-dots{background-image:radial-gradient(color-mix(in srgb,var(--tx) 22%,transparent) 1.2px,transparent 1.4px);background-size:20px 20px;-webkit-mask:radial-gradient(ellipse at 50% 40%,#000 15%,transparent 70%);mask:radial-gradient(ellipse at 50% 40%,#000 15%,transparent 70%)}
.ipr .sig-dots::after{content:"";position:absolute;width:60%;aspect-ratio:1;left:20%;top:-10%;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--ac) 30%,transparent),transparent 65%);animation:sig-breathe 6s ease-in-out infinite}
@keyframes sig-breathe{50%{transform:scale(1.2);opacity:.6}}
/* light rays */
.ipr .sig-rays{background:repeating-conic-gradient(from 0deg at 50% -10%,color-mix(in srgb,var(--ac) 16%,transparent) 0deg 6deg,transparent 6deg 18deg);-webkit-mask:radial-gradient(ellipse at 50% 0%,#000 10%,transparent 70%);mask:radial-gradient(ellipse at 50% 0%,#000 10%,transparent 70%);animation:sig-sway 14s ease-in-out infinite alternate;transform-origin:50% 0}
@keyframes sig-sway{from{transform:rotate(-4deg) scale(1.1)}to{transform:rotate(4deg) scale(1.1)}}
/* orbs */
.ipr .sig-orbs i{position:absolute;border-radius:50%;background:radial-gradient(circle at 35% 35%,color-mix(in srgb,var(--c) 85%,#fff),color-mix(in srgb,var(--c) 30%,transparent) 70%);opacity:.35;filter:blur(1px);animation:sig-float 14s ease-in-out infinite}
@keyframes sig-float{0%,100%{transform:translate(0,0)}33%{transform:translate(18px,-26px)}66%{transform:translate(-14px,16px)}}
/* ripple */
.ipr .sig-ripple i{position:absolute;left:50%;top:38%;width:calc(180px + var(--i) * 140px);aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%);border:1px solid color-mix(in srgb,var(--ac) calc(46% - var(--i) * 8%),transparent);background:color-mix(in srgb,var(--ac) calc(7% - var(--i) * 1%),transparent);animation:sig-pulse 4.5s ease-in-out infinite;animation-delay:calc(var(--i) * .25s)}
@keyframes sig-pulse{50%{transform:translate(-50%,-50%) scale(.94)}}
/* waves */
.ipr .sig-waves svg{position:absolute;inset:auto 0 0 0;width:100%;height:70%}
.ipr .sig-waves path{fill:none;stroke:color-mix(in srgb,var(--ac) calc(60% - var(--i) * 12%),transparent);stroke-width:1.5;stroke-dasharray:6 10;animation:sig-dash 20s linear infinite;animation-duration:calc(16s + var(--i) * 6s)}
@keyframes sig-dash{to{stroke-dashoffset:-600}}
/* meteors */
.ipr .sig-meteors i{position:absolute;width:2px;height:2px;border-radius:50%;background:var(--ac2);box-shadow:0 0 0 1px color-mix(in srgb,var(--ac2) 20%,transparent);transform:rotate(215deg);animation:sig-meteor 5s linear infinite}
.ipr .sig-meteors i::before{content:"";position:absolute;top:50%;width:90px;height:1px;transform:translateY(-50%);background:linear-gradient(90deg,var(--ac2),transparent)}
@keyframes sig-meteor{0%{transform:rotate(215deg) translateX(0);opacity:1}70%{opacity:1}100%{transform:rotate(215deg) translateX(-700px);opacity:0}}

/* headline finishes. Text-clipped gradients go on each word when the headline is split into words,
   because a gradient clipped to the parent does not reach words that move on their own. */
.ipr.sig-ink-shimmer .sig-h:not(:has(>span)),.ipr.sig-ink-shimmer .sig-h>span{background:linear-gradient(110deg,var(--ac) 35%,color-mix(in srgb,var(--ac) 30%,#fff) 50%,var(--ac) 65%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent!important;animation:sig-shine 4.5s linear infinite}
@keyframes sig-shine{from{background-position:100% 0}to{background-position:-150% 0}}
.ipr.sig-ink-gradient .sig-h:not(:has(>span)),.ipr.sig-ink-gradient .sig-h>span{background:linear-gradient(95deg,var(--ac),var(--ac2) 55%,var(--ac3));-webkit-background-clip:text;background-clip:text;color:transparent!important}
.ipr.sig-ink-underline .sig-h{background:linear-gradient(var(--ac2),var(--ac2)) 0 92%/0% .14em no-repeat;animation:sig-under 1.2s .5s cubic-bezier(.2,.8,.2,1) forwards;padding-bottom:.06em}
@keyframes sig-under{to{background-size:100% .14em}}

/* card finishes: add .sig-fx to a card */
.ipr .sig-fx{position:relative;transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s ease}
.ipr.sig-card-spot .sig-fx{background-image:radial-gradient(320px circle at var(--mx,50%) var(--my,0%),color-mix(in srgb,var(--ac) 16%,transparent),transparent 60%)}
.ipr.sig-card-tilt .sig-fx{transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))}
.ipr.sig-card-tilt .sig-fx:hover{box-shadow:0 24px 50px -28px rgba(0,0,0,.45)}
@property --sig-a{syntax:'<angle>';initial-value:0deg;inherits:false}
@keyframes sig-beam{to{--sig-a:360deg}}
.ipr.sig-card-beam .sig-fx{border:1.5px solid transparent!important;background:linear-gradient(var(--sf),var(--sf)) padding-box,conic-gradient(from var(--sig-a),var(--line) 0 72%,var(--ac) 86%,var(--line) 100%) border-box!important;animation:sig-beam 4s linear infinite}

/* glass panel */
.ipr .sig-glass{background:color-mix(in srgb,var(--sf) 62%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.3);backdrop-filter:blur(14px) saturate(1.3);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tx) 12%,transparent),0 20px 50px -30px rgba(0,0,0,.5)}

/* flip countdown */
.ipr .sig-flip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;width:min(100%,420px);margin:24px auto 0}
.ipr .sig-flip div{display:grid;gap:4px;justify-items:center;padding:12px 4px;border-radius:14px;background:var(--sf);box-shadow:inset 0 0 0 1px var(--line),0 12px 30px -20px rgba(0,0,0,.5);overflow:hidden}
.ipr .sig-flip b{font:700 clamp(1.5rem,8cqi,2.2rem)/1 var(--fd);color:var(--ac);font-variant-numeric:tabular-nums;animation:sig-flipin .45s cubic-bezier(.2,.8,.2,1)}
.ipr .sig-flip span{font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mu)}
@keyframes sig-flipin{from{transform:perspective(200px) rotateX(-80deg);opacity:0}}

/* marquee */
.ipr .sig-marq{min-width:0;max-width:100%;overflow:hidden;-webkit-mask:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.ipr .sig-marq .trk{display:flex;gap:10px;width:max-content;animation:sig-marq 32s linear infinite}
.ipr .sig-marq span{padding:10px 16px;border-radius:999px;background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);font-weight:600;font-size:.92rem;white-space:nowrap}
.ipr .sig-marq:hover .trk{animation-play-state:paused}
@keyframes sig-marq{to{transform:translateX(-50%)}}

/* one-line rows that swipe */
.ipr .sig-row{min-width:0;max-width:100%;display:flex!important;flex-wrap:nowrap!important;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;gap:12px;padding:4px 2px 14px;margin-inline:-2px;grid-template-columns:none!important}
.ipr .sig-row::-webkit-scrollbar{display:none}
.ipr .sig-row>*{flex:0 0 min(78cqi,18rem);scroll-snap-align:start}

/* folded forms (every version, not only Signature) */
.ipr .ip-fold{border-radius:var(--rad,18px);background:var(--sf);box-shadow:inset 0 0 0 1.5px var(--line);text-align:left;color:var(--tx);width:100%}
.ipr .ip-fold summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:14px;padding:16px 18px;-webkit-tap-highlight-color:transparent}
.ipr .ip-fold summary::-webkit-details-marker{display:none}
.ipr .ip-fold-ic{flex:none;width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--ac);color:var(--on)}
.ipr .ip-fold-t{display:grid;gap:2px;min-width:0;flex:1}
.ipr .ip-fold-t b{font:700 1.04rem/1.3 var(--fb)}
.ipr .ip-fold-t small{font-size:.86rem;color:var(--mu);line-height:1.35}
.ipr .ip-fold-x{flex:none;color:var(--ac);transition:transform .25s ease}
.ipr .ip-fold[open] .ip-fold-x{transform:rotate(45deg)}
.ipr .ip-fold-b{padding:0 18px 18px;display:grid;gap:12px;animation:ip-fade .25s ease}
.ipr .ip-fold .ip-field input,.ipr .ip-fold .ip-field select,.ipr .ip-fold .ip-field textarea{background:var(--bg);color:var(--tx);border-color:var(--line)}
.ipr .ip-fold .ip-field{color:var(--mu)}
.ipr .ip-fold .ip-fine{color:var(--mu)}
.ipr .ip-folds{display:grid;gap:10px;width:100%}

@media (prefers-reduced-motion:reduce){.ipr .sig-bd *,.ipr .sig-bd,.ipr .sig-h,.ipr .sig-fx,.ipr .sig-marq .trk{animation:none!important}.ipr.sig-ink-underline .sig-h{background-size:100% .14em}.ipr .sig-marq .trk{flex-wrap:nowrap}}
`;
