/* Mob models v4: smoothed 3D silhouettes, color details & proportional animation.
   Keeps original STL/3MF-derived mesh data and all saved species IDs. */
(function(){
'use strict';
const source=window.RoubeOvoUserMobs;
if(!source||source.polished)return;
const colors={galinha:0xffe1ac,escorpiao:0x8d4d30,trex:0x438459,fantasma:0xe2f3ff,kitsune:0xf18945};
const cache=new Map();
function smooth(T,old,name){
 if(cache.has(name))return cache.get(name);
 const raw=old.getAttribute('position').array,faces=old.index.array;
 const verts=[],remap=new Uint32Array(raw.length/3),keys=new Map();
 for(let i=0;i<remap.length;i++){
  const x=raw[3*i],y=raw[3*i+1],z=raw[3*i+2];
  const key=Math.round(x*20000)+','+Math.round(y*20000)+','+Math.round(z*20000);
  let j=keys.get(key);if(j===undefined){j=verts.length/3;keys.set(key,j);verts.push(x,y,z)}remap[i]=j;
 }
 const idx=new Array(faces.length),near=Array.from({length:verts.length/3},()=>new Set());
 for(let i=0;i<faces.length;i+=3){
  const a=remap[faces[i]],b=remap[faces[i+1]],c=remap[faces[i+2]];
  idx[i]=a;idx[i+1]=b;idx[i+2]=c;
  if(a!==b&&b!==c&&a!==c){near[a].add(b).add(c);near[b].add(a).add(c);near[c].add(a).add(b)}
 }
 let pos=verts;
 for(let pass=0;pass<3;pass++){
  const out=pos.slice(),alpha=pass===2?0.21:0.31;
  for(let i=0;i<near.length;i++){
   const n=near[i];if(n.size<3)continue;
   let x=0,y=0,z=0;
   for(const j of n){x+=pos[j*3];y+=pos[j*3+1];z+=pos[j*3+2]}
   out[i*3]=pos[i*3]*(1-alpha)+alpha*x/n.size;
   out[i*3+1]=pos[i*3+1]*(1-alpha)+alpha*y/n.size;
   out[i*3+2]=pos[i*3+2]*(1-alpha)+alpha*z/n.size;
  }pos=out;
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 geo.setIndex(idx);geo.computeVertexNormals();geo.computeBoundingSphere();cache.set(name,geo);
 return geo;
}
// Mantém somente a malha 3D verdadeira: sem cabeça extra, olhos-bolota,
// espinhos improvisados ou segunda Kitsune empilhada.
const relativeSizes={galinha:1.32,escorpiao:1.40,trex:1.80,kitsune:1.42};
function create(T,id,k,scene){
 const name=source.names[id];
 if(!name||name==='fantasma')return source.create(T,id,k,scene);
 const g=source.create(T,id,k,scene);
 if(!g)return null;
 const root=g.children.find(child=>child.isGroup);
 const body=root?.children.find(child=>child.isMesh);
 if(!body)return g;
 // O arquivo original STL/3MF sempre tem prioridade à malha de emergência em blocos.
 if(!g.userData.realMesh)body.geometry=smooth(T,body.geometry,name);
 body.scale.set(1,1,1);
 body.position.set(0,g.userData.realMesh?.04:0,0);
 body.material=new T.MeshLambertMaterial({color:colors[name],side:T.DoubleSide});
 body.castShadow=true;body.receiveShadow=true;
 g.scale.setScalar(k*(relativeSizes[name]||1));
 g.userData.customUpdate=(time,phase)=>{
  const tick=time*1.6+(phase||0)*.35;
  root.position.y=Math.abs(Math.sin(tick))*.014;
  root.rotation.y=Math.sin(tick*.32)*.025;
 };
 g.userData.modelVersion='STL/3MF original limpo v5';
 g.userData.speciesId=id;
 return g;
}
window.RoubeOvoUserMobs={...source,create,polished:true};
})();