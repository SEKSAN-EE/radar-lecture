Scenes.register('sar',function(root){
  const T=THREE,canvas=root.querySelector('canvas.gl');
  const v=makeView(canvas,{th:0.62,ph:0.42,dist:150,target:new T.Vector3(0,16,-8),minD:70,maxD:260,bg:0xdfeaf5});
  const S=v.scene;addLights(S);const gr=groundPlane(S,400,0xb9c8a0);
  const grid=new T.GridHelper(200,40,0x9fb08a,0xa9ba94);grid.position.y=.03;S.add(grid);
  for(let i=0;i<14;i++){const b=new T.Mesh(new T.BoxGeometry(2+i%3,1.5+(i*7)%4,2+i%2),mat(0x9aa6b4));const a=i*2.3,r=8+(i*13)%34;b.position.set((r*Math.cos(a))*1.3,0.8,r*Math.sin(a)*0.8);S.add(b);}
  const tg=new T.Mesh(new T.SphereGeometry(1.2,20,14),mat(C3.red,{emissive:0x660000}));tg.position.set(0,1.2,0);S.add(tg);const tl=lbl('target','#C0392B',2.4);tl.position.set(0,5,0);S.add(tl);
  const H=42,ZS=-46;                              // satellite height / offset (side-looking toward +z)
  const sat=new T.Group();const bd=new T.Mesh(new T.BoxGeometry(3,2,3),mat(0xc9a227,{metalness:.5,roughness:.3}));sat.add(bd);
  const pan=new T.Mesh(new T.BoxGeometry(9,.15,3),mat(0x1d3f73,{metalness:.5}));sat.add(pan);const ant=new T.Mesh(new T.BoxGeometry(4,.3,1.2),mat(0xeef2f6));ant.position.set(0,-1.3,.8);sat.add(ant);S.add(sat);
  const path=line3([new T.Vector3(-70,H,ZS),new T.Vector3(70,H,ZS)],0x6b7585,.7);S.add(path);
  const foot=new T.Mesh(new T.CircleGeometry(1,48),new T.MeshBasicMaterial({color:0xed7d31,transparent:true,opacity:.32,side:T.DoubleSide,depthWrite:false}));foot.rotation.x=-Math.PI/2;foot.position.y=.06;S.add(foot);
  const bgeo=new T.BufferGeometry();bgeo.setAttribute('position',new T.BufferAttribute(new Float32Array(36),3));
  const beam=new T.Mesh(bgeo,new T.MeshBasicMaterial({color:0xed7d31,transparent:true,opacity:.1,side:T.DoubleSide,depthWrite:false}));S.add(beam);
  const ghosts=new T.Group();S.add(ghosts);const rays=new T.Group();S.add(rays);
  const apBar=new T.Mesh(new T.BoxGeometry(1,.5,.5),mat(C3.org));apBar.position.set(0,H+2.6,ZS);S.add(apBar);const apL=lbl('synthetic aperture L','#ED7D31',2.6);S.add(apL);
  let D=6,x=-60,play=true,seen=[];const hud={L:root.querySelector('#s-L'),r:root.querySelector('#s-r'),d:root.querySelector('#s-d')};
  const rc=root.querySelector('canvas.resp'),rg=rc.getContext('2d');
  const Wa=()=>60/D*1.0;                       // visual along-track footprint width
  bindRange(root,'#s-D',val=>{D=val;seen=[];ghosts.clear();rays.clear();},x=>x+' m');
  bindBtns(root,'[data-pl]',x=>{play=x==='1';if(x==='r'){x2=-60;seen=[];ghosts.clear();rays.clear();}});
  let x2=-60;
  function drawResp(){const w=rc.width,h=rc.height;rg.clearRect(0,0,w,h);rg.fillStyle='#fff';rg.fillRect(0,0,w,h);rg.strokeStyle='#D0D5DD';rg.beginPath();rg.moveTo(8,h-16);rg.lineTo(w-8,h-16);rg.stroke();
    const gauss=(s,col,lw,dash)=>{rg.strokeStyle=col;rg.lineWidth=lw;rg.setLineDash(dash||[]);rg.beginPath();for(let i=0;i<=200;i++){const u=(i/200-0.5)*2;const y=Math.exp(-0.5*(u/s)*(u/s));const px=8+(w-16)*i/200,py=h-16-(h-30)*y;i?rg.lineTo(px,py):rg.moveTo(px,py);}rg.stroke();rg.setLineDash([]);};
    const real=Math.min(0.9,(60/D)/30*0.9),syn=Math.max(0.03,(D/2)/6*0.075);
    gauss(real/1.8,'#8a939c',2.5,[6,4]);gauss(syn/1.8,'#ED7D31',3.5);
    rg.fillStyle='#8a939c';rg.font='bold 11px Helvetica,Arial';rg.fillText('real antenna beam',10,12);rg.fillStyle='#ED7D31';rg.fillText('after SAR processing',w-135,12);}
  v.tick=function(dt){if(play){x2+=dt*14;if(x2>65){x2=-60;seen=[];ghosts.clear();rays.clear();}}
    sat.position.set(x2,H,ZS);const wa=Wa();
    foot.scale.set(wa/2,9.5,1);foot.position.set(x2,0.06,2);
    {const P=bgeo.attributes.position,ap=[x2,H,ZS],c=[[x2-wa/2,0,2-4.75],[x2+wa/2,0,2-4.75],[x2+wa/2,0,2+4.75],[x2-wa/2,0,2+4.75]];let k=0;
      for(let i=0;i<4;i++){const p=c[i],q=c[(i+1)%4];[ap,p,q].forEach(u=>{P.setXYZ(k++,u[0],u[1],u[2]);});}P.needsUpdate=true;}
    const inAp=Math.abs(x2)<wa/2;
    if(inAp){const k=Math.round(x2*0.9);if(!seen.includes(k)){seen.push(k);const gsp=new T.Mesh(new T.SphereGeometry(.7,10,8),mat(C3.org,{transparent:true,opacity:.7}));gsp.position.set(x2,H,ZS);ghosts.add(gsp);
        const l=line3([new T.Vector3(x2,H,ZS),new T.Vector3(0,1.2,0)],0xed7d31,.45);rays.add(l);}}
    tg.material.emissive.setRGB(inAp?0.5+0.3*Math.sin(performance.now()/120):0.25,0,0);
    apBar.scale.set(Math.min(wa,130),1,1);apBar.position.set(0,H+2.6,ZS);apL.position.set(0,H+7,ZS);
    hud.L.textContent=(38.5/D).toFixed(1)+' km';hud.r.textContent=(D/2).toFixed(1)+' m';hud.d.textContent=D+' m';drawResp();};
  return v;});
