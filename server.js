'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {WebSocketServer,WebSocket}=require('ws');
const PORT=Number(process.env.PORT||3000),ADMIN_HASH=process.env.ADMIN_PASSWORD_HASH||'',MAX_ROOM=16,rooms=new Map();
const send=(ws,o)=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(o));};
const publicUser=ws=>({id:ws.id,name:ws.name,x:ws.x,y:ws.y,z:ws.z,yaw:ws.yaw,admin:ws.admin});
const peers=room=>rooms.get(room)||new Set();
const broadcast=(room,obj,except=null)=>{for(const c of peers(room))if(c!==except)send(c,obj)};
const broadcastPresence=room=>broadcast(room,{type:'players',players:[...peers(room)].map(publicUser)});
const leave=ws=>{if(!ws.room)return;const r=ws.room,p=rooms.get(r);p?.delete(ws);ws.room=null;ws.admin=false;if(p?.size===0)rooms.delete(r);else broadcastPresence(r)};
const bound=(n,min,max)=>{n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):0};
const sameHex=(a,b)=>{try{const x=Buffer.from(a,'hex'),y=Buffer.from(b,'hex');return x.length===32&&y.length===32&&crypto.timingSafeEqual(x,y)}catch{return false}};
const error=(ws,message)=>send(ws,{type:'error',message});
const httpServer=http.createServer((req,res)=>{let u;try{u=new URL(req.url,'http://localhost')}catch{res.writeHead(400).end();return}const file=u.pathname==='/'?'/index.html':u.pathname;if(!['/index.html','/health'].includes(file)){res.writeHead(404).end('Not found');return}if(file==='/health'){res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({ok:true,rooms:rooms.size}));return}fs.createReadStream(path.join(__dirname,'index.html')).on('error',()=>{if(!res.headersSent)res.writeHead(500);res.end()}).pipe(res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}))});
const wss=new WebSocketServer({server:httpServer,path:'/ws',maxPayload:4096});
wss.on('connection',ws=>{ws.id=crypto.randomUUID().slice(0,8);ws.room=null;ws.admin=false;ws.name='';ws.x=0;ws.y=0;ws.z=8;ws.yaw=0;ws.lastMove=0;ws.failedAdminCount=0;
ws.on('message',raw=>{let m;try{m=JSON.parse(String(raw));if(!m||typeof m!=='object')return}catch{return}
if(m.type==='join'){
const room=String(m.room||'').toUpperCase(),name=String(m.name||'').trim();
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
