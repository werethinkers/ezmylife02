import { useEffect, useMemo, useState } from "react";
import { nameFromParam } from "../festLang";
import type { RenderProps } from "../types";
import { themeVars } from "../themes";
import { fill, fmtDate, gcalLink, mapsDir, mapsLink, t12, waTo } from "../util";
import { isStock } from "../stock";
import { BASE_CSS, Gallery, Icon, Img, LeadForm, MadeWith, fitWords, resolveImg, useRevealBar, useThemeFonts } from "../parts";
import { Backdrop, FlipCount, FormFold, SIG_CSS, sigClass, usePointerFx } from "../signature";

const ART: Record<string, string> = { rings: "💍", floral: "🌸", mic: "🎤", ribbon: "🎀", home: "🏡", baby: "🍼", diya: "🪔", balloon: "🎈", spark: "✦" };

export default function Event({ product, theme, content: c, mode, slug }: RenderProps) {
  useThemeFonts(theme);
  const o = product.opts;
  const when = c.date ? new Date(`${c.date}T${c.time || "00:00"}:00`) : null;
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  const left = when ? when.getTime() - now : 0;
  const vars = { ...c, product: product.name.toLowerCase() };
  const rsvpHref = c.rsvp_whatsapp ? waTo(c.rsvp_whatsapp, fill(product.whatsapp.rsvp, vars)) : null;
  const place = [c.venue, c.address].filter(Boolean).join(", ");
  const cal = gcalLink(String(c.hosts || product.name), c.date, c.time, place, c.tagline);
  const schedule = (Array.isArray(c.schedule) ? c.schedule : []).filter((s: { name?: string }) => s?.name);
  const gallery = (Array.isArray(c.gallery) ? c.gallery : []).filter((g: { photo?: string }) => resolveImg(g?.photo));
  const cover = resolveImg(c.cover) ? c.cover : gallery[0]?.photo;
  const sty = theme.s;
  const bar = useRevealBar<HTMLDivElement>();
  const prime = sty === "prime";
  const fxRef = usePointerFx<HTMLDivElement>();
  // "Send all" gives each guest their own link (?to=Rahul-Sharma), so the invitation greets them by name.
  const guest = useMemo(() => nameFromParam(typeof location !== "undefined" ? new URLSearchParams(location.search).get("to") : ""), []);
  const usesStock = isStock(cover) || gallery.some((g: { photo: string }) => isStock(g.photo));

  return (
    <div className={`ipr ipr-ev art-${o.art} s-${sty}` + (theme.dark ? " dark" : "") + sigClass(product.id, prime)} style={themeVars(theme) as React.CSSProperties}>
      <style>{BASE_CSS + CSS + SIG_CSS}</style>
      <div className="ev-page" ref={fxRef}>
      <header className={"ev-hero" + (prime ? " sig-hero" : "")}>
        {prime && <Backdrop id={product.id} />}
        {sty === "photo" && cover && <div className="ev-bg" aria-hidden="true"><Img src={cover} alt="" sizes="100vw" eager /></div>}
        <div className="ip-wrap ev-hero-in">
          {sty !== "photo" && cover && <div className="ev-media"><Img src={cover} alt={String(c.hosts ?? "")} sizes="(min-width: 860px) 45vw, 90vw" eager /></div>}
          <div className={"ev-copy" + (prime ? " sig-glass" : "")}>
            <span className="ev-art" aria-hidden="true">{ART[o.art]}</span>
            {guest && <p className="ev-kick ev-guest">Dear {guest}, you're invited</p>}
            <p className="ev-kick">{o.kicker}</p>
            <h1 className={"ev-h" + (prime ? " sig-h" : "")} style={fitWords(String(c.hosts ?? ""))}>{c.hosts}</h1>
            {c.tagline && <p className="ev-tag">{c.tagline}</p>}
            <div className="ev-rule" aria-hidden="true"><i /><b /><i /></div>
            {c.date && <p className="ev-date">{fmtDate(c.date)}{c.time ? ` · ${t12(c.time)}` : ""}</p>}
            {c.venue && <p className="ev-venue">{c.venue}</p>}
            {when && left > 0 && prime && <FlipCount to={when.getTime()} />}
            {when && left > 0 && !prime && (
              <div className="ev-count" aria-label="Countdown">
                {[[Math.floor(left / 86400000), "days"], [Math.floor(left / 3600000) % 24, "hours"], [Math.floor(left / 60000) % 60, "mins"]].map(([n, l]) => <div key={l}><b>{n}</b><span>{l}</span></div>)}
              </div>
            )}
            <div className="ev-actions" ref={bar.ref}>
              {rsvpHref && <a className="ip-btn ip-primary" href={rsvpHref} target="_blank" rel="noopener noreferrer"><Icon.wa /> {o.rsvpWord}</a>}
              {cal && <a className="ip-btn ip-ghost" href={cal} target="_blank" rel="noopener noreferrer"><Icon.cal /> Add to calendar</a>}
            </div>
          </div>
        </div>
      </header>

      {c.story && (
        <section className="ev-sec">
          <div className="ip-wrap">
            <p className="ev-label">{product.id === "wedding" ? "Our story" : "Details"}</p>
            <p className="ev-story">{c.story}</p>
            {c.dress_code && <p className="ev-dress"><b>Dress code</b> {c.dress_code}</p>}
          </div>
        </section>
      )}

      {schedule.length > 0 && (
        <section className="ev-sec">
          <div className="ip-wrap">
            <p className="ev-label">{product.steps.find((s) => s.fields.some((f) => f.id === "schedule"))?.title ?? "Programme"}</p>
            <ol className={"ev-line" + (prime ? " sig-row" : "")}>
              {schedule.map((s: { name: string; date?: string; time?: string; place?: string }, i: number) => (
                <li key={i} className={prime ? "sig-fx" : undefined}>
                  <span className="dot" aria-hidden="true" />
                  <div>
                    <b>{s.name}</b>
                    <span>{[s.date && fmtDate(s.date, { weekday: "short", day: "numeric", month: "short" }), s.time && t12(s.time)].filter(Boolean).join(" · ")}</span>
                    {s.place && <small>{s.place}</small>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {(c.venue || c.address) && (
        <section className="ev-sec">
          <div className="ip-wrap">
            <p className="ev-label">Venue</p>
            <a className={"ev-map" + (prime ? " sig-fx" : "")} href={mapsLink(c.maps_url, place)} target="_blank" rel="noopener noreferrer">
              <span className="pin" aria-hidden="true"><Icon.map /></span>
              <span><b>{c.venue}</b>{c.address && <small>{c.address}</small>}</span>
            </a>
            <a className="ip-btn ip-ghost ev-dir" href={c.maps_url ? mapsLink(c.maps_url, place) : mapsDir(place)} target="_blank" rel="noopener noreferrer"><Icon.nav /> Get directions</a>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="ev-sec">
          <div className="ip-wrap">
            <p className="ev-label">Gallery</p>
            <Gallery photos={gallery} title="Gallery" keyPrefix="e" />
          </div>
        </section>
      )}

      {(c.rsvp_form || rsvpHref) && (
        <section className="ev-sec">
          <div className="ip-wrap">
            <div className="ev-rsvp">
              <h2>Will you join us?</h2>
              {c.rsvp_form ? (
                <FormFold title="Send your RSVP" hint="Your name, number and how many are coming." icon={<Icon.check />}>
                  <LeadForm slug={slug} mode={mode} kind="rsvp" button="Send RSVP" ownerWa={c.rsvp_whatsapp} waTemplate={product.whatsapp.rsvp} vars={vars}
                    extra={{ id: "guests", label: "Guests (including you)", options: ["1", "2", "3", "4", "5", "6+"] }} messageLabel="Message for the hosts (optional)"
                    done={(n) => <p className="ev-thanks">Thank you, {n.split(" ")[0]}! {c.hosts} will be glad to see you.</p>} />
                </FormFold>
              ) : rsvpHref && <a className="ip-btn ip-primary" href={rsvpHref} target="_blank" rel="noopener noreferrer"><Icon.wa /> {o.rsvpWord}</a>}
            </div>
          </div>
        </section>
      )}

      <div className="ip-wrap ev-foot">
        {usesStock && <p className="ev-cr">Sample photos from <a href="https://unsplash.com/?utm_source=ezyourlife&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a></p>}
        <MadeWith product={product} />
      </div>
      </div>
      {rsvpHref && (
        <nav className={"ev-bar ip-fixed" + (bar.show ? " on" : "")} aria-hidden={!bar.show}>
          <a className="ip-btn ip-primary" href={rsvpHref} target="_blank" rel="noopener noreferrer" tabIndex={bar.show ? 0 : -1}><Icon.wa /> RSVP</a>
          {place && <a className="ip-btn ip-ghost" href={mapsLink(c.maps_url, place)} target="_blank" rel="noopener noreferrer" tabIndex={bar.show ? 0 : -1}><Icon.map /> Map</a>}
        </nav>
      )}
    </div>
  );
}

const CSS = `
.ipr-ev{padding-bottom:96px;--hmax:5.6rem;--rad:20px}
.ipr-ev.s-editorial{--rad:4px}.ipr-ev.s-soft{--rad:30px}.ipr-ev.s-minimal{--rad:4px}.ipr-ev.s-bold{--rad:10px}
.ipr-ev .ip-wrap{width:100%}
.ev-page{container:page/inline-size}
.ev-hero{position:relative;text-align:center;padding-block:clamp(48px,10cqi,104px) 40px;overflow:hidden}
.ev-hero .ip-wrap{max-width:1100px}
.ev-hero-in{display:grid;gap:clamp(24px,5cqi,48px);align-items:center;justify-items:center}
.ev-copy{display:grid;justify-items:center;width:100%;min-width:0;max-width:720px;container-type:inline-size}
.ev-media{position:relative;width:100%;border-radius:var(--rad);overflow:hidden;background:var(--sf);aspect-ratio:4/3;box-shadow:0 30px 60px -32px rgba(0,0,0,.5)}
.ev-media img{width:100%;height:100%;object-fit:cover}
.ev-art{display:block;font-size:42px;color:var(--ac);margin-bottom:10px}
.ev-kick{font:600 .78rem/1.3 var(--fb);letter-spacing:.24em;text-transform:uppercase;color:var(--mu);margin:0}
.ev-h{font:500 min(var(--hmax),calc(118cqi / var(--fit)),15cqi)/1.02 var(--fd);margin:14px 0 0;color:var(--ac);text-wrap:balance;overflow-wrap:normal;font-style:italic}
.ev-tag{font:400 clamp(1.1rem,4.6cqi,1.4rem)/1.3 var(--fd);margin:12px 0 0}
.ev-rule{display:flex;align-items:center;justify-content:center;gap:10px;margin:22px 0}
.ev-rule i{width:56px;height:1px;background:var(--ac)}
.ev-rule b{width:8px;height:8px;transform:rotate(45deg);background:var(--ac)}
.ev-date{font:700 1.05rem/1.4 var(--fb);margin:0;letter-spacing:.04em}
.ev-venue{margin:4px 0 0;color:var(--mu)}
.ev-count{display:inline-grid;grid-template-columns:repeat(3,minmax(70px,1fr));gap:8px;margin:26px auto 0}
.ev-count div{background:var(--sf);border-radius:calc(var(--rad) * .7);padding:12px 8px;box-shadow:inset 0 0 0 1.5px var(--line)}
.ev-count b{display:block;font:500 2rem/1 var(--fd);color:var(--ac);font-variant-numeric:tabular-nums}
.ev-count span{font-size:.74rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mu)}
.ev-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:26px;width:100%}
.ev-actions .ip-btn{flex:1 1 12rem;max-width:280px;min-height:50px;border-radius:calc(var(--rad) * .7 + 4px)}

/* editorial: printed card with a double frame and an arched photo */
.s-editorial .ev-hero::before{content:"";position:absolute;inset:14px;border:1.5px solid color-mix(in srgb,var(--ac) 45%,transparent);border-radius:20px;pointer-events:none}
.s-editorial .ev-hero::after{content:"";position:absolute;inset:22px;border:1px solid color-mix(in srgb,var(--ac) 25%,transparent);border-radius:14px;pointer-events:none}
.s-editorial .ev-media{width:min(70cqi,300px);aspect-ratio:3/4;border-radius:999px 999px 8px 8px;box-shadow:0 0 0 8px var(--bg),0 0 0 9px var(--line)}
.s-editorial .ev-hero-in{grid-template-columns:minmax(0,1fr)}

/* photo: the cover fills the screen */
.s-photo .ev-hero{min-height:min(calc(var(--ip-vh,100svh) * .96),900px);display:grid;align-items:end;padding-top:120px}
.s-photo .ev-bg{position:absolute;inset:0}
.s-photo .ev-bg img{width:100%;height:100%;object-fit:cover}
.s-photo .ev-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.5) 40%,rgba(0,0,0,.78))}
.s-photo .ev-hero::before{content:"";position:absolute;inset:14px;border:1px solid rgba(255,255,255,.45);border-radius:20px;pointer-events:none;z-index:1}
.s-photo .ev-copy{position:relative;z-index:2;color:#fff}
.s-photo .ev-h{color:#fff;text-shadow:0 2px 24px rgba(0,0,0,.4)}
.s-photo .ev-kick,.s-photo .ev-venue{color:rgba(255,255,255,.85)}
.s-photo .ev-art,.s-photo .ev-rule{color:#fff}.s-photo .ev-rule i,.s-photo .ev-rule b{background:#fff}
.s-photo .ev-count div{background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.s-photo .ev-count b{color:#fff}.s-photo .ev-count span{color:rgba(255,255,255,.8)}
.s-photo .ev-actions .ip-ghost{color:#fff;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.6);background:rgba(255,255,255,.08)}

/* split: photo beside the details on wide screens */
.s-split .ev-media{aspect-ratio:4/5;max-width:480px}
@container page (min-width:860px){
  .s-split .ev-hero-in{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  .s-split .ev-media{max-width:none}
}

/* bold: big upright type, tilted photo */
.s-bold .ev-h{font-size:min(var(--hmax),calc(90cqi / var(--fit)),13cqi);line-height:.95;font-style:normal;font-weight:900;text-transform:uppercase;letter-spacing:-.02em;color:var(--tx)}
.s-bold .ev-media{order:2;transform:rotate(-2deg);box-shadow:12px 12px 0 var(--ac2);max-width:560px;aspect-ratio:16/10}
.s-bold .ev-art{font-size:56px}
.s-bold .ev-count div{box-shadow:4px 4px 0 var(--tx),inset 0 0 0 2px var(--tx)}

/* soft: round photo with a glow */
.s-soft .ev-hero{background:radial-gradient(70% 50% at 50% 0%,color-mix(in srgb,var(--ac2) 35%,transparent),transparent 72%)}
.s-soft .ev-media{width:min(66cqi,300px);aspect-ratio:1;border-radius:50%;box-shadow:0 0 0 10px color-mix(in srgb,var(--ac) 16%,transparent),0 30px 60px -28px rgba(0,0,0,.45)}
.s-soft .ev-actions .ip-btn,.s-soft .ev-count div{border-radius:999px}
.s-soft .ev-count div{border-radius:22px}

/* minimal: left aligned, letterbox photo */
.s-minimal .ev-hero{text-align:left}
.s-minimal .ev-hero-in,.s-minimal .ev-copy{justify-items:start}
.s-minimal .ev-copy{max-width:none}
.s-minimal .ev-media{aspect-ratio:21/9;box-shadow:none;order:2}
.s-minimal .ev-h{font-style:normal;font-weight:700;letter-spacing:-.03em;color:var(--tx)}
.s-minimal .ev-art{display:none}
.s-minimal .ev-rule{justify-content:flex-start}
.s-minimal .ev-actions{justify-content:flex-start}

.ev-sec{padding-block:clamp(36px,8cqi,64px) 0}
.ev-sec .ip-wrap{max-width:820px}
.ev-label{font:700 .76rem/1 var(--fb);letter-spacing:.22em;text-transform:uppercase;color:var(--ac);margin:0 0 14px;text-align:center}
.ev-story{font:400 clamp(1.15rem,4.6cqi,1.35rem)/1.6 var(--fd);text-align:center;margin:0 auto;max-width:34ch;white-space:pre-line}
.ev-dress{text-align:center;margin:18px 0 0;color:var(--mu)}
.ev-dress b{display:inline-block;margin-right:8px;padding:4px 10px;border-radius:999px;background:var(--sf);color:var(--tx);font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;box-shadow:inset 0 0 0 1px var(--line)}
.ev-line{list-style:none;margin:0 auto;padding:0;max-width:480px;display:grid;gap:0}
@container page (min-width:820px){.ev-line{max-width:none;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}.ev-line li{grid-template-columns:minmax(0,1fr)!important;padding:18px!important;border-radius:var(--rad);background:var(--sf);box-shadow:inset 0 0 0 1.5px var(--line)}.ev-line li::before{display:none}}
.ev-line li{display:grid;grid-template-columns:28px minmax(0,1fr);gap:12px;padding-bottom:22px;position:relative}
.ev-line li::before{content:"";position:absolute;left:13px;top:18px;bottom:0;width:2px;background:var(--line)}
.ev-line li:last-child::before{display:none}
.ev-line .dot{width:28px;height:28px;border-radius:50%;background:var(--sf);box-shadow:inset 0 0 0 2px var(--ac);position:relative}
.ev-line .dot::after{content:"";position:absolute;inset:8px;border-radius:50%;background:var(--ac)}
.ev-line b{display:block;font:500 1.35rem/1.2 var(--fd)}
.ev-line span{display:block;font-weight:600;font-size:.92rem;margin-top:2px}
.ev-line small{display:block;color:var(--mu);font-size:.9rem}
.s-minimal .ev-label,.s-minimal .ev-story,.s-minimal .ev-dress{text-align:left}.s-minimal .ev-story{margin:0}
.ev-map{display:flex;gap:14px;align-items:center;padding:18px;border-radius:var(--rad);background:var(--sf);box-shadow:inset 0 0 0 1.5px var(--line);text-decoration:none;max-width:520px;margin:0 auto}
.ev-map .pin{flex:none;width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:var(--ac);color:var(--on)}
.ev-map b{display:block;font-size:1.05rem}
.ev-map small{display:block;color:var(--mu);font-size:.9rem;margin-top:2px}
.ev-dir{display:flex;max-width:520px;margin:10px auto 0}
.ev-rsvp{max-width:520px;margin:0 auto;padding:26px clamp(18px,5cqi,30px);border-radius:calc(var(--rad) + 2px);background:var(--sf);box-shadow:inset 0 0 0 1.5px var(--line);display:grid;gap:16px}
.ev-rsvp h2{font:500 clamp(1.8rem,7.5cqi,2.4rem)/1.1 var(--fd);margin:0;text-align:center}
.ev-thanks{font:500 1.3rem/1.4 var(--fd);margin:0;text-align:center}
.ev-foot{padding-bottom:20px}
.ev-cr{margin:36px 0 0;text-align:center;font-size:.78rem;color:var(--mu)}
.ev-cr a{color:inherit}
.ev-bar{left:0;right:0;bottom:0;z-index:40;display:grid;grid-template-columns:1.4fr 1fr;gap:8px;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));background:color-mix(in srgb,var(--bg) 88%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-top:1px solid var(--line);transform:translateY(130%);transition:transform .35s cubic-bezier(.2,.8,.2,1);pointer-events:none}
.ev-bar.on{transform:none;pointer-events:auto}
@media (min-width:760px){.ev-bar{left:50%;right:auto;transform:translate(-50%,160%);bottom:16px;width:min(460px,calc(100% - 32px));border:1px solid var(--line);border-radius:999px;padding:8px}.ev-bar.on{transform:translateX(-50%)}}
.ev-rsvp .ip-fold{background:var(--bg)}
/* prime ("Signature"): a backdrop picked per design, the details on a glass card, a flip countdown with seconds,
   the programme as one swipeable row of cards, and the RSVP folded shut until it is wanted. */
.ipr-ev.s-prime{--rad:22px;--hmax:5.2rem}
.s-prime .ev-hero{padding-block:clamp(40px,9cqi,96px) 48px}
.s-prime .ev-copy{padding:clamp(26px,7cqi,44px) clamp(18px,5cqi,40px);border-radius:28px}
.s-prime .ev-h{font-style:normal;font-weight:600;letter-spacing:-.01em}
.s-prime .ev-media{aspect-ratio:4/5;max-width:420px;border-radius:28px;box-shadow:0 0 0 1px var(--line),0 40px 80px -40px rgba(0,0,0,.6)}
@container page (min-width:860px){.s-prime .ev-hero-in{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)}.s-prime .ev-media{max-width:none}}
.s-prime .ev-actions .ip-btn{border-radius:999px}
.s-prime .ev-line{max-width:none}
.s-prime .ev-line li{grid-template-columns:minmax(0,1fr)!important;gap:10px;padding:18px!important;border-radius:var(--rad);background:var(--sf);box-shadow:inset 0 0 0 1px var(--line)}
.s-prime .ev-line li::before{display:none}
.s-prime .ev-line .dot{width:22px;height:22px}
.s-prime .ev-line .dot::after{inset:6px}
.s-prime .ev-map{max-width:640px}
.s-prime .ev-rsvp{background:none;box-shadow:none;padding:0;max-width:640px}
.s-prime .ev-rsvp .ip-fold{background:var(--sf)}
`;
