'use strict';
const crypto=require('node:crypto');
const {WebSocketServer,WebSocket}=require('ws');
const {World,LIMITED,baseSpawn,finite,meetingSpawn}=require('./multiplayer-world.cjs');
const {swingBat}=require('./player-combat.cjs');
const MapLayout=require('./world-layout.js');
const {RadioactiveRaid}=require('./radioactive-raid.cjs');
module.exports=({httpServer,ADMIN_HASH,access,MAX_ROOM,rooms,roomWorlds,sessions,send,publicUser,peers,broadcast,broadcastPresence,refreshRoomLayout,leave,bound,sameHex,error,newPublicRoom,openPublicRoom})=>{
 const wss=new WebSocketServer({server:httpServer,path:'/ws',maxPayload:16384});
 const raid=new RadioactiveRaid();
 const raidPortal=MapLayout.raidPortal;
 const broadcastAll=message=>{for(const players of rooms.values())for(const client of players)send(client,message)};
 const position=(ws,p)=>{
  if(!p||!finite(p.x,-140,140)||!finite(p.y,-1,2000)||!finite(p.z,-945,350)||!finite(p.yaw,-100,100))return false;
  Object.assign(ws,MapLayout.fit(p,ws.hub));ws.y=p.y;ws.yaw=p.yaw;if(finite(p.cameraYaw,-100,100))ws.cameraYaw=p.cameraYaw;return true;
 };
 const bases=room=>[...peers(room)].filter(p=>p.baseState).map(p=>({id:p.id,base:p.baseState}));
 const result=(ws,m,ok,egg=null)=>{const reply={type:'egg-result',action:m.type,requestId:m.requestId,ok,egg,slot:m.slot};
  if(m.type==='egg-deposit'&&ok){ws.session.receipts.set(m.requestId,reply);if(ws.session.receipts.size>100)ws.session.receipts.delete(ws.session.receipts.keys().next().value)}
  send(ws,reply);return reply;
 };
 const roleState=ws=>({owner:!!ws.owner,canAdmin:!!ws.admin,role:ws.owner?'owner':ws.admin?'operator':'player'});
 const applyRole=(ws,owner=false)=>{ws.owner=owner;ws.admin=owner||access.role(ws.principal)==='operator'};
 const listModeration=ws=>{
  if(!ws.owner)return;
  send(ws,{type:'moderation-list',players:[...wss.clients].filter(p=>p.room&&p.readyState===WebSocket.OPEN).map(p=>({id:p.id,name:p.name,room:p.room,principal:p.principal,...roleState(p)})),blocked:access.state.blocked,grants:access.state.grants,banned:access.state.banned,backup:access.backup()});
 };
 wss.on('connection',(ws,req)=>{
  const identity=access.cookie(req)||access.newIdentity();
  Object.assign(ws,{id:crypto.randomUUID(),room:null,admin:false,heldEgg:null,name:'',x:0,y:0,z:8,yaw:0,lastMove:0,failedAdminCount:0,alive:true,rateAt:Date.now(),rateCount:0});
  ws.principal=identity.id;ws.identityToken=identity.token;ws.cookieIdentity=!!access.cookie(req);ws.owner=false;ws.weapon=null;ws.voiceEnabled=false;ws.inRaid=false;ws.raidHp=300;
  const joinTimer=setTimeout(()=>{if(!ws.room)ws.close(1008,'Escolha uma sala')},20000);joinTimer.unref();
  ws.on('pong',()=>{ws.alive=true});
  ws.on('message',raw=>{
   if(ws.replaced)return;
   const now=Date.now();if(now-ws.rateAt>=1000){ws.rateAt=now;ws.rateCount=0}if(++ws.rateCount>100){ws.close(1008,'Muitas mensagens');return}
   let m;try{m=JSON.parse(String(raw));if(!m||typeof m!=='object'||Array.isArray(m))return}catch{return}
   if(m.type==='join'||m.type==='quick-join'||m.type==='create-server'){
    // Clientes antigos ainda tentam reconectar depois de perder a sessão.
    // O token aposentado impede que eles derrubem a nova aba em um ciclo.
    if(typeof m.token==='string'&&sessions.get(m.token)?.replaced){error(ws,'Esta sessão foi substituída por outra aba. Reabra o jogo para jogar aqui.');ws.close(4001,'Sessão substituída');return}
    if(!ws.cookieIdentity&&!ws.room){
     const remembered=access.identity(m.identity);
     const resumed=typeof m.token==='string'?sessions.get(m.token)?.principal:null;
     if(remembered||resumed){ws.principal=remembered||resumed;ws.identityToken=access.sign({kind:'player',id:ws.principal})}
    }
    if(access.banned(ws.principal)){send(ws,{type:'kicked',message:'Você foi expulso por violar regras do jogo.'});ws.close(4003,'Banido do jogo');return}
    if((access.kicks.get(ws.principal)||0)>now){send(ws,{type:'kicked',message:'Você foi expulso pelo dono. Aguarde para entrar novamente.'});ws.close(4003,'Expulso pelo dono');return}
    // Uma identidade validada representa uma pessoa, inclusive ao recarregar
    // antes de a conexão antiga terminar de fechar no celular.
    const previous=[...wss.clients].filter(p=>p!==ws&&p.room&&p.principal===ws.principal);
    const current=previous.find(p=>p.session);
    const room=m.type==='create-server'?newPublicRoom():m.type==='quick-join'?(current?.room||openPublicRoom()):String(m.room||'').trim().toUpperCase();
    const name=String(m.name||'').trim();
    if(!/^[A-Z0-9-]{3,12}$/.test(room)||name.length<2||name.length>20||/[\u0000-\u001f\u007f]/.test(name)||/^admin$/i.test(name)){error(ws,'Nome ou código de sala inválido');return}
    // Validar a sala de destino antes de abandonar a sala atual.
    if(peers(room).size-(ws.room===room?1:0)-previous.filter(p=>p.room===room).length>=MAX_ROOM){error(ws,'Sala cheia: máximo 16 jogadores');return}
    const occupied=new Set([...peers(room)].filter(p=>p!==ws&&!previous.includes(p)).map(p=>p.baseSlot));
    const tokenSession=typeof m.token==='string'?sessions.get(m.token):null;
    const candidate=current?.room===room?current.session:tokenSession;
    const resume=candidate&&candidate.principal===ws.principal&&candidate.room===room&&candidate.expiresAt>now?candidate:null;
    const transferring=previous.find(p=>p.session===resume);
    const state=transferring?{heldEgg:transferring.heldEgg,baseState:transferring.baseState,avatar:transferring.avatar,weapon:transferring.weapon,training:transferring.training}:null;
    const preferred=resume?.slot??(ws.room===room?ws.baseSlot:null);
    const baseSlot=Number.isInteger(preferred)&&!occupied.has(preferred)?preferred:Array.from({length:MAX_ROOM},(_,i)=>i).find(i=>!occupied.has(i));
    if(baseSlot===undefined){error(ws,'Sala sem bases livres');return}
    const otherPlayers=[...peers(room)].filter(p=>p!==ws&&!previous.includes(p)&&p.readyState===WebSocket.OPEN);
    const anchor=otherPlayers.find(p=>p.id===m.friend)||otherPlayers[0];
    const oldRooms=new Set([...previous.map(p=>p.room),ws.room].filter(Boolean));
    for(const old of previous){
     if(old===transferring)old.heldEgg=null; // transfere o ovo, sem duplicar ou largar
     old.replaced=true;send(old,{type:'session-replaced'});leave(old,true);
     old.close(4001,'Sessão transferida');
    }
    leave(ws,true);clearTimeout(joinTimer);
    const session=resume||{token:crypto.randomBytes(24).toString('hex'),id:crypto.randomUUID(),receipts:new Map()};
    if(transferring){
     sessions.set(session.token,{principal:ws.principal,room,active:false,expiresAt:now+120000,replaced:true});
     session.token=crypto.randomBytes(24).toString('hex');
    }
    Object.assign(session,{room,slot:baseSlot,active:true,expiresAt:Infinity,principal:ws.principal});sessions.set(session.token,session);
    const spawn=resume?.position||(anchor?meetingSpawn(anchor,baseSlot-1):{...baseSpawn(baseSlot,otherPlayers.length+1),y:0,yaw:0,cameraYaw:0});
    Object.assign(ws,{session,id:session.id,room,name,admin:false,baseSlot,...spawn,home:resume?.home||null,training:false,baseState:null,heldEgg:null,voiceEnabled:false});
    if(state)Object.assign(ws,state);
    applyRole(ws,access.resumeOwner(ws.principal,m.ownerToken,m.accessBackup));
    if(!rooms.has(room))rooms.set(room,new Set());rooms.get(room).add(ws);
    if(!roomWorlds.has(room))roomWorlds.set(room,roomWorlds.values().next().value||new World(now)); // Um mundo de ovos único, mesmo entre salas
    const world=roomWorlds.get(room);world.emptyAt=0;world.tick(now);
    const layout=refreshRoomLayout(room);
    if(!resume&&anchor)Object.assign(ws,meetingSpawn(anchor,ws.baseSlot-1));
     // Respeitar a posição recuperada ao reconectar durante a noite.
     if(world.phase!=='day'&&!resume&&!anchor){
      const home={...baseSpawn(ws.baseSlot,layout.count),y:0,yaw:0,cameraYaw:0};
      Object.assign(ws,home);Object.assign(spawn,home);
     }
    Object.assign(spawn,{x:ws.x,y:ws.y,z:ws.z,yaw:ws.yaw,cameraYaw:ws.cameraYaw||0});
    send(ws,{type:'joined',protocol:2,id:ws.id,token:session.token,identity:ws.identityToken,room,baseSlot:ws.baseSlot,spawn,layout,carrying:ws.heldEgg,players:[...peers(room)].map(publicUser),limitedEggs:world.limited(),world:world.snapshot(now),bases:bases(room),event:world.event,...roleState(ws),accessBackup:ws.owner?access.backup():undefined});
    for(const oldRoom of oldRooms)if(oldRoom!==room)broadcastPresence(oldRoom);
    send(ws,{...raid.state(now),...raid.restore(ws.principal,m.raidWalletToken,access)});
    broadcastPresence(room);return;
   }
   if(m.type==='ping'){send(ws,{type:'pong',serverNow:now});return}
   if(!ws.room)return;
   if(m.type==='voice-state'){
    if(typeof m.enabled!=='boolean')return;
    ws.voiceEnabled=m.enabled;
    broadcast(ws.room,{type:'voice-presence',id:ws.id,enabled:ws.voiceEnabled},ws);
    broadcastPresence(ws.room);return;
   }
   if(m.type==='voice-signal'){
    if(!ws.voiceEnabled||typeof m.target!=='string'||!m.signal||typeof m.signal!=='object')return;
    const remote=[...peers(ws.room)].find(p=>p!==ws&&p.id===m.target&&p.voiceEnabled);
    if(!remote)return;
    const s=m.signal;
    if((s.type==='offer'||s.type==='answer')&&typeof s.sdp==='string'&&s.sdp.length<14000)
     send(remote,{type:'voice-signal',from:ws.id,signal:{type:s.type,sdp:s.sdp}});
    else if(s.type==='candidate'&&typeof s.candidate?.candidate==='string'&&s.candidate.candidate.length<1600){
     const ice=s.candidate;
     send(remote,{type:'voice-signal',from:ws.id,signal:{type:'candidate',candidate:{candidate:ice.candidate,sdpMid:typeof ice.sdpMid==='string'?ice.sdpMid.slice(0,24):null,sdpMLineIndex:Number.isInteger(ice.sdpMLineIndex)?ice.sdpMLineIndex:0}}});
    }
    return;
   }
   // Chat de texto: apenas membros conectados a esta mesma sala recebem a mensagem.
   // Nome e sala saem da sessao validada pelo servidor; o cliente nunca os escolhe no pacote.
   if(m.type==='rename'){
    const name=typeof m.name==='string'?m.name.trim():'';
    if(name.length<2||name.length>20||/[\u0000-\u001f\u007f-\u009f\u202a-\u202e]/.test(name)||/^admin$/i.test(name)){error(ws,'Nome inválido (2 a 20 caracteres; ADMIN reservado).');return;}
    if(ws.name!==name){ws.name=name;broadcastPresence(ws.room);}
    send(ws,{type:'name-updated',name});return;
   }
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
   if(m.type==='equip'){
    if(m.weapon!==null&&m.weapon!=='bat'&&m.weapon!=='radioactive-bat')return;
    ws.weapon=m.weapon;send(ws,{type:'equipment',weapon:ws.weapon});broadcastPresence(ws.room);return;
   }
   if(m.type==='raid-portal'){
    const entering=m.to==='arena',leaving=m.to==='town';
    if(entering&&raid.hp<=0){send(ws,{type:'raid-error',message:'Portal fechado. Proxima batalha em '+Math.max(1,Math.ceil((raid.respawnAt-now)/1000))+' segundos.'});return}
    if(!entering&&!leaving)return;
    if(now-(ws.lastRaidPortal||0)<1700)return;
    const origin=entering?raidPortal.town:raidPortal.arena;
    if(Math.hypot(ws.x-origin.x,ws.z-origin.z)>6){
     send(ws,{type:'raid-error',message:'Chegue perto do portal para atravessar.'});return;
    }
    if(ws.heldEgg){
     send(ws,{type:'raid-error',message:'Guarde ou solte seu ovo antes de entrar no portal.'});return;
    }
    const destination=entering?raidPortal.arrivalArena:raidPortal.arrivalTown;
    const spawn={...MapLayout.fit(destination,ws.hub),y:0,yaw:0,cameraYaw:0};
    ws.lastRaidPortal=now;ws.inRaid=entering;ws.raidHp=300;Object.assign(ws,spawn,{training:false,dirtyMove:true});
    send(ws,{type:'raid-player-hp',hp:300,maxHp:300});
    if(ws.session)ws.session.position={...spawn};
    send(ws,{type:'reposition',reason:entering?'raid-enter':'raid-exit',spawn});
    broadcastPresence(ws.room);return;
   }
   if(m.type==='raid-hit'){
    const result=raid.hit(ws,now);
    if(!result.ok){send(ws,{type:'raid-error',message:result.reason});return}
    broadcastAll(raid.state(now));
    if(result.defeated){
     for(const award of result.awards)for(const client of wss.clients)if(client.room&&client.principal===award.id)
      send(client,{type:'raid-reward',earned:award.candies,...raid.wallet(award.id,access)});
     broadcastAll({type:'raid-defeated',by:ws.name});
    }
    return;
   }
   if(m.type==='raid-buy'){
    if(now-(ws.lastRaidBuy||0)<350)return;
    ws.lastRaidBuy=now;
    if(!position(ws,m.position)||Math.hypot(ws.x-raid.x,ws.z-raid.z)>24){send(ws,{type:'raid-error',message:'Visite a arena para comprar ovos.'});return}
    if(!raid.canBuy(ws.principal)){send(ws,{type:'raid-error',message:'Voce precisa de mais doces.'});return}
    const rarity=raid.roll(),spot=MapLayout.fit({x:ws.x+2,z:ws.z+2},ws.hub);
    const egg=world.add(0,rarity,1,spot.x,spot.z,now,rarity,null,[]);
    if(!egg){send(ws,{type:'raid-error',message:'O mundo esta cheio de ovos. Tente novamente.'});return}
    egg.halloween=true;egg.adminSpawned=true;egg.expiresAt=now+600000;
    raid.spend(ws.principal);
    broadcastAll({type:'world-add',eggs:[egg]});
    const label=rarity===7?'Divino':rarity===6?'Eterno':rarity===5?'Secreto':'Surpresa';
    send(ws,{type:'raid-purchase',rarity:label,egg,...raid.wallet(ws.principal,access)});
    return;
   }
   if(m.type==='bat-swing'){
    const hit=swingBat(ws,peers(ws.room),world,now);
    send(ws,{type:'bat-result',ok:hit.ok,hit:!!hit.target,message:hit.reason||''});
    if(!hit.ok)return;
    broadcast(ws.room,{type:'combat-swing',id:ws.id});
    if(hit.egg){
     send(hit.target,{type:'egg-forced-drop',egg:hit.egg,by:ws.id});
     broadcast(ws.room,{type:'world-add',eggs:[hit.egg]});
     broadcast(ws.room,{type:'combat-hit',id:ws.id,target:hit.target.id,eggId:hit.egg.id});
     broadcastPresence(ws.room);
    }
    return;
   }
   if(m.type==='stats'){
    if(!finite(m.money,0,1e100)||!finite(m.speed,0,1e100))return;
    ws.money=m.money;ws.speed=m.speed;
    // Apenas opções conhecidas de avatar circulam pela sala; dados de progresso permanecem locais.
    if(m.avatar&&typeof m.avatar==='object'){
     const options={kind:['boy','girl'],hair:['short','long','curly','ponytail'],color:['black','brown','blonde','pink','blue'],outfit:['blue','red','green','purple']};
     const avatar={};for(const [key,values] of Object.entries(options))avatar[key]=values.includes(m.avatar[key])?m.avatar[key]:values[0];
     const extras=['cap','glasses','headphones','scarf','mask','backpack','halo','wings'];
     const acc=Array.isArray(m.avatar.accessories)?m.avatar.accessories:(m.avatar.accessory&&m.avatar.accessory!=='none'?[m.avatar.accessory]:[]);
     avatar.accessories=[...new Set(acc.filter(v=>extras.includes(v)))];
     if(JSON.stringify(ws.avatar)!==JSON.stringify(avatar)){ws.avatar=avatar;broadcastPresence(ws.room)}
    }
    if(m.base&&Array.isArray(m.base.inc)){
     const species=s=>Number.isInteger(s)&&s>=0&&s<=128&&!new Set([0,9]).has(s);
     const validMut=a=>[...new Set((Array.isArray(a)?a:[]).filter(v=>Number.isInteger(v)&&v>=0&&v<8))];
     ws.baseState={tm:Math.round(bound(m.base.tm,0,10)),inc:m.base.inc.slice(0,4).map(e=>e&&species(e.s)&&finite(e.size,0,4)&&finite(e.until,0,1e14)?{s:e.s,size:Math.floor(e.size),until:e.until,m:validMut(e.m)}:null),pets:(Array.isArray(m.base.pets)?m.base.pets:[]).slice(0,18).filter(e=>e&&species(e.s)&&finite(e.size,0,4)).map(e=>({s:e.s,size:Math.floor(e.size),m:validMut(e.m)}))};
     broadcast(ws.room,{type:'base-state',id:ws.id,base:ws.baseState},ws);
    }
    return;
   }
   if(m.type==='move'){if(position(ws,m)){ws.training=!!m.training;ws.dirtyMove=true}return}
   if(m.type==='go-home'||m.type==='meet'){
    if(ws.heldEgg&&m.type==='meet'){error(ws,'Leve o ovo para sua base antes de encontrar amigos.');return}
    if(m.type==='go-home'){
     const spawn={x:ws.home.x,z:ws.home.z+8,y:0,yaw:0,cameraYaw:0};Object.assign(ws,spawn,{training:false});
     send(ws,{type:'reposition',reason:'home',spawn});broadcastPresence(ws.room);return;
    }
    const friend=[...peers(ws.room)].find(p=>p.id===m.id&&p!==ws&&p.readyState===WebSocket.OPEN);
    if(!friend){error(ws,'Seu amigo precisa estar conectado na mesma sala.');return}
    const spawn=meetingSpawn(friend);Object.assign(ws,spawn,{training:false});
    send(ws,{type:'reposition',spawn,friend:friend.id,name:friend.name});broadcastPresence(ws.room);return;
   }
   // Mutacoes equipadas sao aplicadas apenas em ovos reais proximos.
   if(m.type==='egg-mutate'){
    const requestId=typeof m.requestId==='string'?m.requestId:'';
    const answer=(ok,egg=null)=>send(ws,{type:'egg-mutate-result',ok,requestId,id:m.id,mutation:m.mutation,egg});
    if(!/^[A-Za-z0-9-]{8,80}$/.test(requestId))return;
    if(ws.session.receipts.has(requestId)){send(ws,ws.session.receipts.get(requestId));return}
    if(!Number.isInteger(m.mutation)||m.mutation<0||m.mutation>=8||!position(ws,m.position)){answer(false);return}
    const egg=world.eggs.get(m.id);
    if(!egg||world.phase!=='day'||Math.hypot(egg.x-ws.x,egg.z-ws.z)>5||
       (Array.isArray(egg.m)&&egg.m.includes(m.mutation))){answer(false);return}
    egg.m=Array.isArray(egg.m)?[...egg.m,m.mutation]:[m.mutation];
    const reply={type:'egg-mutate-result',ok:true,requestId,id:egg.id,mutation:m.mutation,egg};
    ws.session.receipts.set(requestId,reply);
    if(ws.session.receipts.size>100)ws.session.receipts.delete(ws.session.receipts.keys().next().value);
    send(ws,reply);broadcast(ws.room,{type:'world-add',eggs:[egg]},ws);return;
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
    const denied=message=>send(ws,{type:'error',scope:'admin',message});
    if(access.blocked(ws.principal)){denied('Seu acesso ao painel foi bloqueado pelo dono.');return}
    if(!ADMIN_HASH){denied('ADMIN_PASSWORD_HASH ausente no servidor');return}
    const hash=crypto.createHash('sha256').update(String(m.password||'').slice(0,256)).digest('hex');
    if(!sameHex(hash,ADMIN_HASH)){ws.failedAdminCount++;denied('Acesso de administrador recusado');if(ws.failedAdminCount>=5)ws.close(1008,'Muitas tentativas');return}
    const claim=access.claimOwner(ws.principal);if(claim.error){denied(claim.error);return}
    ws.owner=true;ws.admin=true;ws.failedAdminCount=0;send(ws,{type:'admin-ok',...roleState(ws),ownerToken:claim.token,accessBackup:access.backup()});broadcastPresence(ws.room);return;
   }
   if(m.type==='moderation-list'){listModeration(ws);return}
   if(m.type==='moderate'){
    if(!ws.owner){error(ws,'Somente o dono pode expulsar jogadores ou mudar o acesso ao painel.');return}
    const target=[...wss.clients].find(p=>p.room&&p.id===m.id);
    const record=target||[...access.state.blocked,...access.state.grants,...access.state.banned].find(p=>p.id===m.principal);
    const principal=target?.principal||record?.id;
    if(!record||!principal){error(ws,'Jogador não encontrado. Atualize a lista.');return}
    if(principal===access.state.ownerId){error(ws,'O dono não pode ser expulso nem perder seu acesso.');return}
    if(m.action==='kick'){
     if(!target)return;
     access.kicks.set(principal,now+30000);send(target,{type:'kicked',message:'Você foi expulso pelo dono deste jogo.'});leave(target);target.close(4003,'Expulso pelo dono');
    }else{
     const changed=access.change(m.action,principal,record.name);if(changed.error){error(ws,changed.error);return}
     for(const client of wss.clients)if(client.room&&client.principal===principal){
      if(m.action==='ban'){
       send(client,{type:'kicked',message:'Você foi expulso por violar regras do jogo.'});leave(client);client.close(4003,'Banido do jogo');
      }else{
       applyRole(client);send(client,{type:'admin-state',...roleState(client),message:client.admin?'O dono liberou seu acesso ao painel.':'O dono removeu seu acesso ao painel.'});broadcastPresence(client.room);
      }
     }
    }
    send(ws,{type:'moderation-result',ok:true,action:m.action,name:record.name,accessBackup:access.backup()});listModeration(ws);return;
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
    for(const e of input)if(e&&Number.isInteger(e.b)&&e.b>=0&&e.b<13&&Number.isInteger(e.j)&&e.j>=0&&e.j<8&&Number.isInteger(e.size)&&e.size>=0&&e.size<5&&finite(e.x,-97,97)&&finite(e.z,-937,333)&&Number.isInteger(e.s)&&((e.s===e.b*8+e.j)||(e.s>=105&&e.s<129))){const egg=world.add(e.b,e.j,e.size,e.x,e.z,now,e.s,null,e.m);if(egg){egg.adminSpawned=true;egg.expiresAt=now+600000;eggs.push(egg)}}
    if(eggs.length){
     broadcast(ws.room,{type:'world-add',eggs});
     broadcast(ws.room,{type:'event',kind:'admin-egg-spawn',eggs:eggs.map(e=>({s:e.s,b:e.b,j:e.j,r:e.r,m:e.m})),by:ws.name});
    }
    return;
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
  if(raid.tick(now))broadcastAll(raid.state(now));
  const combatants=[...wss.clients].filter(p=>p.room&&p.readyState===WebSocket.OPEN);
  for(const event of raid.attacks(now,combatants)){
   if(event.type==='raid-attack'){broadcastAll(event);continue}
   const victim=combatants.find(p=>p.id===event.id);if(!victim)continue;
   send(victim,event);
   if(event.dead){
    const spawn={...MapLayout.fit(raidPortal.arrivalTown,victim.hub),y:0,yaw:0,cameraYaw:0};
    victim.inRaid=false;victim.raidHp=300;Object.assign(victim,spawn,{training:false,dirtyMove:true});
    if(victim.session)victim.session.position={...spawn};
    send(victim,{type:'reposition',reason:'raid-death',spawn});
    broadcastPresence(victim.room);
   }
  }
  for(const [room,world] of roomWorlds){
   if(!rooms.has(room)){if(world.emptyAt&&now-world.emptyAt>120000)roomWorlds.delete(room);continue}
   if(world.tick(now)){
     // A renovação noturna não desloca jogadores nem interrompe o treino na esteira.
     broadcast(room,world.snapshot(now));
    }
   if([...peers(room)].some(p=>p.dirtyMove)){for(const p of peers(room))p.dirtyMove=false;broadcastPresence(room)}
   if(now-(world.lastSnapshot||0)>6000){world.lastSnapshot=now;broadcast(room,world.snapshot(now))}
  }
  for(const [token,s] of sessions)if(!s.active&&now>s.expiresAt)sessions.delete(token);
  for(const [id,until] of access.kicks)if(now>until)access.kicks.delete(id);
 },100);updates.unref();
 const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue}ws.alive=false;try{ws.ping()}catch{ws.terminate()}}},15000);heartbeat.unref();
 wss.on('close',()=>{clearInterval(updates);clearInterval(heartbeat)});
 return wss;
};

