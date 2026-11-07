import { useEffect, useMemo, useState } from "react";
import type { RenderProps } from "../types";
import { themeVars } from "../themes";
import { fill, waShare, waTo } from "../util";
import { isStock } from "../stock";
import { BASE_CSS, Gallery, Icon, Img, MadeWith, fitWords, resolveImg, useConfetti, useMusicBox, useThemeFonts } from "../parts";
import { getShop, type ShopBrand } from "../api";
import { INDORI_LINES, htmlLang, langById, nameFromParam, type LangId } from "../festLang";
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

/** Indore's Rajwada palace front as line art (an original drawing). Tapping lights its windows floor by floor, ground up. */
const RW_UPPER = Array.from({ length: 9 }, (_, j) => 46 + j * 27);
const RW_LOWER = [46, 73, 100, 206, 233, 260];
function Rajwada() {
  const win = (x: number, y: number, f: number, j: number) => (
    <path key={`${f}-${j}`} className="rw-win" style={{ ["--f" as string]: f, ["--j" as string]: j }} d={`M${x} ${y + 16}V${y + 6}Q${x + 7} ${y - 3} ${x + 14} ${y + 6}V${y + 16}Z`} />
  );
  const dome = (x: number, w: number, k: string) => (
    <g key={k}><path className="rw-line" d={`M${x - w} 56V48Q${x} ${48 - w * 1.4} ${x + w} 48V56`} /><path className="rw-line" d={`M${x} ${48 - w * 1.2}v-7`} /></g>
  );
  return (
    <svg viewBox="0 0 320 250" className="rw" aria-hidden="true">
      <defs><radialGradient id="rw-glow"><stop offset="0" stopColor="#FFB84D" /><stop offset="1" stopColor="#FFB84D" stopOpacity="0" /></radialGradient></defs>
      <ellipse className="rw-glow" cx="160" cy="150" rx="170" ry="120" fill="url(#rw-glow)" />
      {dome(52, 12, "dl")}{dome(160, 18, "dc")}{dome(268, 12, "dr")}
      <path className="rw-line" d="M36 56H284V236H36Z" />
      {[62, 90, 118, 146].map((y) => <path key={y} className="rw-line" d={`M36 ${y}H284`} />)}
      {[66, 94, 122].map((y) => (
        <g key={`rail${y}`}><path className="rw-line rw-thin" d={`M36 ${y + 20}H284`} />{RW_UPPER.map((x) => <path key={x} className="rw-line rw-thin" d={`M${x - 6} ${y + 20}v4`} />)}</g>
      ))}
      {RW_UPPER.map((x, j) => win(x, 66, 4, j))}
      {RW_UPPER.map((x, j) => win(x, 94, 3, j))}
      {RW_UPPER.map((x, j) => win(x, 122, 2, j))}
      {RW_LOWER.map((x, j) => win(x, 156, 1, j))}
      {RW_LOWER.map((x, j) => win(x, 194, 0, j))}
      <path className="rw-gate" d="M132 236V188Q160 150 188 188V236Z" />
      <path className="rw-line" d="M132 236V188Q160 150 188 188V236" />
      <path className="rw-line" d="M10 236H310M24 242H296" />
    </svg>
  );
}

/** A thin border in the style of Malwa mandana floor art: chevrons, a diamond with a dot and a row of dots. */
function Mandana({ edge }: { edge: "t" | "b" }) {
  return (
    <svg className={`mandana mandana-${edge}`} aria-hidden="true">
      <defs>
        <pattern id="mdn" width="48" height="26" patternUnits="userSpaceOnUse">
          <path d="M0 4L6 9L12 4L18 9L24 4L30 9L36 4L42 9L48 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M24 8L31 15L24 22L17 15Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M24 12.5L26.5 15L24 17.5L21.5 15Z" fill="currentColor" />
          <circle cx="6" cy="15" r="1.6" fill="var(--tx)" /><circle cx="42" cy="15" r="1.6" fill="var(--tx)" />
          <circle cx="12" cy="22" r="1.1" fill="currentColor" /><circle cx="36" cy="22" r="1.1" fill="currentColor" /><circle cx="0" cy="22" r="1.1" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mdn)" />
    </svg>
  );
}

/** A shop's name, logo and next-visit coupon, for cards made from the shop's QR (content.shop). */
function useShop(slug: unknown) {
  const [shop, setShop] = useState<ShopBrand | null>(null);
  useEffect(() => {
    if (typeof slug !== "string" || !/^[a-z0-9][a-z0-9-]{1,40}$/.test(slug)) { setShop(null); return; }
    let gone = false;
    getShop(slug).then((s) => { if (!gone) setShop(s); }, () => undefined);
    return () => { gone = true; };
  }, [slug]);
  return shop;
}

const EMBLEM: Record<string, string> = { colours: "🎨", flower: "🌷", modak: "🐘", dandiya: "🪘", kite: "🪁", kalash: "🌾", lotus: "🪷", sun: "🪔", fireworks: "🎆" };

export default function Festival({ product, theme, content: c, mode }: RenderProps) {
  useThemeFonts(theme);
  const o = product.opts;
  const [lit, setLit] = useState(false);
  const isDiya = o.art === "diya";
  const langs = o.langs === true;
  const palace = isDiya && theme.id === "rajwada";
  const qs = useMemo(() => new URLSearchParams(typeof location !== "undefined" ? location.search : ""), []);
  const guest = nameFromParam(qs.get("to"));
  // The sender picks the language when they share (it travels in the link as ?lang=hi); the person receiving the card is not offered a choice.
  const lang: LangId = langs ? langById(qs.get("lang")).id : "en";
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
  const reply = langs ? L.back.replace("{sender}", String(c.sender ?? "").trim()) : fill(product.whatsapp.reply ?? "", vars);
  // ?hn=1 (set by the sender when sharing): the big greeting carries the person's name, "Happy Diwali, Arinjay!".
  const nameInHead = !!guest && qs.get("hn") === "1";
  const baseGreeting = langs ? L.head : o.greeting;
  const greeting = nameInHead ? `${String(baseGreeting).replace(/[!.\s]+$/, "")}, ${guest}!` : baseGreeting;
  // The sender's own words are never replaced; only a ready-made line follows the chosen language.
  // An Indori line the sender picked stays as it is in every language.
  const said = String(c.message ?? "").trim();
  const readyMade = langs && (product.steps[0].fields.find((f) => f.id === "message")?.suggestions ?? []).includes(said);
  const message = readyMade && lang !== "en" && !INDORI_LINES.includes(said) ? L.msg : c.message;
  const toName = guest || c.recipient;
  const photos = Array.isArray(c.photos) ? c.photos : [];
  const sty = theme.s;
  // The minimal design is a plain card; every other design shows the background picture.
  const cover = sty !== "minimal" && resolveImg(c.cover) ? c.cover : null;
  const live = mode === "live";
  const shop = useShop(c.shop);
  // The person reading the card makes their own, with their name already filled in as the sender.
  const makeOwn = `/create/${product.id}?` + new URLSearchParams({ ...(toName ? { sender: toName } : {}), ...(typeof c.shop === "string" && c.shop ? { shop: c.shop } : {}), ref: "card" }).toString();
  const cta = isDiya ? L.cta : "Make one for your people";
  const tapWords = palace ? (langs ? L.tapRw : langById("en").tapRw) : isDiya ? (langs ? L.tap : o.tap) : o.tap;
  const doneWords = isDiya && langs ? L.done : o.tapDone;

  return (
    <div className={`ipr ipr-fest art-${o.art} s-${sty}` + (theme.dark ? " dark" : "") + (lit ? " lit" : "") + (cover ? " has-cover" : "")} style={themeVars(theme) as React.CSSProperties} onClick={o.art === "colours" ? tap : undefined}>
      <style>{BASE_CSS + CSS}</style>
      {cover && sty === "photo" && <div className="fest-bg" aria-hidden="true"><Img src={cover} alt="" sizes="100vw" eager /></div>}
      {isDiya && sty !== "minimal" && <><Mandana edge="t" /><Mandana edge="b" /></>}
      <canvas ref={fx} className="ip-fx" aria-hidden="true" />
      <canvas ref={sx} className="ip-fx" aria-hidden="true" />
      <div className="fest-page"><div className="fest-in">
      {cover && sty !== "photo" && <div className="fest-media" aria-hidden="true"><Img src={cover} alt="" sizes="(min-width: 860px) 50vw, 100vw" eager /></div>}
      <main className="ip-wrap fest">
        <button type="button" className="fest-art" onClick={o.art === "colours" ? undefined : tap} aria-label={o.tap}>
          {isDiya && (
            <span className="fest-stack">
              {o.emblem && <span className="fest-emblem" aria-hidden="true">{o.emblem}</span>}
              {palace ? <Rajwada /> : <span className="diyas">{[0, 1, 2, 3, 4].map((i) => <Diya key={i} i={i} />)}</span>}
            </span>
          )}
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
        <p className="fest-tap" aria-live="polite">{lit ? doneWords : tapWords}</p>
        <h1 className="fest-h" lang={htmlLang(lang)} style={fitWords(greeting)}>{greeting}</h1>
        {toName && !nameInHead && <p className="fest-to" lang={htmlLang(lang)}>{langs ? L.dear.replace("{n}", toName) : `Dear ${toName},`}</p>}
        <p className="fest-msg" lang={htmlLang(lang)}>{message}</p>
        {photos.length > 0 && <div className="fest-wall"><Gallery photos={photos} title={`Photos from ${c.sender}`} keyPrefix="fw" layout="strip" /></div>}
        {c.photo && <figure className="fest-photo"><Img src={c.photo} alt={`From ${c.sender}`} /></figure>}
        <p className="fest-from"><span>{langs ? L.from : "With love,"}</span>{c.sender}</p>

        <div className="fest-btns">
          {lit && live && <a className="ip-btn ip-primary fest-cta" href={makeOwn} target="_top" lang={htmlLang(lang)}>{cta}</a>}
          <a className="ip-btn ip-wa" href={c.sender_whatsapp ? waTo(c.sender_whatsapp, reply) : waShare(reply)} target="_blank" rel="noopener noreferrer"><Icon.wa /> {langs ? L.btn : `Wish ${c.sender ? "them" : "back"} on WhatsApp`}</a>
        </div>
        {isStock(cover) && <p className="fest-cr">Background photo from <a href="https://unsplash.com/?utm_source=ezyourlife&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a></p>}
        {shop && (
          <aside className="fest-shop" aria-label={`Diwali offer from ${shop.name}`}>
            {resolveImg(shop.logo_url) && <Img src={shop.logo_url} alt="" className="fest-shop-logo" sizes="64px" />}
            <div className="fest-shop-who"><small>With sweet wishes from</small><b>{shop.name}</b>{shop.city && <span>{shop.city}</span>}</div>
            {shop.coupon_text && <p className="fest-shop-coupon"><span>Your next visit</span>{shop.coupon_text}{shop.coupon_code && <code>{shop.coupon_code}</code>}</p>}
          </aside>
        )}
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
.fest-stack{display:grid;justify-items:center;gap:6px}
.fest-emblem{font-size:min(13cqi,52px);line-height:1}
.fest-cta{min-height:60px;font-size:1.05rem;box-shadow:0 10px 30px -12px color-mix(in srgb,var(--ac) 80%,transparent)}
.fest-shop{display:grid;grid-template-columns:auto 1fr;gap:10px 14px;align-items:center;width:min(100%,380px);margin-top:18px;padding:14px 16px;border-radius:var(--rad);background:var(--sf);box-shadow:inset 0 0 0 1.5px var(--line);text-align:left}
.fest-shop-logo{width:52px;height:52px;border-radius:12px;object-fit:cover}
.fest-shop-who{display:grid;gap:1px;grid-column:span 1}
.fest-shop-who:first-child{grid-column:1/-1}
.fest-shop-who small{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--mu)}
.fest-shop-who b{font:700 1.15rem/1.2 var(--fd);color:var(--tx)}
.fest-shop-who span{font-size:.82rem;color:var(--mu)}
.fest-shop-coupon{grid-column:1/-1;margin:0;display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-weight:600}
.fest-shop-coupon span{width:100%;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--mu);font-weight:500}
.fest-shop-coupon code{font:700 .95rem/1 ui-monospace,monospace;padding:6px 10px;border-radius:8px;border:1.5px dashed var(--ac2);color:var(--ac2)}
.rw{width:min(88cqi,340px);height:auto;overflow:visible}
.rw .rw-line{fill:none;stroke:var(--ac2);stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round}
.rw .rw-thin{stroke-width:1;opacity:.75}
.rw .rw-win{fill:color-mix(in srgb,var(--bg) 70%,#000);stroke:var(--ac2);stroke-width:.9;transition:fill .45s ease,filter .45s ease;transition-delay:calc(var(--f) * 280ms + var(--j) * 35ms)}
.lit .rw .rw-win{fill:#FFD36B;filter:drop-shadow(0 0 5px rgba(255,190,70,.95))}
.rw .rw-gate{fill:color-mix(in srgb,var(--bg) 70%,#000);transition:fill .6s ease 1.5s}
.lit .rw .rw-gate{fill:#FFB347}
.rw .rw-glow{opacity:0;transition:opacity 1.2s ease 1s}
.lit .rw .rw-glow{opacity:.4}
.mandana{position:absolute;left:0;right:0;width:100%;height:26px;z-index:3;pointer-events:none;color:var(--ac2);opacity:.55;transition:opacity .8s}
.mandana-t{top:0}
.mandana-b{bottom:0;transform:scaleY(-1)}
.lit .mandana{opacity:.95}
.diyas{display:flex;gap:clamp(8px,3cqi,18px);align-items:flex-end}
.diya{position:relative;width:clamp(52px,16cqi,76px);display:block}
.diya svg{display:block;width:100%;height:auto;overflow:visible}
.diya .flame{transform-box:fill-box;transform-origin:50% 100%;transform:scale(.15);opacity:0;transition:transform .5s,opacity .4s;transition-delay:calc(var(--i) * 160ms)}
.diya .glow{opacity:0;filter:blur(10px);transition:opacity .8s;transition-delay:calc(var(--i) * 160ms)}
.lit .diya .flame{opacity:1;transform:scale(1);filter:drop-shadow(0 0 8px rgba(255,200,61,.9))}
.lit .diya .glow{opacity:.5}
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
  .mandana{clip-path:inset(0 50% 0 50%);animation:mdn-in 1.4s cubic-bezier(.2,.8,.2,1) .2s forwards}
  .lit .mandana{animation:mdn-in 1.4s cubic-bezier(.2,.8,.2,1) .2s forwards,mdn-glow 2.4s ease-in-out 1.6s infinite alternate}
  @keyframes mdn-in{to{clip-path:inset(0 0 0 0)}}
  @keyframes mdn-glow{from{opacity:.95}to{opacity:.6}}
  .lit .diya .flame{animation:fest-flick .2s ease-in-out infinite alternate}
  @keyframes fest-flick{to{transform:scale(.93,1.07)}}
  .art-tree::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(2px 2px at 20% 10%,#fff,transparent),radial-gradient(2px 2px at 60% 30%,#fff,transparent),radial-gradient(1.5px 1.5px at 80% 70%,#fff,transparent),radial-gradient(2px 2px at 35% 60%,#fff,transparent);background-size:200px 200px;animation:fest-snow 9s linear infinite;opacity:.7}
  @keyframes fest-snow{to{background-position:0 400px,40px 400px,-30px 400px,20px 400px}}
  .emb{animation:fest-bob 3s ease-in-out infinite}
  @keyframes fest-bob{50%{transform:translateY(-8px)}}
}
`;
