'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const THREE=require('../three.min.js');
const source=fs.readFileSync('halloween-event.js','utf8');
const START=Date.parse('2026-10-13T00:00:00-03:00');
const END=Date.parse('2026-11-01T00:00:00-03:00');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function client(time,serverTime=time){
 const clock={wall:time,monotonic:0},elements=[],events=new Map(),audioList=[];
 let gesture=false;
 const on=(name,fn)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(fn)};
 class FakeDate extends Date{static now(){return clock.wall}}
 class FakeAudio{
  constructor(url){this.src=url;this.paused=true;this.playCalls=0;this.pauseCalls=0;this.events=new Map();audioList.push(this)}
  play(){this.playCalls++;if(!gesture)return Promise.reject(new Error('Autoplay bloqueado'));this.paused=false;return Promise.resolve()}
  pause(){this.pauseCalls++;this.paused=true}
  addEventListener(name,fn){this.events.set(name,fn)}
 }
 const document={title:'Roube um Ovo 3D',hidden:false,head:{appendChild(){}},body:{appendChild(){}},
  addEventListener:on,createElement(tag){const el={tag,id:'',hidden:false,setAttribute(){},getContext(){return {fillRect(){},strokeRect(){},fillText(){}}}};elements.push(el);return el}};
 const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x9fd3ff,90,430);
 const context={T:THREE,sc:scene,sun:{color:new THREE.Color(0xfff2d0)},A:{night:false},nite:0,bg:new THREE.Color(0x9fd3ff),BI:Array(13).fill({}),
  window:{},document,Date:FakeDate,performance:{now:()=>clock.monotonic},Audio:FakeAudio,addEventListener:on,setInterval(){return 1},
  fetch:async()=>({ok:true,json:async()=>({serverNow:serverTime})}),console};
 vm.runInNewContext(source,context);
 return {context,clock,elements,music:audioList[0],
  async touch(){gesture=true;for(const fn of events.get('pointerdown')||[])fn();await flush()},
  advance(ms){clock.wall+=ms;clock.monotonic+=ms;context.window.RoubeOvoHalloween.update()}};
}
test('música obrigatória desbloqueia no primeiro toque e permanece em loop sem controle',async()=>{
 const c=client(START+1000);await flush();
 assert.equal(c.context.window.RoubeOvoHalloween.active,true);
 assert.equal(c.music.paused,true,'o navegador pode bloquear autoplay antes do toque');
 assert.equal(c.music.loop,true);assert.equal(c.music.controls,false);assert.equal(c.music.muted,false);
 assert.equal(c.music.src,'/audio/halloween-spooky-scary-skeletons.mp3');
 await c.touch();assert.equal(c.music.paused,false);
 const count=c.music.playCalls;await c.touch();assert.equal(c.music.playCalls,count,'não cria faixas sobrepostas');
 c.music.paused=true;c.music.events.get('ended')();await flush();assert.equal(c.music.paused,false);
 const root=c.context.sc.getObjectByName('Halloween2026');assert(root);
 const bodies=root.children.find(m=>m.isInstancedMesh);assert.equal(bodies.count,16*4+13*6);
 assert(c.elements.find(e=>e.id==='halloweenBanner').innerHTML.includes('Até 31/10'));
});
test('evento inclui todo o dia 31 e encerra música e decoração à meia-noite de Brasília',async()=>{
 const c=client(END-1000);await flush();await c.touch();
 assert.equal(c.context.window.RoubeOvoHalloween.active,true);
 c.advance(999);assert.equal(c.context.window.RoubeOvoHalloween.active,true);
 c.advance(1);assert.equal(c.context.window.RoubeOvoHalloween.active,false);
 assert.equal(c.music.paused,true);assert.equal(c.music.currentTime,0);assert.equal(c.music.pauseCalls,1);
 assert.equal(c.context.sc.getObjectByName('Halloween2026'),undefined);
 assert.equal(c.elements.find(e=>e.id==='halloweenBanner').hidden,true);
 assert.equal(c.context.document.title,'Roube um Ovo 3D');
});
test('horário do servidor corrige celular com data errada e respeita início e fim',async()=>{
 const c=client(END+86400000,START+1000);await flush();
 assert.equal(c.context.window.RoubeOvoHalloween.active,true);
 c.advance(END-START-1000);assert.equal(c.context.window.RoubeOvoHalloween.active,false);
 const before=client(START-1);await flush();assert.equal(before.context.window.RoubeOvoHalloween.active,false);
 assert.equal(before.music.playCalls,0);assert.equal(before.context.sc.getObjectByName('Halloween2026'),undefined);
});
test('HTTP serve faixa completa, intervalos de áudio e integração válida com o jogo', {timeout:15000},async()=>{
 const port=3086,origin='http://127.0.0.1:'+port;
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
 let stderr='';child.stderr.on('data',d=>{stderr+=d});
 try{
  let ready=false;
  for(let i=0;i<80;i++){
   if(child.exitCode!==null)throw Error('Servidor encerrou: '+stderr);
   try{const r=await fetch(origin+'/health');if(r.ok){ready=true;break}}catch(e){}
   await new Promise(r=>setTimeout(r,50));
  }
  assert(ready,'servidor precisa iniciar');
  const state=await (await fetch(origin+'/api/halloween')).json();
  assert.equal(state.startsAt,START);assert.equal(state.endsAt,END);
  assert.equal(state.active,state.serverNow>=START&&state.serverNow<END);
  assert.equal(state.musicRequired,state.active);
  const expected=fs.readFileSync('audio/halloween-spooky-scary-skeletons.mp3');
  const response=await fetch(origin+state.musicUrl);assert.equal(response.status,200);
  assert.equal(response.headers.get('content-type'),'audio/mpeg');
  const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.length,expected.length);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),crypto.createHash('sha256').update(expected).digest('hex'));
  const first=await fetch(origin+state.musicUrl,{headers:{Range:'bytes=0-1023'}});
  assert.equal(first.status,206);assert.equal(first.headers.get('content-range'),'bytes 0-1023/'+expected.length);
  assert.deepEqual(Buffer.from(await first.arrayBuffer()),expected.subarray(0,1024));
  const suffix=await fetch(origin+state.musicUrl,{headers:{Range:'bytes=-128'}});
  assert.equal(suffix.status,206);assert.deepEqual(Buffer.from(await suffix.arrayBuffer()),expected.subarray(-128));
  const invalid=await fetch(origin+state.musicUrl,{headers:{Range:'bytes='+expected.length+'-'}});assert.equal(invalid.status,416);
  const head=await fetch(origin+state.musicUrl,{method:'HEAD'});assert.equal(head.status,200);
  assert.equal(Number(head.headers.get('content-length')),expected.length);assert.equal((await head.arrayBuffer()).byteLength,0);
  const html=await (await fetch(origin+'/')).text();
  assert(html.includes('/halloween-event.js?v=20261013'));assert(html.includes('/fruits-shop.js'));assert(html.includes('/servers-ui.js'));
  assert(html.includes('window.RoubeOvoHalloween.update();R.render(sc,cam)'));
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  for(const script of scripts)new vm.Script(script[1]);
  const scriptResponse=await fetch(origin+'/halloween-event.js?v=20261013');assert.equal(scriptResponse.status,200);
  assert.equal(await scriptResponse.text(),source);
 }finally{child.kill();await new Promise(resolve=>{if(child.exitCode!==null)resolve();else child.once('exit',resolve)})}
});
