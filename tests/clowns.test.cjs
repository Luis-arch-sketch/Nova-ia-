'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const THREE=require('../three.min.js'),source=fs.readFileSync('halloween-clowns.js','utf8');
const flush=()=>new Promise(r=>setImmediate(r));
function world(){
 let time=1000;const events=new Map(),audios=[];
 function on(name,fn){const list=events.get(name)||[];list.push(fn);events.set(name,list)}
 function emit(name){for(const fn of events.get(name)||[])fn()}
 class FakeAudio{
  constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.playCalls=0;this.events=new Map();audios.push(this)}
  play(){this.paused=false;this.playCalls++;return Promise.resolve()}
  pause(){this.paused=true}
  addEventListener(name,fn){this.events.set(name,fn)}
  end(){this.paused=true;this.events.get('ended')?.()}
 }
 const ctx={T:THREE,sc:new THREE.Scene(),P:{x:0,z:8},BASE_HOME:{x:0,z:0},
  document:{hidden:false,addEventListener:on},window:{dispatchEvent:e=>emit(e.type)},
  addEventListener:on,Audio:FakeAudio,performance:{now:()=>time},Event:class{constructor(type){this.type=type}},console};
 vm.runInNewContext(source,ctx);
 return{ctx,api:ctx.window.RoubeOvoClowns,music:audios[0],witch:audios[1],audios,emit,setTime:n=>time=n};
}
test('cinco palhaços têm mão em L e pernas articuladas, sem alterar os obstáculos',()=>{
 const w=world();assert.equal(w.api.count,5);
 const roots=w.ctx.sc.children.filter(g=>g.name.startsWith('PalhacoDancaL'));
 assert.equal(roots.length,5);
 for(const root of roots){
  assert(root.getObjectByName('MaoEmL'));assert(root.getObjectByName('PernaEsquerda'));assert(root.getObjectByName('PernaDireita'));
  let meshes=0;root.traverse(o=>{if(o.isMesh){meshes++;assert(o.geometry.attributes.position.count>0)}});assert(meshes<40,'partes estáticas unidas para reduzir desenhos');
 }
 const leg=roots[0].getObjectByName('PernaEsquerda'),before=leg.rotation.x;
 w.setTime(1300);w.api.update();assert.notEqual(leg.rotation.x,before);
 w.ctx.BASE_HOME.x=52;w.ctx.BASE_HOME.z=56;w.api.update();
 assert.equal(w.api.positions[0].x,63);assert.equal(w.api.positions[0].z,52);
});
test('música correta toca em loop por proximidade, com uma faixa e histerese',async()=>{
 const w=world();assert.equal(w.audios.length,2);
 assert.equal(w.music.src,'/audio/clown-dance.webm');assert.equal(w.music.loop,true);
 assert.equal(w.witch.src,'/audio/witch-laugh.mp3');assert.equal(w.witch.loop,false);
 w.emit('pointerdown');w.api.update();await flush();assert(w.music.paused);assert(w.witch.paused);
 w.ctx.P.x=11;w.ctx.P.z=1;w.api.update();await flush();assert.equal(w.music.paused,false);assert.equal(w.music.playCalls,1);
 for(let i=0;i<20;i++){w.emit('pointerdown');w.api.update()}await flush();assert.equal(w.music.playCalls,1);
 w.ctx.P.z=5.5;w.api.update();assert.equal(w.music.paused,false,'continua entre 8 e 11 unidades');
 w.ctx.P.z=8;w.api.update();assert(w.music.paused);assert(w.witch.paused,'afastar não aciona risada');
});
test('risada aleatória independe dos palhaços e nunca entra em loop ou sobrepõe a si mesma',async()=>{
 const w=world();w.emit('keydown');
 assert(w.api.nextWitchAt>=21000&&w.api.nextWitchAt<=46000);
 const due=w.api.nextWitchAt;w.setTime(due-1);w.api.update();assert.equal(w.witch.playCalls,0);
 w.setTime(due+1);w.api.update();await flush();assert.equal(w.witch.playCalls,1);assert(w.music.paused);
 for(let i=0;i<20;i++)w.api.update();assert.equal(w.witch.playCalls,1);
 w.witch.end();assert(w.api.nextWitchAt>=due+35001&&w.api.nextWitchAt<=due+80001);
 const next=w.api.nextWitchAt;w.setTime(next+1);w.api.update();await flush();assert.equal(w.witch.playCalls,2);
});
test('revelação do ovo e aplicativo oculto pausam os sons extras',async()=>{
 const w=world();w.emit('pointerdown');w.ctx.P.x=11;w.ctx.P.z=1;w.api.update();await flush();
 assert(!w.music.paused);w.emit('egg-hatch-start');assert(w.music.paused);
 w.setTime(w.api.nextWitchAt+1);w.api.update();assert.equal(w.witch.playCalls,0);
 w.emit('egg-hatch-end');await flush();assert(!w.music.paused);
 w.ctx.document.hidden=true;w.emit('visibilitychange');assert(w.music.paused);
 w.api.update();assert.equal(w.witch.playCalls,0);
 w.ctx.document.hidden=false;w.emit('visibilitychange');await flush();assert(!w.music.paused);
});
