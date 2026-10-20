Scenes.register('sar',function(root){
  const T=THREE,canvas=root.querySelector('canvas.gl');
  const OV={dist:105,target:new T.Vector3(0,17,-6)},CU={dist:50,target:new T.Vector3(0,6,3)};
  const v=makeView(canvas,{th:0.62,ph:0.42,dist:OV.dist,target:OV.target.clone(),minD:30,maxD:260,bg:0xdfeaf5});
  const S=v.scene;addLights(S);groundPlane(S,400,0xb9c8a0);
  const grid=new T.GridHelper(200,40,0x9fb08a,0xa9ba94);grid.position.y=.03;S.add(grid);
  for(let i=0;i<14;i++){const b=new T.Mesh(new T.BoxGeometry(2+i%3,1.5+(i*7)%4,2+i%2),mat(0x9aa6b4));const a=i*2.3,r=8+(i*13)%34;b.position.set((r*Math.cos(a))*1.3,0.8,r*Math.sin(a)*0.8);if(Math.abs(b.position.x)<9&&Math.abs(b.position.z)<8)b.position.x+=22;S.add(b);}
  // two close targets (not to scale)
  const TX=[-1.0,1.0],tgs=TX.map(x=>{const m=new T.Mesh(new T.SphereGeometry(1.0,20,14),mat(C3.red,{emissive:0x660000}));m.position.set(x,1.0,0);S.add(m);return m;});
  const tl=lbl('2 targets, close together','#C0392B',2.2);tl.position.set(0,5.4,0);S.add(tl);
  const H=42,ZS=-46;
  const sat=new T.Group();sat.add(new T.Mesh(new T.BoxGeometry(3,2,3),mat(0xc9a227,{metalness:.5,roughness:.3})));
  sat.add(new T.Mesh(new T.BoxGeometry(9,.15,3),mat(0x1d3f73,{metalness:.5})));const ant=new T.Mesh(new T.BoxGeometry(4,.3,1.2),mat(0xeef2f6));ant.position.set(0,-1.3,.8);sat.add(ant);S.add(sat);
  S.add(line3([new T.Vector3(-70,H,ZS),new T.Vector3(70,H,ZS)],0x6b7585,.7));
  const foot=new T.Mesh(new T.CircleGeometry(1,48),new T.MeshBasicMaterial({color:0xed7d31,transparent:true,opacity:.30,side:T.DoubleSide,depthWrite:false}));foot.rotation.x=-Math.PI/2;foot.position.y=.06;S.add(foot);
  const bgeo=new T.BufferGeometry();bgeo.setAttribute('position',new T.BufferAttribute(new Float32Array(36),3));
  S.add(new T.Mesh(bgeo,new T.MeshBasicMaterial({color:0xed7d31,transparent:true,opacity:.09,side:T.DoubleSide,depthWrite:false})));
  const ghosts=new T.Group(),rays=new T.Group();S.add(ghosts,rays);
  const apBar=new T.Mesh(new T.BoxGeometry(1,.5,.5),mat(C3.org));S.add(apBar);const apL=lbl('synthetic aperture L','#ED7D31',2.6);S.add(apL);
  // image ribbons drawn along the track in front of the targets
  const NR=240,XR=19,ZR=6,HS=11;
  function ribbon(color,op){const g=new T.BufferGeometry();const pos=new Float32Array(NR*2*3);g.setAttribute('position',new T.BufferAttribute(pos,3));
    const idx=[];for(let i=0;i<NR-1;i++){const a=2*i,b=2*i+1,c=2*i+2,d=2*i+3;idx.push(a,b,c,b,d,c);}g.setIndex(idx);
    const m=new T.Mesh(g,new T.MeshBasicMaterial({color,transparent:true,opacity:op,side:T.DoubleSide,depthWrite:false}));m.frustumCulled=false;S.add(m);return m;}
  const rawM=ribbon(0x8a939c,.5),sarM=ribbon(0xed7d31,.85);
  const base=line3([new T.Vector3(-XR,0.15,ZR),new T.Vector3(XR,0.15,ZR)],0x14213d);S.add(base);
  const il=lbl('image of the two targets (along the track)','#14213D',1.7);il.position.set(0,HS+2.6,ZR);S.add(il);
  const il1=lbl('single pulse: one blur','#6B7585',1.5);il1.position.set(-XR+6,HS*0.55,ZR);S.add(il1);
  let D=6,x2=-60,play=true,seen=[],mode='auto',p=0;
  const hud={L:root.querySelector('#s-L'),r:root.querySelector('#s-r'),d:root.querySelector('#s-d'),n:root.querySelector('#s-n')};
  const rc=root.querySelector('canvas.resp'),rg=rc.getContext('2d');
  const wa=()=>60/D;                                    // along-track footprint (stylised)
  const sigR=()=>wa()/2.355, sigS=()=>(0.35*D/6)/2.355;  // blur of one pulse / width after combining (stylised, not to scale)
  const sig=pp=>{const a=sigR(),b=sigS();return b+(a-b)*Math.pow(1-pp,2);};
  const prof=(u,s)=>{let y=0;for(const x of TX)y+=Math.exp(-0.5*((u-x)/s)*((u-x)/s));return y;};
  function reset(){x2=-60;seen=[];ghosts.clear();rays.clear();}
  bindRange(root,'#s-D',val=>{D=val;reset();},x=>x+' m');
  bindBtns(root,'[data-pl]',x=>{if(x==='r'){reset();}else play=x==='1';});
  bindBtns(root,'[data-md]',x=>{mode=x;});
  bindBtns(root,'[data-vw]',x=>{const t=x==='c'?CU:OV;v.dist=t.dist;v.target.copy(t.target);});
  function fillRibbon(m,s,amp,norm){const P=m.geometry.attributes.position;for(let i=0;i<NR;i++){const u=-XR+2*XR*i/(NR-1);const y=amp*HS*prof(u,s)/norm;P.setXYZ(2*i,u,0.15,ZR);P.setXYZ(2*i+1,u,0.15+y,ZR);}P.needsUpdate=true;m.geometry.computeBoundingSphere();}
  function drawInset(pp,n,tot,s){const w=rc.width,h=rc.height;rg.clearRect(0,0,w,h);rg.fillStyle='#fff';rg.fillRect(0,0,w,h);
    rg.strokeStyle='#D0D5DD';rg.beginPath();rg.moveTo(8,h-18);rg.lineTo(w-8,h-18);rg.stroke();
    const X=u=>8+(w-16)*(u+XR)/(2*XR),Y=y=>h-18-(h-34)*y;
    const draw=(sg,col,lw,dash,fill)=>{const nm=Math.max(1e-3,prof(0,sg)>1?2:1.2);rg.beginPath();rg.moveTo(X(-XR),Y(0));for(let i=0;i<=200;i++){const u=-XR+2*XR*i/200;rg.lineTo(X(u),Y(Math.min(1,prof(u,sg)/nm)));}rg.lineTo(X(XR),Y(0));
      if(fill){rg.fillStyle=fill;rg.fill();}rg.setLineDash(dash||[]);rg.strokeStyle=col;rg.lineWidth=lw;rg.stroke();rg.setLineDash([]);};
    const nmR=1.0;draw(sigR(),'#8a939c',2,[6,4],'#8a939c22');draw(s,'#ED7D31',3.2,null,'#ED7D3122');
    TX.forEach(x=>{rg.fillStyle='#C0392B';rg.beginPath();rg.arc(X(x),h-18,4,0,7);rg.fill();});
    rg.font='bold 11px Helvetica,Arial';rg.textAlign='left';rg.fillStyle='#8a939c';rg.fillText('single pulse',10,12);
    rg.fillStyle='#ED7D31';rg.fillText(pp<0.02?'echoes combined: 0':(pp>=0.999?'all '+tot+' echoes combined':'echoes combined: '+n+' / '+tot),w-150,12);}
  v.tick=function(dt){if(play){const inA=Math.abs(x2)<wa()/2+1;x2+=dt*(inA?7:16);if(x2>65)reset();}
    const w=wa();sat.position.set(x2,H,ZS);foot.scale.set(w/2,9.5,1);foot.position.set(x2,0.06,2);
    {const P=bgeo.attributes.position,ap=[x2,H,ZS],c=[[x2-w/2,0,-2.75],[x2+w/2,0,-2.75],[x2+w/2,0,6.75],[x2-w/2,0,6.75]];let k=0;for(let i=0;i<4;i++){const a=c[i],b=c[(i+1)%4];[ap,a,b].forEach(u=>{P.setXYZ(k++,u[0],u[1],u[2]);});}P.needsUpdate=true;}
    const half=w/2+1,inAp=Math.abs(x2)<half;
    if(inAp){const k=Math.round(x2*0.9);if(!seen.includes(k)){seen.push(k);const gsp=new T.Mesh(new T.SphereGeometry(.7,10,8),mat(C3.org,{transparent:true,opacity:.7}));gsp.position.set(x2,H,ZS);ghosts.add(gsp);
        TX.forEach(tx=>rays.add(line3([new T.Vector3(x2,H,ZS),new T.Vector3(tx,1,0)],0xed7d31,.4)));}}
    const tot=Math.max(1,Math.round(2*half*0.9));
    if(mode==='auto')p=Math.max(0,Math.min(1,(x2+half)/(2*half)));else p=mode==='after'?1:0;
    const s=sig(p),nm=prof(0,sigR())>1?2:1.2;
    fillRibbon(rawM,sigR(),1,nm);fillRibbon(sarM,s,1,Math.max(1.0001,prof(0,s)>1?prof(0,s):1)/1.0>1?Math.max(prof(0,s),1):1);
    tgs.forEach(t=>t.material.emissive.setRGB(inAp&&mode==='auto'?0.5+0.3*Math.sin(performance.now()/120):0.25,0,0));
    apBar.scale.set(Math.min(w,130),1,1);apBar.position.set(0,H+2.6,ZS);apL.position.set(0,H+7,ZS);
    hud.L.textContent=(38.5/D).toFixed(1)+' km';hud.r.textContent=(D/2).toFixed(1)+' m';hud.d.textContent=D+' m';hud.n.textContent=Math.round(p*tot)+' / '+tot;
    drawInset(p,Math.round(p*tot),tot,s);};
  return v;});
