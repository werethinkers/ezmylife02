import { useMemo, useState } from "react";
import type { RenderProps } from "../types";
import { themeVars } from "../themes";
import { fill, inr, mapsDir, mapsLink, openStatus, priceText, telHref, waTo } from "../util";
import { BASE_CSS, Icon, Img, MadeWith, resolveImg, useThemeFonts } from "../parts";

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
  const cover = resolveImg(c.cover);
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
    <div className={"ipr ipr-menu" + (theme.dark ? " dark" : "")} style={themeVars(theme) as React.CSSProperties}>
      <style>{BASE_CSS + CSS}</style>
      <header className="mn-head">
        {cover && <div className="mn-cover" style={{ backgroundImage: `url(${cover})` }} aria-hidden="true" />}
        <div className="ip-wrap mn-head-in">
          {c.logo && <Img src={c.logo} alt="" className="mn-logo" />}
          <p className="mn-eye">{o.noun}</p>
          <h1 className="mn-h">{c.name}</h1>
          {c.tagline && <p className="mn-tag">{c.tagline}</p>}
          <p className="mn-meta">{st && <span className={"st" + (st.open ? " open" : "")}><i />{st.label}</span>}{c.area && <span>{c.area}</span>}</p>
          <div className="mn-acts">
            {c.whatsapp && <a className="ip-btn ip-wa" href={waTo(c.whatsapp, fill(product.whatsapp.enquire, vars))} target="_blank" rel="noopener noreferrer"><Icon.wa /> WhatsApp</a>}
            {c.phone && <a className="ip-btn ip-ghost" href={telHref(c.phone)}><Icon.phone /> Call</a>}
            {place && <a className="ip-btn ip-ghost" href={c.maps_url ? mapsLink(c.maps_url, place) : mapsDir(place)} target="_blank" rel="noopener noreferrer"><Icon.nav /> Directions</a>}
          </div>
          {c.order_note && <p className="mn-note">{c.order_note}</p>}
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
              <h2>{k}</h2>
              {group.map(({ it, i }) => {
                const q = cart[i] ?? 0; const ph = resolveImg(it.photo);
                return (
                  <article key={i} className="mn-item">
                    <div className="txt">
                      {o.diet && it.diet && <span className={"dm " + it.diet.toLowerCase().replace(/[^a-z]/g, "")} title={it.diet} aria-label={it.diet} />}
                      <h3>{it.name}</h3>
                      {priceText(it.price) && <b className="pr">{priceText(it.price)}</b>}
                      {it.desc && <p>{it.desc}</p>}
                    </div>
                    <div className="side">
                      {ph && <img src={ph} alt="" loading="lazy" />}
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
        <MadeWith product={product} />
      </main>

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
.ipr-menu{padding-bottom:96px}
.mn-head{position:relative;overflow:hidden;padding-block:clamp(36px,8cqi,80px) 28px;text-align:center}
.mn-cover{position:absolute;inset:0;background-size:cover;background-position:center}
.mn-cover::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,color-mix(in srgb,var(--bg) 55%,transparent),var(--bg) 92%)}
.mn-head-in{position:relative;display:grid;justify-items:center;gap:10px}
.mn-logo{width:72px;height:72px;border-radius:20px;object-fit:cover;box-shadow:0 10px 24px -12px rgba(0,0,0,.5)}
.mn-eye{font:700 .74rem/1 var(--fb);letter-spacing:.2em;text-transform:uppercase;color:var(--ac2);margin:0}
.mn-h{font:900 clamp(2.4rem,11cqi,4.4rem)/.95 var(--fd);margin:0;text-wrap:balance;color:var(--tx)}
.mn-tag{margin:0;color:var(--mu);font-size:1.05rem;max-width:34ch}
.mn-meta{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 16px;margin:2px 0 0;font-size:.88rem;color:var(--mu)}
.mn-meta .st{display:inline-flex;align-items:center;gap:7px;font-weight:600}
.mn-meta .st i{width:8px;height:8px;border-radius:50%;background:#E5484D}
.mn-meta .st.open i{background:#25D366}
.mn-acts{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:8px;width:100%}
.mn-acts .ip-btn{flex:1 1 8rem;max-width:200px;min-height:48px;font-size:.92rem}
.mn-note{margin:6px 0 0;padding:10px 14px;border-radius:12px;background:var(--sf);font-size:.88rem;color:var(--mu);box-shadow:inset 0 0 0 1px var(--line)}
.mn-tabs{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 92%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-block:1px solid var(--line)}
.mn-tabs-in{display:flex;gap:8px;overflow-x:auto;padding:10px clamp(16px,5cqi,40px);max-width:760px;margin:0 auto;scrollbar-width:none}
.mn-tabs-in::-webkit-scrollbar{display:none}
.mn-tabs button{flex:none;appearance:none;border:1.5px solid var(--line);background:transparent;color:var(--tx);border-radius:999px;padding:9px 14px;font:600 .88rem/1 var(--fb);cursor:pointer;display:inline-flex;align-items:center;gap:7px}
.mn-tabs button[aria-pressed="true"]{background:var(--tx);color:var(--bg);border-color:var(--tx)}
.mn-list{padding-top:8px}
.mn-cat h2{font:800 clamp(1.5rem,6.4cqi,2.1rem)/1 var(--fd);margin:34px 0 6px;color:var(--ac)}
.mn-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;padding-block:16px;border-bottom:1px dashed var(--line);align-items:start}
.mn-item .txt{min-width:0;display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:8px;align-items:baseline}
.mn-item h3{font:700 1.06rem/1.3 var(--fb);margin:0;grid-column:2}
.mn-item .txt>.dm{grid-column:1;transform:translateY(2px)}
.mn-item .pr{grid-column:2;font:700 1rem/1.4 var(--fb);color:var(--tx)}
.mn-item p{grid-column:2;margin:4px 0 0;color:var(--mu);font-size:.9rem}
.mn-item .txt>h3:first-child,.mn-item .txt>h3:first-child~*{grid-column:1/-1}
.mn-item .side{display:grid;justify-items:center;gap:8px}
.mn-item .side img{width:92px;height:92px;border-radius:14px;object-fit:cover}
.addb{appearance:none;border:1.5px solid var(--ac);background:var(--sf);color:var(--ac);border-radius:10px;padding:9px 18px;font:800 .9rem/1 var(--fb);cursor:pointer;text-decoration:none;min-width:84px;text-align:center}
.qty{display:flex;align-items:center;gap:6px;border-radius:10px;background:var(--ac);color:var(--on);padding:4px}
.qty button{appearance:none;border:0;background:transparent;color:inherit;width:32px;height:32px;display:grid;place-items:center;cursor:pointer}
.qty svg{width:16px;height:16px}
.qty b{min-width:18px;text-align:center}
.dm{display:inline-block;width:14px;height:14px;border:1.5px solid #1E8E3E;border-radius:3px;position:relative;flex:none}
.dm::after{content:"";position:absolute;inset:2.5px;border-radius:50%;background:#1E8E3E}
.dm.nonveg{border-color:#B3261E}.dm.nonveg::after{background:#B3261E;border-radius:0;clip-path:polygon(50% 0,100% 100%,0 100%)}
.dm.egg{border-color:#E0A100}.dm.egg::after{background:#E0A100}
.dm.jain{border-color:#E7811F}.dm.jain::after{background:#E7811F}
.mn-cart{left:0;right:0;bottom:0;z-index:40;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px))}
.mn-cart .ip-btn{width:100%;max-width:560px;margin:0 auto;display:flex;justify-content:flex-start;border-radius:16px;box-shadow:0 14px 30px -12px rgba(0,0,0,.5)}
.mn-cart .go{margin-left:auto;font-size:.9rem;opacity:.85}
.mn-sheet{inset:0;z-index:60;display:grid;align-items:end;justify-items:center;background:rgba(0,0,0,.55)}
.mn-sheet-p{width:min(100%,520px);max-height:88%;overflow:auto;background:var(--bg);border-radius:22px 22px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom,0px));display:grid;gap:14px}
.mn-sheet .hd{display:flex;justify-content:space-between;align-items:center}
.mn-sheet h2{font:800 1.5rem/1 var(--fd);margin:0}
.mn-sheet .x{appearance:none;border:0;background:var(--sf);color:var(--tx);width:40px;height:40px;border-radius:50%;font-size:1.3rem;cursor:pointer}
.mn-sheet ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.mn-sheet li,.mn-sheet .tot{display:flex;justify-content:space-between;gap:12px;font-variant-numeric:tabular-nums}
.mn-sheet .tot{margin:0;padding-top:10px;border-top:1px solid var(--line);font-size:1.1rem}
`;
