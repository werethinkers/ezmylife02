(()=>{var C=Object.create;var c=Object.defineProperty;var S=Object.getOwnPropertyDescriptor;var A=Object.getOwnPropertyNames;var O=Object.getPrototypeOf,P=Object.prototype.hasOwnProperty;var f=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports),T=(t,e)=>{for(var o in e)c(t,o,{get:e[o],enumerable:!0})},z=(t,e,o,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of A(e))!P.call(t,s)&&s!==o&&c(t,s,{get:()=>e[s],enumerable:!(i=S(e,s))||i.enumerable});return t};var r=(t,e,o)=>(o=t!=null?C(O(t)):{},z(e||!t||!t.__esModule?c(o,"default",{value:t,enumerable:!0}):o,t));var v=f((B,h)=>{h.exports=window.__gx.ReactDOMClient});var y=f((G,w)=>{w.exports=window.__gx.React});var l=f((J,N)=>{N.exports=window.__gx.JsxRuntime});var E=r(v(),1);var p={};T(p,{default:()=>b});var n=r(y()),a=r(l()),d={width:360,height:540,glowColor:"cyan",buttonText:"View Profile",animation:{statusInterval:2500,fadeDuration:500}},M={3:{name:"Gold",glowClass:"shadow-amber-400/50 border-amber-400 bg-amber-400"}},V=(t,e)=>{let[o,i]=(0,n.useState)(0),[s,x]=(0,n.useState)(!1),[D,_]=(0,n.useState)(t[0]);return(0,n.useEffect)(()=>{if(t.length<=1)return;let k=setInterval(()=>{x(!0),setTimeout(()=>{let g=(o+1)%t.length;i(g),_(t[g]),x(!1)},d.animation.fadeDuration)},e);return()=>clearInterval(k)},[o,t,e]),(0,a.jsx)("span",{className:`
        transition-opacity 
        duration-${d.animation.fadeDuration} 
        ${s?"opacity-0":"opacity-100"}
      `,children:D})},R=({text:t,className:e=""})=>(0,a.jsx)("div",{className:`
      absolute 
      text-amber-300/50 
      font-bold 
      text-6xl 
      select-none 
      ${e}
    `,style:{textShadow:"0 1px 4px rgba(0,0,0,0.5)"},children:t}),F=({imageUrl:t,username:e})=>(0,a.jsx)("div",{className:"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px]",children:(0,a.jsx)("div",{className:"w-full h-full rounded-full bg-zinc-800 p-1 ring-2 ring-zinc-600",children:(0,a.jsx)("img",{src:t,alt:e,className:"w-full h-full rounded-full object-cover",onError:o=>{o.target.dataset.fallback||(o.target.dataset.fallback="1",o.target.src="https://cdn.21st.dev/assets/mirror/14/14bb55f17bfbc9bfe375769da5470c40786a889492f0007f90f99312e38e002f.svg")}})})}),L=({data:t})=>{let e=V(t.status,d.animation.statusInterval);return(0,a.jsxs)("div",{className:"p-6 pt-24 text-white text-center h-full flex flex-col justify-center",children:[(0,a.jsx)("h2",{className:"text-4xl font-bold",children:t.username}),(0,a.jsx)("p",{className:"text-lg text-zinc-300 mt-4 max-w-xs mx-auto",children:t.bio}),(0,a.jsx)("div",{className:"absolute bottom-5 right-6 text-2xl font-bold text-amber-400 tracking-widest",style:{textShadow:"1px 1px 3px rgba(0,0,0,0.5)"},children:e})]})};function u({data:t}){let[e,o]=(0,n.useState)(!1),i=M[t.tier]||{};return(0,a.jsxs)("div",{className:"relative cursor-pointer transition-all duration-500",style:{width:d.width,height:d.height,transformStyle:"preserve-3d",transform:e?"rotateY(5deg) rotateX(-10deg) scale(1.05)":"scale(1)"},onMouseEnter:()=>o(!0),onMouseLeave:()=>o(!1),children:[(0,a.jsx)(R,{text:"\u2605",className:"top-[-10px] right-[-30px]"}),(0,a.jsx)(R,{text:"VIP",className:"bottom-[-20px] left-[-20px] scale-75"}),(0,a.jsx)("div",{className:"absolute inset-0 bg-zinc-900/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-zinc-700",children:(0,a.jsx)(L,{data:t})}),(0,a.jsxs)("div",{className:"absolute top-0 left-0 w-full h-[45%] transition-transform duration-500 ease-in-out",style:{transform:e?"translateY(-70%)":"translateY(0%)"},children:[(0,a.jsx)("div",{className:"absolute inset-0 bg-black/20 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg"}),(0,a.jsx)("div",{className:`
            absolute 
            top-0 
            right-0 
            h-full 
            w-1.5 
            rounded-r-2xl 
            border-r-2 
            ${i.glowClass}
          `,style:{boxShadow:"0 0 20px 3px var(--tw-shadow-color)"}}),(0,a.jsx)(F,{imageUrl:t.imageUrl,username:t.username})]}),(0,a.jsx)("button",{className:`
          absolute 
          bottom-[-60px] 
          left-1/2 
          -translate-x-1/2 
          w-48 
          py-3 
          bg-cyan-500 
          text-black 
          font-bold 
          rounded-lg 
          shadow-lg 
          hover:bg-cyan-400 
          transition-all 
          duration-300 
          hover:scale-105
        `,children:d.buttonText})]})}var m=r(l(),1),U={username:"@kp_judge",bio:"Building the future of developer tools. Always curious.",status:["JUDGE","CREATOR","DEVELOPER","INNOVATOR"],tier:3,imageUrl:"https://cdn.21st.dev/assets/mirror/43/43e61218d8f1e83c81bc0d4aaf0be9f51ad1a9e54d2cf9491a21ab85a445f9b3.jpg"};function Y(){return(0,m.jsx)("main",{className:`
        w-full 
        min-h-screen 
        flex 
        items-center 
        justify-center 
        font-sans 
        p-4 
        bg-[hsl(var(--background))]
      `,style:{perspective:"1000px"},children:(0,m.jsx)(u,{data:U})})}var b=Y;var I=r(l(),1),$=b||Object.values(p).find(t=>typeof t=="function");(0,E.createRoot)(document.getElementById("root")).render((0,I.jsx)($,{}));})();
