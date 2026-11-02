'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {WebSocket}=require('ws');
const {LIMITED}=require('./multiplayer-world.cjs');
const previewPort=process.argv.indexOf('--port');
const PORT=Number(process.env.PORT||(previewPort>=0?process.argv[previewPort+1]:3000)),ADMIN_HASH=process.env.ADMIN_PASSWORD_HASH||'',MAX_ROOM=16,rooms=new Map(),roomWorlds=new Map(),sessions=new Map();
const send=(ws,o)=>{if(ws.readyState!==WebSocket.OPEN)return;try{if(ws.bufferedAmount>1024*1024){ws.terminate();return}ws.send(JSON.stringify(o))}catch{ws.terminate()}};
const publicUser=ws=>({id:ws.id,name:ws.name,x:ws.x,y:ws.y,z:ws.z,yaw:ws.yaw,cameraYaw:ws.cameraYaw||0,admin:ws.admin,baseSlot:ws.baseSlot,carrying:ws.heldEgg||null,training:!!ws.training,avatar:ws.avatar||null});
const peers=room=>rooms.get(room)||new Set();
// Salas sob demanda, sem um número máximo definido de salas.
// A lotação continua em 16 por sala; salas vazias são removidas automaticamente.
const newPublicRoom=()=>{
 let id;
 do{id='SRV-'+crypto.randomBytes(3).toString('hex').toUpperCase()}while(rooms.has(id)||roomWorlds.has(id));
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
const leave=ws=>{if(!ws.room)return;const r=ws.room,p=rooms.get(r),world=roomWorlds.get(r);
 const egg=world?.drop(ws);
 if(egg){broadcast(r,{type:'world-add',eggs:[egg]},ws);if(egg.s===LIMITED)broadcast(r,{type:'event',kind:'limited-drop',egg},ws)}
 if(ws.session){ws.session.position={x:ws.x,y:ws.y,z:ws.z,yaw:ws.yaw,cameraYaw:ws.cameraYaw||0};ws.session.active=false;ws.session.expiresAt=Date.now()+120000;}
 p?.delete(ws);ws.room=null;ws.admin=false;ws.baseSlot=null;
 if(p?.size===0){rooms.delete(r);if(world)world.emptyAt=Date.now()}else broadcastPresence(r);
};
const bound=(n,min,max)=>{n=Number(n);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):min};
const sameHex=(a,b)=>{try{const x=Buffer.from(a,'hex'),y=Buffer.from(b,'hex');return x.length===32&&y.length===32&&crypto.timingSafeEqual(x,y)}catch{return false}};
const error=(ws,message)=>send(ws,{type:'error',message});
// Treino usa a mesma esteira para ADMIN e jogadores comuns.
// O servidor preserva salas, ADMIN Abuse e saves com a esteira normal.
const installServerBrowser=html=>{
 if(!html.includes('</body>'))throw new Error('Fim do HTML não encontrado');
 return html.replace('</body>','<script src="/servers-ui.js?v=20261101-movement-2"></script></body>');
};
// Atualização visual: mantém todos os botões, salas, saves, ADMIN e treino originais.
const applyGraphicUpgrade=html=>{
 const rules=[["const creature=(col,k)=>{","const creature=(col,k,speciesId=null)=>{if(window.RoubeOvoPetCollection?.has(speciesId))return window.RoubeOvoPetCollection.create(T,speciesId,k,sc);if(speciesId!==null&&window.RoubeOvoVisuals)return window.RoubeOvoVisuals.create(T,speciesId,k,col,sc);"],["const eggMesh=e=>{","const eggMesh=e=>{if(window.RoubeOvoVisuals){const egg=window.RoubeOvoVisuals.egg(T,e,GS,SZ,LIMITED_ID,sc);return eggMutationMark(egg,e.m)}"],["const GD=BI.map((b,i)=>{const home=","const guardianSpecies=[6,5,6,6,6,5,5,5,4,7,6,6,6];\nconst GD=BI.map((b,i)=>{const home="],["m=creature(new T.Color().setHSL((i*.09+.55)%1,.6,.5),2.6+i*.08)","m=creature(new T.Color().setHSL((i*.09+.55)%1,.6,.5),2.6+i*.08,i*8+guardianSpecies[i])"],["const m=creature(c,p.s===LIMITED_ID?3.6:.8*SZ[p.z][1]);","const m=creature(c,p.s===LIMITED_ID?3.6:.8*SZ[p.z][1],p.s);"],["o=PM[p.id]={m};if(p.s===LIMITED_ID)","o=PM[p.id]={m};if(window.RoubeOvoVisuals){const tag=label(SPC[p.s].n,384,64,3.7);tag.position.set(0,2.85,0);tag.scale.set(3.7/m.scale.x,.65/m.scale.x,1);m.add(tag)}if(p.s===LIMITED_ID)"],["if(o.fire)limitedAuraUp(o.fire,dt)","if(o.fire)limitedAuraUp(o.fire,dt);if(window.RoubeOvoVisuals)window.RoubeOvoVisuals.animate(o.m,TT,o.k)"],["g.l.set((g.st==='sleep'?'zzz ':'ALERTA ')+BI[i].gd)","g.l.set((g.st==='sleep'?'zzz ':'ALERTA ')+BI[i].gd);if(window.RoubeOvoVisuals)window.RoubeOvoVisuals.animate(g.m,TT,i)"],["cn.instanceColor.needsUpdate=true;tk.frustumCulled=cn.frustumCulled=false;sc.add(tk,cn)}","cn.instanceColor.needsUpdate=true;tk.frustumCulled=cn.frustumCulled=false;sc.add(tk,cn)}\nif(window.RoubeOvoVisuals)window.RoubeOvoVisuals.decorate(T,sc,BI);"],["const tex=(rx,ry)=>{","const tex=(rx,ry)=>{if(window.RoubeOvoVisuals?.terrain)return window.RoubeOvoVisuals.terrain(T,rx,ry);"],["R.shadowMap.enabled=true;","R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap;"],["const step=dt=>{","const step=(dt,dtUi=dt)=>{"],["if(tt>0){tt-=dt;if(tt<=0)","if(tt>0){tt-=dtUi;if(tt<=0)"],["const loop=now=>{requestAnimationFrame(loop);const dt=Math.min(.05,(now-lt)/1e3);lt=now;step(dt);mpUpdate(dt);R.render(sc,cam);","const loop=now=>{requestAnimationFrame(loop);const realDt=Math.max(0,(now-lt)/1e3);const dt=Math.min(.05,realDt),dtUi=Math.min(.35,realDt);lt=now;step(dt,dtUi);mpUpdate(dt);if(window.RoubeOvoEntrance?.active)window.RoubeOvoEntrance.update(dt);R.render(sc,cam);"],["sun.shadow.mapSize.set(1024,1024);","sun.shadow.mapSize.set((navigator.maxTouchPoints||0)>0?512:1024,(navigator.maxTouchPoints||0)>0?512:1024);"],["TT+=dt;abuseUpdate(dt);","TT+=dt;abuseUpdate(dt);if(window.RoubeOvoVisuals?.weather)window.RoubeOvoVisuals.weather(T,sc,P,cb(),dt);"],["{const N=252,tk=new T.InstancedMesh","if(window.RoubeOvoVisuals?.trees)window.RoubeOvoVisuals.trees(T,sc,BI,OB,rn);else{const N=252,tk=new T.InstancedMesh"],["const step=(dt,dtUi=dt)=>{","let eggDrawTimer=0;const step=(dt,dtUi=dt)=>{"],["if(window.RoubeOvoVisuals?.weather)window.RoubeOvoVisuals.weather(T,sc,P,cb(),dt);","if(window.RoubeOvoVisuals?.weather)window.RoubeOvoVisuals.weather(T,sc,P,cb(),dt);\n  // Culling visual: os ovos continuam existindo, funcionando e sendo salvos no mundo.\n  eggDrawTimer+=dt;\n  if(eggDrawTimer>=.3){\n   eggDrawTimer=0;\n   for(const e of eggs)e.mesh.visible=Math.abs(e.mesh.position.z-P.z)<150&&Math.abs(e.mesh.position.x-P.x)<130;\n  }"],["g.l.position.set(p.x,p.y+8,p.z);","g.l.position.set(p.x,p.y+8,p.z);\n   const guardianNear=Math.abs(P.z-p.z)<155&&Math.abs(P.x-p.x)<120;\n   g.m.visible=guardianNear;g.l.visible=guardianNear;"],["if(o.fire)limitedAuraUp(o.fire,dt);if(window.RoubeOvoVisuals)window.RoubeOvoVisuals.animate(o.m,TT,o.k)","const petNear=Math.abs(P.z-o.m.position.z)<140&&Math.abs(P.x-o.m.position.x)<115;\n   o.m.visible=petNear;if(o.fire?.aura)o.fire.aura.visible=petNear;\n   if(o.fire&&petNear)limitedAuraUp(o.fire,dt);\n   if(petNear&&window.RoubeOvoVisuals)window.RoubeOvoVisuals.animate(o.m,TT,o.k)"],["sc.add(P.g);","sc.add(P.g);if(window.RoubeOvoVisuals?.player)window.RoubeOvoVisuals.player(T,P.g,lL,lR,aL,aR);"],["sc.background=bg;sc.fog=new T.Fog(bg,90,430);","sc.background=bg;sc.fog=new T.Fog(bg,90,430);\n// Base + 13 biomas: o céu transita suavemente sem cancelar noite ou Admin Abuse.\nconst BIOME_SKY=[0x9fd3ff,0xa6d7ff,0xa2dce9,0xffd99f,0x8fd6aa,0xc7e7ff,0xbc8075,0x597ea9,0xe5cfa1,0x7463a7,0xf5c6e4,0xb5b2bc,0xf4d9c3,0xb5dfd4];\nconst biomeSkyTarget=new T.Color(0x9fd3ff);"],["bg.copy(day).lerp(nit,A.night?1:nite*.92);","day.lerp(biomeSkyTarget.setHex(BIOME_SKY[Math.max(0,Math.min(13,cb()+1))]),Math.min(1,dt*1.25));\n bg.copy(day).lerp(nit,A.night?1:nite*.92);"],["const x=nearPlayer?P.x+3+(k%5)*3:-84+(serial%15)*12,z=nearPlayer?P.z+4+Math.floor(k/5)*3:centerZ-30+(Math.floor(serial/15)%6)*11;","// Distribuição quase uniforme, preservando a invocação perto do jogador.\n  const x=nearPlayer?P.x+3+(k%5)*3:-87+174*((serial*0.6180339887498949+0.41)%1);\n  const z=nearPlayer?P.z+4+Math.floor(k/5)*3:centerZ-29+58*((serial*0.7548776662466927+0.23)%1);"]];
 for(const [from,to] of rules){
  if(html.split(from).length!==2)throw new Error('Formato visual mudou: '+from.slice(0,65));
  html=html.replace(from,to);
 }
 if(html.split('<script>\n').length!==2)throw new Error('Script principal não encontrado');
 // Embutir os modelos para evitar falhas de carregamento de arquivos separados no Android.
 const loaderSource=fs.readFileSync(path.join(__dirname,'assets','vendor','GLTFLoader-r128.js'),'utf8');
 const animalsSource=fs.readFileSync(path.join(__dirname,'animals3d.js'),'utf8');
  // Malhas dos cinco novos mobs convertidas de STL/3MF em voxels leves e locais.
  const userMobsSource=require('node:zlib').gunzipSync(fs.readFileSync(path.join(__dirname,'assets','mobs-stl.js.gz'))).toString('utf8');
  // Quatro partes pequenas com malhas originais compactadas; sem requisições extras no Android.
  const packedMobData=[0,1,2,3].map(i=>fs.readFileSync(path.join(__dirname,'assets','mobs_smooth_part_'+i+'.txt'),'utf8')).join('');
  const originalMobData=require('node:zlib').gunzipSync(Buffer.from(packedMobData,'base64')).toString('base64');
  const realMobsSource=fs.readFileSync(path.join(__dirname,'mobs-real.js'),'utf8').replace('__MOB_DATA__',JSON.stringify(originalMobData));
  const polishedMobsSource=fs.readFileSync(path.join(__dirname,'mobs-polished.js'),'utf8');
 const raccoonSource=fs.readFileSync(path.join(__dirname,'assets','models','Raccoon_Quaternius_CubeWorld.gltf'),'utf8');
 html=html.replace('</style>','@media(max-width:450px){#hud{top:calc(42px + env(safe-area-inset-top,0px));gap:2px;max-width:63vw}}\n</style>');
 // O glTF contém as próprias texturas e animações: nenhum download no Android.
 // GLTFLoader roda dentro do jogo; dependência remota extra removida.
 return html.replace('<script>\n','<script>\n'+loaderSource+'\nconst RACCOON_SOURCE_JSON='+JSON.stringify(raccoonSource)+';\n'+userMobsSource+'\n'+realMobsSource+'\n'+polishedMobsSource+'\n'+animalsSource+'\n</script>\n<script>\n');
};
// Vendedor de frutas: integração sem alterar a cena original nem os patches de gráficos.
const installFruitVendor=html=>{
 const patches=[
  ["const v=walk(eff())*A.moveMult*abuseMoveMult()",
   "const v=walk(eff())*A.moveMult*abuseMoveMult()*fruitSpeedMult()"],
  ["const doAct=()=>{if(window.RoubeOvoHatching?.active)return;if(typeof MP!=='undefined'&&MP.pending)return;if(carry){drop();return}",
   "const doAct=()=>{if(window.RoubeOvoHatching?.active)return;if(typeof MP!=='undefined'&&MP.pending)return;if(!carry&&near(6,-7,6)){openFruitShop();return}if(carry){drop();return}"],
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
const PWA_BODY="<div id=\"roube-capa\" role=\"dialog\" aria-label=\"Capa de Roube um Ovo 3D\"><div class=\"roube-capa-box\"><img src=\"/capa-oficial-2026.jpg\" width=\"256\" height=\"256\" alt=\"Capa de Roube um Ovo 3D com personagem carregando ovo raro e guaxinim perseguindo\"><h1>ROUBE UM OVO 3D</h1><p>Ovos raros • Guardiões • Multiplayer</p><button id=\"roube-play\" type=\"button\">🎮 JOGAR AGORA</button><button id=\"roube-install\" type=\"button\">📲 INSTALAR NO CELULAR</button><p id=\"roube-install-info\" aria-live=\"polite\"></p></div></div>\n<script>\n(()=>{const layer=document.getElementById('roube-capa'),play=document.getElementById('roube-play'),install=document.getElementById('roube-install'),status=document.getElementById('roube-install-info');let prompt=null;\nfunction enter(){layer.remove();window.dispatchEvent(new Event('roube-start-game'));if(navigator.maxTouchPoints>0){try{const p=document.documentElement.requestFullscreen?.();Promise.resolve(p).then(()=>screen.orientation?.lock?.('landscape')).catch(()=>{});}catch(e){}}try{sessionStorage.setItem('roube-capa-2026-v3-visitada','sim')}catch(e){}}\ntry{const installed=(window.matchMedia&&(['standalone','fullscreen','minimal-ui'].some(mode=>matchMedia('(display-mode: '+mode+')').matches)))||navigator.standalone===true||new URLSearchParams(location.search).get('instalado')==='1';if(installed||sessionStorage.getItem('roube-capa-2026-v3-visitada')==='sim')layer.remove()}catch(e){if(location.search.includes('instalado=1'))layer.remove()}\nplay.addEventListener('click',enter);\nwindow.addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;status.textContent='Pronto para instalar pelo Chrome.'});\ninstall.addEventListener('click',async()=>{if(prompt){const p=prompt;prompt=null;p.prompt();try{const r=await p.userChoice;status.textContent=r.outcome==='accepted'?'Instalação solicitada.':'Você pode instalar pelo menu ⋮ do Chrome.'}catch(e){status.textContent='Abra o menu ⋮ do Chrome para instalar.'}}else{status.textContent='No Chrome, toque em ⋮ e em Instalar aplicativo ou Adicionar à tela inicial.'}});\nif('serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('/service-worker.js',{scope:'/'}).catch(()=>{})});\n})();\n</script>";
const addPwa=html=>{if(html.split('</head>').length!==2||html.split('</body>').length!==2)throw new Error('HTML do jogo alterado inesperadamente');return html.replace('</head>',PWA_HEAD+'</head>').replace('</body>',PWA_BODY+'</body>')};
// Register earned animals before the game reads saved pets and incubators.
const installPetCollection=html=>{
 const tag='<script src="/three.min.js"></script>';
 if(html.split(tag).length!==2)throw new Error('Three.js não localizado para carregar coleção');
 return html.replace(tag,tag+'<script src="/pet-collection.js?v=20261101-normal-1"></script>');
};
PWA_FILES['/pet-collection.js']=['pet-collection.js','application/javascript; charset=utf-8'];
// Arquivos locais da sequência de chocagem e os dois áudios enviados.
for(const file of ['egg-hatching.js','egg-hatching.css'])PWA_FILES['/'+file]=[file,file.endsWith('.css')?'text/css; charset=utf-8':'application/javascript; charset=utf-8'];
PWA_FILES['/multiplayer-client.js']=['multiplayer-client.js','application/javascript; charset=utf-8'];
PWA_FILES['/entrance-cinematic.js']=['entrance-cinematic.js','application/javascript; charset=utf-8'];
PWA_FILES['/hud-chat.js']=['hud-chat.js','application/javascript; charset=utf-8'];
for(const file of ['egg-crack.mp3','egg-suspense.mp3'])PWA_FILES['/audio/'+file]=['audio/'+file,'audio/mpeg'];
PWA_FILES['/avatar-customizer.js']=['avatar-customizer.js','application/javascript; charset=utf-8'];
PWA_FILES['/afk-training.js']=['afk-training.js','application/javascript; charset=utf-8'];
PWA_FILES['/biome-countdown.js']=['biome-countdown.js','application/javascript; charset=utf-8'];
const installAvatar=html=>{if(html.split('</body>').length!==2)throw Error('HTML do avatar inválido');return html.replace('</body>','<script src="/avatar-customizer.js?v=20261102-character-menu5"></script><script src="/afk-training.js?v=20261102-3"></script><script src="/biome-countdown.js?v=20261102-layout5"></script></body>')};
const installChatHud=html=>{if(html.split('</body>').length!==2)throw new Error('HTML sem fechamento para incluir chat');return html.replace('</body>','<script src="/hud-chat.js?v=20261102-menus3"></script></body>')};
const gameHtml=installAvatar(installChatHud(addPwa(installPetCollection(installFruitVendor(installServerBrowser(applyGraphicUpgrade(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'))))))));
const RETIRED_ASSETS=new Set(['/halloween-event.js','/halloween-pets.js','/halloween-clowns.js',
 '/audio/halloween-spooky-scary-skeletons.mp3','/audio/clown-dance.webm','/audio/witch-laugh.mp3']);
const httpServer=http.createServer((req,res)=>{
 let u;try{u=new URL(req.url,'http://localhost')}catch{res.writeHead(400).end();return}
 if(RETIRED_ASSETS.has(u.pathname)){res.writeHead(410,{'Cache-Control':'no-store','Content-Type':'text/plain; charset=utf-8'}).end('Recurso removido');return}
 if(req.method!=='GET'){res.writeHead(405).end('Method not allowed');return}
 // Inactive response also retires the event for older clients synchronizing their clock.
 if(u.pathname==='/api/halloween'){
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'})
   .end(JSON.stringify({active:false,serverNow:Date.now(),musicUrl:null,musicRequired:false,eggTypes:[],newAnimals:0}));return;
 }
 if(Object.prototype.hasOwnProperty.call(PWA_FILES,u.pathname)){const a=PWA_FILES[u.pathname],p=path.join(__dirname,a[0]);if(!fs.existsSync(p)){res.writeHead(404).end('Arquivo PWA ausente');return}res.writeHead(200,{'Content-Type':a[1],'Cache-Control':u.pathname==='/hud-chat.js'?'no-store':u.pathname==='/service-worker.js'?'no-cache':'public, max-age=1800','X-Content-Type-Options':'nosniff','Service-Worker-Allowed':'/'});fs.createReadStream(p).pipe(res);return}
 if(u.pathname==='/health'){
  res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'})
    .end(JSON.stringify({ok:true,rooms:rooms.size,multiplayerProtocol:2,revision:process.env.RENDER_GIT_COMMIT||null}));return;
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
const wss=require('./multiplayer-network.cjs')({httpServer,ADMIN_HASH,MAX_ROOM,rooms,roomWorlds,sessions,send,publicUser,peers,broadcast,broadcastPresence,leave,bound,sameHex,error,newPublicRoom,openPublicRoom});
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
 if(process.env.MULTIPLAYER_SELF_TEST==='1')setTimeout(testMultiplayer,1200);
});
