Scenes.register('nlos',function(root){
  const T=THREE,canvas=root.querySelector('canvas.gl');
  const v=makeView(canvas,{th:0.0001,ph:1.12,dist:31,target:new T.Vector3(-5.3,0,6.2),minD:14,maxD:90,bg:0xf3f6fa,maxPh:1.5});
  const S=v.scene;addLights(S,1.0);
  groundPlane(S,200,0xe4eaf1,-0.06);
  // ---------- L-shaped corridor ----------
  const wallMat=()=>new T.MeshStandardMaterial({color:0xb4bdc8,roughness:.9,transparent:true,opacity:.42,depthWrite:false});
  const box=(x0,x1,z0,z1,h,mt,y0)=>{const m=new T.Mesh(new T.BoxGeometry(x1-x0,h,z1-z0),mt);m.position.set((x0+x1)/2,(y0||0)+h/2,(z0+z1)/2);S.add(m);
    const e=new T.LineSegments(new T.EdgesGeometry(m.geometry),new T.LineBasicMaterial({color:0x6b7585}));e.position.copy(m.position);S.add(e);return m;};
  const H=2.8;
  box(-14.2,2.6,-1.4,-1.2,H,wallMat());box(-14.2,0.0,1.2,1.4,H,wallMat());box(-0.2,0.0,1.2,14.2,H,wallMat());
  box(2.4,2.6,-1.4,14.2,H,wallMat());box(-0.2,2.6,14.0,14.2,H,wallMat());box(-14.4,-14.2,-1.4,1.4,H,wallMat());
  const floorMat=new T.MeshStandardMaterial({color:0xeceff3,roughness:1});
  const fA=new T.Mesh(new T.BoxGeometry(16.6,.05,2.4),floorMat);fA.position.set(-5.9,-0.03,0);S.add(fA);
  const fB=new T.Mesh(new T.BoxGeometry(2.4,.05,12.8),floorMat);fB.position.set(1.2,-0.03,7.6);S.add(fB);
  // ---------- radar ----------
  const Y=1.3,R=new T.Vector3(-13.2,Y,0),C=new T.Vector3(2.0,Y,0);
  const radar=new T.Group();radar.position.copy(R);S.add(radar);
  radar.add(new T.Mesh(new T.BoxGeometry(.5,.38,.34),mat(0x14213d)));
  const rf=new T.Mesh(new T.BoxGeometry(.04,.3,.28),mat(C3.org));rf.position.x=.27;radar.add(rf);
  const lr=lbl('radar','#14213D',0.95);lr.position.set(R.x+1.2,2.4,-2.3);S.add(lr);
  const cgeo=(()=>{const g=new T.ConeGeometry(1,1,28,1,true);g.translate(0,-0.5,0);g.rotateZ(Math.PI/2);return g;})();   // apex at origin, opens toward +x, half-angle 45 deg at unit length
  const mkCone=(col,op)=>{const m=new T.Mesh(cgeo,new T.MeshBasicMaterial({color:col,transparent:true,opacity:op,side:T.DoubleSide,depthWrite:false}));m.frustumCulled=false;S.add(m);return m;};
  const beam1=mkCone(0xed7d31,.12);const L1=C.distanceTo(R);beam1.position.copy(R);beam1.scale.set(L1,L1*Math.tan(0.09),L1*Math.tan(0.09));
  const beam2=mkCone(0xed7d31,.2);
  // ---------- RIS (programmable surface, tilted towards the second arm) ----------
  const RW=1.8,RH=1.4,ALPHA=20*Math.PI/180;
  const ris=new T.Group();ris.position.copy(C);ris.rotation.y=Math.atan2(-Math.cos(ALPHA),Math.sin(ALPHA));S.add(ris);
  const nrm=new T.Vector3(-Math.cos(ALPHA),0,Math.sin(ALPHA)),tan=new T.Vector3(Math.sin(ALPHA),0,Math.cos(ALPHA));
  const back=new T.Mesh(new T.BoxGeometry(RW+.1,RH+.1,.08),mat(0x3e4a5c));back.position.z=-.06;ris.add(back);
  let tiles=null,NT=16,NY=12;
  const tmpO=new T.Object3D(),tmpC=new T.Color();
  function buildTiles(){if(tiles){ris.remove(tiles);tiles.geometry.dispose();}NY=Math.max(2,Math.round(NT*RH/RW));
    const g=new T.BoxGeometry(RW/NT*.82,RH/NY*.82,.05);tiles=new T.InstancedMesh(g,new T.MeshBasicMaterial({color:0xffffff}),NT*NY);tiles.instanceMatrix.setUsage(T.DynamicDrawUsage);
    let k=0;for(let j=0;j<NY;j++)for(let i=0;i<NT;i++){tmpO.position.set((i+.5)/NT*RW-RW/2,(j+.5)/NY*RH-RH/2,0.02);tmpO.updateMatrix();tiles.setMatrixAt(k++,tmpO.matrix);}
    tiles.instanceMatrix.needsUpdate=true;tiles.frustumCulled=false;ris.add(tiles);lastG=null;}
  const lris=lbl('RIS (programmable surface)','#2F6DB5',0.95);lris.position.set(C.x-2.2,2.75,-2.3);S.add(lris);
  // ---------- person ----------
  const per=new T.Group();S.add(per);const skin=mat(0xe2b79a),shirt=mat(0x4a6fa5),pants=mat(0x2d3748);
  const torso=new T.Mesh(new T.BoxGeometry(.44,.64,.26),shirt);torso.position.y=1.2;per.add(torso);
  const head=new T.Mesh(new T.SphereGeometry(.17,16,12),skin);head.position.y=1.7;per.add(head);
  const limb=(w,l,mt,px,py)=>{const g=new T.Group();g.position.set(px,py,0);const m=new T.Mesh(new T.BoxGeometry(w,l,w),mt);m.position.y=-l/2;g.add(m);per.add(g);return g;};
  const legL=limb(.15,.84,pants,-.11,.86),legR=limb(.15,.84,pants,.11,.86),armL=limb(.11,.6,shirt,-.3,1.48),armR=limb(.11,.6,shirt,.3,1.48);
  const lper=lbl('person (no line of sight)','#14213D',0.95);S.add(lper);
  // ---------- direct line of sight (blocked) ----------
  const los=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(1,0,0)]),new T.LineDashedMaterial({color:0x6b7585,dashSize:.5,gapSize:.35}));S.add(los);
  const xm=new T.Group();[1,-1].forEach(s=>{const b=new T.Mesh(new T.BoxGeometry(.9,.09,.09),basic(0xc0392b));b.rotation.y=s*Math.PI/4;xm.add(b);});xm.rotation.x=0;S.add(xm);
  const lx=lbl('direct path blocked by the wall','#C0392B',0.9);S.add(lx);
  // ---------- rays, packets, markers ----------
  const lineA=line3([R,C],0xed7d31,.7);S.add(lineA);
  const lineB=new T.Line(new T.BufferGeometry().setFromPoints([C.clone(),C.clone()]),new T.LineBasicMaterial({color:0xed7d31,transparent:true,opacity:.8}));lineB.frustumCulled=false;S.add(lineB);
  const pk=(c)=>{const m=new T.Mesh(new T.SphereGeometry(.22,14,10),new T.MeshBasicMaterial({color:c,transparent:true,opacity:1}));m.visible=false;S.add(m);return m;};
  const pOut=pk(C3.org),pRet=pk(C3.blue);
  const ringG=new T.RingGeometry(.5,.56,40);const scat=new T.Mesh(ringG,new T.MeshBasicMaterial({color:C3.org,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));S.add(scat);
  const ghost=new T.Mesh(new T.SphereGeometry(.38,16,12),new T.MeshBasicMaterial({color:0xc0392b,transparent:true,opacity:.45}));ghost.visible=false;S.add(ghost);
  const lg=lbl('radar’s naive estimate (behind the wall)','#C0392B',0.9);lg.visible=false;S.add(lg);
  const gl=new T.Line(new T.BufferGeometry().setFromPoints([R.clone(),R.clone()]),new T.LineDashedMaterial({color:0xc0392b,dashSize:.4,gapSize:.3}));gl.visible=false;gl.frustumCulled=false;S.add(gl);
  const okR=new T.Mesh(new T.TorusGeometry(.55,.05,10,32),new T.MeshBasicMaterial({color:C3.green}));okR.rotation.x=Math.PI/2;okR.visible=false;S.add(okR);
  const lok=lbl('corrected position (RIS geometry)','#3A9D5D',0.9);lok.visible=false;S.add(lok);
  // ---------- state & ui ----------
  let mode='off',est='corr',walk=true,zp=4,dirz=1,N=16,tm=0,lastG=null,cyc=0,lastSNR=0;
  const ELS=el=>root.querySelector(el);
  const hud={st:ELS('#n-st'),snr:ELS('#n-snr'),path:ELS('#n-path'),ang:ELS('#n-ang')};
  const rc=ELS('canvas.rp'),rg=rc.getContext('2d');
  const setBtn=(sel,val)=>root.querySelectorAll(sel).forEach(b=>b.classList.toggle('on',b.getAttribute(sel.replace(/[\[\]]/g,''))===val));
  bindBtns(root,'[data-rm]',x=>{mode=x;});bindBtns(root,'[data-es]',x=>{est=x;});
  bindBtns(root,'[data-pw]',x=>{walk=x==='1';});
  bindRange(root,'#n-pos',x=>{if(Math.abs(x-zp)>0.05){walk=false;setBtn('[data-pw]','0');}zp=x;},x=>x.toFixed(1)+' m');
  bindRange(root,'#n-ns',x=>{NT=x;buildTiles();},x=>x+' × '+Math.max(2,Math.round(x*RH/RW)));
  buildTiles();
  const FIX=new T.Vector3(1.2,Y,7.0);
  function drawProfile(rp,det,snr,show){const w=rc.width,h=rc.height;rg.clearRect(0,0,w,h);rg.fillStyle='#fff';rg.fillRect(0,0,w,h);
    const X=r=>30+(w-38)*r/40,Yy=d=>h-20-(h-34)*Math.min(d,32)/32;
    rg.strokeStyle='#D0D5DD';rg.lineWidth=1;rg.beginPath();rg.moveTo(30,h-20);rg.lineTo(w-8,h-20);rg.moveTo(30,8);rg.lineTo(30,h-20);rg.stroke();
    rg.fillStyle='#6B7585';rg.font='10px Helvetica,Arial';rg.textAlign='center';[0,10,20,30,40].forEach(r=>rg.fillText(r,X(r),h-8));rg.fillText('range (m)',w-34,h-8);
    rg.textAlign='right';[0,10,20,30].forEach(d=>rg.fillText(d,26,Yy(d)+3));
    const d1=L1,nz=x=>1.0+1.1*Math.abs(Math.sin(x*7.3+tm*13)*Math.cos(x*3.1-tm*9));
    const pk1=(r,a,s)=>a*Math.exp(-0.5*Math.pow((r-rp_)/s,2));let rp_=0;
    rg.strokeStyle='#14213D';rg.lineWidth=1.6;rg.beginPath();
    for(let i=0;i<=200;i++){const r=40*i/200;let a=nz(r);a+=22*Math.exp(-0.5*Math.pow((r-d1)/0.7,2));if(show)a+=Math.max(0,snr)*Math.exp(-0.5*Math.pow((r-rp)/0.7,2));
      const px=X(r),py=Yy(a);i?rg.lineTo(px,py):rg.moveTo(px,py);}rg.stroke();
    rg.setLineDash([4,3]);rg.strokeStyle='#C0392B';rg.beginPath();rg.moveTo(30,Yy(6));rg.lineTo(w-8,Yy(6));rg.stroke();rg.setLineDash([]);
    rg.fillStyle='#C0392B';rg.textAlign='left';rg.fillText('threshold',w-60,Yy(6)-3);
    rg.fillStyle='#6B7585';rg.font='bold 10px Helvetica,Arial';rg.fillText('wall / RIS (static)',X(d1)+5,Yy(24)+2);
    rg.font='bold 11px Helvetica,Arial';
    if(show&&det){rg.fillStyle='#3A9D5D';rg.textAlign='center';rg.fillText('person',X(rp),Yy(snr+22*0)-6);}
    else{rg.fillStyle='#C0392B';rg.textAlign='left';rg.fillText(show?'echo below threshold':'no echo from the person',36,16);}}
  v.tick=function(dt){tm+=dt;
    if(walk){zp+=dirz*1.1*dt;if(zp>12){zp=12;dirz=-1;}if(zp<3){zp=3;dirz=1;}const s=ELS('#n-pos');s.value=zp;const em=s.parentElement.querySelector('em');if(em)em.textContent=zp.toFixed(1)+' m';}
    const ph=tm*5.5*(walk?1:0);per.position.set(1.2,0,zp);per.rotation.y=dirz>0?0:Math.PI;
    legL.rotation.x=Math.sin(ph)*0.55;legR.rotation.x=-Math.sin(ph)*0.55;armL.rotation.x=-Math.sin(ph)*0.45;armR.rotation.x=Math.sin(ph)*0.45;
    lper.position.set(1.2+3.6,2.55,zp);
    const P=new T.Vector3(1.2,Y,zp),ui=R.clone().sub(C).normalize();
    const aim=mode==='track'?P:(mode==='fixed'?FIX:null);
    const dPC=P.distanceTo(C),rp=L1+dPC;
    // direct LOS blocked marker
    const lp=los.geometry.attributes.position;lp.setXYZ(0,R.x,R.y,R.z);lp.setXYZ(1,P.x,P.y,P.z);lp.needsUpdate=true;los.computeLineDistances();
    const tcross=1.2/zp,xc=R.x+(P.x-R.x)*tcross;xm.position.set(xc,Y,1.2);lx.position.set(xc,2.5,2.9);
    // RIS beam
    let snr=-99,det=false,inBeam=false,thOut=0,thIn=Math.atan2(ui.dot(tan),ui.dot(nrm));
    if(aim){const ur=aim.clone().sub(C).normalize(),up=P.clone().sub(C).normalize();thOut=Math.atan2(ur.dot(tan),ur.dot(nrm));
      const bw=102/NT,dth=Math.acos(Math.max(-1,Math.min(1,ur.dot(up))))*180/Math.PI;
      const loss=Math.min(40,12*Math.pow(dth/(bw/2),2)),cs=Math.cos(thIn)*Math.cos(thOut);
      snr=99.2+40*Math.log10(NT/16)-40*Math.log10(L1)-40*Math.log10(dPC)-loss+10*Math.log10(Math.max(.05,cs));
      inBeam=dth<bw/2*1.2;det=snr>6;
      const dist=aim.distanceTo(C);beam2.visible=true;const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),ur);beam2.quaternion.copy(q);beam2.position.copy(C);
      const Lc=Math.max(dist,dPC)*1.0,rr=Lc*Math.tan(bw*Math.PI/360);beam2.scale.set(Lc,rr,rr);
      const lb=lineB.geometry.attributes.position;lb.setXYZ(0,C.x,C.y,C.z);lb.setXYZ(1,aim.x,aim.y,aim.z);lb.needsUpdate=true;lineB.visible=true;
      // phase pattern on the RIS
      const G=ur.dot(tan)+ui.dot(tan);if(lastG===null||Math.abs(G-lastG)>0.003){lastG=G;let k=0;for(let j=0;j<NY;j++)for(let i=0;i<NT;i++){const x=(i+.5)/NT*RW-RW/2;const psi=G*(2*Math.PI/0.55)*x;tmpC.setHSL(((psi/(2*Math.PI))%1+1)%1,0.75,0.5);tiles.setColorAt(k++,tmpC);}tiles.instanceColor.needsUpdate=true;}
    }else{beam2.visible=false;lineB.visible=false;if(lastG!==0){lastG=0;let k=0;tmpC.set(0x9aa4b0);for(let n=0;n<NT*NY;n++)tiles.setColorAt(k++,tmpC);if(tiles.instanceColor)tiles.instanceColor.needsUpdate=true;}}
    // packets
    const E=aim?(inBeam?P:C.clone().add(aim.clone().sub(C).normalize().multiplyScalar(9))):C;
    const Lo=L1+E.distanceTo(C),Vs=15,Tout=Lo/Vs,Tc=(inBeam?2*Tout:Tout)+0.9;cyc=(cyc+dt)%Tc;
    const at=(s,a,b,c)=>{if(s<=a.distanceTo(b))return a.clone().lerp(b,s/a.distanceTo(b));const r=s-a.distanceTo(b);return b.clone().lerp(c,Math.min(1,r/b.distanceTo(c)));};
    pOut.visible=cyc<Tout;if(pOut.visible)pOut.position.copy(at(cyc*Vs,R,C,E));
    pRet.visible=inBeam&&cyc>=Tout&&cyc<2*Tout;if(pRet.visible){pRet.position.copy(at((cyc-Tout)*Vs,E,C,R));pRet.material.opacity=det?1:.35;}
    scat.visible=!aim;if(!aim){const ta=cyc-L1/Vs;if(ta>0&&ta<1.2){scat.position.set(C.x-0.05,Y,C.z);scat.lookAt(C.x-1,Y,C.z);const sc=1+ta*3;scat.scale.setScalar(sc);scat.material.opacity=.5*(1-ta/1.2);}else scat.material.opacity=0;}
    // estimates
    const showEst=det&&aim;const gp=R.clone().add(C.clone().sub(R).normalize().multiplyScalar(rp));
    ghost.visible=showEst&&est==='naive';lg.visible=ghost.visible;gl.visible=ghost.visible;
    if(ghost.visible){ghost.position.copy(gp);lg.position.set(gp.x-6.5,gp.y+1.3,gp.z-2.4);const g2=gl.geometry.attributes.position;g2.setXYZ(0,R.x,R.y,R.z);g2.setXYZ(1,gp.x,gp.y,gp.z);g2.needsUpdate=true;gl.computeLineDistances();}
    okR.visible=showEst&&est==='corr';lok.visible=okR.visible;if(okR.visible){okR.position.set(1.2,0.08,zp);lok.position.set(1.2-3.9,3.2,zp);}
    // HUD
    hud.st.textContent=mode==='off'?'NOT detected':(det?'DETECTED':'too weak');hud.st.style.color=det?'#3A9D5D':'#C0392B';
    hud.snr.textContent=aim?snr.toFixed(0)+' dB':'–∞';hud.path.textContent=rp.toFixed(1)+' m';hud.ang.textContent=aim?(thOut*180/Math.PI).toFixed(0)+'°':'–';
    if(hud.snr.textContent==='–∞')hud.snr.textContent='no echo';
    drawProfile(rp,det,snr,!!aim&&inBeam);};
  return v;});
