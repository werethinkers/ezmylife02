(()=>{var be=Object.create;var N=Object.defineProperty;var fe=Object.getOwnPropertyDescriptor;var he=Object.getOwnPropertyNames;var xe=Object.getPrototypeOf,ye=Object.prototype.hasOwnProperty;var P=(n,e)=>()=>(e||n((e={exports:{}}).exports,e),e.exports),ve=(n,e)=>{for(var o in e)N(n,o,{get:e[o],enumerable:!0})},we=(n,e,o,d)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of he(e))!ye.call(n,i)&&i!==o&&N(n,i,{get:()=>e[i],enumerable:!(d=fe(e,i))||d.enumerable});return n};var g=(n,e,o)=>(o=n!=null?be(xe(n)):{},we(e||!n||!n.__esModule?N(o,"default",{value:n,enumerable:!0}):o,n));var J=P(($e,V)=>{V.exports=window.__gx.ReactDOMClient});var W=P((ze,K)=>{K.exports=window.__gx.React});var u=P((Be,Q)=>{Q.exports=window.__gx.JsxRuntime});var Z=g(J(),1);var B={};ve(B,{default:()=>M});var a=g(W()),r=g(u()),ke={gold:"#ffcc70",silver:"#dddde0",bronze:"#df9070",platinum:"#ffffff"},Me={gold:{ink:"oklch(0.22 0.06 70)",sub:"oklch(0.38 0.03 70)",glow1:"rgba(255, 215, 170, .55)",glow2:"rgba(255, 235, 200, .28)"},bronze:{ink:"oklch(0.20 0.06 45)",sub:"oklch(0.36 0.03 45)",glow1:"rgba(255, 200, 165, .52)",glow2:"rgba(255, 215, 185, .26)"},silver:{ink:"oklch(0.16 0 240)",sub:"oklch(0.40 0 240)",glow1:"rgba(255, 255, 255, .46)",glow2:"rgba(245, 245, 255, .22)"},platinum:{ink:"oklch(0.15 0 250)",sub:"oklch(0.38 0 250)",glow1:"rgba(255, 255, 255, .42)",glow2:"rgba(235, 240, 255, .2)"}};function $({name:n="Rahil Vahora",role:e="Software Developer",company:o="ABCD",email:d="rahilisvahora@gmail.com",phone:i,website:f,logoSrc:C,logoAlt:E="Logo",metal:L="silver",width:S=420,radius:te=16,maxRotation:A=40,influenceRadius:F=500,ease:T=.08,lightFollow:D=.4,mode:_="system",compact:re=!1,align:h="left",className:ne=""}){let j=(0,a.useRef)(null),I=(0,a.useRef)(null),O=(0,a.useMemo)(()=>({noise:`noiseFilter-${Math.random().toString(36).slice(2,8)}`}),[]),l=(0,a.useRef)({angle:0,x:0,y:0}),c=(0,a.useRef)({angle:0,x:0,y:0}),m=(0,a.useRef)({x:50,y:50}),p=(0,a.useRef)({x:50,y:50}),x=(0,a.useRef)(null),b=(t,v,s)=>t+(v-t)*s,ae=()=>{let t=j.current;t&&(t.style.setProperty("--gradient-rotation",`${l.current.angle}deg`),t.style.setProperty("--rotate-x",`${l.current.x}deg`),t.style.setProperty("--rotate-y",`${l.current.y}deg`),t.style.setProperty("--gradient-position-x",`${m.current.x}%`),t.style.setProperty("--gradient-position-y",`${m.current.y}%`))},U=()=>{let t=T;l.current.angle=b(l.current.angle,c.current.angle,t),l.current.x=b(l.current.x,c.current.x,t),l.current.y=b(l.current.y,c.current.y,t),m.current.x=b(m.current.x,p.current.x,t),m.current.y=b(m.current.y,p.current.y,t),ae(),x.current=requestAnimationFrame(U)};(0,a.useEffect)(()=>(x.current=requestAnimationFrame(U),()=>{x.current&&cancelAnimationFrame(x.current)}),[T]);let G=()=>{c.current={angle:0,x:0,y:0},p.current={x:50,y:50}},oe=t=>{let v=I.current;if(!v)return;let s=v.getBoundingClientRect(),le=s.left+s.width/2,ce=s.top+s.height/2,ge=t.clientX-le,de=t.clientY-ce,Y=Math.hypot(ge,de),ue=Y<F,R=Math.max(.1,1-Math.min(1,Y/F)),w=Math.max(0,Math.min(1,(t.clientX-s.left)/s.width)),k=Math.max(0,Math.min(1,(t.clientY-s.top)/s.height));if(ue){p.current.x=50-(w-.5)*100*D,p.current.y=50-(k-.5)*100*D,c.current.y=(w-.5)*A*2*R,c.current.x=(.5-k)*A*2*R;let me=120*(1-w),pe=120*w;c.current.angle=(me*(1-k)+pe*k)*R}else c.current.angle=0},ie=_==="system"?void 0:_,se=Math.round(S/1.586),q=h==="center"?"center":h==="right"?"flex-end":"flex-start",H=h==="center"?"center":h==="right"?"right":"left",X=(0,a.useMemo)(()=>`card-title-${Math.random().toString(36).slice(2,8)}`,[]),y=Me[L];return(0,r.jsxs)("div",{ref:j,"data-theme":ie,className:["metal-wrap",ne].join(" "),style:{"--bg-card":ke[L],"--border-radius":`${te}px`,"--noise-filter":`url(#${O.noise})`,"--ink":y.ink,"--ink-sub":y.sub,"--glow-1":y.glow1,"--glow-2":y.glow2},role:"region","aria-labelledby":X,children:[(0,r.jsx)("svg",{width:"0",height:"0","aria-hidden":"true",focusable:"false",children:(0,r.jsxs)("filter",{id:O.noise,filterUnits:"objectBoundingBox",primitiveUnits:"userSpaceOnUse",colorInterpolationFilters:"linearRGB",children:[(0,r.jsx)("feTurbulence",{type:"turbulence",baseFrequency:"0.3",numOctaves:"4",seed:"15",stitchTiles:"stitch",result:"turbulence"}),(0,r.jsx)("feSpecularLighting",{surfaceScale:"1",specularConstant:"1.8",specularExponent:"10",lightingColor:"#7957A8",in:"turbulence",result:"specularLighting",children:(0,r.jsx)("feDistantLight",{azimuth:"3",elevation:"50"})}),(0,r.jsx)("feColorMatrix",{type:"saturate",values:"0",in:"specularLighting",result:"colormatrix"})]})}),(0,r.jsx)("div",{ref:I,className:"card",style:{width:S,height:se},onPointerMove:oe,onPointerLeave:G,onBlur:G,children:(0,r.jsxs)("div",{className:["content",re?"compact":""].join(" "),style:{alignItems:q,textAlign:H},children:[C?(0,r.jsx)("img",{src:C,alt:E,className:"logo","aria-hidden":E?void 0:!0}):null,(0,r.jsxs)("div",{className:"text-block",children:[(0,r.jsx)("h3",{id:X,className:"name",children:n}),e?(0,r.jsx)("p",{className:"role",children:e}):null,o?(0,r.jsx)("p",{className:"company",children:o}):null]}),(d||i||f)&&(0,r.jsxs)("div",{className:"contact",children:[d?(0,r.jsx)("p",{className:"item","aria-label":`Email ${d}`,children:d}):null,i?(0,r.jsx)("p",{className:"item","aria-label":`Phone ${i}`,children:i}):null,f?(0,r.jsx)("p",{className:"item","aria-label":`Website ${f}`,children:f}):null]})]})}),(0,r.jsx)("style",{jsx:!0,children:`
        .metal-wrap {
          --gradient-rotation: 0deg;
          --gradient-position-x: 50%;
          --gradient-position-y: 50%;
          --rotate-x: 0deg;
          --rotate-y: 0deg;
          display: grid;
          place-items: center;
          color-scheme: light dark;
          font-family:
            ui-sans-serif,
            system-ui,
            Segoe UI,
            Roboto,
            Helvetica,
            Arial,
            "Apple Color Emoji",
            "Segoe UI Emoji";
        }
        .metal-wrap[data-theme="dark"] {
          background: #000;
        }
        .metal-wrap[data-theme="light"] {
          background: #fff;
        }

        .card {
          position: relative;
          border-radius: var(--border-radius);
          transform: rotateX(var(--rotate-x)) rotateY(var(--rotate-y));
          transform-style: preserve-3d;
          transition:
            transform 0.1s ease-out,
            box-shadow 0.2s ease-out;
          overflow: hidden;
          box-shadow:
            0 10px 50px rgba(0, 0, 0, 0.25),
            inset -1px -1px 2px rgba(0, 0, 0, 0.3),
            inset 1px 1px 2px rgba(255, 255, 255, 0.3);
          background:
            radial-gradient(
              ellipse 160% 120% at var(--gradient-position-x)
                var(--gradient-position-y),
              transparent 0%,
              rgba(0, 0, 0, 1) 100%
            ),
            conic-gradient(
              from var(--gradient-rotation) at 50% 50%,
              rgba(0, 0, 0, 0.6) -120deg,
              rgba(255, 255, 255, 0.4) 9deg,
              rgba(0, 0, 0, 0.4) 60deg,
              rgba(0, 0, 0, 0.06) 107deg,
              rgba(0, 0, 0, 0.3) 131deg,
              rgba(0, 0, 0, 0) 188deg,
              rgba(0, 0, 0, 0.6) 240deg,
              rgba(255, 255, 255, 0.4) 367deg
            ),
            var(--bg-card);
        }
        .card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: var(--border-radius);
          filter: var(--noise-filter);
          opacity: 0.25;
          z-index: 1;
        }
        .card::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: var(--border-radius);
          background: var(--bg-card);
          mix-blend-mode: color;
          z-index: 2;
        }

        /* content layer */
        .content {
          position: absolute;
          inset: 0;
          z-index: 3;
          display: grid;
          grid-template-rows: 1fr auto auto;
          gap: 0.45rem;
          padding: 1.1rem 1.25rem;
          /* readable ink on reflective bg */
          color: var(--ink);
          text-shadow:
            0 1px 0 rgba(255, 255, 255, 0.3),
            0 8px 22px var(--glow-1),
            0 2px 10px var(--glow-2);
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }
        :global([data-theme="dark"]) .content {
          /* nudge contrast in dark canvas */
          text-shadow:
            0 1px 0 rgba(255, 255, 255, 0.22),
            0 10px 26px var(--glow-1),
            0 3px 12px var(--glow-2);
        }

        /* glass panel for readability */
        .content::before {
          content: "";
          position: absolute;
          inset: 0.6rem;
          border-radius: calc(var(--border-radius) - 8px);
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.08),
              rgba(255, 255, 255, 0.02)
            ),
            radial-gradient(
              80% 40% at 50% 0%,
              rgba(255, 255, 255, 0.06),
              transparent 60%
            );
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(2px) saturate(1.07);
          z-index: -1;
        }
        .content.compact {
          padding: 0.85rem 1rem;
        }

        .logo {
          position: absolute;
          top: 0.9rem;
          right: 0.9rem;
          height: 28px;
          width: auto;
          object-fit: contain;
          filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.35));
          pointer-events: none;
        }
        .content.compact .logo {
          top: 0.6rem;
          right: 0.6rem;
          height: 22px;
        }

        .text-block {
          align-self: end;
          display: grid;
          gap: 0.15rem;
        }

        /* Name: slightly heavier with subtle stroke for metals */
        .name {
          margin: 0;
          font-weight: 800;
          letter-spacing: 0.01em;
          line-height: 1.12;
          font-size: clamp(1.05rem, 0.9rem + 0.6vw, 1.25rem);
          color: var(--ink);
          /* subtle outline for bright metals */
          -webkit-text-stroke: 0.25px rgba(0, 0, 0, 0.25);
        }

        .role {
          margin: 0.05rem 0 0 0;
          color: var(--ink);
          font-weight: 800;
          letter-spacing: 0.02em;
          line-height: 1.25;
          font-size: 0.92rem;
        }

        .company {
          margin: 0.1rem 0 0 0;
          color: var(--ink);
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.01em;
          line-height: 1.18;
          font-variant-caps: all-small-caps;
        }

        .contact {
          align-self: end;
          display: grid;
          gap: 0.14rem;
          color: var(--ink);
          font-size: 0.8rem;
          letter-spacing: 0.015em;
          font-weight: 700;
        }
        .contact .item {
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* alignment helpers */
        .content {
          justify-items: ${q};
        }
        .text-block,
        .contact {
          text-align: ${H};
        }
      `})]})}var z=g(u(),1),Re={maxRotation:40,lightFollow:.4,influenceRadius:500,ease:.08,radius:16};function M(n){let e={...Re,...n};return(0,z.jsx)("div",{className:"h-screen w-screen grid place-items-center",children:(0,z.jsx)($,{maxRotation:e.maxRotation,lightFollow:e.lightFollow,influenceRadius:e.influenceRadius,ease:e.ease,radius:e.radius})})}var ee=g(u(),1),Ne=M||Object.values(B).find(n=>typeof n=="function");(0,Z.createRoot)(document.getElementById("root")).render((0,ee.jsx)(Ne,{}));})();
