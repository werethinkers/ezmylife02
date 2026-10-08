import { useEffect, useState } from "react";
import type { RenderProps } from "../types";
import { themeVars } from "../themes";
import { DAYS, fill, fmtPhone, mapsDir, mapsLink, openStatus, priceText, t12, telHref, waTo } from "../util";
import { BASE_CSS, Icon, Img, LeadForm, MadeWith, resolveImg, useThemeFonts } from "../parts";

export default function Business({ product, theme, content: c, mode, slug }: RenderProps) {
  useThemeFonts(theme);
  const o = product.opts;
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 60000); return () => clearInterval(t); }, []);
  const vars = { ...c };
  const st = openStatus(c.open_days, c.opens, c.closes);
  const services = (Array.isArray(c.services) ? c.services : []).filter((s: { name?: string }) => s?.name);
  const team = (Array.isArray(c.team) ? c.team : []).filter((s: { name?: string }) => s?.name);
  const reviews = (Array.isArray(c.reviews) ? c.reviews : []).filter((r: { text?: string }) => r?.text);
  const gallery = (Array.isArray(c.gallery) ? c.gallery : []).filter((g: { photo?: string }) => g?.photo);
  const hero = gallery[0] ? resolveImg(gallery[0].photo, "hero") : null;
  const highlights: string[] = Array.isArray(c.highlights) ? c.highlights : [];
  const enquire = waTo(c.whatsapp, fill(product.whatsapp.enquire, vars));
  const place = [c.address, c.area, c.city].filter(Boolean).join(", ");
  const words = String(c.name || product.name).trim().split(/\s+/);
  const today = DAYS[(new Date().getDay() + 6) % 7];
  const openDays: string[] = Array.isArray(c.open_days) && c.open_days.length ? c.open_days : DAYS;

  return (
    <div className={"ipr ipr-biz" + (theme.dark ? " dark" : "")} style={themeVars(theme) as React.CSSProperties}>
      <style>{BASE_CSS + CSS}</style>
      <header className="biz-top">
        <div className="ip-wrap biz-top-in">
          <a className="biz-logo" href="#top">{c.logo ? <Img src={c.logo} alt="" className="lg" /> : <b>{words[0]?.[0] ?? "A"}</b>}<span>{c.name}</span></a>
          {st && <span className={"biz-st" + (st.open ? " open" : "")}><i />{st.label}</span>}
        </div>
      </header>

      <section className="biz-hero" id="top">
        {hero && <div className="biz-hero-ph" style={{ backgroundImage: `url(${hero})` }} aria-hidden="true" />}
        <span className="biz-mark" aria-hidden="true">{words[0]?.[0]}</span>
        <div className="ip-wrap biz-hero-in">
          {(c.area || c.city) && <p className="biz-eye">{[c.area, c.city].filter(Boolean).join(" · ")}</p>}
          <h1 className="biz-h1"><span className="a">{o.heroVerb}</span>{words.map((w, i) => <span key={i} className={i % 2 ? "c" : "b"}>{w}</span>)}</h1>
          {c.tagline && <p className="biz-tag">{c.tagline}</p>}
          <div className="biz-cta">
            {c.offer && <a className="ip-btn ip-primary" href="#lead">{c.offer}</a>}
            <a className="ip-btn ip-wa" href={enquire} target="_blank" rel="noopener noreferrer"><Icon.wa /> WhatsApp us</a>
          </div>
          {c.rating && <p className="biz-rate"><span className="stars"><Icon.star /></span><b>{c.rating}</b> on Google{c.reviews_count ? ` · ${c.reviews_count} reviews` : ""}</p>}
        </div>
      </section>

      {services.length > 0 && (
        <section className="biz-sec" id="services">
          <div className="ip-wrap">
            <p className="biz-label">{o.servicesTitle}</p>
            <div className="biz-svcs">
              {services.map((s: { name: string; price?: string; note?: string }, i: number) => (
                <article key={i} className={"svc" + (i === 1 && services.length > 2 ? " pop" : "")}>
                  <div className="svc-top"><h3>{s.name}</h3>{priceText(s.price) && <b>{priceText(s.price)}</b>}</div>
                  {s.note && <p>{s.note}</p>}
                  <a className="ip-btn ip-ghost" href={waTo(c.whatsapp, fill(product.whatsapp.service, { ...vars, item: s.name, price: priceText(s.price) || "price on request" }))} target="_blank" rel="noopener noreferrer"><Icon.wa /> Ask about this</a>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {highlights.length > 0 && (
        <section className="biz-sec">
          <div className="ip-wrap">
            <p className="biz-label">{o.highlightsTitle}</p>
            <ul className="biz-hl">{highlights.map((h) => <li key={h}><Icon.check />{h}</li>)}</ul>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="biz-sec">
          <div className="ip-wrap">
            <p className="biz-label">Take a look</p>
            <div className="biz-gal">{gallery.map((g: { photo: string; caption?: string }, i: number) => <figure key={i}><Img src={g.photo} alt={g.caption || `${c.name} photo ${i + 1}`} sampleKey={"g" + i} /></figure>)}</div>
          </div>
        </section>
      )}

      {team.length > 0 && (
        <section className="biz-sec">
          <div className="ip-wrap">
            <p className="biz-label">{o.teamTitle ?? "Team"}</p>
            <div className="biz-team">
              {team.map((m: { name: string; role?: string; photo?: string }, i: number) => {
                const ph = resolveImg(m.photo);
                return (
                  <div key={i} className="tm">
                    <span className="av" style={ph ? { backgroundImage: `url(${ph})` } : undefined} aria-hidden="true">{ph ? "" : m.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                    <div><b>{m.name}</b>{m.role && <span>{m.role}</span>}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="biz-sec">
          <div className="ip-wrap">
            <p className="biz-label">Reviews</p>
            <div className="biz-revs">{reviews.map((r: { name?: string; text: string }, i: number) => <figure key={i}><span className="stars" aria-label="5 stars">{[0, 1, 2, 3, 4].map((k) => <Icon.star key={k} />)}</span><blockquote>{r.text}</blockquote>{r.name && <figcaption>{r.name}</figcaption>}</figure>)}</div>
          </div>
        </section>
      )}

      <section className="biz-sec" id="find">
        <div className="ip-wrap biz-find">
          {c.opens && c.closes && (
            <div className="biz-hours">
              <p className="biz-label">Opening hours</p>
              {DAYS.map((d) => <div key={d} className={"hr" + (d === today ? " today" : "")}><span>{d}</span><span>{openDays.includes(d) ? `${t12(c.opens)} – ${t12(c.closes)}` : "Closed"}</span></div>)}
            </div>
          )}
          <div className="biz-loc">
            <p className="biz-label">Find us</p>
            {place && <p className="addr">{place}</p>}
            <div className="row">
              {place && <a className="ip-btn ip-ghost" href={c.maps_url ? mapsLink(c.maps_url, place) : mapsDir(place)} target="_blank" rel="noopener noreferrer"><Icon.nav /> Directions</a>}
              {c.phone && <a className="ip-btn ip-ghost" href={telHref(c.phone)}><Icon.phone /> {fmtPhone(c.phone)}</a>}
            </div>
          </div>
        </div>
      </section>

      {c.offer && (
        <section className="biz-sec" id="lead">
          <div className="ip-wrap">
            <div className="biz-lead">
              <div>
                <h2>{c.offer}</h2>
                {c.offer_note && <p>{c.offer_note}</p>}
              </div>
              <LeadForm slug={slug} mode={mode} kind="lead" button={o.leadButton} ownerWa={c.whatsapp} waTemplate={product.whatsapp.lead} vars={vars}
                messageLabel="Anything we should know? (optional)" context={{ offer: c.offer }}
                done={(n) => <p className="biz-thanks"><b>Done, {n.split(" ")[0]}.</b> {c.name} will call you soon.</p>} />
              <p className="ip-fine">By sending, you agree to be contacted by {c.name} about this request.</p>
            </div>
          </div>
        </section>
      )}

      <footer className="ip-wrap biz-foot">
        <p>© {new Date().getFullYear()} {c.name}{c.city ? ` · ${c.city}` : ""}</p>
        <MadeWith product={product} />
      </footer>

      <nav className="biz-bar ip-fixed" aria-label={`Contact ${c.name}`}>
        <a className="ip-btn ip-wa" href={enquire} target="_blank" rel="noopener noreferrer"><Icon.wa /> WhatsApp</a>
        {c.phone && <a className="ip-btn ip-ghost" href={telHref(c.phone)}><Icon.phone /> Call</a>}
        {c.offer ? <a className="ip-btn ip-primary" href="#lead">{o.bar}</a> : place && <a className="ip-btn ip-ghost" href={mapsDir(place)} target="_blank" rel="noopener noreferrer"><Icon.map /> Map</a>}
      </nav>
    </div>
  );
}

const CSS = `
.ipr-biz{padding-bottom:92px}
.biz-top{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 88%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.biz-top-in{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:60px}
.biz-logo{display:flex;align-items:center;gap:10px;text-decoration:none;min-width:0}
.biz-logo b{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:var(--tx);color:var(--bg);font:800 1.1rem/1 var(--fd);flex:none}
.biz-logo .lg{width:36px;height:36px;border-radius:10px;object-fit:cover}
.biz-logo span{font:800 1.02rem/1 var(--fd);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.biz-st{display:inline-flex;align-items:center;gap:8px;font:600 .8rem/1.2 var(--fb);color:var(--mu);white-space:nowrap}
.biz-st i{width:8px;height:8px;border-radius:50%;background:#E5484D;flex:none}
.biz-st.open i{background:#25D366;box-shadow:0 0 0 4px rgba(37,211,102,.18)}
.biz-hero{position:relative;overflow:hidden;padding-block:clamp(40px,9cqi,96px) clamp(36px,7cqi,72px);border-bottom:1px solid var(--line)}
.biz-hero-ph{position:absolute;inset:0;background-size:cover;background-position:center}
.biz-hero-ph::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,color-mix(in srgb,var(--bg) 50%,transparent),color-mix(in srgb,var(--bg) 92%,transparent) 70%,var(--bg))}
.biz-mark{position:absolute;right:-4%;top:-6%;font:900 clamp(16rem,60cqi,30rem)/1 var(--fd);color:transparent;-webkit-text-stroke:2px color-mix(in srgb,var(--ac) 45%,transparent);pointer-events:none;user-select:none}
.biz-hero-in{position:relative;display:grid;gap:18px}
.biz-eye{display:inline-flex;align-items:center;gap:10px;font:700 .74rem/1 var(--fb);letter-spacing:.16em;text-transform:uppercase;color:var(--ac);margin:0}
.biz-eye::before{content:"";width:22px;height:2px;background:var(--ac)}
.biz-h1{font-family:var(--fd);font-weight:900;margin:0;line-height:.9;letter-spacing:-.01em;text-wrap:balance;overflow-wrap:anywhere}
.biz-h1 .a{display:block;font-size:clamp(1.3rem,5.4cqi,2.2rem);color:var(--mu);font-weight:700}
.biz-h1 .b,.biz-h1 .c{display:inline;font-size:clamp(2.8rem,13cqi,6.4rem);margin-right:.22em}
.biz-h1 .c{color:transparent;-webkit-text-stroke:2px var(--tx)}
.ipr-biz:not(.dark) .biz-h1 .c{color:var(--ac);-webkit-text-stroke:0}
.biz-tag{font-size:clamp(1.02rem,3.8cqi,1.2rem);color:var(--mu);max-width:44ch;margin:0}
.biz-cta{display:flex;flex-wrap:wrap;gap:10px;max-width:560px}
.biz-cta .ip-btn{flex:1 1 13rem;border-radius:14px}
.biz-rate{display:flex;align-items:center;gap:8px;margin:0;font-size:.92rem;color:var(--mu)}
.biz-rate b{color:var(--tx);font-size:1.05rem}
.stars{display:inline-flex;gap:2px;color:#F2B01E}
.stars svg{width:18px;height:18px}
.biz-sec{padding-block:clamp(52px,9cqi,96px) 0}
.biz-label{font:800 clamp(1.7rem,7.5cqi,2.8rem)/1 var(--fd);margin:0 0 24px;text-wrap:balance}
.biz-svcs{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
@media (min-width:700px){.biz-svcs{grid-template-columns:repeat(2,minmax(0,1fr))}}
.svc{display:grid;gap:12px;align-content:start;padding:20px;border-radius:18px;background:var(--sf);box-shadow:inset 0 0 0 1px var(--line)}
.svc.pop{box-shadow:inset 0 0 0 2px var(--ac)}
.svc-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.svc h3{font:800 1.25rem/1.15 var(--fd);margin:0;min-width:0}
.svc b{font:800 1.3rem/1 var(--fd);color:var(--ac);white-space:nowrap}
.svc p{margin:0;color:var(--mu);font-size:.94rem}
.svc .ip-btn{min-height:48px;border-radius:12px;font-size:.92rem}
.biz-hl{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
@media (min-width:700px){.biz-hl{grid-template-columns:repeat(3,minmax(0,1fr))}}
.biz-hl li{display:flex;align-items:center;gap:10px;padding:14px;border-radius:14px;background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);font-weight:600;font-size:.94rem;min-width:0}
.biz-hl svg{flex:none;color:var(--ac)}
.biz-gal{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.biz-gal figure{margin:0;border-radius:14px;overflow:hidden;background:var(--sf);aspect-ratio:4/5}
.biz-gal figure:first-child{grid-column:1/-1;aspect-ratio:16/10}
.biz-gal img{width:100%;height:100%;object-fit:cover}
.biz-team{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
@media (min-width:700px){.biz-team{grid-template-columns:repeat(2,minmax(0,1fr))}}
.tm{display:flex;gap:14px;align-items:center;padding:14px;border-radius:16px;background:var(--sf);box-shadow:inset 0 0 0 1px var(--line)}
.tm .av{flex:none;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:var(--ac);color:var(--on);font:800 1.1rem/1 var(--fd);background-size:cover;background-position:center}
.tm b{display:block}
.tm span{display:block;color:var(--mu);font-size:.9rem}
.biz-revs{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
@media (min-width:760px){.biz-revs{grid-template-columns:repeat(3,minmax(0,1fr))}}
.biz-revs figure{margin:0;padding:18px;border-radius:16px;background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);display:grid;gap:10px;align-content:start}
.biz-revs blockquote{margin:0;color:var(--tx)}
.biz-revs figcaption{font-weight:700;font-size:.9rem;color:var(--mu)}
.biz-find{display:grid;gap:28px}
@media (min-width:760px){.biz-find{grid-template-columns:repeat(2,minmax(0,1fr))}}
.biz-hours .biz-label,.biz-loc .biz-label{font-size:clamp(1.4rem,6cqi,2rem)}
.hr{display:flex;justify-content:space-between;gap:12px;padding-block:11px;border-top:1px solid var(--line);font-size:.95rem;font-variant-numeric:tabular-nums}
.hr.today{font-weight:800}
.hr.today span:first-child::after{content:"Today";margin-left:8px;font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;background:var(--tx);color:var(--bg);padding:3px 6px;border-radius:5px;vertical-align:2px}
.biz-loc .addr{margin:0 0 14px;font-size:1.05rem}
.biz-loc .row{display:flex;flex-wrap:wrap;gap:10px}
.biz-loc .ip-btn{flex:1 1 11rem;border-radius:14px}
.biz-lead{display:grid;gap:18px;padding:28px clamp(18px,5cqi,34px);border-radius:22px;background:var(--tx);color:var(--bg)}
.biz-lead h2{font:900 clamp(1.9rem,8cqi,2.8rem)/1 var(--fd);margin:0;text-wrap:balance}
.biz-lead p{margin:8px 0 0;opacity:.8}
.biz-lead .ip-field{color:color-mix(in srgb,var(--bg) 70%,transparent)}
.biz-lead .ip-field input,.biz-lead .ip-field select,.biz-lead .ip-field textarea{background:var(--bg);color:var(--tx);border-color:transparent}
.biz-lead .ip-primary{background:var(--ac);color:var(--on)}
.biz-lead .ip-fine{color:color-mix(in srgb,var(--bg) 65%,transparent)}
.biz-thanks{font-size:1.1rem;margin:0}
.biz-foot{display:grid;gap:8px;padding-block:56px 20px;color:var(--mu);font-size:.85rem;text-align:center}
.biz-bar{left:0;right:0;bottom:0;z-index:40;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:8px;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));background:color-mix(in srgb,var(--bg) 90%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-top:1px solid var(--line)}
.biz-bar .ip-btn{min-height:54px;padding:0 .5em;font-size:.92rem;border-radius:14px}
@media (min-width:760px){.biz-bar{left:50%;right:auto;transform:translateX(-50%);bottom:16px;width:min(560px,calc(100% - 32px));border:1px solid var(--line);border-radius:20px;padding:8px}}
`;
