'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {WebSocketServer,WebSocket}=require('ws');
const PORT=Number(process.env.PORT||3000),ADMIN_HASH=process.env.ADMIN_PASSWORD_HASH||'',MAX_ROOM=16,rooms=new Map(),roomLimitedEggs=new Map();
let serverSequence=1;
const send=(ws,o)=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(o));};
const publicUser=ws=>({id:ws.id,name:ws.name,x:ws.x,y:ws.y,z:ws.z,yaw:ws.yaw,admin:ws.admin,baseSlot:ws.baseSlot});
const baseSpawn=slot=>({x:[0,52,-52][slot%3],z:8+Math.floor(slot/3)*56});
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
const leave=ws=>{if(!ws.room)return;const r=ws.room,p=rooms.get(r);
 if(ws.heldLimited){
  const eggs=roomLimitedEggs.get(r)||[];
  eggs.push(ws.heldLimited);roomLimitedEggs.set(r,eggs);
  broadcast(r,{type:'event',kind:'limited-drop',egg:ws.heldLimited},ws);
  ws.heldLimited=null;
 }
 p?.delete(ws);ws.room=null;ws.admin=false;ws.baseSlot=null;if(p?.size===0){rooms.delete(r);roomLimitedEggs.delete(r);}else broadcastPresence(r)};
const bound=(n,min,max)=>{n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):0};
const sameHex=(a,b)=>{try{const x=Buffer.from(a,'hex'),y=Buffer.from(b,'hex');return x.length===32&&y.length===32&&crypto.timingSafeEqual(x,y)}catch{return false}};
const error=(ws,message)=>send(ws,{type:'error',message});
// Treino usa a mesma esteira para ADMIN e jogadores comuns.
// O servidor preserva salas, ADMIN Abuse e saves com a esteira normal.
const installServerBrowser=html=>{
 const rules=[["const mpJoin=()=>{","const mpJoin=(mode='join')=>{"],["if(name.length<2||room.length<3)","if(name.length<2||(mode==='join'&&room.length<3))"],["ws.onopen=()=>mpSend({type:'join',room,name});","ws.onopen=()=>{if(MP.socket===ws)mpSend({type:mode,room,name})};"],["$('roomJoin').onclick=mpJoin;","$('roomJoin').onclick=()=>mpJoin('join');"],["if(msg.type==='joined'){syncRoomLimitedEggs(msg.limitedEggs||[]);MP.connected=true;","if(msg.type==='joined'){syncRoomLimitedEggs(msg.limitedEggs||[]);$('roomCode').value=msg.room;try{localStorage.setItem('rue3d_mp_room',msg.room)}catch(e){}MP.connected=true;"]];
 for(const [from,to] of rules){
  if(html.split(from).length!==2)throw new Error('Trecho multiplayer inesperado: '+from.slice(0,65));
  html=html.replace(from,to);
 }
 if(!html.includes('</body>'))throw new Error('Fim do HTML não encontrado');
 return html.replace('</body>','<script src="/servers-ui.js"></script></body>');
};
// Atualização visual: mantém todos os botões, salas, saves, ADMIN e treino originais.
const applyGraphicUpgrade=html=>{
 const rules=[["const creature=(col,k)=>{","const creature=(col,k,speciesId=null)=>{if(speciesId!==null&&window.RoubeOvoVisuals)return window.RoubeOvoVisuals.create(T,speciesId,k,col,sc);"],["const eggMesh=e=>{","const eggMesh=e=>{if(window.RoubeOvoVisuals)return window.RoubeOvoVisuals.egg(T,e,GS,SZ,LIMITED_ID,sc);"],["const GD=BI.map((b,i)=>{const home=","const guardianSpecies=[6,5,6,6,6,5,5,5,4,6,6,6,6];\nconst GD=BI.map((b,i)=>{const home="],["m=creature(new T.Color().setHSL((i*.09+.55)%1,.6,.5),2.6+i*.08)","m=creature(new T.Color().setHSL((i*.09+.55)%1,.6,.5),2.6+i*.08,i*8+guardianSpecies[i])"],["const m=creature(c,p.s===LIMITED_ID?3.6:.8*SZ[p.z][1]);","const m=creature(c,p.s===LIMITED_ID?3.6:.8*SZ[p.z][1],p.s);"],["o=PM[p.id]={m};if(p.s===LIMITED_ID)","o=PM[p.id]={m};if(window.RoubeOvoVisuals){const tag=label(SPC[p.s].n,384,64,3.7);tag.position.set(0,2.85,0);tag.scale.set(3.7/m.scale.x,.65/m.scale.x,1);m.add(tag)}if(p.s===LIMITED_ID)"],["if(o.fire)limitedAuraUp(o.fire,dt)","if(o.fire)limitedAuraUp(o.fire,dt);if(window.RoubeOvoVisuals)window.RoubeOvoVisuals.animate(o.m,TT,o.k)"],["g.l.set((g.st==='sleep'?'zzz ':'ALERTA ')+BI[i].gd)","g.l.set((g.st==='sleep'?'zzz ':'ALERTA ')+BI[i].gd);if(window.RoubeOvoVisuals)window.RoubeOvoVisuals.animate(g.m,TT,i)"],["cn.instanceColor.needsUpdate=true;tk.frustumCulled=cn.frustumCulled=false;sc.add(tk,cn)}","cn.instanceColor.needsUpdate=true;tk.frustumCulled=cn.frustumCulled=false;sc.add(tk,cn)}\nif(window.RoubeOvoVisuals)window.RoubeOvoVisuals.decorate(T,sc,BI);"],["const tex=(rx,ry)=>{","const tex=(rx,ry)=>{if(window.RoubeOvoVisuals?.terrain)return window.RoubeOvoVisuals.terrain(T,rx,ry);"],["R.shadowMap.enabled=true;","R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap;"],["const step=dt=>{","const step=(dt,dtUi=dt)=>{"],["if(tt>0){tt-=dt;if(tt<=0)","if(tt>0){tt-=dtUi;if(tt<=0)"],["const loop=now=>{requestAnimationFrame(loop);const dt=Math.min(.05,(now-lt)/1e3);lt=now;step(dt);mpUpdate(dt);R.render(sc,cam);","const loop=now=>{requestAnimationFrame(loop);const realDt=Math.max(0,(now-lt)/1e3);const dt=Math.min(.05,realDt),dtUi=Math.min(.35,realDt);lt=now;step(dt,dtUi);mpUpdate(dt);R.render(sc,cam);"],["sun.shadow.mapSize.set(1024,1024);","sun.shadow.mapSize.set((navigator.maxTouchPoints||0)>0?512:1024,(navigator.maxTouchPoints||0)>0?512:1024);"],["TT+=dt;abuseUpdate(dt);","TT+=dt;abuseUpdate(dt);if(window.RoubeOvoVisuals?.weather)window.RoubeOvoVisuals.weather(T,sc,P,cb(),dt);"],["{const N=252,tk=new T.InstancedMesh","if(window.RoubeOvoVisuals?.trees)window.RoubeOvoVisuals.trees(T,sc,BI,OB,rn);else{const N=252,tk=new T.InstancedMesh"],["const step=(dt,dtUi=dt)=>{","let eggDrawTimer=0;const step=(dt,dtUi=dt)=>{"],["if(window.RoubeOvoVisuals?.weather)window.RoubeOvoVisuals.weather(T,sc,P,cb(),dt);","if(window.RoubeOvoVisuals?.weather)window.RoubeOvoVisuals.weather(T,sc,P,cb(),dt);\n  // Culling visual: os ovos continuam existindo, funcionando e sendo salvos no mundo.\n  eggDrawTimer+=dt;\n  if(eggDrawTimer>=.3){\n   eggDrawTimer=0;\n   for(const e of eggs)e.mesh.visible=Math.abs(e.mesh.position.z-P.z)<150&&Math.abs(e.mesh.position.x-P.x)<130;\n  }"],["g.l.position.set(p.x,p.y+8,p.z);","g.l.position.set(p.x,p.y+8,p.z);\n   const guardianNear=Math.abs(P.z-p.z)<155&&Math.abs(P.x-p.x)<120;\n   g.m.visible=guardianNear;g.l.visible=guardianNear;"],["if(o.fire)limitedAuraUp(o.fire,dt);if(window.RoubeOvoVisuals)window.RoubeOvoVisuals.animate(o.m,TT,o.k)","const petNear=Math.abs(P.z-o.m.position.z)<140&&Math.abs(P.x-o.m.position.x)<115;\n   o.m.visible=petNear;if(o.fire?.aura)o.fire.aura.visible=petNear;\n   if(o.fire&&petNear)limitedAuraUp(o.fire,dt);\n   if(petNear&&window.RoubeOvoVisuals)window.RoubeOvoVisuals.animate(o.m,TT,o.k)"],["sc.add(P.g);","sc.add(P.g);if(window.RoubeOvoVisuals?.player)window.RoubeOvoVisuals.player(T,P.g,lL,lR,aL,aR);"],["sc.background=bg;sc.fog=new T.Fog(bg,90,430);","sc.background=bg;sc.fog=new T.Fog(bg,90,430);\n// Base + 13 biomas: o céu transita suavemente sem cancelar noite ou Admin Abuse.\nconst BIOME_SKY=[0x9fd3ff,0xa6d7ff,0xa2dce9,0xffd99f,0x8fd6aa,0xc7e7ff,0xbc8075,0x597ea9,0xe5cfa1,0x7463a7,0xf5c6e4,0xb5b2bc,0xf4d9c3,0xb5dfd4];\nconst biomeSkyTarget=new T.Color(0x9fd3ff);"],["bg.copy(day).lerp(nit,A.night?1:nite*.92);","day.lerp(biomeSkyTarget.setHex(BIOME_SKY[Math.max(0,Math.min(13,cb()+1))]),Math.min(1,dt*1.25));\n bg.copy(day).lerp(nit,A.night?1:nite*.92);"],["const x=nearPlayer?P.x+3+(k%5)*3:-84+(serial%15)*12,z=nearPlayer?P.z+4+Math.floor(k/5)*3:centerZ-30+(Math.floor(serial/15)%6)*11;","// Distribuição quase uniforme, preservando a invocação perto do jogador.\n  const x=nearPlayer?P.x+3+(k%5)*3:-87+174*((serial*0.6180339887498949+0.41)%1);\n  const z=nearPlayer?P.z+4+Math.floor(k/5)*3:centerZ-29+58*((serial*0.7548776662466927+0.23)%1);"]];
 for(const [from,to] of rules){
  if(html.split(from).length!==2)throw new Error('Formato visual mudou: '+from.slice(0,65));
  html=html.replace(from,to);
 }
 if(html.split('<script>\n').length!==2)throw new Error('Script principal não encontrado');
 // Embutir os modelos para evitar falhas de carregamento de arquivos separados no Android.
 const loaderSource=fs.readFileSync(path.join(__dirname,'assets','vendor','GLTFLoader-r128.js'),'utf8');
 const animalsSource=fs.readFileSync(path.join(__dirname,'animals3d.js'),'utf8');
 const raccoonSource=fs.readFileSync(path.join(__dirname,'assets','models','Raccoon_Quaternius_CubeWorld.gltf'),'utf8');
 html=html.replace('</style>','@media(max-width:450px){#hud{top:calc(42px + env(safe-area-inset-top,0px));gap:2px;max-width:63vw}}\n</style>');
 // O glTF contém as próprias texturas e animações: nenhum download no Android.
 // GLTFLoader roda dentro do jogo; dependência remota extra removida.
 return html.replace('<script>\n','<script>\n'+loaderSource+'\nconst RACCOON_SOURCE_JSON='+JSON.stringify(raccoonSource)+';\n'+animalsSource+'\n</script>\n<script>\n');
};
// Vendedor de frutas: integração sem alterar a cena original nem os patches de gráficos.
const installFruitVendor=html=>{
 const patches=[
  ["const v=walk(eff())*A.moveMult*abuseMoveMult()",
   "const v=walk(eff())*A.moveMult*abuseMoveMult()*fruitSpeedMult()"],
  ["const doAct=()=>{if(carry){drop();return}",
   "const doAct=()=>{if(!carry&&near(6,-7,6)){openFruitShop();return}if(carry){drop();return}"],
  ["$('ba').textContent=carry?'Largar':P.train?",
   "$('ba').textContent=carry?'Largar':near(6,-7,6)?'🍎 Frutas':P.train?"]
 ];
 for(const [from,to] of patches){
   if(html.split(from).length!==2)throw new Error('Trecho de frutas inesperado: '+from);
   html=html.replace(from,to);
 }
 // O arquivo separado impede que o navegador interprete código JS como HTML.
 // Como script clássico, ele compartilha as variáveis globais do jogo Three.js.
 if(html.split('</body>').length!==2)throw new Error('Final HTML não localizado para incluir vendedor');
 return html.replace('</body>','<script src="/fruits-shop.js"></script></body>');
};
const PWA_FILES={'/three.min.js':['three.min.js','application/javascript; charset=utf-8'],'/capa-oficial-2026.jpg':['capa-roube-um-ovo.jpg','image/jpeg'],'/icone-capa-oficial-192.png':['icone-192.png','image/png'],'/icone-capa-oficial-512.png':['icone-512.png','image/png'],'/capa-gerada-v2.jpg':['capa-roube-um-ovo.jpg','image/jpeg'],'/capa-gerada-192-v2.png':['icone-192.png','image/png'],'/capa-gerada-512-v2.png':['icone-512.png','image/png'],'/manifest.webmanifest':['manifest.webmanifest','application/manifest+json; charset=utf-8'],'/service-worker.js':['service-worker.js','application/javascript; charset=utf-8'],'/capa-roube-um-ovo.jpg':['capa-roube-um-ovo.jpg','image/jpeg'],'/icone-192.png':['icone-192.png','image/png'],'/icone-512.png':['icone-512.png','image/png']};
const PWA_HEAD="<meta name=\"theme-color\" content=\"#ffc933\"><meta name=\"apple-mobile-web-app-capable\" content=\"yes\"><meta name=\"mobile-web-app-capable\" content=\"yes\"><meta name=\"description\" content=\"Roube um Ovo 3D — capture ovos raros e escape dos guardiões.\"><meta property=\"og:title\" content=\"Roube um Ovo 3D\"><meta property=\"og:type\" content=\"website\"><meta property=\"og:image\" content=\"https://roube-um-ovo-3d-salas.onrender.com/capa-oficial-2026.jpg\"><link rel=\"manifest\" href=\"/manifest.webmanifest?v=3\"><link rel=\"apple-touch-icon\" href=\"/icone-capa-oficial-192.png\"><link rel=\"icon\" type=\"image/png\" href=\"/icone-capa-oficial-192.png\"><style>\n#roube-capa{position:fixed;inset:0;z-index:1500;display:flex;align-items:center;justify-content:center;overflow-y:auto;touch-action:pan-y;padding:20px;background:radial-gradient(circle at 50% 22%,#295080,#111b38 68%,#050b16);box-sizing:border-box;color:#fff;font:700 15px system-ui,sans-serif}\n#roube-capa .roube-capa-box{width:min(100%,470px);display:flex;flex-direction:column;align-items:stretch;gap:13px;text-align:center;margin:auto}\n#roube-capa img{display:block;width:min(100%,360px);max-height:min(52dvh,370px);object-fit:contain;aspect-ratio:1;border-radius:18px;margin:0 auto;border:3px solid #ffd266;box-shadow:0 12px 50px #000b}\n#roube-capa h1{margin:1px 0;font-size:clamp(20px,6vw,30px);color:#ffdb77;text-shadow:0 3px 8px #000}\n#roube-capa p{margin:0;color:#dce8ff;font-size:13px}\n#roube-capa button{position:static;border-radius:13px;min-height:49px;padding:12px 15px;font-size:17px;font-weight:900;background:#ffc933;color:#281800;cursor:pointer}\n#roube-capa #roube-install{background:#ffffff;color:#17253a}\n#roube-capa #roube-install-info{font-size:12px;min-height:18px;color:#dce8ff}\n\n@media (display-mode: standalone),(display-mode: fullscreen),(display-mode: minimal-ui){#roube-capa{display:none!important}}\n</style>";
const PWA_BODY="<div id=\"roube-capa\" role=\"dialog\" aria-label=\"Capa de Roube um Ovo 3D\"><div class=\"roube-capa-box\"><img src=\"/capa-oficial-2026.jpg\" width=\"256\" height=\"256\" alt=\"Capa de Roube um Ovo 3D com personagem carregando ovo raro e guaxinim perseguindo\"><h1>ROUBE UM OVO 3D</h1><p>Ovos raros • Guardiões • Multiplayer</p><button id=\"roube-play\" type=\"button\">🎮 JOGAR AGORA</button><button id=\"roube-install\" type=\"button\">📲 INSTALAR NO CELULAR</button><p id=\"roube-install-info\" aria-live=\"polite\"></p></div></div>\n<script>\n(()=>{const layer=document.getElementById('roube-capa'),play=document.getElementById('roube-play'),install=document.getElementById('roube-install'),status=document.getElementById('roube-install-info');let prompt=null;\nfunction enter(){layer.remove();try{sessionStorage.setItem('roube-capa-2026-v3-visitada','sim')}catch(e){}}\ntry{const installed=(window.matchMedia&&(['standalone','fullscreen','minimal-ui'].some(mode=>matchMedia('(display-mode: '+mode+')').matches)))||navigator.standalone===true||new URLSearchParams(location.search).get('instalado')==='1';if(installed||sessionStorage.getItem('roube-capa-2026-v3-visitada')==='sim')layer.remove()}catch(e){if(location.search.includes('instalado=1'))layer.remove()}\nplay.addEventListener('click',enter);\nwindow.addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;status.textContent='Pronto para instalar pelo Chrome.'});\ninstall.addEventListener('click',async()=>{if(prompt){const p=prompt;prompt=null;p.prompt();try{const r=await p.userChoice;status.textContent=r.outcome==='accepted'?'Instalação solicitada.':'Você pode instalar pelo menu ⋮ do Chrome.'}catch(e){status.textContent='Abra o menu ⋮ do Chrome para instalar.'}}else{status.textContent='No Chrome, toque em ⋮ e em Instalar aplicativo ou Adicionar à tela inicial.'}});\nif('serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('/service-worker.js',{scope:'/'}).catch(()=>{})});\n})();\n</script>";
const addPwa=html=>{if(html.split('</head>').length!==2||html.split('</body>').length!==2)throw new Error('HTML do jogo alterado inesperadamente');return html.replace('</head>',PWA_HEAD+'</head>').replace('</body>',PWA_BODY+'</body>')};
const gameHtml=addPwa(installFruitVendor(installServerBrowser(applyGraphicUpgrade(fs.readFileSync(path.join(__dirname,'index.html'),'utf8')))));

const httpServer=http.createServer((req,res)=>{
 let u;try{u=new URL(req.url,'http://localhost')}catch{res.writeHead(400).end();return}
 if(req.method!=='GET'){res.writeHead(405).end('Method not allowed');return}
 if(Object.prototype.hasOwnProperty.call(PWA_FILES,u.pathname)){const a=PWA_FILES[u.pathname],p=path.join(__dirname,a[0]);if(!fs.existsSync(p)){res.writeHead(404).end('Arquivo PWA ausente');return}res.writeHead(200,{'Content-Type':a[1],'Cache-Control':u.pathname==='/service-worker.js'?'no-cache':'public, max-age=1800','X-Content-Type-Options':'nosniff','Service-Worker-Allowed':'/'});fs.createReadStream(p).pipe(res);return}
 if(u.pathname==='/health'){
  res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'})
    .end(JSON.stringify({ok:true,rooms:rooms.size}));return;
 }
 if(u.pathname==='/api/fruits'){
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'})
    .end(JSON.stringify({fruits:[
      {id:'pear',name:'Pera da Sombra',price:50000000000,speedMultiplier:5,durationSeconds:1800},
      {id:'apple',name:'Maçã',price:1000000000000,speedMultiplier:15,durationSeconds:1800}
    ],currency:'dinheiro-do-jogo',scope:'cliente-local'}));return;
 }
 if(u.pathname.startsWith('/voices/fruits/')){
  const filename=u.pathname.slice('/voices/fruits/'.length);
  if(!new Set(['saudacao.mp3','opcoes.mp3','pera.mp3','maca.mp3','precos.mp3','sprite.ogg']).has(filename)){
   res.writeHead(404).end('Áudio inexistente');return;
  }
  const assetPath=path.join(__dirname,'voices','fruits',filename);
  if(!fs.existsSync(assetPath)){res.writeHead(404).end('Áudio aguardando envio');return}
  const stream=fs.createReadStream(assetPath);
  stream.on('error',()=>{if(!res.headersSent)res.writeHead(500);res.end()});
  res.writeHead(200,{'Content-Type':filename.endsWith('.ogg')?'audio/ogg':'audio/mpeg','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'});
  stream.pipe(res);return;
 }
 if(u.pathname==='/api/leaderboard'){
  const players=[...rooms].flatMap(([room,clients])=>[...clients].filter(ws=>ws.readyState===WebSocket.OPEN&&!ws.admin).map(ws=>({name:ws.name,money:Number.isFinite(ws.money)?ws.money:0,speed:Number.isFinite(ws.speed)?ws.speed:0})));
  players.sort((a,b)=>b.money-a.money||b.speed-a.speed);
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}).end(JSON.stringify({players:players.slice(0,50),total:players.length}));return;
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
 if(u.pathname==='/fruits-shop.js'){
  const stream=fs.createReadStream(path.join(__dirname,'fruits-shop.js'));
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
wss.on('connection',ws=>{ws.id=crypto.randomUUID().slice(0,8);ws.room=null;ws.admin=false;ws.heldLimited=null;ws.name='';ws.x=0;ws.y=0;ws.z=8;ws.yaw=0;ws.lastMove=0;ws.failedAdminCount=0;
ws.on('message',raw=>{let m;try{m=JSON.parse(String(raw));if(!m||typeof m!=='object')return}catch{return}
if(m.type==='join'||m.type==='quick-join'||m.type==='create-server'){
const room=m.type==='create-server'?newPublicRoom():m.type==='quick-join'?openPublicRoom():String(m.room||'').toUpperCase();
const name=String(m.name||'').trim();
if(!/^[A-Z0-9-]{3,12}$/.test(room)||name.length<2||name.length>20||/^admin$/i.test(name)){error(ws,'Nome ou código de sala inválido');return}
leave(ws);if(peers(room).size>=MAX_ROOM){error(ws,'Sala cheia: máximo 16 jogadores');return}
const occupied=new Set([...peers(room)].map(p=>p.baseSlot));
const baseSlot=Array.from({length:MAX_ROOM},(_,i)=>i).find(i=>!occupied.has(i));
if(baseSlot===undefined){error(ws,'Sala sem bases livres');return}
const spawn=baseSpawn(baseSlot);
ws.room=room;ws.name=name;ws.admin=false;ws.baseSlot=baseSlot;ws.x=spawn.x;ws.y=0;ws.z=spawn.z;
if(!rooms.has(room)){rooms.set(room,new Set());roomLimitedEggs.set(room,[])}rooms.get(room).add(ws);
send(ws,{type:'joined',id:ws.id,room,baseSlot:ws.baseSlot,players:[...peers(room)].map(publicUser),limitedEggs:roomLimitedEggs.get(room)||[]});broadcastPresence(room);return}
if(!ws.room)return;
if(m.type==='stats'){
 if(!Number.isFinite(m.money)||m.money<0||!Number.isFinite(m.speed)||m.speed<0)return;
 ws.money=bound(m.money,0,1e100);ws.speed=bound(m.speed,0,1e100);return;
}
if(m.type==='limited-take'){
 // Respeita o ovo da sala e exige proximidade real do jogador.
 const eggs=roomLimitedEggs.get(ws.room)||[];
 const resync=()=>send(ws,{type:'limited-sync',eggs});
 if(ws.heldLimited||!Number.isFinite(m.x)||!Number.isFinite(m.z)){resync();return}
 const idx=eggs.findIndex(p=>Math.hypot(p.x-m.x,p.z-m.z)<1.1);
 if(idx<0||Math.hypot(ws.x-m.x,ws.z-m.z)>11){resync();return}
 const [egg]=eggs.splice(idx,1);
 ws.heldLimited=egg;
 broadcast(ws.room,{type:'event',kind:'limited-take',egg},ws);return;
}
if(m.type==='limited-drop'){
 if(!ws.heldLimited)return;
 const egg={x:bound(m.x,-92,92),z:bound(m.z,-937,49)};
 roomLimitedEggs.get(ws.room)?.push(egg);ws.heldLimited=null;
 broadcast(ws.room,{type:'event',kind:'limited-drop',egg},ws);return;
}
if(m.type==='move'){const now=Date.now();if(now-ws.lastMove<45)return;ws.lastMove=now;
ws.x=bound(m.x,-99,99);ws.y=bound(m.y,-1,50);ws.z=bound(m.z,-945,333);ws.yaw=bound(m.yaw,-100,100);
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
if(m.type==='admin-limited'){
 // Só o ADMIN autenticado pode criar ovos exclusivos nesta sala.
 const eggs=Array.isArray(m.eggs)?m.eggs.slice(0,100).filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<=92&&p.z>=-937&&p.z<=-867).map(p=>({x:p.x,z:p.z})):[];
 if(!eggs.length)return;
 const saved=roomLimitedEggs.get(ws.room)||[];
 saved.push(...eggs);roomLimitedEggs.set(ws.room,saved);
 broadcast(ws.room,{type:'event',kind:'limited',eggs},ws);return;
}
if(m.type==='admin-limited-clear'){
 roomLimitedEggs.set(ws.room,[]);
 // Retirar também os ovos carregados para impedir reaparecimento após limpar.
 for(const player of peers(ws.room))player.heldLimited=null;
 broadcast(ws.room,{type:'event',kind:'limited-clear'},ws);return;
}
});ws.on('close',()=>leave(ws));ws.on('error',()=>leave(ws))});
// Verificacao de integracao: dois clientes WebSocket reais, duas bases e movimento sincronizado.
// A sala QA-* e temporaria e e removida no final, sem afetar os jogadores.
const testMultiplayer=async()=>{
 const clients=[],room='QA-'+crypto.randomBytes(3).toString('hex').toUpperCase();
 const join=async name=>new Promise((resolve,reject)=>{
  const ws=new WebSocket('ws://127.0.0.1:'+PORT+'/ws');clients.push(ws);
  let settled=false;
  const timer=setTimeout(()=>{if(!settled){settled=true;reject(new Error('timeout de conexao: '+name))}},8000);
  ws.once('open',()=>ws.send(JSON.stringify({type:'join',room,name})));
  ws.on('message',raw=>{
   let m;try{m=JSON.parse(String(raw))}catch{return}
   if(settled)return;
   if(m.type==='joined'||m.type==='error'){
    settled=true;clearTimeout(timer);
    if(m.type==='error')reject(new Error(m.message));
    else resolve({ws,joined:m});
   }
  });
  ws.once('error',err=>{if(!settled){settled=true;clearTimeout(timer);reject(err)}});
 });
 try{
  const first=await join('QAJogador1');
  const second=await join('QAJogador2');
  const a=first.joined,b=second.joined;
  if(a.room!==room||b.room!==room)throw Error('salas diferentes');
  if(a.baseSlot===b.baseSlot||a.baseSlot!==0||b.baseSlot!==1)throw Error('bases compartilhadas ou slot incorreto');
  if(!Array.isArray(b.players)||b.players.length!==2||!b.players.some(u=>u.id===a.id&&u.baseSlot===0))
   throw Error('lista de jogadores incompleta');
  const moved=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('movimento nao chegou ao segundo jogador')),4500);
   second.ws.on('message',raw=>{
    let m;try{m=JSON.parse(String(raw))}catch{return}
    if(m.type==='players'&&m.players?.some(u=>u.id===a.id&&u.x===3&&u.z===9)){
     clearTimeout(timer);resolve(true);
    }
   });
   first.ws.send(JSON.stringify({type:'move',x:3,y:0,z:9,yaw:0}));
  });
  if(moved)console.log('MULTIPLAYER_TEST_OK: dois jogadores entraram na mesma sala, receberam bases distintas e movimento sincronizado');
 }catch(err){console.error('MULTIPLAYER_TEST_FAIL:',err&&err.message?err.message:String(err))}
 finally{for(const ws of clients){try{ws.close()}catch(e){}}}
};
httpServer.listen(PORT,'0.0.0.0',()=>{
 console.log('Roube um Ovo 3D salas: http://localhost:'+PORT);
 if(!ADMIN_HASH)console.warn('Configure ADMIN_PASSWORD_HASH para liberar o admin online.');
 setTimeout(testMultiplayer,1200);
});
