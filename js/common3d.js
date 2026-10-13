/* shared 3D helpers */
(function(){
const T=window.THREE;
const C3={navy:0x14213d,org:0xed7d31,blue:0x2f6db5,green:0x3a9d5d,gray:0x3e4a5c,red:0xc0392b,gold:0xffc000,sky:0xeaf1f8,soil:0xc9ad84};
window.C3=C3;
window.mat=(c,o)=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.65,metalness:.1},o||{}));
window.basic=(c,o)=>new T.MeshBasicMaterial(Object.assign({color:c},o||{}));
window.addLights=function(S,k){k=k||1;S.add(new T.HemisphereLight(0xffffff,0x8896a6,0.95*k));const d=new T.DirectionalLight(0xffffff,1.25*k);d.position.set(40,80,30);S.add(d);return d;};
window.groundPlane=function(S,size,color,y){const g=new T.Mesh(new T.PlaneGeometry(size,size),mat(color||0xdfe6ee,{roughness:1}));g.rotation.x=-Math.PI/2;g.position.y=y||0;S.add(g);return g;};
window.turbo=function(t){t=Math.max(0,Math.min(1,t));
  const p=(c)=>c[0]+t*(c[1]+t*(c[2]+t*(c[3]+t*(c[4]+t*c[5]))));
  const r=p([0.13572138,4.61539260,-42.66032258,132.13108234,-152.94239396,59.28637943]);
  const g=p([0.09140261,2.19418839,4.84296658,-14.18503333,4.27729857,2.82956604]);
  const b=p([0.10667330,12.64194608,-60.58204836,110.36276771,-89.90310912,27.34824973]);
  return new T.Color(Math.max(0,Math.min(1,r)),Math.max(0,Math.min(1,g)),Math.max(0,Math.min(1,b)));};
window.dish=function(R,color){const g=new T.Group();const f=0.45*R,pts=[];
  for(let i=0;i<=16;i++){const r=R*i/16;pts.push(new T.Vector2(r,r*r/(4*f)));}
  const lg=new T.LatheGeometry(pts,40);lg.rotateX(Math.PI/2);        // opens toward +z
  g.add(new T.Mesh(lg,mat(color||0xeef2f6,{side:T.DoubleSide,roughness:.35,metalness:.2})));
  const stalk=new T.Mesh(new T.CylinderGeometry(R*0.03,R*0.03,f,8),mat(0x555f6b));stalk.rotation.x=Math.PI/2;stalk.position.z=f/2+R*0.08;g.add(stalk);
  const feed=new T.Mesh(new T.BoxGeometry(R*0.14,R*0.14,R*0.2),mat(C3.org));feed.position.z=f+R*0.1;g.add(feed);return g;};
window.radarTower=function(h,R){const g=new T.Group();const m=mat(0x8a939c,{metalness:.4});
  for(const dx of[-1,1])for(const dz of[-1,1]){const l=new T.Mesh(new T.CylinderGeometry(.08,.14,h),m);l.position.set(dx*.7,h/2,dz*.7);l.rotation.z=-dx*0.06;l.rotation.x=dz*0.06;g.add(l);}
  const pan=new T.Group();pan.position.y=h+R*.55;const d=dish(R);d.rotation.y=0;pan.add(d);g.add(pan);g.userData.pan=pan;g.userData.dish=d;return g;};
window.aircraft=function(color,s){s=s||1;const g=new T.Group();const m=mat(color||0x14213d,{roughness:.5});
  const f=new T.Mesh(new T.CylinderGeometry(.35*s,.22*s,3.4*s,12),m);f.rotation.z=Math.PI/2;g.add(f);
  const nose=new T.Mesh(new T.ConeGeometry(.35*s,.9*s,12),m);nose.rotation.z=-Math.PI/2;nose.position.x=2.1*s;g.add(nose);
  const w=new T.Mesh(new T.BoxGeometry(1.2*s,.08*s,4.2*s),m);w.position.x=.1*s;g.add(w);
  const t=new T.Mesh(new T.BoxGeometry(.7*s,.07*s,1.5*s),m);t.position.x=-1.5*s;g.add(t);
  const fin=new T.Mesh(new T.BoxGeometry(.8*s,.9*s,.07*s),m);fin.position.set(-1.45*s,.5*s,0);g.add(fin);return g;};
window.drone=function(color,s){s=s||1;const g=new T.Group();const m=mat(color||0x14213d);
  const b=new T.Mesh(new T.BoxGeometry(.9*s,.25*s,.9*s),m);g.add(b);
  for(const[x,z]of[[1,1],[-1,1],[1,-1],[-1,-1]]){const a=new T.Mesh(new T.CylinderGeometry(.04*s,.04*s,1.1*s,6),m);a.rotation.z=Math.PI/2;a.rotation.y=Math.atan2(z,x);a.position.set(x*.5*s,0,z*.5*s);a.rotation.set(0,0,0);
    const arm=new T.Mesh(new T.BoxGeometry(1.2*s,.07*s,.07*s),m);arm.position.set(x*.5*s,0,z*.5*s);arm.rotation.y=-Math.atan2(z,x);g.add(arm);
    const rot=new T.Mesh(new T.CylinderGeometry(.4*s,.4*s,.03*s,16),mat(0xdfe6ee,{transparent:true,opacity:.7}));rot.position.set(x*.9*s,.1*s,z*.9*s);g.add(rot);}
  return g;};
window.car=function(color,len){len=len||4.4;const g=new T.Group();const m=mat(color,{roughness:.35,metalness:.3});
  const body=new T.Mesh(new T.BoxGeometry(1.8,.7,len),m);body.position.y=.65;g.add(body);
  const cab=new T.Mesh(new T.BoxGeometry(1.5,.6,len*.5),mat(0x1b2733,{roughness:.2,metalness:.5}));cab.position.set(0,1.25,-len*.05);g.add(cab);
  const wm=mat(0x15191f);for(const[x,z]of[[1,1],[-1,1],[1,-1],[-1,-1]]){const w=new T.Mesh(new T.CylinderGeometry(.38,.38,.28,16),wm);w.rotation.z=Math.PI/2;w.position.set(x*.92,.38,z*len*.33);g.add(w);}
  const tl=new T.Mesh(new T.BoxGeometry(1.5,.18,.06),new T.MeshStandardMaterial({color:0x550000,emissive:0xff0000,emissiveIntensity:0}));tl.position.set(0,.8,len/2+.01);g.add(tl);g.userData.brake=tl;
  return g;};
window.cone=function(len,ang,color,op){ // wedge/cone pointing +x
  const r=len*Math.tan(ang);const g=new T.ConeGeometry(r,len,28,1,true);g.translate(0,-len/2,0);g.rotateZ(Math.PI/2);
  const m=new T.Mesh(g,new T.MeshBasicMaterial({color:color||0xed7d31,transparent:true,opacity:op||.16,side:T.DoubleSide,depthWrite:false}));return m;};
window.line3=function(pts,color,op){const g=new T.BufferGeometry().setFromPoints(pts);return new T.Line(g,new T.LineBasicMaterial({color:color||0x14213d,transparent:op!==undefined,opacity:op===undefined?1:op}));};
window.fmt=(v,d)=>v.toFixed(d===undefined?1:d);
})();
