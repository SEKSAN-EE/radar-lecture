Scenes.register('acc',function(root){
  const T=THREE,canvas=root.querySelector('canvas.gl');
  const v=makeView(canvas,{th:0.55,ph:0.3,dist:34,target:new T.Vector3(0,1.5,-14),minD:8,maxD:60,bg:0xcfe3f3});
  const S=v.scene;S.fog=new T.Fog(0xcfe3f3,60,260);addLights(S,1.0);
  const ground=groundPlane(S,1200,0x9fb58a,-0.02);
  // road with scrolling dashes
  const cv=document.createElement('canvas');cv.width=128;cv.height=256;const g=cv.getContext('2d');g.fillStyle='#4b5563';g.fillRect(0,0,128,256);g.fillStyle='#e8edf2';g.fillRect(4,0,5,256);g.fillRect(119,0,5,256);g.fillRect(61,0,6,128);
  const tex=new T.CanvasTexture(cv);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(1,60);tex.colorSpace=T.SRGBColorSpace;
  const road=new T.Mesh(new T.PlaneGeometry(7.5,300),new T.MeshStandardMaterial({map:tex,roughness:.95}));road.rotation.x=-Math.PI/2;road.position.set(0,0,-120);S.add(road);
  const poles=[];const pm=mat(0x8a939c);for(let i=0;i<24;i++){for(const sx of[-1,1]){const p=new T.Mesh(new T.CylinderGeometry(.08,.1,3.2,8),pm);p.position.set(sx*5.2,1.6,0);S.add(p);poles.push({p,z0:-i*14,sx});}}
  const ego=car(C3.navy);S.add(ego);const lead=car(0xb0b8c2);S.add(lead);
  const cg=new T.BufferGeometry();cg.setAttribute('position',new T.BufferAttribute(new Float32Array([0,0,0, -10.4,0,-80, 10.4,0,-80]),3));
  const cn=new T.Mesh(cg,new T.MeshBasicMaterial({color:C3.org,transparent:true,opacity:.28,side:T.DoubleSide,depthWrite:false}));cn.position.set(0,0.45,-2.3);S.add(cn);
  const ping=new T.Mesh(new T.RingGeometry(.9,1.0,40),new T.MeshBasicMaterial({color:C3.org,transparent:true,opacity:.5,side:T.DoubleSide,depthWrite:false}));ping.position.y=.9;S.add(ping);
  const gl=lbl('Car ahead','#14213D',.8);S.add(gl);const el=lbl('Your car + radar','#14213D',.7);S.add(el);
  let vset=100/3.6,vl=80/3.6,vv=100/3.6,gap=55,dist=0,tm=0,hist=[];const hud={v:root.querySelector('#c-v'),vl:root.querySelector('#c-vl'),g:root.querySelector('#c-g'),m:root.querySelector('#c-m')};
  const hc=root.querySelector('canvas.hist'),hg=hc&&hc.getContext('2d');
  bindRange(root,'#c-set',x=>{vset=x/3.6;},x=>x+' km/h');bindRange(root,'#c-lead',x=>{vl=x/3.6;},x=>x+' km/h');
  bindBtns(root,'[data-ev]',x=>{if(x==='cut')gap=22;if(x==='reset'){vv=vset;gap=55;hist=[];}});
  function drawHist(){if(!hc)return;const w=hc.width,h=hc.height;hg.clearRect(0,0,w,h);hg.fillStyle='#fff';hg.fillRect(0,0,w,h);hg.strokeStyle='#D0D5DD';hg.lineWidth=1;
    for(let k=0;k<=3;k++){const y=8+(h-24)*k/3;hg.beginPath();hg.moveTo(30,y);hg.lineTo(w-6,y);hg.stroke();hg.fillStyle='#6B7585';hg.font='10px Helvetica,Arial';hg.fillText(String(140-k*40),2,y+3);}
    const X=i=>30+(w-36)*i/(hist.length-1||1),Y=s=>8+(h-24)*(1-(s*3.6-20)/120);
    hg.lineWidth=2.5;hg.strokeStyle='#14213D';hg.beginPath();hist.forEach((q,i)=>{const x=X(i),y=Y(q.v);i?hg.lineTo(x,y):hg.moveTo(x,y);});hg.stroke();
    hg.strokeStyle='#8a939c';hg.setLineDash([5,4]);hg.beginPath();hist.forEach((q,i)=>{const x=X(i),y=Y(q.l);i?hg.lineTo(x,y):hg.moveTo(x,y);});hg.stroke();hg.setLineDash([]);
    hg.fillStyle='#14213D';hg.font='bold 11px Helvetica,Arial';hg.fillText('your speed',34,h-4);hg.fillStyle='#8a939c';hg.fillText('car ahead',110,h-4);}

  const rc=root.querySelector('canvas.rd'),rg2=rc.getContext('2d');
  const RW=rc.width,RH=rc.height,ML=44,MB=34,MT=26,MR=8,PW=RW-ML-MR,PH=RH-MT-MB,RMAX=150,VMIN=-15,VMAX=40,NC=60,NR=38;
  const xr=r=>ML+PW*r/RMAX, yv=c=>MT+PH*(1-(c-VMIN)/(VMAX-VMIN));
  function drawRD(gapv,closing,vown,distv,brake){
    rg2.clearRect(0,0,RW,RH);rg2.fillStyle='#0b1730';rg2.fillRect(0,0,RW,RH);
    const cw=PW/NC,ch=PH/NR,blobs=[];
    blobs.push({r:gapv,c:closing,a:Math.min(1.25,2.2*Math.pow(30/Math.max(gapv,8),0.8)),sr:5,sc:1.6});            // lead car
    for(let k=1;k<=11;k++){const r=k*14-(distv%14);if(r>6&&r<RMAX)blobs.push({r:r,c:vown,a:0.5*Math.pow(40/r,0.9),sr:3.2,sc:1.4});} // static roadside poles
    blobs.push({r:RMAX*0.5,c:vown,a:0.16,sr:RMAX*0.45,sc:2.4});                                                  // ground clutter ridge
    for(let i=0;i<NC;i++)for(let j=0;j<NR;j++){const r=(i+.5)/NC*RMAX,c=VMAX-(j+.5)/NR*(VMAX-VMIN);let e=0.07+0.06*Math.abs(Math.sin(i*12.9898+j*78.233+Math.floor(performance.now()/90)*0.7));
      for(const b of blobs){const dr=(r-b.r)/b.sr,dc=(c-b.c)/b.sc;e+=b.a*Math.exp(-0.5*(dr*dr+dc*dc));}
      const t=turbo(Math.min(1,e));rg2.fillStyle='rgb('+((t.r*255)|0)+','+((t.g*255)|0)+','+((t.b*255)|0)+')';rg2.fillRect(ML+i*cw,MT+j*ch,cw+0.6,ch+0.6);}
    // axes
    rg2.strokeStyle='#8EA0B8';rg2.lineWidth=1;rg2.strokeRect(ML,MT,PW,PH);rg2.fillStyle='#C9D4E4';rg2.font='11px Helvetica,Arial';rg2.textAlign='center';
    [0,50,100,150].forEach(r=>rg2.fillText(r,xr(r),MT+PH+13));rg2.fillText('Range (m)',ML+PW/2,RH-5);
    rg2.textAlign='right';[-10,0,10,20,30,40].forEach(c=>rg2.fillText(c,ML-5,yv(c)+4));
    rg2.save();rg2.translate(11,MT+PH/2);rg2.rotate(-Math.PI/2);rg2.textAlign='center';rg2.fillText('Closing speed (m/s)',0,0);rg2.restore();
    rg2.setLineDash([4,4]);rg2.strokeStyle='#ffffff88';rg2.beginPath();rg2.moveTo(ML,yv(0));rg2.lineTo(ML+PW,yv(0));rg2.stroke();rg2.setLineDash([]);
    rg2.textAlign='left';rg2.fillStyle='#ffffffcc';rg2.fillText('same speed',ML+4,yv(0)-4);
    // detected target
    const tx=xr(gapv),ty=yv(closing);rg2.strokeStyle=brake?'#ff5a4a':'#ffd24a';rg2.lineWidth=2;rg2.strokeRect(tx-14,ty-11,28,22);
    rg2.fillStyle=brake?'#ff8a7a':'#ffd24a';rg2.font='bold 12px Helvetica,Arial';rg2.textAlign=tx>ML+PW*0.55?'right':'left';rg2.fillText('car ahead',tx+(tx>ML+PW*0.55?-18:18),ty-6);
    rg2.fillStyle='#ffffffe0';rg2.font='11px Helvetica,Arial';rg2.textAlign='right';rg2.fillText('roadside poles (static)',ML+PW-4,yv(vown)-8);
    rg2.fillStyle='#fff';rg2.font='bold 12px Helvetica,Arial';rg2.textAlign='left';rg2.fillText('Range–Doppler map: what the radar sees',ML,16);
  }
  v.tick=function(dt){tm+=dt;const h=0.02;let n=Math.max(1,Math.round(dt/h)),mode='CRUISE',a=0;
    for(let i=0;i<n;i++){const ddes=5+1.8*vv,af=0.25*(gap-ddes)+0.9*(vl-vv),ac=0.5*(vset-vv);
      if(gap<150&&af<ac){a=af;mode='FOLLOW';}else{a=ac;mode='CRUISE';}a=Math.max(-3.5,Math.min(1.5,a));
      vv=Math.max(0,vv+a*h);gap+=(vl-vv)*h;if(gap<4){gap=4;}if(gap>400)gap=400;dist+=vv*h;}
    ego.position.set(0,0,0);lead.position.set(0,0,-gap-4.4);lead.rotation.y=0;
    tex.offset.y=(dist/5)%1;
    poles.forEach(o=>{let z=o.z0+(dist%(24*14));if(z>8)z-=24*14;o.p.position.z=z;});
    const be=a<-0.4?1:0;ego.userData.brake.material.emissiveIntensity=be*1.2;
    ping.visible=false;
    cn.scale.set(1,1,Math.min(1,(gap+5)/80));
    v.target.set(0,1.5,-Math.min(gap,60)*0.25-3);gl.position.set(0,3.4,-gap-4.4);el.position.set(0,3.3,0);
    hud.v.textContent=(vv*3.6).toFixed(0)+' km/h';hud.vl.textContent=(vl*3.6).toFixed(0)+' km/h';hud.g.textContent=gap.toFixed(0)+' m';hud.m.textContent=mode;
    drawRD(gap,vv-vl,vv,dist,a<-0.4);hist.push({v:vv,l:vl});if(hist.length>420)hist.shift();drawHist();};
  return v;});
