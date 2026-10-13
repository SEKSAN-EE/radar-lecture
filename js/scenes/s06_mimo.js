Scenes.register('mimo',function(root){
  const T=THREE,canvas=root.querySelector('canvas.gl');
  const v=makeView(canvas,{th:0.35,ph:0.28,dist:34,target:new T.Vector3(0,2.2,0),minD:14,maxD:90,bg:0xf3f6fa});
  const S=v.scene;addLights(S);
  let nTx=2,mode='tdm',tm=0;const NRX=4,D=1.6;
  const grp=new T.Group();S.add(grp);
  const hud={v:root.querySelector('#m-v'),ap:root.querySelector('#m-ap'),res:root.querySelector('#m-res'),act:root.querySelector('#m-act')};
  let txMesh=[],rxMesh=[],virt=[],links=[],waves=[];
  const cTx=C3.org,cRx=C3.blue,cV=[0x8e5bb5,0xc79be0,0x5b8e5b,0xd4a017];
  function build(){while(grp.children.length)grp.remove(grp.children[0]);txMesh=[];rxMesh=[];virt=[];links=[];
    const span=NRX*D;                                         // TX spacing = NRX * D  -> no gaps in the virtual array
    const y0=6,y1=-5.5;
    const title1=lbl('Physical array','#14213D',1.4);title1.position.set(-14,y0+2.6,0);grp.add(title1);
    const title2=lbl('Virtual array = TX ⊕ RX','#14213D',1.4);title2.position.set(-12.2,y1+3.2,0);grp.add(title2);
    for(let i=0;i<nTx;i++){const x=(i-(nTx-1)/2)*span*1.0-0;const m=new T.Mesh(new T.BoxGeometry(1,1,1),mat(cTx,{emissive:0x331100}));m.position.set(x+ (nTx>1?0:0),y0+1.1,0);grp.add(m);txMesh.push(m);const l=lbl('TX'+(i+1),'#ED7D31',1.1);l.position.set(x,y0+2.6,0);grp.add(l);}
    for(let j=0;j<NRX;j++){const x=(j-(NRX-1)/2)*D;const off=-((nTx-1)/2)*span;const m=new T.Mesh(new T.SphereGeometry(.55,18,12),mat(cRx));m.position.set(x+off,y0-1.1,0);grp.add(m);rxMesh.push(m);}
    const rl=lbl('4 RX','#2F6DB5',1.1);rl.position.set(-((nTx-1)/2)*span,y0-2.6,0);grp.add(rl);
    for(let i=0;i<nTx;i++)for(let j=0;j<NRX;j++){const xt=(i-(nTx-1)/2)*span,xr=(j-(NRX-1)/2)*D-((nTx-1)/2)*span*0;const x=xt+xr; // virtual position = tx + rx
      const m=new T.Mesh(new T.SphereGeometry(.6,18,12),mat(cV[i%4],{transparent:true,opacity:.18}));m.position.set(x,y1,0);grp.add(m);virt.push({m,i,j,x});
      const ln=line3([new T.Vector3(xt,y0+1.1,0),new T.Vector3(x,y1+.6,0)],cV[i%4],.0);grp.add(ln);links.push(ln);}
    hud.v.textContent=nTx*NRX;hud.ap.textContent=(nTx*NRX*D/ D/2).toFixed(1)+' λ';hud.res.textContent=(2/(nTx*NRX)*180/Math.PI).toFixed(1)+'°';}
  bindBtns(root,'[data-tx]',x=>{nTx=parseInt(x);build();});
  bindBtns(root,'[data-mode]',x=>{mode=x;});
  build();
  const ring=new T.RingGeometry(0.7,0.85,40);
  v.tick=function(dt){tm+=dt;const per=1.6;const slot=Math.floor(tm/per)%nTx;const ph=(tm%per)/per;const active=mode==='all'?-1:slot;
    txMesh.forEach((m,i)=>{const on=active===-1||active===i;m.material.emissive.setRGB(on?0.6:0.05,on?0.25:0.02,0);m.scale.setScalar(on?1.0+0.12*Math.sin(tm*10):0.85);});
    virt.forEach(o=>{const on=active===-1||active===o.i;const target=on?(0.35+0.6*(0.5+0.5*Math.sin(tm*6-o.j))):0.14;o.m.material.opacity+=(target-o.m.material.opacity)*Math.min(1,dt*10);if(mode==='accum'){}});
    links.forEach((l,k)=>{const o=virt[k];const on=active===-1||active===o.i;l.material.transparent=true;l.material.opacity=on?0.35:0.04;});
    hud.act.textContent=active===-1?'all TX':'TX'+(active+1);};
  return v;});
