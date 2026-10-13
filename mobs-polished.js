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
function create(T,id,k,scene){
 const name=source.names[id];if(!name)return source.create(T,id,k,scene);
 const g=source.create(T,id,k,scene);if(!g)return null;
 const root=g.children[0],body=root.children.find(o=>o.isMesh);
 if(!body)return g;
 body.geometry=smooth(T,body.geometry,name);
 body.material=new T.MeshLambertMaterial({color:colors[name],side:T.DoubleSide,transparent:name==='fantasma',opacity:name==='fantasma'?.87:1,emissive:name==='fantasma'?0x364e82:0x000000,emissiveIntensity:name==='fantasma'?.28:0});
 body.castShadow=name!=='fantasma';body.receiveShadow=true;
 if(name==='escorpiao'){body.scale.y=3.0;body.position.y=.06}
 else if(name==='trex'){body.scale.set(1.65,2.4,2.2)}
 else if(name==='kitsune'){body.scale.set(1.15,1.35,1.15)}
 else if(name==='galinha'){body.scale.set(1.0,1.05,1.0)}
 else if(name==='fantasma'){body.scale.set(1.02,1.02,1.02);body.position.y=.25}
 function orb(color,rad,x,y,z,scale){
  const ob=new T.Mesh(new T.SphereGeometry(rad,10,8),new T.MeshLambertMaterial({color,emissive:color===0xffcf4d?0x9a4500:0x000000}));
  ob.position.set(x,y,z);if(scale)ob.scale.set(scale[0],scale[1],scale[2]);root.add(ob);return ob;
 }
 function tip(color,r,h,x,y,z,rot=0){
  const t=new T.Mesh(new T.ConeGeometry(r,h,8),new T.MeshLambertMaterial({color}));t.position.set(x,y,z);t.rotation.x=rot;root.add(t);return t;
 }
 if(name==='fantasma'){
  for(const x of [-.26,.26])orb(0x172743,.11,x,1.48,.49,[.77,1.32,.5]);
  orb(0x375f96,.13,0,1.10,.48,[1,.44,.3]);
 }
 if(name==='galinha'){
  orb(0xf6a52e,.16,0,1.48,.46,[.95,.55,1.35]);
  for(let x=-1;x<=1;x++)orb(0xc83133,.14,x*.17,2.04,.06,[.75,1.25,.8]);
  for(const x of [-.24,.24])orb(0x161616,.09,x,1.69,.35);
 }
 if(name==='kitsune'){
  for(const x of [-.22,.22]){orb(0x291814,.08,x,1.28,.47);tip(0xf6e2b6,.19,.40,x*1.5,1.69,.1)}
  orb(0xffe3bb,.19,0,1.03,.48,[1.3,.7,.55]);
 }
 if(name==='trex'){
  for(const x of [-.16,.16])orb(0xffcf4d,.075,x,.94,1.06);
  for(let i=0;i<5;i++)tip(0x2c5c39,.07,.22,0,1.02,0.9-i*.24,.35);
 }
 if(name==='escorpiao'){
  for(const x of [-.3,.3])orb(0xf8a254,.07,x,.36,.46);
  orb(0x4d261b,.18,0,.41,-.42,[.55,1.15,.55]);
 }
 const bottom=name==='fantasma'?.10:0;
 g.userData.customUpdate=(time,phase)=>{
  const t=time*1.8+(phase||0)*.55;
  if(name==='fantasma'){root.position.y=bottom+Math.sin(t)*.11;root.rotation.y=Math.sin(t*.33)*.11}
  else {root.position.y=bottom+Math.abs(Math.sin(t))*.018;root.rotation.y=Math.sin(t*.35)*.035}
 };
 g.userData.modelVersion='STL/3MF smoothed mobile v4';
 g.userData.speciesId=id;
 return g;
}
window.RoubeOvoUserMobs={...source,create,polished:true};
})();