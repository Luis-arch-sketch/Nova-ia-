'use strict';
/* Praça arredondada com paredes reais. O terreno original é a única
 * superfície de grama: nenhum retângulo escuro ou piso neon sobreposto.
 * As posições das bases, ovos, lojas e os saves permanecem as mesmas.
 */
(()=>{
 try{
  if(window.RoubeOvoPlaza?.installed)return;
  const T=THREE;
  if(typeof sc==='undefined'||typeof BASE_SLOTS==='undefined'||!window.RoubeOvoMapRebuild?.installed)return;
  const architecture=sc.getObjectByName('RoubeOvoMap - original-inspired architecture');
  const cliffs=architecture?.getObjectByName('Terracotta high canyon walls');
  if(!cliffs)throw Error('Paredes do corredor indisponíveis');
  const wallMaterial=cliffs.getObjectByName('Tall terracotta canyon (instanced)').material;
  const root=new T.Group();root.name='Rounded courtyard perimeter - original grass';cliffs.add(root);
  const path=new T.Path();
  path.moveTo(-31,48);
  path.bezierCurveTo(-53,52,-91,34,-94,-40);
  path.lineTo(-94,-250);
  path.bezierCurveTo(-94,-302,-59,-338,0,-338);
  path.bezierCurveTo(59,-338,94,-302,94,-250);
  path.lineTo(94,-40);
  path.bezierCurveTo(91,34,53,52,31,48);
  const edge=path.getSpacedPoints(100).map(p=>({x:p.x,z:-p.y}));
  // Ombros fecham o encontro com os muros do corredor. A boca central
  // continua livre e as duas lojas ficam no lado público da entrada.
  edge.unshift({x:-102.2,z:-48});
  edge.push({x:102.2,z:-48});
  const positions=[],uv=[],indices=[],height=24;
  const topPositions=[],topIndices=[],obstacles=[];
  let distance=0;
  for(let i=0;i<edge.length-1;i++){
   const a=edge[i],b=edge[i+1],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
   if(length<.001)continue;
   const n=positions.length/3,u=distance/32,v=(distance+length)/32;
   positions.push(a.x,-.08,a.z,b.x,-.08,b.z,b.x,height,b.z,a.x,height,a.z);
   uv.push(u,0,v,0,v,1,u,1);
   indices.push(n,n+1,n+2,n,n+2,n+3);
   const nx=-dz/length*.85,nz=dx/length*.85,t=topPositions.length/3;
   topPositions.push(a.x+nx,height+.05,a.z+nz,b.x+nx,height+.05,b.z+nz,
     b.x-nx,height+.05,b.z-nz,a.x-nx,height+.05,a.z-nz);
   topIndices.push(t,t+1,t+2,t,t+2,t+3);
   const steps=Math.ceil(length/2);
   for(let j=0;j<steps;j++)obstacles.push({x:a.x+dx*j/steps,z:a.z+dz*j/steps,r:1.15});
   distance+=length;
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const wall=new T.Mesh(geometry,wallMaterial);wall.name='Continuous curved courtyard wall';wall.receiveShadow=true;root.add(wall);
  const topGeometry=new T.BufferGeometry();
  topGeometry.setAttribute('position',new T.Float32BufferAttribute(topPositions,3));
  topGeometry.setIndex(topIndices);topGeometry.computeVertexNormals();
  const cap=new T.Mesh(topGeometry,new T.MeshLambertMaterial({color:0x62b746,side:T.DoubleSide}));
  cap.name='Continuous courtyard wall trim';root.add(cap);
  // Reutiliza a colisão contínua existente, que também funciona em alta Speed.
  OB.push(...obstacles);
  window.RoubeOvoPlaza={
   installed:true,version:'20261103-continuous-walls-no-overlay',
   shape:'rounded-wide-base-forecourt-and-winding-biome-connector',
   originalGrassPreserved:true,darkOverlayRemoved:true,frontWallAdded:true,
   slots:BASE_SLOTS.length,visibleEmptyPeerBases:false,sharedShops:true,
   curvedWallSections:edge.length-1,wallObstacles:obstacles.length,
   servicePositions:[[-66,-24],[-41,-24]],group:root
  };
 }catch(err){
  console.error('Correção das paredes do mapa:',err);
  window.RoubeOvoPlaza={installed:false,error:String(err)};
 }
})();

