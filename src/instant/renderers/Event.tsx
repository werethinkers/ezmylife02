import { useEffect, useState } from "react";
import type { RenderProps } from "../types";
import { themeVars } from "../themes";
import { fill, fmtDate, gcalLink, mapsDir, mapsLink, t12, waTo } from "../util";
import { BASE_CSS, Icon, Img, LeadForm, MadeWith, useThemeFonts } from "../parts";

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
  const gallery = (Array.isArray(c.gallery) ? c.gallery : []).filter((g: { photo?: string }) => g?.photo);

  return (
    <div className={"ipr ipr-ev art-" + o.art} style={themeVars(theme) as React.CSSProperties}>
      <style>{BASE_CSS + CSS}</style>
      <header className="ev-hero">
        <div className="ip-wrap">
          <span className="ev-art" aria-hidden="true">{ART[o.art]}</span>
          <p className="ev-kick">{o.kicker}</p>
          <h1 className="ev-h">{c.hosts}</h1>
          {c.tagline && <p className="ev-tag">{c.tagline}</p>}
          <div className="ev-rule" aria-hidden="true"><i /><b /><i /></div>
          {c.date && <p className="ev-date">{fmtDate(c.date)}{c.time ? ` · ${t12(c.time)}` : ""}</p>}
          {c.venue && <p className="ev-venue">{c.venue}</p>}
          {when && left > 0 && (
            <div className="ev-count" aria-label="Countdown">
              {[[Math.floor(left / 86400000), "days"], [Math.floor(left / 3600000) % 24, "hours"], [Math.floor(left / 60000) % 60, "mins"]].map(([n, l]) => <div key={l}><b>{n}</b><span>{l}</span></div>)}
            </div>
          )}
          <div className="ev-actions">
            {rsvpHref && <a className="ip-btn ip-primary" href={rsvpHref} target="_blank" rel="noopener noreferrer"><Icon.wa /> {o.rsvpWord}</a>}
            {cal && <a className="ip-btn ip-ghost" href={cal} target="_blank" rel="noopener noreferrer"><Icon.cal /> Add to calendar</a>}
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
            <ol className="ev-line">
              {schedule.map((s: { name: string; date?: string; time?: string; place?: string }, i: number) => (
                <li key={i}>
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
            <a className="ev-map" href={mapsLink(c.maps_url, place)} target="_blank" rel="noopener noreferrer">
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
            <div className="ev-gal">{gallery.map((g: { photo: string; caption?: string }, i: number) => <figure key={i}><Img src={g.photo} alt={g.caption || `Photo ${i + 1}`} sampleKey={"e" + i} />{g.caption && <figcaption>{g.caption}</figcaption>}</figure>)}</div>
          </div>
        </section>
      )}

      {(c.rsvp_form || rsvpHref) && (
        <section className="ev-sec">
          <div className="ip-wrap">
            <div className="ev-rsvp">
              <h2>Will you join us?</h2>
              {c.rsvp_form ? (
                <LeadForm slug={slug} mode={mode} kind="rsvp" button="Send RSVP" ownerWa={c.rsvp_whatsapp} waTemplate={product.whatsapp.rsvp} vars={vars}
                  extra={{ id: "guests", label: "Guests (including you)", options: ["1", "2", "3", "4", "5", "6+"] }} messageLabel="Message for the hosts (optional)"
                  done={(n) => <p className="ev-thanks">Thank you, {n.split(" ")[0]}! {c.hosts} will be glad to see you.</p>} />
              ) : rsvpHref && <a className="ip-btn ip-primary" href={rsvpHref} target="_blank" rel="noopener noreferrer"><Icon.wa /> {o.rsvpWord}</a>}
            </div>
          </div>
        </section>
      )}

      <div className="ip-wrap ev-foot"><MadeWith product={product} /></div>
      {rsvpHref && (
        <nav className="ev-bar ip-fixed">
          <a className="ip-btn ip-primary" href={rsvpHref} target="_blank" rel="noopener noreferrer"><Icon.wa /> RSVP</a>
          {place && <a className="ip-btn ip-ghost" href={mapsLink(c.maps_url, place)} target="_blank" rel="noopener noreferrer"><Icon.map /> Map</a>}
        </nav>
      )}
    </div>
  );
}

const CSS = `
.ipr-ev{padding-bottom:96px}
.ev-hero{position:relative;text-align:center;padding-block:clamp(56px,12cqi,104px) 40px;overflow:hidden}
.ev-hero::before{content:"";position:absolute;inset:14px;border:1.5px solid color-mix(in srgb,var(--ac) 45%,transparent);border-radius:24px;pointer-events:none}
.ev-hero::after{content:"";position:absolute;inset:22px;border:1px solid color-mix(in srgb,var(--ac) 25%,transparent);border-radius:18px;pointer-events:none}
.ev-art{display:block;font-size:46px;color:var(--ac);margin-bottom:10px}
.ev-kick{font:600 .78rem/1.3 var(--fb);letter-spacing:.24em;text-transform:uppercase;color:var(--mu);margin:0}
.ev-h{font:500 clamp(2.8rem,13cqi,5.6rem)/1 var(--fd);margin:16px 0 0;color:var(--ac);text-wrap:balance;font-style:italic}
.ev-tag{font:400 clamp(1.1rem,4.6cqi,1.4rem)/1.3 var(--fd);margin:12px 0 0}
.ev-rule{display:flex;align-items:center;justify-content:center;gap:10px;margin:22px 0}
.ev-rule i{width:56px;height:1px;background:var(--ac)}
.ev-rule b{width:8px;height:8px;transform:rotate(45deg);background:var(--ac)}
.ev-date{font:700 1.05rem/1.4 var(--fb);margin:0;letter-spacing:.04em}
.ev-venue{margin:4px 0 0;color:var(--mu)}
.ev-count{display:inline-grid;grid-template-columns:repeat(3,minmax(70px,1fr));gap:8px;margin:26px auto 0}
.ev-count div{background:var(--sf);border-radius:14px;padding:12px 8px;box-shadow:inset 0 0 0 1.5px var(--line)}
.ev-count b{display:block;font:500 2rem/1 var(--fd);color:var(--ac);font-variant-numeric:tabular-nums}
.ev-count span{font-size:.74rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mu)}
.ev-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:26px}
.ev-actions .ip-btn{flex:1 1 13rem;max-width:280px}
.ev-sec{padding-block:clamp(36px,8cqi,64px) 0}
.ev-label{font:700 .76rem/1 var(--fb);letter-spacing:.22em;text-transform:uppercase;color:var(--ac);margin:0 0 14px;text-align:center}
.ev-story{font:400 clamp(1.15rem,4.6cqi,1.35rem)/1.6 var(--fd);text-align:center;margin:0 auto;max-width:34ch;white-space:pre-line}
.ev-dress{text-align:center;margin:18px 0 0;color:var(--mu)}
.ev-dress b{display:inline-block;margin-right:8px;padding:4px 10px;border-radius:999px;background:var(--sf);color:var(--tx);font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;box-shadow:inset 0 0 0 1px var(--line)}
.ev-line{list-style:none;margin:0 auto;padding:0;max-width:480px;display:grid;gap:0}
.ev-line li{display:grid;grid-template-columns:28px minmax(0,1fr);gap:12px;padding-bottom:22px;position:relative}
.ev-line li::before{content:"";position:absolute;left:13px;top:18px;bottom:0;width:2px;background:var(--line)}
.ev-line li:last-child::before{display:none}
.ev-line .dot{width:28px;height:28px;border-radius:50%;background:var(--sf);box-shadow:inset 0 0 0 2px var(--ac);position:relative}
.ev-line .dot::after{content:"";position:absolute;inset:8px;border-radius:50%;background:var(--ac)}
.ev-line b{display:block;font:500 1.35rem/1.2 var(--fd)}
.ev-line span{display:block;font-weight:600;font-size:.92rem;margin-top:2px}
.ev-line small{display:block;color:var(--mu);font-size:.9rem}
.ev-map{display:flex;gap:14px;align-items:center;padding:18px;border-radius:18px;background:var(--sf);box-shadow:inset 0 0 0 1.5px var(--line);text-decoration:none;max-width:520px;margin:0 auto}
.ev-map .pin{flex:none;width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:var(--ac);color:var(--on)}
.ev-map b{display:block;font-size:1.05rem}
.ev-map small{display:block;color:var(--mu);font-size:.9rem;margin-top:2px}
.ev-dir{display:flex;max-width:520px;margin:10px auto 0}
.ev-gal{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.ev-gal figure{margin:0;border-radius:14px;overflow:hidden;background:var(--sf)}
.ev-gal figure:first-child{grid-column:1/-1}
.ev-gal img{width:100%;aspect-ratio:4/3;object-fit:cover}
.ev-gal figcaption{padding:8px 12px;font-size:.85rem;color:var(--mu)}
.ev-rsvp{max-width:520px;margin:0 auto;padding:26px clamp(18px,5cqi,30px);border-radius:22px;background:var(--sf);box-shadow:inset 0 0 0 1.5px var(--line);display:grid;gap:16px}
.ev-rsvp h2{font:500 clamp(1.8rem,7.5cqi,2.4rem)/1.1 var(--fd);margin:0;text-align:center}
.ev-thanks{font:500 1.3rem/1.4 var(--fd);margin:0;text-align:center}
.ev-foot{padding-bottom:20px}
.ev-bar{left:0;right:0;bottom:0;z-index:40;display:grid;grid-template-columns:1.4fr 1fr;gap:8px;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));background:color-mix(in srgb,var(--bg) 88%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-top:1px solid var(--line)}
@media (min-width:760px){.ev-bar{left:50%;right:auto;transform:translateX(-50%);bottom:16px;width:min(460px,calc(100% - 32px));border:1px solid var(--line);border-radius:999px;padding:8px}}
`;
