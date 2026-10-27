import { useMemo, useState } from "react";
import type { RenderProps } from "../types";
import { themeVars } from "../themes";
import { fill, waShare, waTo } from "../util";
import { isStock } from "../stock";
import { BASE_CSS, Gallery, Icon, Img, MadeWith, fitWords, resolveImg, useConfetti, useMusicBox, useThemeFonts } from "../parts";
import { DIWALI_LANGS, langById, nameFromParam, type LangId } from "../festLang";
import { useSparks } from "../sparks";

const SPARK_COLOURS = ["#FFC83D", "#FF7A1A", "#FFF1B8", "#FF4D6D", "#7DF9FF"];

/** A clay diya: rim, oil, wick and a flame that glows once lit. */
function Diya({ i }: { i: number }) {
  return (
    <span className="diya" style={{ ["--i" as string]: i }}>
      <svg viewBox="0 0 80 100" aria-hidden="true">
        <defs>
          <linearGradient id={`clay${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D9732B" /><stop offset="1" stopColor="#7A300F" /></linearGradient>
          <radialGradient id={`fl${i}`} cx="50%" cy="70%" r="60%"><stop offset="0" stopColor="#FFF7D1" /><stop offset=".4" stopColor="#FFC83D" /><stop offset=".8" stopColor="#FF7A1A" /><stop offset="1" stopColor="#FF7A1A" stopOpacity="0" /></radialGradient>
        </defs>
        <ellipse className="glow" cx="40" cy="46" rx="34" ry="30" fill="#FFB84D" />
        <path className="flame" d="M40 14c8 10 11 18 8 27-2 6-6 8-8 8s-6-2-8-8c-3-9 0-17 8-27z" fill={`url(#fl${i})`} />
        <path d="M39 50h2v-6h-2z" fill="#2B1608" />
        <path d="M6 58c0 20 14 34 34 34s34-14 34-34z" fill={`url(#clay${i})`} />
        <ellipse cx="40" cy="58" rx="34" ry="8" fill="#E98A3A" />
        <ellipse cx="40" cy="58" rx="27" ry="5.5" fill="#4A2208" />
        <ellipse cx="40" cy="57" rx="22" ry="3.5" fill="#C98A2B" opacity=".85" />
        <path d="M14 68c8 8 44 8 52 0" stroke="#FFD08A" strokeWidth="2" fill="none" strokeDasharray="1 5" strokeLinecap="round" opacity=".7" />
      </svg>
    </span>
  );
}

const EMBLEM: Record<string, string> = { colours: "🎨", flower: "🌷", modak: "🐘", dandiya: "🪘", kite: "🪁", kalash: "🌾", lotus: "🪷", sun: "🪔", fireworks: "🎆" };

export default function Festival({ product, theme, content: c }: RenderProps) {
  useThemeFonts(theme);
  const o = product.opts;
  const [lit, setLit] = useState(false);
  const isDiya = o.art === "diya";
  const qs = useMemo(() => new URLSearchParams(typeof location !== "undefined" ? location.search : ""), []);
  const guest = nameFromParam(qs.get("to"));
  const [lang, setLang] = useState<LangId>(() => (isDiya ? langById(qs.get("lang")).id : "en"));
  const L = langById(lang);
  const { ref: sx, burst: spark } = useSparks(SPARK_COLOURS);
  const { ref: fx, burst } = useConfetti(o.art === "colours" ? ["#FF2E88", "#16C172", "#FFB703", "#3A86FF", "#8338EC"] : [theme.c.ac, theme.c.ac2, theme.c.ac3, "#FFFFFF"]);
  const music = useMusicBox(c.music === false ? "none" : "festive");
  const tap = (e: React.MouseEvent) => {
    if (!lit) music.start();
    setLit(true);
    if (isDiya) {
      spark(e.clientX, e.clientY, 80);
      [[-90, -110, 420], [100, -150, 760], [-30, -190, 1100]].forEach(([dx, dy, t]) => setTimeout(() => spark(e.clientX + dx, e.clientY + dy, 70), t));
      return;
    }
    const n = o.art === "colours" ? 220 : 120;
    burst(e.clientX, e.clientY, n, o.art === "colours" ? 2 : 1.3);
    if (o.art === "fireworks") setTimeout(() => burst(e.clientX + 60, e.clientY - 80, 90, 2), 380);
  };
  const vars = { ...c };
  const reply = isDiya ? L.back.replace("{sender}", String(c.sender ?? "").trim()) : fill(product.whatsapp.reply ?? "", vars);
  const greeting = isDiya ? L.head : o.greeting;
  // The sender's own words are never replaced; only a ready-made line follows the chosen language.
  const readyMade = isDiya && (product.steps[0].fields.find((f) => f.id === "message")?.suggestions ?? []).includes(String(c.message ?? "").trim());
  const message = isDiya && lang !== "en" && readyMade ? L.msg : c.message;
  const toName = guest || c.recipient;
  const photos = Array.isArray(c.photos) ? c.photos : [];
  const sty = theme.s;
  // The minimal design is a plain card; every other design shows the background picture.
  const cover = sty !== "minimal" && resolveImg(c.cover) ? c.cover : null;

  return (
    <div className={`ipr ipr-fest art-${o.art} s-${sty}` + (theme.dark ? " dark" : "") + (lit ? " lit" : "") + (cover ? " has-cover" : "")} style={themeVars(theme) as React.CSSProperties} onClick={o.art === "colours" ? tap : undefined}>
      <style>{BASE_CSS + CSS}</style>
      {cover && sty === "photo" && <div className="fest-bg" aria-hidden="true"><Img src={cover} alt="" sizes="100vw" eager /></div>}
      <canvas ref={fx} className="ip-fx" aria-hidden="true" />
      <canvas ref={sx} className="ip-fx" aria-hidden="true" />
      <div className="fest-page"><div className="fest-in">
      {cover && sty !== "photo" && <div className="fest-media" aria-hidden="true"><Img src={cover} alt="" sizes="(min-width: 860px) 50vw, 100vw" eager /></div>}
      <main className="ip-wrap fest">
        <button type="button" className="fest-art" onClick={o.art === "colours" ? undefined : tap} aria-label={o.tap}>
          {isDiya && <span className="diyas">{[0, 1, 2, 3, 4].map((i) => <Diya key={i} i={i} />)}</span>}
          {o.art === "flag" && (
            <svg viewBox="0 0 220 200" className="flag" aria-hidden="true">
              <rect x="20" y="10" width="6" height="190" rx="3" fill="#8B6B4A" />
              <g className="cloth"><rect x="26" y="20" width="150" height="33" fill="#FF9933" /><rect x="26" y="53" width="150" height="33" fill="#FFFFFF" /><rect x="26" y="86" width="150" height="33" fill="#138808" />
                <circle cx="101" cy="69.5" r="13" fill="none" stroke="#000080" strokeWidth="2" />{Array.from({ length: 24 }, (_, i) => <line key={i} x1="101" y1="69.5" x2={101 + 13 * Math.cos((i * Math.PI) / 12)} y2={69.5 + 13 * Math.sin((i * Math.PI) / 12)} stroke="#000080" strokeWidth=".8" />)}</g>
            </svg>
          )}
          {o.art === "moon" && <span className="moon"><span className="crescent" /><span className="lanterns">{[0, 1, 2].map((i) => <span key={i} className="lantern" style={{ ["--i" as string]: i }} />)}</span></span>}
          {o.art === "tree" && <span className="tree"><span className="tstar">★</span><span className="t t1" /><span className="t t2" /><span className="t t3" /><span className="trunk" />{[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="orn" style={{ ["--i" as string]: i }} />)}</span>}
          {o.art === "rakhi" && <span className="rakhi"><span className="thread" /><span className="bloom">{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <i key={i} style={{ ["--i" as string]: i }} />)}<b /></span></span>}
          {EMBLEM[o.art] && <span className="emb">{EMBLEM[o.art]}</span>}
        </button>
        <p className="fest-tap" aria-live="polite">{isDiya ? (lit ? L.done : L.tap) : lit ? o.tapDone : o.tap}</p>
        {isDiya && (
          <div className="fest-lang" role="group" aria-label="Language">
            {DIWALI_LANGS.map((l) => <button key={l.id} type="button" lang={l.id} aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>{l.label}</button>)}
          </div>
        )}

        <h1 className="fest-h" lang={lang} style={fitWords(greeting)}>{greeting}</h1>
        {toName && <p className="fest-to" lang={lang}>{isDiya ? L.dear.replace("{n}", toName) : `Dear ${toName},`}</p>}
        <p className="fest-msg" lang={lang}>{message}</p>
        {photos.length > 0 && <div className="fest-wall"><Gallery photos={photos} title={`Photos from ${c.sender}`} keyPrefix="fw" layout="strip" /></div>}
        {c.photo && <figure className="fest-photo"><Img src={c.photo} alt={`From ${c.sender}`} /></figure>}
        <p className="fest-from"><span>{isDiya ? L.from : "With love,"}</span>{c.sender}</p>

        <div className="fest-btns">
          <a className="ip-btn ip-wa" href={c.sender_whatsapp ? waTo(c.sender_whatsapp, reply) : waShare(reply)} target="_blank" rel="noopener noreferrer"><Icon.wa /> {isDiya ? L.btn : `Wish ${c.sender ? "them" : "back"} on WhatsApp`}</a>
        </div>
        {isStock(cover) && <p className="fest-cr">Background photo from <a href="https://unsplash.com/?utm_source=ezyourlife&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a></p>}
        <MadeWith product={product} />
      </main>
      </div></div>
    </div>
  );
}

const CSS = `
.ipr-fest{min-height:var(--ip-vh,100svh);--hmax:5rem;--rad:18px}
.fest-page{container:page/inline-size;position:relative;z-index:1}
.ipr-fest .ip-wrap{width:100%}
.fest-cr{margin:6px 0 0;font-size:.74rem;color:var(--mu)}
.fest-cr a{color:inherit}
/* photo: the picture fills the card, tinted with the design's colours */
.fest-bg{position:absolute;inset:0;overflow:hidden}
.fest-bg img{width:100%;height:100%;object-fit:cover}
.fest-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,color-mix(in srgb,var(--bg) 55%,transparent),color-mix(in srgb,var(--bg) 80%,transparent) 45%,var(--bg) 92%)}
.s-photo .fest-h{text-shadow:0 2px 24px rgba(0,0,0,.35)}
/* split: picture as a banner on phones, beside the greeting on wide screens */
.fest-media{position:relative;overflow:hidden}
.fest-media img{width:100%;height:100%;object-fit:cover}
.s-split .fest-media{height:min(38cqi,300px);min-height:170px;border-radius:0 0 var(--rad) var(--rad)}
.s-split.has-cover .fest{padding-top:20px}
@container page (min-width:860px){
  .s-split.has-cover .fest-in{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);min-height:var(--ip-vh,100svh)}
  .s-split .fest-media{height:var(--ip-vh,100svh);border-radius:0;position:sticky;top:0}
  .s-split.has-cover .fest{align-content:center}
}
/* editorial: framed card with an arched picture */
.s-editorial .fest-page::before{content:"";position:absolute;inset:12px;border:1.5px solid color-mix(in srgb,var(--ac) 45%,transparent);border-radius:16px;pointer-events:none}
.s-editorial .fest-media{width:min(52cqi,220px);aspect-ratio:3/4;margin:44px auto 0;border-radius:999px 999px 8px 8px;box-shadow:0 0 0 6px var(--bg),0 0 0 7px var(--line)}
.s-editorial.has-cover .fest{padding-top:18px}
.s-editorial.has-cover .fest-art{min-height:150px}
/* soft: a round picture with a glow */
.s-soft .fest-media{width:min(58cqi,240px);aspect-ratio:1;margin:40px auto 0;border-radius:50%;box-shadow:0 0 0 10px color-mix(in srgb,var(--ac) 18%,transparent),0 30px 50px -26px rgba(0,0,0,.5)}
.s-soft.has-cover .fest{padding-top:14px}
.s-soft.has-cover .fest-art{min-height:150px}
/* bold: a tilted print and big upright type */
.s-bold .fest-media{width:min(80cqi,420px);aspect-ratio:4/3;margin:40px auto 0;border-radius:10px;transform:rotate(-2.5deg);box-shadow:10px 10px 0 var(--ac2)}
.s-bold .fest-h{font-weight:900;text-transform:uppercase;letter-spacing:-.01em;font-size:min(var(--hmax),calc(92cqi / var(--fit)),13cqi)}
.s-bold.has-cover .fest-art{min-height:150px}
.ipr-fest::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.35;background:radial-gradient(circle at 15% 10%,color-mix(in srgb,var(--ac) 40%,transparent),transparent 40%),radial-gradient(circle at 85% 30%,color-mix(in srgb,var(--ac2) 35%,transparent),transparent 40%)}
.art-colours::before{opacity:.8;background:radial-gradient(circle at 10% 15%,rgba(255,46,136,.35),transparent 30%),radial-gradient(circle at 90% 20%,rgba(22,193,114,.3),transparent 30%),radial-gradient(circle at 20% 85%,rgba(255,183,3,.35),transparent 30%),radial-gradient(circle at 85% 80%,rgba(58,134,255,.3),transparent 30%)}
.fest{display:grid;justify-items:center;text-align:center;padding-block:44px 40px;gap:14px}
.fest-art{border:0;background:none;padding:0;cursor:pointer;min-height:220px;display:grid;place-items:center;width:100%;-webkit-tap-highlight-color:transparent}
.fest-tap{margin:0;font-size:.92rem;color:var(--mu);min-height:1.4em}
.fest-h{font:400 min(var(--hmax),calc(118cqi / var(--fit)),14cqi)/1.02 var(--fd);margin:8px 0 0;color:var(--ac);text-wrap:balance;overflow-wrap:normal;text-shadow:0 2px 0 color-mix(in srgb,var(--ac) 30%,transparent)}
.fest-to{font:700 1.7rem/1.1 var(--fh);margin:6px 0 0}
.fest-msg{font-size:clamp(1.1rem,4.6cqi,1.32rem);line-height:1.6;max-width:30ch;margin:4px 0 0;white-space:pre-line}
.fest-photo{margin:12px 0 0;padding:10px;background:var(--sf);border-radius:16px;box-shadow:0 20px 40px -24px rgba(0,0,0,.6);transform:rotate(-2deg);max-width:min(84cqi,340px)}
.fest-photo img{border-radius:10px;width:100%;aspect-ratio:4/3;object-fit:cover}
.fest-from{display:grid;gap:2px;font:700 clamp(1.8rem,7cqi,2.4rem)/1.1 var(--fh);margin:10px 0 0;color:var(--ac2)}
.fest-from span{font:500 .9rem/1 var(--fb);letter-spacing:.14em;text-transform:uppercase;color:var(--mu)}
.fest-btns{display:grid;gap:10px;width:min(100%,380px);margin-top:14px}
.diyas{display:flex;gap:clamp(8px,3cqi,18px);align-items:flex-end}
.diya{position:relative;width:clamp(52px,16cqi,76px);display:block}
.diya svg{display:block;width:100%;height:auto;overflow:visible}
.diya .flame{transform-box:fill-box;transform-origin:50% 100%;transform:scale(.15);opacity:0;transition:transform .5s,opacity .4s;transition-delay:calc(var(--i) * 160ms)}
.diya .glow{opacity:0;filter:blur(10px);transition:opacity .8s;transition-delay:calc(var(--i) * 160ms)}
.lit .diya .flame{opacity:1;transform:scale(1);filter:drop-shadow(0 0 8px rgba(255,200,61,.9))}
.lit .diya .glow{opacity:.5}
.fest-lang{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}
.fest-lang button{border:1.5px solid color-mix(in srgb,var(--ac) 50%,transparent);background:transparent;color:inherit;border-radius:999px;padding:6px 14px;font:600 .9rem var(--fb);cursor:pointer}
.fest-lang button[aria-pressed=true]{background:var(--ac);color:var(--on);border-color:var(--ac)}
.fest-wall{width:100%;max-width:520px}
.fest-wall img{filter:grayscale(1) brightness(.55) blur(3px);transition:filter 1.8s ease .3s}
.lit .fest-wall img{filter:none}
.flag{width:min(70cqi,240px)}
.flag .cloth{transform:translateY(130px);transition:transform 1.4s cubic-bezier(.2,.8,.2,1)}
.lit .flag .cloth{transform:none}
.moon{position:relative;width:min(70cqi,260px);height:220px}
.crescent{position:absolute;left:12%;top:6%;width:120px;height:120px;border-radius:50%;box-shadow:-22px 8px 0 0 var(--ac);transform:rotate(-20deg)}
.lanterns{position:absolute;right:4%;top:0;display:flex;gap:16px}
.lantern{position:relative;width:30px;height:46px;margin-top:calc(var(--i) * 26px + 30px);border-radius:8px;background:color-mix(in srgb,var(--ac) 50%,#000);box-shadow:inset 0 0 0 2px var(--ac);transition:background .5s,box-shadow .5s}
.lantern::before{content:"";position:absolute;left:50%;bottom:100%;width:1.5px;height:calc(var(--i) * 26px + 30px);background:var(--ac)}
.lit .lantern{background:#FFE7A0;box-shadow:inset 0 0 0 2px var(--ac),0 0 28px 6px rgba(255,214,120,.6)}
.tree{position:relative;width:200px;height:230px}
.tree .t{position:absolute;left:50%;transform:translateX(-50%);width:0;height:0;border-left:solid transparent;border-right:solid transparent;border-bottom:solid #1F7A4F}
.tree .t1{top:28px;border-width:0 50px 70px}.tree .t2{top:70px;border-width:0 72px 80px}.tree .t3{top:116px;border-width:0 96px 90px}
.tree .trunk{position:absolute;left:50%;bottom:0;width:26px;height:26px;transform:translateX(-50%);background:#6B4A2B}
.tree .tstar{position:absolute;left:50%;top:-6px;transform:translateX(-50%);font-size:44px;color:#777;transition:color .4s,text-shadow .4s;z-index:2}
.lit .tree .tstar{color:#F4D06F;text-shadow:0 0 24px #F4D06F}
.tree .orn{position:absolute;width:12px;height:12px;border-radius:50%;background:#666;left:calc(30% + (var(--i) * 13%) % 45%);top:calc(90px + (var(--i) * 23px) % 110px);transition:background .4s;transition-delay:calc(var(--i) * 90ms)}
.lit .tree .orn{background:var(--ac);box-shadow:0 0 10px var(--ac)}
.rakhi{position:relative;width:min(80cqi,300px);height:160px;display:grid;place-items:center}
.rakhi .thread{position:absolute;left:0;right:0;top:50%;height:6px;background:repeating-linear-gradient(90deg,var(--ac) 0 10px,var(--ac2) 10px 20px);border-radius:3px;transform:scaleX(.3);transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.lit .rakhi .thread{transform:none}
.rakhi .bloom{position:relative;width:110px;height:110px;transition:transform .6s cubic-bezier(.34,1.56,.64,1)}
.lit .rakhi .bloom{transform:rotate(45deg) scale(1.08)}
.rakhi .bloom i{position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px;border-radius:50% 50% 50% 0;background:var(--ac2);transform:rotate(calc(var(--i) * 45deg)) translate(26px)}
.rakhi .bloom b{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px;border-radius:50%;background:radial-gradient(circle,var(--ac3),var(--ac));box-shadow:0 0 0 4px #fff3}
.emb{font-size:min(36cqi,150px);line-height:1;transition:transform .6s cubic-bezier(.34,1.56,.64,1)}
.lit .emb{transform:scale(1.15) rotate(-6deg)}
@media (prefers-reduced-motion:no-preference){
  .lit .diya .flame{animation:fest-flick .2s ease-in-out infinite alternate}
  @keyframes fest-flick{to{transform:scale(.93,1.07)}}
  .art-tree::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(2px 2px at 20% 10%,#fff,transparent),radial-gradient(2px 2px at 60% 30%,#fff,transparent),radial-gradient(1.5px 1.5px at 80% 70%,#fff,transparent),radial-gradient(2px 2px at 35% 60%,#fff,transparent);background-size:200px 200px;animation:fest-snow 9s linear infinite;opacity:.7}
  @keyframes fest-snow{to{background-position:0 400px,40px 400px,-30px 400px,20px 400px}}
  .emb{animation:fest-bob 3s ease-in-out infinite}
  @keyframes fest-bob{50%{transform:translateY(-8px)}}
}
`;
