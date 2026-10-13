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
  const cn=cone(80,0.13,C3.org,.16);cn.rotation.y=Math.PI/2;cn.position.set(0,0.7,-2.3);S.add(cn);
  const ping=new T.Mesh(new T.RingGeometry(.9,1.0,40),new T.MeshBasicMaterial({color:C3.org,transparent:true,opacity:.5,side:T.DoubleSide,depthWrite:false}));ping.position.y=.9;S.add(ping);
  const gl=lbl('Car ahead','#14213D',.8);S.add(gl);const el=lbl('Your car + radar','#14213D',.7);S.add(el);
  let vset=100/3.6,vl=80/3.6,vv=100/3.6,gap=55,dist=0,tm=0,hist=[];const hud={v:root.querySelector('#c-v'),vl:root.querySelector('#c-vl'),g:root.querySelector('#c-g'),m:root.querySelector('#c-m')};
  const hc=root.querySelector('canvas.hist'),hg=hc.getContext('2d');
  bindRange(root,'#c-set',x=>{vset=x/3.6;},x=>x+' km/h');bindRange(root,'#c-lead',x=>{vl=x/3.6;},x=>x+' km/h');
  bindBtns(root,'[data-ev]',x=>{if(x==='cut')gap=22;if(x==='reset'){vv=vset;gap=55;hist=[];}});
  function drawHist(){const w=hc.width,h=hc.height;hg.clearRect(0,0,w,h);hg.fillStyle='#fff';hg.fillRect(0,0,w,h);hg.strokeStyle='#D0D5DD';hg.lineWidth=1;
    for(let k=0;k<=3;k++){const y=8+(h-24)*k/3;hg.beginPath();hg.moveTo(30,y);hg.lineTo(w-6,y);hg.stroke();hg.fillStyle='#6B7585';hg.font='10px Helvetica,Arial';hg.fillText(String(140-k*40),2,y+3);}
    const X=i=>30+(w-36)*i/(hist.length-1||1),Y=s=>8+(h-24)*(1-(s*3.6-20)/120);
    hg.lineWidth=2.5;hg.strokeStyle='#14213D';hg.beginPath();hist.forEach((q,i)=>{const x=X(i),y=Y(q.v);i?hg.lineTo(x,y):hg.moveTo(x,y);});hg.stroke();
    hg.strokeStyle='#8a939c';hg.setLineDash([5,4]);hg.beginPath();hist.forEach((q,i)=>{const x=X(i),y=Y(q.l);i?hg.lineTo(x,y):hg.moveTo(x,y);});hg.stroke();hg.setLineDash([]);
    hg.fillStyle='#14213D';hg.font='bold 11px Helvetica,Arial';hg.fillText('your speed',34,h-4);hg.fillStyle='#8a939c';hg.fillText('car ahead',110,h-4);}
  v.tick=function(dt){tm+=dt;const h=0.02;let n=Math.max(1,Math.round(dt/h)),mode='CRUISE',a=0;
    for(let i=0;i<n;i++){const ddes=5+1.8*vv,af=0.25*(gap-ddes)+0.9*(vl-vv),ac=0.5*(vset-vv);
      if(gap<150&&af<ac){a=af;mode='FOLLOW';}else{a=ac;mode='CRUISE';}a=Math.max(-3.5,Math.min(1.5,a));
      vv=Math.max(0,vv+a*h);gap+=(vl-vv)*h;if(gap<4){gap=4;}if(gap>400)gap=400;dist+=vv*h;}
    ego.position.set(0,0,0);lead.position.set(0,0,-gap-4.4);lead.rotation.y=0;
    tex.offset.y=(dist/5)%1;
    poles.forEach(o=>{let z=o.z0+(dist%(24*14));if(z>8)z-=24*14;o.p.position.z=z;});
    const be=a<-0.4?1:0;ego.userData.brake.material.emissiveIntensity=be*1.2;
    ping.position.z=-2.3-((tm*38)%(gap+2));ping.rotation.y=Math.PI/2;ping.scale.setScalar(0.5+((tm*38)%(gap+2))*0.012);ping.material.opacity=0.45*(1-((tm*38)%(gap+2))/(gap+2));
    cn.scale.set(Math.min(1,(gap+5)/80),1,1);
    v.target.set(0,1.5,-Math.min(gap,60)*0.25-3);gl.position.set(0,3.4,-gap-4.4);el.position.set(0,3.3,0);
    hud.v.textContent=(vv*3.6).toFixed(0)+' km/h';hud.vl.textContent=(vl*3.6).toFixed(0)+' km/h';hud.g.textContent=gap.toFixed(0)+' m';hud.m.textContent=mode;
    hist.push({v:vv,l:vl});if(hist.length>420)hist.shift();drawHist();};
  return v;});
