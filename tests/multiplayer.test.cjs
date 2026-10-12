'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const WebSocket=require('ws');

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const PORT=3079;
const url='ws://127.0.0.1:'+PORT+'/ws';
const secret='LOCAL_TEST_PASSWORD_ONLY';
const encode=(type,rest={})=>JSON.stringify({type,...rest});
const receive=(ws,predicate,ms=4500)=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{ws.off('message',onMessage);reject(Error('Tempo esgotado esperando resposta da sala'))},ms);
  function onMessage(raw){let message;try{message=JSON.parse(String(raw))}catch{return}
   if(predicate(message)){clearTimeout(timer);ws.off('message',onMessage);resolve(message)}}
  ws.on('message',onMessage);
});
const open=()=>new Promise((resolve,reject)=>{
 const ws=new WebSocket(url);
 ws.once('open',()=>resolve(ws));
 ws.once('error',reject);
});

test('Multiplayer: sala isolada, limpeza LIMITED e reconciliação de coleta', {timeout:20000},async()=>{
 const child=spawn(process.execPath,['server.js'],{
   env:{...process.env,PORT:String(PORT),ADMIN_PASSWORD_HASH:crypto.createHash('sha256').update(secret).digest('hex')},
   stdio:['ignore','pipe','pipe']
 });
 const clients=[];let stderr='';
 child.stderr.on('data',d=>{stderr+=d.toString()});
 try{
  let ready=false;
  for(let i=0;i<75;i++){
    if(child.exitCode!==null)throw Error('Servidor encerrou: '+stderr);
    try{const res=await fetch('http://127.0.0.1:'+PORT+'/health');if(res.ok){ready=true;break}}catch{}
    await wait(60);
  }
  assert(ready,'Servidor local precisa iniciar');
  const a=await open();clients.push(a);
  const aJoined=receive(a,m=>m.type==='joined');
  a.send(encode('join',{room:'TESTROOM1',name:'DonoTeste'}));
  assert.equal((await aJoined).room,'TESTROOM1');
  const b=await open();clients.push(b);
  const bJoined=receive(b,m=>m.type==='joined');
  b.send(encode('join',{room:'TESTROOM1',name:'JogadorTeste'}));
  assert.deepEqual((await bJoined).limitedEggs,[]);
  const adminOk=receive(a,m=>m.type==='admin-ok');
  a.send(encode('admin-auth',{password:secret}));
  await adminOk;

  const created=receive(b,m=>m.type==='event'&&m.kind==='limited');
  a.send(encode('admin-limited',{eggs:[{x:0,z:-902}]}));
  assert.equal((await created).eggs.length,1);

  b.send(encode('move',{x:0,y:0,z:-902,yaw:0}));
  await wait(100);
  const taken=receive(a,m=>m.type==='event'&&m.kind==='limited-take');
  b.send(encode('limited-take',{x:0,z:-902}));
  assert.equal((await taken).egg.z,-902);

  const cleared=receive(b,m=>m.type==='event'&&m.kind==='limited-clear');
  a.send(encode('admin-limited-clear'));
  await cleared;
  b.send(encode('limited-drop',{x:0,z:-902}));
  await wait(100);

  const c=await open();clients.push(c);
  const cJoined=receive(c,m=>m.type==='joined');
  c.send(encode('join',{room:'TESTROOM1',name:'NovoJogador'}));
  assert.deepEqual((await cJoined).limitedEggs,[],'Limpar todos inclui LIMITED que estavam nas mãos');
  const sync=receive(c,m=>m.type==='limited-sync');
  c.send(encode('limited-take',{x:0,z:-902}));
  assert.deepEqual((await sync).eggs,[],'Coleta recusada reconcilia com sala real');

  const d=await open();clients.push(d);
  const dJoined=receive(d,m=>m.type==='joined');
  d.send(encode('join',{room:'OUTRASALA',name:'OutraPessoa'}));
  assert.deepEqual((await dJoined).limitedEggs,[],'LIMITED não migra de sala');
 }finally{
  for(const ws of clients)try{ws.terminate()}catch{}
  child.kill('SIGTERM');
 }
});
