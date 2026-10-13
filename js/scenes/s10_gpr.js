Scenes.register('gpr',function(root){
  const T=THREE,canvas=root.querySelector('canvas.gl');
  const v=makeView(canvas,{th:0.55,ph:0.32,dist:62,target:new T.Vector3(0,-4,0),minD:25,maxD:130,bg:0xf0f5fa});
  const S=v.scene;addLights(S);
  const BW=44,BD=12,BZ=10;
  // soil block (transparent layers)
  const layers=[[0,3,0xd9c7a3],[3,7,0xc7ae83],[7,12,0xb09469]];layers.forEach(([a,b,c])=>{const m=new T.Mesh(new T.BoxGeometry(BW,b-a,BZ),new T.MeshStandardMaterial({color:c,transparent:true,opacity:.42,roughness:1}));m.position.set(0,-(a+b)/2,0);S.add(m);});
  const edge=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(BW,BD,BZ)),new T.LineBasicMaterial({color:0x6b5a3c}));edge.position.y=-BD/2;S.add(edge);
  const topM=new T.Mesh(new T.PlaneGeometry(BW,BZ),mat(0x9fb585,{roughness:1}));topM.rotation.x=-Math.PI/2;topM.position.y=0.02;S.add(topM);
  groundPlane(S,300,0xe3ebf2,-BD-0.1);
  // buried objects: [x, depth, type]
  const objs=[{x:-12,d:3.0,n:'metal pipe',amp:1.0,mk:()=>{const m=new T.Mesh(new T.CylinderGeometry(.9,.9,BZ-.6,20),mat(0x9aa4b2,{metalness:.7,roughness:.3}));m.rotation.x=Math.PI/2;return m;}},
              {x:2,d:6.2,n:'plastic pipe',amp:.55,mk:()=>{const m=new T.Mesh(new T.CylinderGeometry(1.1,1.1,BZ-.6,20),mat(0x3a6ea5));m.rotation.x=Math.PI/2;return m;}},
              {x:15,d:4.2,n:'rock',amp:.8,mk:()=>new T.Mesh(new T.SphereGeometry(1.6,18,12),mat(0x777b80,{roughness:.9}))}];
  objs.forEach(o=>{o.m=o.mk();o.m.position.set(o.x,-o.d,0);S.add(o.m);const l=lbl(o.n,'#14213D',1.4);l.position.set(o.x,-o.d-2.8,BZ/2+.5);S.add(l);});
  // radargram on the front face
  const RW=512,RH=200;const rc=document.createElement('canvas');rc.width=RW;rc.height=RH;const rg=rc.getContext('2d');rg.fillStyle='#808080';rg.fillRect(0,0,RW,RH);
  const rtex=new T.CanvasTexture(rc);rtex.colorSpace=T.SRGBColorSpace;const rp=new T.Mesh(new T.PlaneGeometry(BW,BD),new T.MeshBasicMaterial({map:rtex}));rp.position.set(0,-BD/2,BZ/2+.05);S.add(rp);
  const rl=lbl('Radargram (time vs. position)','#14213D',1.5);rl.position.set(0,-BD-2,BZ/2+.1);S.add(rl);
  // cart
  const cart=new T.Group();const body=new T.Mesh(new T.BoxGeometry(5,1.6,3.6),mat(C3.org));body.position.y=1.7;cart.add(body);for(const[x,z]of[[1,1],[-1,1],[1,-1],[-1,-1]]){const w=new T.Mesh(new T.CylinderGeometry(.6,.6,.5,14),mat(0x222));w.rotation.x=Math.PI/2;w.position.set(x*1.8,.6,z*1.8);cart.add(w);}S.add(cart);
  const cn=new T.Mesh(new T.ConeGeometry(4.2,BD,24,1,true),new T.MeshBasicMaterial({color:0xed7d31,transparent:true,opacity:.14,side:T.DoubleSide,depthWrite:false}));cn.position.y=-BD/2;S.add(cn);
  let eps=4,loss=0.05,xc=-20,spd=1,play=true;const C=0.3;const TW=32;       // time window ns ; units: 1 unit = 0.1 m
  const hud={e:root.querySelector('#g-e'),v:root.querySelector('#g-v'),t:root.querySelector('#g-t'),d:root.querySelector('#g-d')};
  const vel=()=>C/Math.sqrt(eps);   // m/ns
  function ricker(t,f){const a=Math.PI*f*t;return (1-2*a*a)*Math.exp(-a*a);}
  const trace=new Float32Array(RH);
  function colTrace(x){trace.fill(0);const vv=vel();for(const o of objs){const dx=(x-o.x)*0.1,dm=o.d*0.1;const t0=2*Math.sqrt(dm*dm+dx*dx)/vv;const a=o.amp*Math.exp(-loss*t0)/(1+Math.abs(dx)*2.2)*(0.6+0.4*Math.exp(-dx*dx*3));
      for(let r=0;r<RH;r++){const t=r/RH*TW;trace[r]+=a*ricker(t-t0,0.35)*1.0;}}
    // direct wave
    for(let r=0;r<10;r++){const t=r/RH*TW;trace[r]+=0.7*ricker(t-0.8,0.3);}
  }
  function drawCol(px){colTrace(-BW/2+px/RW*BW);const im=rg.createImageData(1,RH);for(let r=0;r<RH;r++){const a=Math.max(-1,Math.min(1,trace[r]*1.2));const g=Math.round(128+127*a);im.data[r*4]=g;im.data[r*4+1]=g;im.data[r*4+2]=g;im.data[r*4+3]=255;}rg.putImageData(im,px,0);}
  let lastPx=-1;function reset(){rg.fillStyle='#808080';rg.fillRect(0,0,RW,RH);lastPx=-1;xc=-BW/2+2;rtex.needsUpdate=true;}
  bindBtns(root,'[data-soil]',x=>{if(x==='dry'){eps=4;loss=0.05;}else if(x==='wet'){eps=25;loss=0.16;}else{eps=9;loss=0.1;}reset();});
  bindRange(root,'#g-spd',x=>{spd=x;},x=>x+'×');bindBtns(root,'[data-gp]',x=>{if(x==='reset')reset();else play=x==='1';});
  reset();
  v.tick=function(dt){if(play){xc+=dt*5*spd;if(xc>BW/2-2)reset();}
    cart.position.set(xc,0,0);cn.position.x=xc;
    const px=Math.floor((xc+BW/2)/BW*RW);if(px!==lastPx){for(let p=Math.max(0,lastPx+1);p<=px;p++)drawCol(p);lastPx=px;rtex.needsUpdate=true;}
    // highlight object under the cart
    objs.forEach(o=>{const near=Math.abs(xc-o.x)<3.2;o.m.material.emissive&&o.m.material.emissive.setRGB(near?0.6:0,near?0.25:0,0);});
    const vv=vel();hud.e.textContent=eps;hud.v.textContent=vv.toFixed(3)+' m/ns';const t0=2*(objs[0].d*0.1)/vv;hud.t.textContent=t0.toFixed(1)+' ns';hud.d.textContent=(vv*t0/2).toFixed(2)+' m';};
  return v;});
