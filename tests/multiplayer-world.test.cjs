'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {World,baseSpawn,meetingSpawn}=require('../multiplayer-world.cjs');
test('amigos ficam visíveis nas duas câmeras, inclusive em celular vertical e câmera girada',()=>{
 const T=require('../three.min.js');
 function visible(viewer,subject,aspect){
  const c=new T.PerspectiveCamera(62,aspect,.5,900),angle=viewer.cameraYaw||0,dist=9,pitch=.45,target=new T.Vector3(viewer.x,2.2,viewer.z);
  c.position.set(viewer.x+Math.sin(angle)*Math.cos(pitch)*dist,target.y+Math.sin(pitch)*dist,viewer.z+Math.cos(angle)*Math.cos(pitch)*dist);c.lookAt(target);c.updateMatrixWorld();
  const p=new T.Vector3(subject.x,1.4,subject.z).project(c);return Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z>-1&&p.z<1;
 }
 for(const aspect of [393/852,852/393,1280/720])for(const cameraYaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  const friend={x:0,y:0,z:8,cameraYaw},visitor=meetingSpawn(friend);
  assert(visible(friend,visitor,aspect),'o amigo vê quem chegou');assert(visible(visitor,friend,aspect),'quem chegou também vê o amigo');
 }
 assert(!visible({x:0,z:8,cameraYaw:0},{x:52,z:8},393/852),'bases afastadas reproduzem o problema anterior');
});
test('guardiões encontram a entrada e a saída de todas as bases, inclusive fora da origem',()=>{
 const vm=require('node:vm'),html=require('node:fs').readFileSync('index.html','utf8');
 const source=html.slice(html.indexOf('const guardPath='),html.indexOf('const aim='));
 for(let slot=0;slot<16;slot++){
  const spawn=baseSpawn(slot),home={x:spawn.x,z:spawn.z-8},ctx={BASE_HOME:home};
  vm.runInNewContext(source+';globalThis.path=guardPath;',ctx);
  assert.deepEqual(Array.from(ctx.path({x:home.x+10,z:home.z-20},home.x,home.z+8)),[home.x,home.z-20]);
  assert.deepEqual(Array.from(ctx.path({x:home.x,z:home.z-20},home.x,home.z+8)),[home.x,home.z-4]);
  assert.deepEqual(Array.from(ctx.path({x:home.x,z:home.z+8},0,-65)),[home.x,home.z-16]);
 }
});
test('mundo compartilhado: coleta atômica, distância, noite e devolução na posição atual',()=>{
 const world=new World(1000,()=>.2),egg=[...world.eggs.values()][0];
 const a={x:egg.x,y:0,z:egg.z,yaw:0,heldEgg:null,baseSlot:0},b={...a};
 assert.equal(world.take(a,egg.id,1001),egg);
 assert.equal(world.take(b,egg.id,1001),null,'o mesmo ID tem somente um dono');
 a.x=50;a.z=150;const dropped=world.drop(a);assert.equal(dropped.id,egg.id);assert.equal(dropped.z,151.8);
 assert.equal(world.take(b,egg.id,1001),null,'coleta distante é recusada');
 b.x=dropped.x;b.z=dropped.z;world.phase='night';assert.equal(world.take(b,egg.id,1001),null);
 world.phase='day';assert(world.take(b,egg.id,1001));
 assert.equal(world.deposit(b),null,'não deposita longe da própria base');
 const home=baseSpawn(b.baseSlot);b.x=home.x;b.z=home.z-12;
 assert.equal(world.deposit(b).id,egg.id);assert.equal(world.drop(b),null,'ovo depositado não retorna ao desconectar');
});
test('as 16 bases aceitam depósito somente no círculo do próprio jogador',()=>{
 const world=new World(1000);
 for(let baseSlot=0;baseSlot<16;baseSlot++){
  const home=baseSpawn(baseSlot),player={baseSlot,x:home.x,z:home.z-12,heldEgg:{id:'base-'+baseSlot}};
  assert.equal(world.deposit(player).id,'base-'+baseSlot);
  player.heldEgg={id:'outro'};player.x=home.x+52;assert.equal(world.deposit(player),null);
 }
});
test('cronômetros usam o servidor, preservam ovos carregados e respeitam 9 + 3 segundos',()=>{
 const w=new World(1000,()=>.99),egg=[...w.eggs.values()][0],p={x:egg.x,z:egg.z,heldEgg:null};
 w.take(p,egg.id,1001);assert.equal(w.tick(300999),false);
 assert.equal(w.tick(301000),true);assert.equal(w.phase,'night');assert.equal(w.until,310000);assert.equal(p.heldEgg.id,egg.id);
 assert.equal(w.tick(310000),true);assert.equal(w.phase,'unlock');assert.equal(w.until,313000);
 w.tick(313000);assert.equal(w.phase,'day');assert.equal(w.nextReset,613000);
 assert.equal(w.eggs.has(egg.id),false,'a renovação não duplica o ovo carregado');
});
test('geração inicial não despeja ovos raros e o limite do mapa é aplicado',()=>{
 const w=new World(1000);assert.equal(w.eggs.size,24);assert([...w.eggs.values()].every(e=>e.r<2));
 for(let n=0;n<500;n++)w.add(1,2,1,1,-100,1000);
 assert.equal(w.eggs.size,400);
});
