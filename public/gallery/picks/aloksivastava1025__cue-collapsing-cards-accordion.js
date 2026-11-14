(()=>{var k=Object.create;var d=Object.defineProperty;var z=Object.getOwnPropertyDescriptor;var C=Object.getOwnPropertyNames;var N=Object.getPrototypeOf,M=Object.prototype.hasOwnProperty;var l=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports),A=(e,t)=>{for(var i in t)d(e,i,{get:t[i],enumerable:!0})},I=(e,t,i,s)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of C(t))!M.call(e,o)&&o!==i&&d(e,o,{get:()=>t[o],enumerable:!(s=z(t,o))||s.enumerable});return e};var c=(e,t,i)=>(i=e!=null?k(N(e)):{},I(t||!e||!e.__esModule?d(i,"default",{value:e,enumerable:!0}):i,e));var g=l((D,f)=>{f.exports=window.__gx.ReactDOMClient});var b=l((L,x)=>{x.exports=window.__gx.React});var r=l((Y,v)=>{v.exports=window.__gx.JsxRuntime});var w=c(g(),1);var m={};A(m,{default:()=>n});var h=c(b()),a=c(r()),j=[{idx:1,wordmark:"Aether",title:"Aether \u2014 a study in warmth",img:"https://cdn.21st.dev/assets/mirror/c3/c3913b0cfd79b66a8999dc54e3c6f00c25441c5297700b689ac72edaede3cecf.jpg"},{idx:2,wordmark:"Marrow",title:"Marrow \u2014 texture and shadow",img:"https://cdn.21st.dev/assets/mirror/ea/eaac24bcfcf3e603a82c1e5faa9c2e7b39be3de188c8b8c88ee12f7bad5798c5.jpg"},{idx:3,wordmark:"Kite",title:"Kite \u2014 light as a whisper",img:"https://cdn.21st.dev/assets/mirror/e2/e2d06b1d978d17946bcae4205f21d6532e09771da76cb9003081c48bc3d467b4.jpg"},{idx:4,wordmark:"Lume",title:"Lume \u2014 a slow evening",img:"https://cdn.21st.dev/assets/mirror/73/73997ed82ce2a70dc70ce565a82cb8f1e684c236be55a3b3249d565105f1e1f4.jpg"},{idx:5,wordmark:"Halo",title:"Halo \u2014 reaching for calm",img:"https://cdn.21st.dev/assets/mirror/75/7581a74f70b6403aa5b42e511aa15a63bbaaea770ff936a287942c1bf868a8d0.jpg"}],F=(0,a.jsx)("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",children:(0,a.jsx)("path",{d:"M7 17 17 7M8 7h9v9"})});function p(){let[e,t]=(0,h.useState)(1);return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("style",{children:R}),(0,a.jsx)("div",{className:"cc-cards",children:j.map(i=>(0,a.jsxs)("div",{className:`cc-card ${e===i.idx?"active":""}`,onMouseEnter:()=>t(i.idx),onClick:()=>t(i.idx),children:[(0,a.jsx)("div",{className:"cc-img",style:{backgroundImage:`url('${i.img}')`}}),(0,a.jsx)("div",{className:"cc-v-title",children:i.wordmark}),(0,a.jsxs)("div",{className:"cc-content",children:[(0,a.jsxs)("div",{className:"cc-idx",children:[String(i.idx).padStart(2,"0")," / 05"]}),(0,a.jsxs)("div",{className:"cc-meta",children:[(0,a.jsx)("div",{className:"cc-title",children:i.title}),(0,a.jsxs)("a",{href:"#",className:"cc-cta",onClick:s=>s.stopPropagation(),children:["View ",F]})]})]})]},i.idx))})]})}var R=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; }
html, body { height: 100%; margin: 0; padding: 0; }
body {
  height: 100vh;
  background: #0A0A0B;
  color: #FFFFFF;
  font-family: 'Inter', -apple-system, sans-serif;
  display: flex; align-items: center; justify-content: center;
  padding: 32px;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* Card row \u2014 fills viewport */
.cc-cards {
  display: flex; gap: 10px;
  width: 100%; max-width: 1280px;
  height: 100%;
}

.cc-card {
  position: relative;
  flex: 0.7;
  min-width: 92px;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: flex 0.75s cubic-bezier(0.2, 1, 0.3, 1);
  will-change: flex;
  background: #1a1a1c;
}
.cc-card.active { flex: 2.6; }

.cc-img {
  position: absolute; inset: 0;
  background-size: cover;
  background-position: center;
  transform: scale(1.04);
  transition: transform 0.9s cubic-bezier(0.2, 1, 0.3, 1),
              filter    0.75s cubic-bezier(0.2, 1, 0.3, 1);
  filter: grayscale(30%) brightness(0.75);
}
.cc-card.active .cc-img { transform: scale(1); filter: grayscale(0%) brightness(0.92); }

.cc-card::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(to top,
    rgba(0,0,0,0.65) 0%,
    rgba(0,0,0,0.28) 35%,
    rgba(0,0,0,0.10) 60%,
    rgba(0,0,0,0.40) 100%);
  pointer-events: none;
}

.cc-content {
  position: relative; z-index: 2;
  height: 100%;
  padding: 22px;
  display: flex; flex-direction: column;
  color: #fff;
}
.cc-idx {
  font-size: 11px; letter-spacing: 0.14em;
  color: rgba(255,255,255,0.72); font-weight: 500;
}
.cc-meta {
  margin-top: auto;
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 12px;
}
.cc-title {
  font-size: 22px; font-weight: 500;
  letter-spacing: -0.015em;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.35s ease 0.15s,
              transform 0.5s cubic-bezier(0.2, 1, 0.3, 1) 0.15s;
}
.cc-card.active .cc-title { opacity: 1; transform: translateY(0); }

.cc-v-title {
  position: absolute;
  left: 22px; bottom: 22px;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 13px; font-weight: 500;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: rgba(255,255,255,0.85);
  transition: opacity 0.3s ease;
  z-index: 2;
}
.cc-card.active .cc-v-title { opacity: 0; }

.cc-cta {
  font-size: 11px; letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.85); font-weight: 500;
  text-decoration: none;
  display: inline-flex; align-items: center; gap: 6px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.35s ease 0.2s,
              transform 0.5s cubic-bezier(0.2, 1, 0.3, 1) 0.2s;
}
.cc-card.active .cc-cta { opacity: 1; transform: translateY(0); }
.cc-cta svg { width: 12px; height: 12px; }

@media (max-width: 900px) {
  .cc-title { font-size: 18px; }
}
@media (max-width: 640px) {
  body { padding: 16px; }
  .cc-cards { flex-direction: column; gap: 6px; }
  .cc-card { flex: 0.8; min-height: 0; }
  .cc-card.active { flex: 3; }
  .cc-v-title { writing-mode: horizontal-tb; transform: none; left: 16px; bottom: 14px; }
  .cc-content { padding: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .cc-card, .cc-img, .cc-title, .cc-cta, .cc-v-title { transition-duration: 0.15s !important; }
}
`;var u=c(r(),1);function n(){return(0,u.jsx)(p,{})}var y=c(r(),1),S=n||Object.values(m).find(e=>typeof e=="function");(0,w.createRoot)(document.getElementById("root")).render((0,y.jsx)(S,{}));})();
