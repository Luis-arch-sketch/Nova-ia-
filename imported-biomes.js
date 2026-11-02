/* Roube um Ovo — modelos 3D reais licenciados CC0, separados por bioma.
 * Kenney.nl / Hidencod tge-assets. Os GLBs vêm da biblioteca pública,
 * com cache na origem, sem substituir saves, rede, ninhos ou colisões.
 */
(()=>{
'use strict';
const MANIFEST={"biomes":[["nature-kit/tree-detailed","nature-kit/tree-oak","nature-kit/plant-bushdetailed","nature-kit/mushroom-redgroup","nature-kit/rock-largea"],["nature-kit/tree-palmdetailedshort","nature-kit/plant-flattall","nature-kit/cliff-waterfall-rock","nature-kit/plant-bushlarge","nature-kit/rock-largeb"],["nature-kit/cactus-tall","nature-kit/cactus-short","nature-kit/rock-talla","pirate-kit/rocks-sand-a","nature-kit/tree-plateau-fall"],["nature-kit/tree-palmdetailedtall","nature-kit/tree-tall-dark","nature-kit/plant-bushlarge","pirate-kit/palm-detailed-bend","nature-kit/rock-larged"],["platformer-kit/tree-pine-snow","platformer-kit/tree-snow","tower-defense-kit/snow-detail-crystal-large","nature-kit/rock-largeb","graveyard-kit/pine"],["space-kit/meteor-detailed","space-kit/rock-largea","graveyard-kit/rocks-tall","space-kit/rock-crystals","nature-kit/rock-talli"],["pirate-kit/rocks-b","nature-kit/plant-flattall","tower-defense-kit/detail-crystal","nature-kit/rock-tallg","pirate-kit/grass-plant"],["space-kit/bones","pirate-kit/palm-detailed-straight","nature-kit/rock-largee","nature-kit/tree-fat","nature-kit/log-large"],["space-kit/meteor","space-kit/rock-crystalslargea","space-kit/rock-crystalslargeb","space-kit/alien","tower-defense-kit/detail-crystal-large"],["nature-kit/tree-oak","nature-kit/tree-tall","nature-kit/tree-detailed","nature-kit/flower-redb","nature-kit/plant-bushdetailed"],["graveyard-kit/pillar-obelisk","graveyard-kit/column-large","castle-kit/tower-hexagon-base","castle-kit/tower-hexagon-mid","castle-kit/rocks-large"],["castle-kit/tower-hexagon-mid","graveyard-kit/pillar-obelisk","graveyard-kit/altar-stone","space-kit/rock-crystalslargea","pirate-kit/castle-gate"],["nature-kit/mushroom-redgroup","nature-kit/mushroom-redtall","nature-kit/tree-detailed","tower-defense-kit/detail-crystal-large","nature-kit/flower-purpleb"]],"bases":["city-kit-suburban/tree-large","city-kit-suburban/planter","nature-kit/plant-bushdetailed","city-kit-suburban/path-stones-messy"],"source":"https://hidencod.github.io/tge-assets/packs/","license":"CC0-1.0","credits":"Kenney.nl; https://github.com/Hidencod/tge-assets"};
const state=window.RoubeOvoImportedModels={
 provider:'Kenney (CC0)',source:'Hidencod/tge-assets',installed:false,
 loadedTypes:0,failedTypes:0,modelsByBiome:Array(13).fill(0),requestedTypes:0,
 cachedModels:0,assets:MANIFEST.biomes,errors:[],license:'CC0-1.0'
};
if(typeof THREE==='undefined'||!THREE.GLTFLoader||typeof sc==='undefined'||typeof BASE_GROUP==='undefined') {
 state.errors.push('Renderer ou GLTFLoader indisponível');return;
}
const T=THREE,loader=new T.GLTFLoader();
loader.setCrossOrigin('anonymous');
const groups=MANIFEST.biomes.map((_,b)=>{const g=new T.Group();g.name='Kenney CC0 - '+(b+1);sc.add(g);return g});
const cache=new Map(),inProgress=new Set(),done=new Set(),failed=new Set();
let hideOld=false;
const rnd=n=>{const v=Math.sin(n*78.233+53.19)*43758.5453;return v-Math.floor(v)};
const make=(id)=>{if(cache.has(id))return cache.get(id);
 const url=MANIFEST.source+id+'.glb';
 const result=new Promise((resolve,reject)=>loader.load(url,glb=>resolve(glb),undefined,reject));
 cache.set(id,result);return result;
};
const isGreen=material=>material?.color&&material.color.g>material.color.r*1.17&&material.color.g>material.color.b*1.10;
function themed(m,biome,x){
 if(![4,5,6,8,9,11,12].includes(biome))return m;
 const material=m.clone();if(!material.color)return m;
 if(biome===9&&isGreen(material))material.color.setHex(0xff9ac8);
 if(biome===4&&isGreen(material))material.color.setHex(0xc3ecff);
 if(biome===6&&isGreen(material))material.color.setHex(0x60c5b4);
 if(biome===12&&isGreen(material))material.color.setHex(0x9f7ce6);
 if(biome===5&&isGreen(material))material.color.setHex(0x6b393c);
 if(biome===8&&isGreen(material))material.color.setHex(0x7771d5);
 if(biome===11){
   if(isGreen(material))material.color.setHex(x<0?0xeedca5:0x713540);
   if(x>0&&material.color.r>.5&&material.color.b>.5)material.color.setHex(0xb4576b);
 }
 return material;
}
// Espalhar modelos fora dos oito ninhos e do caminho de roubo original.
function spots(b,slot,id){
 const places=[],zc=-65-70*b;
 const flowers=/flower|plant-|mushroom|grass/.test(id);
 const structure=/castle-|tower-|column|pillar|altar|gate/.test(id);
 const stones=/rock|meteor|bones|crystal|cliff/.test(id);
 const n=structure?3:flowers?12:stones?8:10;
 const height=structure?9:flowers?1.4:stones?3.7:9;
 for(let i=0;i<n;i++){
   const seed=181*b+slot*131+i*47+17,side=(i+slot)%2?-1:1;
   let x=side*(34+rnd(seed+7)*60),z=zc-28+rnd(seed+19)*56;
   if(structure){x=side*(57+rnd(seed+2)*29);z=zc+(i-1)*17;}
   // O jogador ainda alcança todos os ovos: apenas ornamentação, sem alterar a colisão.
   const variation=.78+rnd(seed+33)*.52;
   places.push({x,y:.03,z,height:height*variation,turn:rnd(seed+9)*Math.PI*2});
 }
 return places;
}
function instance(glb,locations,target,biome){
 const model=glb.scene||glb.scenes?.[0];if(!model)return 0;
 model.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(model);
 if(bounds.isEmpty())return 0;
 const size=new T.Vector3();bounds.getSize(size);
 const center=new T.Vector3();bounds.getCenter(center);
 const anchor=new T.Matrix4().makeTranslation(-center.x,-bounds.min.y,-center.z);
 let created=0;
 model.traverse(child=>{
   if(!child.isMesh||!child.geometry)return;
   // Batching: cada parte do GLB vira UMA InstancedMesh por área.
   const mat=Array.isArray(child.material)?child.material.map(m=>themed(m,biome,locations[0]?.x||0)):themed(child.material,biome,locations[0]?.x||0);
   const inst=new T.InstancedMesh(child.geometry,mat,locations.length);
   inst.name='Kenney '+biome+' - '+child.name;
   inst.castShadow=false;inst.receiveShadow=false;
   const matrix=new T.Matrix4(),basis=new T.Matrix4(),translation=new T.Vector3();
   const quat=new T.Quaternion(),rot=new T.Quaternion(),scale=new T.Vector3(),up=new T.Vector3(0,1,0);
   locations.forEach((loc,j)=>{
     const h=Math.max(.2,size.y),factor=Math.min(24,Math.max(.25,loc.height/h));
     quat.setFromAxisAngle(up,loc.turn);
     basis.compose(translation.set(loc.x,loc.y,loc.z),quat,scale.setScalar(factor));
     matrix.copy(basis).multiply(anchor).multiply(child.matrixWorld);
     inst.setMatrixAt(j,matrix);
   });
   inst.instanceMatrix.needsUpdate=true;
   inst.frustumCulled=false;target.add(inst);created++;
 });
 return created;
}
function patchFallback(){
 const old=window.RoubeOvoWorldDetail;
 // Esconder as casas artificiais quando o jogo já tem uma seleção de GLBs disponíveis.
 if(!hideOld&&state.loadedTypes>=10&&old?.fallbackWorld){
   old.fallbackWorld.visible=false;hideOld=true;state.oldSceneryReplaced=true;
 }
}
function loadAsset(b,slot,id,target,locations){
 const key=b+':'+id;
 if(inProgress.has(key)||done.has(key)||failed.has(key))return;
 inProgress.add(key);state.requestedTypes++;
 make(id).then(glb=>{
   const count=instance(glb,locations,target,b);
   if(!count)throw Error('GLB vazio');
   done.add(key);state.loadedTypes++;state.cachedModels=cache.size;
   if(b>=0)state.modelsByBiome[b]++;
   state.installed=true;patchFallback();
 }).catch(e=>{
   failed.add(key);state.failedTypes++;
   if(state.errors.length<10)state.errors.push(id+': '+(e?.message||'falha de conexão'));
 }).finally(()=>inProgress.delete(key));
}
function update(){
 const z=(typeof P==='object'&&Number.isFinite(P.z))?P.z:8;
 for(let b=0;b<groups.length;b++){
   const dist=Math.abs(z-(-65-70*b));
   groups[b].visible=dist<200;
   if(dist>260)continue;
   MANIFEST.biomes[b].forEach((id,slot)=>{
     loadAsset(b,slot,id,groups[b],spots(b,slot,id));
   });
 }
 // O local de cada base é o mesmo grupo controlado pelo multiplayer.
 if(!state.baseRequested){
   state.baseRequested=true;
   const starts=[
     [{x:-17,y:.03,z:25,height:6,turn:0},{x:17,y:.03,z:25,height:6,turn:1}],
     [{x:-16,y:.02,z:17,height:1.8,turn:0},{x:16,y:.02,z:17,height:1.8,turn:1}],
     [{x:-18,y:.02,z:-1,height:2,turn:0},{x:18,y:.02,z:-1,height:2,turn:1}],
     [{x:-9,y:.03,z:-6,height:.55,turn:0},{x:9,y:.03,z:-6,height:.55,turn:0}]
   ];
   MANIFEST.bases.forEach((id,j)=>loadAsset(-1,j,id,BASE_GROUP,starts[j]));
 }
 patchFallback();
}
update();
setInterval(update,700);
})();