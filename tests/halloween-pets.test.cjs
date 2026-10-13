'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const THREE=require('../three.min.js');
const source=fs.readFileSync('halloween-pets.js','utf8'),html=fs.readFileSync('index.html','utf8');
const START=Date.parse('2026-10-13T00:00:00-03:00'),END=Date.parse('2026-11-01T00:00:00-03:00');
function catalog(time=START+1000){
 const clock={time};
 class FakeDate extends Date{static now(){return clock.time}}
 const context={window:{},Date:FakeDate,console};vm.runInNewContext(source,context);
 const HW=context.window.RoubeOvoHalloweenPets;
 const SPC=Array.from({length:105},(_,id)=>({id,n:'old-'+id,b:0,r:0,inc:50}));
 const RAR=Array(11).fill('original');const original=JSON.stringify(SPC);
 HW.register(SPC,RAR);return {HW,SPC,RAR,clock,FakeDate,original};
}
test('16 espécies têm IDs estáveis depois de LIMITED, quatro ovos e raridades progressivas',()=>{
 const c=catalog();assert.equal(c.HW.defs.length,16);assert.equal(c.SPC.length,121);
 assert.equal(JSON.stringify(c.SPC.slice(0,105)),c.original);
 assert.deepEqual(Array.from(c.HW.defs,d=>d.id),Array.from({length:16},(_,i)=>105+i));
 assert.equal(new Set(c.HW.defs.map(d=>d.name)).size,16);assert.equal(new Set(c.HW.defs.map(d=>d.kind)).size,16);
 for(let i=0;i<4;i++){
  assert.equal(c.HW.defs.filter(d=>d.tier===i).length,4);
  assert.equal(c.RAR[c.HW.types[i].r],c.HW.types[i].name);
  if(i){assert(c.HW.types[i].chance<c.HW.types[i-1].chance);assert(c.HW.types[i].income>c.HW.types[i-1].income);}
 }
 assert.equal(Math.max(...c.SPC.slice(105).map(s=>s.inc)),c.SPC[120].inc);
 c.HW.register(c.SPC,c.RAR);assert.equal(c.SPC.length,121);
 c.clock.time=END;assert.equal(c.HW.active(),false);
 assert(c.HW.has(120),'animais obtidos continuam disponíveis após terminar o evento');
});
test('todos os modelos e ovos são malhas 3D completas, animadas e sem valores inválidos',()=>{
 const c=catalog(),scene=new THREE.Scene(),sizes=[['P',.8],['M',1],['E',1.4],['G',1.9],['C',12/1.8]];
 const signatures=new Set();
 for(const d of c.HW.defs){
  const g=c.HW.create(THREE,d.id,1,scene);assert.equal(g.name,d.name);
  const meshes=[];g.traverse(o=>{if(o.isMesh)meshes.push(o)});
  assert(meshes.length>=15,d.name+' precisa de anatomia e detalhes próprios');
  signatures.add(JSON.stringify(meshes.map(m=>[m.geometry.type,m.position.toArray(),m.scale.toArray()])));
  g.userData.customUpdate(10,2);g.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(g),size=box.getSize(new THREE.Vector3());
  assert(size.x>.5&&size.y>1&&size.z>.5,d.name+' deve ser visível');
  for(const m of meshes){
   assert(m.material.isMaterial);assert(m.castShadow);
   for(const x of m.matrixWorld.elements)assert(Number.isFinite(x),d.name);
   for(const x of m.geometry.attributes.position.array)assert(Number.isFinite(x),d.name);
  }
  for(let z=0;z<sizes.length;z++){
   const e=c.HW.egg(THREE,{s:d.id,z},sizes,scene);
   assert(e.isGroup&&e.children.length>=5);assert.equal(e.userData.halloweenTier,d.tier);
   assert(e.scale.y>0);assert(e.name.includes(c.HW.types[d.tier].name));scene.remove(e);
  }
  scene.remove(g);
 }
 assert.equal(signatures.size,16);
});
function game(){
 const c=catalog(),storage=new Map(),messages=[],scene=new THREE.Scene();
 const S={pid:'teste',sp:0,$:0,tm:0,bl:0,tr:-1,own:[],pets:[],inc:[null,null,null,null],idx:{},t:START,id:1};
 const SZ=[['Pequeno',.8,1,50],['Médio',1,1.5,35],['Enorme',1.4,3,12],['Gigante',1.9,6,3],['Colossal',12/1.8,10,0]];
 const ctx={HW:c.HW,window:{},T:THREE,S,SPC:c.SPC,RAR:c.RAR,RS:[0,1,2,3,4,7,8,9],SZ,BI:Array(13).fill({n:'Bioma'}),fm:n=>String(n),
  eggs:[],sc:scene,P:{g:new THREE.Group(),x:0,z:8},carry:null,EGG_NIGHT:{phase:'day'},AUR:c.HW.auras,
  KEY:'rue3d_v1',Date:c.FakeDate,storageFailure:false,console,
  document:{getElementById(){return null}},localStorage:{setItem(k,v){storage.set(k,v)}},
  newEgg:undefined,eggMesh:e=>c.HW.egg(THREE,e,SZ,scene),label:()=>new THREE.Object3D(),pick:()=>1,
  mkAura:e=>{e.aura=new THREE.Group();scene.add(e.aura)},rareFx:()=>{},raccoonGuard:null,GD:[],
  LIMITED_ID:104,LIMITED_RATE:1e77,INCUBATOR_MAX_GROWTH:16,MUT:[],beep:()=>{},toast:m=>messages.push(m),
  persistLimitedWorld:()=>{},recalc:()=>{},disposeLimitedAura:()=>{},
  TM:Array(11).fill({}),CAP:Array(12).fill(7),A:{moveMult:1,personalFast:false},
  CFG:{rare:{7:.1,8:.04,9:.005},reset:300,train:5},AS:{},PM:{},styleTM:()=>{},saveAdmin:()=>{},
  LEAD:[],rankSave:()=>{},safePct:(n,v)=>Number.isFinite(n)?n:v};
 const line=p=>html.split('\n').find(l=>l.startsWith(p));
 const fromTo=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
 const code=line('const save=')+'\n'+line('const newEgg=')+'\n'+line('const pinc=')+'\n'+
  fromTo('const spawnHalloweenEgg=','const regrow=')+
  fromTo('const dep=k=>','const fuse=')+fromTo('const adminRestore=obj=>','const adminHandle=')+
  '\nglobalThis.api={spawn:spawnHalloweenEgg,renew:spawnHalloweenNestEggs,deposit:dep,hatch,restore:adminRestore,income:pinc,get state(){return S}};';
 vm.runInNewContext(code,ctx);return {...c,ctx,api:ctx.api,storage,messages};
}
test('ovo de boas-vindas não duplica e os 16 animais passam por incubação, save e restauração',()=>{
 const g=game();g.api.renew(true);assert.equal(g.ctx.eggs.length,1);
 const welcome=g.ctx.eggs[0];assert.equal(welcome.mesh.position.x,12);assert.equal(welcome.mesh.position.z,-47);
 assert.equal(welcome.halloweenWelcome,true);g.api.renew(true);assert.equal(g.ctx.eggs.length,1);
 g.ctx.eggs.splice(0);g.ctx.carry=welcome;g.ctx.P.g.add(welcome.mesh);
 g.api.renew(true);assert.equal(g.ctx.eggs.length,0,'renovar carregando o presente não cria outro');
 g.api.deposit(0);assert.equal(g.ctx.S.halloween2026.welcomeDelivered,true);
 assert.equal(g.ctx.S.inc[0].s,welcome.s);g.api.hatch(0);
 g.api.renew(true);assert.equal(g.ctx.eggs.length,0,'presente não reaparece após ser depositado');
 for(const d of g.HW.defs){
  const e=g.api.spawn(d.tier,3,4,'player',d.id);assert(e&&e.s===d.id&&e.b===3&&e.r===g.HW.types[d.tier].r);
  assert.equal(g.ctx.S.pets.filter(p=>p.s===d.id).length,d.id===welcome.s?1:0,'ovo não vira pet antes de incubar');
  g.ctx.eggs.splice(g.ctx.eggs.indexOf(e),1);g.ctx.carry=e;g.ctx.P.g.add(e.mesh);g.api.deposit(0);
  const s=g.ctx.S.inc[0];assert.deepEqual(Array.from(s.initialScale),e.base.toArray());
  assert(s.b>s.a);assert.equal(s.maxGrowth,16);
  g.api.hatch(0);assert.equal(g.ctx.S.inc[0],null);
  const p=g.ctx.S.pets.at(-1);assert.equal(p.s,d.id);assert.equal(g.ctx.S.idx[d.id],1);
  assert(g.api.income(p)>0);assert(g.messages.at(-1).includes(d.name));
 }
 const snapshot=JSON.parse(g.storage.get('rue3d_v1'));
 assert.equal(snapshot.pets.length,17);assert.equal(snapshot.halloween2026.welcomeDelivered,true);
 g.api.restore({game:snapshot});assert.equal(g.api.state.pets.length,17,'backup aceita IDs novos e ovos colossais');
 assert.equal(g.HW.indexHtml(g.api.state).match(/\(4\/4\)/g).length,4);
 g.clock.time=END;assert.equal(g.api.spawn(0,0),null,'spawn cessa depois de 31/10');
 assert.equal(g.api.state.pets.length,17,'pets ganhos permanecem após o evento');
});
test('incubadora mantém a aparência de Halloween e limpa o estilo para ovos normais',()=>{
 const {HW}=catalog();const mesh=new THREE.Mesh(new THREE.SphereGeometry(1),new THREE.MeshLambertMaterial());
 for(const d of HW.defs){
  HW.styleIncubator(THREE,mesh,d.id);assert.equal(mesh.material.color.getHex(),HW.types[d.tier].color);
  assert(mesh.getObjectByName('HalloweenEggMark'));HW.styleIncubator(THREE,mesh,d.id);
  assert.equal(mesh.children.filter(o=>o.name==='HalloweenEggMark').length,1);
 }
 HW.styleIncubator(THREE,mesh,1);assert.equal(mesh.getObjectByName('HalloweenEggMark'),undefined);
 assert.equal(mesh.material.emissive.getHex(),0);
});
