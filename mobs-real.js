/* Original user STL/3MF polygon meshes, mobile LOD. Source data assembled server-side. */
(function(){
'use strict';
const source=window.RoubeOvoUserMobs;
if(!source)return;
const NAMES=['galinha','escorpiao','trex','fantasma','kitsune'];
const encoded=atob(__MOB_DATA__);
const bytes=new Uint8Array(encoded.length);
for(let i=0;i<encoded.length;i++)bytes[i]=encoded.charCodeAt(i);
if(String.fromCharCode(...bytes.slice(0,5))!=='MOBS3')throw Error('Dados 3D inválidos');
let cursor=5;const meshes={};
const read16=()=>bytes[cursor++]|(bytes[cursor++]<<8);
for(const name of NAMES){
 const vertCount=read16(),triCount=read16(),vertices=new Float32Array(vertCount*3);
 if(vertCount<100||vertCount>4000||triCount<100||triCount>10000)throw Error('Tamanho da malha inválido');
 for(let i=0;i<vertCount;i++){
  vertices[3*i]=(bytes[cursor++]/255)*1.2-.60;
  vertices[3*i+1]=(bytes[cursor++]/255)*1.15-.05;
  vertices[3*i+2]=(bytes[cursor++]/255)*1.2-.60;
 }
 const indexes=new Uint16Array(triCount*3);let prior=0;
 for(let i=0;i<indexes.length;i++){
  let val=0,shift=0,ch;
  do{ch=bytes[cursor++];if(ch===undefined||shift>28)throw Error('Malha truncada');val|=(ch&127)<<shift;shift+=7}while(ch&128);
  prior+=(val>>>1)^-(val&1);
  if(prior<0||prior>=vertCount)throw Error('Índice 3D inválido');
  indexes[i]=prior;
 }
 meshes[name]={vertices,indexes,geo:null};
}
if(cursor!==bytes.length)throw Error('Bloco 3D com dados extras');
function create(T,id,k,scene){
 const name=source.names[id];if(!meshes[name])return source.create(T,id,k,scene);
 const model=meshes[name];if(!model.geo){
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.BufferAttribute(model.vertices,3));
  geo.setIndex(new T.BufferAttribute(model.indexes,1));
  geo.computeVertexNormals();geo.computeBoundingSphere();
  model.geo=geo;
 }
 const g=new T.Group(),root=new T.Group();g.add(root);
 const mesh=new T.Mesh(model.geo,new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide}));
 mesh.castShadow=true;root.add(mesh);
 g.userData.speciesId=id;g.userData.realMesh=true;
 g.userData.modelVersion='Original STL/3MF polygon LOD';
 g.scale.setScalar(k);scene.add(g);return g;
}
window.RoubeOvoUserMobs={...source,create,originalMeshes:true};
})();
