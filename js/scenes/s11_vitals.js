Scenes.register('vitals',function(root){
  const T=THREE,canvas=root.querySelector('canvas.gl');
  const v=makeView(canvas,{th:0.62,ph:0.2,dist:36,target:new T.Vector3(0,2.2,6),minD:14,maxD:80,bg:0xf0f5fa});
  const S=v.scene;addLights(S);groundPlane(S,200,0xe3ebf2,-4.6);
  // person: seated, facing +z
  const skin=mat(0xe2b79a,{roughness:.8}),shirt=mat(0x4a6fa5,{roughness:.9});
  const SX=36,SY=48;const tg=new T.BoxGeometry(5,7,2.4,SX,SY,6);const tp=tg.attributes.position;const base0=Float32Array.from(tp.array);
  const torso=new T.Mesh(tg,shirt);torso.position.y=2.0;S.add(torso);
  const head=new T.Mesh(new T.SphereGeometry(1.35,24,18),skin);head.position.set(0,6.7,0.1);S.add(head);
  const neck=new T.Mesh(new T.CylinderGeometry(.5,.55,.8,12),skin);neck.position.set(0,5.7,0);S.add(neck);
  for(const sx of[-1,1]){const a=new T.Mesh(new T.CylinderGeometry(.55,.5,5.4,14),shirt);a.position.set(sx*3.1,1.2,0.2);S.add(a);}
  const lap=new T.Mesh(new T.BoxGeometry(5,1.2,5.4),mat(0x3b4350));lap.position.set(0,-2.4,2);S.add(lap);
  const chair=new T.Mesh(new T.BoxGeometry(6,.4,5),mat(0x8a939c));chair.position.set(0,-3.3,1.5);S.add(chair);
  // radar
  const rad=new T.Group();const rb=new T.Mesh(new T.BoxGeometry(2.6,1.8,.8),mat(0x14213d));rad.add(rb);const rpcb=new T.Mesh(new T.BoxGeometry(2.2,1.4,.12),mat(C3.green));rpcb.position.z=-.45;rad.add(rpcb);rad.position.set(0,2.8,14);S.add(rad);
  const rl=lbl('mmWave radar (60 GHz)','#14213D',.9);rl.position.set(0,5.2,14);S.add(rl);
  const cnn=cone(11.5,0.12,C3.org,.18);cnn.rotation.y=-Math.PI/2;cnn.position.set(0,2.8,13.6);S.add(cnn);
  const rings=[];for(let i=0;i<4;i++){const r=new T.Mesh(new T.RingGeometry(.9,1.0,32),new T.MeshBasicMaterial({color:C3.org,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));S.add(r);rings.push(r);}
  const chestL=lbl('chest wall','#14213D',.9);chestL.position.set(-5.2,3.4,2.2);S.add(chestL);
  let br=15,hr=72,ex=200,tm=0;const fs=20,Nbuf=fs*20;const xb=[],pb=[];const lam=5;      // mm
  const hud={x:root.querySelector('#v-x'),p:root.querySelector('#v-p'),rr:root.querySelector('#v-rr'),hr:root.querySelector('#v-hr')};
  const c1=root.querySelector('canvas.wave'),g1=c1.getContext('2d'),c2=root.querySelector('canvas.spec'),g2=c2.getContext('2d');
  bindRange(root,'#v-brs',x=>{br=x;},x=>x+' /min');bindRange(root,'#v-hrs',x=>{hr=x;},x=>x+' bpm');bindRange(root,'#v-exs',x=>{ex=x;},x=>x+'×');
  function disp(t){return 4*Math.sin(2*Math.PI*br/60*t)+0.3*Math.sin(2*Math.PI*hr/60*t+0.6)+0.12*Math.sin(2*Math.PI*br/60*3*t)*0;}
  function drawWave(){const w=c1.width,h=c1.height;g1.clearRect(0,0,w,h);g1.fillStyle='#fff';g1.fillRect(0,0,w,h);const n=pb.length;if(n<2)return;
    let mn=1e9,mx=-1e9;pb.forEach(a=>{mn=Math.min(mn,a);mx=Math.max(mx,a);});const Y=a=>8+(h-16)*(1-(a-mn)/(mx-mn||1));
    g1.strokeStyle='#ED7D31';g1.lineWidth=2.5;g1.beginPath();pb.forEach((a,i)=>{const x=6+(w-12)*i/(Nbuf-1),y=Y(a);i?g1.lineTo(x,y):g1.moveTo(x,y);});g1.stroke();
    g1.fillStyle='#6B7585';g1.font='11px Helvetica,Arial';g1.fillText('radar phase φ = 4π·x/λ (last 20 s)',8,h-3);}
  let sacc=0;function drawSpec(){const w=c2.width,h=c2.height;g2.clearRect(0,0,w,h);g2.fillStyle='#fff';g2.fillRect(0,0,w,h);const n=pb.length;if(n<fs*8)return;
    const m=pb.reduce((a,b)=>a+b,0)/n;const bins=[];let mx=0;for(let f=0;f<=3.0001;f+=0.02){let re=0,im=0;for(let i=0;i<n;i++){const wv=0.5-0.5*Math.cos(2*Math.PI*i/(n-1));const ph=2*Math.PI*f*i/fs;re+=(pb[i]-m)*wv*Math.cos(ph);im+=(pb[i]-m)*wv*Math.sin(ph);}const a=Math.hypot(re,im);bins.push(a);mx=Math.max(mx,a);}
    g2.fillStyle='#D5EAD3';g2.fillRect(6+(w-12)*0.15/3,6,(w-12)*0.35/3,h-24);g2.fillStyle='#FFF2CC';g2.fillRect(6+(w-12)*0.8/3,6,(w-12)*1.2/3,h-24);
    g2.strokeStyle='#3A9D5D';g2.lineWidth=2.5;g2.beginPath();bins.forEach((a,i)=>{const x=6+(w-12)*i/(bins.length-1),y=h-18-(h-28)*Math.pow(a/mx,0.55);i?g2.lineTo(x,y):g2.moveTo(x,y);});g2.stroke();
    g2.fillStyle='#14213D';g2.font='bold 11px Helvetica,Arial';g2.fillText('breathing',6+(w-12)*0.15/3,h-4);g2.fillText('heartbeat',6+(w-12)*0.95/3,h-4);g2.fillText('Hz →',w-34,h-4);}
  v.tick=function(dt){tm+=dt;
    // sample at fs
    sacc+=dt;while(sacc>=1/fs){sacc-=1/fs;const t=tm-sacc;const x=disp(t);xb.push(x);pb.push(4*Math.PI*x/lam);if(pb.length>Nbuf){pb.shift();xb.shift();}}
    const xn=disp(tm);
    // chest surface displacement (exaggerated)
    const bump=(xx,yy,r)=>Math.exp(-(xx*xx+yy*yy)/(r*r));
    for(let i=0;i<tp.count;i++){const x0=base0[i*3],y0=base0[i*3+1],z0=base0[i*3+2];let z=z0;if(z0>1.1){const b=4*Math.sin(2*Math.PI*br/60*tm)*bump(x0,y0+0.3,3.2);const h=0.3*Math.sin(2*Math.PI*hr/60*tm+0.6)*bump(x0+0.7,y0-0.2,1.1);z=z0+(b+h)*ex/1000*1.0;}tp.setZ(i,z);}
    tp.needsUpdate=true;tg.computeVertexNormals();
    rings.forEach((r,i)=>{const a=((tm*1.6+i*.25)%1);r.position.set(0,2.8,13.2-a*10);r.rotation.y=0;r.scale.setScalar(0.5+a*3.5);r.material.opacity=0.5*(1-a);});
    hud.x.textContent=xn.toFixed(2)+' mm';hud.p.textContent=(4*Math.PI*xn/lam).toFixed(2)+' rad';hud.rr.textContent=br+' /min';hud.hr.textContent=hr+' bpm';
    if(((tm*4)|0)!==((tm*4-dt*4)|0)||!drawSpec.done){drawWave();drawSpec();drawSpec.done=true;}};
  return v;});
