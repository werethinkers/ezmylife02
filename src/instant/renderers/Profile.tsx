import type { RenderProps } from "../types";
import { themeVars } from "../themes";
import { fill, fmtPhone, safeUrl, telHref, vcardBlob, waTo } from "../util";
import { BASE_CSS, Icon, Img, MadeWith, resolveImg, useThemeFonts } from "../parts";

export default function Profile({ product, theme, content: c }: RenderProps) {
  useThemeFonts(theme);
  const o = product.opts;
  const layout: "resume" | "portfolio" | "links" | "card" = o.layout;
  const photo = resolveImg(c.photo);
  const links = (Array.isArray(c.links) ? c.links : []).map((l: { label?: string; url?: string }) => ({ label: l?.label || l?.url, href: safeUrl(l?.url) })).filter((l: { href: string | null }) => l.href);
  const exp = (Array.isArray(c.experience) ? c.experience : []).filter((e: { role?: string }) => e?.role);
  const projects = (Array.isArray(c.projects) ? c.projects : []).filter((p: { title?: string }) => p?.title);
  const skills = String(c.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const wa = c.whatsapp ? waTo(c.whatsapp, fill(product.whatsapp.contact, c)) : null;
  const initials = String(c.name || "").split(" ").map((w: string) => w[0]).join("").slice(0, 2);
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

  return (
    <div className={"ipr ipr-pf lay-" + layout + (theme.dark ? " dark" : "")} style={themeVars(theme) as React.CSSProperties}>
      <style>{BASE_CSS + CSS}</style>
      <main className="ip-wrap pf">
        {layout === "card" ? (
          <section className="pf-cardwrap">
            <div className="pf-card">
              <div className="ph">{photo ? <img src={photo} alt={c.name} /> : <span>{initials}</span>}</div>
              <div className="inf">
                <p className="nm">{c.name}</p>
                {c.title && <p className="rl">{c.title}{c.company ? ` · ${c.company}` : ""}</p>}
                {c.phone && <p className="phn">{fmtPhone(c.phone)}</p>}
              </div>
              <span className="chip" aria-hidden="true" />
            </div>
          </section>
        ) : (
          <header className="pf-head">
            <div className="av">{photo ? <img src={photo} alt={c.name} /> : <span>{initials}</span>}</div>
            <div className="who">
              <h1>{c.name}</h1>
              {c.title && <p className="ttl">{c.title}{c.company ? ` · ${c.company}` : ""}</p>}
              {c.location && <p className="loc"><Icon.map /> {c.location}</p>}
            </div>
          </header>
        )}
        {layout === "card" && <h1 className="pf-cardname">{c.name}</h1>}
        {c.about && <p className="pf-about">{c.about}</p>}
        {actions}

        {links.length > 0 && (
          <section className="pf-sec">
            {layout !== "links" && <h2>Links</h2>}
            <div className={"pf-links" + (layout === "links" ? " big" : "")}>
              {links.map((l: { label: string; href: string }, i: number) => <a key={i} href={l.href} target="_blank" rel="noopener noreferrer"><Icon.link /><span>{l.label}</span></a>)}
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <section className="pf-sec">
            <h2>{o.workTitle ?? "Work"}</h2>
            <div className="pf-work">
              {projects.map((p: { title: string; note?: string; url?: string; photo?: string }, i: number) => {
                const href = safeUrl(p.url);
                const inner = (<>{p.photo ? <Img src={p.photo} alt={p.title} /> : <span className="ph" aria-hidden="true">{p.title.slice(0, 1)}</span>}<div><b>{p.title}</b>{p.note && <span>{p.note}</span>}</div></>);
                return href ? <a key={i} className="wk" href={href} target="_blank" rel="noopener noreferrer">{inner}</a> : <div key={i} className="wk">{inner}</div>;
              })}
            </div>
          </section>
        )}

        {exp.length > 0 && (
          <section className="pf-sec">
            <h2>{o.expTitle ?? "Experience"}</h2>
            <ol className="pf-exp">{exp.map((e: { role: string; org?: string; period?: string; note?: string }, i: number) => <li key={i}><div className="top"><b>{e.role}</b>{e.period && <span>{e.period}</span>}</div>{e.org && <p className="org">{e.org}</p>}{e.note && <p className="nt">{e.note}</p>}</li>)}</ol>
          </section>
        )}

        {skills.length > 0 && (
          <section className="pf-sec">
            <h2>{o.skillsTitle ?? "Skills"}</h2>
            <ul className="pf-skills">{skills.map((s) => <li key={s}>{s}</li>)}</ul>
          </section>
        )}
        <MadeWith product={product} />
      </main>
    </div>
  );
}

const CSS = `
.pf{padding-block:clamp(36px,8cqi,80px) 40px}
.pf-head{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
.pf-head .av{width:104px;height:104px;border-radius:50%;overflow:hidden;flex:none;background:var(--ac);display:grid;place-items:center;color:var(--on);font:600 2.2rem/1 var(--fd);box-shadow:0 0 0 4px var(--bg),0 0 0 6px var(--ac)}
.pf-head .av img{width:100%;height:100%;object-fit:cover}
.pf-head .who{min-width:0;flex:1 1 220px}
.pf-head h1{font:500 clamp(2.4rem,10cqi,3.8rem)/1 var(--fd);margin:0;text-wrap:balance}
.pf-head .ttl{margin:8px 0 0;font-size:1.08rem;color:var(--ac);font-weight:600}
.pf-head .loc{display:flex;align-items:center;gap:6px;margin:6px 0 0;color:var(--mu);font-size:.92rem}
.pf-head .loc svg{width:16px;height:16px}
.lay-links .pf-head{flex-direction:column;text-align:center}
.lay-links .pf-head .who{flex-basis:auto}
.lay-links .pf-head .loc{justify-content:center}
.pf-about{font-size:1.08rem;line-height:1.65;margin:22px 0 0;max-width:60ch}
.lay-links .pf-about{text-align:center;margin-inline:auto}
.pf-acts{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.pf-acts .ip-btn{flex:1 1 9rem;border-radius:14px}
.pf-sec{margin-top:clamp(40px,8cqi,64px)}
.pf-sec h2{font:500 clamp(1.6rem,6.4cqi,2.2rem)/1 var(--fd);margin:0 0 18px;padding-bottom:12px;border-bottom:1px solid var(--line)}
.pf-links{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}
.pf-links a{display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:14px;background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);text-decoration:none;font-weight:600;min-width:0}
.pf-links a span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pf-links svg{flex:none;color:var(--ac)}
.pf-links.big{grid-template-columns:minmax(0,1fr)}
.pf-links.big a{justify-content:center;min-height:62px;font-size:1.05rem;border-radius:999px;background:var(--ac);color:var(--on);box-shadow:none}
.pf-links.big a svg{color:inherit}
.pf-work{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.wk{display:grid;border-radius:18px;overflow:hidden;background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);text-decoration:none}
.wk img,.wk .ph{width:100%;aspect-ratio:4/3;object-fit:cover}
.wk .ph{display:grid;place-items:center;background:linear-gradient(135deg,var(--ac),var(--ac3));color:var(--on);font:500 3rem/1 var(--fd)}
.wk div{padding:14px 16px;display:grid;gap:4px}
.wk b{font-size:1.02rem}
.wk span{color:var(--mu);font-size:.9rem}
.pf-exp{list-style:none;margin:0;padding:0;display:grid;gap:18px}
.pf-exp li{padding-left:18px;border-left:2px solid var(--ac)}
.pf-exp .top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.pf-exp b{font-size:1.06rem}
.pf-exp .top span{color:var(--mu);font-size:.88rem;font-variant-numeric:tabular-nums}
.pf-exp .org{margin:2px 0 0;font-weight:600;color:var(--ac)}
.pf-exp .nt{margin:4px 0 0;color:var(--mu);font-size:.94rem}
.pf-skills{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.pf-skills li{padding:8px 14px;border-radius:999px;background:var(--sf);box-shadow:inset 0 0 0 1px var(--line);font-size:.92rem;font-weight:600}
.pf-cardwrap{display:grid;place-items:center;padding-block:10px 4px;perspective:1000px}
.pf-card{position:relative;width:min(90cqi,420px);aspect-ratio:1.586;border-radius:18px;overflow:hidden;display:grid;grid-template-columns:40% minmax(0,1fr);background:linear-gradient(140deg,var(--sf),var(--bg) 70%);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ac) 40%,transparent),0 40px 60px -28px rgba(0,0,0,.6);container-type:inline-size;transform:rotateX(6deg) rotateY(-8deg)}
.pf-card .ph{background:var(--ac);display:grid;place-items:center;color:var(--on);font:500 12cqw/1 var(--fd)}
.pf-card .ph img{width:100%;height:100%;object-fit:cover}
.pf-card .inf{display:grid;align-content:end;gap:4px;padding:8%;min-width:0}
.pf-card .nm{font:600 8.4cqw/1 var(--fd);margin:0;color:var(--ac)}
.pf-card .rl{font:600 3cqw/1.35 var(--fb);letter-spacing:.08em;text-transform:uppercase;color:var(--mu);margin:0}
.pf-card .phn{font:600 3.2cqw/1 var(--fb);margin:6px 0 0;font-variant-numeric:tabular-nums}
.pf-card .chip{position:absolute;right:7%;top:12%;width:13cqw;aspect-ratio:1.32;border-radius:5px;background:linear-gradient(135deg,#8C6C33,#E7CE96 45%,#B8914C)}
.pf-cardname{font:500 clamp(2rem,9cqi,3rem)/1 var(--fd);text-align:center;margin:26px 0 0}
.lay-card .pf-about{text-align:center;margin-inline:auto}
@media (prefers-reduced-motion:no-preference){.pf-card{animation:pf-in 1.2s cubic-bezier(.2,.8,.2,1) both}@keyframes pf-in{from{transform:translateY(40px) rotateX(40deg);opacity:0}}}
`;
