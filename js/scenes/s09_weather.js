Scenes.register('weather',function(root){
  const T=THREE,canvas=root.querySelector('canvas.gl');
  const v=makeView(canvas,{th:0.8,ph:0.42,dist:78,target:new T.Vector3(10,8,-8),minD:20,maxD:200,bg:0xe4eef7});
  const S=v.scene;addLights(S);groundPlane(S,400,0xc3d1b6);
  const RM=70;for(let i=1;i<=3;i++){const r=new T.Mesh(new T.RingGeometry(RM*i/3-.12,RM*i/3+.12,96),new T.MeshBasicMaterial({color:0x8fa08a,side:T.DoubleSide,transparent:true,opacity:.7}));r.rotation.x=-Math.PI/2;r.position.y=.05;S.add(r);}
  // weather radar station: concrete tower + geodesic radome with the dish inside
  const H0=7.2,RR=3.0,TOP=4.3;
  const conc=mat(0xc9ced4,{roughness:.9});
  const tower=new T.Mesh(new T.CylinderGeometry(1.5,2.3,TOP,32),conc);tower.position.y=TOP/2;S.add(tower);
  const ring=new T.Mesh(new T.CylinderGeometry(2.1,2.1,.25,32),mat(0x9aa3ad));ring.position.y=TOP+0.05;S.add(ring);
  const shelter=new T.Mesh(new T.BoxGeometry(5,2,3.4),conc);shelter.position.set(-4.6,1,1.2);S.add(shelter);
  const roofS=new T.Mesh(new T.BoxGeometry(5.3,.25,3.7),mat(0x7a838d));roofS.position.set(-4.6,2.1,1.2);S.add(roofS);
  const pan=new T.Group();pan.position.y=H0;S.add(pan);
  const dsh=dish(1.9,0xdfe5ec);pan.add(dsh);
  const ped=new T.Mesh(new T.CylinderGeometry(.22,.3,H0-TOP,12),mat(0x59636e));ped.position.y=(H0+TOP)/2;S.add(ped);
  const icoG=new T.IcosahedronGeometry(RR,2);
  const domeMat=new T.MeshStandardMaterial({color:0xf6f8fa,roughness:.45,metalness:.05,flatShading:true,transparent:true,opacity:1});
  const dome=new T.Mesh(icoG,domeMat);dome.position.y=H0;dome.renderOrder=2;S.add(dome);
  const dEdges=new T.LineSegments(new T.WireframeGeometry(icoG),new T.LineBasicMaterial({color:0x9aa6b4,transparent:true,opacity:.55}));dEdges.position.y=H0;S.add(dEdges);
  const rod=new T.Mesh(new T.CylinderGeometry(.04,.04,1.3,6),mat(0x59636e));rod.position.y=H0+RR+.55;S.add(rod);
  const lamp=new T.Mesh(new T.SphereGeometry(.14,10,8),new T.MeshBasicMaterial({color:0xff3b2f}));lamp.position.y=H0+RR+1.25;S.add(lamp);
  let seeInside=false;const setDome=()=>{domeMat.opacity=seeInside?0.2:1;domeMat.depthWrite=!seeInside;dEdges.material.opacity=seeInside?.45:.55;};
  bindBtns(root,'[data-rd]',x=>{seeInside=x==='t';setDome();});setDome();
  // storm cells -> point cloud
  const cells=[{x:30,z:-18,rx:12,rz:9,h:16,peak:58,rot:0},{x:-8,z:-38,rx:10,rz:12,h:14,peak:52,rot:1.0},{x:40,z:20,rx:9,rz:8,h:11,peak:47,rot:0}];
  const NP=7000,pos=new Float32Array(NP*3),ref=new Float32Array(NP),vr=new Float32Array(NP),alpha=new Float32Array(NP),col=new Float32Array(NP*3),size=new Float32Array(NP);
  const wind=[-1.2,0.8];let k=0;
  for(const c of cells){const n=Math.floor(NP/cells.length);for(let i=0;i<n&&k<NP;i++,k++){let u,w,t;do{u=Math.random()*2-1;w=Math.random()*2-1;t=Math.random()*2-1;}while(u*u+w*w+t*t>1);
      const x=c.x+u*c.rx,z=c.z+w*c.rz,y=3+(t*0.5+0.5)*c.h;pos.set([x,y,z],k*3);const r2=u*u+w*w+t*t;ref[k]=Math.max(8,c.peak*Math.exp(-r2*1.4)+4*Math.random());
      // velocity field: mean wind + rotation about the cell centre
      let ux=wind[0],uz=wind[1];if(c.rot){const rr=Math.hypot(x-c.x,z-c.z)+1e-3;const sp=14*Math.exp(-rr/10);ux+=-(z-c.z)/rr*sp*c.rot;uz+=(x-c.x)/rr*sp*c.rot;}
      const d=Math.hypot(x,y,z);vr[k]=(ux*x+uz*z)/d;alpha[k]=0.05;size[k]=3.2+Math.random()*1.8;}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('color',new T.BufferAttribute(col,3));geo.setAttribute('alpha',new T.BufferAttribute(alpha,1));geo.setAttribute('size',new T.BufferAttribute(size,1));
  const pm=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:`attribute float alpha;attribute float size;attribute vec3 color;varying vec3 vC;varying float vA;void main(){vC=color;vA=alpha;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*(320.0/-mv.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying vec3 vC;varying float vA;void main(){vec2 p=gl_PointCoord-0.5;float d=dot(p,p);if(d>0.25)discard;gl_FragColor=vec4(vC,vA*(1.0-d*2.4));}`});
  S.add(new T.Points(geo,pm));
  const beamG=new T.ConeGeometry(1,RM,20,1,true);beamG.translate(0,-RM/2,0);beamG.rotateZ(Math.PI/2);
  const beam=new T.Mesh(beamG,new T.MeshBasicMaterial({color:0xed7d31,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false}));beam.position.y=H0;S.add(beam);
  const elevs=[0.5,2.0,4.0,6.5,9.5];let ei=0,az=0,spd=1,mode='ref',bw=3.4;const hud={el:root.querySelector('#w-el'),az:root.querySelector('#w-az'),mx:root.querySelector('#w-mx'),sc:root.querySelector('#w-sc')};
  bindRange(root,'#w-spd',x=>{spd=x;},x=>x+'×');  const lg=document.createElement('canvas');lg.width=0;
  function colorize(){for(let i=0;i<NP;i++){let c;if(mode==='ref')c=turbo(Math.max(0,Math.min(1,(ref[i]-8)/58)));else{const q=Math.max(-1,Math.min(1,vr[i]/14));c=q<0?new T.Color(0.15,0.55+(-q)*0.35,0.25):new T.Color(0.55+q*0.4,0.18,0.18);if(Math.abs(q)<0.08)c=new T.Color(0.55,0.58,0.62);}col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}geo.attributes.color.needsUpdate=true;}
  colorize();bindBtns(root,'[data-wm]',x=>{mode=x;colorize();});
  v.tick=function(dt){lamp.visible=(performance.now()%1600)<800;az+=dt*spd*1.35;if(az>Math.PI*2){az-=Math.PI*2;ei=(ei+1)%elevs.length;}
    const el=elevs[ei]*Math.PI/180,dir=new T.Vector3(Math.cos(az)*Math.cos(el),Math.sin(el),Math.sin(az)*Math.cos(el));
    beam.quaternion.setFromUnitVectors(new T.Vector3(1,0,0),dir);pan.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),dir);beam.scale.set(1,Math.tan(bw*Math.PI/360)*1.0,Math.tan(bw*Math.PI/360)*1.0);
    beam.scale.set(1,1,1);beam.geometry.dispose();const r=RM*Math.tan(bw*Math.PI/360);const g2=new T.ConeGeometry(r,RM,18,1,true);g2.translate(0,-RM/2,0);g2.rotateZ(Math.PI/2);beam.geometry=g2;
    const cb=Math.cos(bw*Math.PI/360*1.6);let mx=0;const p=new T.Vector3();
    for(let i=0;i<NP;i++){p.set(pos[i*3],pos[i*3+1]-H0,pos[i*3+2]);const d=p.length();const dd=(p.x*dir.x+p.y*dir.y+p.z*dir.z)/d;if(dd>cb){alpha[i]=1;if(ref[i]>mx)mx=ref[i];}else alpha[i]=Math.max(0.035,alpha[i]-dt*0.35);}
    geo.attributes.alpha.needsUpdate=true;
    hud.el.textContent=elevs[ei].toFixed(1)+'°';hud.az.textContent=((az*180/Math.PI)|0)+'°';hud.mx.textContent=mx?mx.toFixed(0)+' dBZ':'–';hud.sc.textContent=(ei+1)+' / '+elevs.length;};
  return v;});
