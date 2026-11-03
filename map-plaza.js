'use strict';
/* Planta do mapa Roube um Ovo: praça ampla com cabeceira arredondada,
 * corredor de conexão suavemente curvo e lojas públicas junto à entrada.
 * A geometria é APENAS visual: preserva coordenadas de ovos, 16 slots,
 * colisões, saves e a sincronização do servidor multiplayer.
 */
(()=>{
 try{
  if(window.RoubeOvoPlaza?.installed)return;
  const T=THREE;
  if(typeof sc==='undefined'||typeof BASE_SLOTS==='undefined'||!window.RoubeOvoMapRebuild?.installed)return;
  const root=new T.Group();root.name='Roube Ovo - irregular plaza and curved entrance';sc.add(root);
  const frame=new T.Group();frame.name='Rounded forecourt footprint';root.add(frame);
  const floorMaterial=new T.MeshLambertMaterial({color:0x5cdf45,side:T.DoubleSide});
  const studColor=new T.MeshLambertMaterial({color:0x86fa62,transparent:true,opacity:.85,depthWrite:false});
  // Escurece o terreno apenas por baixo da nova silhueta, sem afetar colisões.
  const shadow=new T.Mesh(new T.PlaneGeometry(203,382),
    new T.MeshBasicMaterial({color:0x284c36,side:T.DoubleSide,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.077,146);root.add(shadow);
  const trace=new T.Shape();
  const go=(x,z)=>trace.moveTo(x,-z);
  const line=(x,z)=>trace.lineTo(x,-z);
  const curve=(x1,z1,x2,z2,x3,z3)=>trace.bezierCurveTo(x1,-z1,x2,-z2,x3,-z3);
  // Boca estreita na saída para os biomas; ampla clareira das bases e
  // extremidade arredondada do pátio. As 16 bases cabem dentro do perímetro.
  go(-31,-48);
  curve(-53,-52,-91,-34,-94,40);
  line(-94,250);
  curve(-94,302,-59,340,0,340);
  curve(59,340,94,302,94,250);
  line(94,40);
  curve(91,-34,53,-52,31,-48);
  line(-31,-48);
  trace.closePath();
  // Repetição da textura de blocos elevados, visível de cima no Android.
  const tile=document.createElement('canvas');tile.width=tile.height=128;
  const pen=tile.getContext('2d');
  pen.fillStyle='#f5fff0';pen.fillRect(0,0,128,128);
  for(let yy=0;yy<4;yy++)for(let xx=0;xx<4;xx++){
    const x=xx*32,y=yy*32;
    pen.fillStyle='#d4dfd1';pen.fillRect(x+6,y+8,19,17);
    pen.fillStyle='#fbfff8';pen.fillRect(x+7,y+7,15,13);
    pen.fillStyle='#a7bda0';pen.fillRect(x+8,y+22,16,3);
  }
  const texture=new T.CanvasTexture(tile);
  texture.wrapS=texture.wrapT=T.RepeatWrapping;
  texture.repeat.set(.035,.035);texture.anisotropy=4;
  floorMaterial.map=texture;floorMaterial.needsUpdate=true;
  const plaza=new T.Mesh(new T.ShapeGeometry(trace,22),floorMaterial);
  plaza.rotation.x=-Math.PI/2;plaza.position.y=.109;plaza.receiveShadow=true;
  plaza.name='Rounded Roblox studded base plaza';frame.add(plaza);
  // A borda verde-limão segue exatamente as curvas da praça.
  const outline=trace.getPoints(144);
  const borderPoints=outline.map(p=>new T.Vector3(p.x,.15,-p.y));
  const border=new T.LineLoop(new T.BufferGeometry().setFromPoints(borderPoints),
    new T.LineBasicMaterial({color:0xd6ff8e,transparent:true,opacity:.95}));
  border.name='Curved plaza outline';frame.add(border);

  // Substitui visualmente as laterais retas da antiga área das bases por
  // uma borda 3D acompanhando a planta arredondada. O corredor dos biomas
  // continua com as suas muralhas originais. Obstáculos ficam intocados.
  const mapArchitecture=sc.getObjectByName('RoubeOvoMap - original-inspired architecture');
  const formerCliffs=mapArchitecture?.getObjectByName('Terracotta high canyon walls');
  let straightHidden=0;
  if(formerCliffs){
   const matrix=new T.Matrix4(),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();
   formerCliffs.children.forEach(inst=>{
    if(!inst.isInstancedMesh)return;
    for(let i=0;i<inst.count;i++){
     inst.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
     if(position.z>-58){
      scale.set(.00001,.00001,.00001);
      matrix.compose(position,rotation,scale);
      inst.setMatrixAt(i,matrix);
      straightHidden++;
     }
    }
    inst.instanceMatrix.needsUpdate=true;
   });
  }
  const curvedWalls=new T.Group();
  curvedWalls.name='Curved terracotta courtyard walls';root.add(curvedWalls);
  const oldFace=formerCliffs?.children.find(x=>x.isInstancedMesh&&x.geometry?.type==='PlaneGeometry')?.material;
  const wallFace=oldFace||new T.MeshLambertMaterial({color:0xe1a16f,side:T.DoubleSide});
  const topFace=new T.MeshLambertMaterial({color:0x54da34});
  let curvedSections=0;
  const edge=trace.getSpacedPoints(96);
  // Um único draw call para todos os paredões, outro para as bordas.
  // Muito mais leve que mais de 140 malhas individuais nos celulares Android.
  const wallInstances=new T.InstancedMesh(new T.PlaneGeometry(1,28),wallFace,edge.length);
  const trimInstances=new T.InstancedMesh(new T.BoxGeometry(1,.75,2),topFace,edge.length);
  const matrix4=new T.Matrix4(),yAxis=new T.Vector3(0,1,0);
  const pos=new T.Vector3(),orient=new T.Quaternion(),scale3=new T.Vector3();
  for(let i=0;i<edge.length-1;i++){
   const a=edge[i],b=edge[i+1],az=-a.y,bz=-b.y;
   if((az+bz)/2<12)continue; // Passagem aberta: saída para os biomas e máquinas.
   const dx=b.x-a.x,dz=bz-az,length=Math.hypot(dx,dz);
   if(length<.1)continue;
   const angle=-Math.atan2(dz,dx),x=(a.x+b.x)/2,z=(az+bz)/2;
   orient.setFromAxisAngle(yAxis,angle);scale3.set(length+.10,1,1);
   matrix4.compose(pos.set(x,14.2,z),orient,scale3);
   wallInstances.setMatrixAt(curvedSections,matrix4);
   matrix4.compose(pos.set(x,28.55,z),orient,scale3);
   trimInstances.setMatrixAt(curvedSections,matrix4);
   curvedSections++;
  }
  for(const mesh of [wallInstances,trimInstances]){
   mesh.count=curvedSections;mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;
   curvedWalls.add(mesh);
  }

  // Caminho visual suavemente sinuoso; mantém a passagem de guardiões e ovos.
  const route=new T.Group();route.name='Winding public arrival walkway';root.add(route);
  const nodes=[[-1,-131],[8,-111],[10,-97],[0,-79],[-8,-65],[-3,-51],[0,-42],[5,-29],[0,-13]];
  const center=new T.CatmullRomCurve3(nodes.map(([x,z])=>new T.Vector3(x,.14,z)));
  const samples=center.getPoints(100),l=[],r=[];
  const width=8.2;
  for(let i=0;i<samples.length;i++){
    const p=samples[i],previous=samples[Math.max(0,i-1)],next=samples[Math.min(samples.length-1,i+1)];
    const dx=next.x-previous.x,dz=next.z-previous.z,mag=Math.hypot(dx,dz)||1;
    const nx=-dz/mag,nz=dx/mag;
    l.push(new T.Vector3(p.x+nx*width/2,.141,p.z+nz*width/2));
    r.push(new T.Vector3(p.x-nx*width/2,.141,p.z-nz*width/2));
  }
  const verts=[],uv=[];
  for(let i=0;i<samples.length-1;i++){
    const c=[l[i],r[i],l[i+1],r[i],r[i+1],l[i+1]];
    c.forEach(p=>{verts.push(p.x,p.y,p.z);uv.push(p.x/6,p.z/6)});
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(verts,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
  const road=new T.Mesh(geometry,new T.MeshBasicMaterial({color:0xe1ffbf,transparent:true,opacity:.18,side:T.DoubleSide,depthWrite:false}));
  road.name='Curved path no collision';route.add(road);
  // Pequenos detalhes em frente aos serviços, sempre na parte pública.
  const serviceMat=new T.MeshLambertMaterial({color:0x4c7b56,transparent:true,opacity:.85});
  for(const [x,z] of [[-66,-24],[-41,-24]]){
    const pad=new T.Mesh(new T.CylinderGeometry(7.7,8.2,.32,28),serviceMat);
    pad.position.set(x,.14,z);pad.name='Shared service floor';frame.add(pad);
  }
  // Referência dos slots usada somente para validação visual. A autoridade
  // sobre as bases continua sendo o servidor (apenas jogadores conectados).
  const slots=BASE_SLOTS.map((p,i)=>({index:i,x:p.x,z:p.z}));
  if(slots.some(p=>Math.abs(p.x)>74||p.z<0||p.z>285))throw Error('Slots fora do pátio');
  window.RoubeOvoPlaza={installed:true,version:'20261102-rounded-plaza-v1',
    shape:'rounded-wide-base-forecourt-and-winding-biome-connector',
    slots:slots.length,visibleEmptyPeerBases:false,sharedShops:true,straightWallsHidden:straightHidden,curvedWallSections:curvedSections,
    servicePositions:[[-66,-24],[-41,-24]],group:root};
 }catch(err){
  console.error('Praça curvada:',err);
  window.RoubeOvoPlaza={installed:false,error:String(err)};
 }
})();
