'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Layout=require('../world-layout.js');
const {RadioactiveRaid}=require('../radioactive-raid.cjs');

test('portal de batalha leva para uma sala fechada fora do mapa de ovos',()=>{
 const p=Layout.raidPortal,shop=Layout.shops.trails;
 assert(Math.hypot(shop.x-p.town.x,shop.z-p.town.z)<16);
 assert(Layout.contains(p.town,Layout.hub(1)));
 assert(!Layout.contains(p.arena,Layout.hub(1)),'a arena é externa ao mapa de ovos');
 assert(!Layout.contains(p.arrivalArena,Layout.hub(1)),'a chegada fica na sala radioativa');
 assert.equal(Layout.fitRaid({x:100,z:-9999}).x,26);
 assert.equal(Layout.fitRaid({x:100,z:-9999}).z,-1166);
 assert(Math.hypot(Layout.raidZone.shop.x-p.arena.x,Layout.raidZone.shop.z-p.arena.z)<40);
 assert(Math.hypot(p.town.x-p.arrivalTown.x,p.town.z-p.arrivalTown.z)>6);
 assert(Math.hypot(p.arena.x-p.arrivalArena.x,p.arena.z-p.arrivalArena.z)>6);
});

test('200 golpes de 50 de dano derrubam monstro de 10000 HP; renasce em 120 segundos',()=>{
 const raid=new RadioactiveRaid(()=>.5);
 const fighters=[{principal:'a',x:0,z:-1140,weapon:'radioactive-bat'},{principal:'b',x:0,z:-1140,weapon:'radioactive-bat'}];
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

test('corrida suprema só mata quando atinge a trajetória; fugir funciona',()=>{
 const raid=new RadioactiveRaid(()=>.5),p={id:'j1',principal:'p1',x:5,z:-1140,inRaid:true,raidHp:300};
 raid.nextAttackAt=0;raid.attackNumber=2;
 let e=raid.attacks(100000,[p]);
 assert.equal(e[0].kind,'charge');assert.equal(e[0].phase,'warn');
 p.z=-1133; // Sai de lado da rota antes do impacto.
 e=raid.attacks(101300,[p]);
 assert.equal(e.some(x=>x.type==='raid-player-hit'),false);
 assert.equal(p.raidHp,300);
 p.z=-1140;raid.nextAttackAt=0;raid.attackNumber=2;
 e=raid.attacks(110000,[p]);assert.equal(e[0].kind,'charge');
 e=raid.attacks(111300,[p]);
 assert.equal(e.find(x=>x.type==='raid-player-hit')?.dead,true);
 assert.equal(p.raidHp,0);
});
test('giro próximo dá quatro golpes de 50 sem matar quem foge',()=>{
 const raid=new RadioactiveRaid(()=>.5),p={id:'j2',principal:'p2',x:5,z:-1140,inRaid:true,raidHp:300};
 raid.nextAttackAt=0;raid.attackNumber=1;
 assert.equal(raid.attacks(100000,[p])[0].kind,'spin');
 const damage=[];
 for(const t of [101050,101350,101650,101950]){
  const e=raid.attacks(t,[p]);damage.push(...e.filter(x=>x.type==='raid-player-hit').map(x=>x.damage));
 }
 assert.deepEqual(damage,[50,50,50,50]);assert.equal(p.raidHp,100);
 const other={id:'j3',principal:'p3',x:15,z:-1140,inRaid:true,raidHp:300};
 raid.nextAttackAt=0;raid.attackNumber=0;raid.attacks(200000,[other]);
 assert.equal(raid.attacks(200900,[other]).some(x=>x.type==='raid-player-hit'),false);
});
