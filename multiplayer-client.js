'use strict';
// O convite também funciona quando o navegador bloqueia o armazenamento local.
const mpInvitation=(new URLSearchParams(location.search).get('sala')||'').trim().toUpperCase();
if(/^[A-Z0-9-]{3,12}$/.test(mpInvitation))$('roomCode').value=mpInvitation;
/* ============ SALAS MULTIPLAYER: presença e eventos ============ */
const MP={socket:null,connected:false,room:'',name:'',self:'',players:new Map(),views:new Map(),lastTx:0,owner:false,settingRemote:false,notice:'',protocol:0,stopped:false,retry:0,retryTimer:null,connectTimer:null,pending:null,clock:null,clockOffset:0,lastRx:0,adminPassword:null,roomEvent:null,baseStates:new Map(),tokens:new Map(),initialMode:mpInvitation?'join':'quick-join'};
MP.canAdmin=false;
MP.baseSlot=0;
const mpPrivateRead=key=>{try{return localStorage.getItem(key)||''}catch{return ''}};
MP.identity=mpPrivateRead('rue3d_identity_v1');MP.ownerToken=mpPrivateRead('rue3d_owner_token_v1');MP.accessBackup=mpPrivateRead('rue3d_access_backup_v1');
const mpApplyRole=message=>{
 MP.owner=message.owner===true;MP.canAdmin=message.canAdmin===true;ownerVerified=MP.owner;adminBadge.visible=MP.owner;
 for(const [field,key] of [['ownerToken','rue3d_owner_token_v1'],['accessBackup','rue3d_access_backup_v1']])if(typeof message[field]==='string'){MP[field]=message[field];try{localStorage.setItem(key,message[field])}catch{}}
 if(typeof adminUnlocked!=='undefined'){
  adminUnlocked=MP.canAdmin;$('adPanel')?.classList?.toggle('locked',!adminUnlocked);
  if(adminUnlocked){$('adKey').value='';$('adAuthError').textContent='';if(typeof adminUI==='function')adminUI(true)}
 }
 if(message.message)toast(message.message);
};
const mpStatus=s=>{$('roomStatus').textContent=s;const h=$('mpPresence');if(h&&!MP.connected)h.textContent=s.startsWith('⚠')?'⚠ Multiplayer: '+s:'🌍 '+s};
// A câmera e o portal realizam uma cena 3D completa, de pelo menos 5,9 segundos.
const mpEntrance=(show,immediate=false)=>{
 const layer=$('mpEntrance');if(!layer||!layer.style)return;
 if(show){
  if(layer.style.display==='block'&&window.RoubeOvoEntrance?.active)return;
  layer.style.display='block';window.RoubeOvoEntrance?.start();
 }else if(immediate){
  window.RoubeOvoEntrance?.stop();layer.style.display='none';
 }else{
  window.RoubeOvoEntrance?.finish();
 }
};
const mpEndpoint=()=>{
 const host=location.host;
 if(location.protocol==='file:')return 'ws://localhost:3000/ws';
 if(!/^https?:/.test(location.protocol))return 'ws://localhost:3000/ws';
 return (location.protocol==='https:'?'wss://':'ws://')+host+'/ws';
};
const mpSend=o=>{try{if(MP.socket?.readyState===WebSocket.OPEN&&MP.socket.bufferedAmount<131072){MP.socket.send(JSON.stringify(o));return true}}catch(e){}return false;};

const setHomeBaseSlot=(slot,preservePosition=false)=>{
 const home=BASE_SLOTS[Number.isInteger(slot)?slot:0]||BASE_SLOTS[0];
 const dx=home.x-BASE_HOME.x,dz=home.z-BASE_HOME.z;
 if(!dx&&!dz)return;
 BASE_HOME.x=home.x;BASE_HOME.z=home.z;BASE_GROUP.position.set(home.x,0,home.z);
 for(const o of BASE_FENCE_OB){o.x+=dx;o.z+=dz}
 if(!preservePosition){P.x+=dx;P.z+=dz}P.vx=P.vz=0;P.train=false;dirty=true;
};
const mpApplyLayout=layout=>{
 if(!layout?.slots||!window.RoubeOvoLayout)return;
 BASE_SLOTS.splice(0,BASE_SLOTS.length,...layout.slots.map(p=>({...p})));
 const training=P.train;setHomeBaseSlot(MP.baseSlot,true);P.train=training;
 window.RoubeOvoPlaza?.resize(layout.hub);window.RoubeOvoWorldActions?.resize(layout.hub);
};
const PEER_BASES=new Map();
const makePeerBase=u=>{
 const slot=BASE_SLOTS[u.baseSlot];if(!slot)return;
 const group=new T.Group();group.position.set(slot.x,0,slot.z);sc.add(group);
 // Os cercados de jogadores online usam ripas abertas, iguais à base própria.
 // Os obstáculos do servidor continuam os mesmos, protegendo colisões e ovos.
 const sections=[[-20,-10,-5,-10],[5,-10,20,-10],[-20,-10,-20,30],
                 [20,-10,20,30],[-20,30,20,30]];
 for(const [x1,z1,x2,z2] of sections){
  const n=Math.max(1,Math.ceil(Math.hypot(x2-x1,z2-z1)/5));
  const length=Math.hypot(x2-x1,z2-z1),angle=-Math.atan2(z2-z1,x2-x1);
  const mx=(x1+x2)/2,mz=(z1+z2)/2;
  for(const [height,color] of [[.65,0xc26d29],[1.45,0xe28d36]]){
   const rail=mk(GB,color,[length,.20,.20],group,[mx,height,mz]);rail.rotation.y=angle;
  }
  for(let i=0;i<=n;i++){
   const t=i/n;
   mk(GB,0x2b3039,[.44,2.24,.44],group,[x1+(x2-x1)*t,1.12,z1+(z2-z1)*t]);
  }
 }
 mk(GY,0xffe14a,[3.6,.05,3.6],group,[0,.06,-4]);
 const sign=label('Base de '+u.name,512,80,8);sign.position.set(0,6,-10);group.add(sign);
 const mark=label('DEPÓSITO',256,64,5);mark.position.set(0,3,-4);group.add(mark);
 const incubators=[];for(const x of [-6,-2,2,6]){mk(GY,0x6d7b8d,[1.4,.5,1.4],group,[x,.25,1.5]);const l=label('vazio',256,64,3);l.position.set(x,3.3,1.5);group.add(l);const egg=new T.Mesh(GS,new T.MeshLambertMaterial({color:0xffffff}));egg.position.set(x,1.5,1.5);egg.scale.set(.6,.85,.6);egg.visible=false;group.add(egg);incubators.push({egg,label:l});}
 mk(GB,0x3b91d8,[2.6,.5,6],group,[-14,.3,4]);
 mk(GB,0x263747,[2,.15,5.6],group,[-14,.65,4]);
 const obstacles=[];
 for(let k=-20;k<=20;k+=2){obstacles.push({x:slot.x+k,z:slot.z+30,r:1});if(Math.abs(k)>=6)obstacles.push({x:slot.x+k,z:slot.z-10,r:1})}
 for(let k=-10;k<=30;k+=2)obstacles.push({x:slot.x-20,z:slot.z+k,r:1},{x:slot.x+20,z:slot.z+k,r:1});
 OB.push(...obstacles);PEER_BASES.set(u.id,{group,obstacles,slot:u.baseSlot,homeX:slot.x,homeZ:slot.z,name:u.name,sign,incubators,pets:[],petSignature:''});
};
const mpSyncBasePets=(base,pets)=>{
 const list=Array.isArray(pets)?pets.slice(0,18):[];
 const signature=JSON.stringify(list);
 if(base.petSignature===signature)return;
 for(const m of base.pets||[])base.group.remove(m);
 base.pets=[];base.petSignature=signature;
 list.forEach((pet,k)=>{
  if(!pet||!SPC[pet.s])return;
  const mods=Array.isArray(pet.m)?pet.m:[];
  const color=new T.Color().setHSL((pet.s*37%360)/360,.56,.58);
  if(mods.length&&MUT[mods[0]])color.lerp(new T.Color(MUT[mods[0]][3]),.7);
  const scale=.64*SZ[pet.size??1][1];
  let model=null;
  try{model=window.RoubeOvoPetCollection?.has?.(pet.s)?window.RoubeOvoPetCollection.create(T,pet.s,scale,sc):window.RoubeOvoVisuals?.create?.(T,pet.s,scale,color,sc);}catch(err){console.warn('Pet do amigo:',err)}
  if(!model){model=new T.Mesh(new T.SphereGeometry(.8,12,9),new T.MeshLambertMaterial({color}));model.scale.setScalar(scale);}
  base.group.add(model);
  model.position.set(-15+(k%6)*6,0,15+Math.floor(k/6)*5);
  if(model.mat?.color)model.mat.color.copy(color);
  base.pets.push(model);
 });
};
const removePeerBase=id=>{
 const b=PEER_BASES.get(id);if(!b)return;
 sc.remove(b.group);b.incubators?.forEach(i=>i.egg.material.dispose());
 b.group.traverse(o=>{if(o.isSprite){o.material.map?.dispose();o.material.dispose()}});
 for(const wall of b.obstacles){const n=OB.indexOf(wall);if(n>=0)OB.splice(n,1)}
 PEER_BASES.delete(id);
};
const syncPeerBase=u=>{
 const b=PEER_BASES.get(u.id);
 if(!Number.isInteger(u.baseSlot)||u.baseSlot<0||u.baseSlot>=BASE_SLOTS.length){removePeerBase(u.id);return}
 const home=BASE_SLOTS[u.baseSlot];
 if(b?.slot!==u.baseSlot||b.homeX!==home.x||b.homeZ!==home.z){removePeerBase(u.id);makePeerBase(u)}
 else if(b.name!==u.name){b.name=u.name;b.sign.set('Base de '+u.name)}
 mpApplyBase(u.id,MP.baseStates.get(u.id));
};

const mpDispose=id=>{removePeerBase(id);const v=MP.views.get(id);if(!v)return;sc.remove(v.group);v.materials.forEach(m=>m.dispose());v.geometries.forEach(g=>g.dispose());if(v.texture)v.texture.dispose();MP.views.delete(id)};
const mpClear=()=>{window.RoubeOvoVoiceChat?.stop();mpClearWorld();for(const id of [...MP.views.keys()])mpDispose(id);for(const id of [...PEER_BASES.keys()])removePeerBase(id);MP.players.clear();MP.baseStates.clear();MP.self='';MP.connected=false;mpApplyRole({});MP.protocol=0;if(MP.roomEvent){abuseStop(true);MP.roomEvent=null;}if(MP.pending?.type!=='egg-deposit')MP.pending=null;$('roomPlayerList').textContent='—';};
const mpBadge=(name,isAdmin)=>{const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=isAdmin?'#5b1f55':'#102448';ctx.fillRect(5,5,502,118);ctx.strokeStyle=isAdmin?'#ff76da':'#73d8ff';ctx.lineWidth=6;ctx.strokeRect(8,8,496,112);ctx.font='bold 46px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=isAdmin?'#ff94e6':'#ffffff';ctx.fillText((isAdmin?'👑 ADMIN':name).slice(0,20),256,65,480);return new T.CanvasTexture(c)};
const mpBuild=(id,u)=>{const grp=new T.Group(),geoms=[],mats=[];const add=(geom,mat,x,y,z)=>{const m=new T.Mesh(geom,mat);m.position.set(x,y,z);grp.add(m);geoms.push(geom);mats.push(mat);return m};
 add(new T.BoxGeometry(.9,1,.55),new T.MeshLambertMaterial({color:0x48cf9d}),0,1.45,0);
 add(new T.SphereGeometry(.28,12,8),new T.MeshLambertMaterial({color:0xf8cca6}),0,2.22,0);
 for(const x of [-.28,.28])add(new T.BoxGeometry(.25,.8,.3),new T.MeshLambertMaterial({color:0x32466a}),x,.45,0);
 for(const side of [-1,1]){
  const arm=new T.Group();arm.name=side>0?'rue-peer-right-arm':'rue-peer-left-arm';arm.position.set(side*.6,2,0);arm.rotation.z=side*.08;grp.add(arm);
  const material=new T.MeshLambertMaterial({color:0xf8cca6}),geometry=new T.BoxGeometry(.25,.8,.3),handGeometry=new T.SphereGeometry(.16,10,7);
  const upper=new T.Mesh(geometry,material);upper.position.y=-.43;arm.add(upper);
  const hand=new T.Mesh(handGeometry,material);hand.position.y=-.87;arm.add(hand);geoms.push(geometry,handGeometry);mats.push(material);
 }
 const texture=mpBadge(u.name,!!u.admin);const sm=new T.SpriteMaterial({map:texture,transparent:true,depthTest:false});mats.push(sm);const label=new T.Sprite(sm);label.position.set(0,3.25,0);label.scale.set(3.2,.8,1);grp.add(label);
 grp.position.set(u.x||0,u.y||0,u.z||0);grp.rotation.y=u.yaw||0;sc.add(grp);const v={group:grp,geometries:geoms,materials:mats,texture,label,admin:!!u.admin,name:u.name};MP.views.set(id,v);return v};
const mpDraw=()=>{
 const others=[...MP.players.values()];
 $('roomPlayerList').textContent=others.map(p=>(p.admin?'👑 ADMIN • ':'👤 ')+p.name).join(' | ')||'—';
 const text=MP.connected
  ?'🌍 SALA '+MP.room+' • '+(others.length+1)+'/16 jogadores'+(others.length?' • 👥 '+others.slice(0,2).map(p=>p.name).join(', ')+(others.length>2?'…':''):'')
  :'🌍 Conectando ao multiplayer…';
 if($('mpPresence').textContent!==text)$('mpPresence').textContent=text;
 const button=$('mpFindFriend');if(button){button.disabled=!MP.connected||!others.length;button.textContent=others.length?'👥 Encontrar amigo':'👥 Esperando amigo';}
};
const mpApplyUsers=(users,layout)=>{const self=users.find(u=>u.id===MP.self);if(self)MP.baseSlot=self.baseSlot;if(layout)mpApplyLayout(layout);const alive=new Set();for(const u of users){if(u.id===MP.self)continue;alive.add(u.id);const prev=MP.players.get(u.id);MP.players.set(u.id,u);let v=MP.views.get(u.id);if(v&&(v.name!==u.name||v.admin!==!!u.admin)){mpDispose(u.id);v=null}if(!v)v=mpBuild(u.id,u);window.RoubeOvoAvatar?.syncRemote(v.group,u.avatar);syncPeerBase(u);}for(const id of MP.views.keys())if(!alive.has(id))mpDispose(id);for(const id of MP.players.keys())if(!alive.has(id))MP.players.delete(id);mpDraw();};
const mpRemoteEvent=ev=>{if(ev.kind==='event'&&ev.action==='start'&&ev.endsAt&&MP.roomEvent?.endsAt===ev.endsAt&&ABUSE.active?.id===ev.id)return;MP.settingRemote=true;try{if(ev.kind==='event'){if(ev.action==='start'){if(ABUSE.active)abuseStop(true);const st={...(ev.settings||{duration:60,interval:10,wave:1})};if(ev.endsAt){st.duration=Math.max(.01,(ev.endsAt-Date.now()-MP.clockOffset)/1000);MP.roomEvent=ev;}abuseStart(ev.id,st)}else if(ev.action==='stop'){abuseStop(true);MP.roomEvent=null;}}else if(ev.kind==='announce'){abuseAnnounce(ev.text,ev.seconds||10)}else if(ev.kind==='admin-egg-spawn'){
 const spawned=Array.isArray(ev.eggs)?ev.eggs:[];
 if(spawned.length){
  const now=Date.now(),grouped=now-(MP.eggSpawnNoticeAt||0)<1200;
  MP.eggSpawnNoticeCount=(grouped?(MP.eggSpawnNoticeCount||0):0)+spawned.length;
  MP.eggSpawnNoticeAt=now;
  const e=spawned[0],count=MP.eggSpawnNoticeCount;
  const mods=Array.isArray(e.m)?e.m.filter(i=>MUT[i]).map(i=>MUT[i][0]):[];
  const label=RAR[e.r]||'especial',animal=SPC[e.s]?.n||'especial';
  const detail=mods.length?' • Mutações: '+mods.join(', '):'';
  const message='🥚 ADMIN spawnou '+count+' ovo'+(count===1?'':'s')+'! '+label+' '+animal+detail;
  if(!grouped)abuseAnnounce(message,10);
  else {const labelEl=$('abMessageText');if(labelEl)labelEl.textContent=message;ABUSE.msgSeconds=ABUSE.msgTotal=10;$('abMessage').style.display='block';}
 }
}else if(ev.kind==='limited'){if(MP.protocol>=2)return;
 for(const p of ev.eggs||[])if(p&&Number.isFinite(p.x)&&Number.isFinite(p.z))makeLimitedEgg(p.x,p.z);
 abuseAnnounce('🔥 O ADMIN invocou o LIMITED ∞ exclusivo nesta sala!',12);abuseFlash(0xff5918,16);
}else if(ev.kind==='limited-clear'){clearRoomLimitedEggs()}
 else if(ev.kind==='limited-take'){
  const p=ev.egg;
  if(p){
   const ix=eggs.findIndex(e=>e.s===LIMITED_ID&&Math.hypot(e.mesh.position.x-p.x,e.mesh.position.z-p.z)<1.1);
   if(ix>=0){const e=eggs[ix];if(e.aura)disposeLimitedAura(e);sc.remove(e.mesh);eggs.splice(ix,1)}
  }
 }else if(ev.kind==='limited-drop'){if(MP.protocol>=2)return;
  if(ev.egg&&Number.isFinite(ev.egg.x)&&Number.isFinite(ev.egg.z))makeLimitedEgg(ev.egg.x,ev.egg.z);
 }}catch(e){console.warn('Evento remoto',e)}finally{MP.settingRemote=false}};
$('roomButton').onclick=()=>{$('roomPanel').style.display='block'};
$('roomClose').onclick=()=>{$('roomPanel').style.display='none'};
$('roomJoin').onclick=()=>mpJoin('join');$('roomLeave').onclick=()=>{mpDisconnect();mpStatus('Saiu da sala.')};

const mpPosition=()=>({x:P.x,y:P.y,z:P.z,yaw:P.g.rotation.y,cameraYaw:Number.isFinite(P.yaw)?P.yaw:0});
const mpPlace=spawn=>{
 if(!spawn||!Number.isFinite(spawn.x)||!Number.isFinite(spawn.z))return;
 P.x=spawn.x;P.z=spawn.z;P.y=Number.isFinite(spawn.y)?Math.max(0,spawn.y):0;P.vx=P.vy=P.vz=0;P.train=false;P.stun=0;
 P.yaw=Number.isFinite(spawn.cameraYaw)?spawn.cameraYaw:0;P.pitch=.45;P.dist=Math.max(8,P.dist||9);
 P.g.position.set(P.x,P.y,P.z);P.g.rotation.y=Number.isFinite(spawn.yaw)?spawn.yaw:0;
 if(typeof cam!=='undefined'){
  const target=new T.Vector3(P.x,P.y+2.2,P.z),distance=Math.cos(P.pitch)*P.dist;
  if(typeof CT!=='undefined')CT.copy(target);
  cam.position.set(P.x+Math.sin(P.yaw)*distance,target.y+Math.sin(P.pitch)*P.dist,P.z+Math.cos(P.yaw)*distance);cam.lookAt(target);
 }
};
const mpMeetFriend=id=>{
 if(!MP.connected){mpStatus('⚠ Entre na mesma sala que seu amigo.');return false;}
 if(carry){mpStatus('⚠ Leve o ovo até sua base a pé antes de se teleportar.');toast('🥚 Não é possível se teleportar carregando um ovo.');return false;}
 if(MP.pending||window.RoubeOvoHatching?.active){toast('⏳ Termine a ação do ovo antes de encontrar seu amigo.');return false;}
 const friends=[...MP.players.values()].sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z));
 const friend=id?MP.players.get(id):friends[0];
 if(!friend){mpStatus('👥 Seu amigo precisa abrir o convite desta sala.');return false;}
 return mpSend({type:'meet',id:friend.id});
};
const mpGoHome=()=>{
 if(!MP.connected){mpStatus('⚠ Entre em uma sala primeiro.');return false;}
 // Voltar à própria base aceita o ovo carregado; depósito continua validado pelo servidor.
 if(MP.pending||window.RoubeOvoHatching?.active){mpStatus('⏳ Termine a ação do ovo antes de voltar para casa.');return false;}
 return mpSend({type:'go-home'});
};
$('mpFindFriend').onclick=()=>mpMeetFriend();
const mpRename=name=>{
 name=String(name||'').trim().slice(0,20);
 if(name.length<2||/^admin$/i.test(name))return false;
 if(!MP.connected){MP.name=name;const input=$('roomName');if(input)input.value=name;try{localStorage.setItem('rue3d_mp_name',name)}catch(e){}typeof CustomEvent==='function'&&window.dispatchEvent(new CustomEvent('roube-player-name-updated',{detail:{name}}));return true;}
 return mpSend({type:'rename',name});
};
const mpDescribeEgg=e=>({id:e.netId,b:e.b,j:e.j,s:e.s,r:e.r,size:e.z,w:e.w,x:e.mesh.position.x,z:e.mesh.position.z,m:Array.isArray(e.m)?e.m:null});
const mpRequestSpawn=(b,j,size,where,fx,mutations)=>{
 if(!MP.connected||!MP.canAdmin)return null;
 b=Math.max(0,Math.min(BI.length-1,Math.floor(b)));j=Math.max(0,Math.min(7,Math.floor(j)));size=Math.max(0,Math.min(4,Math.floor(size)));
 const s=b*8+j;if(!SPC[s]||s===0||s===9)return null;
 const nest=NS[b*8+j],x=where==='player'?P.x+(Math.random()-.5)*5:(nest?.x||0)+(nest?.e?2.5:0),z=where==='player'?P.z+(Math.random()-.5)*5:(nest?.z||(-65-70*b));
 const preview={b,j,s,r:RS[j],z:size,m:mutations};
 if(!mpSend({type:'admin-spawn',eggs:[{b,j,s,size,x:Math.max(-97,Math.min(97,x)),z:Math.max(-937,Math.min(333,z)),m:mutations}]}))return null;
 if(fx){if(preview.r>=7)rareFx([preview]);else playSnd(preview.r)}return preview;
};
const mpRemoveEgg=id=>{
 const e=eggs.find(e=>e.netId===id);if(!e)return;
 if(e.aura){if(e.s===LIMITED_ID)disposeLimitedAura(e);else sc.remove(e.aura)}
 sc.remove(e.mesh);if(e.nest?.e===e)e.nest.e=null;eggs.splice(eggs.indexOf(e),1);
};
const mpClearWorld=()=>{
 for(const e of [...eggs]){if(!e.netId)e.netId='local-'+Math.random();mpRemoveEgg(e.netId)}
 if(carry?.netId){P.g.remove(carry.mesh);if(carry.aura){if(carry.s===LIMITED_ID)disposeLimitedAura(carry);else sc.remove(carry.aura)}carry=null;}
};
const mpUpsertEgg=d=>{
 if(!d||typeof d.id!=='string'||!SPC[d.s]||!Number.isFinite(d.x)||!Number.isFinite(d.z))return null;
 if(carry?.netId===d.id)return carry;
 let e=eggs.find(e=>e.netId===d.id);
 if(!e)e=eggs.find(e=>!e.netId&&e.s===d.s&&Math.hypot(e.mesh.position.x-d.x,e.mesh.position.z-d.z)<1.1);
 if(!e){e={b:d.b,j:d.j,s:d.s,r:d.r,z:d.size,w:d.w,m:Array.isArray(d.m)?d.m:null,st:'caido',gr:1,nest:null};e.mesh=eggMesh(e);e.base=e.mesh.scale.clone();eggs.push(e);if(AUR[e.r])mkAura(e)}
 if(JSON.stringify(e.m||null)!==JSON.stringify(d.m||null)){e.m=Array.isArray(d.m)?d.m:null;if(typeof eggMutationMark==='function')eggMutationMark(e.mesh,e.m);}
 e.netId=d.id;e.guardArea=d.b;e.gr=1;e.mesh.visible=true;e.mesh.scale.copy(e.base);e.mesh.position.set(d.x,.45+e.base.y,d.z);
 if(Number.isInteger(d.nest)&&NS[d.nest]){e.nest=NS[d.nest];e.nest.e=e;}
 return e;
};
const mpWorldSync=m=>{
 const ids=new Set((m.eggs||[]).map(e=>e.id));
 for(const e of [...eggs])if((!e.netId||!ids.has(e.netId))){if(!e.netId)e.netId='local-'+Math.random();mpRemoveEgg(e.netId)}
 for(const e of m.eggs||[])mpUpsertEgg(e);
 if(m.clock){MP.clock=m.clock;MP.clockOffset=m.clock.serverNow-Date.now();mpApplyClock()}
 if(m.event){if(MP.roomEvent?.endsAt!==m.event.endsAt)mpRemoteEvent(m.event);else MP.roomEvent=m.event;}
 else if(Object.hasOwn(m,'event')&&MP.roomEvent){abuseStop(true);MP.roomEvent=null;}
};
const mpApplyClock=()=>{
 if(!MP.connected||!MP.clock)return;
 const c=MP.clock,now=Date.now()+MP.clockOffset;
 let phase=c.phase,until=c.until;
 if(phase==='night'&&now>=until){phase='unlock';until+=3000}
 if(phase==='unlock'&&now>=until){phase='day';until=0;}
 const changed=EGG_NIGHT.phase!==phase||EGG_NIGHT.until!==(until?until-MP.clockOffset:0);EGG_NIGHT.phase=phase;EGG_NIGHT.until=until?until-MP.clockOffset:0;if(changed)EGG_NIGHT.last='';
 nextReset=(c.nextReset-MP.clockOffset)/1000;refreshEggNightUI();
};
const mpBaseState=()=>({tm:S.tm,inc:S.inc.map(e=>e?{s:e.s,size:e.z,until:e.b,m:e.m}:null),pets:AP.slice(0,18).map(e=>({s:e.s,size:e.z,m:e.m}))});
const mpApplyBase=(id,state)=>{
 if(!state)return;MP.baseStates.set(id,state);const base=PEER_BASES.get(id);if(!base)return;
 for(let i=0;i<4;i++){
  const visual=base.incubators[i],egg=state.inc?.[i];visual.egg.visible=!!egg;
  if(egg){const ready=Date.now()+MP.clockOffset>=egg.until;visual.label.set(ready?'🐣 Pronto!':'🥚 '+ft((egg.until-Date.now()-MP.clockOffset)/1000));visual.egg.material.color.setHSL((egg.s*37%360)/360,.65,.62);if(Array.isArray(egg.m)&&egg.m.length&&MUT[egg.m[0]])visual.egg.material.color.lerp(new T.Color(MUT[egg.m[0]][3]),.65)}else visual.label.set('vazio');
 }
 mpSyncBasePets(base,state.pets);
};
const mpStorePending=()=>{try{if(MP.pending?.type==='egg-deposit')sessionStorage.setItem('rue3d_mp_deposit',JSON.stringify({...MP.pending,room:MP.room}));else sessionStorage.removeItem('rue3d_mp_deposit')}catch(e){}};
const mpEggRequest=(type,e,slot)=>{
 if(MP.pending||!MP.connected||!e?.netId)return false;
 const requestId=crypto.randomUUID?.()||('req-'+Date.now()+'-'+Math.random().toString(36).slice(2));
 MP.pending={type,id:e.netId,requestId,slot,egg:mpDescribeEgg(e),startedAt:performance.now()};mpStorePending();
 if(!mpSend({type,id:e.netId,slot,requestId,position:mpPosition()})){if(type!=='egg-deposit')MP.pending=null;return false}return true;
};
const mpFinishDeposit=reply=>{
 if(!reply?.ok)return false;
 if((S.mpDeposits||[]).includes(reply.requestId)){MP.pending=null;mpStorePending();return true;}
 let slot=reply.slot;if(S.inc[slot])slot=S.inc.indexOf(null);if(slot<0)return false;
 if(carry&&carry.netId!==reply.egg.id)return false;
 if(!carry){const e=mpUpsertEgg(reply.egg);if(!e)return false;eggs.splice(eggs.indexOf(e),1);if(e.nest?.e===e)e.nest.e=null;sc.remove(e.mesh);P.g.add(e.mesh);carry=e;}
 MP.settingRemote=true;MP.committingReceipt=reply.requestId;
 try{dep(slot);}finally{MP.settingRemote=false;MP.committingReceipt=null;}
 MP.pending=null;mpStorePending();mpSend({type:'stats',money:S.$,speed:S.sp,base:mpBaseState(),avatar:window.RoubeOvoAvatar?.current()});return true;
};
const mpEggResult=m=>{
 const pending=MP.pending;if(!pending||pending.requestId!==m.requestId)return;
 if(!m.ok){MP.pending=null;mpStorePending();mpStatus('⚠ A ação não foi confirmada. O mapa foi atualizado.');return;}
 if(m.action==='egg-deposit'){pending.accepted=m;mpStorePending();mpFinishDeposit(m);return;}
 MP.pending=null;MP.settingRemote=true;
 try{
  if(m.action==='egg-take'){const e=mpUpsertEgg(m.egg);if(e&&!carry)take(e);}
  else if(m.action==='egg-drop'&&carry?.netId===m.egg.id){const e=carry;drop();e.mesh.position.set(m.egg.x,.45+e.base.y,m.egg.z);}
 }finally{MP.settingRemote=false;}
};
const mpReconnect=()=>{
 if(MP.stopped||MP.retryTimer||navigator.onLine===false)return;
 const delay=Math.min(8000,700*2**Math.min(MP.retry++,4))+Math.random()*300;
 mpStatus('🔄 Reconectando à sala '+MP.room+'…');
 MP.retryTimer=setTimeout(()=>{MP.retryTimer=null;mpJoin('join',true)},delay);
};
const mpDisconnect=(offline=true)=>{
 mpEntrance(false,true);
 MP.stopped=true;clearTimeout(MP.retryTimer);clearTimeout(MP.connectTimer);MP.retryTimer=null;
 const ws=MP.socket;MP.socket=null;try{ws?.close()}catch(e){}mpClear();
 if(offline){MP.baseSlot=0;if(window.RoubeOvoLayout)mpApplyLayout(window.RoubeOvoLayout.state(1));setHomeBaseSlot(0);EGG_NIGHT.phase='day';EGG_NIGHT.until=0;nextReset=Date.now()/1000+CFG.reset;refreshEggNightUI();regrow(true);}
};
const mpJoin=(mode='join',retrying=false)=>{
 const name=String(retrying?MP.name:$('roomName').value).trim().slice(0,20),room=String(retrying?MP.room:$('roomCode').value).trim().toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,12);
 if(name.length<2||(mode==='join'&&room.length<3)){mpStatus('Escolha um nome (mínimo 2) e uma sala (mínimo 3).');return;}
 if(/^admin$/i.test(name)){mpStatus('O nome ADMIN é exclusivo do dono. Escolha outro nome.');return;}
 if(!retrying&&MP.pending?.type==='egg-deposit'&&room!==MP.room){mpStatus('⏳ Aguarde a confirmação do ovo antes de trocar de sala.');return;}
 if(!retrying&&MP.connected){
  let token=MP.tokens.get(room)||'';try{token=token||sessionStorage.getItem('rue3d_mp_token_'+room)||''}catch(e){}
  MP.joining={room,name};mpEntrance(true);mpStatus('Entrando na sala…');mpSend({type:mode,room,name,token,identity:MP.identity,ownerToken:MP.ownerToken,accessBackup:MP.accessBackup,raidWalletToken:mpPrivateRead('rue3d_raid_wallet_v1')});return;
 }
 const pending=MP.pending;mpDisconnect(false);MP.pending=pending?.type==='egg-deposit'?pending:null;
 MP.stopped=false;MP.name=name;MP.room=room;if(!retrying)MP.retry=0;
 mpEntrance(true);
 try{localStorage.setItem('rue3d_mp_name',name)}catch(e){}
 let token=MP.tokens.get(room)||'';try{token=token||sessionStorage.getItem('rue3d_mp_token_'+room)||'';}catch(e){}
 let ws;try{ws=new WebSocket(mpEndpoint())}catch(e){mpReconnect();return;}
 MP.socket=ws;MP.lastRx=performance.now();mpStatus(retrying?'🔄 Reconectando…':'Conectando ao servidor…');
 MP.connectTimer=setTimeout(()=>{if(MP.socket===ws&&!MP.connected){MP.socket=null;try{ws.close()}catch(e){}mpReconnect();}},15000);
 ws.onopen=()=>{if(MP.socket===ws)mpSend({type:mode,room,name,token,friend:new URLSearchParams(location.search).get('amigo')||undefined,identity:MP.identity,ownerToken:MP.ownerToken,accessBackup:MP.accessBackup,raidWalletToken:mpPrivateRead('rue3d_raid_wallet_v1')})};
 ws.onmessage=e=>{if(MP.socket!==ws)return;MP.lastRx=performance.now();let msg;try{msg=JSON.parse(e.data)}catch{return;}
  if(msg.type==='joined'){
   if(MP.connected)mpClear();if(MP.joining){MP.name=MP.joining.name;MP.joining=null;}
   clearTimeout(MP.connectTimer);mpEntrance(false);MP.connected=true;MP.protocol=msg.protocol||1;MP.self=msg.id;MP.room=msg.room;MP.retry=0;MP.lastTx=MP.lastRankTx=0;
   if(msg.identity){MP.identity=msg.identity;try{localStorage.setItem('rue3d_identity_v1',msg.identity)}catch{}}
   mpApplyRole(msg);
   $('roomCode').value=msg.room;MP.tokens.set(msg.room,msg.token);try{localStorage.setItem('rue3d_mp_room',msg.room);sessionStorage.setItem('rue3d_mp_token_'+msg.room,msg.token)}catch(e){}
   MP.baseSlot=msg.baseSlot;mpApplyLayout(msg.layout);setHomeBaseSlot(msg.baseSlot);mpPlace(msg.spawn||{x:BASE_HOME.x,z:BASE_HOME.z+8});
   if(msg.world)mpWorldSync(msg.world);else syncRoomLimitedEggs(msg.limitedEggs||[]);
   if(msg.carrying){MP.settingRemote=true;try{const e=mpUpsertEgg(msg.carrying);if(e&&!carry)take(e)}finally{MP.settingRemote=false}}
   mpApplyUsers(msg.players||[],msg.layout);window.RoubeOvoVoiceChat?.onPlayers(msg.players||[]);for(const b of msg.bases||[])mpApplyBase(b.id,b.base);
   mpStatus('✅ Sala '+MP.room+' conectada • Código para amigos: '+MP.room);
   typeof CustomEvent==='function'&&window.dispatchEvent(new CustomEvent('roube-player-name-updated',{detail:{name:MP.name}}));
   mpSend({type:'stats',money:S.$,speed:S.sp,base:mpBaseState(),avatar:window.RoubeOvoAvatar?.current()});
   if(MP.adminPassword&&!MP.owner)mpSend({type:'admin-auth',password:MP.adminPassword});
   window.RoubeOvoEquipment?.joined();
   if(msg.event)mpRemoteEvent(msg.event);
   if(!MP.pending){try{const p=JSON.parse(sessionStorage.getItem('rue3d_mp_deposit')||'null');if(p?.room===MP.room&&p.type==='egg-deposit')MP.pending=p;}catch(e){}}
   if(MP.pending?.type==='egg-deposit'){const p=MP.pending;if(p.accepted)mpFinishDeposit(p.accepted);else {p.startedAt=performance.now();mpSend({type:p.type,id:p.id,slot:p.slot,requestId:p.requestId,position:mpPosition()});}}
  }else if(msg.type==='name-updated'){
   MP.name=msg.name;$('roomName').value=msg.name;
   typeof CustomEvent==='function'&&window.dispatchEvent(new CustomEvent('roube-player-name-updated',{detail:{name:msg.name}}));
   try{localStorage.setItem('rue3d_mp_name',msg.name)}catch(e){}
  }else if(msg.type==='players'){
   mpApplyUsers(msg.players||[],msg.layout);window.RoubeOvoVoiceChat?.onPlayers(msg.players||[]);
   const self=msg.players?.find(p=>p.id===MP.self);
   if(carry?.netId&&self&&!self.carrying&&!MP.pending){P.g.remove(carry.mesh);if(carry.aura){if(carry.s===LIMITED_ID)disposeLimitedAura(carry);else sc.remove(carry.aura)}carry=null;}
  }else if(msg.type==='world-sync')mpWorldSync(msg);
  else if(msg.type==='reposition'){const training=P.train;if(msg.reason==='layout'){MP.baseSlot=msg.baseSlot;mpApplyLayout(msg.layout)}mpPlace(msg.spawn);if(msg.reason==='layout')P.train=training;$('roomPanel').style.display='none';mpSend({type:'move',...mpPosition(),training:P.train});if(!['night','layout'].includes(msg.reason))toast(msg.reason==='home'?'🏠 Você voltou para sua base.':'👥 Você e '+msg.name+' estão de frente!');}
  else if(msg.type==='world-add')for(const d of msg.eggs||[])mpUpsertEgg(d);
  else if(msg.type==='world-remove')mpRemoveEgg(msg.id);
  else if(msg.type==='egg-mutate-result'){if(msg.ok&&msg.egg)mpUpsertEgg(msg.egg);window.dispatchEvent(new CustomEvent('roube-egg-mutate-result',{detail:msg}));}
  else if(msg.type==='egg-result')mpEggResult(msg);
  else if(msg.type==='egg-forced-drop'){
   if(MP.pending?.id===msg.egg.id){MP.pending=null;mpStorePending()}
   if(carry?.netId===msg.egg.id){MP.settingRemote=true;try{drop()}finally{MP.settingRemote=false}}
   mpUpsertEgg(msg.egg);P.stun=Math.max(P.stun||0,.65);P.train=false;
   toast('🏏 Você foi atingido e soltou o ovo!');
  }
  else if(msg.type==='base-state')mpApplyBase(msg.id,msg.base);
  else if(msg.type==='event')mpRemoteEvent(msg);
  else if(msg.type==='event-state'){MP.roomEvent=msg.event;if(!msg.event&&ABUSE.active)abuseStop(true);}
  else if(msg.type==='limited-sync'&&MP.protocol<2)syncRoomLimitedEggs(msg.eggs||[]);
  else if(msg.type==='admin-ok'||msg.type==='admin-state'){mpApplyRole(msg);MP.adminPassword=null;mpStatus(MP.owner?'👑 Dono autenticado na sala '+MP.room:MP.canAdmin?'Painel autorizado pelo dono.':'Acesso ao painel removido.');}
  else if(msg.type==='session-replaced'){MP.stopped=true;clearTimeout(MP.retryTimer);MP.retryTimer=null;save();mpEntrance(false,true);mpStatus('Esta sessão foi aberta em outra aba.');}
  else if(msg.type==='kicked'){MP.stopped=true;clearTimeout(MP.retryTimer);MP.retryTimer=null;save();mpStatus('⚠ '+msg.message);toast('⚠ '+msg.message);}
  else if(msg.type==='error'){if(msg.scope==='admin'){MP.adminPassword=null;const field=$('adAuthError');if(field)field.textContent=msg.message;}MP.joining=null;mpEntrance(false,true);mpStatus('⚠ '+msg.message);toast('⚠ '+msg.message);if(!MP.connected){MP.stopped=true;clearTimeout(MP.connectTimer);ws.close();}}
  window.RoubeOvoAdmin?.incoming(msg);window.RoubeOvoEquipment?.incoming(msg);window.RoubeOvoRaid?.incoming(msg);window.RoubeOvoVoiceChat?.incoming(msg);
 };
 ws.onerror=()=>{if(MP.socket===ws)mpStatus('⚠ Conexão interrompida. Tentando novamente…');};
 ws.onclose=()=>{if(MP.socket===ws){MP.socket=null;clearTimeout(MP.connectTimer);mpClear();mpReconnect();}};
};
const mpUpdate=dt=>{
 if(!MP.connected){window.RoubeOvoEquipment?.update(dt);return;}
 const now=performance.now();
 if(now-MP.lastRx>35000){MP.socket?.close();return;}
 if(MP.pending?.accepted)mpFinishDeposit(MP.pending.accepted);
 if(MP.pending&&!MP.pending.accepted&&now-MP.pending.startedAt>8000){MP.socket?.close();return;}
 if(now-MP.lastTx>90){MP.lastTx=now;mpSend({type:'move',...mpPosition(),training:P.train});}
 if(now-(MP.lastRankTx||0)>2000){MP.lastRankTx=now;mpSend({type:'stats',money:S.$,speed:S.sp,base:mpBaseState(),avatar:window.RoubeOvoAvatar?.current()});}
 if(MP.roomEvent&&ABUSE.active){ABUSE.active.left=Math.max(0,(MP.roomEvent.endsAt-Date.now()-MP.clockOffset)/1000);}
 for(const [id,v] of MP.views){const u=MP.players.get(id);if(!u)continue;
  const x=u.x||0,y=u.y||0,z=u.z||0,k=Math.min(1,dt*14);
  if(Math.hypot(v.group.position.x-x,v.group.position.z-z)>30)v.group.position.set(x,y,z);else{v.group.position.x+=(x-v.group.position.x)*k;v.group.position.y+=(y-v.group.position.y)*k;v.group.position.z+=(z-v.group.position.z)*k;}
  const angle=Math.atan2(Math.sin((u.yaw||0)-v.group.rotation.y),Math.cos((u.yaw||0)-v.group.rotation.y));v.group.rotation.y+=angle*k;
  const arm=v.group.getObjectByName('rue-peer-right-arm');if(arm)arm.rotation.x=Math.hypot(v.group.position.x-x,v.group.position.z-z)>.08?Math.sin(now*.009)*.35:0;
  if(u.carrying?.id&&v.heldId!==u.carrying.id){
   if(v.held){v.group.remove(v.held);v.held=null;}
   const d=u.carrying;
   if(SPC[d.s]&&SZ[d.size]){
    const held=eggMesh({s:d.s,j:d.j,r:d.r,z:d.size,m:d.m});
    v.group.add(held);held.scale.multiplyScalar(.65);held.position.set(0,1.7,.8);
    v.held=held;v.heldId=d.id;
   }
  }
  if(v.held)v.held.visible=!!u.carrying;
 }
 window.RoubeOvoEquipment?.update(dt);
};
setInterval(()=>{if(MP.connected)mpSend({type:'ping'});},8000);
addEventListener('online',()=>{if(!MP.stopped&&!MP.connected){clearTimeout(MP.retryTimer);MP.retryTimer=null;mpJoin('join',true)}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)return;if(MP.connected){MP.lastRx=performance.now();mpSend({type:'world-request'});mpSend({type:'ping'});}else if(!MP.stopped)mpReconnect();});

