'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process'),{once}=require('node:events'),WebSocket=require('ws');
const {World}=require('../multiplayer-world.cjs'),{swingBat}=require('../player-combat.cjs'),{PlayerAccess}=require('../player-access.cjs');
const pause=ms=>new Promise(r=>setTimeout(r,ms));

test('um golpe perto derruba o ovo de qualquer lado, com intervalo e sem duplicação',()=>{
 const world=new World(1000,()=>.5),egg=[...world.eggs.values()][0];
 const victim={x:0,z:3,y:0,yaw:0,heldEgg:null},attacker={x:5.5,z:3,y:0,yaw:Math.PI,heldEgg:null,weapon:null};
 world.eggs.delete(egg.id);victim.heldEgg=egg;
 assert.equal(swingBat(attacker,[attacker,victim],world,1000).ok,false);attacker.weapon='bat';
 attacker.x=12;assert.equal(swingBat(attacker,[victim],world,2000).egg,null);
 attacker.x=5.5;const hit=swingBat(attacker,[victim],world,3000);
 assert.equal(hit.egg.id,egg.id,'acerta de lado ou de costas, sem mirar');assert.equal(victim.heldEgg,null);assert.deepEqual(hit.egg.m,egg.m);
 assert.equal(swingBat(attacker,[victim],world,3001).ok,false);
 assert.equal([...world.eggs.values()].filter(e=>e.id===egg.id).length,1);
 assert.equal(world.deposit(victim),null);
 attacker.x=hit.egg.x;attacker.z=hit.egg.z;assert.equal(world.take(attacker,egg.id,4000).id,egg.id);
 assert.equal(swingBat(attacker,[victim],world,4001).ok,false,'não bate carregando ovo');
 assert.equal(world.take(victim,egg.id,4000),null);assert.equal(world.eggs.has(egg.id),false);
 const other={x:attacker.x+2,z:attacker.z,y:0,yaw:0,weapon:'bat'};attacker.hitProtectedUntil=7000;
 assert.equal(swingBat(other,[attacker],world,5000).egg.id,egg.id,'o ovo roubado volta a cair em um único golpe');
});

test('permissões assinadas sobrevivem ao reinício sem confiar em nome, senha compartilhada ou backup editado',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rue-roles-')),file=path.join(dir,'access.json'),secret=crypto.randomBytes(32).toString('hex');
 try{
  const access=new PlayerAccess(secret,file),owner=access.newIdentity(),other=access.newIdentity();
  const proof=access.claimOwner(owner.id).token;assert(proof);
  assert(access.claimOwner(other.id).error,'a mesma chave não cria outro dono');
  access.change('grant',other.id,'Amigo');assert.equal(access.role(other.id),'operator');
  access.change('block',other.id,'Amigo');assert.equal(access.role(other.id),'player');
  assert(access.claimOwner(other.id).error);assert(access.change('block',owner.id,'Dono').error);
  const backup=access.backup(),restarted=new PlayerAccess(secret,file);
  assert(restarted.blocked(other.id));assert(restarted.resumeOwner(owner.id,proof,backup));
  assert.equal(restarted.resumeOwner(other.id,proof,backup),false);
  const cold=new PlayerAccess(secret);assert(cold.resumeOwner(owner.id,proof,backup));assert(cold.blocked(other.id));
  const tampered=backup.split('.');tampered[0]=Buffer.from(JSON.stringify({kind:'access-state',state:{...access.state,blocked:[],updatedAt:Date.now()+100000}})).toString('base64url');
  assert.equal(cold.verify(tampered.join('.'),'access-state'),null);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

function connect(port){return new Promise((resolve,reject)=>{
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),inbox=[],waiters=[];
 ws.on('message',raw=>{const msg=JSON.parse(String(raw)),i=waiters.findIndex(w=>w.predicate(msg));if(i<0)inbox.push(msg);else{const waiter=waiters.splice(i,1)[0];clearTimeout(waiter.timer);waiter.resolve(msg)}});
 ws.next=(predicate,timeout=4000)=>{const i=inbox.findIndex(predicate);if(i>=0)return Promise.resolve(inbox.splice(i,1)[0]);return new Promise((resolve,reject)=>{const waiter={predicate,resolve};waiter.timer=setTimeout(()=>{waiters.splice(waiters.indexOf(waiter),1);reject(Error('Sem pacote esperado'))},timeout);waiters.push(waiter)})};
 ws.packet=data=>ws.send(JSON.stringify(data));ws.once('open',()=>resolve(ws));ws.once('error',reject);
});}
const join=async(ws,name,extra={})=>{ws.packet({type:'join',name,room:'BAT-ROLES',...extra});return ws.next(m=>m.type==='joined')};

test('clientes reais: dono único, painel revogável, spawn idêntico, golpe, roubo e expulsão sem duplicar ovos', {timeout:25000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rue-network-')),port=3155,clients=[];
 const env={...process.env,PORT:String(port),ADMIN_PASSWORD_HASH:crypto.createHash('sha256').update('LOCAL_TEST_ONLY').digest('hex'),PLAYER_ACCESS_SECRET:crypto.randomBytes(32).toString('hex'),MODERATION_FILE:path.join(dir,'roles.json')};
 let server,log='';
 const start=async()=>{server=spawn(process.execPath,['server.js'],{env,stdio:['ignore','ignore','pipe']});server.stderr.on('data',d=>log+=d);for(let i=0;i<150;i++){if(server.exitCode!==null)throw Error(log);try{if((await fetch('http://127.0.0.1:'+port+'/health')).ok)return}catch{}await pause(25)}throw Error(log||'Servidor não iniciou')};
 try{
  await start();const owner=await connect(port),operator=await connect(port),victim=await connect(port);clients.push(owner,operator,victim);
  const own=await join(owner,'Luis'),op=await join(operator,'Amigo'),vic=await join(victim,'Visitante');
  assert.deepEqual(own.world.eggs,op.world.eggs);assert.deepEqual(op.world.eggs,vic.world.eggs);assert(own.world.eggs.every(e=>Array.isArray(e.m)));
  operator.packet({type:'stats',money:1,speed:1,admin:true,owner:true});operator.packet({type:'world-request'});await operator.next(m=>m.type==='world-sync');
  owner.packet({type:'admin-auth',password:'LOCAL_TEST_ONLY'});const auth=await owner.next(m=>m.type==='admin-ok');assert(auth.owner&&auth.canAdmin);
  operator.packet({type:'admin-auth',password:'LOCAL_TEST_ONLY'});assert.match((await operator.next(m=>m.type==='error')).message,/dono/);
  owner.packet({type:'moderate',action:'grant',id:op.id});const granted=await operator.next(m=>m.type==='admin-state');assert(granted.canAdmin&&!granted.owner);
  const presence=await victim.next(m=>m.type==='players'&&m.players.some(p=>p.id===op.id&&p.role==='operator'));
  assert.equal(presence.players.find(p=>p.id===op.id).admin,false);assert.equal(presence.players.find(p=>p.id===own.id).admin,true);
  operator.packet({type:'moderate',action:'kick',id:own.id});assert.match((await operator.next(m=>m.type==='error')).message,/Somente o dono/);
  operator.packet({type:'admin-spawn',eggs:[{b:0,j:5,s:5,size:4,x:0,z:20,m:[0,1,2,3,4,5,6,7]}]});
  const spawned=await owner.next(m=>m.type==='world-add'&&m.eggs.some(e=>e.s===5)),spawnOther=await victim.next(m=>m.type==='world-add'&&m.eggs.some(e=>e.s===5));
  assert.deepEqual(spawned.eggs,spawnOther.eggs);const egg=spawned.eggs[0];
  victim.packet({type:'egg-take',id:egg.id,requestId:'take-request-0001',position:{x:0,y:0,z:20,yaw:0}});assert((await victim.next(m=>m.type==='egg-result')).ok);
  operator.packet({type:'equip',weapon:'bat'});assert.equal((await operator.next(m=>m.type==='equipment')).weapon,'bat');
  operator.packet({type:'move',x:0,y:0,z:17,yaw:0});operator.packet({type:'bat-swing',target:vic.id});
  const dropped=await victim.next(m=>m.type==='egg-forced-drop');assert.equal(dropped.egg.id,egg.id);assert.deepEqual(dropped.egg.m,egg.m);
  assert((await operator.next(m=>m.type==='bat-result')).hit);
  victim.packet({type:'egg-deposit',id:egg.id,slot:0,requestId:'late-deposit-0001',position:{x:-52,y:0,z:-4,yaw:0}});assert.equal((await victim.next(m=>m.type==='egg-result'&&m.action==='egg-deposit')).ok,false);
  operator.packet({type:'egg-take',id:egg.id,requestId:'steal-request-001',position:{x:dropped.egg.x,y:0,z:dropped.egg.z,yaw:0}});assert((await operator.next(m=>m.type==='egg-result'&&m.action==='egg-take')).ok);
  owner.packet({type:'moderate',action:'block',id:op.id});const revoked=await operator.next(m=>m.type==='admin-state'&&!m.canAdmin);assert(!revoked.owner);
  operator.packet({type:'admin-auth',password:'LOCAL_TEST_ONLY'});assert.match((await operator.next(m=>m.type==='error')).message,/bloqueado/);
  owner.packet({type:'moderate',action:'kick',id:op.id});await operator.next(m=>m.type==='kicked');
  const floor=await owner.next(m=>m.type==='world-add'&&m.eggs.some(e=>e.id===egg.id));assert.deepEqual(floor.eggs[0].m,egg.m);
  const kicked=await connect(port);clients.push(kicked);kicked.packet({type:'join',name:'OutroNome',room:'BAT-ROLES',identity:op.identity});await kicked.next(m=>m.type==='kicked');
  owner.packet({type:'moderation-list'});const accessState=await owner.next(m=>m.type==='moderation-list'&&m.blocked.length===1);
  assert.equal(accessState.blocked[0].name,'Amigo');
  for(const ws of clients)ws.terminate();const exited=once(server,'exit');server.kill('SIGTERM');await exited;
  await start();const resumed=await connect(port),blocked=await connect(port);clients.push(resumed,blocked);
  const root=await join(resumed,'Luis',{identity:own.identity,ownerToken:auth.ownerToken,accessBackup:accessState.backup});assert(root.owner&&root.canAdmin);
  const regular=await join(blocked,'NomeAlterado',{identity:op.identity});assert(!regular.owner&&!regular.canAdmin);
  blocked.packet({type:'admin-auth',password:'LOCAL_TEST_ONLY'});assert.match((await blocked.next(m=>m.type==='error')).message,/bloqueado/);
 }finally{for(const ws of clients)ws.terminate();server?.kill('SIGTERM');fs.rmSync(dir,{recursive:true,force:true})}
});
