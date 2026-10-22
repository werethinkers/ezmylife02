import { useEffect, useMemo, useRef, useState } from "react";
import type { Content, RenderProps } from "../types";
import { themeVars } from "../themes";
import { fill, waShare, waTo, fmtDate } from "../util";
import { BASE_CSS, Icon, Img, MadeWith, useConfetti, useMusicBox, useThemeFonts } from "../parts";

/** The greeting animates letter by letter, but each word stays whole, so a long greeting wraps between words and never inside one. */
function Letters({ text }: { text: string }) {
  let i = 0;
  return (
    <>
      {text.split(/( )/).map((part, pi) => part === " "
        ? <span key={pi} className="l" style={{ ["--i" as string]: i++ }}> </span>
        : (
          <span key={pi} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {[...part].map((ch) => { const k = i++; return <span key={k} className="l" style={{ ["--i" as string]: k }}>{ch}</span>; })}
          </span>
        ))}
    </>
  );
}


const EMBLEM: Record<string, string> = { wish: "✈️", hug: "🧶", bouquet: "💐", trophy: "🏆", diploma: "🎓", baby: "👶", candle: "🕯️" };

export default function Celebration({ product, theme, content: c, mode }: RenderProps) {
  useThemeFonts(theme);
  const o = product.opts;
  const solemn = o.opening === "candle";
  const vars = useMemo(() => ({ ...c, year: new Date().getFullYear() }), [c]);
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [momentDone, setMomentDone] = useState(false);
  const { ref: fx, burst } = useConfetti([theme.c.ac, theme.c.ac2, theme.c.ac3, "#FFFFFF"]);
  const music = useMusicBox(c.music === false ? "none" : o.music);
  const root = useRef<HTMLDivElement>(null);
  const toTop = () => {
    if (mode === "live") window.scrollTo({ top: 0 });
    else root.current?.parentElement?.scrollTo({ top: 0 });
  };

  // A fresh preview resets the reveal when the content or design changes.
  useEffect(() => { if (mode === "preview") setMomentDone(false); }, [c, theme, mode]);

  const open = (e?: React.MouseEvent) => {
    if (opening) return;
    music.start();
    setOpening(true);
    const x = e?.clientX, y = e?.clientY;
    setTimeout(() => { if (!solemn) burst(x, y, 180, 1.4); }, 350);
    setTimeout(() => { setOpened(true); toTop(); if (!solemn) setTimeout(() => burst(undefined, undefined, 120, 1.6), 450); }, 1000);
  };
  const again = () => { setOpened(false); setOpening(false); setMomentDone(false); music.stop(); toTop(); };

  const greeting = fill(o.greeting, vars);
  const memories = (Array.isArray(c.memories) ? c.memories : []).filter((m: { photo?: string }) => m?.photo);
  const age = parseInt(c.age, 10) || 0;
  const reply = fill(product.whatsapp.reply ?? "", vars);
  const replyHref = c.sender_whatsapp ? waTo(c.sender_whatsapp, reply) : waShare(reply);

  return (
    <div ref={root} className={"ipr ipr-cel" + (theme.dark ? " dark" : "") + (solemn ? " solemn" : "")} style={themeVars(theme) as React.CSSProperties}>
      <style>{BASE_CSS + CSS}</style>
      <canvas ref={fx} className="ip-fx" aria-hidden="true" />

      {!opened && (
        <section className={"cel-gift" + (opening ? " opening" : "")} aria-label="Your surprise">
          <div className="cel-gift-in">
            <p className="cel-for">{c.recipient || "You"},</p>
            <p className="cel-from">{fill(o.openLine, vars)}</p>
            <button type="button" className={"cel-obj " + (o.opening === "gift" ? "cel-box" : "cel-" + o.opening)} onClick={open} aria-label={o.cta}>
              {o.opening === "gift" && (<><span className="glow" /><span className="box" /><span className="lid"><span className="bow"><i /><i /><b /></span></span></>)}
              {o.opening === "envelope" && (<><span className="env-back" /><span className="env-card">{(c.recipient || "").slice(0, 1)}</span><span className="env-front" /><span className="env-flap" /></>)}
              {o.opening === "heart" && <span className="heart" />}
              {o.opening === "candle" && (<><span className="wax" /><span className="flame" /></>)}
              {o.opening === "star" && <span className="star">✦</span>}
            </button>
            <button type="button" className="ip-btn cel-cta" onClick={open}>{o.cta}</button>
            {o.music !== "none" && c.music !== false && <p className="cel-sound"><Icon.music /> Turn your sound on</p>}
          </div>
        </section>
      )}

      {opened && (
        <main>
          <section className="cel-greet">
            <div className="ip-wrap">
              <h1 className="cel-hb"><Letters text={greeting} /></h1>
              {!greeting.includes(String(c.recipient || "~")) && c.recipient && (
                <span className="cel-name" aria-label={c.recipient}>{[...String(c.recipient)].map((ch, i) => <span key={i} className="l" style={{ ["--i" as string]: i + 4, ["--c" as string]: [theme.c.ac, theme.c.ac2, theme.c.ac3][i % 3] }}>{ch}</span>)}</span>
              )}
              {(age > 0 || c.life_dates || (o.moment === "baby" && c.date)) && (
                <div className="cel-chip">
                  {age > 0 && <><b>{age}</b><span>Turning {age}{c.date ? " · " + fmtDate(c.date, { day: "numeric", month: "long" }) : ""}</span></>}
                  {c.life_dates && <span>{c.life_dates}</span>}
                  {o.moment === "baby" && c.date && <span>Born {fmtDate(c.date, { day: "numeric", month: "long", year: "numeric" })}{c.birth_time ? " · " + c.birth_time : ""}{c.weight ? " · " + c.weight : ""}</span>}
                </div>
              )}
            </div>
          </section>

          <Moment kind={o.moment} title={fill(o.momentTitle, vars)} hint={fill(o.momentHint, vars)} doneText={fill(o.momentDone, vars)} age={age} since={c.date}
            done={momentDone} solemn={solemn} onDone={(e) => { setMomentDone(true); if (!solemn) burst(e?.clientX, e?.clientY, 160, 1.2); music.chime(); }} />

          <section className="cel-sec">
            <div className="ip-wrap">
              <p className="cel-kick">A note for you</p>
              <h2 className="cel-h2">{fill(o.letterTitle, vars)}</h2>
              <article className="cel-card">
                <span className="tape" aria-hidden="true" />
                <p className="dear">Dear {c.recipient || "you"},</p>
                <p className="letter">{c.message}</p>
                <p className="sign">{c.sender}</p>
              </article>
            </div>
          </section>

          {memories.length > 0 && (
            <section className="cel-sec">
              <div className="ip-wrap">
                <p className="cel-kick">Remember these?</p>
                <h2 className="cel-h2">{fill(o.memoriesTitle, vars)}</h2>
                <div className="cel-reel" tabIndex={0} aria-label="Photos, swipe sideways">
                  {memories.map((m: { photo: string; caption?: string }, i: number) => (
                    <figure key={i} className="pol" style={{ ["--r" as string]: `${[-3, 2.5, -1.5, 3, -2.5, 1.5][i % 6]}deg` }}>
                      <Img src={m.photo} alt={m.caption || `Photo ${i + 1}`} sampleKey={"m" + i} />
                      {m.caption && <figcaption>{m.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </div>
            </section>
          )}

          {o.numbers === "age" && age > 0 && <Numbers age={age} c={c} />}

          <section className="cel-end">
            <div className="ip-wrap">
              <h2>{fill(o.endTitle, vars)}</h2>
              <p>{c.sender} made this just for you.</p>
              <div className="btns">
                <a className="ip-btn ip-wa" href={replyHref} target="_blank" rel="noopener noreferrer"><Icon.wa /> {solemn ? "Send your condolences" : `Say thank you to ${c.sender || "them"}`}</a>
                <button type="button" className="ip-btn ip-ghost" onClick={again}>Watch it again</button>
              </div>
              <MadeWith product={product} />
            </div>
          </section>
        </main>
      )}

      {opened && o.music !== "none" && c.music !== false && (
        <button type="button" className="cel-music ip-fixed" onClick={() => (music.playing ? music.stop() : music.start())} aria-label={music.playing ? "Pause music" : "Play music"}>
          {music.playing ? <Icon.music /> : <Icon.mute />}
        </button>
      )}
    </div>
  );
}

function Moment({ kind, title, hint, doneText, age, since, done, solemn, onDone }: { kind: string; title: string; hint: string; doneText: string; age: number; since?: string; done: boolean; solemn: boolean; onDone: (e?: React.MouseEvent) => void }) {
  if (kind === "together") return <Together title={title} hint={hint} since={since} />;
  if (kind === "question") return <Question title={title} doneText={doneText} done={done} onYes={onDone} />;
  const digits = kind === "cake" ? (age ? String(age).split("") : ["♥"]) : [];
  return (
    <section className="cel-sec">
      <div className="ip-wrap cel-moment">
        <h2 className="cel-h2">{title}</h2>
        {kind === "cake" ? (
          <button type="button" className={"cake" + (done ? " out" : "")} onClick={(e) => !done && onDone(e)} aria-label="Blow out the candles">
            <span className="candles">{digits.map((d, i) => <span key={i} className="num">{d}<span className="flame" /><span className="smoke" /></span>)}</span>
            <span className="tier t2" /><span className="tier t1" /><span className="plate" />
          </button>
        ) : (
          <button type="button" className={"emblem" + (done ? " done" : "") + (solemn ? " lit" : "")} onClick={(e) => !done && onDone(e)} aria-label={hint || title}>
            <span>{EMBLEM[kind] ?? "✨"}</span>
          </button>
        )}
        <p className="wish" aria-live="polite">{done ? doneText : hint}</p>
      </div>
    </section>
  );
}

function Together({ title, hint, since }: { title: string; hint: string; since?: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const start = since ? new Date(since + "T00:00:00").getTime() : NaN;
  if (Number.isNaN(start) || start > now) return null;
  const ms = now - start;
  const days = Math.floor(ms / 86400000);
  const years = Math.floor(days / 365.25);
  const units: [number, string][] = [[years, years === 1 ? "year" : "years"], [days, "days"], [Math.floor(ms / 3600000), "hours"], [Math.floor(ms / 60000) % 60, "min"], [Math.floor(ms / 1000) % 60, "sec"]];
  return (
    <section className="cel-sec">
      <div className="ip-wrap cel-moment">
        <h2 className="cel-h2">{title}</h2>
        <div className="nums five">{units.map(([n, l], i) => <div key={l} className="n" style={{ ["--c" as string]: `var(${["--ac", "--ac2", "--ac3", "--ac", "--ac2"][i]})` }}><b>{n.toLocaleString("en-IN")}</b><span>{l}</span></div>)}</div>
        <p className="wish">{hint} Since {fmtDate(since, { day: "numeric", month: "long", year: "numeric" })}.</p>
      </div>
    </section>
  );
}

function Question({ title, doneText, done, onYes }: { title: string; doneText: string; done: boolean; onYes: (e?: React.MouseEvent) => void }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dodge = () => setPos({ x: (Math.random() - 0.5) * 220, y: (Math.random() - 0.5) * 140 });
  return (
    <section className="cel-sec">
      <div className="ip-wrap cel-moment">
        <h2 className="cel-h2 big">{title}</h2>
        {done ? <p className="yes-done">{doneText}</p> : (
          <div className="qbtns">
            <button type="button" className="ip-btn ip-primary yes" onClick={(e) => onYes(e)}>Yes</button>
            <button type="button" className="ip-btn ip-ghost no" style={{ transform: `translate(${pos.x}px,${pos.y}px)` }} onMouseEnter={dodge} onFocus={dodge} onTouchStart={(e) => { e.preventDefault(); dodge(); }} onClick={dodge}>No</button>
          </div>
        )}
      </div>
    </section>
  );
}

function Numbers({ age, c }: { age: number; c: Content }) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  let next = now;
  if (c.date) {
    const d = new Date(c.date + "T00:00:00");
    next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    if (next < now) next = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
  }
  const born = new Date(next.getFullYear() - age, next.getMonth(), next.getDate());
  const days = Math.max(0, Math.floor((Date.now() - born.getTime()) / 86400000));
  const stats: [number, string][] = [[age, "years"], [Math.floor(days / 7), "weeks"], [days, "days"]];
  return (
    <section className="cel-sec">
      <div className="ip-wrap">
        <p className="cel-kick">By the numbers</p>
        <h2 className="cel-h2">You, so far.</h2>
        <div className="nums">{stats.map(([n, l], i) => <div key={l} className="n" style={{ ["--c" as string]: `var(${["--ac", "--ac2", "--ac3"][i]})` }}><b>{n.toLocaleString("en-IN")}</b><span>{l}</span></div>)}</div>
        <p className="wish">That's {days.toLocaleString("en-IN")} days of making the people around you happier. {c.sender} counted.</p>
      </div>
    </section>
  );
}

const CSS = `
.ipr-cel::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.45;background-image:radial-gradient(circle at 20% 30%,var(--ac) 0 3px,transparent 4px),radial-gradient(circle at 70% 60%,var(--ac2) 0 2.5px,transparent 3.5px),radial-gradient(circle at 40% 80%,var(--ac3) 0 2px,transparent 3px);background-size:180px 180px,210px 210px,160px 160px}
.ipr-cel.solemn::before{opacity:.12;background-image:radial-gradient(circle at 50% 50%,var(--ac) 0 1px,transparent 2px);background-size:90px 90px}
.cel-gift{position:relative;min-height:var(--ip-vh,100svh);display:grid;place-items:center;padding:48px 16px;text-align:center;overflow:hidden}
.cel-gift-in{display:grid;justify-items:center;gap:20px}
.cel-for{font:700 clamp(2.4rem,11cqi,3.6rem)/1 var(--fh);color:var(--ac2);margin:0}
.cel-from{margin:0;font-size:1.1rem;color:var(--mu);max-width:28ch}
.cel-obj{position:relative;width:min(60cqi,230px);height:min(60cqi,230px);margin-top:14px;border:0;background:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.cel-box .box{position:absolute;left:6%;right:6%;bottom:0;height:68%;border-radius:10px 10px 16px 16px;background:repeating-linear-gradient(45deg,var(--ac) 0 18px,color-mix(in srgb,var(--ac) 82%,#fff) 18px 36px);box-shadow:inset 0 -14px 0 rgba(0,0,0,.12),0 30px 40px -18px rgba(0,0,0,.5)}
.cel-box .box::before,.cel-box .lid::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:16%;transform:translateX(-50%);background:var(--ac2)}
.cel-box .lid{position:absolute;left:0;right:0;top:20%;height:20%;border-radius:10px;background:repeating-linear-gradient(45deg,color-mix(in srgb,var(--ac) 82%,#fff) 0 18px,var(--ac) 18px 36px);box-shadow:0 8px 0 rgba(0,0,0,.14);transform-origin:20% 100%}
.cel-box .bow{position:absolute;left:50%;top:-34%;width:62%;height:70%;transform:translateX(-50%)}
.cel-box .bow i{position:absolute;bottom:0;width:48%;height:100%;border:10px solid var(--ac2);border-radius:50% 50% 10% 50%}
.cel-box .bow i:first-child{left:0;transform:rotate(-28deg);transform-origin:100% 100%}
.cel-box .bow i:last-child{right:0;border-radius:50% 50% 50% 10%;transform:rotate(28deg);transform-origin:0 100%}
.cel-box .bow b{position:absolute;left:50%;bottom:-8%;width:22%;aspect-ratio:1;transform:translateX(-50%);border-radius:50%;background:var(--ac2);filter:brightness(.85)}
.cel-box .glow{position:absolute;left:50%;top:55%;width:10%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#FFF6C8,rgba(255,200,61,0) 70%);opacity:0}
.cel-gift.opening .cel-box .lid{animation:cel-lid .9s cubic-bezier(.2,.8,.2,1) forwards}
.cel-gift.opening .cel-box .glow{animation:cel-glow 1s ease-out forwards}
.cel-gift.opening .cel-obj{animation:cel-shake .45s ease-in-out}
@keyframes cel-lid{to{transform:translate(40%,-160%) rotate(38deg);opacity:0}}
@keyframes cel-glow{to{width:260%;opacity:1}}
@keyframes cel-shake{0%,100%{transform:rotate(0)}25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}
.cel-envelope .env-back,.cel-envelope .env-front{position:absolute;left:0;right:0;bottom:8%;height:62%;border-radius:10px;background:var(--ac)}
.cel-envelope .env-front{background:linear-gradient(160deg,transparent 49.5%,color-mix(in srgb,var(--ac) 85%,#000) 50%) , linear-gradient(200deg,transparent 49.5%,color-mix(in srgb,var(--ac) 85%,#000) 50%);background-size:50% 100%,50% 100%;background-position:0 0,100% 0;background-repeat:no-repeat;z-index:2}
.cel-envelope .env-flap{position:absolute;left:0;right:0;top:30%;height:40%;background:color-mix(in srgb,var(--ac) 75%,#fff);clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:top;z-index:3;transition:transform .6s}
.cel-envelope .env-card{position:absolute;left:10%;right:10%;bottom:14%;height:52%;background:var(--sf);border-radius:6px;z-index:1;display:grid;place-items:center;font:700 3rem/1 var(--fh);color:var(--ac);transition:transform .8s .3s}
.cel-gift.opening .env-flap{transform:rotateX(180deg)}
.cel-gift.opening .env-card{transform:translateY(-60%)}
.cel-heart .heart{position:absolute;inset:18%;background:var(--ac);transform:rotate(-45deg);border-radius:0 0 0 18%}
.cel-heart .heart::before,.cel-heart .heart::after{content:"";position:absolute;width:100%;height:100%;border-radius:50%;background:var(--ac)}
.cel-heart .heart::before{top:-50%;left:0}.cel-heart .heart::after{left:50%;top:0}
.cel-gift.opening .heart{animation:cel-beat .5s ease-in-out 2}
@keyframes cel-beat{50%{transform:rotate(-45deg) scale(1.25)}}
.cel-candle .wax{position:absolute;left:40%;right:40%;bottom:6%;height:56%;border-radius:8px 8px 4px 4px;background:linear-gradient(90deg,#efe6d4,#fffaf0,#e3d7bf)}
.cel-candle .flame,.cake .flame{position:absolute;left:50%;width:18px;height:30px;transform:translateX(-50%);border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 50% 70%,#FFF7D1 0 25%,#FFC83D 45%,#FF7A1A 75%,rgba(255,122,26,0) 76%);filter:drop-shadow(0 0 12px rgba(255,200,61,.9));transform-origin:50% 100%}
.cel-candle .flame{top:28%}
.cel-star .star{display:grid;place-items:center;width:100%;height:100%;font-size:min(40cqi,150px);color:var(--ac2);text-shadow:0 0 40px var(--ac2)}
.cel-gift.opening .star{animation:cel-spin 1s ease-in forwards}
@keyframes cel-spin{to{transform:rotate(180deg) scale(2.4);opacity:0}}
.cel-cta{background:var(--tx);color:var(--bg);min-height:58px;padding:0 1.6em;font-size:1.05rem;box-shadow:0 10px 0 -2px rgba(0,0,0,.2)}
.cel-sound{display:flex;align-items:center;gap:8px;margin:0;font-size:.86rem;color:var(--mu)}
.cel-sound svg{width:16px;height:16px}
.cel-greet{padding-block:clamp(56px,12cqi,96px) 24px;text-align:center}
.cel-hb{font:400 clamp(2.6rem,13cqi,5.4rem)/.95 var(--fd);margin:0;text-wrap:balance}
.cel-hb .l,.cel-name .l{display:inline-block;white-space:pre;animation:cel-pop .7s cubic-bezier(.34,1.56,.64,1) both;animation-delay:calc(var(--i) * 50ms + .15s)}
.cel-name{display:block;font:400 clamp(4rem,24cqi,9rem)/.95 var(--fd);margin-top:.08em;overflow-wrap:anywhere}
.cel-name .l{color:var(--c)}
.solemn .cel-hb .l,.solemn .cel-name .l{animation-name:cel-fade}
@keyframes cel-pop{from{opacity:0;transform:translateY(40px) scale(.4) rotate(-12deg)}to{opacity:1;transform:none}}
@keyframes cel-fade{from{opacity:0}to{opacity:1}}
.cel-chip{display:inline-flex;align-items:center;gap:12px;margin-top:22px;padding:8px 18px 8px 8px;border-radius:999px;background:var(--sf);box-shadow:inset 0 0 0 1.5px var(--line);font-weight:600}
.cel-chip b{display:grid;place-items:center;min-width:44px;height:44px;padding:0 8px;border-radius:999px;background:var(--ac2);color:var(--on);font:400 1.4rem/1 var(--fd)}
.cel-chip span:only-child{padding-left:10px}
.cel-sec{padding-block:clamp(44px,9cqi,80px)}
.cel-kick{font:700 .74rem/1 var(--fb);letter-spacing:.2em;text-transform:uppercase;color:var(--mu);margin:0;text-align:center}
.cel-h2{font:400 clamp(1.9rem,8.5cqi,3rem)/1.05 var(--fd);margin:12px 0 0;text-align:center;text-wrap:balance}
.cel-h2.big{font-size:clamp(2.4rem,11cqi,4rem)}
.cel-moment{display:grid;justify-items:center;gap:22px}
.wish{font-size:1.04rem;color:var(--mu);text-align:center;margin:0;max-width:34ch;min-height:2.6em}
.cake{position:relative;width:min(76cqi,300px);height:260px;border:0;background:none;padding:0;cursor:pointer;margin-top:10px}
.cake .plate{position:absolute;left:-6%;right:-6%;bottom:0;height:22px;border-radius:50%;background:color-mix(in srgb,var(--tx) 18%,var(--bg))}
.cake .tier{position:absolute;left:50%;transform:translateX(-50%);border-radius:14px 14px 10px 10px;background:linear-gradient(#FFF8EE,#F1DFCC)}
.cake .t1{bottom:10px;width:100%;height:96px}
.cake .t2{bottom:104px;width:72%;height:76px}
.cake .tier::before{content:"";position:absolute;left:0;right:0;top:0;height:26px;border-radius:14px 14px 0 0;background:var(--ac);-webkit-mask:radial-gradient(14px 14px at 14px 100%,transparent 98%,#000) 0 0/28px 100%;mask:radial-gradient(14px 14px at 14px 100%,transparent 98%,#000) 0 0/28px 100%}
.cake .t2::before{background:var(--ac3)}
.cake .candles{position:absolute;left:50%;bottom:178px;transform:translateX(-50%);display:flex;gap:10px;align-items:flex-end}
.cake .num{position:relative;font:400 62px/1 var(--fd);color:var(--ac2);-webkit-text-stroke:3px color-mix(in srgb,var(--ac2) 70%,#000);text-shadow:0 3px 0 color-mix(in srgb,var(--ac2) 60%,#000)}
.cake .flame{top:-46px}
.cake .smoke{position:absolute;left:50%;top:-40px;width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.5);opacity:0}
.cake.out .flame{opacity:0;transform:translateX(-50%) scale(.2);transition:all .3s}
.cake.out .smoke{animation:cel-smoke 1.6s ease-out forwards}
@keyframes cel-smoke{0%{opacity:.7;transform:translate(-50%,0) scale(.6)}100%{opacity:0;transform:translate(-30%,-70px) scale(2.4)}}
.emblem{width:min(56cqi,210px);aspect-ratio:1;border-radius:50%;border:0;cursor:pointer;background:radial-gradient(circle,color-mix(in srgb,var(--ac2) 35%,transparent),transparent 70%);font-size:min(30cqi,120px);display:grid;place-items:center;transition:transform .5s cubic-bezier(.34,1.56,.64,1)}
.emblem:hover{transform:scale(1.05)}
.emblem.done{transform:scale(1.18) rotate(-8deg)}
.solemn .emblem{filter:grayscale(.2)}
.solemn .emblem.done{transform:none;background:radial-gradient(circle,rgba(255,200,61,.55),transparent 70%)}
.qbtns{display:flex;gap:16px;justify-content:center;align-items:center;min-height:160px;width:100%}
.qbtns .yes{min-width:140px;font-size:1.2rem}
.qbtns .no{min-width:110px;transition:transform .25s}
.yes-done{font:400 clamp(2rem,9cqi,3rem)/1.1 var(--fd);color:var(--ac);text-align:center;margin:0}
.cel-card{position:relative;margin:30px auto 0;max-width:560px;background:#FFFDF8;color:#2A1A33;border-radius:6px;padding:34px clamp(20px,6cqi,44px) 28px;transform:rotate(-1.4deg);box-shadow:0 30px 50px -24px rgba(0,0,0,.55)}
.cel-card::before{content:"";position:absolute;inset:0;border-radius:6px;background:repeating-linear-gradient(transparent 0 37px,rgba(91,42,134,.12) 37px 38px);background-position:0 70px;pointer-events:none}
.cel-card .tape{position:absolute;top:-14px;left:50%;width:120px;height:30px;transform:translateX(-50%) rotate(2deg);background:color-mix(in srgb,var(--ac2) 75%,transparent)}
.cel-card .dear{font:700 2.2rem/1.1 var(--fh);margin:0 0 6px}
.cel-card .letter{font:500 clamp(1.4rem,5.2cqi,1.7rem)/38px var(--fh);margin:0;white-space:pre-line;position:relative}
.cel-card .sign{font:700 2rem/1 var(--fh);text-align:right;margin:18px 0 0;color:var(--ac)}
.cel-reel{display:flex;gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;padding:30px 4px 24px;scrollbar-width:none}
.cel-reel::-webkit-scrollbar{display:none}
.pol{flex:none;width:min(70cqi,270px);scroll-snap-align:center;background:#FFFDF8;color:#2A1A33;padding:12px 12px 16px;border-radius:4px;box-shadow:0 24px 40px -22px rgba(0,0,0,.7);transform:rotate(var(--r));margin:0}
.pol img{width:100%;aspect-ratio:1;object-fit:cover}
.pol figcaption{font:700 1.45rem/1.1 var(--fh);text-align:center;margin-top:12px}
.nums{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:26px 0 16px;width:100%}
.nums.five{grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.nums .n{background:var(--sf);border-radius:18px;padding:16px 6px;text-align:center;box-shadow:inset 0 0 0 1.5px var(--line);min-width:0}
.nums .n b{display:block;font:400 clamp(1.25rem,6.4cqi,2.2rem)/1 var(--fd);color:var(--c);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.nums.five .n b{font-size:clamp(1rem,4.6cqi,1.6rem)}
.nums .n span{display:block;font-size:.8rem;color:var(--mu);margin-top:8px}
.ipr-cel .nums+.wish{margin-inline:auto}
.cel-end{text-align:center;padding-block:clamp(56px,12cqi,96px) 40px}
.cel-end h2{font:400 clamp(2.1rem,9.5cqi,3.4rem)/1.02 var(--fd);margin:0;text-wrap:balance}
.cel-end p{color:var(--mu);margin:12px auto 0;max-width:32ch}
.cel-end .btns{display:grid;gap:10px;width:min(100%,380px);margin:22px auto 0}
.cel-music{right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:40;width:52px;height:52px;border-radius:50%;border:0;background:var(--tx);color:var(--bg);display:grid;place-items:center;cursor:pointer;box-shadow:0 10px 24px -8px rgba(0,0,0,.5)}
@media (prefers-reduced-motion:no-preference){
  .cel-gift:not(.opening) .cel-obj{animation:cel-bob 2.4s ease-in-out infinite}
  @keyframes cel-bob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-10px) rotate(2deg)}}
  .cake:not(.out) .flame,.cel-candle .flame{animation:cel-flick .18s ease-in-out infinite alternate}
  @keyframes cel-flick{from{transform:translateX(-50%) scale(1,1) rotate(-2deg)}to{transform:translateX(-50%) scale(.92,1.08) rotate(2deg)}}
}
`;
