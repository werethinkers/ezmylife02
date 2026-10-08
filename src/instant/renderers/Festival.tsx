import { useState } from "react";
import type { RenderProps } from "../types";
import { themeVars } from "../themes";
import { fill, waShare, waTo } from "../util";
import { BASE_CSS, Icon, Img, MadeWith, useConfetti, useMusicBox, useThemeFonts } from "../parts";

const EMBLEM: Record<string, string> = { colours: "🎨", flower: "🌷", modak: "🐘", dandiya: "🪘", kite: "🪁", kalash: "🌾", lotus: "🪷", sun: "🪔", fireworks: "🎆" };

export default function Festival({ product, theme, content: c }: RenderProps) {
  useThemeFonts(theme);
  const o = product.opts;
  const [lit, setLit] = useState(false);
  const { ref: fx, burst } = useConfetti(o.art === "colours" ? ["#FF2E88", "#16C172", "#FFB703", "#3A86FF", "#8338EC"] : [theme.c.ac, theme.c.ac2, theme.c.ac3, "#FFFFFF"]);
  const music = useMusicBox(c.music === false ? "none" : "festive");
  const tap = (e: React.MouseEvent) => {
    if (!lit) music.start();
    setLit(true);
    const n = o.art === "colours" ? 220 : 120;
    burst(e.clientX, e.clientY, n, o.art === "colours" ? 2 : 1.3);
    if (o.art === "fireworks") setTimeout(() => burst(e.clientX + 60, e.clientY - 80, 90, 2), 380);
  };
  const vars = { ...c };
  const reply = fill(product.whatsapp.reply ?? "", vars);

  return (
    <div className={"ipr ipr-fest art-" + o.art + (lit ? " lit" : "")} style={themeVars(theme) as React.CSSProperties} onClick={o.art === "colours" ? tap : undefined}>
      <style>{BASE_CSS + CSS}</style>
      <canvas ref={fx} className="ip-fx" aria-hidden="true" />
      <main className="ip-wrap fest">
        <button type="button" className="fest-art" onClick={o.art === "colours" ? undefined : tap} aria-label={o.tap}>
          {o.art === "diya" && <span className="diyas">{[0, 1, 2, 3, 4].map((i) => <span key={i} className="diya" style={{ ["--i" as string]: i }}><span className="fl" /><span className="bowl" /></span>)}</span>}
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
        <p className="fest-tap" aria-live="polite">{lit ? o.tapDone : o.tap}</p>

        <h1 className="fest-h">{o.greeting}</h1>
        {c.recipient && <p className="fest-to">Dear {c.recipient},</p>}
        <p className="fest-msg">{c.message}</p>
        {c.photo && <figure className="fest-photo"><Img src={c.photo} alt={`From ${c.sender}`} /></figure>}
        <p className="fest-from"><span>With love,</span>{c.sender}</p>

        <div className="fest-btns">
          <a className="ip-btn ip-wa" href={c.sender_whatsapp ? waTo(c.sender_whatsapp, reply) : waShare(reply)} target="_blank" rel="noopener noreferrer"><Icon.wa /> Wish {c.sender ? "them" : "back"} on WhatsApp</a>
        </div>
        <MadeWith product={product} />
      </main>
    </div>
  );
}

const CSS = `
.ipr-fest{min-height:var(--ip-vh,100svh)}
.ipr-fest::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.35;background:radial-gradient(circle at 15% 10%,color-mix(in srgb,var(--ac) 40%,transparent),transparent 40%),radial-gradient(circle at 85% 30%,color-mix(in srgb,var(--ac2) 35%,transparent),transparent 40%)}
.art-colours::before{opacity:.8;background:radial-gradient(circle at 10% 15%,rgba(255,46,136,.35),transparent 30%),radial-gradient(circle at 90% 20%,rgba(22,193,114,.3),transparent 30%),radial-gradient(circle at 20% 85%,rgba(255,183,3,.35),transparent 30%),radial-gradient(circle at 85% 80%,rgba(58,134,255,.3),transparent 30%)}
.fest{display:grid;justify-items:center;text-align:center;padding-block:44px 40px;gap:14px}
.fest-art{border:0;background:none;padding:0;cursor:pointer;min-height:220px;display:grid;place-items:center;width:100%;-webkit-tap-highlight-color:transparent}
.fest-tap{margin:0;font-size:.92rem;color:var(--mu);min-height:1.4em}
.fest-h{font:400 clamp(2.6rem,13cqi,5rem)/1 var(--fd);margin:8px 0 0;color:var(--ac);text-wrap:balance;text-shadow:0 2px 0 color-mix(in srgb,var(--ac) 30%,transparent)}
.fest-to{font:700 1.7rem/1.1 var(--fh);margin:6px 0 0}
.fest-msg{font-size:clamp(1.1rem,4.6cqi,1.32rem);line-height:1.6;max-width:30ch;margin:4px 0 0;white-space:pre-line}
.fest-photo{margin:12px 0 0;padding:10px;background:var(--sf);border-radius:16px;box-shadow:0 20px 40px -24px rgba(0,0,0,.6);transform:rotate(-2deg);max-width:min(84cqi,340px)}
.fest-photo img{border-radius:10px;width:100%;aspect-ratio:4/3;object-fit:cover}
.fest-from{display:grid;gap:2px;font:700 clamp(1.8rem,7cqi,2.4rem)/1.1 var(--fh);margin:10px 0 0;color:var(--ac2)}
.fest-from span{font:500 .9rem/1 var(--fb);letter-spacing:.14em;text-transform:uppercase;color:var(--mu)}
.fest-btns{display:grid;gap:10px;width:min(100%,380px);margin-top:14px}
.diyas{display:flex;gap:clamp(8px,3cqi,18px);align-items:flex-end}
.diya{position:relative;width:clamp(44px,13cqi,64px);height:80px}
.diya .bowl{position:absolute;left:0;right:0;bottom:0;height:28px;border-radius:0 0 50% 50%/0 0 100% 100%;background:linear-gradient(#E07A2E,#9A3F12);box-shadow:inset 0 4px 0 rgba(255,255,255,.2)}
.diya .bowl::before{content:"";position:absolute;left:-6%;right:-6%;top:-6px;height:10px;border-radius:50%;background:#C25A1E}
.diya .fl{position:absolute;left:50%;bottom:26px;width:16px;height:30px;transform:translateX(-50%) scale(.2);opacity:0;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 50% 70%,#FFF7D1 0 25%,#FFC83D 45%,#FF7A1A 75%,rgba(255,122,26,0) 76%);filter:drop-shadow(0 0 14px rgba(255,200,61,.95));transition:all .4s;transition-delay:calc(var(--i) * 160ms)}
.lit .diya .fl{opacity:1;transform:translateX(-50%) scale(1)}
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
  .lit .diya .fl{animation:fest-flick .18s ease-in-out infinite alternate}
  @keyframes fest-flick{to{transform:translateX(-50%) scale(.92,1.08)}}
  .art-tree::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(2px 2px at 20% 10%,#fff,transparent),radial-gradient(2px 2px at 60% 30%,#fff,transparent),radial-gradient(1.5px 1.5px at 80% 70%,#fff,transparent),radial-gradient(2px 2px at 35% 60%,#fff,transparent);background-size:200px 200px;animation:fest-snow 9s linear infinite;opacity:.7}
  @keyframes fest-snow{to{background-position:0 400px,40px 400px,-30px 400px,20px 400px}}
  .emb{animation:fest-bob 3s ease-in-out infinite}
  @keyframes fest-bob{50%{transform:translateY(-8px)}}
}
`;
