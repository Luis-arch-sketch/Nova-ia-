/* Roube um Ovo — reconstrução da arquitetura do mundo inspirada na leitura
 * visual do Steal An Egg: baseplate verde com studs, muralhas terracota
 * altas, cercas de madeira e bases abertas.
 * Esta camada substitui TERRENO e ARQUITETURA; não cria ovos, não altera
 * saves, física, spawns, bases multiplayer, ADMIN nem controles.
 */
(()=>{
'use strict';
try{
 const T=THREE;
 if(!T||typeof sc==='undefined'||typeof BASE_GROUP==='undefined'||typeof BI==='undefined')return;
 if(window.RoubeOvoMapRebuild?.installed)return;
 const result={installed:false,version:'20261102-architecture-v1',groundTiles:0,cliffSections:0,
    fenceSections:0,oldGroundHidden:0,oldFenceHidden:0,biomes:BI.length};
 const root=new T.Group();root.name='RoubeOvoMap - original-inspired architecture';sc.add(root);
 const groundGroup=new T.Group();groundGroup.name='Roblox studded ground';root.add(groundGroup);
 const cliffGroup=new T.Group();cliffGroup.name='Terracotta high canyon walls';root.add(cliffGroup);
 const basePen=new T.Group();basePen.name='Orange rails base pen';BASE_GROUP.add(basePen);
 const palette=[
  [0x57e42e,0x85f85a], // Floresta, verde Roblox
  [0x5bdc8c,0x96edb0], // Lago
  [0xe4c47c,0xf7dfaa], // Deserto
  [0x37ad46,0x64d46e], // Selva
  [0xb7eaff,0xe5faff], // Neve
  [0x754c49,0xa3624e], // Vulcão
  [0x4a93aa,0x76c7d4], // Abissal
  [0x96b65b,0xbacc72], // Pré-história
  [0x444881,0x6d6eb0], // Cósmico
  [0x90c57b,0xb2e4a0], // Cerejeiras
  [0xb1b1a8,0xd4cbb0], // Titãs
  [0x8279ac,0xc1adbe], // Anjos e Demônios
  [0x7db89a,0xb1d4af]  // Encantada
 ];
 function studCanvas(){
   const c=document.createElement('canvas');c.width=c.height=256;
   const ctx=c.getContext('2d');
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,256,256);
   // Quadrados em relevo, vistos também em perspectiva, sem centenas de milhares de meshes.
   for(let y=0;y<8;y++)for(let x=0;x<8;x++){
     const xx=x*32, yy=y*32, checker=(x+y)%2;
     ctx.fillStyle=checker?'#f7f7f7':'#ffffff';ctx.fillRect(xx,yy,32,32);
     ctx.fillStyle='#e0e0e0';ctx.fillRect(xx+6,yy+7,20,20);
     ctx.fillStyle='#b8b8b8';ctx.fillRect(xx+7,yy+8,18,18);
     ctx.fillStyle='#eeeeee';ctx.fillRect(xx+8,yy+8,15,14);
     ctx.fillStyle='#ffffff';ctx.fillRect(xx+8,yy+8,13,2);
     ctx.fillStyle='#d7d7d7';ctx.fillRect(xx+9,yy+24,15,2);
   }
   const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;
   t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;
   return t;
 }
 const studTemplate=studCanvas();
 function studded(w,d,color,x,y,z,accent){
   const texture=studTemplate.clone();texture.repeat.set(w/10,d/10);texture.needsUpdate=true;
   const mat=new T.MeshLambertMaterial({map:texture,color,polygonOffset:true,polygonOffsetFactor:-1});
   const g=new T.PlaneGeometry(w,d);
   const obj=new T.Mesh(g,mat);obj.rotation.x=-Math.PI/2;obj.position.set(x,y,z);
   obj.receiveShadow=true;obj.userData.rueRebuiltGround=true;groundGroup.add(obj);result.groundTiles++;
   if(accent){
     const edgeMaterial=new T.MeshBasicMaterial({color:accent,transparent:true,opacity:.22,depthWrite:false});
     for(const dx of [-w*.5+.2,w*.5-.2]){
       const strip=new T.Mesh(new T.PlaneGeometry(.45,d),edgeMaterial);
       strip.rotation.x=-Math.PI/2;strip.position.set(x+dx,y+.008,z);groundGroup.add(strip);
     }
   }
   return obj;
 }
 // Ocultar exatamente os grandes planos antigos, preservando os pisos pequenos dos itens.
 sc.children.forEach(obj=>{
   if(!obj.isMesh||obj.geometry?.type!=='PlaneGeometry')return;
   const a=obj.geometry.parameters||{};
   const large=a.width>=100&&a.height>=50;
   if(large&&Math.abs(obj.position.y)<.09&&Math.abs(obj.rotation.x+Math.PI/2)<.01){
     obj.visible=false;result.oldGroundHidden++;
   }
 });
 // Replicar a leitura do baseplate Roblox de verdade em todos os trechos.
 studded(203.5,301,0x73e94a,0,.051,185,0xb7ff77);
 studded(203.5,1011,0x6adf48,0,.051,-450);
 for(let b=0;b<BI.length&&b<13;b++){
   const z=-65-70*b,c=palette[b],pad=b===0?0x57e62e:c[0];
   studded(202,67,pad,0,.064,z,c[1]);
   // Transição como faixa no chão, nunca parede física.
   if(b!==0)studded(202,2.0,c[1],0,.078,z+34);
 }
 // Caminho discreto. Nada de grandes faixas bege sobre a área verde.
 const mainTrail=new T.Mesh(new T.PlaneGeometry(7.5,1320),
   new T.MeshBasicMaterial({color:0xe3ffbf,transparent:true,opacity:.14,depthWrite:false}));
 mainTrail.rotation.x=-Math.PI/2;mainTrail.position.set(0,.092,-305);groundGroup.add(mainTrail);
 // Textura do paredão laranja do Roblox: blocos e pequenos relevos quadrados.
 function cliffTexture(){
   const c=document.createElement('canvas');c.width=256;c.height=256;
   const g=c.getContext('2d');g.fillStyle='#e1a16f';g.fillRect(0,0,256,256);
   for(let y=0;y<8;y++)for(let x=0;x<8;x++){
     const xx=x*32,yy=y*32,tone=(x*7+y*11)%5;
     g.fillStyle=['#e9ae7d','#e3a16e','#d99666','#dba06f','#e4aa79'][tone];
     g.fillRect(xx,yy,32,32);
     g.fillStyle='#c5865d';g.fillRect(xx+6,yy+6,19,19);
     g.fillStyle='#f4bd87';g.fillRect(xx+7,yy+6,17,17);
     g.fillStyle='#df9b68';g.fillRect(xx+8,yy+8,15,15);
     g.fillStyle='#f8c08f';g.fillRect(xx+8,yy+8,13,2);
     g.fillStyle='#d29061';g.fillRect(xx+9,yy+21,13,2);
   }
   const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(6,11);
   t.anisotropy=2;return t;
 }
 const wallTexture=cliffTexture();
 const wallMat=new T.MeshLambertMaterial({map:wallTexture,color:0xffffff,side:T.DoubleSide});
 const wallGeo=new T.PlaneGeometry(32,57);
 const wallInstances=new T.InstancedMesh(wallGeo,wallMat,84);
 const mat4=new T.Matrix4(),q=new T.Quaternion(),vec=new T.Vector3(),vscale=new T.Vector3(1,1,1);
 let n=0;
 for(const side of [-1,1]){
   for(let i=0;i<42;i++){
     const z=338-16-i*31;
     if(z<-954)break;
     q.setFromAxisAngle(new T.Vector3(0,1,0),side*Math.PI/2);
     mat4.compose(vec.set(side*102.2,28.5,z),q,vscale);
     wallInstances.setMatrixAt(n++,mat4);
   }
 }
 wallInstances.count=n;wallInstances.instanceMatrix.needsUpdate=true;
 wallInstances.frustumCulled=false;wallInstances.receiveShadow=true;
 wallInstances.name='Tall terracotta canyon (instanced)';
 cliffGroup.add(wallInstances);result.cliffSections=n;
 // A faixa verde no topo é visível do chão, como na referência.
 const topMat=new T.MeshLambertMaterial({color:0x49e330});
 const topGeo=new T.BoxGeometry(2.7,.8,31);
 const tops=new T.InstancedMesh(topGeo,topMat,n);
 let k=0;
 for(const side of [-1,1])for(let i=0;i<42;i++){
   const z=338-16-i*31;if(z<-954)break;
   mat4.compose(vec.set(side*102.2,57.4,z),new T.Quaternion(),vscale);
   tops.setMatrixAt(k++,mat4);
 }
 tops.count=k;tops.instanceMatrix.needsUpdate=true;tops.frustumCulled=false;
 cliffGroup.add(tops);
 // Fechar o extremo distante como no corredor, sem criar uma nova passagem.
 const back=new T.Mesh(new T.PlaneGeometry(207,57),wallMat);
 back.position.set(0,28.5,-956);back.receiveShadow=true;cliffGroup.add(back);
 const backTop=new T.Mesh(new T.BoxGeometry(207,.8,2.5),topMat);
 backTop.position.set(0,57.4,-956);cliffGroup.add(backTop);
 // Ocultar apenas as muralhas de blocos baixas originais, preservando a colisão de x/z.
 sc.children.forEach(obj=>{
   if(!obj.isMesh||obj.geometry?.type!=='BoxGeometry'||Math.abs(obj.scale.y-7)>.01)return;
   const isWall=(Math.abs(obj.position.x)>=100||obj.position.z<=-950||obj.position.z>=338);
   if(isWall){obj.visible=false;result.oldWallsHidden=(result.oldWallsHidden||0)+1}
 });
 // CERCAS: a base do original tem duas travessas laranja e postes pretos, NÃO paredões.
 const wood=new T.MeshLambertMaterial({color:0xc26d29});
 const woodLight=new T.MeshLambertMaterial({color:0xe28d36});
 const iron=new T.MeshLambertMaterial({color:0x2b3039});
 const postGeo=new T.BoxGeometry(.44,2.24,.44);
 const railGeo=new T.BoxGeometry(1,.20,.20);
 function piece(g,m,x,y,z,w,ry=0){
   const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.scale.x=w;
   mesh.rotation.y=ry;mesh.castShadow=false;basePen.add(mesh);return mesh;
 }
 const fencePieces=[[-20,-10,-5,-10],[5,-10,20,-10],[-20,-10,-20,30],
                   [20,-10,20,30],[-20,30,20,30]];
 for(const [x1,z1,x2,z2] of fencePieces){
   const length=Math.hypot(x2-x1,z2-z1),mx=(x1+x2)/2,mz=(z1+z2)/2,angle=-Math.atan2(z2-z1,x2-x1);
   piece(railGeo,wood,mx,.64,mz,length,angle);
   piece(railGeo,woodLight,mx,1.45,mz,length,angle);
   for(let s=0;s<=Math.ceil(length/5);s++){
     const t=s/Math.ceil(length/5),x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;
     const mesh=new T.Mesh(postGeo,iron);mesh.position.set(x,1.12,z);
     basePen.add(mesh);
   }
   result.fenceSections++;
 }
 BASE_GROUP.children.forEach(obj=>{
   if(obj===basePen||!obj.isMesh||obj.geometry?.type!=='BoxGeometry')return;
   if(Math.abs(obj.scale.y-1.6)<.005&&obj.material?.color?.getHex?.()===0xc89b5a){
     obj.visible=false;result.oldFenceHidden++;
   }
 });
 // O portão de cinco metros de largura da frente continua livre e utilizável.
 const banner=document.createElement('canvas');banner.width=512;banner.height=128;
 const ctx=banner.getContext('2d');
 ctx.clearRect(0,0,512,128);
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 81px Arial,sans-serif';
 ctx.strokeStyle='#438dff';ctx.lineWidth=10;ctx.strokeText('SAFE ZONE',256,64);
 ctx.fillStyle='#f5ffff';ctx.fillText('SAFE ZONE',256,64);
 const bannerTex=new T.CanvasTexture(banner);
 const safeMat=new T.MeshBasicMaterial({map:bannerTex,transparent:true,depthWrite:false,side:T.DoubleSide});
 const groundText=new T.Mesh(new T.PlaneGeometry(17,3.4),safeMat);
 groundText.rotation.x=-Math.PI/2;groundText.position.set(0,.13,34.5);
 BASE_GROUP.add(groundText);
 const zoneLine=new T.Mesh(new T.PlaneGeometry(43,.50),
   new T.MeshBasicMaterial({color:0x56bcff,transparent:true,opacity:.8,depthWrite:false}));
 zoneLine.rotation.x=-Math.PI/2;zoneLine.position.set(0,.13,32);BASE_GROUP.add(zoneLine);
 // Arquitetura artificial da atualização anterior sai do caminho; os GLBs
 // Kenney adequados por bioma continuam e as bases funcionam normalmente.
 const old=window.RoubeOvoWorldDetail;
 if(old?.fallbackWorld)old.fallbackWorld.visible=false;
 if(old?.fallbackBase)old.fallbackBase.visible=false;
 // O foco das áreas do original são guardiões grandes, não montes de casinhas.
 if(typeof GD!=='undefined'&&Array.isArray(GD)){
   GD.forEach((guardian,i)=>{
     if(i===3||!guardian?.m)return;
     guardian.m.scale.multiplyScalar(1.34);
   });
 }
 if(typeof raccoonGuard!=='undefined'&&raccoonGuard?.m)raccoonGuard.m.scale.multiplyScalar(1.20);
 // Placas de velocidade posicionadas perto dos ninhos, semelhantes ao jogo Roblox.
 const boardWood=new T.MeshLambertMaterial({color:0x7b421e});
 const boardFrame=new T.MeshLambertMaterial({color:0xb76525});
 for(let b=0;b<Math.min(BI.length,13);b++){
   const z=-65-70*b,x=15.4;
   const panel=new T.Group();panel.position.set(x,0,z+16);root.add(panel);
   for(const xx of [-2.6,2.6]){
     const post=new T.Mesh(new T.BoxGeometry(.40,3.5,.36),boardWood);
     post.position.set(xx,1.75,0);panel.add(post);
   }
   const frame=new T.Mesh(new T.BoxGeometry(6.2,2.6,.31),boardFrame);
   frame.position.set(0,3.25,.03);panel.add(frame);
   const boardCanvas=document.createElement('canvas');boardCanvas.width=512;boardCanvas.height=224;
   const g=boardCanvas.getContext('2d');
   g.fillStyle='#b87536';g.fillRect(0,0,512,224);
   g.strokeStyle='#633914';g.lineWidth=15;g.strokeRect(8,8,496,208);
   g.fillStyle='#ffe7a1';g.textAlign='center';g.textBaseline='middle';
   g.font='bold 46px sans-serif';g.fillText(BI[b].n,256,66,478);
   g.font='bold 36px sans-serif';
   g.fillText(BI[b].req?'SPEED '+(typeof fm==='function'?fm(BI[b].req):BI[b].req):'SPEED LIVRE',256,154,465);
   const tex=new T.CanvasTexture(boardCanvas);
   const face=new T.Mesh(new T.PlaneGeometry(5.7,2.35),
      new T.MeshBasicMaterial({map:tex,transparent:false,side:T.DoubleSide}));
   face.position.set(0,3.25,.21);panel.add(face);
 }
 result.guardiansEnhanced=true;result.speedSigns=Math.min(BI.length,13);
 // O original é colorido, com sol forte e céu azul. O tempo/noite do jogo permanece.
 if(typeof sun!=='undefined')sun.intensity=Math.max(1.1,sun.intensity);
 sc.traverse(o=>{if(o.isHemisphereLight)o.intensity=Math.max(1.04,o.intensity)});
 if(sc.fog){sc.fog.near=100;sc.fog.far=555;}
 result.installed=true;result.mapTheme='bright-studded-roblox';
 window.RoubeOvoMapRebuild=result;
}catch(error){
 console.error('Recriação da arquitetura do mapa:',error);
 window.RoubeOvoMapRebuild={installed:false,error:String(error)};
}
})();
