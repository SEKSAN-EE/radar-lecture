Scenes.register('phased',function(root){
  const T=THREE,canvas=root.querySelector('canvas.gl');
  const v=makeView(canvas,{th:0.75,ph:0.32,dist:34,target:new T.Vector3(0,0,7),minD:14,maxD:80,bg:0xf3f6fa});
  const S=v.scene;addLights(S);
  const grid=new T.GridHelper(80,40,0xd3dde7,0xe3e9f0);grid.position.y=-9;S.add(grid);
  let N=8,az=0,el=0,auto=false,tm=0,dirty=true;const R0=15,SP=0.9;
  const panel=new T.Mesh(new T.BoxGeometry(1,1,0.3),mat(0x3e4a5c));panel.position.z=-0.25;S.add(panel);
  const elems=new T.Group();S.add(elems);
  const SEG=96,RINGS=48;const sg=new T.SphereGeometry(1,SEG,RINGS);const sp=sg.attributes.position;const unit=[];for(let i=0;i<sp.count;i++)unit.push(new T.Vector3(sp.getX(i),sp.getY(i),sp.getZ(i)));
  sg.setAttribute('color',new T.BufferAttribute(new Float32Array(sp.count*3),3));
  const pat=new T.Mesh(sg,new T.MeshStandardMaterial({vertexColors:true,roughness:.6,transparent:true,opacity:.92,side:T.DoubleSide}));S.add(pat);
  const beamL=line3([new T.Vector3(),new T.Vector3()],0xc0392b);S.add(beamL);const bLab=lbl('main beam','#C0392B',1.3);S.add(bLab);
  const hud={az:root.querySelector('#f-az'),el:root.querySelector('#f-el'),bw:root.querySelector('#f-bw'),n:root.querySelector('#f-n')};
  function rebuild(){while(elems.children.length)elems.remove(elems.children[0]);const g=new T.BoxGeometry(SP*0.62,SP*0.62,0.35);const m=mat(C3.org,{roughness:.4,metalness:.3});
    for(let i=0;i<N;i++)for(let j=0;j<N;j++){const e=new T.Mesh(g,m);e.position.set((i-(N-1)/2)*SP,(j-(N-1)/2)*SP,0.05);elems.add(e);}
    panel.scale.set(N*SP+0.6,N*SP+0.6,1);dirty=true;}
  function sinc(N,x){const s=Math.sin(x/2);if(Math.abs(s)<1e-6)return 1;return Math.abs(Math.sin(N*x/2)/(N*s));}
  function update(){const a=az*Math.PI/180,e=el*Math.PI/180;const sx=Math.sin(a)*Math.cos(e),sy=Math.sin(e),sz=Math.cos(a)*Math.cos(e);
    const col=sg.attributes.color;
    for(let i=0;i<unit.length;i++){const u=unit[i];let r=0,c;if(u.z>0){const dx=Math.PI*(u.x-sx),dy=Math.PI*(u.y-sy);const af=sinc(N,dx)*sinc(N,dy)*Math.pow(u.z,0.7);const db=20*Math.log10(af+1e-6);const q=Math.max(0,(db+38)/38);r=R0*q;c=turbo(0.1+0.9*q);}else{c=new T.Color(0xcfd8e3);}
      sp.setXYZ(i,u.x*r,u.y*r,u.z*r);col.setXYZ(i,c.r,c.g,c.b);}
    sp.needsUpdate=true;col.needsUpdate=true;sg.computeVertexNormals();
    const bp=beamL.geometry.attributes.position;bp.setXYZ(0,0,0,0);bp.setXYZ(1,sx*(R0+3),sy*(R0+3),sz*(R0+3));bp.needsUpdate=true;bLab.position.set(sx*(R0+5),sy*(R0+5)+1,sz*(R0+5));
    hud.az.textContent=az.toFixed(0)+'°';hud.el.textContent=el.toFixed(0)+'°';hud.bw.textContent=(101.5/N).toFixed(1)+'°';hud.n.textContent=N*N;}
  bindRange(root,'#f-azs',x=>{az=x;dirty=true;},x=>x+'°');bindRange(root,'#f-els',x=>{el=x;dirty=true;},x=>x+'°');
  bindRange(root,'#f-ns',x=>{N=x;rebuild();},x=>x+' × '+x);
  bindBtns(root,'[data-auto]',x=>{auto=x==='1';});
  rebuild();
  v.tick=function(dt){if(auto){tm+=dt;az=Math.sin(tm*0.9)*55;el=Math.sin(tm*0.37)*20;root.querySelector('#f-azs').value=az;root.querySelector('#f-els').value=el;dirty=true;}
    if(dirty){update();dirty=false;}};
  return v;});
