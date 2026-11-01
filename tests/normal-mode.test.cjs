'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {spawn}=require('node:child_process');
const {setTimeout:pause}=require('node:timers/promises');
const {World}=require('../multiplayer-world.cjs');
const THREE=require('../three.min.js');

test('modo normal não cria ovos sazonais, mesmo com data antiga do evento',()=>{
 for(const day of ['2026-10-13','2026-10-31','2026-11-01','2027-10-31']){
  const now=Date.parse(day+'T12:00:00Z'),world=new World(now,()=>.0001);
  for(let i=0;i<10;i++)world.regrow(false,now+i*300000);
  assert(world.eggs.size>0);
  assert([...world.eggs.values()].every(e=>e.s<105));
 }
});

test('24 animais conquistados conservam IDs e renda, com modelos sem fantasias',()=>{
 const context={window:{},console};
 vm.runInNewContext(fs.readFileSync('pet-collection.js','utf8'),context);
 const catalog=context.window.RoubeOvoPetCollection;
 const species=Array.from({length:105},(_,id)=>({id,n:'original-'+id})),rarities=[];
 const originals=JSON.stringify(species),incomes=[2e9,2e10,2e11,2e12,8e13,9e15];
 catalog.register(species,rarities);catalog.register(species,rarities);
 assert.equal(species.length,129);assert.equal(JSON.stringify(species.slice(0,105)),originals);
 const names=/halloween|brux|vampir|abóbora|maldit|vodu|necro|lobisomem|sangue/i;
 for(let i=0;i<24;i++){
  const id=105+i,definition=catalog.defs[i];
  assert.equal(definition.id,id);assert(!names.test(species[id].n));
  assert.equal(species[id].inc,incomes[Math.floor(i/4)]*(1+(i%4)*.2));
  const scene=new THREE.Scene(),model=catalog.create(THREE,id,1,scene);
  assert(model.isGroup&&scene.children.includes(model));
  model.userData.customUpdate(10);model.updateMatrixWorld(true);
  model.traverse(o=>{for(const n of o.matrixWorld.elements)assert(Number.isFinite(n))});
 }
 assert.equal(catalog.indexHtml({idx:{},pets:[],inc:[]}), '');
 assert.match(catalog.indexHtml({idx:{105:1},pets:[],inc:[]}), /Gato/);
 assert.equal(catalog.active,undefined,'coleção não reativa o evento');
});

test('servidor entrega jogo normal e retira scripts e áudios sazonais', {timeout:12000},async()=>{
 const port=3141,origin='http://127.0.0.1:'+port;
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','ignore','pipe']});
 let errors='';server.stderr.on('data',b=>errors+=String(b));
 try{
  let healthy=false;
  for(let i=0;i<160;i++){
   try{if((await fetch(origin+'/health')).ok){healthy=true;break}}catch{}
   if(server.exitCode!==null)throw Error(errors);
   await pause(30);
  }
  assert(healthy,errors);
  const response=await fetch(origin+'/'),html=await response.text();
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  assert(!/halloween|RoubeOvoClowns|spawnHalloween/i.test(html));
  assert(html.indexOf('/pet-collection.js')<html.indexOf('const PC='));
  for(const script of ['egg-hatching.js','entrance-cinematic.js','hud-chat.js','multiplayer-client.js'])assert(html.includes('/'+script));
  const state=await (await fetch(origin+'/api/halloween')).json();
  assert.equal(state.active,false);assert.equal(state.musicRequired,false);assert.equal(state.musicUrl,null);
  assert.deepEqual(state.eggTypes,[]);
  for(const asset of ['halloween-event.js','halloween-pets.js','halloween-clowns.js','audio/halloween-spooky-scary-skeletons.mp3','audio/clown-dance.webm','audio/witch-laugh.mp3']){
   const retired=await fetch(origin+'/'+asset+'?old=1');assert.equal(retired.status,410,asset);
  }
  for(const asset of ['pet-collection.js','audio/egg-crack.mp3','audio/egg-suspense.mp3'])assert.equal((await fetch(origin+'/'+asset)).status,200,asset);
  const worker=await (await fetch(origin+'/service-worker.js')).text();
  assert.match(worker,/roube-ovo-pwa-v5-normal/);assert(!worker.includes('localStorage'));
 }finally{server.kill('SIGTERM')}
});
