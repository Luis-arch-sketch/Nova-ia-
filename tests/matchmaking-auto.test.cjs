'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const WebSocket=require('ws');

test('Entrada automática agrupa jogadores antes de abrir outra sala', {timeout:30000},async()=>{
 const port=3113;
 const app=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:'ignore'});
 const sockets=[];
 const base='http://127.0.0.1:'+port;
 async function join(type='quick-join',room='SALVAANTIGA'){
  const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws');sockets.push(ws);
  await new Promise((ok,fail)=>{ws.once('open',ok);ws.once('error',fail)});
  const reply=new Promise((ok,fail)=>{
   const timeout=setTimeout(()=>fail(Error('Tempo esgotado ao entrar')),5000);
   const onmessage=raw=>{let m;try{m=JSON.parse(String(raw))}catch{return}
    if(m.type==='joined'||m.type==='error'){clearTimeout(timeout);ws.off('message',onmessage);m.type==='error'?fail(Error(m.message)):ok(m)}};
   ws.on('message',onmessage);
  });
  ws.send(JSON.stringify({type,room,name:'Jogador'+sockets.length}));
  return reply;
 }
 try{
  let ready=false;
  for(let i=0;i<200;i++){
   if(app.exitCode!==null)throw Error('Servidor encerrou antes dos testes');
   try{if((await fetch(base+'/health')).ok){ready=true;break}}catch{}
   await new Promise(r=>setTimeout(r,35));
  }
  assert.equal(ready,true,'servidor respondeu');
  const first=await join();
  assert.match(first.room,/^SRV-[A-Z0-9]{6}$/);
  const second=await join();
  assert.equal(second.room,first.room,'segundo jogador entra no servidor já ocupado');
  assert.equal(second.players.length,2,'ambos os jogadores aparecem na mesma sala');
  for(let i=2;i<16;i++){
   const next=await join();
   assert.equal(next.room,first.room,'todas as vagas devem ser preenchidas antes de criar outra sala');
  }
  const seventeenth=await join();
  assert.notEqual(seventeenth.room,first.room,'nova sala somente ao chegar a 16 jogadores');
  const eighteenth=await join();
  assert.equal(eighteenth.room,seventeenth.room,'próximo jogador preenche a nova sala');
 }finally{
  for(const ws of sockets)try{ws.terminate()}catch{}
  app.kill('SIGTERM');
 }
});
