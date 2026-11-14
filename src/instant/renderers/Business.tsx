import { useEffect, useRef, useState } from "react";
import type { RenderProps } from "../types";
import { themeVars } from "../themes";
import { DAYS, fill, fmtPhone, mapsDir, mapsLink, openStatus, priceText, t12, telHref, waTo } from "../util";
import { BASE_CSS, Gallery, Icon, Img, LeadForm, MadeWith, fitWords, resolveImg, useRevealBar, useThemeFonts } from "../parts";
import { coverFor, isStock } from "../stock";
import { Backdrop, FormFold, SIG_CSS, sigClass, usePointerFx } from "../signature";
import StayShowcase, { STAY_PRODUCTS } from "../showpieces/StayShowcase";

export default function Business({ product, theme, content: c, mode, slug }: RenderProps) {
  useThemeFonts(theme);
  const o = product.opts;
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 60000); return () => clearInterval(t); }, []);
  const bar = useRevealBar<HTMLDivElement>();
  const fxRef = usePointerFx<HTMLDivElement>();
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
  // Optional sections. Only products that ask for them in their form have them, so older pages are unchanged.
  const stats = (Array.isArray(c.stats) ? c.stats : []).filter((x: { value?: string }) => x?.value);
  const how = (Array.isArray(c.how) ? c.how : []).filter((x: { title?: string }) => x?.title);
  const faqs = (Array.isArray(c.faqs) ? c.faqs : []).filter((x: { q?: string; a?: string }) => x?.q && x?.a);
  const brands = String(c.brands ?? "").split(",").map((b) => b.trim()).filter(Boolean).slice(0, 30);
  const enquire = waTo(c.whatsapp, fill(product.whatsapp.enquire, vars));
  const place = [c.address, c.area, c.city].filter(Boolean).join(", ");
  const name = String(c.name || product.name).trim();
  const words = name.split(/\s+/);
  const today = DAYS[(new Date().getDay() + 6) % 7];
  const openDays: string[] = Array.isArray(c.open_days) && c.open_days.length ? c.open_days : DAYS;
  const s = theme.s;
  const prime = s === "prime";
  const usesStock = isStock(cover) || gallery.some((g: { photo: string }) => isStock(g.photo));
  const n = (i: number) => (s === "minimal" ? <span className="biz-no">{String(i).padStart(2, "0")}</span> : null);
  let sec = 0;

  return (
    <div className={`ipr ipr-biz s-${s}` + (theme.dark ? " dark" : "") + sigClass(product.id, s === "prime")} style={themeVars(theme) as React.CSSProperties}>
      <style>{BASE_CSS + CSS + SIG_CSS}</style>
      <div className="biz-page" ref={fxRef}>
        <header className="biz-top">
          <div className="ip-wrap biz-top-in">
            <a className="biz-logo" href="#top">
              {resolveImg(c.logo) ? <Img src={c.logo} alt="" className="lg" eager /> : <b aria-hidden="true">{words[0]?.[0] ?? "A"}</b>}
              <span>{name}</span>
            </a>
            {st && <span className={"biz-st" + (st.open ? " open" : "")} title={st.label}><i /><span className="l">{st.label}</span><span className="s">{st.open ? "Open" : "Closed"}</span></span>}
          </div>
        </header>

        {c.notice && <p className="biz-notice"><span className="ip-wrap"><i aria-hidden="true" />{c.notice}</span></p>}

        <section className={"biz-hero" + (prime ? " sig-hero" : "")} id="top">
          {s === "photo" && <div className="biz-bg" aria-hidden="true"><Img src={cover} alt="" sizes="100vw" eager /></div>}
          {prime && <Backdrop id={product.id} />}
          {(s === "bold" || prime) && <span className="biz-mark" aria-hidden="true">{words[0]?.[0]}</span>}
          <div className="ip-wrap biz-hero-in">
            <div className="biz-copy">
              {(c.area || c.city) && <p className="biz-eye">{[c.area, c.city].filter(Boolean).join(" · ")}</p>}
              <h1 className="biz-h1" style={fitWords(name)}>
                <span className="a">{o.heroVerb}</span>{" "}
                <span className={"nm" + (prime ? " sig-h" : "")}>{words.map((w, i) => <span key={i} className={i % 2 ? "c" : "b"}>{w}{i < words.length - 1 ? " " : ""}</span>)}</span>
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

        {stats.length > 0 && (
          <section className="biz-stats-sec" aria-label="At a glance">
            <div className="ip-wrap">
              <dl className="biz-stats">{stats.map((x: { value: string; label?: string }, i: number) => <div key={i}><dt>{prime ? <CountUp value={x.value} /> : x.value}</dt>{x.label && <dd>{x.label}</dd>}</div>)}</dl>
            </div>
          </section>
        )}

        {services.length > 0 && (
          <section className="biz-sec" id="services">
            <div className="ip-wrap">
              <p className="biz-label">{n(++sec)}{o.servicesTitle}</p>
              {STAY_PRODUCTS.has(product.id) && services.length >= 2 ? (
                <StayShowcase
                  rooms={services}
                  photos={[...gallery.map((g: { photo: string }) => g.photo), cover].filter(Boolean)}
                  label={String(o.serviceLabel || "room")}
                  bookHref={(r) => waTo(c.whatsapp, fill(product.whatsapp.service, { ...vars, item: r.name, price: priceText(r.price) || "price on request" }))}
                />
              ) : (
              <div className={"biz-svcs" + (services.length >= 3 ? " many" : "")}>
                {services.map((sv: { name: string; price?: string; note?: string }, i: number) => (
                  <article key={i} className={"svc" + (i === 1 && services.length > 2 ? " pop" : "") + (prime ? " sig-fx" : "")}>
                    <div className="svc-top"><h3>{sv.name}</h3>{priceText(sv.price) && <b>{priceText(sv.price)}</b>}</div>
                    {sv.note && <p>{sv.note}</p>}
                    <a className="ip-btn ip-ghost" href={waTo(c.whatsapp, fill(product.whatsapp.service, { ...vars, item: sv.name, price: priceText(sv.price) || "price on request" }))} target="_blank" rel="noopener noreferrer"><Icon.wa /> Ask about this</a>
                  </article>
                ))}
              </div>
              )}
            </div>
          </section>
        )}

        {o.listOrder && <ListOrder o={o.listOrder} wa={c.whatsapp} tpl={product.whatsapp.order} vars={vars} n={n(++sec)} />}

        {how.length > 0 && (
          <section className="biz-sec">
            <div className="ip-wrap">
              <p className="biz-label">{n(++sec)}{o.howTitle ?? "How it works"}</p>
              <ol className="biz-how">{how.map((x: { title: string; text?: string }, i: number) => <li key={i}><span className="k" aria-hidden="true">{i + 1}</span><b>{x.title}</b>{x.text && <p>{x.text}</p>}</li>)}</ol>
            </div>
          </section>
        )}

        {highlights.length > 0 && (
          <section className="biz-sec">
            <div className="ip-wrap">
              <p className="biz-label">{n(++sec)}{o.highlightsTitle}</p>
              {!(prime && highlights.length >= 5) && <ul className="biz-hl">{highlights.map((h) => <li key={h}><Icon.check />{h}</li>)}</ul>}
            </div>
            {prime && highlights.length >= 5 && (
              <div className="biz-hlm" role="img" aria-label={highlights.join(", ")}>
                <div className="trk" aria-hidden="true">{[...highlights, ...highlights].map((h, i) => <span key={i}>{h}</span>)}</div>
                <div className="trk rev" aria-hidden="true">{[...highlights, ...highlights].reverse().map((h, i) => <span key={i}>{h}</span>)}</div>
              </div>
            )}
          </section>
        )}

        {brands.length > 0 && (
          <section className="biz-sec">
            <div className="ip-wrap">
              <p className="biz-label">{n(++sec)}{o.brandsTitle ?? "Brands we stock"}</p>
            </div>
            <div className="biz-brands" aria-label={brands.join(", ")}>
              <div className="trk" aria-hidden="true">{[...brands, ...brands].map((b, i) => <span key={i}>{b}</span>)}</div>
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
                    <div key={i} className={"tm" + (prime ? " sig-fx" : "")}>
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
              {prime && reviews.length >= 2 ? <ReviewStack reviews={reviews} /> : <div className="biz-revs">{reviews.map((r: { name?: string; text: string }, i: number) => <figure key={i}><span className="stars" aria-label="5 stars">{[0, 1, 2, 3, 4].map((k) => <Icon.star key={k} />)}</span><blockquote>{r.text}</blockquote>{r.name && <figcaption>{r.name}</figcaption>}</figure>)}</div>}
            </div>
          </section>
        )}

        {faqs.length > 0 && (
          <section className="biz-sec">
            <div className="ip-wrap">
              <p className="biz-label">{n(++sec)}Questions people ask</p>
              <div className="biz-faq">{faqs.map((f: { q: string; a: string }, i: number) => <details key={i} open={!prime && i === 0} {...(prime ? { name: "biz-faq" } : {})}><summary>{f.q}<Icon.plus /></summary><p>{f.a}</p></details>)}</div>
            </div>
          </section>
        )}

        <section className="biz-sec" id="find">
          <div className="ip-wrap biz-find">
            {c.opens && c.closes && (
              <div className="biz-hours">
                <Fold on={prime} title="Opening hours">
                {!prime && <p className="biz-label">{n(++sec)}Opening hours</p>}
                {DAYS.map((d) => <div key={d} className={"hr" + (d === today ? " today" : "")}><span>{d}</span><span>{!openDays.includes(d) ? "Closed" : c.opens === c.closes ? "Open 24 hours" : `${t12(c.opens)} – ${t12(c.closes)}`}</span></div>)}
                </Fold>
              </div>
            )}
            <div className="biz-loc">
              <Fold on={prime} title="Find us">
              {!prime && <p className="biz-label">{n(++sec)}Find us</p>}
              {place && <p className="addr">{place}</p>}
              <div className="row">
                {place && <a className="ip-btn ip-ghost" href={c.maps_url ? mapsLink(c.maps_url, place) : mapsDir(place)} target="_blank" rel="noopener noreferrer"><Icon.nav /> Directions</a>}
                {c.phone && <a className="ip-btn ip-ghost" href={telHref(c.phone)}><Icon.phone /> {fmtPhone(c.phone)}</a>}
              </div>
              </Fold>
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
                  <FormFold title={o.leadButton} hint="Your name and number. Takes 20 seconds." icon={<Icon.phone />}>
                    <LeadForm slug={slug} mode={mode} kind="lead" button={o.leadButton} ownerWa={c.whatsapp} waTemplate={product.whatsapp.lead} vars={vars}
                      messageLabel="Anything we should know? (optional)" context={{ offer: c.offer }}
                      done={(nm) => <p className="biz-thanks"><b>Done, {nm.split(" ")[0]}.</b> {name} will call you soon.</p>} />
                    <p className="ip-fine">By sending, you agree to be contacted by {name} about this request.</p>
                  </FormFold>
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

/** Signature layout: a number that counts up the first time it scrolls into view ("6,000", "40+", "4.8★"). */
function CountUp({ value }: { value: string }) {
  const m = /^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(String(value));
  const ref = useRef<HTMLSpanElement>(null);
  const [t, setT] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!m || !el) return;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setT(1); return; }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (now: number) => { const p = Math.min(1, (now - t0) / 1400); setT(p); if (p < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  if (!m) return <>{value}</>;
  const raw = m[2];
  const dec = raw.includes(".") ? raw.split(".")[1].length : 0;
  const now = Number(raw.replace(/,/g, "")) * (1 - Math.pow(1 - t, 3));
  const shown = raw.includes(",") ? Math.round(now).toLocaleString("en-IN") : now.toFixed(dec);
  // Screen readers get the final value; the moving digits are for the eye only.
  return <span ref={ref} aria-label={String(value)}><span aria-hidden="true">{m[1]}{shown}{m[3]}</span></span>;
}

/** Signature layout: reviews as a stack of cards. The front card moves to the back every few seconds or on tap. */
function ReviewStack({ reviews }: { reviews: { name?: string; text: string }[] }) {
  const [at, setAt] = useState(0);
  const [hold, setHold] = useState(false);
  const n = reviews.length;
  useEffect(() => {
    if (hold || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setAt((a) => a + 1), 4500);
    return () => clearInterval(t);
  }, [hold]);
  return (
    <div onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocusCapture={() => setHold(true)} onBlurCapture={() => setHold(false)}>
      <div className="biz-stack">
        {reviews.map((r, i) => {
          const k = (((i - at) % n) + n) % n;
          return (
            <figure key={i} aria-hidden={k !== 0} style={{ transform: `translateY(${-Math.min(k, 2) * 12}px) scale(${1 - Math.min(k, 2) * 0.05})`, opacity: k > 2 ? 0 : 1 - k * 0.3, zIndex: n - k }}>
              <span className="stars" aria-label="5 stars">{[0, 1, 2, 3, 4].map((x) => <Icon.star key={x} />)}</span>
              <blockquote>{r.text}</blockquote>
              {r.name && <figcaption>{r.name}</figcaption>}
            </figure>
          );
        })}
      </div>
      <button type="button" className="ip-btn ip-ghost biz-next" onClick={() => setAt((a) => a + 1)}>Next review</button>
    </div>
  );
}

/** Signature layout: a section that folds shut. Opening one closes the others with the same name. */
function Fold({ on, title, children }: { on: boolean; title: string; children: React.ReactNode }) {
  if (!on) return <>{children}</>;
  return <details className="biz-fold" {...{ name: "biz-find" }}><summary>{title}<Icon.plus /></summary>{children}</details>;
}

/** A box where a customer types their list (groceries, medicines, materials) and sends it on WhatsApp. */
function ListOrder({ o, wa, tpl, vars, n }: { o: { title: string; hint?: string; placeholder?: string; button?: string }; wa: unknown; tpl?: string; vars: Record<string, unknown>; n: React.ReactNode }) {
  const [list, setList] = useState("");
  const [who, setWho] = useState("");
  const text = fill(tpl ?? "Hi {name}, here is my order:\n{list}", { ...vars, list: list.trim(), customer: who.trim() || "a customer" });
  return (
    <section className="biz-sec" id="order">
      <div className="ip-wrap">
        <div className="biz-order">
          <div>
            <p className="biz-label">{n}{o.title}</p>
            {o.hint && <p className="biz-order-hint">{o.hint}</p>}
          </div>
          <FormFold title={o.button ?? "Send list on WhatsApp"} hint="Type your list, we reply on WhatsApp." icon={<Icon.bag />}>
          <div className="biz-order-form">
            <label className="ip-field"><span>Your list</span><textarea value={list} onChange={(e) => setList(e.target.value)} maxLength={900} rows={5} placeholder={o.placeholder} /></label>
            <label className="ip-field"><span>Your name (optional)</span><input value={who} onChange={(e) => setWho(e.target.value)} maxLength={60} autoComplete="name" /></label>
            <a className={"ip-btn ip-wa" + (list.trim() ? "" : " off")} href={list.trim() ? waTo(wa, text) : undefined} aria-disabled={!list.trim()} target="_blank" rel="noopener noreferrer"><Icon.wa /> {o.button ?? "Send list on WhatsApp"}</a>
          </div>
          </FormFold>
        </div>
      </div>
    </section>
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
.biz-lead .ip-fold .ip-fine{margin-top:0}
.biz-lead .ip-fold .biz-thanks{color:var(--tx)}
.biz-thanks{font-size:1.1rem;margin:0}
/* optional sections: notice ribbon, numbers strip, list order, steps, brands, questions */
.biz-notice{margin:0;background:var(--ac);color:var(--on);font:700 .9rem/1.35 var(--fb);text-align:center;padding:10px 0}
.biz-notice .ip-wrap{display:flex;align-items:center;justify-content:center;gap:10px}
.biz-notice i{width:8px;height:8px;border-radius:50%;background:currentColor;flex:none;animation:biz-pulse 1.6s ease-in-out infinite}
@keyframes biz-pulse{50%{opacity:.25}}
.biz-stats-sec{padding-top:clamp(8px,2cqi,16px)}
.biz-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin:0;border-radius:var(--rad);overflow:hidden;background:var(--line);gap:1px;box-shadow:0 0 0 1px var(--line)}
@container page (min-width:760px){.biz-stats{grid-template-columns:repeat(4,minmax(0,1fr))}}
.biz-stats div{background:var(--sf);padding:clamp(18px,4cqi,30px) 18px;display:grid;gap:4px;align-content:start}
.biz-stats dt{font:900 clamp(1.8rem,7cqi,2.8rem)/1 var(--fd);color:var(--ac);letter-spacing:-.02em}
.biz-stats dd{margin:0;color:var(--mu);font-size:.92rem;font-weight:600}
.s-editorial .biz-stats div,.s-soft .biz-stats div{text-align:center}
.s-editorial .biz-stats dt,.s-soft .biz-stats dt{font-weight:500}
.s-minimal .biz-stats{background:none;box-shadow:none;border-top:1px solid var(--tx);border-radius:0}
.s-minimal .biz-stats div{background:none;padding-inline:0}
.s-bold .biz-stats{box-shadow:8px 8px 0 var(--ac)}
.biz-order{display:grid;gap:22px;padding:clamp(22px,5cqi,44px);border-radius:calc(var(--rad) + 6px);background:var(--sf);box-shadow:inset 0 0 0 2px var(--ac)}
@container page (min-width:860px){.biz-order{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);align-items:start;gap:48px}}
.biz-order .biz-label{margin-bottom:12px}
.biz-order-hint{margin:0;color:var(--mu);font-size:1.02rem;max-width:40ch}
.biz-order-form{display:grid;gap:12px}
.biz-order-form .ip-btn.off{opacity:.5;pointer-events:none}
.s-editorial .biz-order .biz-label,.s-soft .biz-order .biz-label{text-align:left}
.s-editorial .biz-order .biz-label::after{margin-left:0}
.biz-how{list-style:none;margin:0;padding:0;display:grid;gap:12px;counter-reset:how}
@container page (min-width:760px){.biz-how{grid-template-columns:repeat(auto-fit,minmax(0,1fr))}}
.biz-how li{position:relative;display:grid;gap:8px;align-content:start;padding:22px;border-radius:var(--rad);background:var(--sf);box-shadow:inset 0 0 0 1px var(--line)}
.biz-how .k{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:var(--ac);color:var(--on);font:800 1.1rem/1 var(--fd)}
.biz-how b{font:800 1.15rem/1.2 var(--fd)}
.biz-how p{margin:0;color:var(--mu);font-size:.94rem}
.s-minimal .biz-how li{background:none;box-shadow:none;border-top:1px solid var(--line);border-radius:0;padding:18px 0}
.s-minimal .biz-how .k{background:none;color:var(--mu);width:auto;height:auto;justify-content:start;font:500 .82rem/1 var(--fb);letter-spacing:.1em}
.s-editorial .biz-how li,.s-soft .biz-how li{text-align:center;justify-items:center}
.biz-brands{overflow:hidden;border-block:1px solid var(--line);padding-block:18px;-webkit-mask:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.biz-brands .trk{display:flex;gap:clamp(28px,6cqi,56px);width:max-content;animation:biz-marq 38s linear infinite}
.biz-brands span{font:800 clamp(1.3rem,5cqi,2rem)/1 var(--fd);color:var(--tx);opacity:.82;white-space:nowrap;letter-spacing:-.01em}
.biz-brands span:nth-child(3n+2){color:var(--ac);opacity:1}
.s-editorial .biz-brands span,.s-soft .biz-brands span{font-weight:500;font-style:italic}
@keyframes biz-marq{to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.biz-brands .trk{animation:none;flex-wrap:wrap;width:auto;padding-inline:16px}.biz-notice i{animation:none}}
.biz-faq{display:grid;gap:10px;max-width:860px}
.s-editorial .biz-faq,.s-soft .biz-faq{margin-inline:auto}
.biz-faq details{border-radius:var(--rad);background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);padding:0 20px}
.biz-faq summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:14px;padding:18px 0;font:700 1.04rem/1.35 var(--fb)}
.biz-faq summary::-webkit-details-marker{display:none}
.biz-faq summary svg{flex:none;color:var(--ac);transition:transform .25s ease}
.biz-faq details[open] summary svg{transform:rotate(45deg)}
.biz-faq p{margin:0 0 18px;color:var(--mu)}
.s-minimal .biz-faq details{background:none;box-shadow:none;border-top:1px solid var(--line);border-radius:0;padding:0}
.biz-foot{display:grid;gap:8px;padding-block:56px 20px;color:var(--mu);font-size:.85rem;text-align:center}
.biz-foot p{margin:0}
.biz-foot .cr a{color:inherit}

/* the action bar slides in once the hero buttons scroll away, so it never covers them */
.biz-bar{left:0;right:0;bottom:0;z-index:40;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));background:color-mix(in srgb,var(--bg) 90%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-top:1px solid var(--line);transform:translateY(110%);transition:transform .35s cubic-bezier(.2,.8,.2,1);pointer-events:none}
.biz-bar.on{transform:none;pointer-events:auto}
.biz-bar .ip-btn{min-height:52px;padding:0 .4em;font-size:.9rem;border-radius:14px;white-space:nowrap;min-width:0;gap:.4em}
.biz-bar .ip-btn svg{flex:none;width:18px;height:18px}
@media (min-width:760px){.biz-bar{left:50%;right:auto;bottom:16px;width:min(560px,calc(100% - 32px));border:1px solid var(--line);border-radius:20px;padding:8px;transform:translate(-50%,140%)}.biz-bar.on{transform:translateX(-50%)}}
/* prime ("Signature"): the one layout we tune as our best. A grid-lit hero, numbers that count up,
   rows that stay on one line and swipe, moving chips, stacked reviews and details that fold shut. */
.ipr-biz.s-prime{--rad:16px;--hmax:5.8rem}
.s-prime .biz-grid{position:absolute;inset:0;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:34px 34px;opacity:.5;-webkit-mask:radial-gradient(ellipse at 50% 0%,#000 20%,transparent 72%);mask:radial-gradient(ellipse at 50% 0%,#000 20%,transparent 72%);pointer-events:none}
.s-prime .biz-mark{position:absolute;right:-4%;top:-10%;font:900 clamp(15rem,58cqi,32rem)/1 var(--fd);color:var(--sf);pointer-events:none;user-select:none}
.s-prime .biz-h1 .nm>span{display:inline-block;animation:biz-rise .6s ease both}
.s-prime .biz-h1 .nm>span:not(:last-child){margin-right:.22em}
.s-prime .biz-h1 .nm>span:nth-child(2){animation-delay:.12s}
.s-prime .biz-h1 .nm>span:nth-child(n+3){animation-delay:.24s}
@keyframes biz-rise{from{opacity:0;transform:translateY(14px)}}
.s-prime .biz-media{box-shadow:inset 0 0 0 1px var(--line)}
.s-prime .biz-label{font:700 .78rem/1.2 var(--fb);letter-spacing:.16em;text-transform:uppercase;color:var(--mu);margin:0 0 16px}
.s-prime .biz-order .biz-label{font:800 clamp(1.5rem,6.5cqi,2.4rem)/1.05 var(--fd);letter-spacing:-.01em;text-transform:none;color:inherit}
.s-prime .biz-stats{display:flex;overflow-x:auto;scrollbar-width:none;gap:0;background:none;border-radius:0;box-shadow:none;border-block:1px solid var(--line)}
.s-prime .biz-stats div{flex:1 0 9.5rem;background:none;box-shadow:1px 0 0 var(--line)}
.s-prime .biz-stats dt{font-variant-numeric:tabular-nums}
.s-prime .biz-svcs,.s-prime .biz-svcs.many{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:4px 2px 14px;margin-inline:-2px}
.s-prime .svc{flex:1 0 min(74cqi,17.5rem);scroll-snap-align:start}
.s-prime .biz-team{display:flex;overflow-x:auto;scrollbar-width:none;padding-bottom:6px}
.s-prime .tm{flex:1 0 15rem}
.s-prime .biz-stats::-webkit-scrollbar,.s-prime .biz-svcs::-webkit-scrollbar,.s-prime .biz-team::-webkit-scrollbar{display:none}
@property --biz-a{syntax:'<angle>';initial-value:0deg;inherits:false}
@keyframes biz-beam{to{--biz-a:360deg}}
.s-prime .svc.pop,.s-prime .biz-lead{border:2px solid transparent;box-shadow:none;background:linear-gradient(var(--sf),var(--sf)) padding-box,conic-gradient(from var(--biz-a),var(--line) 0 70%,var(--ac) 85%,var(--line) 100%) border-box;animation:biz-beam 3.2s linear infinite}
.s-prime .biz-lead{color:var(--tx)}
.s-prime .biz-lead .ip-field,.s-prime .biz-lead .ip-fine{color:var(--mu)}
.s-prime .biz-lead .ip-field input,.s-prime .biz-lead .ip-field select,.s-prime .biz-lead .ip-field textarea{background:var(--bg);color:var(--tx);border-color:var(--line)}
.biz-hlm{overflow:hidden;display:grid;gap:10px;-webkit-mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.biz-hlm .trk{display:flex;gap:10px;width:max-content;animation:biz-marq 30s linear infinite}
.biz-hlm .trk.rev{animation-direction:reverse;animation-duration:36s}
.biz-hlm span{padding:10px 18px;border-radius:999px;background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);font-weight:600;font-size:.94rem;white-space:nowrap}
.biz-hlm .rev span{background:none;box-shadow:inset 0 0 0 1px var(--ac)}
.biz-stack{display:grid;max-width:640px;padding-top:26px}
.biz-stack figure{grid-area:1/1;margin:0;padding:22px;border-radius:var(--rad);background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);display:grid;gap:10px;align-content:start;transform-origin:50% 0;transition:transform .5s cubic-bezier(.2,.9,.3,1.1),opacity .4s ease}
.biz-stack blockquote{margin:0;font-size:1.02rem}
.biz-stack figcaption{font-weight:700;font-size:.9rem;color:var(--mu)}
.biz-next{margin-top:14px;min-height:48px}
.s-prime .biz-find{grid-template-columns:minmax(0,1fr);gap:10px;max-width:860px}
.biz-fold{border-radius:var(--rad);background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);padding:0 20px}
.biz-fold[open]{padding-bottom:18px}
.biz-fold summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:14px;padding:18px 0;font:700 1.04rem/1.35 var(--fb)}
.biz-fold summary::-webkit-details-marker{display:none}
.biz-fold summary svg{flex:none;color:var(--ac);transition:transform .25s ease}
.biz-fold[open] summary svg{transform:rotate(45deg)}
@media (prefers-reduced-motion:reduce){.s-prime .biz-h1 .nm>span,.s-prime .svc.pop,.s-prime .biz-lead{animation:none}.biz-hlm .trk{animation:none;flex-wrap:wrap;width:auto;padding-inline:16px}.biz-stack figure{transition:none}}
`;
