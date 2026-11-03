'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Layout=require('../world-layout.js');
const {RadioactiveRaid}=require('../radioactive-raid.cjs');

test('portal de batalha fica junto da loja de trilhas e a chegada fica dentro do mapa',()=>{
 const p=Layout.raidPortal,shop=Layout.shops.trails;
 assert(Math.hypot(shop.x-p.town.x,shop.z-p.town.z)<16);
 assert(Layout.contains(p.town,Layout.hub(1)));
 assert(Layout.contains(p.arena,Layout.hub(1)));
 assert(Layout.contains(p.arrivalArena,Layout.hub(1)));
 assert(Math.hypot(p.town.x-p.arrivalTown.x,p.town.z-p.arrivalTown.z)>6);
 assert(Math.hypot(p.arena.x-p.arrivalArena.x,p.arena.z-p.arrivalArena.z)>6);
});

test('200 golpes de 50 de dano derrubam monstro de 10000 HP; renasce em 120 segundos',()=>{
 const raid=new RadioactiveRaid(()=>.5);
 const fighters=[{principal:'a',x:0,z:-300,weapon:'radioactive-bat'},{principal:'b',x:0,z:-300,weapon:'radioactive-bat'}];
 const start=10000;
 let result;
 for(let i=0;i<200;i++){
  result=raid.hit(fighters[i%2],start+i*700);
  assert.equal(result.ok,true);
  assert.equal(result.dealt,50);
 }
 assert.equal(result.defeated,true);
 assert.equal(raid.hp,0);
 assert.equal(raid.respawnAt,start+199*700+120000);
 assert.equal(raid.hit(fighters[0],raid.respawnAt-1000).ok,false);
 assert.equal(raid.tick(raid.respawnAt-1),false);
 assert.equal(raid.tick(raid.respawnAt),true);
 assert.equal(raid.hp,10000);
 assert.equal(raid.respawnAt,0);
 assert.equal(result.awards.length,2);
});
