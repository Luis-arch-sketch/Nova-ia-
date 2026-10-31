'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const WebSocket=require('ws');
const {setTimeout:pause}=require('node:timers/promises');
const PORT=3138;

function connect(){
 return new Promise((resolve,reject)=>{
  const ws=new WebSocket('ws://127.0.0.1:'+PORT+'/ws'),inbox=[],waiters=[];
  ws.on('message',raw=>{
   let m;try{m=JSON.parse(String(raw))}catch{return}
   const i=waiters.findIndex(w=>w.predicate(m));
   if(i>=0){const w=waiters.splice(i,1)[0];clearTimeout(w.timer);w.resolve(m)}else inbox.push(m);
  });
  ws.inbox=inbox;
  ws.next=(predicate,timeout=3000)=>{
   const i=inbox.findIndex(predicate);
   if(i>=0)return Promise.resolve(inbox.splice(i,1)[0]);
   return new Promise((done,fail)=>{
    const w={predicate,resolve:done};
    w.timer=setTimeout(()=>{const index=waiters.indexOf(w);if(index>=0)waiters.splice(index,1);fail(Error('Mensagem esperada ausente'));},timeout);
    waiters.push(w);
   });
  };
  ws.sendJSON=m=>ws.send(JSON.stringify(m));
  ws.once('open',()=>resolve(ws));ws.once('error',reject);
 });
}
test('HUD servido e chat funciona apenas na sala, com nome confiavel e sem alterar saves', {timeout:18000},async()=>{
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(PORT)},stdio:['ignore','ignore','pipe']});
 let errors='';server.stderr.on('data',b=>errors+=String(b));
 const clients=[];
 try{
  let healthy=false;
  for(let i=0;i<160;i++){
   try{if((await fetch('http://127.0.0.1:'+PORT+'/health')).ok){healthy=true;break}}catch{}
   if(server.exitCode!==null)throw Error('Servidor falhou: '+errors);
   await pause(40);
  }
  assert(healthy,'Servidor nao iniciou: '+errors);
  const html=await (await fetch('http://127.0.0.1:'+PORT+'/')).text();
  assert.match(html,/hud-chat\.js/);
  const jsResponse=await fetch('http://127.0.0.1:'+PORT+'/hud-chat.js');
  assert.equal(jsResponse.status,200);
  const js=await jsResponse.text();
  assert.match(js,/Velocidade:/);assert.match(js,/S\.sp/);assert.match(js,/S\.\$/);
  assert(!js.includes('localStorage.setItem')&&!js.includes('localStorage.removeItem'),'HUD nao deve modificar save');

  const a=await connect(),b=await connect(),other=await connect(),unjoined=await connect();
  clients.push(a,b,other,unjoined);
  for(const [ws,room,name] of [[a,'TESTECHAT','Jogador 8700'],[b,'TESTECHAT','Jogador 5897'],[other,'OUTRASALA','Vizinho']]){
   ws.sendJSON({type:'join',room,name});
   await ws.next(m=>m.type==='joined');
  }
  unjoined.sendJSON({type:'chat',text:'fora da sala'});
  a.sendJSON({type:'chat',text:'OI MANO',name:'Nome falso',room:'OUTRASALA'});
  const received=await b.next(m=>m.type==='chat');
  assert.equal(received.name,'Jogador 8700');
  assert.equal(received.text,'OI MANO');
  assert.equal(received.room,'TESTECHAT');
  assert.equal((await a.next(m=>m.type==='chat')).text,'OI MANO');
  await pause(120);
  assert(!other.inbox.some(m=>m.type==='chat'),'a outra sala nao recebe mensagens');
  assert(!unjoined.inbox.some(m=>m.type==='chat'),'visitante sem sala nao recebe mensagens');
  await pause(1000);
  b.sendJSON({type:'chat',text:'OI'});
  const answer=await a.next(m=>m.type==='chat');
  assert.equal(answer.name,'Jogador 5897');
  assert.equal(answer.text,'OI');
  await pause(1000);
  a.sendJSON({type:'chat',text:'  OLA\nMUNDO  '});
  const clean=await b.next(m=>m.type==='chat');
  assert.equal(clean.text,'OLA MUNDO');
 }finally{for(const ws of clients){try{ws.terminate()}catch{}}server.kill('SIGTERM');}
});
