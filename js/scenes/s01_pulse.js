Scenes.register('pulse',function(root){
  const T=THREE,canvas=root.querySelector('canvas.gl');
  const v=makeView(canvas,{th:0.95,ph:0.38,dist:80,target:new T.Vector3(22,8,0),minD:30,maxD:220,bg:0xeaf1f8});
  const S=v.scene;addLights(S);groundPlane(S,600,0xdfe8f0);
  const grid=new T.GridHelper(600,60,0xc4d0dc,0xd3dde7);grid.position.y=0.02;S.add(grid);
  const tw=radarTower(7,2.2);tw.scale.setScalar(2);S.add(tw);tw.userData.pan.rotation.y=Math.PI/2;       // dish faces +x
  const targ=aircraft(C3.navy,3);S.add(targ);const tl=lbl('target','#14213D',2.2);S.add(tl);
  const rl=lbl('radar','#14213D',2.2);rl.position.set(0,27,0);S.add(rl);
  // path line + range ruler
  const ruler=line3([new T.Vector3(0,0.3,0),new T.Vector3(1,0.3,0)],0x14213d);S.add(ruler);
  const mkPacket=(c)=>{const m=new T.Mesh(new T.CylinderGeometry(1.1,1.1,4,16),new T.MeshBasicMaterial({color:c,transparent:true,opacity:.9}));m.rotation.z=Math.PI/2;m.visible=false;S.add(m);
    const halo=new T.Mesh(new T.SphereGeometry(2.4,16,12),new T.MeshBasicMaterial({color:c,transparent:true,opacity:.18,depthWrite:false}));m.add(halo);return m;};
  const tx=mkPacket(C3.org),rx=mkPacket(C3.blue);
  const ringG=new T.RingGeometry(0.9,1,64);ringG.rotateX(-Math.PI/2);
  const rings=[];for(let i=0;i<3;i++){const r=new T.Mesh(ringG,new T.MeshBasicMaterial({color:C3.org,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));r.position.y=0.15;S.add(r);rings.push(r);}
  const beam=cone(80,0.06,C3.org,.1);beam.position.set(0,16.4,0);S.add(beam);
  // state
  let R=60,speedK=1,t=0,hitT=-9,echoT=-9;const VIS=26; // visual units / s
  const hud={R:root.querySelector('#p-R'),td:root.querySelector('#p-td'),rt:root.querySelector('#p-rt')};
  const osc=root.querySelector('canvas.osc'),og=osc.getContext('2d');
  const Rw=()=>R*0.5;
  bindRange(root,'#p-range',x=>{R=x;},x=>x+' km');
  bindBtns(root,'[data-sp]',x=>{speedK=parseFloat(x);});
  function drawOsc(rtv,cyc,tt){const w=osc.width,h=osc.height;og.clearRect(0,0,w,h);og.fillStyle='rgba(255,255,255,.88)';og.fillRect(0,0,w,h);
    og.strokeStyle='#D0D5DD';og.lineWidth=1;og.beginPath();og.moveTo(8,h-18);og.lineTo(w-8,h-18);og.stroke();
    const X=s=>8+(w-16)*s/cyc;
    og.fillStyle='#ED7D31';og.fillRect(X(0)-2,16,5,h-34);og.font='bold 13px Helvetica,Arial';og.fillText('TX',X(0)+7,28);
    if(tt>=rtv){og.fillStyle='#2F6DB5';og.fillRect(X(rtv)-2,34,5,h-52);og.fillText('echo',X(rtv)+7,46);
      og.strokeStyle='#14213D';og.beginPath();og.moveTo(X(0),h-10);og.lineTo(X(rtv),h-10);og.stroke();og.fillStyle='#14213D';og.fillText('t_d',X(rtv/2)-6,h-1);}
    og.strokeStyle='#C0392B';og.lineWidth=2;og.beginPath();og.moveTo(X(tt),6);og.lineTo(X(tt),h-18);og.stroke();}
  v.tick=function(dt){
    t+=dt*speedK;const rw=Rw(),rt=2*rw/VIS,cyc=Math.max(rt+1.4,3.2);const tt=t%cyc;
    // camera target eases toward mid-range
    v.target.x+=((rw/2)-v.target.x)*Math.min(1,dt*3);if(!v.drag)v.dist+=((Math.max(60,rw*2.0))-v.dist)*Math.min(1,dt*2);
    targ.position.set(rw,16.4+Math.sin(t*1.3)*0.5,0);targ.rotation.y=Math.PI;tl.position.set(rw,21.5,0);
    const pos=ruler.geometry.attributes.position;pos.setXYZ(1,rw,0.3,0);pos.needsUpdate=true;
    tx.visible=tt<rw/VIS;rx.visible=tt>=rw/VIS&&tt<rt;
    if(tx.visible){tx.position.set(VIS*tt,16.4,0);}
    if(rx.visible){rx.position.set(rw-VIS*(tt-rw/VIS),16.4,0);}
    rings.forEach((r,i)=>{const a=tt-i*0.35;if(a>0&&a<2.2){const s=1+a*VIS*0.8;r.scale.set(s,1,s);r.material.opacity=0.35*(1-a/2.2);}else r.material.opacity=0;});
    const flash=tt>=rw/VIS&&tt<rw/VIS+0.5?1-(tt-rw/VIS)/0.5:0;
    targ.children.forEach(c=>{if(c.material&&c.material.emissive)c.material.emissive.setRGB(flash*.9,flash*.35,0);});
    tw.userData.pan.children[0].rotation.z+=0;
    hud.R.textContent=R+' km';hud.td.textContent=(2*R*1000/3e8*1e6).toFixed(0)+' µs';hud.rt.textContent=(tt<rt?'waiting…':'echo received');
    drawOsc(rt,cyc,tt);
  };
  v.enter=()=>{t=0;};
  return v;});
