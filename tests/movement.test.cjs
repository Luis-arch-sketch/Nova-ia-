'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {spawn}=require('node:child_process'),WebSocket=require('ws');
const html=fs.readFileSync('index.html','utf8'),client=fs.readFileSync('multiplayer-client.js','utf8');
function physics(){
 const ctx={OB:[],GB:{},GY:{},T:{MeshBasicMaterial:function(){}},mk:()=>({}),sc:{},BASE_GROUP:{add(){}},label:()=>({position:{set(){}}})};
 vm.runInNewContext(html.slice(html.indexOf('const BASE_FENCE_OB=[];'),html.indexOf('const IV='))+'\n'+html.slice(html.indexOf('const push='),html.indexOf('// Divisões das'))+'\nglobalThis.collide=push;',ctx);
 return ctx;
}
test('trajeto contínuo bloqueia cerca de todos os 16 slots nos dois sentidos em alta velocidade',()=>{
 const ctx=physics(),fence=ctx.OB.map(o=>({...o}));
 for(let slot=0;slot<16;slot++){
  const hx=[0,52,-52][slot%3],hz=Math.floor(slot/3)*56;
  ctx.OB=fence.map(o=>({...o,x:o.x+hx,z:o.z+hz}));
  for(const gap of [0,.5,1])for(const side of [-1,1]){
   for(const inward of [false,true]){
    const from={x:hx+(inward?40:0)*side,z:hz+5+gap};
    const to={x:hx+(inward?0:70)*side,z:from.z,vx:(inward?-1:1)*side*1400,vz:0};
    ctx.collide(to,.5,from.x,from.z);
    assert(inward?(to.x-hx)*side>20:(to.x-hx)*side<20,JSON.stringify({slot,gap,side,inward,to}));
    const zFrom={x:hx+10+gap,z:hz+(side<0?(inward?-40:0):(inward?60:0))};
    const zTo={x:zFrom.x,z:hz+(inward?0:side*100),vx:0,vz:(inward?-1:1)*side*1400};
    ctx.collide(zTo,.5,zFrom.x,zFrom.z);
    const boundary=side<0?-10:30,relative=zTo.z-hz;
    assert(inward?(relative-boundary)*side>0:(relative-boundary)*side<0,JSON.stringify({slot,gap,side,inward,zTo}));
   }
  }
 }
});
test('entrada permanece livre; colisão desliza na lateral e recupera sobreposição exata',()=>{
 const ctx=physics(),entry={x:0,z:20,vx:0,vz:1400};ctx.collide(entry,.5,0,-25);assert.equal(entry.z,20);
 const slide={x:50,z:25,vx:1400,vz:400};ctx.collide(slide,.5,10,0);assert(slide.x<20);assert(slide.z>0);
 ctx.OB=[{x:0,z:0,r:1}];const overlap={x:0,z:0};ctx.collide(overlap,.5);assert(Math.hypot(overlap.x,overlap.z)>=1.5);
});
test('retorno para casa bloqueia ovo, coleta pendente e chocagem antes de enviar pedido',()=>{
 const sent=[],ctx={MP:{connected:true,pending:null},carry:null,window:{},mpStatus(){},toast(){},mpSend:m=>{sent.push(m);return true}};
 vm.runInNewContext(client.slice(client.indexOf('const mpGoHome='),client.indexOf("$('mpFindFriend').onclick"))+'\nglobalThis.goHome=mpGoHome;',ctx);
 ctx.carry={};assert.equal(ctx.goHome(),false);ctx.carry=null;ctx.MP.pending={type:'egg-take'};assert.equal(ctx.goHome(),false);
 ctx.MP.pending=null;ctx.window.RoubeOvoHatching={active:true};assert.equal(ctx.goHome(),false);assert.equal(sent.length,0);
 ctx.window.RoubeOvoHatching.active=false;assert.equal(ctx.goHome(),true);assert.equal(sent[0].type,'go-home');
 ctx.MP.connected=false;assert.equal(ctx.goHome(),false);assert.equal(sent.length,1);
});
function connect(port){return new Promise((resolve,reject)=>{
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),inbox=[],waiters=[];
 ws.on('message',raw=>{const m=JSON.parse(String(raw)),i=waiters.findIndex(w=>w.predicate(m));if(i<0)inbox.push(m);else{const w=waiters.splice(i,1)[0];clearTimeout(w.timer);w.resolve(m)}});
 ws.next=predicate=>{const i=inbox.findIndex(predicate);if(i>=0)return Promise.resolve(inbox.splice(i,1)[0]);return new Promise((resolve,reject)=>{const w={predicate,resolve};w.timer=setTimeout(()=>reject(Error('Sem resposta esperada')),3000);waiters.push(w)})};
 ws.sendJSON=m=>ws.send(JSON.stringify(m));ws.once('open',()=>resolve(ws));ws.once('error',reject);
});}
test('servidor recusa teleporte com ovo mesmo com pacotes seguidos e libera após largar', {timeout:12000},async()=>{
 const port=3106,srv=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','ignore','pipe']}),clients=[];let log='';srv.stderr.on('data',d=>log+=d);
 try{
  for(let i=0;i<100;i++){if(srv.exitCode!==null)throw Error(log);try{if((await fetch('http://127.0.0.1:'+port+'/health')).ok)break}catch{}await new Promise(r=>setTimeout(r,30))}
  for(const name of ['ColetorTeste','AmigoTeste']){const ws=await connect(port);clients.push(ws);ws.sendJSON({type:'join',room:'TESTHOME',name});ws.joined=await ws.next(m=>m.type==='joined')}
  const [a,b]=clients,egg=a.joined.world.eggs[0],position={x:egg.x,y:0,z:egg.z,yaw:0};
  a.sendJSON({type:'egg-take',id:egg.id,requestId:'take-test-123',position});a.sendJSON({type:'go-home'});
  assert.equal((await a.next(m=>m.type==='egg-result')).ok,true);
  assert.match((await a.next(m=>m.type==='error')).message,/carregando um ovo/);
  a.sendJSON({type:'meet',id:b.joined.id});assert.match((await a.next(m=>m.type==='error')).message,/carregando um ovo/);
  a.sendJSON({type:'egg-drop',id:egg.id,requestId:'drop-test-123',position});assert.equal((await a.next(m=>m.type==='egg-result')).ok,true);
  a.sendJSON({type:'go-home'});const home=await a.next(m=>m.type==='reposition');assert.equal(home.reason,'home');assert.equal(home.spawn.x,0);assert.equal(home.spawn.z,8);
  b.sendJSON({type:'go-home'});const second=await b.next(m=>m.type==='reposition');assert.equal(second.spawn.x,52);assert.equal(second.spawn.z,8);
  a.sendJSON({type:'world-request'});const world=await a.next(m=>m.type==='world-sync');assert.equal(world.eggs.filter(e=>e.id===egg.id).length,1,'nenhum ovo perdido ou duplicado');
 }finally{clients.forEach(ws=>ws.terminate());srv.kill('SIGTERM')}
});
