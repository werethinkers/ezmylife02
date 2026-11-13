import { useMemo, useState } from "react";
import type { RenderProps } from "../types";
import { themeVars } from "../themes";
import { fill, inr, mapsDir, mapsLink, openStatus, priceText, telHref, waTo } from "../util";
import { BASE_CSS, Icon, Img, MadeWith, fitWords, resolveImg, useThemeFonts } from "../parts";
import { coverFor, isStock } from "../stock";
import { Backdrop, SIG_CSS, sigClass, usePointerFx } from "../signature";

type Item = { category?: string; name: string; price?: string; desc?: string; diet?: string; photo?: string };
const num = (p?: string) => { const n = Number(String(p ?? "").replace(/[^\d.]/g, "")); return Number.isFinite(n) && /^\s*[₹]?\s*[\d,]+(\.\d+)?\s*$/.test(String(p ?? "")) ? n : null; };

export default function Menu({ product, theme, content: c }: RenderProps) {
  useThemeFonts(theme);
  const o = product.opts;
  const items: Item[] = (Array.isArray(c.items) ? c.items : []).filter((i: Item) => i?.name);
  const cats = useMemo(() => { const seen: string[] = []; items.forEach((i) => { const k = i.category || "Menu"; if (!seen.includes(k)) seen.push(k); }); return seen; }, [items]);
  const [cat, setCat] = useState<string | null>(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [sheet, setSheet] = useState(false);
  const [name, setName] = useState("");
  const st = openStatus(c.open_days, c.opens, c.closes);
  const cover = resolveImg(c.cover) ? c.cover : coverFor(product.id);
  const sty = theme.s;
  const prime = sty === "prime";
  const fxRef = usePointerFx<HTMLDivElement>();
  const place = [c.address].filter(Boolean).join(", ");
  const vars = { ...c };

  const add = (i: number, d: number) => setCart((x) => { const n = Math.max(0, (x[i] ?? 0) + d); const y = { ...x }; if (n) y[i] = n; else delete y[i]; return y; });
  const lines = Object.entries(cart).map(([i, q]) => ({ item: items[+i], q }));
  const count = lines.reduce((a, l) => a + l.q, 0);
  const total = lines.reduce((a, l) => a + (num(l.item.price) ?? 0) * l.q, 0);
  const hasUnpriced = lines.some((l) => num(l.item.price) == null);
  const orderText = fill(product.whatsapp.order, { ...vars, lead_name: name, lines: lines.map((l) => `${l.q} × ${l.item.name}${num(l.item.price) != null ? ` (${inr(num(l.item.price)! * l.q)})` : ""}`).join("\n"), total: total ? inr(total) + (hasUnpriced ? " + items on request" : "") : "to be confirmed" });
  const shown = items.map((it, i) => ({ it, i })).filter(({ it }) => (!cat || (it.category || "Menu") === cat) && (!vegOnly || ["Veg", "Jain"].includes(it.diet || "")));

  return (
    <div className={`ipr ipr-menu s-${sty}` + (theme.dark ? " dark" : "") + sigClass(product.id, prime)} style={themeVars(theme) as React.CSSProperties}>
      <style>{BASE_CSS + CSS + SIG_CSS}</style>
      <div className="mn-page" ref={fxRef}>
      <header className={"mn-head" + (prime ? " sig-hero" : "")}>
        {prime && <Backdrop id={product.id} />}
        {sty === "photo" && cover && <div className="mn-bg" aria-hidden="true"><Img src={cover} alt="" sizes="100vw" eager /></div>}
        <div className="ip-wrap mn-head-in">
          <div className="mn-copy">
            {resolveImg(c.logo) && <Img src={c.logo} alt="" className="mn-logo" eager sizes="80px" />}
            <p className="mn-eye">{o.noun}</p>
            <h1 className={"mn-h" + (prime ? " sig-h" : "")} style={fitWords(String(c.name ?? ""))}>{c.name}</h1>
            {c.tagline && <p className="mn-tag">{c.tagline}</p>}
            <p className="mn-meta">{st && <span className={"st" + (st.open ? " open" : "")}><i />{st.label}</span>}{c.area && <span>{c.area}</span>}</p>
            <div className="mn-acts">
              {c.whatsapp && <a className="ip-btn ip-wa" href={waTo(c.whatsapp, fill(product.whatsapp.enquire, vars))} target="_blank" rel="noopener noreferrer"><Icon.wa /> WhatsApp</a>}
              {c.phone && <a className="ip-btn ip-ghost" href={telHref(c.phone)}><Icon.phone /> Call</a>}
              {place && <a className="ip-btn ip-ghost" href={c.maps_url ? mapsLink(c.maps_url, place) : mapsDir(place)} target="_blank" rel="noopener noreferrer"><Icon.nav /> Directions</a>}
            </div>
            {c.order_note && <p className="mn-note">{c.order_note}</p>}
          </div>
          {sty !== "photo" && cover && <div className="mn-media" aria-hidden="true"><Img src={cover} alt="" sizes="(min-width: 860px) 45vw, 100vw" eager /></div>}
        </div>
      </header>

      <nav className="mn-tabs" aria-label="Categories">
        <div className="mn-tabs-in">
          <button type="button" aria-pressed={!cat} onClick={() => setCat(null)}>All</button>
          {cats.map((k) => <button key={k} type="button" aria-pressed={cat === k} onClick={() => setCat(k)}>{k}</button>)}
          {o.diet && <button type="button" className="veg" aria-pressed={vegOnly} onClick={() => setVegOnly((v) => !v)}><i className="dm veg" />Veg only</button>}
        </div>
      </nav>

      <main className="ip-wrap mn-list">
        {cats.filter((k) => !cat || k === cat).map((k) => {
          const group = shown.filter(({ it }) => (it.category || "Menu") === k);
          if (!group.length) return null;
          return (
            <section key={k} className="mn-cat">
              <h2><span>{k}</span></h2>
              {group.map(({ it, i }) => {
                const q = cart[i] ?? 0; const ph = resolveImg(it.photo);
                return (
                  <article key={i} className={"mn-item" + (ph ? " ph" : "") + (prime ? " sig-fx" : "")}>
                    <div className="txt">
                      {o.diet && it.diet && <span className={"dm " + it.diet.toLowerCase().replace(/[^a-z]/g, "")} title={it.diet} aria-label={it.diet} />}
                      <h3>{it.name}</h3>
                      {priceText(it.price) && <b className="pr">{priceText(it.price)}</b>}
                      {it.desc && <p>{it.desc}</p>}
                    </div>
                    <div className="side">
                      {ph && <Img src={ph} alt={it.name} sizes="120px" />}
                      {o.cart ? (
                        q ? (
                          <div className="qty"><button type="button" onClick={() => add(i, -1)} aria-label={`Remove one ${it.name}`}><Icon.minus /></button><b>{q}</b><button type="button" onClick={() => add(i, 1)} aria-label={`Add one ${it.name}`}><Icon.plus /></button></div>
                        ) : <button type="button" className="addb" onClick={() => add(i, 1)}>Add</button>
                      ) : (
                        <a className="addb" href={waTo(c.whatsapp, fill(product.whatsapp.item, { ...vars, item: it.name }))} target="_blank" rel="noopener noreferrer">Enquire</a>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
        {(isStock(cover) || items.some((it) => isStock(it.photo))) && <p className="mn-cr">Some photos from <a href="https://unsplash.com/?utm_source=ezyourlife&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a></p>}
        <MadeWith product={product} />
      </main>
      </div>

      {o.cart && count > 0 && (
        <div className="mn-cart ip-fixed">
          <button type="button" className="ip-btn ip-primary" onClick={() => setSheet(true)}>
            <Icon.bag /> {count} item{count === 1 ? "" : "s"}{total ? ` · ${inr(total)}` : ""} <span className="go">Review order</span>
          </button>
        </div>
      )}

      {sheet && (
        <div className="mn-sheet ip-fixed" role="dialog" aria-modal="true" aria-label="Your order" onClick={(e) => e.target === e.currentTarget && setSheet(false)}>
          <div className="mn-sheet-p">
            <div className="hd"><h2>Your order</h2><button type="button" className="x" onClick={() => setSheet(false)} aria-label="Close">×</button></div>
            <ul>{lines.map(({ item, q }) => <li key={item.name}><span>{q} × {item.name}</span><b>{num(item.price) != null ? inr(num(item.price)! * q) : priceText(item.price)}</b></li>)}</ul>
            <p className="tot"><span>Total</span><b>{total ? inr(total) : "On confirmation"}</b></p>
            <label className="ip-field"><span>Your name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
            <a className="ip-btn ip-wa" href={waTo(c.whatsapp, orderText)} target="_blank" rel="noopener noreferrer"><Icon.wa /> Send order on WhatsApp</a>
            <p className="ip-fine">WhatsApp opens with your order written out. Add your address or table number and press send.</p>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
.ipr-menu{--rad:16px;--hmax:4.6rem;padding-bottom:96px}
.ipr-menu.s-editorial{--rad:4px}.ipr-menu.s-soft{--rad:26px}.ipr-menu.s-minimal{--rad:2px}
.ipr-menu .ip-wrap{max-width:1100px;width:100%}
.mn-page{container:page/inline-size}
.mn-head{position:relative;overflow:hidden;padding-block:clamp(32px,7cqi,80px) 28px}
.mn-head-in{position:relative;display:grid;gap:clamp(22px,5cqi,44px);align-items:center}
.mn-copy{display:grid;justify-items:center;text-align:center;gap:10px;container-type:inline-size;width:100%;min-width:0}
.mn-logo{width:76px;height:76px;border-radius:20px;object-fit:contain;background:#fff;padding:4px;box-shadow:0 10px 24px -12px rgba(0,0,0,.5)}
.mn-eye{font:700 .74rem/1 var(--fb);letter-spacing:.2em;text-transform:uppercase;color:var(--ac);margin:0}
.mn-h{font:900 min(var(--hmax),calc(118cqi / var(--fit)),14cqi)/.98 var(--fd);margin:0;text-wrap:balance;color:var(--tx);overflow-wrap:normal}
.mn-tag{margin:0;color:var(--mu);font-size:1.05rem;max-width:36ch}
.mn-meta{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 16px;margin:2px 0 0;font-size:.88rem;color:var(--mu)}
.mn-meta .st{display:inline-flex;align-items:center;gap:7px;font-weight:600}
.mn-meta .st i{width:8px;height:8px;border-radius:50%;background:#E5484D}
.mn-meta .st.open i{background:#25D366}
.mn-acts{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:8px;width:100%}
.mn-acts .ip-btn{flex:1 1 8rem;max-width:210px;min-height:48px;font-size:.92rem;border-radius:calc(var(--rad) * .8 + 4px)}
.mn-note{margin:6px 0 0;padding:10px 14px;border-radius:calc(var(--rad) * .75);background:var(--sf);font-size:.88rem;color:var(--mu);box-shadow:inset 0 0 0 1px var(--line);max-width:52ch}
.mn-media{position:relative;border-radius:var(--rad);overflow:hidden;aspect-ratio:16/10;background:var(--sf);box-shadow:0 30px 60px -32px rgba(0,0,0,.5)}
.mn-media img{width:100%;height:100%;object-fit:cover}
@container page (min-width:860px){
  .mn-head-in{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  .mn-copy{justify-items:start;text-align:left}
  .mn-meta,.mn-acts{justify-content:flex-start}
  .mn-media{aspect-ratio:5/4}
}
/* photo: the cover fills the header */
.s-photo .mn-head{min-height:min(calc(var(--ip-vh,100svh) * .72),640px);display:grid;align-items:end;padding-top:110px}
.s-photo .mn-bg{position:absolute;inset:0}
.s-photo .mn-bg img{width:100%;height:100%;object-fit:cover}
.s-photo .mn-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,.45) 45%,color-mix(in srgb,var(--bg) 96%,transparent) 100%)}
.s-photo .mn-head-in{grid-template-columns:minmax(0,1fr)!important}
.s-photo .mn-copy{justify-items:center!important;text-align:center!important}
.s-photo .mn-acts,.s-photo .mn-meta{justify-content:center!important}
.s-photo:not(.dark) .mn-h,.s-photo:not(.dark) .mn-tag{color:#fff;text-shadow:0 2px 20px rgba(0,0,0,.4)}
/* bold: cover as a tilted card */
.s-bold .mn-media{transform:rotate(-1.5deg);box-shadow:10px 10px 0 var(--ac2)}
/* editorial: classic printed menu, framed cover */
.s-editorial .mn-head-in{grid-template-columns:minmax(0,1fr)!important}
.s-editorial .mn-copy{justify-items:center!important;text-align:center!important}
.s-editorial .mn-acts,.s-editorial .mn-meta{justify-content:center!important}
.s-editorial .mn-h{font-weight:500}
.s-editorial .mn-media{width:min(100%,720px);justify-self:center;aspect-ratio:16/9;box-shadow:0 0 0 8px var(--bg),0 0 0 9px var(--line)}
.s-editorial .mn-cat h2{text-align:center;font-weight:500}
.s-editorial .mn-cat h2 span{padding-inline:14px;background:var(--bg);position:relative}
.s-editorial .mn-cat h2::before{content:"";position:absolute;left:0;right:0;top:50%;border-top:1px solid var(--line)}
/* soft: rounded blob cover */
.s-soft .mn-head{background:radial-gradient(60% 50% at 85% 0%,color-mix(in srgb,var(--ac2) 30%,transparent),transparent 70%)}
.s-soft .mn-media{border-radius:42% 58% 50% 50%/50% 46% 54% 50%;aspect-ratio:1;max-width:460px;justify-self:center;width:100%}
.s-soft .mn-h{font-weight:500}
.s-soft .mn-tabs button{border-radius:999px}
/* minimal: left aligned, hairlines */
.s-minimal .mn-copy{justify-items:start!important;text-align:left!important}
.s-minimal .mn-acts,.s-minimal .mn-meta{justify-content:flex-start!important}
.s-minimal .mn-head-in{grid-template-columns:minmax(0,1fr)!important}
.s-minimal .mn-media{aspect-ratio:21/9;box-shadow:none}
.s-minimal .mn-h{letter-spacing:-.03em;font-weight:700}
/* split: cover first on phones */
.s-split .mn-media{order:-1}
@container page (min-width:860px){.s-split .mn-media{order:0}}

.mn-tabs{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 92%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-block:1px solid var(--line)}
.mn-tabs-in{display:flex;gap:8px;overflow-x:auto;padding:10px clamp(16px,5cqi,40px);max-width:1100px;margin:0 auto;scrollbar-width:none}
.mn-tabs-in::-webkit-scrollbar{display:none}
.mn-tabs button{flex:none;appearance:none;border:1.5px solid var(--line);background:transparent;color:var(--tx);border-radius:calc(var(--rad) * .6 + 6px);padding:9px 14px;font:600 .88rem/1 var(--fb);cursor:pointer;display:inline-flex;align-items:center;gap:7px}
.mn-tabs button[aria-pressed="true"]{background:var(--tx);color:var(--bg);border-color:var(--tx)}
.mn-list{padding-top:8px}
.mn-cat{display:grid;column-gap:40px}
@container page (min-width:760px){.mn-cat{grid-template-columns:repeat(2,minmax(0,1fr))}.mn-cat h2{grid-column:1/-1}}
.mn-cat h2{font:800 clamp(1.5rem,6.4cqi,2.3rem)/1 var(--fd);margin:38px 0 6px;color:var(--ac);position:relative}
.mn-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;padding-block:16px;border-bottom:1px dashed var(--line);align-items:start}
.mn-item .txt{min-width:0;display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:8px;align-items:baseline}
.mn-item h3{font:700 1.06rem/1.3 var(--fb);margin:0;grid-column:2}
.mn-item .txt>.dm{grid-column:1;transform:translateY(2px)}
.mn-item .pr{grid-column:2;font:700 1rem/1.4 var(--fb);color:var(--tx)}
.mn-item p{grid-column:2;margin:4px 0 0;color:var(--mu);font-size:.9rem}
.mn-item .txt>h3:first-child,.mn-item .txt>h3:first-child~*{grid-column:1/-1}
.mn-item .side{display:grid;justify-items:center;gap:8px}
.mn-item .side img{width:104px;height:104px;border-radius:calc(var(--rad) * .8);object-fit:cover;box-shadow:0 10px 20px -12px rgba(0,0,0,.45)}
.mn-item.ph .side{margin-top:-2px}
.mn-item.ph .addb,.mn-item.ph .qty{margin-top:-22px;box-shadow:0 6px 14px -6px rgba(0,0,0,.4)}
.s-editorial .mn-item .pr{color:var(--ac)}
.s-minimal .mn-item{border-bottom-style:solid}
.addb{appearance:none;border:1.5px solid var(--ac);background:var(--sf);color:var(--ac);border-radius:calc(var(--rad) * .6 + 2px);padding:9px 18px;font:800 .9rem/1 var(--fb);cursor:pointer;text-decoration:none;min-width:84px;text-align:center;position:relative;z-index:1}
.qty{display:flex;align-items:center;gap:6px;border-radius:10px;background:var(--ac);color:var(--on);padding:4px;position:relative;z-index:1}
.qty button{appearance:none;border:0;background:transparent;color:inherit;width:32px;height:32px;display:grid;place-items:center;cursor:pointer}
.qty svg{width:16px;height:16px}
.qty b{min-width:18px;text-align:center}
.dm{display:inline-block;width:14px;height:14px;border:1.5px solid #1E8E3E;border-radius:3px;position:relative;flex:none;background:#fff}
.dm::after{content:"";position:absolute;inset:2.5px;border-radius:50%;background:#1E8E3E}
.dm.nonveg{border-color:#B3261E}.dm.nonveg::after{background:#B3261E;border-radius:0;clip-path:polygon(50% 0,100% 100%,0 100%)}
.dm.egg{border-color:#E0A100}.dm.egg::after{background:#E0A100}
.dm.jain{border-color:#E7811F}.dm.jain::after{background:#E7811F}
.mn-cr{margin:28px 0 0;text-align:center;font-size:.8rem;color:var(--mu)}
.mn-cr a{color:inherit}
.mn-cart{left:0;right:0;bottom:0;z-index:40;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px))}
.mn-cart .ip-btn{width:100%;max-width:560px;margin:0 auto;display:flex;justify-content:flex-start;border-radius:16px;box-shadow:0 14px 30px -12px rgba(0,0,0,.5)}
.mn-cart .go{margin-left:auto;font-size:.9rem;opacity:.85}
.mn-sheet{inset:0;z-index:60;display:grid;align-items:end;justify-items:center;background:rgba(0,0,0,.55)}
.mn-sheet-p{width:min(100%,520px);max-height:88%;overflow:auto;background:var(--bg);border-radius:22px 22px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom,0px));display:grid;gap:14px}
@media (min-width:760px){.mn-sheet{align-items:center}.mn-sheet-p{border-radius:22px}}
.mn-sheet .hd{display:flex;justify-content:space-between;align-items:center}
.mn-sheet h2{font:800 1.5rem/1 var(--fd);margin:0}
.mn-sheet .x{appearance:none;border:0;background:var(--sf);color:var(--tx);width:40px;height:40px;border-radius:50%;font-size:1.3rem;cursor:pointer}
.mn-sheet ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.mn-sheet li,.mn-sheet .tot{display:flex;justify-content:space-between;gap:12px;font-variant-numeric:tabular-nums}
.mn-sheet .tot{margin:0;padding-top:10px;border-top:1px solid var(--line);font-size:1.1rem}
/* prime ("Signature"): a backdrop per design behind the header, the dishes as cards that light up or lean
   under the finger, two columns on wide screens, and round category chips on one swiping line. */
.ipr-menu.s-prime{--rad:20px}
.s-prime .mn-media{border-radius:26px;aspect-ratio:16/11;box-shadow:0 0 0 1px var(--line),0 30px 60px -30px rgba(0,0,0,.55)}
@container page (min-width:860px){.s-prime .mn-head-in{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.s-prime .mn-copy{justify-items:start;text-align:left}}
.s-prime .mn-acts .ip-btn{border-radius:999px}
.s-prime .mn-tabs button{border-radius:999px}
.s-prime .mn-cat{gap:10px}
.s-prime .mn-cat h2{margin:36px 0 4px}
.s-prime .mn-item{padding:16px;border:0;border-radius:var(--rad);background-color:var(--sf);box-shadow:inset 0 0 0 1px var(--line)}
@container page (min-width:760px){.s-prime .mn-cat{grid-template-columns:repeat(2,minmax(0,1fr))}.s-prime .mn-cat h2{grid-column:1/-1}}
`;
