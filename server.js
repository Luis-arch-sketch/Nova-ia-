'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {WebSocketServer,WebSocket}=require('ws');
const PORT=Number(process.env.PORT||3000),ADMIN_HASH=process.env.ADMIN_PASSWORD_HASH||'',MAX_ROOM=16,rooms=new Map();
let serverSequence=1;
const send=(ws,o)=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(o));};
const publicUser=ws=>({id:ws.id,name:ws.name,x:ws.x,y:ws.y,z:ws.z,yaw:ws.yaw,admin:ws.admin});
const peers=room=>rooms.get(room)||new Set();
// Salas sob demanda, sem um número máximo definido de salas.
// A lotação continua em 16 por sala; salas vazias são removidas automaticamente.
const newPublicRoom=()=>{
 let id;
 do{id='SRV-'+(serverSequence++).toString(36).toUpperCase()}while(rooms.has(id));
 return id;
};
const openPublicRoom=()=>{
 let found='',mostPlayers=-1;
 for(const [id,p] of rooms){
  if(id.startsWith('SRV-')&&p.size<MAX_ROOM&&p.size>mostPlayers){found=id;mostPlayers=p.size}
 }
 return found||newPublicRoom();
};
const listPublicRooms=requested=>{
 const all=[...rooms].filter(([id,p])=>id.startsWith('SRV-')&&p.size>0)
  .map(([room,p])=>({room,count:p.size,capacity:MAX_ROOM}))
  .sort((a,b)=>b.count-a.count||a.room.localeCompare(b.room));
 const total=all.length,pages=Math.max(1,Math.ceil(total/20));
 const n=Number(requested),page=Number.isSafeInteger(n)?Math.max(0,Math.min(n,pages-1)):0;
 return {rooms:all.slice(page*20,(page+1)*20),total,players:all.reduce((n,r)=>n+r.count,0),page,pages};
};
const broadcast=(room,obj,except=null)=>{for(const c of peers(room))if(c!==except)send(c,obj)};
const broadcastPresence=room=>broadcast(room,{type:'players',players:[...peers(room)].map(publicUser)});
const leave=ws=>{if(!ws.room)return;const r=ws.room,p=rooms.get(r);p?.delete(ws);ws.room=null;ws.admin=false;if(p?.size===0)rooms.delete(r);else broadcastPresence(r)};
const bound=(n,min,max)=>{n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):0};
const sameHex=(a,b)=>{try{const x=Buffer.from(a,'hex'),y=Buffer.from(b,'hex');return x.length===32&&y.length===32&&crypto.timingSafeEqual(x,y)}catch{return false}};
const error=(ws,message)=>send(ws,{type:'error',message});
// Esteira do ADMIN com renda fixa de Speed/s; sem alterar o arquivo fonte original.
const applyOwnerTreadmill=html=>{
 const rules=[["const TM=[","const TREADMILL_RATE_TEXT='100000000000000000000000000000000000000000000000000000000000000000000000000000';const TREADMILL_RATE=Number(TREADMILL_RATE_TEXT);\nconst TM=["],["if(P.train){tx=tz=0;P.x=-14;P.z=4.2;S.sp+=TM[S.tm][1]*CFG.train*abuseTrainMult()*dt}","if(P.train){tx=tz=0;P.x=-14;P.z=4.2;S.sp+=(ownerVerified?TREADMILL_RATE:TM[S.tm][1]*CFG.train*abuseTrainMult())*dt}"],["TMO.lab.set('Sua esteira: '+TM[S.tm][0]+' x'+TM[S.tm][1])","TMO.lab.set(ownerVerified?'⚡ Minha esteira: +'+fm(TREADMILL_RATE)+' Speed/s':'Sua esteira: '+TM[S.tm][0]+' x'+TM[S.tm][1])"],["ownerVerified=true;adminBadge.visible=true;try{","ownerVerified=true;adminBadge.visible=true;styleTM();try{"]];
 for(const [from,to] of rules){
  if(html.split(from).length!==2)throw new Error('Marcador da esteira ausente ou duplicado: '+from.slice(0,55));
  html=html.replace(from,to);
 }
 return html;
};
// Script pequeno servido junto ao jogo, preservando a esteira 100Qav/s e saves.
const installServerBrowser=html=>{
 const rules=[["const mpJoin=()=>{","const mpJoin=(mode='join')=>{"],["if(name.length<2||room.length<3)","if(name.length<2||(mode==='join'&&room.length<3))"],["ws.onopen=()=>mpSend({type:'join',room,name});","ws.onopen=()=>mpSend({type:mode,room,name});"],["$('roomJoin').onclick=mpJoin;","$('roomJoin').onclick=()=>mpJoin('join');"],["if(msg.type==='joined'){MP.connected=true;","if(msg.type==='joined'){$('roomCode').value=msg.room;try{localStorage.setItem('rue3d_mp_room',msg.room)}catch(e){}MP.connected=true;"]];
 for(const [from,to] of rules){
  if(html.split(from).length!==2)throw new Error('Trecho multiplayer inesperado: '+from.slice(0,65));
  html=html.replace(from,to);
 }
 if(!html.includes('</body>'))throw new Error('Fim do HTML não encontrado');
 return html.replace('</body>','<script src="/servers-ui.js"></script></body>');
};
// Atualização visual: mantém todos os botões, salas, saves, ADMIN e treino originais.
const applyGraphicUpgrade=html=>{
 const rules=[["const creature=(col,k)=>{","const creature=(col,k,speciesId=null)=>{if(speciesId!==null&&window.RoubeOvoVisuals)return window.RoubeOvoVisuals.create(T,speciesId,k,col,sc);"],["const eggMesh=e=>{","const eggMesh=e=>{if(window.RoubeOvoVisuals)return window.RoubeOvoVisuals.egg(T,e,GS,SZ,LIMITED_ID,sc);"],["const GD=BI.map((b,i)=>{const home=","const guardianSpecies=[0,5,6,6,6,5,5,5,4,6,6,6,6];\nconst GD=BI.map((b,i)=>{const home="],["m=creature(new T.Color().setHSL((i*.09+.55)%1,.6,.5),2.6+i*.08)","m=creature(new T.Color().setHSL((i*.09+.55)%1,.6,.5),2.6+i*.08,i*8+guardianSpecies[i])"],["const m=creature(c,p.s===LIMITED_ID?3.6:.8*SZ[p.z][1]);","const m=creature(c,p.s===LIMITED_ID?3.6:.8*SZ[p.z][1],p.s);"],["o=PM[p.id]={m};if(p.s===LIMITED_ID)","o=PM[p.id]={m};if(window.RoubeOvoVisuals){const tag=label(SPC[p.s].n,384,64,3.7);tag.position.set(0,2.85,0);tag.scale.set(3.7/m.scale.x,.65/m.scale.x,1);m.add(tag)}if(p.s===LIMITED_ID)"],["if(o.fire)limitedAuraUp(o.fire,dt)","if(o.fire)limitedAuraUp(o.fire,dt);if(window.RoubeOvoVisuals)window.RoubeOvoVisuals.animate(o.m,TT,o.k)"],["g.l.set((g.st==='sleep'?'zzz ':'ALERTA ')+BI[i].gd)","g.l.set((g.st==='sleep'?'zzz ':'ALERTA ')+BI[i].gd);if(window.RoubeOvoVisuals)window.RoubeOvoVisuals.animate(g.m,TT,i)"],["cn.instanceColor.needsUpdate=true;tk.frustumCulled=cn.frustumCulled=false;sc.add(tk,cn)}","cn.instanceColor.needsUpdate=true;tk.frustumCulled=cn.frustumCulled=false;sc.add(tk,cn)}\nif(window.RoubeOvoVisuals)window.RoubeOvoVisuals.decorate(T,sc,BI);"],["const tex=(rx,ry)=>{","const tex=(rx,ry)=>{if(window.RoubeOvoVisuals?.terrain)return window.RoubeOvoVisuals.terrain(T,rx,ry);"],["R.shadowMap.enabled=true;","R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap;"],["const step=dt=>{","const step=(dt,dtUi=dt)=>{"],["if(tt>0){tt-=dt;if(tt<=0)","if(tt>0){tt-=dtUi;if(tt<=0)"],["const loop=now=>{requestAnimationFrame(loop);const dt=Math.min(.05,(now-lt)/1e3);lt=now;step(dt);mpUpdate(dt);R.render(sc,cam);","const loop=now=>{requestAnimationFrame(loop);const realDt=Math.max(0,(now-lt)/1e3);const dt=Math.min(.05,realDt),dtUi=Math.min(.35,realDt);lt=now;step(dt,dtUi);mpUpdate(dt);R.render(sc,cam);"],["sun.shadow.mapSize.set(1024,1024);","sun.shadow.mapSize.set((navigator.maxTouchPoints||0)>0?512:1024,(navigator.maxTouchPoints||0)>0?512:1024);"],["TT+=dt;abuseUpdate(dt);","TT+=dt;abuseUpdate(dt);if(window.RoubeOvoVisuals?.weather)window.RoubeOvoVisuals.weather(T,sc,P,cb(),dt);"],["{const N=252,tk=new T.InstancedMesh","if(window.RoubeOvoVisuals?.trees)window.RoubeOvoVisuals.trees(T,sc,BI,OB,rn);else{const N=252,tk=new T.InstancedMesh"]];
 for(const [from,to] of rules){
  if(html.split(from).length!==2)throw new Error('Formato visual mudou: '+from.slice(0,65));
  html=html.replace(from,to);
 }
 if(html.split('<script>\n').length!==2)throw new Error('Script principal não encontrado');
 // Embutir os modelos para evitar falhas de carregamento de arquivos separados no Android.
 const animalsSource=fs.readFileSync(path.join(__dirname,'animals3d.js'),'utf8');
 html=html.replace('</style>','@media(max-width:450px){#hud{top:calc(42px + env(safe-area-inset-top,0px));gap:2px;max-width:63vw}}\n</style>');
 return html.replace('<script>\n','<script>\n'+animalsSource+'\n</script>\n<script>\n');
};
const gameHtml=installServerBrowser(applyGraphicUpgrade(applyOwnerTreadmill(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'))));
const httpServer=http.createServer((req,res)=>{
 let u;try{u=new URL(req.url,'http://localhost')}catch{res.writeHead(400).end();return}
 if(req.method!=='GET'){res.writeHead(405).end('Method not allowed');return}
 if(u.pathname==='/health'){
  res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'})
    .end(JSON.stringify({ok:true,rooms:rooms.size}));return;
 }
 if(u.pathname==='/api/servers'){
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'})
    .end(JSON.stringify(listPublicRooms(u.searchParams.get('page'))));return;
 }
 if(u.pathname==='/animals3d.js'){
  const stream=fs.createReadStream(path.join(__dirname,'animals3d.js'));
  stream.on('error',()=>{if(!res.headersSent)res.writeHead(500);res.end()});
  res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  stream.pipe(res);return;
 }
 if(u.pathname==='/servers-ui.js'){
  const stream=fs.createReadStream(path.join(__dirname,'servers-ui.js'));
  stream.on('error',()=>{if(!res.headersSent)res.writeHead(500);res.end()});
  res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  stream.pipe(res);return;
 }
 if(u.pathname==='/'||u.pathname==='/index.html'){
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(gameHtml);
  return;
 }
 res.writeHead(404).end('Not found');
});
const wss=new WebSocketServer({server:httpServer,path:'/ws',maxPayload:4096});
wss.on('connection',ws=>{ws.id=crypto.randomUUID().slice(0,8);ws.room=null;ws.admin=false;ws.name='';ws.x=0;ws.y=0;ws.z=8;ws.yaw=0;ws.lastMove=0;ws.failedAdminCount=0;
ws.on('message',raw=>{let m;try{m=JSON.parse(String(raw));if(!m||typeof m!=='object')return}catch{return}
if(m.type==='join'||m.type==='quick-join'||m.type==='create-server'){
const room=m.type==='create-server'?newPublicRoom():m.type==='quick-join'?openPublicRoom():String(m.room||'').toUpperCase();
const name=String(m.name||'').trim();
if(!/^[A-Z0-9-]{3,12}$/.test(room)||name.length<2||name.length>20||/^admin$/i.test(name)){error(ws,'Nome ou código de sala inválido');return}
leave(ws);if(peers(room).size>=MAX_ROOM){error(ws,'Sala cheia: máximo 16 jogadores');return}
ws.room=room;ws.name=name;ws.admin=false;ws.x=0;ws.y=0;ws.z=8;
if(!rooms.has(room))rooms.set(room,new Set());rooms.get(room).add(ws);
send(ws,{type:'joined',id:ws.id,room,players:[...peers(room)].map(publicUser)});broadcastPresence(room);return}
if(!ws.room)return;
if(m.type==='move'){const now=Date.now();if(now-ws.lastMove<45)return;ws.lastMove=now;
ws.x=bound(m.x,-99,99);ws.y=bound(m.y,-1,50);ws.z=bound(m.z,-945,50);ws.yaw=bound(m.yaw,-100,100);
broadcast(ws.room,{type:'players',players:[...peers(ws.room)].map(publicUser)},ws);return}
if(m.type==='admin-auth'){if(!ADMIN_HASH){error(ws,'ADMIN_PASSWORD_HASH ausente no servidor');return}
const pw=String(m.password||'').slice(0,256),hash=crypto.createHash('sha256').update(pw).digest('hex');
if(!sameHex(hash,ADMIN_HASH)){ws.failedAdminCount++;error(ws,'Acesso de administrador recusado');if(ws.failedAdminCount>=5)ws.close(1008,'Muitas tentativas');return}
for(const p of peers(ws.room))if(p!==ws&&p.admin){error(ws,'Já existe ADMIN nesta sala');return}
ws.admin=true;ws.failedAdminCount=0;send(ws,{type:'admin-ok'});broadcastPresence(ws.room);return}
if(!ws.admin)return;
if(m.type==='admin-event'){
const valid=new Set(['secret','eternal','divine','mixed','cosmic','money','profit2','profit10','training','speed','hatch','luck','rainbow','gold','meteor','moon','eclipse','sun','freeze','fury','fireworks']);
if(m.action==='stop'){broadcast(ws.room,{type:'event',kind:'event',action:'stop'},ws);return}
if(m.action!=='start'||!valid.has(m.id))return;
const settings={duration:bound(m.settings?.duration,15,900),interval:bound(m.settings?.interval,3,60),wave:bound(m.settings?.wave,1,10)};
broadcast(ws.room,{type:'event',kind:'event',action:'start',id:m.id,settings},ws);return}
if(m.type==='admin-announce'){const text=String(m.text||'').slice(0,160).trim();if(text)broadcast(ws.room,{type:'event',kind:'announce',text,seconds:bound(m.seconds,4,30)},ws);return}
if(m.type==='admin-limited')broadcast(ws.room,{type:'event',kind:'limited'},ws);
});ws.on('close',()=>leave(ws));ws.on('error',()=>leave(ws))});
httpServer.listen(PORT,'0.0.0.0',()=>{console.log('Roube um Ovo 3D salas: http://localhost:'+PORT);if(!ADMIN_HASH)console.warn('Configure ADMIN_PASSWORD_HASH para liberar o admin online.')});
