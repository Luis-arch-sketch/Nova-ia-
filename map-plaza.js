'use strict';
/* Correção visual: mantém o chão e os elementos originais intactos.
 * A parede frontal fecha o perímetro; os muros laterais e o fundo são
 * construídos por world-remake.js, sem cobrir a grama com novos planos.
 * Apenas geometria visual: saves, spawns, bases, físicas e salas permanecem.
 */
(()=>{
 try{
  if(window.RoubeOvoPlaza?.installed)return;
  const T=THREE;
  if(typeof sc==='undefined'||typeof BASE_SLOTS==='undefined'||!window.RoubeOvoMapRebuild?.installed)return;
  const architecture=sc.getObjectByName('RoubeOvoMap - original-inspired architecture');
  const cliffs=architecture?.getObjectByName('Terracotta high canyon walls');
  if(!cliffs)throw Error('Paredes originais indisponíveis');
  const sideWall=cliffs.getObjectByName('Tall terracotta canyon (instanced)');
  const wallMat=sideWall?.material||new T.MeshLambertMaterial({color:0xdca477,side:T.DoubleSide});
  const trimMat=new T.MeshLambertMaterial({color:0x62b746});
  const wallHeight=24;
  const root=new T.Group();
  root.name='Perimeter wall only - original grass preserved';
  cliffs.add(root);
  // O limite frontal ficava aberto; fecha o perímetro sem alterar o terreno.
  const wall=new T.Mesh(new T.PlaneGeometry(204,wallHeight),wallMat);
  wall.name='Front courtyard boundary wall';
  wall.position.set(0,wallHeight/2,338.8);
  wall.receiveShadow=true;
  root.add(wall);
  const cap=new T.Mesh(new T.BoxGeometry(206,.8,2.4),trimMat);
  cap.name='Front wall top trim';
  cap.position.set(0,wallHeight+.4,338.8);
  root.add(cap);
  const slots=BASE_SLOTS.map((p,i)=>({index:i,x:p.x,z:p.z}));
  window.RoubeOvoPlaza={
    installed:true,
    version:'20261103-original-ground-wall-fix',
    shape:'original-terrain-with-perimeter-walls',
    originalGrassPreserved:true,
    darkOverlayRemoved:true,
    frontWallAdded:true,
    slots:slots.length,
    visibleEmptyPeerBases:false,
    sharedShops:true,
    servicePositions:[[-66,-24],[-41,-24]],
    group:root
  };
 }catch(err){
  console.error('Correção das paredes do mapa:',err);
  window.RoubeOvoPlaza={installed:false,error:String(err)};
 }
})();
