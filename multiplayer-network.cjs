'use strict';
const crypto=require('node:crypto');
const {WebSocketServer,WebSocket}=require('ws');
const {World,LIMITED,baseSpawn,finite,meetingSpawn}=require('./multiplayer-world.cjs');
module.exports=({httpServer,ADMIN_HASH,MAX_ROOM,rooms,roomWorlds,sessions,send,publicUser,peers,broadcast,broadcastPresence,leave,bound,sameHex,error,newPublicRoom,openPublicRoom})=>{
 const wss=new WebSocketServer({server:httpServer,path:'/ws',maxPayload:16384});
 const position=(ws,p)=>{
  if(!p||!finite(p.x,-99,99)||!finite(p.y,-1,2000)||!finite(p.z,-945,333)||!finite(p.yaw,-100,100))return false;
  ws.x=p.x;ws.y=p.y;ws.z=p.z;ws.yaw=p.yaw;if(finite(p.cameraYaw,-100,100))ws.cameraYaw=p.cameraYaw;return true;
 };
 const bases=room=>[...peers(room)].filter(p=>p.baseState).map(p=>({id:p.id,base:p.baseState}));
 const result=(ws,m,ok,egg=null)=>{const reply={type:'egg-result',action:m.type,requestId:m.requestId,ok,egg,slot:m.slot};
  if(m.type==='egg-deposit'&&ok){ws.session.receipts.set(m.requestId,reply);if(ws.session.receipts.size>100)ws.session.receipts.delete(ws.session.receipts.keys().next().value)}
  send(ws,reply);return reply;
 };
 wss.on('connection',ws=>{
  Object.assign(ws,{id:crypto.randomUUID(),room:null,admin:false,heldEgg:null,name:'',x:0,y:0,z:8,yaw:0,lastMove:0,failedAdminCount:0,alive:true,rateAt:Date.now(),rateCount:0});
  const joinTimer=setTimeout(()=>{if(!ws.room)ws.close(1008,'Escolha uma sala')},20000);joinTimer.unref();
  ws.on('pong',()=>{ws.alive=true});
  ws.on('message',raw=>{
   const now=Date.now();if(now-ws.rateAt>=1000){ws.rateAt=now;ws.rateCount=0}if(++ws.rateCount>100){ws.close(1008,'Muitas mensagens');return}
   let m;try{m=JSON.parse(String(raw));if(!m||typeof m!=='object'||Array.isArray(m))return}catch{return}
   if(m.type==='join'||m.type==='quick-join'||m.type==='create-server'){
    const room=m.type==='create-server'?newPublicRoom():m.type==='quick-join'?openPublicRoom():String(m.room||'').trim().toUpperCase();
    const name=String(m.name||'').trim();
    if(!/^[A-Z0-9-]{3,12}$/.test(room)||name.length<2||name.length>20||/[\u0000-\u001f\u007f]/.test(name)||/^admin$/i.test(name)){error(ws,'Nome ou código de sala inválido');return}
    // Validar a sala de destino antes de abandonar a sala atual.
    if(peers(room).size-(ws.room===room?1:0)>=MAX_ROOM){error(ws,'Sala cheia: máximo 16 jogadores');return}
    const occupied=new Set([...peers(room)].filter(p=>p!==ws).map(p=>p.baseSlot));
    const candidate=typeof m.token==='string'?sessions.get(m.token):null;
    const resume=candidate&&candidate.room===room&&candidate.expiresAt>now&&(!candidate.active||ws.session===candidate)?candidate:null;
    const preferred=resume?.slot??(ws.room===room?ws.baseSlot:null);
    const baseSlot=Number.isInteger(preferred)&&!occupied.has(preferred)?preferred:Array.from({length:MAX_ROOM},(_,i)=>i).find(i=>!occupied.has(i));
    if(baseSlot===undefined){error(ws,'Sala sem bases livres');return}
    const anchor=[...peers(room)].filter(p=>p!==ws&&p.readyState===WebSocket.OPEN).find(p=>p.id===m.friend)||[...peers(room)].find(p=>p!==ws&&p.readyState===WebSocket.OPEN);
    leave(ws);clearTimeout(joinTimer);
    const session=resume||{token:crypto.randomBytes(24).toString('hex'),id:crypto.randomUUID(),receipts:new Map()};
    Object.assign(session,{room,slot:baseSlot,active:true,expiresAt:Infinity});sessions.set(session.token,session);
    const spawn=resume?.position||(anchor?meetingSpawn(anchor,baseSlot-1):{...baseSpawn(baseSlot),y:0,yaw:0,cameraYaw:0});
    Object.assign(ws,{session,id:session.id,room,name,admin:false,baseSlot,...spawn,training:false,baseState:null,heldEgg:null});
    if(!rooms.has(room))rooms.set(room,new Set());rooms.get(room).add(ws);
    if(!roomWorlds.has(room))roomWorlds.set(room,new World(now));
    const world=roomWorlds.get(room);world.emptyAt=0;world.tick(now);
    send(ws,{type:'joined',protocol:2,id:ws.id,token:session.token,room,baseSlot,spawn,players:[...peers(room)].map(publicUser),limitedEggs:world.limited(),world:world.snapshot(now),bases:bases(room),event:world.event});
    broadcastPresence(room);return;
   }
   if(m.type==='ping'){send(ws,{type:'pong',serverNow:now});return}
   if(!ws.room)return;
   // Chat de texto: apenas membros conectados a esta mesma sala recebem a mensagem.
   // Nome e sala saem da sessao validada pelo servidor; o cliente nunca os escolhe no pacote.
   if(m.type==='chat'){
    if(typeof m.text!=='string')return;
    const text=m.text.slice(0,160).replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e]/g,' ').trim();
    if(!text || now-(ws.lastChatAt||0)<900)return;
    ws.lastChatAt=now;
    broadcast(ws.room,{type:'chat',room:ws.room,id:ws.id,name:ws.name,text,at:now});
    return;
   }
   const world=roomWorlds.get(ws.room);if(!world)return;
   if(m.type==='world-request'){send(ws,world.snapshot(now));return}
   if(m.type==='stats'){
    if(!finite(m.money,0,1e100)||!finite(m.speed,0,1e100))return;
    ws.money=m.money;ws.speed=m.speed;
    if(m.base&&Array.isArray(m.base.inc)){
     const species=s=>Number.isInteger(s)&&s>=0&&s<=128&&!new Set([0,9]).has(s);
     ws.baseState={tm:Math.round(bound(m.base.tm,0,10)),inc:m.base.inc.slice(0,4).map(e=>e&&species(e.s)&&finite(e.size,0,4)&&finite(e.until,0,1e14)?{s:e.s,size:Math.floor(e.size),until:e.until}:null),pets:(Array.isArray(m.base.pets)?m.base.pets:[]).slice(0,4).filter(e=>e&&species(e.s)&&finite(e.size,0,4)).map(e=>({s:e.s,size:Math.floor(e.size)}))};
     broadcast(ws.room,{type:'base-state',id:ws.id,base:ws.baseState},ws);
    }
    return;
   }
   if(m.type==='move'){if(position(ws,m)){ws.training=!!m.training;ws.dirtyMove=true}return}
   if(m.type==='meet'){
    const friend=[...peers(ws.room)].find(p=>p.id===m.id&&p!==ws&&p.readyState===WebSocket.OPEN);
    if(!friend){error(ws,'Seu amigo precisa estar conectado na mesma sala.');return}
    const spawn=meetingSpawn(friend);Object.assign(ws,spawn,{training:false});
    send(ws,{type:'reposition',spawn,friend:friend.id,name:friend.name});broadcastPresence(ws.room);return;
   }
   if(['egg-take','egg-drop','egg-deposit'].includes(m.type)){
    if(typeof m.requestId!=='string'||!/^[A-Za-z0-9-]{8,80}$/.test(m.requestId))return;
    if(m.type==='egg-deposit'&&ws.session.receipts.has(m.requestId)){send(ws,ws.session.receipts.get(m.requestId));return}
    if(!position(ws,m.position)){result(ws,m,false);return}
    let egg=null;
    if(m.type==='egg-take')egg=world.take(ws,m.id,now);
    else if(m.type==='egg-drop'&&ws.heldEgg?.id===m.id)egg=world.drop(ws);
    else if(m.type==='egg-deposit'&&Number.isInteger(m.slot)&&m.slot>=0&&m.slot<4&&ws.heldEgg?.id===m.id)egg=world.deposit(ws);
    result(ws,m,!!egg,egg);
    if(!egg){send(ws,world.snapshot(now));return}
    if(m.type==='egg-drop')broadcast(ws.room,{type:'world-add',eggs:[egg]});
    else broadcast(ws.room,{type:'world-remove',id:egg.id});
    broadcastPresence(ws.room);return;
   }
   // Compatibilidade com clientes anteriores; as mesmas regras continuam atômicas.
   if(m.type==='limited-take'){
    const eggs=world.limited(),egg=eggs.find(e=>finite(m.x,-99,99)&&finite(m.z,-945,333)&&Math.hypot(e.x-m.x,e.z-m.z)<1.1);
    if(!egg||!world.take(ws,egg.id,now)){send(ws,{type:'limited-sync',eggs});return}
    broadcast(ws.room,{type:'event',kind:'limited-take',egg},ws);broadcast(ws.room,{type:'world-remove',id:egg.id});broadcastPresence(ws.room);return;
   }
   if(m.type==='limited-drop'){
    if(ws.heldEgg?.s!==LIMITED)return;
    const egg=world.drop(ws);broadcast(ws.room,{type:'event',kind:'limited-drop',egg},ws);broadcast(ws.room,{type:'world-add',eggs:[egg]});broadcastPresence(ws.room);return;
   }
   if(m.type==='admin-auth'){
    if(!ADMIN_HASH){error(ws,'ADMIN_PASSWORD_HASH ausente no servidor');return}
    const hash=crypto.createHash('sha256').update(String(m.password||'').slice(0,256)).digest('hex');
    if(!sameHex(hash,ADMIN_HASH)){ws.failedAdminCount++;error(ws,'Acesso de administrador recusado');if(ws.failedAdminCount>=5)ws.close(1008,'Muitas tentativas');return}
    if([...peers(ws.room)].some(p=>p!==ws&&p.admin)){error(ws,'Já existe ADMIN nesta sala');return}
    ws.admin=true;ws.failedAdminCount=0;send(ws,{type:'admin-ok'});broadcastPresence(ws.room);return;
   }
   if(!ws.admin)return;
   if(m.type==='admin-event'){
    const valid=new Set(['secret','eternal','divine','mixed','cosmic','money','profit2','profit10','training','speed','hatch','luck','rainbow','gold','meteor','moon','eclipse','sun','freeze','fury','fireworks']);
    if(m.action==='stop'){world.event=null;send(ws,{type:'event-state',event:null});broadcast(ws.room,{type:'event',kind:'event',action:'stop'},ws);return}
    if(m.action!=='start'||!valid.has(m.id))return;
    const settings={duration:bound(m.settings?.duration??60,15,900),interval:bound(m.settings?.interval??10,3,60),wave:Math.round(bound(m.settings?.wave??1,1,10))};
    world.event={type:'event',kind:'event',action:'start',id:m.id,settings,startedAt:now,endsAt:now+settings.duration*1000};
    send(ws,{type:'event-state',event:world.event});
    broadcast(ws.room,world.event,ws);return;
   }
   if(m.type==='admin-announce'){const text=String(m.text||'').slice(0,160).trim();if(text)broadcast(ws.room,{type:'event',kind:'announce',text,seconds:bound(m.seconds??10,4,30)},ws);return}
   if(m.type==='admin-limited'){
    const input=Array.isArray(m.eggs)?m.eggs.slice(0,100):[],eggs=[];
    for(const p of input)if(p&&finite(p.x,-97,97)&&finite(p.z,-937,333)){const e=world.add(12,7,4,p.x,p.z,now,LIMITED);if(e)eggs.push(e)}
    if(eggs.length){broadcast(ws.room,{type:'world-add',eggs});broadcast(ws.room,{type:'event',kind:'limited',eggs},ws)}return;
   }
   if(m.type==='admin-spawn'){
    const input=Array.isArray(m.eggs)?m.eggs.slice(0,10):[],eggs=[];
    for(const e of input)if(e&&Number.isInteger(e.b)&&e.b>=0&&e.b<13&&Number.isInteger(e.j)&&e.j>=0&&e.j<8&&Number.isInteger(e.size)&&e.size>=0&&e.size<5&&finite(e.x,-97,97)&&finite(e.z,-937,333)&&Number.isInteger(e.s)&&((e.s===e.b*8+e.j)||(e.s>=105&&e.s<129))){const egg=world.add(e.b,e.j,e.size,e.x,e.z,now,e.s);if(egg)eggs.push(egg)}
    if(eggs.length)broadcast(ws.room,{type:'world-add',eggs});return;
   }
   if(m.type==='admin-clear'||m.type==='admin-limited-clear'){
    for(const [id,e] of world.eggs)if(m.type==='admin-clear'||e.s===LIMITED)world.eggs.delete(id);
    for(const player of peers(ws.room))if(m.type==='admin-clear'||player.heldEgg?.s===LIMITED)player.heldEgg=null;
    broadcast(ws.room,{type:'event',kind:'limited-clear'});broadcast(ws.room,world.snapshot(now));broadcastPresence(ws.room);return;
   }
  });
  ws.on('close',()=>{clearTimeout(joinTimer);leave(ws)});ws.on('error',()=>{clearTimeout(joinTimer);leave(ws)});
 });
 // Um pacote por sala a cada 100 ms, sem multiplicar o tráfego por cada movimento.
 const updates=setInterval(()=>{
  const now=Date.now();
  for(const [room,world] of roomWorlds){
   if(!rooms.has(room)){if(world.emptyAt&&now-world.emptyAt>120000)roomWorlds.delete(room);continue}
   if(world.tick(now))broadcast(room,world.snapshot(now));
   if([...peers(room)].some(p=>p.dirtyMove)){for(const p of peers(room))p.dirtyMove=false;broadcastPresence(room)}
  }
  for(const [token,s] of sessions)if(!s.active&&now>s.expiresAt)sessions.delete(token);
 },100);updates.unref();
 const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue}ws.alive=false;try{ws.ping()}catch{ws.terminate()}}},15000);heartbeat.unref();
 wss.on('close',()=>{clearInterval(updates);clearInterval(heartbeat)});
 return wss;
};
