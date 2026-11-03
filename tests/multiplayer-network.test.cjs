'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {spawn}=require('node:child_process'),WebSocket=require('ws');
const pause=ms=>new Promise(r=>setTimeout(r,ms)),PORT=3102,secret='TEST_LOCAL_ONLY';
function connect(){return new Promise((resolve,reject)=>{
 const ws=new WebSocket('ws://127.0.0.1:'+PORT+'/ws'),inbox=[],waiters=[];
 ws.on('message',raw=>{const m=JSON.parse(String(raw));const i=waiters.findIndex(w=>w.predicate(m));if(i>=0){const w=waiters.splice(i,1)[0];clearTimeout(w.timer);w.resolve(m)}else inbox.push(m)});
 ws.next=(predicate,timeout=3000)=>{const i=inbox.findIndex(predicate);if(i>=0)return Promise.resolve(inbox.splice(i,1)[0]);return new Promise((resolve,reject)=>{const w={predicate,resolve};w.timer=setTimeout(()=>{waiters.splice(waiters.indexOf(w),1);reject(Error('Sem resposta esperada: '+String(predicate)))},timeout);waiters.push(w)})};
 ws.sendJSON=m=>ws.send(JSON.stringify(m));ws.on('open',()=>resolve(ws));ws.once('error',reject);
 ws.discard=predicate=>{for(let i=inbox.length-1;i>=0;i--)if(predicate(inbox[i]))inbox.splice(i,1)};
});}
async function join(ws,room,name,token){ws.sendJSON({type:'join',room,name,token});const m=await ws.next(m=>m.type==='joined'||m.type==='error');if(m.type==='error')throw Error(room+': '+m.message);return m;}
test('rede: 16 bases, sala cheia preserva sala anterior, eventos para novos jogadores e validação de pacotes', {timeout:15000},async()=>{
 const srv=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(PORT),MODERATION_FILE:require('node:path').join(require('node:os').tmpdir(),'roube-test-'+process.pid+'-'+crypto.randomUUID()+'.json'),ADMIN_PASSWORD_HASH:crypto.createHash('sha256').update(secret).digest('hex')},stdio:['ignore','ignore','pipe']}),clients=[];
 let log='';srv.stderr.on('data',d=>log+=d);
 try{
  for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:'+PORT+'/health')).ok)break}catch{}if(srv.exitCode!==null)throw Error(log);await pause(30)}
  const slots=new Set(),ids=new Set();
  for(let i=0;i<16;i++){const ws=await connect();clients.push(ws);const m=await join(ws,'FULLROOM','Jogador'+i);slots.add(m.baseSlot);ids.add(m.id);assert.equal(m.world.eggs.length,24)}
  assert.equal(slots.size,16);assert.equal(ids.size,16);
  const outsider=await connect();clients.push(outsider);const own=await join(outsider,'ORIGINAL','Visitante');
  outsider.sendJSON({type:'join',room:'FULLROOM',name:'Visitante'});
  assert.match((await outsider.next(m=>m.type==='error')).message,/cheia/);
  outsider.sendJSON({type:'world-request'});const originalWorld=await outsider.next(m=>m.type==='world-sync');
  assert.deepEqual(originalWorld.eggs.map(e=>e.id),own.world.eggs.map(e=>e.id),'tentativa recusada mantém o mundo anterior');
  const admin=clients[0];admin.sendJSON({type:'admin-auth',password:secret});await admin.next(m=>m.type==='admin-ok');
  admin.sendJSON({type:'admin-event',action:'start',id:'speed',settings:{duration:60,interval:5,wave:2}});
  const event=await clients[1].next(m=>m.type==='event'&&m.kind==='event');assert(event.endsAt>Date.now());
  // O evento acima é uma barreira ordenada: descartar listas recebidas
  // durante a entrada dos 16 jogadores antes de esperar a saída real.
  clients[1].discard(m=>m.type==='players');
  clients[15].close();await clients[1].next(m=>m.type==='players'&&m.players.length===15);
  const newcomer=await connect();clients.push(newcomer);const entered=await join(newcomer,'FULLROOM','RecemChegado');
  assert.equal(entered.event.id,'speed');assert.equal(entered.event.endsAt,event.endsAt,'quem entra depois recebe o tempo restante real');
  assert.equal(entered.baseSlot,15,'a base liberada pode ser reutilizada');
  newcomer.send('null');newcomer.send('{bad');newcomer.send('[]');
  newcomer.sendJSON({type:'move',x:'erro',y:null,z:Infinity,yaw:{}});
  const mover=clients[1];mover.sendJSON({type:'move',x:3,y:0,z:9,yaw:0});
  const presence=await newcomer.next(m=>m.type==='players'&&m.players.some(p=>p.x===3&&p.z===9));
  const safe=presence.players.find(p=>p.id===entered.id);assert.equal(safe.x,entered.players.find(p=>p.id===entered.id).x);assert(Number.isFinite(safe.z));
  newcomer.sendJSON({type:'admin-limited',eggs:[{x:0,z:-900}]});newcomer.sendJSON({type:'world-request'});
  assert.equal((await newcomer.next(m=>m.type==='world-sync')).eggs.filter(e=>e.s===104).length,0,'jogador comum não cria LIMITED');
  outsider.sendJSON({type:'world-request'});assert.equal((await outsider.next(m=>m.type==='world-sync')).eggs.filter(e=>e.s===104).length,0,'outras salas continuam isoladas');
  const health=await (await fetch('http://127.0.0.1:'+PORT+'/health')).json();assert.equal(health.multiplayerProtocol,2);
 }finally{for(const ws of clients)ws.terminate();srv.kill('SIGTERM')}
});

