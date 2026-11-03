'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),crypto=require('node:crypto');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),WebSocket=require('ws');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function connect(port){return new Promise((resolve,reject)=>{
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),inbox=[],waiters=[];
 ws.on('message',raw=>{const msg=JSON.parse(String(raw)),i=waiters.findIndex(w=>w.predicate(msg));if(i<0)inbox.push(msg);else{const w=waiters.splice(i,1)[0];clearTimeout(w.timer);w.resolve(msg)}});
 ws.next=predicate=>{const i=inbox.findIndex(predicate);if(i>=0)return Promise.resolve(inbox.splice(i,1)[0]);return new Promise((resolve,reject)=>{const w={predicate,resolve};w.timer=setTimeout(()=>{waiters.splice(waiters.indexOf(w),1);reject(Error('Sem resposta esperada'))},4000);waiters.push(w)})};
 ws.packet=data=>ws.send(JSON.stringify(data));ws.once('open',()=>resolve(ws));ws.once('error',reject);
});}
async function join(ws,extra={}){ws.packet({type:'join',room:'PRESENCE-QA',name:'MesmoNome',...extra});return ws.next(m=>m.type==='joined')}
test('reconexão com conexão antiga aberta mantém um avatar, uma base e um ovo, inclusive em sala cheia',{timeout:18000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rue-presence-')),port=3167,clients=[];
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),MODERATION_FILE:path.join(dir,'access.json'),ADMIN_PASSWORD_HASH:crypto.createHash('sha256').update('PRESENCE_LOCAL_TEST').digest('hex')},stdio:'ignore'});
 const open=async()=>{const ws=await connect(port);clients.push(ws);return ws};
 try{
  for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:'+port+'/health')).ok)break}catch{}await pause(30)}
  const first=await open(),friend=await open(),initial=await join(first),other=await join(friend);
  assert.notEqual(initial.identity,other.identity,'nomes iguais continuam sendo pessoas distintas');
  first.packet({type:'admin-auth',password:'PRESENCE_LOCAL_TEST'});const auth=await first.next(m=>m.type==='admin-ok');
  const egg=initial.world.eggs[0];
  first.packet({type:'egg-take',id:egg.id,requestId:'presence-take-0001',position:{x:egg.x,y:0,z:egg.z,yaw:0}});
  assert((await first.next(m=>m.type==='egg-result')).ok);
  first.packet({type:'go-home'});await first.next(m=>m.type==='reposition');
  const second=await open();
  const resumed=await join(second,{identity:initial.identity,ownerToken:auth.ownerToken,accessBackup:auth.accessBackup});
  await first.next(m=>m.type==='session-replaced');
  assert.equal(resumed.id,initial.id);assert.equal(resumed.baseSlot,initial.baseSlot);assert(resumed.owner);
  assert.notEqual(resumed.token,initial.token,'a conexão aposentada perde o token de retomada');
  const legacy=await open();legacy.packet({type:'join',room:'PRESENCE-QA',name:'MesmoNome',identity:initial.identity,token:initial.token});
  assert.match((await legacy.next(m=>m.type==='error')).message,/substituída/);
  assert.equal(resumed.players.length,2);assert.equal(resumed.carrying.id,egg.id);
  assert(!resumed.world.eggs.some(e=>e.id===egg.id),'ovo transferido continua fora do chão');
  const presence=await friend.next(m=>m.type==='players'&&m.players.length===2&&m.players.some(p=>p.id===initial.id&&p.carrying?.id===egg.id));
  assert.equal(new Set(presence.players.map(p=>p.id)).size,2);
  await pause(80);second.packet({type:'world-request'});await second.next(m=>m.type==='world-sync');
  for(let i=0;i<14;i++)await join(await open(),{name:'Amigo'+i});
  const third=await open(),full=await join(third,{identity:initial.identity,token:resumed.token,ownerToken:auth.ownerToken,accessBackup:auth.accessBackup});
  assert.equal(full.players.length,16);assert.equal(full.id,initial.id);assert.equal(full.baseSlot,initial.baseSlot);
  assert.equal(full.carrying.id,egg.id);await second.next(m=>m.type==='session-replaced');
  third.packet({type:'egg-drop',id:egg.id,requestId:'presence-drop-0001',position:{x:0,y:0,z:8,yaw:0}});
  assert((await third.next(m=>m.type==='egg-result')).ok);third.packet({type:'world-request'});
  assert.equal((await third.next(m=>m.type==='world-sync')).eggs.filter(e=>e.id===egg.id).length,1);
  const changed=await open();await join(changed,{room:'OTHER-PRES',identity:initial.identity,ownerToken:auth.ownerToken,accessBackup:auth.accessBackup});
  await third.next(m=>m.type==='session-replaced');
  const left=await friend.next(m=>m.type==='players'&&m.players.length===15&&!m.players.some(p=>p.id===initial.id));
  assert.equal(left.players.length,15,'trocar de sala remove a presença antiga');
 }finally{for(const ws of clients)ws.terminate();server.kill();fs.rmSync(dir,{recursive:true,force:true})}
});
