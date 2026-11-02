'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),T=require('../three.min.js');
const {World,speciesForBiome}=require('../multiplayer-world.cjs');
function load(){const context={window:{}};vm.runInNewContext(fs.readFileSync('radioactive-biome.js','utf8'),context);return context.window.RoubeOvoRadioactive}
test('parte 14 registra oito espécies sem mover LIMITED nem animais antigos',()=>{
 const api=load(),biomes=Array.from({length:13},(_,id)=>({id})),species=Array.from({length:129},(_,id)=>({id,n:'Antigo '+id})),old=JSON.stringify(species);
 api.register(biomes,species,[]);api.register(biomes,species,[]);
 assert.equal(biomes.length,14);assert.equal(species.length,137);assert.equal(JSON.stringify(species.slice(0,129)),old);
 assert.deepEqual(species.slice(129).map(p=>p.id),[129,130,131,132,133,134,135,136]);
 for(let j=0;j<8;j++)assert.equal(speciesForBiome(13,j),129+j);
 assert.equal(species[104].id,104);assert.equal(species[128].id,128);
});
test('modelos radioativos têm oito anatomias distintas, animação válida e reatores fora da estrada',()=>{
 const api=load(),signatures=new Set(),fingerprints=new Set(),scene=new T.Scene(),obstacles=[];
 for(let id=129;id<=136;id++){
  const model=api.create(T,id,1,null,scene);assert(model.isGroup);signatures.add(model.userData.uniqueSculpture.signature);
  const parts=[];model.traverse(o=>{if(o.isMesh)parts.push([o.geometry.type,...o.position.toArray(),...o.scale.toArray()].join(':'))});fingerprints.add(parts.join('|'));assert(parts.length>=12);
  for(const time of [0,1,15]){model.userData.customUpdate(time,0);model.updateMatrixWorld(true);model.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite)))}
 }
 assert.equal(signatures.size,8);assert.equal(fingerprints.size,8);
 api.decorate(T,scene,obstacles);assert.equal(obstacles.length,2);assert(obstacles.every(o=>Math.abs(o.x)-o.r>7));
 api.update(1,{z:-975});assert(scene.getObjectByName('biome-radioactive').visible);
 api.update(2,{z:8});assert.equal(scene.getObjectByName('biome-radioactive').visible,false);
});
test('ovos da parte 14 entram no mesmo mundo, conservam ID e mutações até o depósito',()=>{
 const world=new World(1000,()=>.5),eggs=[...world.eggs.values()].filter(e=>e.b===13);
 assert.equal(eggs.length,2);assert.deepEqual(eggs.map(e=>e.s),[129,130]);
 const special=world.add(13,7,4,20,-975,1001,136,null,[0,2,7]);
 const player={x:20,z:-975,y:0,yaw:0,baseSlot:0,heldEgg:null};assert.equal(world.take(player,special.id,1002).s,136);
 const dropped=world.drop(player);assert.equal(dropped.id,special.id);assert.deepEqual(dropped.m,[0,2,7]);assert(dropped.z<-938);
 world.take(player,dropped.id,1003);player.x=0;player.z=-4;assert.equal(world.deposit(player).s,136);
 assert.equal(world.eggs.has(special.id),false);
});
