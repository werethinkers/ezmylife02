(()=>{var D=Object.create;var f=Object.defineProperty;var $=Object.getOwnPropertyDescriptor;var R=Object.getOwnPropertyNames;var M=Object.getPrototypeOf,E=Object.prototype.hasOwnProperty;var g=(r,s)=>()=>(s||r((s={exports:{}}).exports,s),s.exports),B=(r,s)=>{for(var n in s)f(r,n,{get:s[n],enumerable:!0})},W=(r,s,n,m)=>{if(s&&typeof s=="object"||typeof s=="function")for(let o of R(s))!E.call(r,o)&&o!==n&&f(r,o,{get:()=>s[o],enumerable:!(m=$(s,o))||m.enumerable});return r};var i=(r,s,n)=>(n=r!=null?D(M(r)):{},W(s||!r||!r.__esModule?f(n,"default",{value:r,enumerable:!0}):n,r));var F=g((J,h)=>{h.exports=window.__gx.ReactDOMClient});var C=g((T,w)=>{w.exports=window.__gx.React});var d=g((O,P)=>{P.exports=window.__gx.JsxRuntime});var N=i(F(),1);var b={};B(b,{default:()=>c});var x=i(C()),e=i(d());function u({greetingText:r="Hey!",introPrefix:s="I'm",nameText:n="Daiwiik",subtitleText:m=""}){let[o,A]=(0,x.useState)(0),[p,k]=(0,x.useState)({x:0,y:0}),v=()=>{A(a=>a+1)};return(0,e.jsxs)("div",{role:"button",tabIndex:0,onClick:v,onPointerMove:a=>{let t=a.currentTarget.getBoundingClientRect(),l=((a.clientX-t.left)/t.width-.5)*2,L=((a.clientY-t.top)/t.height-.5)*2;k({x:l,y:L})},onPointerLeave:()=>{k({x:0,y:0})},onKeyDown:a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),v())},"aria-label":`${r} ${s} ${n}. Click to replay waving hand ribbon animation.`,className:"relative w-full max-w-[260px] sm:max-w-[300px] md:max-w-[320px] aspect-[4/5] rounded-2xl overflow-hidden shadow-xl cursor-pointer select-none bg-[#F1F3F6] dark:bg-[#0B1120] border border-black/5 dark:border-white/10 transition-colors duration-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0051FF] group",children:[(0,e.jsx)("style",{children:`
                @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Plus+Jakarta+Sans:wght@700;800&display=swap');

                @keyframes ribbonSweep {
                    0% {
                        stroke-dashoffset: 1000;
                    }
                    100% {
                        stroke-dashoffset: 0;
                    }
                }

                @keyframes handBloom {
                    0% {
                        opacity: 0;
                        transform: scale(0.25) rotate(-18deg);
                    }
                    35% {
                        opacity: 1;
                    }
                    72% {
                        opacity: 1;
                        transform: scale(1.06) rotate(9deg);
                    }
                    88% {
                        transform: scale(0.98) rotate(-4deg);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) rotate(0deg);
                    }
                }

                @keyframes naturalWave {
                    0%, 100% {
                        transform: rotate(0deg);
                    }
                    22% {
                        transform: rotate(10deg);
                    }
                    48% {
                        transform: rotate(-7deg);
                    }
                    74% {
                        transform: rotate(8deg);
                    }
                    90% {
                        transform: rotate(-2deg);
                    }
                }

                @keyframes unifiedFloat {
                    0%, 100% {
                        transform: translate3d(0px, 0px, 0px);
                    }
                    50% {
                        transform: translate3d(-3px, 5px, 0px);
                    }
                }

                @keyframes letterSpring {
                    0% {
                        opacity: 0;
                        transform: translate3d(0, 15px, 0) rotate(-8deg) scale(0.65);
                        filter: blur(3px);
                    }
                    68% {
                        opacity: 1;
                        transform: translate3d(0, -3px, 0) rotate(2.5deg) scale(1.04);
                        filter: blur(0px);
                    }
                    100% {
                        opacity: 1;
                        transform: translate3d(0, 0px, 0) rotate(var(--rot, 0deg)) scale(1);
                        filter: blur(0px);
                    }
                }

                @keyframes floatIdle {
                    0%, 100% {
                        transform: translate3d(0, 0px, 0) rotate(var(--rot, 0deg));
                    }
                    50% {
                        transform: translate3d(0, -3px, 0) rotate(calc(var(--rot, 0deg) + 1.8deg));
                    }
                }

                .arm-assembly {
                    will-change: transform;
                    animation: unifiedFloat 5s ease-in-out 1s infinite;
                }

                .ribbon-stroke {
                    stroke-dasharray: 1000;
                    stroke-dashoffset: 1000;
                    will-change: stroke-dashoffset;
                    animation: ribbonSweep 0.82s cubic-bezier(0.22, 1, 0.36, 1) 0.04s forwards;
                }

                .hand-pivot {
                    opacity: 0;
                    transform-origin: 415px 225px;
                    will-change: transform, opacity;
                    animation:
                        handBloom 0.52s cubic-bezier(0.22, 1, 0.36, 1) 0.6s forwards,
                        naturalWave 1.85s ease-in-out 1.12s infinite;
                }

                .group:hover .hand-pivot {
                    animation-duration: 0.52s, 0.95s;
                }

                .spring-char {
                    display: inline-block;
                    opacity: 0;
                    will-change: transform, opacity;
                    animation:
                        letterSpring 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards,
                        floatIdle 3.2s ease-in-out infinite;
                }
            `}),(0,e.jsxs)("svg",{viewBox:"0 0 600 800",fill:"none",xmlns:"http://www.w3.org/2000/svg",className:"absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300 ease-out",style:{transform:`translate3d(${p.x*6}px, ${p.y*6}px, 0)`},preserveAspectRatio:"xMidYMid slice",children:[(0,e.jsx)("defs",{children:(0,e.jsxs)("filter",{id:"smoothPosterEdge",x:"-5%",y:"-5%",width:"110%",height:"110%",children:[(0,e.jsx)("feTurbulence",{type:"fractalNoise",baseFrequency:"0.03",numOctaves:"2",seed:"7",result:"noise"}),(0,e.jsx)("feDisplacementMap",{in:"SourceGraphic",in2:"noise",scale:"1.1",xChannelSelector:"R",yChannelSelector:"G"})]})}),(0,e.jsxs)("g",{filter:"url(#smoothPosterEdge)",className:"arm-assembly",children:[(0,e.jsx)("path",{pathLength:"1000",d:"M -70 468 L 430 318 C 530 288, 645 288, 655 395 C 665 510, 610 615, 515 572 C 435 536, 415 430, 415 315 L 415 225",strokeWidth:"88",strokeLinecap:"round",strokeLinejoin:"round",className:"ribbon-stroke stroke-[#0051FF] dark:stroke-[#3B82F6]"}),(0,e.jsxs)("g",{className:"hand-pivot",children:[(0,e.jsx)("path",{d:`
                                M 371 225
                                L 371 96
                                A 8.5 8.5 0 0 1 388 96
                                L 388 136
                                A 3 3 0 0 0 394 136
                                L 394 74
                                A 9 9 0 0 1 412 74
                                L 412 134
                                A 3 3 0 0 0 418 134
                                L 418 62
                                A 9 9 0 0 1 436 62
                                L 436 136
                                A 3 3 0 0 0 442 136
                                L 442 76
                                A 8.5 8.5 0 0 1 459 76
                                L 459 148
                                C 459 152, 463 153, 466 149
                                C 473 139, 482 126, 490 120
                                C 499 113, 510 121, 504 134
                                C 495 156, 479 182, 466 205
                                C 461 213, 459 220, 459 228
                                A 44 44 0 0 1 371 225
                                Z
                            `,className:"fill-[#0051FF] dark:fill-[#3B82F6]"}),(0,e.jsx)("path",{d:"M 441 163 C 448 148, 458 143, 467 146",strokeWidth:"6",strokeLinecap:"round",className:"stroke-[#F1F3F6] dark:stroke-[#0B1120] transition-colors duration-500"})]})]})]},`svg-${o}`),(0,e.jsx)("div",{className:"absolute inset-0 pointer-events-none opacity-[0.09] dark:opacity-[0.06] mix-blend-overlay",style:{backgroundImage:"radial-gradient(#0051FF 0.75px, transparent 0.75px), radial-gradient(#090D16 0.5px, #F1F3F6 0.5px)",backgroundSize:"20px 20px",backgroundPosition:"0 0, 10px 10px"}}),(0,e.jsxs)("div",{className:"relative z-10 w-full h-full flex flex-col justify-between p-5 sm:p-6 pointer-events-none transition-transform duration-300 ease-out",style:{transform:`translate3d(${p.x*-3}px, ${p.y*-3}px, 0)`},children:[(0,e.jsx)("div",{className:"flex items-center text-[2.75rem] sm:text-[3.25rem] font-extrabold tracking-[-0.03em] leading-none text-[#090D16] dark:text-[#F8FAFC] mt-1",style:{fontFamily:"'Plus Jakarta Sans', sans-serif"},children:r.split("").map((a,t)=>{let l=["-2deg","1.5deg","-1deg","3deg"];return(0,e.jsx)("span",{className:"spring-char",style:{"--rot":l[t%l.length],animationDelay:`${.12+t*.05}s, ${.7+t*.1}s`},children:a===" "?"\xA0":a},t)})}),(0,e.jsxs)("div",{className:"flex flex-col items-start mb-1 sm:mb-2",children:[(0,e.jsx)("div",{className:"flex items-center text-xl sm:text-2xl font-extrabold tracking-[-0.02em] text-[#090D16] dark:text-[#F8FAFC] leading-tight",style:{fontFamily:"'Plus Jakarta Sans', sans-serif"},children:s.split("").map((a,t)=>(0,e.jsx)("span",{className:"spring-char",style:{"--rot":"0deg",animationDelay:`${.35+t*.045}s, ${.95+t*.09}s`},children:a===" "?"\xA0":a},t))}),(0,e.jsx)("div",{className:"flex items-baseline flex-wrap gap-x-1.5 -mt-1",children:(0,e.jsx)("div",{className:"flex items-center text-[3.25rem] sm:text-[3.75rem] font-bold text-[#0051FF] dark:text-[#60A5FA] leading-none py-1",style:{fontFamily:"'Caveat', cursive"},children:n.split("").map((a,t)=>{let l=["-2deg","1.5deg","-1deg","2deg","-1.5deg","1deg","-2deg"];return(0,e.jsx)("span",{className:"spring-char",style:{"--rot":l[t%l.length],animationDelay:`${.48+t*.045}s, ${1.1+t*.09}s`},children:a===" "?"\xA0":a},t)})})}),m&&(0,e.jsx)("div",{className:"flex items-center text-sm sm:text-base font-bold tracking-[-0.01em] text-[#090D16]/85 dark:text-[#F8FAFC]/85 mt-0.5",style:{fontFamily:"'Plus Jakarta Sans', sans-serif"},children:m.split("").map((a,t)=>(0,e.jsx)("span",{className:"spring-char",style:{"--rot":"0deg",animationDelay:`${.75+t*.02}s, ${1.35+t*.04}s`},children:a===" "?"\xA0":a},t))})]})]},`text-${o}`),(0,e.jsx)("span",{className:"absolute bottom-2.5 right-3 z-20 text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold text-[#0051FF]/70 dark:text-[#93C5FD]/70 bg-[#F1F3F6]/80 dark:bg-[#0B1120]/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-[#0051FF]/10 group-hover:scale-105 transition-transform",children:"Click to replay \u21BB"})]})}var y=i(d(),1);function c(){return(0,y.jsx)("main",{className:"min-h-screen w-full bg-[#ECECEC] dark:bg-[#05070E] transition-colors duration-500 flex flex-col items-center justify-center p-4",children:(0,y.jsx)(u,{nameText:"Ezyourlife",introPrefix:"We are",greetingText:"Hey!"})})}var S=i(d(),1),z=c||Object.values(b).find(r=>typeof r=="function");(0,N.createRoot)(document.getElementById("root")).render((0,S.jsx)(z,{}));})();
