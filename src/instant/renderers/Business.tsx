import { useEffect, useState } from "react";
import type { RenderProps } from "../types";
import { themeVars } from "../themes";
import { DAYS, fill, fmtPhone, mapsDir, mapsLink, openStatus, priceText, t12, telHref, waTo } from "../util";
import { BASE_CSS, Gallery, Icon, Img, LeadForm, MadeWith, fitWords, resolveImg, useRevealBar, useThemeFonts } from "../parts";
import { coverFor, isStock } from "../stock";

export default function Business({ product, theme, content: c, mode, slug }: RenderProps) {
  useThemeFonts(theme);
  const o = product.opts;
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 60000); return () => clearInterval(t); }, []);
  const bar = useRevealBar<HTMLDivElement>();
  const vars = { ...c };
  const st = openStatus(c.open_days, c.opens, c.closes);
  const services = (Array.isArray(c.services) ? c.services : []).filter((s: { name?: string }) => s?.name);
  const team = (Array.isArray(c.team) ? c.team : []).filter((s: { name?: string }) => s?.name);
  const reviews = (Array.isArray(c.reviews) ? c.reviews : []).filter((r: { text?: string }) => r?.text);
  const gallery = (Array.isArray(c.gallery) ? c.gallery : []).filter((g: { photo?: string }) => resolveImg(g?.photo));
  // Cover: the owner's cover photo, else their first own gallery photo, else the product's stock photo.
  const own = gallery.find((g: { photo: string }) => !isStock(g.photo));
  const cover = resolveImg(c.cover) ? c.cover : own ? own.photo : coverFor(product.id);
  const highlights: string[] = Array.isArray(c.highlights) ? c.highlights : [];
  const enquire = waTo(c.whatsapp, fill(product.whatsapp.enquire, vars));
  const place = [c.address, c.area, c.city].filter(Boolean).join(", ");
  const name = String(c.name || product.name).trim();
  const words = name.split(/\s+/);
  const today = DAYS[(new Date().getDay() + 6) % 7];
  const openDays: string[] = Array.isArray(c.open_days) && c.open_days.length ? c.open_days : DAYS;
  const s = theme.s;
  const usesStock = isStock(cover) || gallery.some((g: { photo: string }) => isStock(g.photo));
  const n = (i: number) => (s === "minimal" ? <span className="biz-no">{String(i).padStart(2, "0")}</span> : null);
  let sec = 0;

  return (
    <div className={`ipr ipr-biz s-${s}` + (theme.dark ? " dark" : "")} style={themeVars(theme) as React.CSSProperties}>
      <style>{BASE_CSS + CSS}</style>
      <div className="biz-page">
        <header className="biz-top">
          <div className="ip-wrap biz-top-in">
            <a className="biz-logo" href="#top">
              {resolveImg(c.logo) ? <Img src={c.logo} alt="" className="lg" eager /> : <b aria-hidden="true">{words[0]?.[0] ?? "A"}</b>}
              <span>{name}</span>
            </a>
            {st && <span className={"biz-st" + (st.open ? " open" : "")} title={st.label}><i /><span className="l">{st.label}</span><span className="s">{st.open ? "Open" : "Closed"}</span></span>}
          </div>
        </header>

        <section className="biz-hero" id="top">
          {s === "photo" && <div className="biz-bg" aria-hidden="true"><Img src={cover} alt="" sizes="100vw" eager /></div>}
          {s === "bold" && <span className="biz-mark" aria-hidden="true">{words[0]?.[0]}</span>}
          <div className="ip-wrap biz-hero-in">
            <div className="biz-copy">
              {(c.area || c.city) && <p className="biz-eye">{[c.area, c.city].filter(Boolean).join(" · ")}</p>}
              <h1 className="biz-h1" style={fitWords(name)}>
                <span className="a">{o.heroVerb}</span>{" "}
                <span className="nm">{words.map((w, i) => <span key={i} className={i % 2 ? "c" : "b"}>{w}{i < words.length - 1 ? " " : ""}</span>)}</span>
              </h1>
              {c.tagline && <p className="biz-tag">{c.tagline}</p>}
              <div className="biz-cta" ref={bar.ref}>
                {c.offer && <a className="ip-btn ip-primary" href="#lead">{c.offer}</a>}
                <a className="ip-btn ip-wa" href={enquire} target="_blank" rel="noopener noreferrer"><Icon.wa /> WhatsApp us</a>
              </div>
              {c.rating && <p className="biz-rate"><span className="stars"><Icon.star /></span><b>{c.rating}</b> on Google{c.reviews_count ? ` · ${c.reviews_count} reviews` : ""}</p>}
            </div>
            {s !== "photo" && cover && (
              <div className="biz-media" aria-hidden="true">
                <Img src={cover} alt="" sizes="(min-width: 900px) 45vw, 100vw" eager />
              </div>
            )}
          </div>
        </section>

        {services.length > 0 && (
          <section className="biz-sec" id="services">
            <div className="ip-wrap">
              <p className="biz-label">{n(++sec)}{o.servicesTitle}</p>
              <div className={"biz-svcs" + (services.length >= 3 ? " many" : "")}>
                {services.map((sv: { name: string; price?: string; note?: string }, i: number) => (
                  <article key={i} className={"svc" + (i === 1 && services.length > 2 ? " pop" : "")}>
                    <div className="svc-top"><h3>{sv.name}</h3>{priceText(sv.price) && <b>{priceText(sv.price)}</b>}</div>
                    {sv.note && <p>{sv.note}</p>}
                    <a className="ip-btn ip-ghost" href={waTo(c.whatsapp, fill(product.whatsapp.service, { ...vars, item: sv.name, price: priceText(sv.price) || "price on request" }))} target="_blank" rel="noopener noreferrer"><Icon.wa /> Ask about this</a>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {highlights.length > 0 && (
          <section className="biz-sec">
            <div className="ip-wrap">
              <p className="biz-label">{n(++sec)}{o.highlightsTitle}</p>
              <ul className="biz-hl">{highlights.map((h) => <li key={h}><Icon.check />{h}</li>)}</ul>
            </div>
          </section>
        )}

        {gallery.length > 0 && (
          <section className="biz-sec">
            <div className="ip-wrap">
              <p className="biz-label">{n(++sec)}Take a look</p>
              <Gallery photos={gallery} title={`${name} photos`} />
            </div>
          </section>
        )}

        {team.length > 0 && (
          <section className="biz-sec">
            <div className="ip-wrap">
              <p className="biz-label">{n(++sec)}{o.teamTitle ?? "Team"}</p>
              <div className="biz-team">
                {team.map((m: { name: string; role?: string; photo?: string }, i: number) => {
                  const ph = resolveImg(m.photo);
                  return (
                    <div key={i} className="tm">
                      <span className="av" aria-hidden="true">{ph ? <Img src={ph} alt="" sizes="120px" /> : m.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
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
              <p className="biz-label">{n(++sec)}Reviews</p>
              <div className="biz-revs">{reviews.map((r: { name?: string; text: string }, i: number) => <figure key={i}><span className="stars" aria-label="5 stars">{[0, 1, 2, 3, 4].map((k) => <Icon.star key={k} />)}</span><blockquote>{r.text}</blockquote>{r.name && <figcaption>{r.name}</figcaption>}</figure>)}</div>
            </div>
          </section>
        )}

        <section className="biz-sec" id="find">
          <div className="ip-wrap biz-find">
            {c.opens && c.closes && (
              <div className="biz-hours">
                <p className="biz-label">{n(++sec)}Opening hours</p>
                {DAYS.map((d) => <div key={d} className={"hr" + (d === today ? " today" : "")}><span>{d}</span><span>{openDays.includes(d) ? `${t12(c.opens)} – ${t12(c.closes)}` : "Closed"}</span></div>)}
              </div>
            )}
            <div className="biz-loc">
              <p className="biz-label">{n(++sec)}Find us</p>
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
                <div>
                  <LeadForm slug={slug} mode={mode} kind="lead" button={o.leadButton} ownerWa={c.whatsapp} waTemplate={product.whatsapp.lead} vars={vars}
                    messageLabel="Anything we should know? (optional)" context={{ offer: c.offer }}
                    done={(nm) => <p className="biz-thanks"><b>Done, {nm.split(" ")[0]}.</b> {name} will call you soon.</p>} />
                  <p className="ip-fine">By sending, you agree to be contacted by {name} about this request.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <footer className="ip-wrap biz-foot">
          <p>© {new Date().getFullYear()} {name}{c.city ? ` · ${c.city}` : ""}</p>
          {usesStock && <p className="cr">Some photos from <a href="https://unsplash.com/?utm_source=ezyourlife&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a></p>}
          <MadeWith product={product} />
        </footer>
      </div>

      <nav className={"biz-bar ip-fixed" + (bar.show ? " on" : "")} aria-label={`Contact ${name}`} aria-hidden={!bar.show}>
        <a className="ip-btn ip-wa" href={enquire} target="_blank" rel="noopener noreferrer" tabIndex={bar.show ? 0 : -1}><Icon.wa /> WhatsApp</a>
        {c.phone && <a className="ip-btn ip-ghost" href={telHref(c.phone)} tabIndex={bar.show ? 0 : -1}><Icon.phone /> Call</a>}
        {c.offer ? <a className="ip-btn ip-primary" href="#lead" tabIndex={bar.show ? 0 : -1}>{o.bar}</a> : place && <a className="ip-btn ip-ghost" href={mapsDir(place)} target="_blank" rel="noopener noreferrer" tabIndex={bar.show ? 0 : -1}><Icon.map /> Map</a>}
      </nav>
    </div>
  );
}

// Layout is driven by the page's own width (container queries), not the screen's, so the builder's
// phone-sized preview and a real phone look the same, and laptops get the wide layouts.
const CSS = `
.ipr-biz{--rad:18px;--hmax:6.2rem;padding-bottom:96px}
.ipr-biz.s-photo{--hmax:5.6rem}
.ipr-biz.s-split{--rad:16px;--hmax:4.9rem}
.ipr-biz.s-editorial{--rad:4px;--hmax:5.2rem}
.ipr-biz.s-soft{--rad:28px;--hmax:4.6rem}
.ipr-biz.s-minimal{--rad:2px;--hmax:5.4rem}
.ipr-biz .ip-wrap{max-width:1180px;width:100%}
.biz-page{container:page/inline-size}
.biz-top{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 86%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);border-bottom:1px solid var(--line)}
.biz-top-in{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:62px}
.biz-logo{display:flex;align-items:center;gap:10px;text-decoration:none;min-width:0;flex:1 1 auto}
.biz-logo b{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:var(--tx);color:var(--bg);font:800 1.1rem/1 var(--fd);flex:none}
.biz-logo .lg{width:40px;height:40px;border-radius:10px;object-fit:contain;background:#fff;padding:3px;flex:none;box-shadow:0 0 0 1px var(--line)}
.biz-logo span{font:800 1.02rem/1.15 var(--fd);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.biz-st{display:inline-flex;align-items:center;gap:7px;font:600 .8rem/1.2 var(--fb);color:var(--mu);white-space:nowrap;flex:none;padding:6px 10px;border-radius:999px;background:var(--sf);box-shadow:inset 0 0 0 1px var(--line)}
.biz-st i{width:8px;height:8px;border-radius:50%;background:#E5484D;flex:none}
.biz-st.open i{background:#25D366;box-shadow:0 0 0 4px rgba(37,211,102,.18)}
.biz-st .l{display:none}
@container page (min-width:460px){.biz-st .l{display:inline}.biz-st .s{display:none}}

/* hero */
.biz-hero{position:relative;overflow:hidden;padding-block:clamp(36px,8cqi,96px) clamp(36px,7cqi,80px)}
.biz-hero-in{position:relative;display:grid;gap:clamp(24px,5cqi,48px);align-items:center}
.biz-copy{display:grid;gap:18px;container-type:inline-size;min-width:0;width:100%;justify-self:stretch}
.biz-eye{display:inline-flex;align-items:center;gap:10px;font:700 .74rem/1.2 var(--fb);letter-spacing:.16em;text-transform:uppercase;color:var(--ac);margin:0}
.biz-eye::before{content:"";width:22px;height:2px;background:currentColor;flex:none}
.biz-h1{font-family:var(--fd);font-weight:900;margin:0;line-height:.95;letter-spacing:-.015em;overflow-wrap:normal;word-break:normal;hyphens:none}
.biz-h1 .a{display:block;font-size:clamp(1.15rem,5cqi,2rem);color:var(--mu);font-weight:700;letter-spacing:0;margin-bottom:.15em}
.biz-h1 .nm{display:block;font-size:min(var(--hmax),calc(122cqi / var(--fit)),15cqi);text-wrap:balance}
.biz-h1 .c{color:var(--ac)}
.biz-tag{font-size:clamp(1.02rem,3.8cqi,1.25rem);color:var(--mu);max-width:44ch;margin:0;line-height:1.5}
.biz-cta{display:flex;flex-wrap:wrap;gap:10px;max-width:560px}
.biz-cta .ip-btn{flex:1 1 12rem;border-radius:calc(var(--rad) * .8 + 4px)}
.biz-rate{display:flex;align-items:center;gap:8px;margin:0;font-size:.92rem;color:var(--mu)}
.biz-rate b{color:var(--tx);font-size:1.05rem}
.stars{display:inline-flex;gap:2px;color:#F2B01E}
.stars svg{width:18px;height:18px}
.biz-media{position:relative;border-radius:var(--rad);overflow:hidden;background:var(--sf);aspect-ratio:4/3;box-shadow:0 30px 60px -30px rgba(0,0,0,.45)}
.biz-media img{width:100%;height:100%;object-fit:cover}
@container page (min-width:860px){
  .biz-hero-in{grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr)}
  .biz-media{aspect-ratio:4/5;max-height:640px}
}

/* bold: oversized type, outlined second word, a giant letter behind */
.s-bold .biz-mark{position:absolute;right:-4%;top:-8%;font:900 clamp(16rem,60cqi,34rem)/1 var(--fd);color:transparent;-webkit-text-stroke:2px color-mix(in srgb,var(--ac) 40%,transparent);pointer-events:none;user-select:none}
.s-bold.dark .biz-h1 .c{color:transparent;-webkit-text-stroke:2px var(--tx)}
.s-bold:not(.dark) .biz-h1 .c{color:var(--ac2);-webkit-text-stroke:2px var(--tx);paint-order:stroke fill}
.s-bold .biz-media{transform:rotate(1.2deg);box-shadow:12px 12px 0 var(--ac)}

/* photo: the cover fills the hero, text sits on a dark gradient */
.s-photo .biz-hero{min-height:min(calc(var(--ip-vh,100svh) * .86),820px);display:grid;align-items:end;padding-top:120px;color:#fff;border-bottom:0}
.s-photo .biz-bg{position:absolute;inset:0}
.s-photo .biz-bg img{width:100%;height:100%;object-fit:cover;animation:biz-zoom 18s ease-out both}
.s-photo .biz-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35) 0%,rgba(0,0,0,.08) 30%,rgba(0,0,0,.55) 62%,rgba(0,0,0,.86) 100%)}
.s-photo .biz-hero-in{grid-template-columns:minmax(0,1fr)!important}
.s-photo .biz-copy{max-width:760px}
.s-photo .biz-h1 .a,.s-photo .biz-tag,.s-photo .biz-rate{color:rgba(255,255,255,.86)}
.s-photo .biz-rate b{color:#fff}
.s-photo .biz-h1 .c{color:var(--ac)}
.s-photo .biz-eye{color:#fff}
.s-photo .biz-cta .ip-ghost{color:#fff}
@keyframes biz-zoom{from{transform:scale(1.08)}to{transform:scale(1)}}

/* split: photo first on phones, side by side on laptops, an accent slab behind the photo */
.s-split .biz-media{order:-1;aspect-ratio:16/11;overflow:visible;background:none;box-shadow:none}
.s-split .biz-media img{border-radius:var(--rad);position:relative;z-index:1;box-shadow:0 30px 60px -30px rgba(0,0,0,.45)}
.s-split .biz-media::before{content:"";position:absolute;inset:18px -10px -10px 18px;border-radius:var(--rad);background:var(--ac);opacity:.9}
@container page (min-width:860px){.s-split .biz-media{order:0;aspect-ratio:4/5}.s-split .biz-media::before{inset:28px -18px -18px 28px}}

/* editorial: centred serif, a thin rule, the photo framed in an arch */
.s-editorial .biz-hero-in{grid-template-columns:minmax(0,1fr)!important;justify-items:center;text-align:center}
.s-editorial .biz-copy{justify-items:center;max-width:860px}
.s-editorial .biz-eye::after{content:"";width:22px;height:2px;background:currentColor}
.s-editorial .biz-h1{font-weight:500;letter-spacing:-.01em}
.s-editorial .biz-h1 .a{font-family:var(--fb);font-size:.8rem;letter-spacing:.26em;text-transform:uppercase;font-weight:600;margin-bottom:1em}
.s-editorial .biz-h1 .c{font-style:italic}
.s-editorial .biz-cta{justify-content:center}
.s-editorial .biz-media{width:min(100%,560px);aspect-ratio:4/5;border-radius:999px 999px var(--rad) var(--rad);box-shadow:0 0 0 10px var(--bg),0 0 0 11px var(--line)}
@container page (min-width:860px){.s-editorial .biz-media{aspect-ratio:5/6;max-height:none}}

/* soft: rounded everything, a blob-shaped photo with a ring */
.s-soft .biz-hero{background:radial-gradient(60% 50% at 90% 10%,color-mix(in srgb,var(--ac2) 35%,transparent),transparent 70%),radial-gradient(50% 40% at 0% 100%,color-mix(in srgb,var(--ac3) 22%,transparent),transparent 70%)}
.s-soft .biz-h1{font-weight:400}
.s-soft .biz-h1 .c{font-style:italic}
.s-soft .biz-media{border-radius:46% 54% 52% 48%/52% 44% 56% 48%;aspect-ratio:1;overflow:visible;background:none;box-shadow:none;max-width:560px;justify-self:center;width:100%}
.s-soft .biz-media img{border-radius:inherit;position:relative;z-index:1}
.s-soft .biz-media::before{content:"";position:absolute;inset:-12px;border-radius:inherit;border:2px dashed color-mix(in srgb,var(--ac) 55%,transparent);animation:biz-spin 60s linear infinite}
.s-soft .biz-cta .ip-btn{border-radius:999px}
@keyframes biz-spin{to{transform:rotate(360deg)}}

/* minimal: left aligned, hairlines, numbered sections, a wide letterbox photo */
.s-minimal .biz-hero-in{grid-template-columns:minmax(0,1fr)!important}
.s-minimal .biz-h1{font-weight:700;letter-spacing:-.035em}
.s-minimal .biz-eye::before{display:none}
.s-minimal .biz-eye{color:var(--mu)}
.s-minimal .biz-media{aspect-ratio:16/10;box-shadow:none}
@container page (min-width:860px){.s-minimal .biz-media{aspect-ratio:21/9}}
.s-minimal .biz-cta .ip-btn{border-radius:var(--rad)}
.biz-no{display:block;font:500 .82rem/1 var(--fb);letter-spacing:.1em;color:var(--mu);margin-bottom:14px}

/* sections */
.biz-sec{padding-block:clamp(52px,9cqi,104px) 0}
.biz-label{font:800 clamp(1.7rem,7.5cqi,3rem)/1.02 var(--fd);margin:0 0 26px;text-wrap:balance;letter-spacing:-.01em}
.s-editorial .biz-label,.s-soft .biz-label{font-weight:500;text-align:center}
.s-editorial .biz-label::after{content:"";display:block;width:40px;height:1px;background:var(--ac);margin:18px auto 0}
.s-minimal .biz-label{font-weight:700;letter-spacing:-.03em;border-top:1px solid var(--tx);padding-top:16px}
.biz-svcs{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
@container page (min-width:640px){.biz-svcs{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container page (min-width:1000px){.biz-svcs.many{grid-template-columns:repeat(3,minmax(0,1fr))}}
.svc{display:grid;gap:12px;grid-template-rows:auto 1fr auto;padding:22px;border-radius:var(--rad);background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);transition:transform .25s ease,box-shadow .25s ease}
.svc:hover{transform:translateY(-3px);box-shadow:inset 0 0 0 1px var(--line),0 18px 40px -24px rgba(0,0,0,.35)}
.svc.pop{box-shadow:inset 0 0 0 2px var(--ac)}
.svc-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.svc h3{font:800 1.22rem/1.2 var(--fd);margin:0;min-width:0}
.svc b{font:800 1.3rem/1 var(--fd);color:var(--ac);white-space:nowrap}
.svc p{margin:0;color:var(--mu);font-size:.94rem}
.svc .ip-btn{min-height:48px;border-radius:calc(var(--rad) * .7 + 4px);font-size:.92rem}
.s-minimal .svc{background:none;box-shadow:none;border-top:1px solid var(--line);border-radius:0;padding:20px 0}
.s-minimal .svc.pop{box-shadow:none;border-top:2px solid var(--tx)}
.s-editorial .svc{text-align:center;justify-items:center}
.s-editorial .svc-top{flex-direction:column;align-items:center;gap:8px}
.s-editorial .svc h3,.s-soft .svc h3{font-weight:500;font-size:1.4rem}
.biz-hl{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
@container page (min-width:640px){.biz-hl{grid-template-columns:repeat(3,minmax(0,1fr))}}
@container page (min-width:1000px){.biz-hl{grid-template-columns:repeat(4,minmax(0,1fr))}}
.biz-hl li{display:flex;align-items:center;gap:10px;padding:14px;border-radius:calc(var(--rad) * .8);background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);font-weight:600;font-size:.94rem;min-width:0}
.biz-hl svg{flex:none;color:var(--ac)}
.s-soft .biz-hl li{border-radius:999px;padding:12px 16px}
.biz-team{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
@container page (min-width:640px){.biz-team{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container page (min-width:1000px){.biz-team{grid-template-columns:repeat(3,minmax(0,1fr))}}
.tm{display:flex;gap:14px;align-items:center;padding:14px;border-radius:var(--rad);background:var(--sf);box-shadow:inset 0 0 0 1px var(--line)}
.tm .av{flex:none;width:60px;height:60px;border-radius:50%;display:grid;place-items:center;background:var(--ac);color:var(--on);font:800 1.1rem/1 var(--fd);overflow:hidden}
.tm .av img{width:100%;height:100%;object-fit:cover}
.tm b{display:block}
.tm span{display:block;color:var(--mu);font-size:.9rem}
.biz-revs{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
@container page (min-width:760px){.biz-revs{grid-template-columns:repeat(3,minmax(0,1fr))}}
.biz-revs figure{margin:0;padding:22px;border-radius:var(--rad);background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);display:grid;gap:10px;align-content:start}
.biz-revs blockquote{margin:0;color:var(--tx);font-size:1.02rem}
.s-editorial .biz-revs blockquote,.s-soft .biz-revs blockquote{font:400 1.15rem/1.45 var(--fd);font-style:italic}
.biz-revs figcaption{font-weight:700;font-size:.9rem;color:var(--mu)}
.biz-find{display:grid;gap:28px}
@container page (min-width:760px){.biz-find{grid-template-columns:repeat(2,minmax(0,1fr));gap:48px}}
.biz-hours .biz-label,.biz-loc .biz-label{font-size:clamp(1.4rem,6cqi,2.1rem);text-align:left}
.biz-hours .biz-label::after,.biz-loc .biz-label::after{margin-left:0}
.hr{display:flex;justify-content:space-between;gap:12px;padding-block:11px;border-top:1px solid var(--line);font-size:.95rem;font-variant-numeric:tabular-nums}
.hr.today{font-weight:800}
.hr.today span:first-child::after{content:"Today";margin-left:8px;font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;background:var(--tx);color:var(--bg);padding:3px 6px;border-radius:5px;vertical-align:2px}
.biz-loc .addr{margin:0 0 14px;font-size:1.05rem}
.biz-loc .row{display:flex;flex-wrap:wrap;gap:10px}
.biz-loc .ip-btn{flex:1 1 11rem;border-radius:calc(var(--rad) * .8 + 4px)}
.biz-lead{display:grid;gap:22px;padding:clamp(24px,5cqi,48px);border-radius:calc(var(--rad) + 6px);background:var(--tx);color:var(--bg)}
@container page (min-width:860px){.biz-lead{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;gap:48px}}
.biz-lead h2{font:900 clamp(1.9rem,8cqi,3.2rem)/1.02 var(--fd);margin:0;text-wrap:balance}
.s-editorial .biz-lead h2,.s-soft .biz-lead h2{font-weight:500}
.biz-lead p{margin:10px 0 0;opacity:.8}
.biz-lead .ip-field{color:color-mix(in srgb,var(--bg) 70%,transparent)}
.biz-lead .ip-field input,.biz-lead .ip-field select,.biz-lead .ip-field textarea{background:var(--bg);color:var(--tx);border-color:transparent}
.biz-lead .ip-primary{background:var(--ac);color:var(--on)}
.s-minimal .biz-lead .ip-primary,.s-bold:not(.dark) .biz-lead .ip-primary{box-shadow:inset 0 0 0 2px var(--bg)}
.biz-lead .ip-fine{color:color-mix(in srgb,var(--bg) 65%,transparent);margin-top:10px}
.biz-thanks{font-size:1.1rem;margin:0}
.biz-foot{display:grid;gap:8px;padding-block:56px 20px;color:var(--mu);font-size:.85rem;text-align:center}
.biz-foot p{margin:0}
.biz-foot .cr a{color:inherit}

/* the action bar slides in once the hero buttons scroll away, so it never covers them */
.biz-bar{left:0;right:0;bottom:0;z-index:40;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));background:color-mix(in srgb,var(--bg) 90%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-top:1px solid var(--line);transform:translateY(110%);transition:transform .35s cubic-bezier(.2,.8,.2,1);pointer-events:none}
.biz-bar.on{transform:none;pointer-events:auto}
.biz-bar .ip-btn{min-height:52px;padding:0 .4em;font-size:.9rem;border-radius:14px;white-space:nowrap;min-width:0;gap:.4em}
.biz-bar .ip-btn svg{flex:none;width:18px;height:18px}
@media (min-width:760px){.biz-bar{left:50%;right:auto;bottom:16px;width:min(560px,calc(100% - 32px));border:1px solid var(--line);border-radius:20px;padding:8px;transform:translate(-50%,140%)}.biz-bar.on{transform:translateX(-50%)}}
`;
