'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),WebSocket=require('ws');
const L=require('../world-layout.js');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
test('planta curta em U: só bases ocupadas, sem sobreposição, e entrada central para os biomas',()=>{
 for(let n=1;n<=16;n++){
  const h=L.hub(n),slots=L.slots(n).slice(0,n);
  for(const p of slots)for(const x of [-20,20])for(const z of [-10,30])assert(L.contains({x:p.x+x,z:p.z+z},h),'canto de base dentro da praça: '+JSON.stringify({n,p,x,z}));
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)assert(Math.abs(slots[i].x-slots[j].x)>=40||Math.abs(slots[i].z-slots[j].z)>=40,'bases separadas');
  for(const shop of Object.values(L.shops))assert(L.contains(shop,h),'loja dentro do perímetro');
  assert(L.contains({x:0,z:-65},h));assert(!L.contains({x:80,z:-65},h),'áreas dos ovos usam o corredor estreito');
 }
 assert(L.hub(2).endZ<60,'sem campo vazio depois das primeiras bases');
 assert(L.hub(7).halfWidth*2>L.corridorHalfWidth*4,'cabeceira mais larga que o corredor, como o desenho');
 assert.deepEqual(L.slots(7).slice(0,7),[{x:-96,z:48},{x:-48,z:48},{x:0,z:48},{x:48,z:48},{x:96,z:48},{x:-96,z:0},{x:96,z:0}]);
});
function connect(port){return new Promise((resolve,reject)=>{
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),inbox=[],waiters=[];
 ws.on('message',raw=>{const m=JSON.parse(String(raw)),i=waiters.findIndex(w=>w.predicate(m));if(i<0)inbox.push(m);else{const w=waiters.splice(i,1)[0];clearTimeout(w.timer);w.resolve(m)}});
 ws.next=predicate=>{const i=inbox.findIndex(predicate);if(i>=0)return Promise.resolve(inbox.splice(i,1)[0]);return new Promise((resolve,reject)=>{const w={predicate,resolve};w.timer=setTimeout(()=>reject(Error('Sem pacote: '+predicate)),5000);waiters.push(w)})};
 ws.packet=m=>ws.send(JSON.stringify(m));ws.once('open',()=>resolve(ws));ws.once('error',reject);
});}
test('praça cresce e encolhe com jogadores reais, preservando ovo, base e treino',{timeout:18000},async()=>{
 const port=3169,server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:'ignore'}),clients=[];
 try{
  for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:'+port+'/health')).ok)break}catch{}await pause(30)}
  let first;
  for(let i=0;i<7;i++){const ws=await connect(port);clients.push(ws);ws.packet({type:'join',room:'COMPACT-QA',name:'Jogador'+i});const m=await ws.next(m=>m.type==='joined');if(!i)first=m;}
  const keeper=clients[6],full=await keeper.next(m=>m.type==='players'&&m.players.length===7);
  assert.equal(full.layout.hub.endZ,94);assert.equal(full.layout.hub.halfWidth,128);
  const egg=first.world.eggs[0];keeper.packet({type:'egg-take',id:egg.id,requestId:'compact-take-0001',position:{x:egg.x,y:0,z:egg.z,yaw:0}});
  assert((await keeper.next(m=>m.type==='egg-result')).ok);keeper.packet({type:'go-home'});
  const before=await keeper.next(m=>m.type==='reposition'&&m.reason==='home');
  keeper.packet({type:'move',...before.spawn,training:true});
  for(const ws of clients.slice(0,6))ws.close();
  const alone=await keeper.next(m=>m.type==='players'&&m.players.length===1);
  assert.equal(alone.layout.hub.endZ,46);assert.equal(alone.layout.hub.halfWidth,64);
  assert.equal(alone.players[0].id,full.players.find(p=>p.name==='Jogador6').id);
  assert.equal(alone.players[0].baseSlot,0);assert.equal(alone.players[0].carrying.id,egg.id);assert(alone.players[0].training);
  keeper.packet({type:'go-home'});const home=await keeper.next(m=>m.type==='reposition'&&m.reason==='home');assert.equal(home.spawn.x,0);assert.equal(home.spawn.z,8);
  keeper.packet({type:'egg-deposit',id:egg.id,slot:0,requestId:'compact-deposit-1',position:{x:0,y:0,z:-4,yaw:0}});
  assert((await keeper.next(m=>m.type==='egg-result'&&m.action==='egg-deposit')).ok,'o ovo continua depositável depois de mudar a base');
 }finally{for(const ws of clients)ws.terminate();server.kill()}
});
