(()=>{var Rt=Object.create;var he=Object.defineProperty;var Ft=Object.getOwnPropertyDescriptor;var Mt=Object.getOwnPropertyNames;var St=Object.getPrototypeOf,At=Object.prototype.hasOwnProperty;var fe=(s,e)=>()=>(e||s((e={exports:{}}).exports,e),e.exports),kt=(s,e)=>{for(var t in e)he(s,t,{get:e[t],enumerable:!0})},Lt=(s,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of Mt(e))!At.call(s,r)&&r!==t&&he(s,r,{get:()=>e[r],enumerable:!(i=Ft(e,r))||i.enumerable});return s};var N=(s,e,t)=>(t=s!=null?Rt(St(s)):{},Lt(e||!s||!s.__esModule?he(t,"default",{value:s,enumerable:!0}):t,s));var et=fe((Ot,Ze)=>{Ze.exports=window.__gx.ReactDOMClient});var it=fe((Vt,tt)=>{tt.exports=window.__gx.React});var q=fe((jt,rt)=>{rt.exports=window.__gx.JsxRuntime});var ut=N(et(),1);var ge={};kt(ge,{default:()=>ie});var f=N(it()),a=N(q());function d(s,e,t){return Math.min(t,Math.max(e,s))}function st(s,e){if(typeof s!="string")return e;let t=s.trim(),i=t.match(/^#?([0-9a-f]{3})$/i);if(i){let[r,o,n]=i[1].split("").map(l=>parseInt(l+l,16)/255);return[r,o,n]}if(i=t.match(/^#?([0-9a-f]{6})([0-9a-f]{2})?$/i),i){let r=parseInt(i[1],16);return[(r>>16&255)/255,(r>>8&255)/255,(r&255)/255]}return i=t.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i),i?[+i[1]/255,+i[2]/255,+i[3]/255]:e}var pe=`
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x), u.y); }
vec2 ambientField(vec2 uv, float t){
  vec2 q = uv*vec2(3.2,1.7);
  vec2 a = vec2(vnoise(q+vec2(t*0.11,0.0))-0.5, vnoise(q+vec2(5.2,t*0.08)+3.1)-0.5);
  vec2 q2 = uv*vec2(7.5,4.0) + vec2(-t*0.19, t*0.13);
  vec2 b = vec2(vnoise(q2+1.7)-0.5, vnoise(q2+9.3)-0.5);
  return a + b*0.45;
}
`,at=`
float energyAt(vec2 rectPx, vec2 mouse, float radius, float presence, float wakeEnergy){
  vec2 d = rectPx - mouse;
  float f = exp(-dot(d,d)/(radius*radius))*presence;
  return smoothstep(0.06, 0.5, f*1.15 + wakeEnergy*1.7);
}
`,me=`#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }
`,It=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform vec2 uSize;
uniform float uRadius;
uniform float uPresence;
uniform float uDecay;
vec2 decV(vec4 c){ return (c.rg*255.0-128.0)/127.0; }
void main(){
  vec2 v0 = decV(texture(uPrev, vUv));
  vec2 uv = vUv - v0*uTexel*2.5;
  vec4 c = texture(uPrev, uv)*0.52
    + 0.12*(texture(uPrev, uv+vec2(uTexel.x,0.0)) + texture(uPrev, uv-vec2(uTexel.x,0.0))
          + texture(uPrev, uv+vec2(0.0,uTexel.y)) + texture(uPrev, uv-vec2(0.0,uTexel.y)));
  vec2 v = decV(c);
  float p = c.b;
  vec2 d = (vUv-uMouse)*uSize;
  float f = exp(-dot(d,d)/(uRadius*uRadius))*uPresence;
  float sp = clamp(length(uVel)*2.5, 0.0, 1.0);
  v += uVel*f*0.22;
  p = max(p, f*sp);
  v *= uDecay;
  p *= uDecay;
  v = sign(v)*max(abs(v)-1.2/127.0, 0.0);
  p = max(p-1.2/255.0, 0.0);
  v = clamp(v, -1.0, 1.0);
  o = vec4((v*127.0+128.0)/255.0, p, 1.0);
}
`,_t=`#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uState;
uniform sampler2D uHome;
uniform sampler2D uFlow;
uniform vec2 uSize;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uPresence;
uniform float uStrength;
uniform float uSpread;
uniform float uTurb;
uniform float uReturn;
uniform float uTime;
uniform float uDt;
uniform float uIntro;
${pe}
vec2 curl(vec2 p){
  const float e = 0.35;
  float a = vnoise(p+vec2(0.0,e)) - vnoise(p-vec2(0.0,e));
  float b = vnoise(p+vec2(e,0.0)) - vnoise(p-vec2(e,0.0));
  return vec2(a, -b)/(2.0*e);
}
void main(){
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 hm = texelFetch(uHome, ij, 0);
  if(hm.w <= 0.0){ o = vec4(0.0); return; }
  vec4 st = texelFetch(uState, ij, 0);
  vec2 off = st.xy;
  vec2 vel = st.zw;
  float sd = hm.z;
  float light = 0.45 + sd*1.1;

  vec2 p = hm.xy*uSize + off;
  vec4 fl = texture(uFlow, clamp(p/uSize, 0.0, 1.0));
  vec2 wake = (fl.rg*255.0-128.0)/127.0;
  float pr = fl.b;

  vec2 toM = p - uMouse;
  float r2 = dot(toM,toM);
  float f = exp(-r2/(uRadius*uRadius))*uPresence;
  vec2 n = toM*inversesqrt(r2+1.0);
  float e = clamp(pr*2.0 + f, 0.0, 1.0);

  vec2 acc = vec2(0.0);
  // blown outward and swirled around the cursor
  acc += n*f*1.25*uStrength*uSpread*light;
  acc += vec2(-n.y, n.x)*f*1.45*uStrength*uSpread*(0.4+sd);
  // carried by the liquid wake
  acc += (wake*42.0*uSpread*light - vel)*e*0.08;
  // curl-noise turbulence where the material is disturbed (and during the intro)
  vec2 q = p*0.0095 + vec2(uTime*0.35, -uTime*0.2);
  vec2 c = curl(q) + 0.5*curl(q*2.3 + 7.1);
  acc += c*(e*1.2*uSpread + uIntro*1.5)*uTurb*light;
  // elastic return home
  float k = (0.006 + 0.02*uReturn)*(0.65+sd*0.7)*(1.0 - uIntro*0.75);
  acc -= off*k;

  vel += acc*uDt;
  vel *= pow(mix(0.93, 0.955, e), uDt);
  off += vel*uDt;
  if(dot(off,off) < 0.0004 && dot(vel,vel) < 0.0004){ off = vec2(0.0); vel = vec2(0.0); }
  o = vec4(off, vel);
}
`,Dt=`#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
uniform sampler2D uState;
uniform sampler2D uHome;
uniform sampler2D uCol;
uniform sampler2D uFlow;
uniform int uTexW;
uniform vec4 uRect;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uPresence;
uniform float uDot;
uniform float uTime;
uniform float uAmbient;
uniform float uStreak;
uniform float uIntroVis;
uniform float uRest;
uniform vec3 uTint;
out vec2 vLocal;
out float vHalfLen;
out float vR;
out vec3 vCol;
out float vA;
${pe}
${at}
void main(){
  int id = gl_InstanceID;
  ivec2 ij = ivec2(id % uTexW, id / uTexW);
  vec4 hm = texelFetch(uHome, ij, 0);
  vec4 st = texelFetch(uState, ij, 0);
  vec4 cl = texelFetch(uCol, ij, 0);

  float wakeE = texture(uFlow, hm.xy).b;
  float E = energyAt(hm.xy*uRect.zw, uMouse, uRadius, uPresence, wakeE);
  float lift = smoothstep(0.35, 2.5, length(st.xy));
  float a = max(max(E, lift), max(uRest, 1.0-uIntroVis));
  if(a < 0.01 || hm.w <= 0.0){ gl_Position = vec4(2.0,2.0,2.0,1.0); return; }

  vec2 base = uRect.xy + hm.xy*uRect.zw + st.xy;
  base -= ambientField(hm.xy, uTime)*10.0*uAmbient;

  vec2 v = st.zw;
  float sp = length(v);
  vec2 dir = sp > 0.001 ? v/sp : vec2(1.0,0.0);
  float r = uDot*hm.w*0.5;
  float len = min(sp*1.25, 18.0)*uStreak;
  vec2 lc = aCorner*vec2(r + len*0.5 + 1.0, r + 1.0);
  vec2 center = base - dir*len*0.5;
  vec2 world = center + dir*lc.x + vec2(-dir.y, dir.x)*lc.y;

  vec2 clip = world/uRes*2.0-1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vLocal = lc;
  vHalfLen = len*0.5;
  vR = r;
  vec3 col = cl.rgb*uTint;
  // fast material catches the light, like liquid metal
  float glint = smoothstep(2.0, 16.0, sp);
  col = mix(col, min(col*1.18 + vec3(0.07,0.075,0.085), vec3(1.0)), glint*0.75);
  vCol = col;
  vA = a;
}
`,Pt=`#version 300 es
precision highp float;
in vec2 vLocal;
in float vHalfLen;
in float vR;
in vec3 vCol;
in float vA;
uniform float uDpr;
out vec4 o;
void main(){
  vec2 q = vec2(max(abs(vLocal.x)-vHalfLen, 0.0), vLocal.y);
  float d = length(q) - vR;
  float a = clamp(0.5 - d*uDpr, 0.0, 1.0);
  // comet tail: the trailing end thins out
  float tail = vHalfLen > 0.0 ? clamp(0.5 - vLocal.x/(2.0*(vHalfLen+vR)), 0.0, 1.0) : 0.0;
  a *= 1.0 - tail*0.55;
  a *= vA;
  if(a < 0.004) discard;
  o = vec4(vCol*a, a);
}
`,Ut=`#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uImg;
uniform sampler2D uFlow;
uniform vec2 uRes;
uniform float uDpr;
uniform vec4 uRect;
uniform vec3 uBg;
uniform vec3 uImgBg;
uniform vec2 uMouse;
uniform float uPresence;
uniform float uRadius;
uniform float uStrength;
uniform float uTime;
uniform float uAmbient;
uniform float uIntroVis;
uniform float uRest;
uniform float uAlphaMode;
${pe}
${at}
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y*uDpr - gl_FragCoord.y)/uDpr;
  vec2 size = uRect.zw;
  vec2 uv = (px-uRect.xy)/size;
  if(uv.x < -0.05 || uv.x > 1.05 || uv.y < -0.12 || uv.y > 1.12){ o = vec4(0.0); return; }
  vec4 fl = texture(uFlow, clamp(uv,0.0,1.0));
  vec2 vel = (fl.rg*255.0-128.0)/127.0;
  vec2 rp = uv*size;
  vec2 toM = rp - uMouse;
  float fall = exp(-dot(toM,toM)/(uRadius*uRadius))*uPresence;
  vec2 disp = -toM*0.22*uStrength*fall - vel*10.0*uStrength;
  disp += ambientField(uv, uTime)*10.0*uAmbient;
  vec2 suv = uv + disp/size;
  vec4 tx = texture(uImg, suv);
  vec3 col = tx.rgb;
  vec2 e = smoothstep(vec2(0.0), vec2(0.004,0.01), suv) * smoothstep(vec2(1.0), vec2(0.996,0.99), suv);
  // cut-out images carry their own alpha; flat-background images are keyed by colour
  float key = uAlphaMode > 0.5 ? tx.a : smoothstep(0.012, 0.05, length(col-uImgBg));
  float k = key*e.x*e.y;
  float E = energyAt(rp, uMouse, uRadius, uPresence, fl.b);
  float show = (1.0 - max(E, uRest))*uIntroVis;
  vec3 mat = uAlphaMode > 0.5 ? col : col*(uBg/max(uImgBg, vec3(0.001)));
  // premultiplied: empty areas stay transparent so the page (and the backdrop word) shows through
  float A = k*show;
  o = vec4(mat*A, A);
}
`;function te(s,e,t){let i=(p,y)=>{let x=s.createShader(p);if(s.shaderSource(x,y),s.compileShader(x),!s.getShaderParameter(x,s.COMPILE_STATUS)){let I=s.getShaderInfoLog(x);throw s.deleteShader(x),new Error("Shader: "+I)}return x},r=s.createProgram(),o=i(s.VERTEX_SHADER,e),n=i(s.FRAGMENT_SHADER,t);if(s.attachShader(r,o),s.attachShader(r,n),s.bindAttribLocation(r,0,"aPos"),s.linkProgram(r),s.deleteShader(o),s.deleteShader(n),!s.getProgramParameter(r,s.LINK_STATUS))throw new Error("Link: "+s.getProgramInfoLog(r));let l={},u=s.getProgramParameter(r,s.ACTIVE_UNIFORMS);for(let p=0;p<u;p++){let y=s.getActiveUniform(r,p);y&&(l[y.name]=s.getUniformLocation(r,y.name))}return{p:r,u:l}}var U=1024,Bt=270,de=class{lastImage=null;onFirstFrame=null;canvas;gl;opts;onFail;lowPower=!1;stateFormat={internal:0,type:0};pFlow;pSim;pPart;pImg;vao;quad;imgTex=null;flowTex=[];flowFb=[];flowW=256;flowH=104;flowIdx=0;flowDirty=!1;homeTex=null;colTex=null;stateTex=[];stateFb=[];stateIdx=0;texH=1;n=0;gridW=1;stateDirty=!1;alphaMode=!1;imgBg=[.918,.914,.906];flowing=0;aspect=2.5;rect={x:0,y:0,w:1,h:1};cssW=1;cssH=1;target={x:-9999,y:-9999};mouse={x:-9999,y:-9999};prevMouse={x:-9999,y:-9999};mvel={x:0,y:0};presence=0;presenceTarget=0;burst=0;lastInput=-1e9;settle=1e9;touchRelease=0;time=0;introT=1;raf=0;running=!1;last=0;skip=0;visible=!0;ready=!1;destroyed=!1;lost=!1;constructor(e,t,i){this.canvas=e,this.opts=t,this.onFail=i;let r=e.getContext("webgl2",{alpha:!0,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!0,preserveDrawingBuffer:!1,powerPreference:"high-performance"});if(!r)throw new Error("WebGL2 unavailable");this.gl=r;let o=navigator;this.lowPower=(o.hardwareConcurrency||8)<=4||(o.deviceMemory||8)<=4||window.matchMedia("(pointer: coarse)").matches,this.initGL(),e.addEventListener("webglcontextlost",this.onLost,!1)}onLost=e=>{e.preventDefault(),this.lost=!0,this.stop(),this.onFail()};initGL(){let e=this.gl,t=e.getExtension("EXT_color_buffer_float"),i=t?null:e.getExtension("EXT_color_buffer_half_float");if(!t&&!i)throw new Error("No float render targets");this.stateFormat={internal:e.RGBA16F,type:e.HALF_FLOAT},this.pFlow=te(e,me,It),this.pSim=te(e,me,_t),this.pPart=te(e,Dt,Pt),this.pImg=te(e,me,Ut),this.vao=e.createVertexArray(),e.bindVertexArray(this.vao),this.quad=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.quad),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);for(let r=0;r<2;r++){let o=this.makeTex(e.RGBA8,this.flowW,this.flowH,e.RGBA,e.UNSIGNED_BYTE,null,e.LINEAR),n=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,n),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,o,0),this.flowTex.push(o),this.flowFb.push(n)}this.clearFlow()}makeTex(e,t,i,r,o,n,l){let u=this.gl,p=u.createTexture();return u.bindTexture(u.TEXTURE_2D,p),u.pixelStorei(u.UNPACK_ALIGNMENT,1),u.texImage2D(u.TEXTURE_2D,0,e,t,i,0,r,o,n),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_MIN_FILTER,l),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_MAG_FILTER,l),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_WRAP_S,u.CLAMP_TO_EDGE),u.texParameteri(u.TEXTURE_2D,u.TEXTURE_WRAP_T,u.CLAMP_TO_EDGE),p}clearFlow(){let e=this.gl;for(let t of this.flowFb)e.bindFramebuffer(e.FRAMEBUFFER,t),e.viewport(0,0,this.flowW,this.flowH),e.clearColor(128/255,128/255,0,1),e.clear(e.COLOR_BUFFER_BIT);e.bindFramebuffer(e.FRAMEBUFFER,null),this.flowDirty=!1}clearState(){let e=this.gl;for(let t of this.stateFb)e.bindFramebuffer(e.FRAMEBUFFER,t),e.viewport(0,0,U,this.texH),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT);e.bindFramebuffer(e.FRAMEBUFFER,null),this.stateDirty=!1}setImage(e){if(this.destroyed||this.lost)return;let t=this.gl;this.lastImage=e,this.aspect=e.naturalWidth/e.naturalHeight||2.5,this.flowH=Math.max(32,Math.round(this.flowW/this.aspect));for(let i of this.flowTex)t.bindTexture(t.TEXTURE_2D,i),t.texImage2D(t.TEXTURE_2D,0,t.RGBA8,this.flowW,this.flowH,0,t.RGBA,t.UNSIGNED_BYTE,null);this.clearFlow(),this.imgTex&&t.deleteTexture(this.imgTex),this.imgTex=t.createTexture(),t.bindTexture(t.TEXTURE_2D,this.imgTex),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,e),t.generateMipmap(t.TEXTURE_2D),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR_MIPMAP_LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),this.buildParticles(e),this.ready=!0,this.opts.intro&&!this.opts.reducedMotion&&this.startIntro(),this.wake()}buildParticles(e){let t=this.gl,i=this.lowPower?640:1e3,r=Math.round(i*Math.sqrt(d(this.opts.density,.15,2))),o=Math.max(1,Math.round(r/this.aspect));this.gridW=r;let n;try{let h=document.createElement("canvas");h.width=r,h.height=o;let g=h.getContext("2d",{willReadFrequently:!0});g.imageSmoothingQuality="high",g.drawImage(e,0,0,r,o),n=g.getImageData(0,0,r,o).data}catch{throw new Error("Image is not CORS-readable")}let l=0;for(let h=3;h<n.length;h+=28)n[h]<250&&l++;if(this.alphaMode=l>n.length/28/20,this.opts.imgBg)this.imgBg=this.opts.imgBg;else if(!this.alphaMode){let h=0,g=0,T=0,_=0,S=Math.max(2,Math.round(r*.012));for(let[v,m]of[[0,0],[r-S,0],[0,o-S],[r-S,o-S]])for(let D=m;D<m+S;D++)for(let A=v;A<v+S;A++){let j=(D*r+A)*4;h+=n[j],g+=n[j+1],T+=n[j+2],_++}this.imgBg=[h/_/255,g/_/255,T/_/255]}let u=[],p=[];for(let h=0;h<o;h++)for(let g=0;g<r;g++){let T=(h*r+g)*4,_=n[T]/255,S=n[T+1]/255,v=n[T+2]/255;if(this.alphaMode){let A=n[T+3]/255;if(A<.12||A<.5&&Math.random()>A*2)continue}else{let A=Math.hypot(_-this.imgBg[0],S-this.imgBg[1],v-this.imgBg[2]);if(A<.03||A<.07&&Math.random()>(A-.03)/.04)continue}let m=(Math.random()-.5)*.6,D=(Math.random()-.5)*.6;u.push((g+.5+m)/r,(h+.5+D)/o,Math.random(),.85+Math.random()*.3),p.push(n[T],n[T+1],n[T+2],255)}let y=u.length/4;this.n=y,this.texH=Math.max(1,Math.ceil(y/U));let x=U*this.texH,I=new Float32Array(x*4);I.set(u);let H=new Uint8Array(x*4);H.set(p);for(let h of[this.homeTex,this.colTex,...this.stateTex])h&&t.deleteTexture(h);for(let h of this.stateFb)t.deleteFramebuffer(h);this.stateTex=[],this.stateFb=[],this.homeTex=this.makeTex(t.RGBA32F,U,this.texH,t.RGBA,t.FLOAT,I,t.NEAREST),this.colTex=this.makeTex(t.RGBA8,U,this.texH,t.RGBA,t.UNSIGNED_BYTE,H,t.NEAREST);for(let h=0;h<2;h++){let g=this.makeTex(this.stateFormat.internal,U,this.texH,t.RGBA,this.stateFormat.type,null,t.NEAREST),T=t.createFramebuffer();if(t.bindFramebuffer(t.FRAMEBUFFER,T),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,g,0),t.checkFramebufferStatus(t.FRAMEBUFFER)!==t.FRAMEBUFFER_COMPLETE)throw new Error("Float FBO incomplete");this.stateTex.push(g),this.stateFb.push(T)}t.bindFramebuffer(t.FRAMEBUFFER,null),this.homeData=I,this.clearState()}homeData=null;startIntro(){let e=this.gl,t=this.homeData;if(!t)return;let i=this.rect.w>10?this.rect.w:1300,r=U*this.texH,o=new Float32Array(r*4);for(let n=0;n<this.n;n++){let l=t[n*4]-.5,u=t[n*4+1]-.5,p=t[n*4+2],y=(Math.random()-.5)*.9+(l>0?0:Math.PI),x=i*(.04+Math.random()*.14)*(.5+Math.abs(l)*1.4);o[n*4]=Math.cos(y)*x+l*i*.25*p,o[n*4+1]=Math.sin(y)*x*.55+u*120*(Math.random()-.5)}e.bindTexture(e.TEXTURE_2D,this.stateTex[this.stateIdx]),e.texImage2D(e.TEXTURE_2D,0,this.stateFormat.internal,U,this.texH,0,e.RGBA,e.FLOAT,o),this.introT=0,this.stateDirty=!0}setOptions(e){let t=e.density!==void 0&&e.density!==this.opts.density||e.imgBg!==void 0&&String(e.imgBg)!==String(this.opts.imgBg);if(this.opts={...this.opts,...e},t&&this.ready&&this.lastImage)try{this.buildParticles(this.lastImage)}catch{this.onFail()}this.wake()}resize(e,t,i){this.cssW=Math.max(1,e),this.cssH=Math.max(1,t),this.rect=i;let r=Math.min(window.devicePixelRatio||1,this.lowPower?1.5:2);this.cssW*this.cssH*r*r>45e5&&(r=Math.max(1,Math.sqrt(45e5/(this.cssW*this.cssH))));let n=Math.round(this.cssW*r),l=Math.round(this.cssH*r);(this.canvas.width!==n||this.canvas.height!==l)&&(this.canvas.width=n,this.canvas.height=l),this.draw()}setVisible(e){this.visible=e,e?this.wake():this.stop()}pointer(e,t,i,r){if(!this.opts.interactive||this.lost)return;let o=performance.now();if(e==="leave"||e==="up"){r?this.touchRelease=o+260:this.presenceTarget=0,this.wake();return}(this.mouse.x<-9e3||e==="down")&&(this.mouse.x=this.prevMouse.x=t,this.mouse.y=this.prevMouse.y=i),this.target.x=t,this.target.y=i,this.presenceTarget=1,this.lastInput=o,this.settle=0,e==="down"&&(this.burst=1,this.touchRelease=0),this.wake()}wake(){if(!this.ready||this.running||!this.visible||this.destroyed||this.lost){this.ready&&!this.running&&this.draw();return}this.running=!0,this.last=performance.now(),this.raf=requestAnimationFrame(this.frame)}stop(){this.running=!1,cancelAnimationFrame(this.raf)}radiusPx(){return this.opts.radius*d(this.rect.w/1400,.6,1.25)}strength(){return this.opts.strength*(this.opts.reducedMotion?.5:1)}frame=e=>{if(!this.running)return;let t=e-this.last,i=d(t/16.6667,.25,3);this.last=e;let r=this.opts,o=r.ambient&&!r.reducedMotion;this.touchRelease&&e>this.touchRelease&&(this.presenceTarget=0,this.touchRelease=0);let n=1-Math.pow(1-.22,i);this.mouse.x+=(this.target.x-this.mouse.x)*n,this.mouse.y+=(this.target.y-this.mouse.y)*n;let l=(this.mouse.x-this.prevMouse.x)/i,u=(this.mouse.y-this.prevMouse.y)/i;this.prevMouse.x=this.mouse.x,this.prevMouse.y=this.mouse.y,this.mvel.x+=(d(l,-60,60)-this.mvel.x)*.5,this.mvel.y+=(d(u,-60,60)-this.mvel.y)*.5;let p=this.presenceTarget>this.presence?.1:.035;this.presence+=(this.presenceTarget-this.presence)*(1-Math.pow(1-p,i)),this.presence<.001&&this.presenceTarget===0&&(this.presence=0);let y=this.presenceTarget>this.flowing?.05:.018;this.flowing+=(this.presenceTarget-this.flowing)*(1-Math.pow(1-y,i)),this.flowing<.002&&this.presenceTarget===0&&(this.flowing=0),this.introT<1&&(this.introT=Math.min(1,this.introT+Math.min(t,100)/3200));let x=this.presence>.001||this.burst>0;if(this.settle=x?0:this.settle+i,!(x||this.settle<Bt||this.introT<1)){if(this.flowDirty&&this.clearFlow(),this.stateDirty&&this.clearState(),!o){this.draw(),this.firstFrame(),this.stop();return}if(this.raf=requestAnimationFrame(this.frame),this.skip++%2)return;this.time+=i*2*r.speed/60,this.draw(),this.firstFrame();return}this.raf=requestAnimationFrame(this.frame),this.time+=i*r.speed*(1+this.flowing*1.6)/60,this.stepFlow(i),this.stepSim(i),this.burst=Math.max(0,this.burst-.1*i),this.draw(),this.firstFrame()};firstFrame(){if(this.onFirstFrame){let e=this.onFirstFrame;this.onFirstFrame=null,requestAnimationFrame(()=>e())}}stepFlow(e){let t=this.gl,i=this.pFlow,r=1-this.flowIdx;t.bindFramebuffer(t.FRAMEBUFFER,this.flowFb[r]),t.viewport(0,0,this.flowW,this.flowH),t.disable(t.BLEND),t.useProgram(i.p),t.bindVertexArray(this.vao),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.flowTex[this.flowIdx]),t.uniform1i(i.u.uPrev,0),t.uniform2f(i.u.uTexel,1/this.flowW,1/this.flowH);let o=this.rect;t.uniform2f(i.u.uMouse,(this.mouse.x-o.x)/o.w,(this.mouse.y-o.y)/o.h),t.uniform2f(i.u.uVel,d(this.mvel.x/40,-1,1),d(this.mvel.y/40,-1,1)),t.uniform2f(i.u.uSize,o.w,o.h),t.uniform1f(i.u.uRadius,this.radiusPx()),t.uniform1f(i.u.uPresence,Math.max(this.presence,this.burst)),t.uniform1f(i.u.uDecay,Math.pow(.968,e)),t.drawArrays(t.TRIANGLE_STRIP,0,4),this.flowIdx=r,this.flowDirty=!0}stepSim(e){if(!this.n)return;let t=this.gl,i=this.pSim,r=this.opts,o=this.rect,n=1-this.stateIdx,l=r.reducedMotion||!r.intro?0:Math.pow(1-this.introT,2);t.bindFramebuffer(t.FRAMEBUFFER,this.stateFb[n]),t.viewport(0,0,U,this.texH),t.disable(t.BLEND),t.useProgram(i.p),t.bindVertexArray(this.vao),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.stateTex[this.stateIdx]),t.uniform1i(i.u.uState,0),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,this.homeTex),t.uniform1i(i.u.uHome,1),t.activeTexture(t.TEXTURE2),t.bindTexture(t.TEXTURE_2D,this.flowTex[this.flowIdx]),t.uniform1i(i.u.uFlow,2),t.uniform2f(i.u.uSize,o.w,o.h),t.uniform2f(i.u.uMouse,this.mouse.x-o.x,this.mouse.y-o.y),t.uniform1f(i.u.uRadius,this.radiusPx()),t.uniform1f(i.u.uPresence,Math.max(this.presence,this.burst)),t.uniform1f(i.u.uStrength,this.strength()*(1+this.burst*1.5)),t.uniform1f(i.u.uSpread,d(r.spread,0,2)),t.uniform1f(i.u.uTurb,d(r.turbulence,0,2)*(r.reducedMotion?.3:1)),t.uniform1f(i.u.uReturn,d(r.returnSpeed,0,2)),t.uniform1f(i.u.uTime,this.time),t.uniform1f(i.u.uDt,e),t.uniform1f(i.u.uIntro,l),t.drawArrays(t.TRIANGLE_STRIP,0,4),this.stateIdx=n,this.stateDirty=!0}draw(){if(!this.ready||this.lost||this.destroyed)return;let e=this.gl,t=this.opts,i=this.rect,r=t.reducedMotion,o=r||!t.intro?1:Math.pow(this.introT,2.2),l=(t.ambient&&!r?d(t.ambientIntensity,0,2):0)+this.flowing*.85*d(t.liquid,0,2)*(r?.3:1),u=t.restStyle==="particles"?1:0,[p,y,x]=t.bg,[I,H,h]=this.imgBg,g=this.canvas.width/this.cssW,T=Math.max(this.presence,this.burst),_=this.mouse.x-i.x,S=this.mouse.y-i.y;e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,this.canvas.width,this.canvas.height),e.bindVertexArray(this.vao),e.disable(e.BLEND);let v=this.pImg;if(e.useProgram(v.p),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.imgTex),e.uniform1i(v.u.uImg,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,this.flowTex[this.flowIdx]),e.uniform1i(v.u.uFlow,1),e.uniform2f(v.u.uRes,this.cssW,this.cssH),e.uniform1f(v.u.uDpr,g),e.uniform4f(v.u.uRect,i.x,i.y,i.w,i.h),e.uniform3f(v.u.uBg,p,y,x),e.uniform3f(v.u.uImgBg,I,H,h),e.uniform2f(v.u.uMouse,_,S),e.uniform1f(v.u.uPresence,T),e.uniform1f(v.u.uRadius,this.radiusPx()),e.uniform1f(v.u.uStrength,this.strength()),e.uniform1f(v.u.uTime,this.time),e.uniform1f(v.u.uAmbient,l),e.uniform1f(v.u.uIntroVis,o),e.uniform1f(v.u.uRest,u),e.uniform1f(v.u.uAlphaMode,this.alphaMode?1:0),e.drawArrays(e.TRIANGLE_STRIP,0,4),!this.n||!this.stateDirty&&u===0&&o>=1)return;let m=this.pPart;e.useProgram(m.p),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.stateTex[this.stateIdx]),e.uniform1i(m.u.uState,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,this.homeTex),e.uniform1i(m.u.uHome,1),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,this.colTex),e.uniform1i(m.u.uCol,2),e.activeTexture(e.TEXTURE3),e.bindTexture(e.TEXTURE_2D,this.flowTex[this.flowIdx]),e.uniform1i(m.u.uFlow,3),e.uniform1i(m.u.uTexW,U),e.uniform4f(m.u.uRect,i.x,i.y,i.w,i.h),e.uniform2f(m.u.uRes,this.cssW,this.cssH),e.uniform2f(m.u.uMouse,_,S),e.uniform1f(m.u.uRadius,this.radiusPx()),e.uniform1f(m.u.uPresence,T);let D=i.w/this.gridW;e.uniform1f(m.u.uDot,D*1.45*d(t.dotSize,.2,3)),e.uniform1f(m.u.uTime,this.time),e.uniform1f(m.u.uAmbient,l),e.uniform1f(m.u.uStreak,(t.streaks?1:0)*(.45+.55*o)),e.uniform1f(m.u.uIntroVis,o),e.uniform1f(m.u.uRest,u),e.uniform1f(m.u.uDpr,g),this.alphaMode?e.uniform3f(m.u.uTint,1,1,1):e.uniform3f(m.u.uTint,p/Math.max(I,.001),y/Math.max(H,.001),x/Math.max(h,.001)),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,this.n),e.disable(e.BLEND)}destroy(){this.destroyed=!0,this.stop(),this.canvas.removeEventListener("webglcontextlost",this.onLost);let e=this.gl;if(!this.lost){e.deleteBuffer(this.quad),e.deleteVertexArray(this.vao);for(let t of[...this.flowTex,...this.stateTex,this.imgTex,this.homeTex,this.colTex])t&&e.deleteTexture(t);for(let t of[...this.flowFb,...this.stateFb])e.deleteFramebuffer(t);for(let t of[this.pFlow,this.pSim,this.pPart,this.pImg])t&&e.deleteProgram(t.p)}e.getExtension("WEBGL_lose_context")?.loseContext()}},b={src:"https://cdn.21st.dev/assets/mirror/ae/ae8c3de9003460e59182e950ccd345f68f27f9d0e4808b64c92c962a4eca7120.webp",darkSrc:"https://cdn.21st.dev/assets/mirror/a1/a1fa387b6e417b26a25f317559c87cce4d241c1052c52a2b3bc2966b2aaf9b65.webp",mobileSrc:"https://cdn.21st.dev/assets/mirror/b0/b0c8d8e5d64b8cec906a3b390e3dc7c9a5af08334bf0632873c601782cb4bc46.webp",mobileDarkSrc:"https://cdn.21st.dev/assets/mirror/9a/9a82cb59be1bfde59855b79d7a565e487155a89f4d52eac74dcc10e267b2b6d1.webp",imageAlt:"Abstract sculpture of interwoven metallic filaments and particles",imageBackground:"#EAE9E7",brand:"Forma\xAE",navLinks:[{label:"Work",href:"#"},{label:"Studio",href:"#"},{label:"Approach",href:"#"},{label:"Journal",href:"#"}],navCta:{label:"Contact",href:"#"},eyebrow:"Independent studio \u2014 Est. 2019",headline:`Form that
answers back.`,headlineAccent:"answers back.",body:"We shape products, identities and spaces with the precision of engineering and the patience of craft \u2014 work that holds up under attention.",primaryCta:{label:"Start a project",href:"#"},secondaryCta:{label:"Selected work",href:"#"},hint:"Move across the form",hintTouch:"Touch the form",background:"#EBE9E5",darkBackground:"#111110",textColor:"#151514",accentColor:"#151514",headingFont:"'Geist', 'Helvetica Neue', Arial, sans-serif",accentFont:"'Instrument Serif', 'Times New Roman', serif",bodyFont:"'Geist', 'Helvetica Neue', Arial, sans-serif"};function Ct(s,e,t,i,r){let o=Math.max(80,i.bottom-i.top),n,l;s>=1024?(n=s*1.02*r.scale,l=o*1.1*r.scale):s>=640?(n=s*1.3*r.scale,l=o*1.15*r.scale):t<1.3?(n=s*1*r.mobileScale,l=o*1*r.mobileScale):(n=s*1.9*r.mobileScale,l=o*1.2*r.mobileScale),n/t>l&&(n=l*t);let u=n/t,p=s*(.5+r.x/100),y=(i.top+i.bottom)/2+e*(r.y/100);return{x:p-n/2,y:y-u/2,w:n,h:u}}var Nt=`
.sh-root{position:relative;width:100%;height:var(--sh-h);overflow:hidden;isolation:isolate;container-type:size;transition:background-color .6s ease,color .6s ease;
  background:var(--sh-bg);color:var(--sh-fg);font-family:var(--sh-body);-webkit-font-smoothing:antialiased;
  touch-action:pan-y;display:flex;flex-direction:column;box-sizing:border-box}
.sh-root *,.sh-root *::before,.sh-root *::after{box-sizing:border-box}
.sh-stage{position:absolute;inset:0;z-index:0;pointer-events:none}
.sh-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .5s ease}
.sh-fallback{position:absolute;display:block;max-width:none;user-select:none;-webkit-user-drag:none;transition:opacity .5s ease}
.sh-root[data-gl="on"] .sh-canvas{opacity:1}
.sh-root[data-gl="on"] .sh-fallback{opacity:0}
.sh-root[data-swap="1"] .sh-canvas{opacity:0;transition-duration:.25s}
.sh-root[data-swap="1"] .sh-fallback{opacity:0;transition-duration:.25s}
.sh-backdrop{position:absolute;left:50%;z-index:0;transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none;user-select:none;
  font-family:var(--sh-head);font-weight:600;letter-spacing:-.06em;line-height:.8;color:color-mix(in srgb,var(--sh-fg) 5%,transparent)}
.sh-nav{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:24px;
  padding:26px clamp(20px,3.2cqw,48px) 0}
.sh-brand{font-family:var(--sh-head);font-weight:600;font-size:17px;letter-spacing:-.02em;color:inherit;text-decoration:none}
.sh-links{display:flex;align-items:center;gap:clamp(18px,2.4cqw,36px);list-style:none;margin:0;padding:0}
.sh-link{color:inherit;text-decoration:none;font-size:13.5px;letter-spacing:-.005em;opacity:.72;transition:opacity .2s}
.sh-link:hover{opacity:1}
.sh-theme{display:inline-grid;place-items:center;width:34px;height:34px;padding:0;border-radius:50%;cursor:pointer;color:inherit;background:transparent;
  border:1px solid color-mix(in srgb,var(--sh-fg) 22%,transparent);transition:background .25s,color .25s}
.sh-theme:hover{background:var(--sh-fg);color:var(--sh-bg)}
.sh-theme:focus-visible{outline:2px solid var(--sh-fg);outline-offset:4px}
.sh-navcta{color:inherit;text-decoration:none;font-size:13.5px;padding:8px 14px;border:1px solid color-mix(in srgb,var(--sh-fg) 22%,transparent);
  border-radius:999px;transition:background .25s,color .25s}
.sh-navcta:hover{background:var(--sh-fg);color:var(--sh-bg)}
.sh-hint{position:absolute;z-index:1;transform:translate(-50%,0);display:flex;align-items:center;gap:10px;white-space:nowrap;
  font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.5;pointer-events:none;transition:opacity .8s ease}
.sh-hint::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;animation:sh-pulse 2.4s ease-in-out infinite}
.sh-root[data-touched="1"] .sh-hint{opacity:0}
@keyframes sh-pulse{0%,100%{transform:scale(.6);opacity:.45}50%{transform:scale(1);opacity:1}}
.sh-spacer{flex:1 1 auto;min-height:0}
.sh-content{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);align-items:end;
  gap:clamp(24px,4cqw,72px);padding:0 clamp(20px,3.2cqw,48px) clamp(28px,3.4cqw,52px)}
.sh-eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.62;margin:0 0 clamp(14px,1.6cqw,22px);
  display:flex;align-items:center;gap:12px}
.sh-eyebrow::before{content:"";width:28px;height:1px;background:currentColor;opacity:.7}
.sh-h1{font-family:var(--sh-head);font-weight:500;font-size:clamp(40px,min(6.6cqw,11.5cqh),124px);line-height:.92;letter-spacing:-.045em;margin:0;
  text-wrap:balance}
.sh-h1 .sh-line{display:block}
.sh-accent{font-family:var(--sh-accent);font-style:italic;font-weight:400;letter-spacing:-.02em;color:var(--sh-acc)}
.sh-aside{max-width:400px;justify-self:end;padding-bottom:.6em}
.sh-body{font-size:clamp(15px,1.1cqw,17px);line-height:1.5;letter-spacing:-.01em;margin:0 0 26px;opacity:.78;text-wrap:pretty}
.sh-ctas{display:flex;flex-wrap:wrap;align-items:center;gap:22px}
.sh-btn{display:inline-flex;align-items:center;gap:10px;height:46px;padding:0 22px;border-radius:999px;background:var(--sh-fg);
  color:var(--sh-bg);text-decoration:none;font-size:14.5px;font-weight:500;letter-spacing:-.01em;transition:transform .3s cubic-bezier(.2,.7,.2,1),opacity .2s}
.sh-btn:hover{transform:translateY(-1px)}
.sh-btn svg,.sh-txt svg{transition:transform .3s cubic-bezier(.2,.7,.2,1)}
.sh-btn:hover svg,.sh-txt:hover svg{transform:translateX(3px)}
.sh-txt{display:inline-flex;align-items:center;gap:8px;color:inherit;text-decoration:none;font-size:14.5px;font-weight:500;
  letter-spacing:-.01em;padding:4px 0;border-bottom:1px solid color-mix(in srgb,var(--sh-fg) 30%,transparent)}
.sh-root a:focus-visible{outline:2px solid var(--sh-fg);outline-offset:4px}
.sh-credit{position:absolute;z-index:2;right:clamp(20px,3.2cqw,48px);bottom:10px;font-size:10px;letter-spacing:.06em;
  color:inherit;opacity:.38;text-decoration:none}
.sh-credit:hover{opacity:.8}
@container (max-width:1023px){
  .sh-content{grid-template-columns:1fr;gap:28px}
  .sh-aside{justify-self:start;max-width:520px;padding-bottom:0}
  .sh-h1{font-size:clamp(40px,min(9.5cqw,9cqh),96px)}
}
@container (max-width:767px){
  .sh-links li:not(.sh-keep){display:none}
}
@container (max-width:639px){
  .sh-nav{padding-top:20px}
  .sh-h1{font-size:clamp(36px,min(12.5cqw,7.2cqh),60px);line-height:.94}
  .sh-body{font-size:15px;margin-bottom:20px}
  .sh-eyebrow{font-size:11px}
  .sh-ctas{gap:18px}
  .sh-btn{height:48px}
  .sh-content{padding-bottom:40px}
  .sh-credit{right:auto;left:50%;transform:translateX(-50%)}
}
@media (prefers-reduced-motion:reduce){
  .sh-hint::before{animation:none}
  .sh-canvas,.sh-fallback,.sh-btn,.sh-btn svg,.sh-txt svg{transition:none}
}
`,Ht=()=>(0,a.jsxs)("svg",{width:"15",height:"15",viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",children:[(0,a.jsx)("circle",{cx:"8",cy:"8",r:"3.2",stroke:"currentColor",strokeWidth:"1.3"}),(0,a.jsx)("path",{d:"M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M3.2 12.8l1.1-1.1M11.7 4.3l1.1-1.1",stroke:"currentColor",strokeWidth:"1.3",strokeLinecap:"round"})]}),Wt=()=>(0,a.jsx)("svg",{width:"15",height:"15",viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",children:(0,a.jsx)("path",{d:"M13.6 10.1A5.9 5.9 0 0 1 5.9 2.4a5.9 5.9 0 1 0 7.7 7.7Z",stroke:"currentColor",strokeWidth:"1.3",strokeLinejoin:"round"})}),nt=()=>(0,a.jsx)("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none","aria-hidden":"true",children:(0,a.jsx)("path",{d:"M2 7h10M8 3l4 4-4 4",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round",strokeLinejoin:"round"})}),ot=!1;function Xt(){if(ot||typeof document>"u")return;ot=!0;let s="sh-fonts";if(document.getElementById(s))return;let e=document.createElement("link");e.id=s,e.rel="stylesheet",e.href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap",document.head.appendChild(e)}function Gt(s,e){return s.split(`
`).map((i,r)=>{let o=i,n=e&&e.trim();if(n){let l=i.indexOf(n);l>=0&&(o=(0,a.jsxs)(a.Fragment,{children:[i.slice(0,l),(0,a.jsx)("span",{className:"sh-accent",children:n}),i.slice(l+n.length)]}))}return(0,a.jsx)("span",{className:"sh-line",children:o},r)})}function ve(s){let{src:e=b.src,darkSrc:t=b.darkSrc,mobileSrc:i=b.mobileSrc,mobileDarkSrc:r=b.mobileDarkSrc,imageAlt:o=b.imageAlt,imageBackground:n,brand:l=b.brand,navLinks:u=b.navLinks,navCta:p=b.navCta,showNav:y=!0,eyebrow:x=b.eyebrow,headline:I=b.headline,headlineAccent:H=b.headlineAccent,body:h=b.body,primaryCta:g=b.primaryCta,secondaryCta:T=b.secondaryCta,hint:_=b.hint,hintTouch:S=b.hintTouch,background:v=b.background,darkBackground:m=b.darkBackground,theme:D="light",themeToggle:A=!0,textColor:j,accentColor:ht,headingFont:ft=b.headingFont,accentFont:mt=b.accentFont,bodyFont:dt=b.bodyFont,loadFonts:be=!0,sculptureScale:re=1,mobileSculptureScale:se=1,sculptureX:ne=0,sculptureY:oe=0,interactive:ae=!0,strength:xe=1,radius:Te=220,particleDensity:we=1,particleSpread:ye=1,dotSize:Ee=1,turbulence:Re=1,liquid:Fe=1,streaks:Me=!0,restStyle:Se="image",returnSpeed:Ae=1,ambient:ke=!1,ambientIntensity:Le=1,speed:Ie=1,intro:_e=!1,height:pt="100svh",backdropText:De="forma",showCredit:vt=!0,className:Pe,style:gt}=s,J=f.useRef(null),Ue=f.useRef(null),Be=f.useRef(null),Ce=f.useRef(null),Q=f.useRef(null),Z=f.useRef(null),Ne=f.useRef(null),Y=f.useRef(null),$=f.useRef(1983/793),[bt,xt]=f.useState(!1),He=f.useRef({scale:re,mobileScale:se,x:ne,y:oe});He.current={scale:d(re,.3,3),mobileScale:d(se,.3,3),x:ne,y:oe};let[O,We]=f.useState(D);f.useEffect(()=>We(D),[D]);let ce=O==="dark"?m:v,K=f.useMemo(()=>st(ce,[.92,.91,.9]),[ce]),Tt=K[0]*.2126+K[1]*.7152+K[2]*.0722<.45,Xe=j||(Tt?"#F1EFEA":b.textColor),wt=ht||Xe,Ge=f.useMemo(()=>n?st(n,[.918,.914,.906]):null,[n]),[ze,yt]=f.useState(!1),qe=f.useRef(!1),ue=ze&&O==="dark"&&(r||t)||ze&&O==="light"&&i||O==="dark"&&t||e,Oe=c=>({interactive:ae,strength:d(xe,0,2),radius:d(Te,40,600),density:d(we,.15,2),dotSize:d(Ee,.2,3),spread:d(ye,0,2),turbulence:d(Re,0,2),liquid:d(Fe,0,2),streaks:Me,restStyle:Se,returnSpeed:d(Ae,0,2),ambient:ke,ambientIntensity:d(Le,0,2),speed:d(Ie,.25,3),intro:_e,reducedMotion:c,bg:K,imgBg:Ge}),le=f.useRef(Oe);le.current=Oe,f.useEffect(()=>{be&&Xt()},[be]);let W=f.useCallback(()=>{let c=J.current;if(!c)return;let F=c.clientWidth,k=c.clientHeight,w=F<640;w!==qe.current&&(qe.current=w,yt(w));let B=Q.current,R=Z.current,P={top:B?B.offsetTop+B.offsetHeight+8:16,bottom:R?R.offsetTop-8:k};w&&$.current<1.3&&R&&(P.bottom+=R.offsetHeight*.3);let M=Ct(F,k,$.current,P,He.current),X=Ne.current;if(X){let V=Math.max(1,(X.textContent||"").length);X.style.fontSize=Math.min((P.bottom-P.top)*.95,F*.92/(V*.56))+"px",X.style.top=(P.top+P.bottom)/2+"px"}let C=Be.current;C&&(C.style.left=M.x+"px",C.style.top=M.y+"px",C.style.width=M.w+"px",C.style.height=M.h+"px");let G=Ce.current;G&&(G.style.display=w&&$.current<1.3?"none":"",G.style.left=d(M.x+M.w/2,80,F-80)+"px",G.style.top=Math.min(M.y+M.h*.95,P.bottom-20)+"px"),Y.current?.resize(F,k,M)},[]);f.useEffect(()=>{let c=J.current,F=Ue.current;if(!c||!F)return;let k=document.createElement("canvas");k.className="sh-canvas",F.appendChild(k);let w=window.matchMedia("(prefers-reduced-motion: reduce)"),B=window.matchMedia("(hover: none), (pointer: coarse)");xt(B.matches);let R=null,P=()=>{c.dataset.gl="off"};try{R=new de(k,le.current(w.matches),P),Y.current=R}catch{P()}let M=new ResizeObserver(()=>W());M.observe(c),Q.current&&M.observe(Q.current),Z.current&&M.observe(Z.current);let X=new IntersectionObserver(E=>{for(let L of E)R?.setVisible(L.isIntersecting&&!document.hidden)});X.observe(c);let C=()=>R?.setVisible(!document.hidden);document.addEventListener("visibilitychange",C);let G=()=>R?.setOptions({reducedMotion:w.matches});w.addEventListener?.("change",G);let V=E=>{let L=c.getBoundingClientRect();return[E.clientX-L.left,E.clientY-L.top]},je=!1,Ye=()=>{je||(je=!0,c.dataset.touched="1")},$e=E=>{let[L,z]=V(E),Qe=E.pointerType==="touch";Qe&&E.buttons===0&&E.pressure===0||(R?.pointer("move",L,z,Qe),Ye())},Ke=E=>{let[L,z]=V(E);R?.pointer("down",L,z,E.pointerType==="touch"),Ye()},ee=E=>{let[L,z]=V(E);R?.pointer("up",L,z,E.pointerType==="touch")},Je=E=>{let[L,z]=V(E);R?.pointer("leave",L,z,E.pointerType==="touch")};return c.addEventListener("pointermove",$e,{passive:!0}),c.addEventListener("pointerdown",Ke,{passive:!0}),c.addEventListener("pointerup",ee,{passive:!0}),c.addEventListener("pointercancel",ee,{passive:!0}),c.addEventListener("pointerleave",Je,{passive:!0}),()=>{M.disconnect(),X.disconnect(),document.removeEventListener("visibilitychange",C),w.removeEventListener?.("change",G),c.removeEventListener("pointermove",$e),c.removeEventListener("pointerdown",Ke),c.removeEventListener("pointerup",ee),c.removeEventListener("pointercancel",ee),c.removeEventListener("pointerleave",Je),R?.destroy(),Y.current=null,k.remove(),delete c.dataset.gl}},[W]),f.useEffect(()=>{let c=J.current,F=Y.current;if(!c)return;let k=!1,w=new Image;w.crossOrigin="anonymous",w.decoding="async";let B=c.dataset.gl==="on";B&&(c.dataset.swap="1"),w.onload=()=>{if(!k)if($.current=w.naturalWidth/w.naturalHeight||$.current,W(),F&&c.dataset.gl!=="off")try{F.onFirstFrame=()=>{k||(c.dataset.gl="on",delete c.dataset.swap)},F.setImage(w),W()}catch{c.dataset.gl="off"}else delete c.dataset.swap},w.onerror=()=>{delete c.dataset.swap};let R=window.setTimeout(()=>w.src=ue,B?280:0);return()=>{k=!0,window.clearTimeout(R),w.onload=null,w.onerror=null}},[ue,W]),f.useEffect(()=>{let c=Y.current;if(!c)return;let F=window.matchMedia("(prefers-reduced-motion: reduce)").matches;c.setOptions(le.current(F))},[ae,xe,Te,we,Ee,ye,Re,Fe,Me,Se,Ae,ke,Le,Ie,_e,K,Ge]),f.useEffect(()=>{W()},[re,se,ne,oe,W]);let Et={"--sh-bg":ce,"--sh-fg":Xe,"--sh-acc":wt,"--sh-head":ft,"--sh-accent":mt,"--sh-body":dt,"--sh-h":pt},Ve=bt?S:_;return(0,a.jsxs)("section",{ref:J,className:"sh-root"+(Pe?" "+Pe:""),style:{...Et,...gt},children:[(0,a.jsx)("style",{children:Nt}),De?(0,a.jsx)("div",{ref:Ne,className:"sh-backdrop","aria-hidden":"true",children:De}):null,(0,a.jsx)("div",{ref:Ue,className:"sh-stage","aria-hidden":"true",children:(0,a.jsx)("img",{ref:Be,className:"sh-fallback",src:ue,alt:"",crossOrigin:"anonymous",draggable:!1})}),(0,a.jsx)("span",{style:{position:"absolute",width:1,height:1,overflow:"hidden",clip:"rect(0 0 0 0)"},children:o}),y&&(0,a.jsxs)("nav",{ref:Q,className:"sh-nav","aria-label":"Primary",children:[(0,a.jsx)("a",{className:"sh-brand",href:"#",children:l}),(0,a.jsxs)("ul",{className:"sh-links",children:[u.map((c,F)=>(0,a.jsx)("li",{children:(0,a.jsx)("a",{className:"sh-link",href:c.href,children:c.label})},F)),A&&(0,a.jsx)("li",{className:"sh-keep",children:(0,a.jsx)("button",{type:"button",className:"sh-theme","aria-label":O==="dark"?"Switch to light theme":"Switch to dark theme",onClick:()=>We(c=>c==="dark"?"light":"dark"),children:O==="dark"?(0,a.jsx)(Ht,{}):(0,a.jsx)(Wt,{})})}),p&&p.label&&(0,a.jsx)("li",{className:"sh-keep",children:(0,a.jsx)("a",{className:"sh-navcta",href:p.href,children:p.label})})]})]}),ae&&Ve?(0,a.jsx)("div",{ref:Ce,className:"sh-hint","aria-hidden":"true",children:Ve}):null,(0,a.jsx)("div",{className:"sh-spacer"}),(0,a.jsxs)("div",{ref:Z,className:"sh-content",children:[(0,a.jsxs)("div",{children:[x?(0,a.jsx)("p",{className:"sh-eyebrow",children:x}):null,(0,a.jsx)("h1",{className:"sh-h1",children:Gt(I,H)})]}),(0,a.jsxs)("div",{className:"sh-aside",children:[h?(0,a.jsx)("p",{className:"sh-body",children:h}):null,(0,a.jsxs)("div",{className:"sh-ctas",children:[g&&g.label?(0,a.jsxs)("a",{className:"sh-btn",href:g.href,children:[g.label,(0,a.jsx)(nt,{})]}):null,T&&T.label?(0,a.jsxs)("a",{className:"sh-txt",href:T.href,children:[T.label,(0,a.jsx)(nt,{})]}):null]})]})]}),vt&&(0,a.jsx)("a",{className:"sh-credit",href:"https://guglielmogiannattasio.it",target:"_blank",rel:"noopener",children:"by guglielmogiannattasio.it"})]})}var ct=N(q(),1);function ie(){return(0,ct.jsx)(ve,{})}var lt=N(q(),1),zt=ie||Object.values(ge).find(s=>typeof s=="function");(0,ut.createRoot)(document.getElementById("root")).render((0,lt.jsx)(zt,{}));})();
