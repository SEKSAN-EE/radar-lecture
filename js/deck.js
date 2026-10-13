(function(){
"use strict";
const $=s=>document.querySelector(s);
const slides=[...document.querySelectorAll('.slide')];
let cur=0;
const SC={};                       // 3D scene registry: name -> {init, view}
window.Scenes={register(name,init){SC[name]={init,view:null};}};
const TOTAL=slides.length;
/* ---------- fit to window ---------- */
function fitDeck(){const W=innerWidth,H=innerHeight-50;const k=Math.min(W/1280,H/720);$('#fit').style.transform=`scale(${k})`;}
/* ---------- numbering ---------- */
slides.forEach((s,i)=>s.querySelectorAll('.sn').forEach(e=>e.textContent=i+1));
/* ---------- navigation ---------- */
function preload(i){const s=slides[i];if(!s)return;s.querySelectorAll('img[loading=lazy]').forEach(im=>{im.loading='eager';});}
function show(i){
  i=Math.max(0,Math.min(TOTAL-1,i));slides[cur].classList.remove('on');cur=i;const s=slides[cur];s.classList.add('on');
  preload(cur);preload(cur+1);
  $('#pos').textContent=(cur+1)+' / '+TOTAL;$('#bar').style.width=(100*(cur+1)/TOTAL)+'%';
  for(const k in SC){const e=SC[k];if(e.view)e.view.active=false;}
  const sc=s.dataset.scene;
  if(sc&&SC[sc]){const e=SC[sc];if(!e.view){try{e.view=e.init(s);}catch(err){console.error('scene',sc,err);}}
    if(e.view){e.view.active=true;e.view.resize&&e.view.resize();e.view.enter&&e.view.enter();}}
  $('#notes').innerHTML=(s.dataset.notes?'<b>Speaker notes</b>\n'+s.dataset.notes.replace(/</g,'&lt;'):'<b>Speaker notes</b>\n(none)');
  history.replaceState(null,'','#'+(cur+1));
}
addEventListener('keydown',e=>{
  if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&e.key!=='Escape')return;
  if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();show(cur+1);}
  else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(cur-1);}
  else if(e.key==='Home')show(0);else if(e.key==='End')show(TOTAL-1);
  else if(e.key==='n'||e.key==='N')$('#notes').classList.toggle('on');
  else if(e.key==='f'||e.key==='F')toggleFS();
});
function toggleFS(){if(!document.fullscreenElement)document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();else document.exitFullscreen();}
addEventListener('hashchange',()=>{const n=parseInt(location.hash.slice(1));if(!isNaN(n))show(n-1);});
$('#prev').onclick=()=>show(cur-1);$('#next').onclick=()=>show(cur+1);$('#nbtn').onclick=()=>$('#notes').classList.toggle('on');$('#fsbtn').onclick=toggleFS;
let sx=null;addEventListener('touchstart',e=>{if(e.target.tagName==='CANVAS'||e.target.tagName==='INPUT')return;sx=e.touches[0].clientX;},{passive:true});
addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>60)show(cur+(dx<0?1:-1));},{passive:true});
/* ---------- three.js helpers ---------- */
const T=window.THREE;
window.makeView=function(canvas,o){
  const r=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});r.setPixelRatio(Math.min(devicePixelRatio,2));
  r.shadowMap.enabled=!!o.shadows;r.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene();scene.background=new T.Color(o.bg!==undefined?o.bg:0xeaf1f8);
  const cam=new T.PerspectiveCamera(o.fov||40,1,0.1,5000);
  const v={r,scene,cam,active:false,th:o.th||0.6,ph:o.ph||0.5,dist:o.dist||30,target:o.target||new T.Vector3(),auto:o.auto||0,drag:false,canvas};
  v.place=()=>{const t=v.target;cam.position.set(t.x+v.dist*Math.cos(v.ph)*Math.sin(v.th),t.y+v.dist*Math.sin(v.ph),t.z+v.dist*Math.cos(v.ph)*Math.cos(v.th));cam.lookAt(t);};
  v.resize=()=>{const w=canvas.clientWidth*1,h=canvas.clientHeight*1;if(!w||!h)return;const k=canvas.getBoundingClientRect().width/canvas.offsetWidth||1;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();};
  let lx=0,ly=0,pan=false;
  canvas.addEventListener('pointerdown',e=>{v.drag=true;pan=e.shiftKey||e.button===2;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!v.drag)return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;
    if(pan&&o.pan!==false){const k=v.dist*0.0016;const right=new T.Vector3().setFromMatrixColumn(cam.matrix,0),up=new T.Vector3().setFromMatrixColumn(cam.matrix,1);v.target.addScaledVector(right,-dx*k).addScaledVector(up,dy*k);}
    else{v.th-=dx*0.006;v.ph=Math.max(o.minPh!==undefined?o.minPh:0.05,Math.min(o.maxPh||1.5,v.ph+dy*0.005));}});
  canvas.addEventListener('pointerup',()=>v.drag=false);canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('wheel',e=>{e.preventDefault();v.dist=Math.max(o.minD||5,Math.min(o.maxD||200,v.dist*(1+e.deltaY*0.001)));},{passive:false});
  v.place();return v;};
window.lbl=function(text,color,size,bg){
  const c=document.createElement('canvas');const ctx=c.getContext('2d');const fs=56,font=`700 ${fs}px Helvetica, Arial, sans-serif`;ctx.font=font;
  const w=Math.ceil(ctx.measureText(text).width)+28;c.width=w;c.height=fs+30;const g=c.getContext('2d');g.font=font;
  if(bg!==null){g.fillStyle=bg||'rgba(255,255,255,.88)';g.fillRect(0,0,w,c.height);}
  g.fillStyle=color||'#14213D';g.textBaseline='middle';g.fillText(text,14,c.height/2+2);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
  const sp=new T.Sprite(new T.SpriteMaterial({map:t,depthTest:false,transparent:true}));sp.scale.set(size*w/c.height,size,1);sp.renderOrder=10;return sp;};
window.bindRange=function(root,sel,cb,fmt){const el=root.querySelector(sel);const out=el.parentElement.querySelector('em');
  const f=()=>{const v=parseFloat(el.value);if(out)out.textContent=fmt?fmt(v):v;cb(v);};el.addEventListener('input',f);f();return el;};
window.bindBtns=function(root,sel,cb){const bs=[...root.querySelectorAll(sel)];bs.forEach(b=>b.onclick=()=>{bs.forEach(x=>x.classList.toggle('on',x===b));cb(b.dataset.v,b);});return bs;};
/* ---------- divider sweep (2D canvas) ---------- */
function drawSweep(c,t){const w=c.width,h=c.height,g=c.getContext('2d');g.clearRect(0,0,w,h);const cx=w/2,cy=h/2,R=w/2-6;
  g.lineWidth=2;g.strokeStyle='#D0D5DD';for(let i=1;i<=4;i++){g.beginPath();g.arc(cx,cy,R*i/4,0,7);g.stroke();}
  g.beginPath();g.moveTo(cx-R,cy);g.lineTo(cx+R,cy);g.moveTo(cx,cy-R);g.lineTo(cx,cy+R);g.stroke();
  const a=t*1.2;for(let k=0;k<60;k++){const aa=a-k*0.02;g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,R,aa-0.02,aa);g.closePath();g.fillStyle=`rgba(237,125,49,${0.38*(1-k/60)})`;g.fill();}
  g.strokeStyle='#ED7D31';g.lineWidth=3;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a));g.stroke();
  const bl=[[0.55,0.9],[0.78,2.4],[0.35,4.2],[0.9,5.3],[0.62,3.3]];
  bl.forEach(([r,th])=>{let d=((a-th)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);const al=Math.max(0,1-d/3.2);if(al<=0)return;g.fillStyle=`rgba(20,33,61,${al})`;g.beginPath();g.arc(cx+R*r*Math.cos(th),cy+R*r*Math.sin(th),7,0,7);g.fill();});}
/* ---------- render loop ---------- */
let last=performance.now(),clock=0;
function frame(now){const dt=Math.min(0.1,(now-last)/1000);last=now;clock+=dt;
  const sw=slides[cur].querySelector('canvas.divsweep');if(sw)drawSweep(sw,clock);
  for(const k in SC){const v=SC[k].view;if(!v||!v.active)continue;v.tick&&v.tick(dt,clock);v.place();v.r.render(v.scene,v.cam);}
  requestAnimationFrame(frame);}
new ResizeObserver(()=>{fitDeck();for(const k in SC){const v=SC[k].view;v&&v.active&&v.resize();}}).observe(document.body);
fitDeck();
window.addEventListener('load',()=>{const h=parseInt(location.hash.slice(1));show(isNaN(h)?0:h-1);requestAnimationFrame(frame);});
window.__show=show;
})();
