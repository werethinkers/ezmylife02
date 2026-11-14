import { useCallback, useEffect, useRef, useState } from "react";
import { Img } from "../parts";

/**
 * Multi-page websites. A page stays one address (/p/<slug>); its parts become pages
 * (Home, Services, Gallery, About, Contact) chosen from a sticky tab row. On a live page the
 * choice is kept in the address hash (#services), so the back button and shared links work.
 */
export type PageKey = "home" | "services" | "menu" | "gallery" | "about" | "contact";
export type SitePage = { key: PageKey; label: string };

export function useSitePages(pages: SitePage[], mode: "live" | "preview") {
  const keys = pages.map((p) => p.key);
  const read = (): PageKey => {
    if (mode !== "live" || typeof window === "undefined") return "home";
    const h = window.location.hash.replace(/^#/, "") as PageKey;
    return keys.includes(h) ? h : "home";
  };
  const [page, setPage] = useState<PageKey>(read);
  const keyStr = keys.join(",");
  useEffect(() => {
    if (mode !== "live") return;
    const on = () => setPage(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, keyStr]);
  const top = useRef<HTMLDivElement>(null);
  const go = useCallback((k: PageKey) => {
    if (!keys.includes(k)) k = "home";
    setPage(k);
    if (mode === "live") {
      const url = k === "home" ? window.location.pathname + window.location.search : "#" + k;
      if (k === "home") history.pushState(null, "", url); else window.location.hash = k;
    }
    const el = top.current;
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > y) window.scrollTo({ top: y, behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, keyStr]);
  return { page, go, top };
}

export function SiteNav({ pages, page, go }: { pages: SitePage[]; page: PageKey; go: (k: PageKey) => void }) {
  return (
    <nav className="sp-nav" aria-label="Pages">
      <div className="sp-nav-in">
        {pages.map((p) => (
          <a key={p.key} href={p.key === "home" ? "#" : "#" + p.key} aria-current={page === p.key ? "page" : undefined}
            onClick={(e) => { e.preventDefault(); go(p.key); }}>{p.label}</a>
        ))}
      </div>
    </nav>
  );
}

/** Slim title band at the top of every page except Home. */
export function PageBand({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="sp-band">
      <div className="ip-wrap"><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
    </div>
  );
}

/** Home page tiles that lead to the other pages. */
export function PageTiles({ tiles, go }: { tiles: { key: PageKey; title: string; text: string; photo?: string }[]; go: (k: PageKey) => void }) {
  if (!tiles.length) return null;
  return (
    <section className="biz-sec sp-tiles-sec">
      <div className="ip-wrap sp-tiles">
        {tiles.map((t) => (
          <a key={t.key} className="sp-tile" href={"#" + t.key} onClick={(e) => { e.preventDefault(); go(t.key); }}>
            {t.photo && <span className="ph" aria-hidden="true"><Img src={t.photo} alt="" sizes="(min-width: 900px) 30vw, 90vw" /></span>}
            <span className="tx"><b>{t.title}</b><span>{t.text}</span></span>
            <span className="go" aria-hidden="true">→</span>
          </a>
        ))}
      </div>
    </section>
  );
}

/**
 * 3D photo hero. Three looks:
 *  - split: a stacked deck that parts into two curved wings (from Curtain Split Hero)
 *  - fan:   a fanned hand of photo cards that lifts and tilts toward the pointer (from Card Hand Gallery)
 *  - ring:  photos turning slowly round a cylinder, bending toward you at the edges (from 3D curved carousel / Tilted Grid Hero)
 * Plain CSS 3D and one pointer listener; no extra libraries, so pages stay light on phones.
 */
export type Hero3DLook = "split" | "fan" | "ring";

export function Hero3D({ photos, look, label }: { photos: string[]; look: Hero3DLook; label?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 250);
    const el = box.current;
    if (!el || typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => clearTimeout(t);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--px", (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
      el.style.setProperty("--py", (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
    };
    const leave = () => { el.style.setProperty("--px", "0"); el.style.setProperty("--py", "0"); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { clearTimeout(t); el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, []);
  const list = photos.filter(Boolean);
  const n = look === "ring" ? Math.max(12, list.length) : Math.min(look === "split" ? 8 : 5, list.length);
  const cards = Array.from({ length: n }, (_, i) => list[i % list.length]);
  return (
    <div ref={box} className={`h3d h3d-${look}` + (open ? " open" : "")} role="img" aria-label={label || "Photos"}>
      <div className="h3d-stage">
        {cards.map((src, i) => {
          const style: Record<string, string | number> = { "--i": i, "--n": n };
          if (look === "split") {
            const side = i % 2 ? 1 : -1; const k = Math.floor(i / 2); const half = Math.ceil(n / 2);
            style["--side"] = side; style["--k"] = half > 1 ? k / (half - 1) - 0.5 : 0;
          }
          if (look === "fan") style["--o"] = i - (n - 1) / 2;
          return (
            <div key={i} className="h3d-card" style={style as React.CSSProperties}>
              <Img src={src} alt="" sizes="(min-width: 900px) 18vw, 40vw" eager={i < 3} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const SITE_CSS = `
.sp-nav{position:sticky;top:0;z-index:30;background:color-mix(in oklab,var(--bg) 88%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.sp-nav-in{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;max-width:1100px;margin:0 auto;padding:8px 16px}
.sp-nav-in::-webkit-scrollbar{display:none}
.sp-nav a{flex:none;padding:9px 16px;border-radius:999px;font:600 .92rem/1 var(--fb);color:var(--mu);text-decoration:none;transition:background .2s,color .2s}
.sp-nav a:hover{color:var(--tx);background:color-mix(in oklab,var(--tx) 6%,transparent)}
.sp-nav a[aria-current=page]{background:var(--ac);color:var(--on)}
.sp-band{padding:clamp(28px,6vw,56px) 0 clamp(8px,2vw,16px)}
.sp-band h1{font:800 clamp(2rem,6vw,3.4rem)/1.02 var(--fd);margin:0;color:var(--tx);letter-spacing:-.02em}
.sp-band p{margin:10px 0 0;color:var(--mu);max-width:52ch}
.sp-tiles{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
.sp-tile{position:relative;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:14px;border-radius:var(--rad,16px);background:var(--sf);border:1px solid var(--line);color:var(--tx);text-decoration:none;transition:transform .25s,box-shadow .25s}
.sp-tile:hover{transform:translateY(-3px);box-shadow:0 18px 40px -24px rgba(0,0,0,.45)}
.sp-tile .ph{width:64px;height:64px;border-radius:calc(var(--rad,16px)*.7);overflow:hidden;flex:none}
.sp-tile .ph img{width:100%;height:100%;object-fit:cover}
.sp-tile .tx{display:grid;gap:3px;min-width:0}
.sp-tile .tx b{font:700 1.05rem/1.2 var(--fh,var(--fd))}
.sp-tile .tx span{font-size:.86rem;color:var(--mu)}
.sp-tile .go{font-size:1.3rem;color:var(--ac);transition:transform .25s}
.sp-tile:hover .go{transform:translateX(4px)}
.h3d{--px:0;--py:0;container-type:inline-size;position:relative;width:100%;aspect-ratio:5/4;perspective:1100px;touch-action:pan-y}
.h3d-stage{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(calc(var(--py)*-8deg)) rotateY(calc(var(--px)*10deg));transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.h3d-card{position:absolute;left:50%;top:50%;overflow:hidden;border-radius:14px;background:var(--sf);box-shadow:0 22px 50px -22px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.06);will-change:transform}
.h3d-card img{width:100%;height:100%;object-fit:cover;display:block}
.h3d-split .h3d-card{width:24%;aspect-ratio:3/4;transform:translate(-50%,-50%) translateX(calc(var(--side)*var(--i)*2px)) rotate(calc(var(--side)*var(--i)*1.5deg));transition:transform 1.1s cubic-bezier(.2,.9,.2,1);transition-delay:calc(var(--i)*45ms)}
.h3d-split.open .h3d-card{transform:translate(-50%,-50%) translate3d(calc(var(--side)*(132% - var(--k)*var(--k)*40%) + var(--px)*var(--side)*24px),calc(var(--k)*150% + var(--py)*14px),calc(var(--k)*var(--k)*-120px)) rotateY(calc(var(--side)*-18deg)) rotate(calc(var(--side)*var(--k)*18deg))}
.h3d-split .h3d-card:hover{z-index:20}
.h3d-fan .h3d-card{width:36%;aspect-ratio:5/7;top:auto;bottom:6%;transform-origin:50% 120%;transform:translateX(-50%) rotate(0deg) scale(.9);transition:transform .9s cubic-bezier(.2,.9,.2,1);transition-delay:calc(var(--i)*60ms)}
.h3d-fan.open .h3d-card{transform:translateX(calc(-50% + var(--o)*38%)) translateY(calc(var(--o)*var(--o)*4%)) rotate(calc(var(--o)*9deg + var(--px)*6deg)) translateZ(calc(20px - var(--o)*var(--o)*8px))}
.h3d-fan.open .h3d-card:hover{transform:translateX(calc(-50% + var(--o)*38%)) translateY(-14%) rotate(calc(var(--o)*4deg)) scale(1.06);z-index:20;transition-delay:0s;transition-duration:.4s}
.h3d-ring{perspective:1000px;aspect-ratio:16/9}
.h3d-ring .h3d-stage{animation:h3d-spin 40s linear infinite;transform-style:preserve-3d}
.h3d-ring .h3d-card{width:22%;aspect-ratio:4/5;transform:translate(-50%,-50%) rotateY(calc(var(--i)*360deg/var(--n))) translateZ(calc(var(--n) * 3.9cqw));backface-visibility:hidden}
.h3d-ring:hover .h3d-stage{animation-play-state:paused}
@keyframes h3d-spin{from{transform:rotateX(-6deg) rotateY(0)}to{transform:rotateX(-6deg) rotateY(-360deg)}}
@media (prefers-reduced-motion:reduce){.h3d-ring .h3d-stage{animation:none}.h3d-card{transition:none!important}}
`;
