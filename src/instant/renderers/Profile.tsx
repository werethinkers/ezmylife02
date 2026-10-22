import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { RenderProps } from "../types";
import { themeVars } from "../themes";
import { isStock } from "../stock";
import { fill, fmtPhone, safeUrl, telHref, vcardBlob, waTo } from "../util";
import { BASE_CSS, Icon, Img, Lightbox, MadeWith, fitWords, resolveImg, useThemeFonts } from "../parts";

type Project = { title: string; note?: string; url?: string; photo?: string };

export default function Profile({ product, theme, content: c }: RenderProps) {
  useThemeFonts(theme);
  const o = product.opts;
  const layout: "resume" | "portfolio" | "links" | "card" = o.layout;
  const sty = theme.s;
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const photo = resolveImg(c.photo);
  const links = (Array.isArray(c.links) ? c.links : []).map((l: { label?: string; url?: string }) => ({ label: l?.label || l?.url, href: safeUrl(l?.url) })).filter((l: { href: string | null }) => l.href);
  const exp = (Array.isArray(c.experience) ? c.experience : []).filter((e: { role?: string }) => e?.role);
  const projects: Project[] = (Array.isArray(c.projects) ? c.projects : []).filter((p: { title?: string }) => p?.title);
  const shots = projects.filter((p) => resolveImg(p.photo)).map((p) => ({ photo: p.photo as string, caption: p.note ? `${p.title} · ${p.note}` : p.title }));
  const skills = String(c.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const wa = c.whatsapp ? waTo(c.whatsapp, fill(product.whatsapp.contact, c)) : null;
  const initials = String(c.name || "").split(" ").map((w: string) => w[0]).join("").slice(0, 2);
  const usesStock = isStock(c.photo) || projects.some((p) => isStock(p.photo));
  const saveContact = () => {
    const url = URL.createObjectURL(vcardBlob(c));
    const a = document.createElement("a"); a.href = url; a.download = `${String(c.name || "contact").replace(/\s+/g, "-").toLowerCase()}.vcf`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const actions = (
    <div className="pf-acts">
      {layout === "card" ? <button type="button" className="ip-btn ip-primary" onClick={saveContact}><Icon.user /> {o.cta}</button>
        : wa ? <a className="ip-btn ip-primary" href={wa} target="_blank" rel="noopener noreferrer"><Icon.wa /> {o.cta}</a> : null}
      {wa && layout === "card" && <a className="ip-btn ip-wa" href={wa} target="_blank" rel="noopener noreferrer"><Icon.wa /> WhatsApp</a>}
      {c.phone && <a className="ip-btn ip-ghost" href={telHref(c.phone)}><Icon.phone /> Call</a>}
      {c.email && <a className="ip-btn ip-ghost" href={`mailto:${c.email}`}><Icon.mail /> Email</a>}
      {layout !== "card" && <button type="button" className="ip-btn ip-ghost" onClick={saveContact}><Icon.user /> Save contact</button>}
    </div>
  );
  const portrait = <div className="pf-por">{photo ? <Img src={c.photo} alt={c.name} sizes="(min-width: 760px) 40vw, 90vw" eager /> : <span>{initials}</span>}</div>;

  const linkList = links.length > 0 && (
    <section className="pf-sec">
      {layout !== "links" && <h2><span>Links</span></h2>}
      <div className={"pf-links" + (layout === "links" ? " big" : "")}>
        {links.map((l: { label: string; href: string }, i: number) => <a key={i} href={l.href} target="_blank" rel="noopener noreferrer"><Icon.link /><span>{l.label}</span></a>)}
      </div>
    </section>
  );
  const work = projects.length > 0 && (
    <section className="pf-sec">
      <h2><span>{o.workTitle ?? "Work"}</span></h2>
      <div className={"pf-work" + (projects.length === 1 ? " one" : "")}>
        {projects.map((p, i) => {
          const href = safeUrl(p.url);
          const ph = resolveImg(p.photo);
          const at = ph ? shots.findIndex((s) => s.photo === p.photo) : -1;
          return (
            <article key={i} className="wk">
              {ph ? <button type="button" className="wk-img" onClick={() => setOpen(at)} aria-label={`Open photo: ${p.title}`}><Img src={p.photo} alt={p.title} sizes="(min-width: 760px) 33vw, 90vw" /></button>
                : <span className="wk-img ph" aria-hidden="true">{p.title.slice(0, 1)}</span>}
              <div className="wk-t">
                <b>{p.title}</b>{p.note && <span>{p.note}</span>}
                {href && <a href={href} target="_blank" rel="noopener noreferrer">View <Icon.link /></a>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
  const expList = exp.length > 0 && (
    <section className="pf-sec">
      <h2><span>{o.expTitle ?? "Experience"}</span></h2>
      <ol className="pf-exp">{exp.map((e: { role: string; org?: string; period?: string; note?: string }, i: number) => <li key={i}><div className="top"><b>{e.role}</b>{e.period && <span>{e.period}</span>}</div>{e.org && <p className="org">{e.org}</p>}{e.note && <p className="nt">{e.note}</p>}</li>)}</ol>
    </section>
  );
  const skillList = skills.length > 0 && (
    <section className="pf-sec">
      <h2><span>{o.skillsTitle ?? "Skills"}</span></h2>
      <ul className="pf-skills">{skills.map((s) => <li key={s}>{s}</li>)}</ul>
    </section>
  );

  return (
    <div ref={root} className={`ipr ipr-pf lay-${layout} s-${sty}` + (theme.dark ? " dark" : "")} style={themeVars(theme) as React.CSSProperties}>
      <style>{BASE_CSS + CSS}</style>
      <div className="pf-page">
        {layout === "card" ? (
          <div className="ip-wrap pf-top">
            <section className="pf-cardwrap">
              <div className="pf-card">
                <div className="ph">{photo ? <Img src={c.photo} alt={c.name} sizes="200px" eager /> : <span>{initials}</span>}</div>
                <div className="inf">
                  <p className="nm">{c.name}</p>
                  {c.title && <p className="rl">{c.title}{c.company ? ` · ${c.company}` : ""}</p>}
                  {c.phone && <p className="phn">{fmtPhone(c.phone)}</p>}
                </div>
                <span className="chip" aria-hidden="true" />
              </div>
            </section>
            <h1 className="pf-cardname">{c.name}</h1>
            {c.title && <p className="pf-cardrole">{c.title}{c.company ? ` · ${c.company}` : ""}</p>}
            {c.about && <p className="pf-about">{c.about}</p>}
            {actions}
          </div>
        ) : (
          <header className="pf-head">
            <div className="ip-wrap pf-head-in">
              {portrait}
              <div className="pf-who">
                {c.location && <p className="pf-loc"><Icon.map /> {c.location}</p>}
                <h1 className="pf-h" style={fitWords(String(c.name ?? ""))}>{c.name}</h1>
                {c.title && <p className="pf-ttl">{c.title}{c.company ? ` · ${c.company}` : ""}</p>}
                {c.about && <p className="pf-about">{c.about}</p>}
                {actions}
              </div>
            </div>
          </header>
        )}

        <main className="ip-wrap pf-body">
          {layout === "links" || layout === "card" ? <>{linkList}{work}{expList}{skillList}</> : (
            <div className="pf-cols">
              <div className="pf-main">{work}{expList}</div>
              <aside className="pf-side">{skillList}{linkList}</aside>
            </div>
          )}
          {usesStock && <p className="pf-cr">Sample photos from <a href="https://unsplash.com/?utm_source=ezyourlife&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a></p>}
          <MadeWith product={product} />
        </main>
      </div>
      {open !== null && root.current && createPortal(<Lightbox photos={shots} start={open} title={o.workTitle ?? "Work"} onClose={() => setOpen(null)} keyPrefix="pf" />, root.current)}
    </div>
  );
}

const CSS = `
.ipr-pf{--hmax:4.2rem;--rad:18px}
.ipr-pf.s-editorial{--rad:4px}.ipr-pf.s-soft{--rad:28px}.ipr-pf.s-minimal{--rad:6px}.ipr-pf.s-bold{--rad:10px}
.ipr-pf .ip-wrap{max-width:1080px;width:100%}
.ipr-pf.lay-links .ip-wrap,.ipr-pf.lay-card .ip-wrap{max-width:600px}
.pf-page{container:page/inline-size}
.pf-head{position:relative;padding-block:clamp(32px,8cqi,88px) 8px;overflow:hidden}
.pf-head-in{display:grid;gap:clamp(20px,5cqi,48px);align-items:center}
.pf-who{display:grid;gap:10px;min-width:0;width:100%;container-type:inline-size}
.pf-por{position:relative;overflow:hidden;background:var(--ac);color:var(--on);display:grid;place-items:center;font:600 2.4rem/1 var(--fd)}
.pf-por img{width:100%;height:100%;object-fit:cover;object-position:50% 25%}
.pf-loc{display:flex;align-items:center;gap:6px;margin:0;color:var(--mu);font-size:.9rem;font-weight:600}
.pf-loc svg{width:16px;height:16px;color:var(--ac)}
.pf-h{font:500 min(var(--hmax),calc(122cqi / var(--fit)),15cqi)/1 var(--fd);margin:0;text-wrap:balance;overflow-wrap:normal;letter-spacing:-.01em}
.pf-ttl{margin:0;font-size:1.08rem;color:var(--ac);font-weight:700}
.pf-about{font-size:1.06rem;line-height:1.65;margin:6px 0 0;max-width:60ch;color:var(--tx)}
.pf-acts{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.pf-acts .ip-btn{flex:1 1 8rem;max-width:230px;min-height:48px;border-radius:calc(var(--rad) * .7 + 4px);white-space:nowrap}
.pf-acts>.ip-btn:first-child{flex-basis:100%;max-width:none}
@container (min-width:560px){.pf-acts>.ip-btn:first-child{flex-basis:8rem;max-width:230px}}

/* minimal: small portrait beside the name */
.s-minimal .pf-por{width:96px;height:96px;border-radius:50%;font-size:2rem}
@container page (min-width:760px){.s-minimal .pf-head-in{grid-template-columns:auto minmax(0,1fr);align-items:start}.s-minimal .pf-por{width:132px;height:132px}}

/* split: portrait as a tall panel */
.s-split .pf-por{aspect-ratio:4/5;width:100%;max-width:420px;border-radius:var(--rad);box-shadow:0 30px 60px -30px rgba(0,0,0,.55)}
.s-split .pf-por::after{content:"";position:absolute;inset:auto -10% -10% auto;width:45%;aspect-ratio:1;background:var(--ac2);border-radius:50%;opacity:.35;mix-blend-mode:multiply}
@container page (min-width:760px){.s-split .pf-head-in{grid-template-columns:minmax(0,5fr) minmax(0,7fr)}.s-split .pf-por{max-width:none}}

/* editorial: centred, arched portrait */
.s-editorial .pf-head-in,.lay-links .pf-head-in{justify-items:center;text-align:center}
.s-editorial .pf-who,.lay-links .pf-who{justify-items:center}
.s-editorial .pf-acts,.lay-links .pf-acts{justify-content:center}
.s-editorial .pf-por{width:min(62cqi,260px);aspect-ratio:3/4;border-radius:999px 999px 6px 6px;box-shadow:0 0 0 8px var(--bg),0 0 0 9px var(--line)}
.s-editorial .pf-h{font-weight:400;font-style:italic}

/* soft: blob portrait with a halo */
.s-soft .pf-head{background:radial-gradient(70% 55% at 50% 0%,color-mix(in srgb,var(--ac2) 32%,transparent),transparent 72%)}
.s-soft .pf-head-in{justify-items:center;text-align:center}
.s-soft .pf-who{justify-items:center}
.s-soft .pf-acts{justify-content:center}
.s-soft .pf-por{width:min(56cqi,230px);aspect-ratio:1;border-radius:46% 54% 42% 58%/55% 45% 55% 45%;box-shadow:0 0 0 10px color-mix(in srgb,var(--ac) 18%,transparent)}
.s-soft .pf-acts .ip-btn{border-radius:999px}

/* bold: huge name, offset portrait */
.s-bold .pf-h{font-weight:900;text-transform:uppercase;letter-spacing:-.02em;line-height:.92}
.s-bold .pf-ttl{display:inline-block;justify-self:start;background:var(--ac);color:var(--on);padding:6px 12px;border-radius:6px;font-size:.95rem}
.s-bold .pf-por{width:min(64cqi,300px);aspect-ratio:1;border-radius:var(--rad);box-shadow:12px 12px 0 var(--ac2);transform:rotate(-2deg)}
@container page (min-width:760px){.s-bold .pf-head-in{grid-template-columns:minmax(0,1fr) auto}.s-bold .pf-por{order:2;width:300px}}

/* photo: full-bleed portrait with the name over it */
.s-photo .pf-head{padding:0;min-height:min(calc(var(--ip-vh,100svh) * .86),760px);display:grid;align-items:end}
.s-photo .pf-por{position:absolute;inset:0;font-size:7rem}
.s-photo .pf-por::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,rgba(0,0,0,.35) 55%,rgba(0,0,0,.82))}
.s-photo .pf-head-in{position:static;padding-block:40px 34px}
.s-photo .pf-who{position:relative;z-index:1;color:#fff}
.s-photo .pf-h,.s-photo .pf-about{color:#fff}
.s-photo .pf-loc{color:rgba(255,255,255,.85)}.s-photo .pf-loc svg{color:#fff}
.s-photo .pf-ttl{color:var(--ac2)}
.s-photo .pf-acts .ip-ghost{color:#fff;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.6);background:rgba(255,255,255,.08)}
.s-photo.lay-links .pf-head-in{justify-items:center}
.lay-links .pf-head-in{grid-template-columns:minmax(0,1fr)!important}
.lay-links .pf-por{order:0!important}
.lay-links .pf-ttl{justify-self:center!important}

.pf-body{padding-bottom:40px}
.pf-cols{display:grid;gap:0 56px}
@container page (min-width:900px){.pf-cols{grid-template-columns:minmax(0,1.7fr) minmax(0,1fr)}.pf-side .pf-links{grid-template-columns:minmax(0,1fr)}}
.pf-sec{margin-top:clamp(40px,8cqi,64px)}
.pf-sec h2{font:500 clamp(1.5rem,6cqi,2.1rem)/1.1 var(--fd);margin:0 0 18px;padding-bottom:12px;border-bottom:1px solid var(--line)}
.s-bold .pf-sec h2{font-weight:900;text-transform:uppercase;border-bottom:4px solid var(--tx)}
.s-editorial .pf-sec h2{text-align:center;border:0;position:relative;font-style:italic}
.s-editorial .pf-sec h2 span{background:var(--bg);padding-inline:14px;position:relative}
.s-editorial .pf-sec h2::before{content:"";position:absolute;left:0;right:0;top:45%;border-top:1px solid var(--line)}
.s-minimal .pf-sec h2{font:700 .8rem/1 var(--fb);letter-spacing:.2em;text-transform:uppercase;color:var(--mu)}
.pf-links{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}
.pf-links a{display:flex;align-items:center;gap:10px;padding:14px 16px;min-height:52px;border-radius:calc(var(--rad) * .7 + 2px);background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);text-decoration:none;font-weight:600;min-width:0;transition:transform .15s}
.pf-links a:hover{transform:translateY(-2px)}
.pf-links a span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pf-links svg{flex:none;color:var(--ac)}
.pf-links.big{grid-template-columns:minmax(0,1fr);gap:12px}
.pf-links.big a{justify-content:center;min-height:62px;font-size:1.05rem;background:var(--ac);color:var(--on);box-shadow:none;border-radius:calc(var(--rad) * .8 + 6px)}
.s-soft .pf-links.big a,.s-photo .pf-links.big a{border-radius:999px}
.s-bold .pf-links.big a{box-shadow:5px 5px 0 var(--tx)}
.s-minimal .pf-links.big a{background:transparent;color:var(--tx);box-shadow:inset 0 0 0 1.5px var(--tx)}
.pf-links.big a svg{color:inherit}
.pf-work{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}
@container (min-width:520px){.pf-work{grid-template-columns:repeat(2,minmax(0,1fr))}.pf-work.one{grid-template-columns:minmax(0,1fr)}}
.wk{display:grid;align-content:start;border-radius:var(--rad);overflow:hidden;background:var(--sf);box-shadow:inset 0 0 0 1px var(--line)}
.wk-img{display:block;appearance:none;border:0;padding:0;margin:0;width:100%;aspect-ratio:4/3;overflow:hidden;cursor:zoom-in;background:var(--line)}
.wk-img img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
.wk-img:hover img{transform:scale(1.04)}
.wk-img.ph{display:grid;place-items:center;background:linear-gradient(135deg,var(--ac),var(--ac3));color:var(--on);font:500 3rem/1 var(--fd);cursor:default}
.wk-t{padding:14px 16px 16px;display:grid;gap:4px}
.wk-t b{font-size:1.04rem}
.wk-t span{color:var(--mu);font-size:.9rem}
.wk-t a{justify-self:start;display:inline-flex;align-items:center;gap:6px;margin-top:6px;font-weight:700;font-size:.9rem;color:var(--ac);text-decoration:none}
.wk-t a svg{width:15px;height:15px}
.pf-exp{list-style:none;margin:0;padding:0;display:grid;gap:18px}
.pf-exp li{padding-left:18px;border-left:2px solid var(--ac)}
.pf-exp .top{display:flex;justify-content:space-between;gap:4px 12px;flex-wrap:wrap}
.pf-exp b{font-size:1.06rem}
.pf-exp .top span{color:var(--mu);font-size:.88rem;font-variant-numeric:tabular-nums}
.pf-exp .org{margin:2px 0 0;font-weight:600;color:var(--ac)}
.pf-exp .nt{margin:4px 0 0;color:var(--mu);font-size:.94rem}
.pf-skills{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.pf-skills li{padding:8px 14px;border-radius:999px;background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);font-size:.92rem;font-weight:600}
.s-bold .pf-skills li{border-radius:6px;background:var(--tx);color:var(--bg);box-shadow:none}
.pf-cr{margin:36px 0 0;text-align:center;font-size:.78rem;color:var(--mu)}
.pf-cr a{color:inherit}

.pf-top{padding-block:clamp(32px,8cqi,72px) 0;display:grid;justify-items:center;text-align:center}
.pf-top .pf-acts{justify-content:center;width:100%}
.pf-cardwrap{display:grid;place-items:center;padding-block:10px 4px;perspective:1000px;width:100%}
.pf-card{position:relative;width:min(92cqi,440px);aspect-ratio:1.586;border-radius:18px;overflow:hidden;display:grid;grid-template-columns:40% minmax(0,1fr);background:linear-gradient(140deg,var(--sf),var(--bg) 70%);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ac) 40%,transparent),0 40px 60px -28px rgba(0,0,0,.6);container-type:inline-size;transform:rotateX(6deg) rotateY(-8deg)}
.s-soft .pf-card{border-radius:28px}.s-editorial .pf-card,.s-minimal .pf-card{border-radius:6px}
.s-bold .pf-card{box-shadow:10px 10px 0 var(--ac2),inset 0 0 0 2px var(--tx)}
.pf-card .ph{background:var(--ac);display:grid;place-items:center;color:var(--on);font:500 12cqw/1 var(--fd);overflow:hidden}
.pf-card .ph img{width:100%;height:100%;object-fit:cover;object-position:50% 25%}
.pf-card .inf{display:grid;align-content:end;gap:4px;padding:8%;min-width:0}
.pf-card .nm{font:600 8.4cqw/1 var(--fd);margin:0;color:var(--ac)}
.pf-card .rl{font:600 3cqw/1.35 var(--fb);letter-spacing:.08em;text-transform:uppercase;color:var(--mu);margin:0}
.pf-card .phn{font:600 3.2cqw/1 var(--fb);margin:6px 0 0;font-variant-numeric:tabular-nums}
.pf-card .chip{position:absolute;right:7%;top:12%;width:13cqw;aspect-ratio:1.32;border-radius:5px;background:linear-gradient(135deg,#8C6C33,#E7CE96 45%,#B8914C)}
.pf-cardname{font:500 clamp(2rem,9cqi,3rem)/1 var(--fd);margin:30px 0 0}
.pf-cardrole{margin:8px 0 0;color:var(--ac);font-weight:700}
.lay-card .pf-about{margin-top:14px}
@media (prefers-reduced-motion:no-preference){.pf-card{animation:pf-in 1.2s cubic-bezier(.2,.8,.2,1) both}@keyframes pf-in{from{transform:translateY(40px) rotateX(40deg);opacity:0}}}
`;
