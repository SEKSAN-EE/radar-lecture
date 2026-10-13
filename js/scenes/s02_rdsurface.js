Scenes.register('rdsurface',function(root){
  const T=THREE,canvas=root.querySelector('canvas.gl');
  const v=makeView(canvas,{th:0.75,ph:0.62,dist:46,target:new T.Vector3(0,3,0),minD:20,maxD:100,bg:0xf3f6fa});
  const S=v.scene;addLights(S,1.0);
  const NX=110,NZ=70,W=30,H=20;               // range along x, velocity along z
  const geo=new T.PlaneGeometry(W,H,NX-1,NZ-1);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position;const col=new Float32Array(pos.count*3);geo.setAttribute('color',new T.BufferAttribute(col,3));
  const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:0,flatShading:false,side:T.DoubleSide}));S.add(mesh);
  const wire=new T.Mesh(geo,new T.MeshBasicMaterial({color:0x14213d,wireframe:true,transparent:true,opacity:0.07}));S.add(wire);
  const base=new T.Mesh(new T.PlaneGeometry(W,H),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.0}));
  // axes
  const ax=(a,b,c)=>{const l=line3([a,b],0x14213d);S.add(l);};
  ax(new T.Vector3(-W/2,0,H/2+.6),new T.Vector3(W/2,0,H/2+.6));ax(new T.Vector3(W/2+.6,0,H/2),new T.Vector3(W/2+.6,0,-H/2));
  const l1=lbl('Range →','#14213D',1.3);l1.position.set(0,0,H/2+2);S.add(l1);
  const l2=lbl('Velocity →','#14213D',1.3);l2.position.set(W/2+3.2,0,0);S.add(l2);
  const l3=lbl('0 m/s','#6B7585',.9);l3.position.set(W/2+2.2,0,0.0);
  const l4=lbl('toward','#6B7585',.9);l4.position.set(W/2+2.2,0,-H/2+.5);S.add(l4);const l5=lbl('away','#6B7585',.9);l5.position.set(W/2+2.2,0,H/2-.5);S.add(l5);
  const zero=line3([new T.Vector3(-W/2,0.05,0),new T.Vector3(W/2,0.05,0)],0xed7d31,.7);S.add(zero);
  const markers=new T.Group();S.add(markers);
  const kinds={ped:{n:'pedestrian',r:0.18,v:0.08,a:.38,c:'#3A9D5D'},car:{n:'car',r:0.45,v:0.34,a:.75,c:'#2F6DB5'},truck:{n:'truck',r:0.7,v:-0.16,a:1.0,c:'#C0392B'},wall:{n:'static wall',r:0.3,v:0.0,a:.6,c:'#6B7585'}};
  let tg=[{k:'car',r:.3,v:.12},{k:'wall',r:.62,v:0}],noise=.05,tm=0,paused=false;
  const hudN=root.querySelector('#r-n'),hudP=root.querySelector('#r-peak');
  const add=(k)=>{if(tg.length<7)tg.push({k,r:0.15+Math.random()*0.7,v:kinds[k].v*(0.7+Math.random()*0.6)*(Math.random()<.5?1:1)});};
  bindBtns(root,'[data-add]',(x)=>{if(x==='reset')tg=[{k:'car',r:.3,v:.12},{k:'wall',r:.62,v:0}];else add(x);});
  bindBtns(root,'[data-pause]',x=>{paused=x==='1';});
  bindRange(root,'#r-noise',x=>{noise=x/100;},x=>x+'%');
  v.tick=function(dt){if(!paused)tm+=dt;
    markers.children.slice().forEach(c=>{if(!tg.some(o=>o.lab===c))markers.remove(c);});
    const items=tg.map(o=>{if(!paused){o.r+=o.v*dt*0.55;if(o.r>0.96){o.r=0.04;}if(o.r<0.03){o.r=0.95;}}
      const K=kinds[o.k];return {x:(o.r-.5)*W,z:(Math.max(-1,Math.min(1,o.v/0.45)))*(H/2)*0.9,a:K.a*(0.45+0.55*(1-o.r)),c:K.c,n:K.n};});
    let mx=0;
    for(let i=0;i<NX*NZ;i++){const px=pos.getX(i),pz=pos.getZ(i);let h=noise*(0.5+0.5*Math.sin(px*9.1+tm*7+pz*5.3)*Math.sin(pz*7.7-tm*5+px*3.1)*0.9+0.25*Math.sin(i*12.9898+tm*40)*0.3);
      for(const t of items){const dx=(px-t.x)/0.55,dz=(pz-t.z)/0.9;h+=t.a*8*Math.exp(-(dx*dx+dz*dz)*0.5);}
      h=Math.min(h,10);pos.setY(i,h);if(h>mx)mx=h;const c=turbo(Math.min(1,0.12+h/8.5));col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
    pos.needsUpdate=true;geo.attributes.color.needsUpdate=true;geo.computeVertexNormals();
    items.forEach((t,i)=>{const o=tg[i];if(!o.lab){o.lab=lbl(t.n,t.c,0.95);markers.add(o.lab);}o.lab.position.set(t.x,Math.min(10,t.a*8)+1.2,t.z);});
    hudN.textContent=tg.length;hudP.textContent=(20*Math.log10(Math.max(mx,0.01)/0.05)).toFixed(0)+' dB';};
  return v;});
