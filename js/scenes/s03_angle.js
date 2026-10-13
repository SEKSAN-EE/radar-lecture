Scenes.register('angle',function(root){
  const T=THREE,canvas=root.querySelector('canvas.gl');
  const v=makeView(canvas,{th:0.18,ph:1.05,dist:21,target:new T.Vector3(0,0,3.5),minD:9,maxD:50,bg:0xeaf1f8});
  const S=v.scene;addLights(S);groundPlane(S,200,0xdfe8f0,-0.9);
  const LAM=2,D=1;                         // wavelength 2 units, spacing lambda/2 = 1 unit
  let N=4,th=25,waves=true,tm=0;
  const antG=new T.Group();S.add(antG);
  const base=new T.Mesh(new T.BoxGeometry(9,.25,.9),mat(0x3e4a5c));base.position.set(0,-.55,-.3);S.add(base);
  const dirLine=line3([new T.Vector3(),new T.Vector3()],0xed7d31);S.add(dirLine);
  const src=new T.Mesh(new T.SphereGeometry(.55,20,14),mat(C3.red,{emissive:0x551100}));S.add(src);const srcL=lbl('target','#14213D',1.1);S.add(srcL);
  const planes=[];const pm=new T.MeshBasicMaterial({color:0xed7d31,transparent:true,opacity:.34,side:T.DoubleSide,depthWrite:false});
  for(let i=0;i<9;i++){const p=new T.Mesh(new T.PlaneGeometry(14,3),pm.clone());S.add(p);planes.push(p);}
  const dl=[];const ref=new T.Mesh(new T.PlaneGeometry(14,3),new T.MeshBasicMaterial({color:0x14213d,transparent:true,opacity:.07,side:T.DoubleSide,depthWrite:false}));S.add(ref);
  const dd=new T.Group();S.add(dd);const ddL=lbl('Δd = l·sinθ','#3A9D5D',1.0);S.add(ddL);
  const axisL=lbl('broadside','#6B7585',.9);axisL.position.set(0,.2,5.6);S.add(axisL);
  const bs=line3([new T.Vector3(0,-.4,0),new T.Vector3(0,-.4,6)],0x9aa4b2,.8);S.add(bs);
  function buildArray(){while(antG.children.length)antG.remove(antG.children[0]);dd.children.slice().forEach(c=>dd.remove(c));
    for(let k=0;k<N;k++){const x=(k-(N-1)/2)*D;const a=new T.Mesh(new T.ConeGeometry(.32,.8,4),mat(C3.blue));a.rotation.x=Math.PI/2;a.rotation.z=Math.PI/4;a.position.set(x,0,0);antG.add(a);}}
  const cv=root.querySelector('canvas.phasor'),cg=cv.getContext('2d'),sp=root.querySelector('canvas.spec'),sg=sp.getContext('2d');
  const hud={th:root.querySelector('#a-th'),dd:root.querySelector('#a-dd'),ph:root.querySelector('#a-ph'),est:root.querySelector('#a-est')};
  bindRange(root,'#a-theta',x=>{th=x;},x=>x+'°');
  bindRange(root,'#a-n',x=>{N=x;buildArray();},x=>x);
  bindBtns(root,'[data-w]',x=>{waves=x==='on';});
  function drawPhasors(dphi,tt){const w=cv.width,h=cv.height;cg.clearRect(0,0,w,h);const r=Math.min(h/2-6,w/N/2-6);
    for(let k=0;k<N;k++){const cx=(k+.5)*w/N,cy=h/2;cg.strokeStyle='#D0D5DD';cg.lineWidth=2;cg.beginPath();cg.arc(cx,cy,r,0,7);cg.stroke();
      const a=-(tt*3.0+k*dphi);cg.strokeStyle=['#2F6DB5','#ED7D31','#3A9D5D','#C0392B','#8E5BB5','#14213D','#0f9fb5','#b58a0f'][k%8];cg.lineWidth=4;cg.beginPath();cg.moveTo(cx,cy);cg.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));cg.stroke();
      cg.fillStyle='#14213D';cg.font='bold 12px Helvetica,Arial';cg.textAlign='center';cg.fillText('RX'+(k+1),cx,h-2);}}
  function drawSpec(){const w=sp.width,h=sp.height;sg.clearRect(0,0,w,h);sg.fillStyle='#fff';sg.fillRect(0,0,w,h);
    const th0=th*Math.PI/180,pts=[];let best=-1,bi=0;
    for(let i=0;i<=360;i++){const a=(-90+i*0.5)*Math.PI/180;let re=0,im=0;for(let k=0;k<N;k++){const ph=Math.PI*k*(Math.sin(a)-Math.sin(th0));re+=Math.cos(ph);im+=Math.sin(ph);}const p=Math.sqrt(re*re+im*im)/N;pts.push(p);if(p>best){best=p;bi=i;}}
    sg.strokeStyle='#D0D5DD';sg.lineWidth=1;sg.beginPath();sg.moveTo(8,h-18);sg.lineTo(w-8,h-18);sg.stroke();
    sg.strokeStyle='#ED7D31';sg.lineWidth=3;sg.beginPath();pts.forEach((p,i)=>{const x=8+(w-16)*i/360,y=h-18-(h-34)*p;i?sg.lineTo(x,y):sg.moveTo(x,y);});sg.stroke();
    sg.fillStyle='#6B7585';sg.font='11px Helvetica,Arial';sg.textAlign='center';[-90,-45,0,45,90].forEach(a=>sg.fillText(a+'°',8+(w-16)*(a+90)/180,h-4));
    return -90+bi*0.5;}
  buildArray();
  v.tick=function(dt){tm+=dt;const t=th*Math.PI/180,dir=new T.Vector3(Math.sin(t),0,Math.cos(t));
    const sp0=dir.clone().multiplyScalar(11);src.position.copy(sp0);srcL.position.copy(sp0).add(new T.Vector3(0,1.6,0));
    const pos=dirLine.geometry.attributes.position;pos.setXYZ(0,0,0,0);pos.setXYZ(1,sp0.x,0,sp0.z);pos.needsUpdate=true;
    planes.forEach((p,i)=>{p.visible=waves;const s=((i*LAM)-(tm*2.4)%LAM)+0.0;const dist=Math.max(.2,s+LAM);const sd=((i+1)*LAM-(tm*2.4)%LAM);p.position.copy(dir.clone().multiplyScalar(sd));p.lookAt(p.position.clone().add(dir));p.material.opacity=sd>10?0:.4*(1-sd/11);});
    // reference plane through antenna 0 (leftmost), and path-difference segments
    const p0=new T.Vector3(-(N-1)/2*D,0,0);ref.position.copy(p0);ref.lookAt(p0.clone().add(dir));
    dd.children.slice().forEach(c=>dd.remove(c));
    for(let k=1;k<N;k++){const pk=new T.Vector3((k-(N-1)/2)*D,0,0);const e=pk.clone().sub(p0).dot(dir);const q=pk.clone().sub(dir.clone().multiplyScalar(e));
      const l=line3([pk,q],0x3a9d5d);l.material.linewidth=3;dd.add(l);const m=new T.Mesh(new T.SphereGeometry(.12,8,6),mat(C3.green));m.position.copy(q);dd.add(m);}
    const e1=D*Math.sin(t);ddL.position.set(p0.x+D*0.5+e1*dir.x*0.5,1.3,p0.z+e1*dir.z*0.5-0.6);ddL.visible=N>1&&Math.abs(th)>2;
    const dphi=Math.PI*Math.sin(t);drawPhasors(dphi,tm);const est=drawSpec();
    hud.th.textContent=th+'°';hud.dd.textContent=(Math.sin(t)*0.5).toFixed(2)+' λ';hud.ph.textContent=(180*Math.sin(t)).toFixed(0)+'°';hud.est.textContent=est.toFixed(1)+'°';};
  return v;});
