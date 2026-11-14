(()=>{var ne=Object.create;var V=Object.defineProperty;var se=Object.getOwnPropertyDescriptor;var ae=Object.getOwnPropertyNames;var re=Object.getPrototypeOf,ie=Object.prototype.hasOwnProperty;var Z=(t,s)=>()=>(s||t((s={exports:{}}).exports,s),s.exports),oe=(t,s)=>{for(var r in s)V(t,r,{get:s[r],enumerable:!0})},le=(t,s,r,l)=>{if(s&&typeof s=="object"||typeof s=="function")for(let p of ae(s))!ie.call(t,p)&&p!==r&&V(t,p,{get:()=>s[p],enumerable:!(l=se(s,p))||l.enumerable});return t};var v=(t,s,r)=>(r=t!=null?ne(re(t)):{},le(s||!t||!t.__esModule?V(r,"default",{value:t,enumerable:!0}):r,t));var Nt=Z((Re,Rt)=>{Rt.exports=window.__gx.ReactDOMClient});var It=Z((Ne,qt)=>{qt.exports=window.__gx.React});var y=Z((qe,St)=>{St.exports=window.__gx.JsxRuntime});var Et=v(Nt(),1);var rt={};oe(rt,{default:()=>H});var o=v(It()),e=v(y()),Ct={signal:{light:{paper:"#ffffff",ink:"#e10e17",onInk:"#ffffff"},dark:{paper:"#140c0c",ink:"#ff4a3d",onInk:"#140c0c"}},cobalt:{light:{paper:"#f6f7ff",ink:"#1d3cf5",onInk:"#ffffff"},dark:{paper:"#0b1030",ink:"#7b8cff",onInk:"#0b1030"}},moss:{light:{paper:"#f4f6ef",ink:"#1f4d2b",onInk:"#f4f6ef"},dark:{paper:"#0e1a12",ink:"#8fd19e",onInk:"#0e1a12"}},carbon:{light:{paper:"#f3f3f1",ink:"#111111",onInk:"#f3f3f1"},dark:{paper:"#131313",ink:"#f1f1ee",onInk:"#131313"}}};function ce(t){return t.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,64)||"question"}function fe(t,s){let r={};return t.map((l,p)=>{let f=s[p]||ce(l);return r[f]=(r[f]||0)+1,r[f]>1?f+"-"+r[f]:f})}function nt(t){return t.toLowerCase().split(/\s+/).filter(Boolean)}function $(t,s){let r=nt(s);if(!r.length)return!0;let l=t.toLowerCase();return r.every(p=>l.includes(p))}function pe(t,s){let r=nt(s);if(!r.length||!t)return[{text:t,hit:!1}];let l=t.toLowerCase(),p=new Array(t.length).fill(!1);for(let c of r){let d=l.indexOf(c);for(;d>-1;){for(let m=d;m<d+c.length;m++)p[m]=!0;d=l.indexOf(c,d+1)}}let f=[];for(let c=0;c<t.length;c++){let d=f[f.length-1];d&&d.hit===p[c]?d.text+=t[c]:f.push({text:t[c],hit:p[c]})}return f}function de(t,s,r=44){let l=nt(s);if(!l.length||!t)return"";let p=t.toLowerCase(),f=-1;for(let m of l){let x=p.indexOf(m);x>-1&&(f<0||x<f)&&(f=x)}if(f<0)return"";let c=Math.max(0,f-r),d=Math.min(t.length,f+r*2);return c>0&&(c=t.indexOf(" ",c)+1||c),d<t.length&&(d=t.lastIndexOf(" ",d)>f?t.lastIndexOf(" ",d):d),(c>0?"\u2026":"")+t.slice(c,d).trim()+(d<t.length?"\u2026":"")}function ue(t,s,r,l=""){if(t===void 0)return[];let p=Array.isArray(t)?t:[t],f=[];for(let c of p){let d=typeof c=="string"?s.includes(c)?c:s.includes(l+c)?l+c:void 0:void 0,m=typeof c=="number"?s[c]:d;m&&!f.includes(m)&&f.push(m)}return r?f.slice(0,1):f}function me(t,s,r){return r?t==="ArrowDown"?(s+1)%r:t==="ArrowUp"?(s-1+r)%r:t==="Home"?0:t==="End"?r-1:-1:-1}function J(t){let s=t/255;return s<=.03928?s/12.92:Math.pow((s+.055)/1.055,2.4)}function zt(t){let s=t.trim().replace("#","");if(s.length===3&&(s=s[0]+s[0]+s[1]+s[1]+s[2]+s[2]),!/^[0-9a-f]{6}$/i.test(s))return NaN;let r=J(parseInt(s.slice(0,2),16)),l=J(parseInt(s.slice(2,4),16)),p=J(parseInt(s.slice(4,6),16));return .2126*r+.7152*l+.0722*p}function G(t,s){let r=zt(t),l=zt(s);return Number.isNaN(r)||Number.isNaN(l)?NaN:(Math.max(r,l)+.05)/(Math.min(r,l)+.05)}function Mt(t,s){let r=G(t,s);return Number.isNaN(r)||r>=4.5?s:G(t,"#ffffff")>=G(t,"#111111")?"#ffffff":"#111111"}var ge=typeof window<"u"?o.useLayoutEffect:o.useEffect;function et(t){return t==null||typeof t=="boolean"?"":typeof t=="string"||typeof t=="number"?String(t):Array.isArray(t)?t.map(et).join(" "):o.isValidElement(t)?et(t.props.children):""}function tt({text:t,query:s}){let r=pe(t,s);return(0,e.jsx)(e.Fragment,{children:r.map((l,p)=>l.hit?(0,e.jsx)("mark",{className:"stf-mark",children:l.text},p):(0,e.jsx)(o.Fragment,{children:l.text},p))})}function he(){return(0,e.jsx)("span",{className:"stf-cell","aria-hidden":"true",children:(0,e.jsx)("svg",{className:"stf-plus",viewBox:"0 0 32 32",fill:"none",children:(0,e.jsx)("path",{d:"M16 1v30M1 16h30",stroke:"currentColor",strokeWidth:"2"})})})}var ve=[{question:"What files should I send?",answer:"One PDF with a page per ink colour, each in greyscale. Pure black prints at full strength and grey prints as a screen, so set tints in grey, not in colour. Add 3 mm bleed and keep text 5 mm from the trim."},{question:"How many ink colours can one print have?",answer:"Up to five. We run two machines with five drums between them, and every colour is its own pass through the press. Each extra colour adds about a day to the job."},{question:"Why does every copy look slightly different?",answer:"Risograph is a stencil process. Layers can drift a millimetre or two against each other and solid areas pick up a little texture. That is the look. If a job needs exact registration, it belongs on an offset press."},{question:"Which papers can you print on?",answer:"Uncoated stock from 90 to 300 gsm, in white, natural and about thirty colours. Soy ink never fully dries on coated or glossy paper, so we will not run it."},{question:"What is the smallest run you take?",answer:"Fifty copies. Every colour needs its own master, and below fifty the masters cost more than the printing. Zines, posters and postcards can share masters in one batch."},{question:"How long does an order take?",answer:"Five working days from the moment you approve the proof. Rush jobs ship in two working days for 30 percent more, when the drums are free."},{question:"Can I see a proof before the full run?",answer:"A digital proof is free and arrives within a day. A printed proof costs \xA318, and we take it off the final invoice if you go ahead."},{question:"Do you ship outside the UK?",answer:"Yes, tracked to Europe and North America. Prints travel flat between greyboard, and rolled posters go in a tube only if you ask for one."}],xe=`
.stf {
  --stf-flood-in: 400ms;
  --stf-flood-out: 280ms;
  --stf-rule: 1px;
  --stf-ease-flood: cubic-bezier(0.76, 0, 0.24, 1);
  --stf-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --stf-gutter: clamp(16px, 4cqi, 64px);
  --p: var(--stf-paper-l);
  --k: var(--stf-ink-l);
  --o: var(--stf-on-l);
  position: relative;
  container-type: inline-size;
  width: 100%;
  box-sizing: border-box;
  background: var(--p);
  color: var(--k);
  font-family: var(--stf-text-font);
  -webkit-font-smoothing: antialiased;
  padding: clamp(56px, 8cqi, 120px) 0 clamp(48px, 6cqi, 96px);
}
:where(.dark) .stf[data-theme="auto"],
.stf[data-theme="dark"] {
  --p: var(--stf-paper-d);
  --k: var(--stf-ink-d);
  --o: var(--stf-on-d);
}
.stf *,
.stf *::before,
.stf *::after { box-sizing: border-box; }
.stf ::selection { background: var(--k); color: var(--o); }
.stf-wrap { padding: 0 var(--stf-gutter); }

.stf-title {
  margin: 0;
  font-family: var(--stf-display-font);
  font-weight: 900;
  font-size: clamp(44px, 14.6cqi, 172px);
  line-height: 0.84;
  letter-spacing: -0.045em;
  text-transform: uppercase;
  color: var(--k);
}
.stf-line {
  display: block;
  overflow: hidden;
  padding-top: 0.06em;
  margin-top: -0.06em;
}
.stf-title[data-slit="true"] { cursor: default; }
.stf-title { --stf-cut-k: 1; }
@container (max-width: 560px) {
  .stf-title { --stf-cut-k: 0.86; }
}
.stf-word { display: inline-block; white-space: nowrap; }
.stf-ch {
  display: inline-block;
  transform: translateY(calc(var(--stf-cut) * var(--stf-cut-k)));
  transition: transform 820ms var(--stf-ease-out);
  transition-delay: min(calc(var(--i) * 26ms), 420ms);
}
.stf[data-intro="pending"] .stf-ch {
  transform: translateY(104%);
  transition: none;
}
@media (hover: hover) and (pointer: fine) {
  .stf-title[data-slit="true"]:hover .stf-ch {
    transform: translateY(0);
    transition-duration: 420ms;
    transition-delay: min(calc(var(--i) * 14ms), 220ms);
  }
}

.stf-ticker {
  margin-top: clamp(28px, 3.4cqi, 48px);
  border-top: var(--stf-rule) solid var(--k);
  border-bottom: var(--stf-rule) solid var(--k);
  overflow: hidden;
  white-space: nowrap;
  font-size: clamp(15px, 1.7cqi, 24px);
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: 0.55em 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.stf-ticker-mask {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
}
.stf-ticker-toggle {
  flex: none;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  appearance: none;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--k);
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease;
}
.stf-ticker-toggle svg { width: 14px; height: 14px; }
.stf-ticker-toggle:hover { background: var(--k); color: var(--o); }
.stf-ticker-toggle:focus-visible { outline: 2px solid var(--k); outline-offset: 2px; }
.stf-ticker-track { display: inline-flex; animation: stf-ticker 38s linear infinite; }
.stf-ticker:hover .stf-ticker-track,
.stf-ticker:focus-within .stf-ticker-track,
.stf-ticker[data-paused="true"] .stf-ticker-track { animation-play-state: paused; }
.stf-ticker-run { display: inline-flex; flex: none; }
.stf-ticker-run span { padding: 0 0.9em; }
.stf-ticker-run span::after { content: ""; display: inline-block; width: 0.38em; height: 0.38em; border-radius: 50%; background: var(--k); margin-left: 1.8em; vertical-align: 0.14em; }
@keyframes stf-ticker { to { transform: translateX(-50%); } }

.stf-meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  margin: clamp(32px, 4.2cqi, 64px) 0 clamp(24px, 3cqi, 40px);
  align-items: end;
}
@container (min-width: 760px) {
  .stf-meta { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); gap: 48px; }
}
.stf-intro {
  margin: 0;
  max-width: 34ch;
  font-size: clamp(17px, 1.45cqi, 21px);
  line-height: 1.45;
  font-weight: 500;
  letter-spacing: -0.01em;
}
.stf-search { position: relative; }
.stf-search label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin-bottom: 6px;
}
.stf-field { position: relative; display: flex; align-items: center; border-bottom: var(--stf-rule) solid var(--k); }
.stf-field svg { flex: none; width: 20px; height: 20px; margin-right: 10px; }
.stf-field input {
  flex: 1;
  min-width: 0;
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--k);
  font: inherit;
  font-size: clamp(18px, 1.6cqi, 22px);
  font-weight: 500;
  padding: 10px 0 12px;
  outline: none;
}
.stf-field input::placeholder { color: var(--k); opacity: 0.55; }
.stf-field input::-webkit-search-cancel-button { display: none; }
.stf-field:focus-within { box-shadow: 0 1px 0 var(--k); }
.stf-clear {
  flex: none;
  appearance: none;
  border: 0;
  background: none;
  color: var(--k);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  padding: 10px 0 10px 12px;
}
.stf-count { margin-top: 8px; font-size: 13px; font-weight: 500; font-variant-numeric: tabular-nums; min-height: 1.4em; }

.stf-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 clamp(20px, 2.4cqi, 32px); padding: 0; list-style: none; }
.stf-chip {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 16px;
  border: 1.5px solid var(--k);
  border-radius: 999px;
  background: transparent;
  color: var(--k);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease, transform 120ms ease;
}
.stf-chip small { font-size: 12px; font-weight: 600; opacity: 0.75; font-variant-numeric: tabular-nums; }
.stf-chip[aria-pressed="true"] { background: var(--k); color: var(--o); }
.stf-chip:active { transform: scale(0.97); }
.stf-chip:focus-visible { outline: 2px solid var(--k); outline-offset: 3px; }

.stf-list { margin: 0; padding: 0; list-style: none; border-bottom: var(--stf-rule) solid var(--k); }
.stf-item { position: relative; border-top: var(--stf-rule) solid var(--k); }
.stf-fill {
  position: absolute;
  top: calc(var(--stf-rule) * -1);
  bottom: 0;
  left: calc(var(--stf-gutter) * -1);
  right: calc(var(--stf-gutter) * -1);
  background: var(--k);
  clip-path: inset(0 100% 0 0);
  pointer-events: none;
}
.stf-item[data-state="open"] .stf-fill { clip-path: inset(0 0 0 0); transition: clip-path var(--stf-flood-in) var(--stf-ease-flood); }
.stf-item[data-state="closing"] .stf-fill { clip-path: inset(0 0 0 100%); transition: clip-path var(--stf-flood-out) var(--stf-ease-flood); }

.stf-h { margin: 0; font: inherit; }
.stf-btn {
  position: relative;
  display: block;
  width: 100%;
  appearance: none;
  border: 0;
  margin: 0;
  padding: 0;
  background: none;
  color: var(--k);
  font: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.stf-btn:focus-visible { outline: none; }
.stf-btn::after {
  content: "";
  position: absolute;
  top: 5px;
  bottom: 5px;
  left: calc(var(--stf-gutter) * -0.5);
  right: calc(var(--stf-gutter) * -0.5);
  box-shadow: inset 0 0 0 2px var(--k);
  opacity: 0;
  pointer-events: none;
}
.stf-item[data-state="open"] .stf-btn::after { box-shadow: inset 0 0 0 2px var(--o); }
.stf-btn:focus-visible::after { opacity: 1; }
.stf-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  min-height: 64px;
  padding: clamp(16px, 1.9cqi, 26px) 0;
  font-size: clamp(20px, 2.15cqi, 34px);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.025em;
  text-wrap: balance;
}
.stf-btn:active .stf-plus { scale: 0.88; }
.stf-row--inv {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--stf-gutter) * -1);
  right: calc(var(--stf-gutter) * -1);
  padding-left: var(--stf-gutter);
  padding-right: var(--stf-gutter);
  color: var(--o);
  clip-path: inset(0 100% 0 0);
  pointer-events: none;
}
.stf-item[data-state="open"] .stf-row--inv { clip-path: inset(0 0 0 0); transition: clip-path var(--stf-flood-in) var(--stf-ease-flood); }
.stf-item[data-state="closing"] .stf-row--inv { clip-path: inset(0 0 0 100%); transition: clip-path var(--stf-flood-out) var(--stf-ease-flood); }
.stf-row--inv .stf-mark { background: var(--o); color: var(--k); }

.stf-label { display: block; transition: transform 240ms var(--stf-ease-out); }
.stf-snippet { display: block; margin-top: 8px; font-size: clamp(15px, 1.15cqi, 17px); font-weight: 500; line-height: 1.4; letter-spacing: -0.005em; opacity: 0.9; }
.stf-cell {
  position: relative;
  display: grid;
  place-items: center;
  width: clamp(44px, 3.9cqi, 56px);
  height: clamp(44px, 3.9cqi, 56px);
}
.stf-cell::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--k);
  clip-path: inset(0 100% 0 0);
  transition: clip-path 220ms var(--stf-ease-out);
}
.stf-row--inv .stf-cell::before { display: none; }
.stf-plus {
  position: relative;
  display: block;
  overflow: visible;
  width: clamp(22px, 2.2cqi, 32px);
  height: clamp(22px, 2.2cqi, 32px);
  transition: transform 280ms var(--stf-ease-out), scale 120ms ease;
}
.stf-item[data-state="open"] .stf-plus { transform: rotate(135deg); transition-duration: var(--stf-flood-in); }
@media (hover: hover) and (pointer: fine) {
  .stf-btn:hover .stf-label { transform: translateX(0.3em); }
  .stf-item[data-state="closed"] .stf-btn:hover .stf-cell::before { clip-path: inset(0 0 0 0); }
  .stf-item[data-state="closed"] .stf-btn:hover .stf-plus { color: var(--o); }
}
.stf-plus { transition: transform 280ms var(--stf-ease-out), scale 120ms ease, color 160ms ease; }
.stf-mark { background: var(--k); color: var(--o); border-radius: 0; }

.stf-panel {
  position: relative;
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 240ms var(--stf-ease-out);
}
.stf-item[data-state="open"] .stf-panel { grid-template-rows: 1fr; transition: grid-template-rows 360ms var(--stf-ease-out); }
.stf-panel-in { overflow: hidden; min-height: 0; }
.stf-item[data-state="closed"] .stf-panel-in { visibility: hidden; }
.stf-answer {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  padding: 0 0 clamp(24px, 2.8cqi, 40px);
  color: var(--o);
}
.stf-text {
  max-width: 58ch;
  font-size: clamp(17px, 1.45cqi, 21px);
  line-height: 1.5;
  font-weight: 500;
  letter-spacing: -0.005em;
}
.stf-text p { margin: 0 0 0.8em; text-wrap: pretty; }
.stf-text p:last-child { margin-bottom: 0; }
.stf-text a { color: inherit; text-decoration: underline; text-underline-offset: 3px; }
.stf-text .stf-mark { background: var(--o); color: var(--k); }
.stf-tools { display: flex; align-items: flex-start; gap: 16px; font-size: 14px; font-weight: 600; order: 1; }
.stf-tag { padding: 3px 10px; border: 1.5px solid var(--o); border-radius: 999px; font-size: 13px; }
.stf-copy {
  appearance: none;
  border: 0;
  background: none;
  padding: 9px 0;
  margin-top: -5px;
  color: var(--o);
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.stf-copy:focus-visible { outline: 2px solid var(--o); outline-offset: 3px; }
@container (min-width: 760px) {
  .stf-answer { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); column-gap: 48px; row-gap: 20px; }
  .stf-text,
  .stf-tools { grid-column: 2; }
}

.stf-empty { padding: clamp(28px, 4cqi, 56px) 0; border-top: var(--stf-rule) solid var(--k); }
.stf-reset { color: var(--k); font-size: 16px; font-weight: 600; }
.stf-reset:focus-visible { outline-color: var(--k); }
.stf-empty p { margin: 0 0 14px; font-size: clamp(20px, 2.15cqi, 34px); font-weight: 700; letter-spacing: -0.025em; line-height: 1.15; }

.stf-contact {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px 32px;
  margin-top: clamp(36px, 5cqi, 72px);
}
.stf-contact p { margin: 0; font-size: clamp(22px, 2.6cqi, 40px); font-weight: 800; letter-spacing: -0.035em; line-height: 1.05; }
.stf-cta {
  position: relative;
  display: inline-flex;
  min-height: 52px;
  border: 1.5px solid var(--k);
  border-radius: 999px;
  overflow: hidden;
  color: var(--k);
  text-decoration: none;
  font-size: clamp(16px, 1.35cqi, 19px);
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
  transition: transform 140ms ease;
}
.stf-cta > span { display: inline-flex; align-items: center; gap: 12px; padding: 0 26px; }
.stf-cta > span + span {
  position: absolute;
  inset: 0;
  background: var(--k);
  color: var(--o);
  clip-path: inset(0 100% 0 0);
  transition: clip-path 360ms var(--stf-ease-flood);
}
.stf-cta svg { width: 18px; height: 18px; transition: transform 360ms var(--stf-ease-out); }
.stf-cta:hover > span + span,
.stf-cta:focus-visible > span + span { clip-path: inset(0 0 0 0); }
.stf-cta:hover svg,
.stf-cta:focus-visible svg { transform: translateX(4px); }
.stf-cta:active { transform: scale(0.98); }
.stf-cta:focus-visible { outline: 2px solid var(--k); outline-offset: 3px; }

.stf-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

@media (prefers-reduced-motion: reduce) {
  .stf-ch,
  .stf[data-intro="pending"] .stf-ch { transform: translateY(calc(var(--stf-cut) * var(--stf-cut-k))); transition: none; }
  .stf-ticker-track { animation: none; }
  .stf-ticker-toggle { display: none; }
  .stf-fill,
  .stf-row--inv,
  .stf-panel,
  .stf-plus,
  .stf-label,
  .stf-cell::before,
  .stf-cta > span + span,
  .stf-cta svg,
  .stf-item[data-state] .stf-fill,
  .stf-item[data-state] .stf-row--inv,
  .stf-item[data-state] .stf-panel { transition: none !important; }
  .stf-btn:hover .stf-label { transform: none !important; }
  .stf-title[data-slit="true"]:hover .stf-ch { transition: none !important; }
}
`;function be({text:t,id:s,slit:r}){let l=0,p=t.split(`
`);return(0,e.jsx)("h2",{className:"stf-title",id:s,"aria-label":p.join(" "),"data-slit":r?"true":"false",children:p.map((f,c)=>(0,e.jsx)("span",{className:"stf-line","aria-hidden":"true",children:f.split(" ").map((d,m,x)=>(0,e.jsxs)(o.Fragment,{children:[(0,e.jsx)("span",{className:"stf-word",children:Array.from(d).map((T,S)=>(0,e.jsx)("span",{className:"stf-ch",style:{"--i":l++},children:T},S))}),m<x.length-1?" ":null]},m))},c))})}function st({items:t=ve,headline:s=`Before you
send files`,slit:r=.42,intro:l="Riso is a stencil process with soy ink and real drums. Most surprises start with file setup, so here is what to know first.",preset:p="signal",palette:f,darkPalette:c,theme:d="auto",type:m="single",defaultOpen:x=0,open:T,idPrefix:S="",search:it=!0,searchLabel:At="Search the answers",categories:B,ticker:C,contact:z={prompt:"Still have a question?",label:"Email the press room",href:"mailto:hello@drumroom.press"},copyLinks:ot=!0,syncHash:Lt=!1,minHeight:_=0,displayFont:Pt='"Inter Display", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", "Arial Black", Arial, sans-serif',textFont:Ot='Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',onOpenChange:lt,ariaLabel:ct,className:ft,style:Dt}){let R=o.useId().replace(/[^a-zA-Z0-9_-]/g,""),pt=o.useRef(null),A=o.useRef([]),N=o.useRef({}),L=m==="single",M=o.useMemo(()=>fe(t.map(n=>n.question),t.map(n=>n.id)).map(n=>S+n),[t,S]),W=o.useMemo(()=>t.map(n=>n.answerText??et(n.answer)),[t]),P=o.useMemo(()=>t.map((n,a)=>n.question+" "+W[a]),[t,W]),[Ht,Bt]=o.useState(()=>ue(x,M,L,S)),h=T??Ht,j=o.useRef(h);j.current=h;let dt=o.useRef(!1);dt.current=T!==void 0;let ut=o.useRef(lt);ut.current=lt;let U=o.useCallback(n=>{dt.current||Bt(n),ut.current?.(n)},[]),[_t,K]=o.useState([]),[g,O]=o.useState(""),[b,Y]=o.useState(null),[mt,gt]=o.useState(null),[D,Wt]=o.useState(!1),[jt,X]=o.useState("pending"),q=o.useCallback(()=>typeof window<"u"&&!!window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches,[]);o.useEffect(()=>{let n=pt.current;if(!n||q()||typeof IntersectionObserver>"u"){X("done");return}let a=new IntersectionObserver(u=>{u.some(w=>w.isIntersecting)&&(requestAnimationFrame(()=>X("done")),a.disconnect())},{threshold:.15});a.observe(n);let i=window.setTimeout(()=>X("done"),2500);return()=>{a.disconnect(),window.clearTimeout(i)}},[q]),o.useEffect(()=>{let n=()=>{let a=decodeURIComponent(location.hash.replace(/^#/,""));if(!a||!M.includes(a))return;let i=j.current;i.includes(a)||U(L?[a]:[...i,a]);let u=M.indexOf(a);window.setTimeout(()=>A.current[u]?.scrollIntoView({block:"center",behavior:q()?"auto":"smooth"}),60)};return n(),window.addEventListener("hashchange",n),()=>window.removeEventListener("hashchange",n)},[M,L,q,U]),o.useEffect(()=>{let n=N.current;return()=>Object.values(n).forEach(a=>window.clearTimeout(a))},[]);let ht=o.useCallback(n=>{if(n.length&&!q()){K(a=>[...a.filter(i=>!n.includes(i)),...n]);for(let a of n)window.clearTimeout(N.current[a]),N.current[a]=window.setTimeout(()=>{K(i=>i.filter(u=>u!==a))},300)}},[q]),vt=o.useRef(h),Ut=h.join("|");ge(()=>{let n=vt.current,a=j.current;vt.current=a;let i=a.filter(u=>!n.includes(u));if(i.length){for(let u of i)window.clearTimeout(N.current[u]);K(u=>u.filter(w=>!i.includes(w)))}ht(n.filter(u=>!a.includes(u)))},[Ut,ht]);let Kt=n=>{let a=h.includes(n);if(U(a?h.filter(i=>i!==n):L?[n]:[...h,n]),Lt&&typeof history<"u"){let i=decodeURIComponent(location.hash.replace(/^#/,""))===n;(!a||i)&&history.replaceState(history.state,"",location.pathname+location.search+(a?"":"#"+n))}},Yt=async n=>{let a=location.origin+location.pathname+location.search+"#"+n;try{await navigator.clipboard.writeText(a)}catch{let i=document.createElement("textarea");i.value=a,i.setAttribute("readonly",""),i.style.position="fixed",i.style.opacity="0",document.body.appendChild(i),i.select();try{document.execCommand("copy")}catch{}i.remove()}gt(n),window.clearTimeout(N.current.__copy),N.current.__copy=window.setTimeout(()=>gt(null),1800)},Xt=o.useMemo(()=>{let n={};return t.forEach((a,i)=>{a.category&&$(P[i],g)&&(n[a.category]=(n[a.category]||0)+1)}),n},[t,P,g]),Qt=P.filter(n=>$(n,g)).length,k=t.map((n,a)=>({it:n,i:a,id:M[a]})).filter(({it:n,i:a})=>(!b||n.category===b)&&$(P[a],g)),Vt=(n,a)=>{let i=me(n.key,a,k.length);i<0||(n.preventDefault(),A.current[k[i].i]?.focus())},xt=Ct[p]??Ct.signal,F={...xt.light,...f},E={...xt.dark,...c},Zt=f?.onInk??(f?.ink||f?.paper?Mt(F.ink,F.paper):F.onInk),$t=c?.onInk??(c?.ink||c?.paper?Mt(E.ink,E.paper):E.onInk),Q=Math.min(.5,Math.max(0,r)),Jt={"--stf-cut":Q>0?"calc("+(Q*.72).toFixed(3)+"em + 0.05em)":"0px","--stf-paper-l":F.paper,"--stf-ink-l":F.ink,"--stf-on-l":Zt,"--stf-paper-d":E.paper,"--stf-ink-d":E.ink,"--stf-on-d":$t,"--stf-display-font":Pt,"--stf-text-font":Ot,minHeight:typeof _=="number"?_+"px":_,...Dt},Gt=s.split(`
`).join(" "),te=g.trim()!==""||b!==null;return(0,e.jsxs)("section",{ref:pt,className:"stf"+(ft?" "+ft:""),"data-theme":d,"data-intro":jt,"aria-label":ct??(s?void 0:"Frequently asked questions"),"aria-labelledby":!ct&&s?R+"-h":void 0,style:Jt,children:[(0,e.jsx)("style",{children:xe}),(0,e.jsxs)("div",{className:"stf-wrap",children:[s?(0,e.jsx)(be,{text:s,id:R+"-h",slit:Q>0}):null,C&&C.length?(0,e.jsxs)("div",{className:"stf-ticker","data-paused":D?"true":"false",children:[(0,e.jsx)("p",{className:"stf-sr",children:C.join(". ")}),(0,e.jsx)("div",{className:"stf-ticker-mask","aria-hidden":"true",children:(0,e.jsx)("div",{className:"stf-ticker-track",children:[0,1].map(n=>(0,e.jsx)("div",{className:"stf-ticker-run",children:[...C,...C].map((a,i)=>(0,e.jsx)("span",{children:a},i))},n))})}),(0,e.jsx)("button",{type:"button",className:"stf-ticker-toggle","aria-label":D?"Play the moving line":"Pause the moving line","aria-pressed":D,onClick:()=>Wt(n=>!n),children:D?(0,e.jsx)("svg",{viewBox:"0 0 14 14","aria-hidden":"true",children:(0,e.jsx)("path",{d:"M3.5 2v10l8.5-5z",fill:"currentColor"})}):(0,e.jsx)("svg",{viewBox:"0 0 14 14","aria-hidden":"true",children:(0,e.jsx)("path",{d:"M3 2h3v10H3zM8 2h3v10H8z",fill:"currentColor"})})})]}):null,l||it?(0,e.jsxs)("div",{className:"stf-meta",children:[l?(0,e.jsx)("p",{className:"stf-intro",children:l}):(0,e.jsx)("span",{}),it?(0,e.jsxs)("div",{className:"stf-search",role:"search",children:[(0,e.jsx)("label",{htmlFor:R+"-q",children:At}),(0,e.jsxs)("div",{className:"stf-field",children:[(0,e.jsxs)("svg",{viewBox:"0 0 20 20",fill:"none","aria-hidden":"true",children:[(0,e.jsx)("circle",{cx:"8.5",cy:"8.5",r:"6",stroke:"currentColor",strokeWidth:"1.6"}),(0,e.jsx)("path",{d:"m13 13 5 5",stroke:"currentColor",strokeWidth:"1.6",strokeLinecap:"round"})]}),(0,e.jsx)("input",{id:R+"-q",type:"search",autoComplete:"off",spellCheck:!1,value:g,placeholder:"Try \u201C"+(ke(t)||"shipping")+"\u201D",onChange:n=>O(n.target.value),onKeyDown:n=>{n.key==="Escape"&&g&&(n.preventDefault(),O("")),n.key==="ArrowDown"&&k.length&&(n.preventDefault(),A.current[k[0].i]?.focus())}}),g?(0,e.jsx)("button",{type:"button",className:"stf-clear",onClick:()=>O(""),children:"Clear"}):null]}),(0,e.jsx)("div",{className:"stf-count","aria-live":"polite",children:te?k.length+" of "+t.length+" questions":""})]}):null]}):null,B&&B.length?(0,e.jsxs)("ul",{className:"stf-chips","aria-label":"Filter by topic",children:[(0,e.jsx)("li",{children:(0,e.jsxs)("button",{type:"button",className:"stf-chip","aria-pressed":b===null,onClick:()=>Y(null),children:["All ",(0,e.jsx)("small",{children:Qt})]})}),B.map(n=>(0,e.jsx)("li",{children:(0,e.jsxs)("button",{type:"button",className:"stf-chip","aria-pressed":b===n,onClick:()=>Y(b===n?null:n),children:[n," ",(0,e.jsx)("small",{children:Xt[n]||0})]})},n))]}):null,k.length?(0,e.jsx)("ul",{className:"stf-list","aria-label":Gt?void 0:"Questions",children:k.map(({it:n,i:a,id:i},u)=>{let w=h.includes(i),ee=w?"open":_t.includes(i)?"closing":"closed",bt=R+"-b-"+a,kt=R+"-p-"+a,wt=g.trim()&&!w?de(W[a],g):"",yt=I=>(0,e.jsxs)("span",{className:"stf-row"+(I?" stf-row--inv":""),"aria-hidden":I?"true":void 0,children:[(0,e.jsxs)("span",{className:"stf-label",children:[(0,e.jsx)(tt,{text:n.question,query:g}),wt?(0,e.jsx)("span",{className:"stf-snippet",children:(0,e.jsx)(tt,{text:wt,query:g})}):null]}),(0,e.jsx)(he,{})]});return(0,e.jsxs)("li",{id:i,className:"stf-item","data-state":ee,children:[(0,e.jsx)("span",{className:"stf-fill","aria-hidden":"true"}),(0,e.jsx)("h3",{className:"stf-h",children:(0,e.jsxs)("button",{ref:I=>{A.current[a]=I},id:bt,type:"button",className:"stf-btn","aria-expanded":w,"aria-controls":kt,onClick:()=>Kt(i),onKeyDown:I=>Vt(I,u),children:[yt(!1),yt(!0)]})}),(0,e.jsx)("div",{className:"stf-panel",id:kt,role:"region","aria-labelledby":bt,children:(0,e.jsx)("div",{className:"stf-panel-in",children:(0,e.jsxs)("div",{className:"stf-answer",children:[(0,e.jsx)("div",{className:"stf-text",children:typeof n.answer=="string"?(0,e.jsx)("p",{children:(0,e.jsx)(tt,{text:n.answer,query:g})}):n.answer}),ot||n.category?(0,e.jsxs)("div",{className:"stf-tools",children:[n.category?(0,e.jsx)("span",{className:"stf-tag",children:n.category}):null,ot?(0,e.jsx)("button",{type:"button",className:"stf-copy",onClick:()=>Yt(i),children:mt===i?"Link copied":"Copy link"}):null]}):null]})})})]},i)})}):(0,e.jsxs)("div",{className:"stf-empty",role:"status",children:[(0,e.jsxs)("p",{children:["Nothing here matches \u201C",g.trim()||b,"\u201D."]}),(0,e.jsx)("button",{type:"button",className:"stf-copy stf-reset",onClick:()=>{O(""),Y(null)},children:"Show every question"})]}),z?(0,e.jsxs)("div",{className:"stf-contact",children:[(0,e.jsx)("p",{children:z.prompt}),(0,e.jsxs)("a",{className:"stf-cta",href:z.href,children:[(0,e.jsxs)("span",{children:[z.label," ",(0,e.jsx)(Ft,{})]}),(0,e.jsxs)("span",{"aria-hidden":"true",children:[z.label," ",(0,e.jsx)(Ft,{})]})]})]}):null,(0,e.jsx)("span",{className:"stf-sr","aria-live":"polite",children:mt?"Link copied":""})]})]})}function Ft(){return(0,e.jsx)("svg",{viewBox:"0 0 18 18",fill:"none","aria-hidden":"true",children:(0,e.jsx)("path",{d:"M3 9h11M10 4.5 14.5 9 10 13.5",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round"})})}function ke(t){let s=new Set(["what","which","where","when","does","should","could","would","every","there","their","about","before","after","your","from","with","have","this","that","many","much","long","take","make","copy","look","slightly","different"]);for(let r of t.slice(1))for(let l of r.question.toLowerCase().replace(/[^a-z\s]/g,"").split(/\s+/))if(l.length>4&&!s.has(l))return l;return""}var at=v(y(),1);function H(){return(0,at.jsx)("div",{className:"w-full",children:(0,at.jsx)(st,{})})}var Tt=v(y(),1),we=H||Object.values(rt).find(t=>typeof t=="function");(0,Et.createRoot)(document.getElementById("root")).render((0,Tt.jsx)(we,{}));})();
