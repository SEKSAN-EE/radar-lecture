Scenes.register('urban',function(root){
  const T=THREE,canvas=root.querySelector('canvas.gl');
  const v=makeView(canvas,{th:0.12,ph:0.82,dist:112,target:new T.Vector3(0,0,-36),minD:40,maxD:180,bg:0xe8eff6});
  const S=v.scene;addLights(S);groundPlane(S,500,0xd5dbe2);
  const R0=new T.Vector3(0,0,10);
  const B=[{x0:-26,x1:-9,z0:-48,z1:-8,h:18},{x0:10,x1:28,z0:-52,z1:-14,h:22},{x0:-8,x1:8,z0:-78,z1:-58,h:15}];
  const bm=mat(0x9aa6b4,{roughness:.9});const bgrp=new T.Group();S.add(bgrp);
  B.forEach(b=>{const m=new T.Mesh(new T.BoxGeometry(b.x1-b.x0,b.h,b.z1-b.z0),new T.MeshStandardMaterial({color:0xc2ccd8,roughness:.9,transparent:true,opacity:.55}));m.position.set((b.x0+b.x1)/2,b.h/2,(b.z0+b.z1)/2);bgrp.add(m);
    const e=new T.LineSegments(new T.EdgesGeometry(m.geometry),new T.LineBasicMaterial({color:0x6b7585}));e.position.copy(m.position);bgrp.add(e);});
  const tw=radarTower(2.5,1.4);tw.position.copy(R0);tw.scale.setScalar(1.3);S.add(tw);const pan=tw.userData.pan;
  const rl=lbl('scanning radar','#14213D',2.2);rl.position.set(0,13,14);S.add(rl);
  const uav=drone(C3.navy,1.4);S.add(uav);
  // boundary overlays (stage 2)
  const bnd=new T.Group();S.add(bnd);const BETA=2.5;
  B.forEach(b=>{const m=new T.Mesh(new T.BoxGeometry(b.x1-b.x0+2*BETA,0.3,b.z1-b.z0+2*BETA),new T.MeshBasicMaterial({color:0xed7d31,transparent:true,opacity:.22,depthWrite:false}));m.position.set((b.x0+b.x1)/2,0.2,(b.z0+b.z1)/2);bnd.add(m);
    const e=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(b.x1-b.x0+2*BETA,0.3,b.z1-b.z0+2*BETA)),new T.LineBasicMaterial({color:0xed7d31}));e.position.copy(m.position);bnd.add(e);});
  const bl=lbl('environmental boundary','#ED7D31',2.4);bl.position.set(-24,1.2,-4);bnd.add(bl);bnd.visible=false;
  // multipath rays
  const rayD=line3([new T.Vector3(),new T.Vector3()],0x14213d,.9),rayM=line3([new T.Vector3(),new T.Vector3(),new T.Vector3()],0xed7d31,.9);S.add(rayD,rayM);
  // point sets
  const MAXP=1600;const P=new Float32Array(MAXP*3),A=new Float32Array(MAXP),Cc=new Float32Array(MAXP*3),Z=new Float32Array(MAXP).fill(7);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(P,3));geo.setAttribute('alpha',new T.BufferAttribute(A,1));geo.setAttribute('color',new T.BufferAttribute(Cc,3));geo.setAttribute('size',new T.BufferAttribute(Z,1));
  const pmat=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:`attribute float alpha;attribute float size;attribute vec3 color;varying vec3 vC;varying float vA;void main(){vC=color;vA=alpha;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*(260.0/-mv.z);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying vec3 vC;varying float vA;void main(){vec2 p=gl_PointCoord-0.5;if(dot(p,p)>0.25)discard;gl_FragColor=vec4(vC,vA);}`});
  const pts=new T.Points(geo,pmat);pts.frustumCulled=false;S.add(pts);
  // static clutter points on facades facing the street
  const kind=[];let n=0;const addP=(x,y,z,k)=>{if(n>=MAXP)return;P.set([x,y,z],n*3);kind[n]=k;n++;};
  B.forEach(b=>{for(let i=0;i<150;i++){const side=Math.random();let x,z;const y=0.5+Math.random()*(b.h-1);
      if(side<0.45){x=(b.x0+b.x1)/2<0?b.x1:b.x0;z=b.z0+Math.random()*(b.z1-b.z0);} else {x=b.x0+Math.random()*(b.x1-b.x0);z=b.z1;}addP(x,y,z,'c');}});
  const nStatic=n;const dyn=[];             // dynamic UAV / ghost detections (ring buffer)
  const DYN0=nStatic,DYNMAX=MAXP-nStatic;let dp=0;
  let stage=1,az=0,t=0,spd=1;const hud={st:root.querySelector('#u-st'),n1:root.querySelector('#u-n1'),n2:root.querySelector('#u-n2'),n3:root.querySelector('#u-n3')};
  bindBtns(root,'[data-us]',x=>{stage=parseInt(x);bnd.visible=stage>=2;});bindRange(root,'#u-spd',x=>{spd=x;},x=>x+'×');
  const nrm=a=>((a%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
  const azOf=p=>nrm(Math.atan2(p.z-R0.z,p.x-R0.x));
  const inside=(x,z)=>B.some(b=>x>b.x0-BETA&&x<b.x1+BETA&&z>b.z0-BETA&&z<b.z1+BETA);
  const walls=[{x:-9},{x:10}];
  function uavPos(tt){const u=(tt*0.07)%2,s=u<1?u:2-u;return new T.Vector3(Math.sin(tt*0.9)*2.2,8+Math.sin(tt*0.6)*2,-14-s*50);}
  function ghostOf(U,w){const Ui=new T.Vector3(2*w.x-U.x,U.y,U.z);const rg=(Ui.distanceTo(R0)+U.distanceTo(R0))/2;const d=Ui.clone().sub(R0).normalize();return {G:R0.clone().add(d.multiplyScalar(rg)),Ui};}
  const sColor={c:[0.55,0.6,0.67],u:[0.77,0.22,0.17],g:[0.23,0.62,0.37]};
  const setDyn=(x,y,z,k)=>{const i=DYN0+(dp%DYNMAX);dp++;P.set([x,y,z],i*3);kind[i]=k;A[i]=1;Z[i]=k==='u'?14:10;};
  let prevAz=0;
  v.tick=function(dt){t+=dt*spd;prevAz=az;az=nrm(az+dt*spd*1.15);pan.rotation.y=Math.PI/2-az;
    const U=uavPos(t);uav.position.copy(U);uav.rotation.y+=dt*0.3;
    // rays for the current geometry (nearest wall that gives a valid bounce)
    const w=U.x<0?walls[0]:walls[1];const gh=ghostOf(U,w);
    const hitT=(w.x-R0.x)/(gh.Ui.x-R0.x);const hit=R0.clone().lerp(gh.Ui,hitT);
    rayD.geometry.setFromPoints([R0.clone().setY(7),U]);rayM.geometry.setFromPoints([R0.clone().setY(7),hit,U]);
    // beam passing -> detections
    const half=0.07,hb=(a0,a1,aT)=>{const d=nrm(aT-a0);const d1=nrm(a1-a0);return d<=d1+0.02;};
    const aU=azOf(U);if(hb(prevAz,az,aU)){setDyn(U.x,U.y,U.z,'u');}
    {const aG=azOf(gh.G);if(hb(prevAz,az,aG))setDyn(gh.G.x,gh.G.y,gh.G.z,'g');}
    for(let i=0;i<nStatic;i++){const a=azOf(new T.Vector3(P[i*3],0,P[i*3+2]));if(hb(prevAz,az,a)&&Math.random()<.9)A[i]=1;}
    let cU=0,cG=0,cC=0;
    for(let i=0;i<MAXP;i++){const isStatic=i<nStatic,k=kind[i];if(!k){A[i]=0;continue;}
      A[i]=Math.max(isStatic?0.16:0,A[i]-dt*(isStatic?0.14:0.045));
      let show=A[i];const px=P[i*3],pz=P[i*3+2];
      if(stage===3&&k!=='u'&&(inside(px,pz)||k==='c')){show=0;}
      if(stage===3&&k==='u')show=Math.max(show,A[i]);
      const c=sColor[k];Cc.set(c,i*3);geo.attributes.alpha.array[i]=show;if(show>0.15){if(k==='u')cU++;else if(k==='g')cG++;else cC++;}}
    geo.attributes.position.needsUpdate=true;geo.attributes.alpha.needsUpdate=true;geo.attributes.color.needsUpdate=true;geo.attributes.size.needsUpdate=true;
    rayM.visible=stage<3;rayD.visible=true;
    hud.st.textContent=['Raw detections','+ Boundary','Suppressed'][stage-1];hud.n1.textContent=cC;hud.n2.textContent=cG;hud.n3.textContent=cU;};
  return v;});
