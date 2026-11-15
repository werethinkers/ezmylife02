/*
 * Stay showcase
 * Ezyourlife original (src/instant/showpieces/StayShowcase.tsx). Not self-contained: it imports Ezyourlife parts and util files,
 * so copy the code together with src/instant/parts.tsx and src/instant/util.ts.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon, Img, resolveImg } from "../parts";
import { priceText } from "../util";

export type Room = { name: string; price?: string; note?: string };

/** Products whose rooms are shown as a stay showcase. */
export const STAY_PRODUCTS = new Set(["hotel", "resort", "hostel-pg"]);

const pad = (n: number) => String(n).padStart(2, "0");

/** Rooms as a showcase: one big photo with the room's details laid over it, a rail to pick the next one,
 *  arrow keys and swipes to move, and a gentle auto-tour that stops as soon as the visitor touches it. */
export default function StayShowcase({ rooms, photos, bookHref, label = "room" }: {
  rooms: Room[]; photos: string[]; bookHref: (room: Room) => string; label?: string;
}) {
  const [i, setI] = useState(0);
  const [touched, setTouched] = useState(false);
  const [hover, setHover] = useState(false);
  const drag = useRef<{ x: number; id: number } | null>(null);
  const imgs = photos.filter((p) => resolveImg(p));
  const n = rooms.length;
  const go = useCallback((d: number, user = true) => {
    if (user) setTouched(true);
    setI((v) => (v + d + n) % n);
  }, [n]);
  const pick = (k: number) => { setTouched(true); setI(k); };
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (touched || hover || reduced || n < 2) return;
    const t = setInterval(() => go(1, false), 5200);
    return () => clearInterval(t);
  }, [touched, hover, reduced, n, go]);

  const room = rooms[i];
  const photoOf = (k: number) => (imgs.length ? imgs[k % imgs.length] : null);
  const price = priceText(room.price);

  return (
    <div className="stay" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <style>{CSS}</style>
      <div
        className="stay-stage" tabIndex={0} role="group" aria-roledescription="carousel" aria-label={`${label}s`}
        onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); } }}
        onPointerDown={(e) => { drag.current = { x: e.clientX, id: e.pointerId }; }}
        onPointerUp={(e) => { const d = drag.current; drag.current = null; if (d && Math.abs(e.clientX - d.x) > 50) go(e.clientX < d.x ? 1 : -1); }}
        onPointerCancel={() => { drag.current = null; }}
      >
        {rooms.map((r, k) => {
          const src = photoOf(k);
          return (
            <div key={k} className={"stay-slide" + (k === i ? " on" : "")} aria-hidden={k !== i}>
              {src ? <Img src={src} alt={k === i ? r.name : ""} sizes="(min-width: 900px) 70vw, 100vw" eager={k < 2} /> : <span className="stay-blank" />}
            </div>
          );
        })}
        <div className="stay-shade" aria-hidden="true" />
        <div className="stay-info" key={i} aria-live="polite">
          <p className="stay-no">{pad(i + 1)} <i /> {pad(n)}</p>
          <h3>{room.name}</h3>
          {room.note && <p className="stay-note">{room.note}</p>}
          <div className="stay-row">
            {price && <b className="stay-price">{price}</b>}
            <a className="ip-btn ip-wa" href={bookHref(room)} target="_blank" rel="noopener noreferrer"><Icon.wa /> Book this {label}</a>
          </div>
        </div>
        {n > 1 && (
          <div className="stay-arrows">
            <button type="button" onClick={() => go(-1)} aria-label={`Previous ${label}`}>‹</button>
            <button type="button" onClick={() => go(1)} aria-label={`Next ${label}`}>›</button>
          </div>
        )}
        {n > 1 && !touched && !hover && !reduced && <span className="stay-timer" key={"t" + i} aria-hidden="true" />}
      </div>
      {n > 1 && (
        <ul className="stay-rail" aria-label={`Choose a ${label}`}>
          {rooms.map((r, k) => {
            const src = photoOf(k);
            return (
              <li key={k}>
                <button type="button" className={k === i ? "on" : ""} aria-pressed={k === i} onClick={() => pick(k)}>
                  <span className="th">{src ? <Img src={src} alt="" sizes="120px" /> : null}</span>
                  <span className="tx"><b>{r.name}</b>{priceText(r.price) && <em>{priceText(r.price)}</em>}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const CSS = `
.stay{display:grid;gap:14px;container:stay/inline-size}
.stay-stage{position:relative;overflow:hidden;border-radius:calc(var(--rad,16px) + 4px);aspect-ratio:4/5;background:linear-gradient(160deg,var(--ac),var(--ac2,var(--ac)));color:#fff;outline-offset:3px;touch-action:pan-y;box-shadow:inset 0 0 0 1px var(--line)}
@container stay (min-width:560px){.stay-stage{aspect-ratio:16/10}}
@container stay (min-width:900px){.stay-stage{aspect-ratio:16/8}}
.stay-slide{position:absolute;inset:0;opacity:0;transition:opacity .8s ease;pointer-events:none}
.stay-slide.on{opacity:1}
.stay-slide img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.02);transition:transform 6s ease-out}
.stay-slide.on img{transform:scale(1.09)}
.stay-blank{position:absolute;inset:0;background:linear-gradient(135deg,var(--ac),var(--ac2))}
.stay-shade{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.72) 0%,rgba(0,0,0,.28) 45%,rgba(0,0,0,0) 72%);pointer-events:none}
.stay-info{position:absolute;left:0;right:0;bottom:0;padding:clamp(16px,4cqi,34px);display:grid;gap:8px;max-width:640px;animation:stayin .6s ease both}
@keyframes stayin{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.stay-no{display:flex;align-items:center;gap:8px;margin:0;font:600 .72rem/1 var(--fb);letter-spacing:.2em;opacity:.85}
.stay-no i{display:block;width:26px;height:1px;background:currentColor;opacity:.6}
.stay-info h3{margin:0;font:700 clamp(1.5rem,6cqi,2.5rem)/1.05 var(--fd);color:#fff;text-wrap:balance}
.stay-note{margin:0;font-size:.95rem;line-height:1.45;opacity:.92;max-width:44ch}
.stay-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;margin-top:6px}
.stay-price{font:700 1.15rem/1 var(--fd);background:rgba(255,255,255,.16);backdrop-filter:blur(8px);padding:9px 14px;border-radius:999px}
.stay-arrows{position:absolute;right:14px;top:14px;display:flex;gap:8px}
.stay-arrows button{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.4);background:rgba(0,0,0,.35);backdrop-filter:blur(6px);color:#fff;font:400 1.5rem/1 var(--fb);cursor:pointer;display:grid;place-items:center;padding:0 0 3px}
.stay-arrows button:hover{background:rgba(0,0,0,.55)}
.stay-timer{position:absolute;left:0;bottom:0;height:3px;background:rgba(255,255,255,.85);width:100%;transform-origin:left;animation:staybar 5.2s linear both}
@keyframes staybar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.stay-rail{list-style:none;margin:0;padding:2px 2px 8px;display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none}
.stay-rail::-webkit-scrollbar{display:none}
.stay-rail li{flex:0 0 auto;scroll-snap-align:start}
.stay-rail button{display:flex;align-items:center;gap:10px;padding:6px 14px 6px 6px;border-radius:999px;border:0;background:var(--sf);color:var(--tx);box-shadow:inset 0 0 0 1px var(--line);cursor:pointer;font:inherit;text-align:left;transition:box-shadow .2s,transform .2s}
.stay-rail button.on{box-shadow:inset 0 0 0 2px var(--ac);transform:translateY(-1px)}
.stay-rail .th{width:44px;height:44px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,var(--ac),var(--ac2));flex:none}
.stay-rail .th img{width:100%;height:100%;object-fit:cover;display:block}
.stay-rail .tx{display:grid;gap:2px;line-height:1.15}
.stay-rail b{font-weight:600;font-size:.88rem;white-space:nowrap}
.stay-rail em{font-style:normal;font-size:.78rem;color:var(--mu)}
@media (prefers-reduced-motion:reduce){.stay-slide,.stay-slide img{transition:none}.stay-slide.on img{transform:none}.stay-info{animation:none}}
`;
