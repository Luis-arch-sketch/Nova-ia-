'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
function hatching(){
 const S={inc:[null,null,null,null],pets:[],idx:{},id:1};
 const plays=[],saves=[];let now=1000;
 const ctx={S,MUT:[],window:{RoubeOvoHatching:{play:(p,s)=>plays.push({p,s})}},
  Date:{now:()=>now},recalc(){},save(){saves.push(JSON.stringify(S))}};
 const code=html.slice(html.indexOf('const hatch='),html.indexOf('const fuse='));
 vm.runInNewContext(code+'\nglobalThis.hatchEgg=hatch;',ctx);
 return{S,plays,saves,hatch:ctx.hatchEgg,setTime:t=>now=t};
}
test('ovo espera o tempo e o botão; clique repetido não duplica nem perde o pet',()=>{
 const g=hatching(),egg={s:6,z:1,w:2,a:0,b:2000};g.S.inc[0]=egg;
 assert.equal(g.hatch(0),false);assert.equal(g.S.pets.length,0);assert.equal(g.S.inc[0],egg);
 g.setTime(2001);assert.equal(g.S.pets.length,0,'ficar pronto não abre sozinho');
 const pet=g.hatch(0);assert.equal(pet.s,6);assert.equal(g.S.inc[0],null);
 assert.equal(g.hatch(0),false);assert.equal(g.hatch(99),false);
 assert.equal(g.S.pets.length,1);assert.equal(g.S.id,2);assert.equal(g.plays.length,1);
 const saved=JSON.parse(g.saves[0]);assert.equal(saved.pets.length,1);assert.equal(saved.inc[0],null);
 assert.equal(saved.idx[6],1,'pet fica salvo antes do primeiro frame da animação');
});
test('admin pode antecipar quatro ovos, com uma revelação por pet',()=>{
 const g=hatching();g.S.inc=[6,104,105,128].map(s=>({s,z:4,w:12,a:0,b:90000}));
 for(let i=0;i<4;i++)assert(g.hatch(i,true));
 assert.equal(g.S.pets.length,4);assert.equal(g.plays.length,4);
 assert(g.S.inc.every(s=>s===null));assert.equal(g.hatch(0,true),false);
 assert.deepEqual(Array.from(g.S.pets,p=>p.s),[6,104,105,128]);
});
test('pulo funciona após atordoamento negativo, evita salto duplo e recupera multiplicador inválido',()=>{
 const ctx={P:{y:0,vy:0,stun:-.01,train:true},A:{jumpMult:1},window:{},beep(){},abuseJumpMult:()=>1};
 const line=html.split('\n').find(s=>s.startsWith('const jump='));
 vm.runInNewContext(line+'\nglobalThis.doJump=jump;',ctx);
 assert.equal(ctx.doJump(),true);assert.equal(ctx.P.vy,11);assert.equal(ctx.P.train,false);
 assert.equal(ctx.doJump(),false,'segundo toque antes do primeiro frame não duplica o impulso');
 ctx.P.y=2;ctx.P.vy=-1;assert.equal(ctx.doJump(),false,'sem salto no ar');
 ctx.P.y=0;ctx.P.vy=0;ctx.P.stun=.1;assert.equal(ctx.doJump(),false,'respeita atordoamento ativo');
 ctx.P.stun=0;ctx.A.jumpMult='inválido';assert.equal(ctx.doJump(),true);assert.equal(ctx.P.vy,11);
 ctx.P.vy=0;ctx.window.RoubeOvoHatching={active:true};assert.equal(ctx.doJump(),false);
});
test('tempo esgotado deixa o ovo pronto e os dois arquivos de som são locais',()=>{
 const tick=html.slice(html.indexOf('sec+=dt;if(sec>=1)'),html.indexOf('hq+=dt'));
 assert(!tick.includes('hatch('));assert(tick.includes('Pronto! Chocar ovo'));
 for(const file of ['egg-crack.mp3','egg-suspense.mp3'])assert(fs.statSync('audio/'+file).size>20000);
 assert.doesNotThrow(()=>new vm.Script(fs.readFileSync('egg-hatching.js','utf8')));
 assert(html.includes("P.stun=Math.max(0,P.stun-dt)"));
});
