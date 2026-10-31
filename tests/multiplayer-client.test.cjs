'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {spawn}=require('node:child_process'),crypto=require('node:crypto'),WebSocket=require('ws'),T=require('../three.min.js');
const client=fs.readFileSync('multiplayer-client.js','utf8'),html=fs.readFileSync('index.html','utf8');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check,label){for(let n=0;n<200;n++){if(check())return;await pause(25)}throw Error('Tempo esgotado: '+label);}
function createClient(port,name,room,{blockedStorage=false}={}){
 const elements=new Map(),timers=[],messages=[],storage=new Map(),scene=new T.Scene();
 const el=id=>{if(!elements.has(id))elements.set(id,{value:'',style:{},textContent:'',onclick:null});return elements.get(id)};
 el('roomName').value=name;el('roomCode').value=room;
 const store={getItem:k=>storage.get(k)||null,setItem(k,v){if(blockedStorage)throw Error('Storage bloqueado');storage.set(k,v)},removeItem:k=>storage.delete(k)};
 const label=text=>{const o=new T.Sprite(new T.SpriteMaterial());o.set=s=>{o.text=s};o.set(text);return o};
 const S={sp:0,$:0,tm:0,inc:[null,null,null,null],pets:[],idx:{},id:1};
 const ctx={console,WebSocket,crypto,performance,URLSearchParams,Map,Set,Math,Date,JSON,T,sc:scene,document:{hidden:false,getElementById:el,createElement(){return {width:0,height:0,getContext(){return {fillRect(){},strokeRect(){},fillText(){}}}}},addEventListener(){}},navigator:{onLine:true},location:{host:'127.0.0.1:'+port,protocol:'http:',search:'?sala='+room},localStorage:store,sessionStorage:store,
  $:el,GB:new T.BoxGeometry(1,1,1),GY:new T.CylinderGeometry(1,1,1),GS:new T.SphereGeometry(1,8,8),label,
  mk(g,color,scale,parent,pos){const m=new T.Mesh(g,new T.MeshLambertMaterial({color}));m.scale.set(...scale);m.position.set(...pos);parent.add(m);return m},
  S,AP:[],A:{god:false},CFG:{reset:300},SPC:Array.from({length:129},(_,id)=>({n:'Pet '+id})),SZ:[['P',.8],['M',1],['E',1.4],['G',1.9],['C',12/1.8]],RAR:Array(17).fill('Ovo'),LIMITED_ID:104,
  P:{g:new T.Group(),x:0,y:0,z:8,vx:0,vy:0,vz:0,train:false},carry:null,eggs:[],NS:[],OB:[],BASE_HOME:{x:0,z:0},BASE_GROUP:new T.Group(),BASE_FENCE_OB:[],BASE_SLOTS:Array.from({length:16},(_,i)=>({x:[0,52,-52][i%3],z:Math.floor(i/3)*56})),
  EGG_NIGHT:{phase:'day',until:0,last:''},nextReset:0,dirty:false,AUR:{},GD:[],raccoonGuard:null,BI:Array.from({length:13},()=>({req:0})),ABUSE:{active:null},ownerVerified:false,adminBadge:{visible:false},window:{},INCUBATOR_MAX_GROWTH:16,
  eggMesh(e){const m=new T.Mesh(ctx.GS,new T.MeshLambertMaterial());m.scale.set(.55,.75,.55);scene.add(m);return m},
  guardAreaOfEgg:e=>e.b,eff:()=>1e10,beep(){},toast:m=>messages.push(m),save(){storage.set('saved',JSON.stringify(S));return true},persistLimitedWorld(){},mkLimitedAura(){},disposeLimitedAura(){},mkAura(){},refreshEggNightUI(){},regrow(){},ft:n=>String(Math.ceil(n)),syncRoomLimitedEggs(){},makeLimitedEgg(){},clearRoomLimitedEggs(){},abuseStop(){ctx.ABUSE.active=null},abuseStart(id,settings){ctx.ABUSE.active={id,left:settings.duration}},abuseAnnounce(){},abuseFlash(){},
  setTimeout:(f,n)=>{const timer=setTimeout(f,n);timers.push(timer);return timer},clearTimeout,setInterval:(f,n)=>{const timer=setInterval(f,n);timers.push(timer);return timer},addEventListener(){},
 };
 const code=html.slice(html.indexOf('const take=e=>'),html.indexOf('const hit=g=>'))+'\n'+html.slice(html.indexOf('const dep=k=>'),html.indexOf('// O tempo prepara'))+'\n'+client+
  '\nglobalThis.api={MP,P,S,eggs,join:mpJoin,meet:mpMeetFriend,disconnect:mpDisconnect,tick:mpUpdate,take,drop,deposit:dep,peers:PEER_BASES,send:mpSend,get carry(){return carry},get home(){return BASE_HOME}};';
 vm.runInNewContext(code,ctx,{filename:'cliente-real.js'});
 const tick=setInterval(()=>ctx.api.tick(.025),25);timers.push(tick);
 return Object.assign(ctx.api,{elements,messages,storage,close(){ctx.api.disconnect(false);for(const t of timers){clearTimeout(t);clearInterval(t)}}});
}
test('dois clientes reais: mesmo mapa, corrida de coleta, base, depósito perdido e reconexão sem duplicar', {timeout:25000},async()=>{
 const port=3101,srv=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','ignore','pipe']});
 const clients=[];let log='';srv.stderr.on('data',d=>log+=d);
 try{
  for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:'+port+'/health')).ok)break}catch{}if(srv.exitCode!==null)throw Error(log);await pause(30)}
  const a=createClient(port,'LuisTeste','CLIENTTEST'),b=createClient(port,'AmigoTeste','CLIENTTEST',{blockedStorage:true});clients.push(a,b);
  a.join();b.join();await until(()=>a.MP.connected&&b.MP.connected,'dois clientes na sala');
  await until(()=>a.MP.players.size===1&&b.MP.players.size===1,'presença sincronizada');
  const ids=c=>c.eggs.map(e=>e.netId).filter(Boolean).sort();assert.deepEqual(ids(a),ids(b));assert.equal(ids(a).length,24);
  assert.notEqual(a.home.x,b.home.x);assert.equal(b.MP.room,'CLIENTTEST','convite funciona com armazenamento bloqueado');
  assert(Math.hypot(a.P.x-b.P.x,a.P.z-b.P.z)<7,'novos amigos chegam perto, mantendo bases distintas');
  assert.equal(a.elements.get('mpFindFriend').disabled,false);
  a.P.x=70;a.P.z=-100;a.P.yaw=1.2;
  await until(()=>b.MP.players.get(a.MP.self)?.x===70,'amigo se afastou');
  assert(b.meet(a.MP.self));
  await until(()=>Math.hypot(a.P.x-b.P.x,a.P.z-b.P.z)<7,'encontro confirmado pelo servidor');
  const direction=new T.Vector2(b.P.x-a.P.x,b.P.z-a.P.z);
  assert(direction.dot(new T.Vector2(-Math.sin(a.P.yaw),-Math.cos(a.P.yaw)))>0,'visitante fica diante da câmera do amigo');
  await until(()=>Math.hypot(a.MP.views.get(b.MP.self).group.position.x-b.P.x,a.MP.views.get(b.MP.self).group.position.z-b.P.z)<.25,'avatar aparece na posição do encontro');
  const id=ids(a)[0];
  for(const c of [a,b]){const e=c.eggs.find(e=>e.netId===id);c.P.x=e.mesh.position.x;c.P.z=e.mesh.position.z;c.take(e);}
  await until(()=>!a.MP.pending&&!b.MP.pending,'disputa resolvida');
  assert.equal(Number(!!a.carry)+Number(!!b.carry),1,'só um cliente carrega o ovo');
  const owner=a.carry?a:b,other=a.carry?b:a;
  await until(()=>other.MP.players.get(owner.MP.self)?.carrying?.id===id,'ovo na mão visível ao amigo');
  owner.P.x=30;owner.P.z=150;owner.drop();await until(()=>!owner.MP.pending&&!owner.carry,'ovo largado');
  await until(()=>other.eggs.some(e=>e.netId===id&&e.mesh.position.z>150),'queda também no pátio de outras bases');
  const dropped=owner.eggs.find(e=>e.netId===id);owner.P.x=dropped.mesh.position.x;owner.P.z=dropped.mesh.position.z;owner.take(dropped);
  await until(()=>!!owner.carry&&!owner.MP.pending,'recolher ovo');
  // Descarta apenas a confirmação do depósito, simulando perda da resposta na rede.
  const socket=owner.MP.socket,original=socket.onmessage;
  socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='egg-result'&&m.action==='egg-deposit'){socket.close();return}original.call(socket,e)};
  const oldId=owner.MP.self;owner.P.x=owner.home.x;owner.P.z=owner.home.z-4;owner.deposit(0);
  await until(()=>owner.S.inc[0]&&owner.MP.connected&&!owner.MP.pending,'depósito recuperado após reconectar');
  assert.equal(owner.MP.self,oldId);assert.equal(owner.S.mpDeposits.length,1);
  assert.equal(owner.S.inc.filter(Boolean).length,1);assert.equal(owner.carry,null);
  assert(!ids(owner).includes(id));
  const receipt=owner.S.mpDeposits[0];owner.MP.pending={type:'egg-deposit',requestId:receipt,id,slot:0,startedAt:performance.now()};owner.send({type:'egg-deposit',id,slot:0,requestId:receipt,position:{x:owner.P.x,y:0,z:owner.P.z,yaw:0}});
  await until(()=>!owner.MP.pending,'repetição confirmada');assert.equal(owner.S.mpDeposits.length,1);assert.equal(owner.S.inc.filter(Boolean).length,1);
  await until(()=>other.MP.baseStates.get(owner.MP.self)?.inc[0],'incubadora visível na base do amigo');
  owner.elements.get('roomCode').value='OUTROTESTE';owner.join();await until(()=>owner.MP.room==='OUTROTESTE'&&owner.MP.connected,'trocar sala');
  await until(()=>other.MP.players.size===0,'jogador sai da sala antiga');
  assert.equal(owner.MP.players.size,0);assert.equal(owner.S.inc.filter(Boolean).length,1,'inventário permanece ao trocar de sala');
  owner.disconnect();await pause(1100);assert.equal(owner.MP.connected,false);assert.equal(owner.MP.socket,null,'Sair cancela a reconexão');
 }finally{for(const c of clients)c.close();srv.kill('SIGTERM')}
});
