Scenes.register('rotating',function(root){
  const T=THREE,canvas=root.querySelector('canvas.gl');
  const v=makeView(canvas,{th:0.7,ph:0.78,dist:62,target:new T.Vector3(0,0,0),minD:25,maxD:140,bg:0xeaf1f8});
  const S=v.scene;addLights(S);groundPlane(S,400,0xdfe8f0);
  const RMAX=40;
  for(let i=1;i<=4;i++){const r=new T.Mesh(new T.RingGeometry(RMAX*i/4-0.08,RMAX*i/4+0.08,96),new T.MeshBasicMaterial({color:0x9aa8b8,side:T.DoubleSide,transparent:true,opacity:.7}));r.rotation.x=-Math.PI/2;r.position.y=0.04;S.add(r);}
  for(let a=0;a<8;a++){const l=line3([new T.Vector3(0,0.05,0),new T.Vector3(RMAX*Math.cos(a*Math.PI/4),0.05,RMAX*Math.sin(a*Math.PI/4))],0x9aa8b8,.7);S.add(l);}
  const tw=radarTower(3.5,1.7);tw.scale.setScalar(1.5);S.add(tw);const pan=tw.userData.pan;
  // beam wedge (flat on ground) + volumetric cone
  let bw=8;const wedgeG=()=>new T.CircleGeometry(RMAX,24,-(bw*Math.PI/180)/2,bw*Math.PI/180);
  const wedge=new T.Mesh(wedgeG(),new T.MeshBasicMaterial({color:0xed7d31,transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false}));wedge.rotation.x=-Math.PI/2;wedge.position.y=0.08;S.add(wedge);
  const HD=(3.5+1.7*0.55)*1.5;const beamLine=line3([new T.Vector3(0,HD,0),new T.Vector3(RMAX,HD,0)],0xed7d31);S.add(beamLine);
  // targets
  const ts=[];for(let i=0;i<5;i++){const m=aircraft(i==1?C3.red:C3.navy,1.4);m.position.y=5;S.add(m);ts.push({m,r:10+i*6.5,a:i*1.3,w:(i%2?-1:1)*(0.05+0.015*i),vr:(i%3-1)*0.05,blip:0});}
  // clutter (static)
  const cl=[];for(let i=0;i<6;i++){const b=new T.Mesh(new T.BoxGeometry(2.5,3+i%3*2,2.5),mat(0x8896a6));const a=1+i*1.05,r=18+(i*7)%20;b.position.set(r*Math.cos(a),1.5+i%3,r*Math.sin(a));S.add(b);cl.push({m:b,a:((a%(2*Math.PI))+2*Math.PI)%(2*Math.PI),r,blip:0});}
  const blips=new T.Group();S.add(blips);const bl=[];
  // PPI canvas
  const pv=root.querySelector('canvas.ppi'),pg=pv.getContext('2d');
  let ang=0,rpm=12,det=0;const hud={az:root.querySelector('#o-az'),n:root.querySelector('#o-n'),rpm:root.querySelector('#o-rpm')};
  bindRange(root,'#o-rpms',x=>{rpm=x;},x=>x+' rpm');
  bindRange(root,'#o-bw',x=>{bw=x;wedge.geometry.dispose();wedge.geometry=wedgeG();},x=>x+'°');
  const spots=[];function addBlip(r,a,col){spots.push({r,a,t:0,col});if(spots.length>60)spots.shift();}
  function ppi(){const w=pv.width,h=pv.height,cx=w/2,cy=h/2,R=w/2-4;pg.fillStyle='#0b1a12';pg.fillRect(0,0,w,h);
    pg.strokeStyle='#1d5a38';pg.lineWidth=1;for(let i=1;i<=4;i++){pg.beginPath();pg.arc(cx,cy,R*i/4,0,7);pg.stroke();}pg.beginPath();pg.moveTo(cx-R,cy);pg.lineTo(cx+R,cy);pg.moveTo(cx,cy-R);pg.lineTo(cx,cy+R);pg.stroke();
    for(let k=0;k<40;k++){const a=ang-k*0.012;pg.beginPath();pg.moveTo(cx,cy);pg.arc(cx,cy,R,a-0.012,a);pg.closePath();pg.fillStyle=`rgba(60,255,120,${0.35*(1-k/40)})`;pg.fill();}
    spots.forEach(s=>{const al=Math.max(0,1-s.t/5);if(al<=0)return;pg.fillStyle=s.col==='c'?`rgba(150,170,190,${al})`:`rgba(255,255,255,${al})`;pg.beginPath();pg.arc(cx+R*(s.r/RMAX)*Math.cos(s.a),cy+R*(s.r/RMAX)*Math.sin(s.a),s.col==='c'?4:5,0,7);pg.fill();});}
  const nrm=a=>((a%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
  v.tick=function(dt){const da=rpm*2*Math.PI/60*dt;const a0=ang;ang=nrm(ang+da);
    pan.rotation.y=Math.PI/2-ang;wedge.rotation.z=ang;   // CircleGeometry in XY -> after rot.x it lies on XZ ; rotate about up axis
    const dir=new T.Vector3(Math.cos(ang),0,Math.sin(ang));const bp=beamLine.geometry.attributes.position;bp.setXYZ(1,dir.x*RMAX,HD,dir.z*RMAX);bp.needsUpdate=true;
    wedge.rotation.set(-Math.PI/2,0,0);wedge.rotateZ(-ang);
    const half=bw*Math.PI/360;det=0;
    ts.forEach(o=>{o.a=nrm(o.a+o.w*dt);o.r+=o.vr*dt;if(o.r>RMAX-3||o.r<6)o.vr*=-1;o.m.position.set(o.r*Math.cos(o.a),5,o.r*Math.sin(o.a));o.m.rotation.y=-(o.a+Math.PI/2+(o.w>0?0:Math.PI));
      const d=Math.abs(((o.a-ang+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI);if(d<half+0.03){addBlip(o.r,o.a,'t');o.blip=1;}o.blip=Math.max(0,o.blip-dt*1.5);
      o.m.children.forEach(c=>{c.material.emissive&&c.material.emissive.setRGB(o.blip*.9,o.blip*.4,0);});});
    cl.forEach(o=>{const d=Math.abs(((o.a-ang+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI);if(d<half+0.03&&Math.random()<.5)addBlip(o.r,o.a,'c');});
    spots.forEach(s=>s.t+=dt);ppi();
    hud.az.textContent=(ang*180/Math.PI).toFixed(0)+'°';hud.n.textContent=spots.filter(s=>s.col==='t'&&s.t<5).length;hud.rpm.textContent=rpm+' rpm';};
  return v;});
