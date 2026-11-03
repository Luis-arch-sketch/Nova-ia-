'use strict';
const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const WebSocket=require('ws');
const port=3187,origin='http://127.0.0.1:'+port,pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:'ignore'});
 let browser;const guests=[];
 try{
  for(let i=0;i<100;i++){try{if((await fetch(origin+'/health')).ok)break}catch{}await pause(50)}
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const owner=await browser.newContext({viewport:{width:1280,height:720},hasTouch:true}),friend=await browser.newContext({viewport:{width:960,height:540}}),errors=[];
  for(const ctx of [owner,friend])await ctx.route('**/radioactive-cutscene.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
  async function open(ctx){
   const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
   await p.goto(origin+'/?sala=MAP-BROWSER',{waitUntil:'domcontentloaded'});
   await p.locator('#roube-play').click({force:true});
   await p.waitForFunction(()=>MP.connected&&window.RoubeOvoPlaza?.installed,null,{timeout:20000});
   await p.evaluate(()=>{window.RoubeOvoEntrance?.stop();document.getElementById('mpEntrance').style.display='none';A.freeze=true;A.god=true});
   return p;
  }
  const first=await open(owner),other=await open(friend);
  await other.waitForFunction(()=>MP.players.size===1);
  const original=await first.evaluate(()=>{S.$=456789;S.sp=200000;save();return {id:MP.self,home:{...BASE_HOME}}});
  const second=await open(owner);
  await first.waitForFunction(()=>MP.stopped&&!MP.connected);
  await other.waitForFunction(()=>MP.players.size===1&&PEER_BASES.size===1);
  const state=await second.evaluate(()=>({id:MP.self,home:{...BASE_HOME},players:MP.players.size,views:MP.views.size,bases:PEER_BASES.size,money:S.$,speed:S.sp,
   ground:window.RoubeOvoMapRebuild.originalTerrainPreserved,overlay:window.RoubeOvoPlaza.darkOverlayRemoved,
   wall:!!window.RoubeOvoPlaza.group.getObjectByName('Continuous curved courtyard wall'),
   meshes:window.RoubeOvoPlaza.group.children.length,wallObstacles:window.RoubeOvoPlaza.wallObstacles,hub:window.RoubeOvoPlaza.bounds,depth:window.RoubeOvoPlaza.courtyardDepth,corridorWidth:window.RoubeOvoPlaza.corridorWidth}));
  assert.equal(state.id,original.id);assert.deepEqual(state.home,original.home);
  assert.equal(state.players,1);assert.equal(state.views,1);assert.equal(state.bases,1);
  assert.equal(state.money,456789);assert.equal(state.speed,200000);
  assert(state.ground&&state.overlay&&state.wall);assert.equal(state.meshes,2,'apenas parede e acabamento; sem piso sobreposto');
  assert(state.hub.endZ<60&&state.depth<100,'praça curta para dois jogadores, sem reservar terreno para 16 bases');
  assert.equal(state.corridorWidth,104,'corredor dos ovos mais estreito que a praça');
  const collision=await second.evaluate(()=>{const p={x:-120,z:8,vx:-1400,vz:0};push(p,.5,-58,8);const entry={x:0,z:-55};push(entry,.5,0,-35);return {x:p.x,z:entry.z}});
  assert(collision.x>-80,'parede da praça compacta bloqueia a corrida');assert.equal(collision.z,-55,'entrada central livre');
  for(const asset of ['/map-plaza.js','/world-remake.js','/multiplayer-client.js'])assert.equal((await fetch(origin+asset)).headers.get('cache-control'),'no-store');
  fs.mkdirSync('test-results/map-presence',{recursive:true});
  await second.evaluate(()=>{P.train=true;P.x=BASE_HOME.x-14;P.z=BASE_HOME.z+4.2;mpSend({type:'move',...mpPosition(),training:true})});
  for(let i=0;i<5;i++)await new Promise((resolve,reject)=>{const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws');guests.push(ws);ws.on('open',()=>ws.send(JSON.stringify({type:'join',room:'MAP-BROWSER',name:'Base'+i})));ws.on('message',raw=>{if(JSON.parse(String(raw)).type==='joined')resolve()});ws.once('error',reject)});
  await second.waitForFunction(()=>MP.players.size===6&&window.RoubeOvoPlaza.activeBases===7);
  assert(await second.evaluate(()=>P.train),'treino continua durante a reorganização das bases');
  const seven=await second.evaluate(()=>({home:{...BASE_HOME},bounds:window.RoubeOvoPlaza.bounds,bases:PEER_BASES.size,positions:BASE_SLOTS.slice(0,7),shops:window.RoubeOvoWorldActions.points.map(p=>({id:p.id,x:p.x,z:p.z}))}));
  assert.equal(seven.bases,6);assert.equal(seven.bounds.endZ,94);assert.equal(seven.bounds.halfWidth,128);
  assert.deepEqual(seven.positions,[{x:-96,z:48},{x:-48,z:48},{x:0,z:48},{x:48,z:48},{x:96,z:48},{x:-96,z:0},{x:96,z:0}]);
  // Vista de cima de QA: confere a silhueta da planta e as sete bases.
  await second.evaluate(()=>{window.__qaRAF=window.requestAnimationFrame;window.requestAnimationFrame=()=>0});await pause(1200);
  await second.evaluate(()=>{window.__qaFog=sc.fog;sc.fog=null;sc.getObjectByName('Terracotta high canyon walls').visible=false;cam.far=2500;cam.updateProjectionMatrix();cam.up.set(0,0,-1);cam.position.set(0,190,25);cam.lookAt(0,0,25);R.render(sc,cam)});
  await second.screenshot({path:'test-results/map-presence/compact-seven-bases.png'});
  await second.evaluate(()=>{cam.position.set(0,1100,-420);cam.lookAt(0,0,-420);R.render(sc,cam)});
  await second.screenshot({path:'test-results/map-presence/compact-whole-map.png'});
  await second.evaluate(()=>{sc.fog=window.__qaFog;cam.up.set(0,1,0);sc.getObjectByName('Terracotta high canyon walls').visible=true;window.requestAnimationFrame=window.__qaRAF;window.requestAnimationFrame(loop)});
  for(const ws of guests)ws.close();
  await second.waitForFunction(()=>MP.players.size===1&&window.RoubeOvoPlaza.activeBases===2&&window.RoubeOvoPlaza.bounds.endZ===46);
  assert(await second.evaluate(()=>P.train),'treino continua quando a praça encolhe');
  await second.evaluate(()=>{P.train=false;P.vx=P.vz=0});
  await second.evaluate(()=>{P.x=-32;P.z=12;P.yaw=0;P.pitch=.32;P.dist=12;P.g.position.set(P.x,0,P.z);cam.position.set(P.x,6,P.z+12);CT.set(P.x,2.2,P.z);cam.lookAt(CT);R.render(sc,cam)});await pause(100);
  await second.screenshot({path:'test-results/map-presence/grass-and-walls.png'});
  await second.evaluate(()=>{P.x=-54;P.z=18;P.yaw=Math.PI/2;P.pitch=.35;P.g.position.set(P.x,0,P.z);cam.position.set(P.x+12,6,P.z);CT.set(P.x,2.2,P.z);cam.lookAt(CT);R.render(sc,cam)});await pause(100);
  await second.screenshot({path:'test-results/map-presence/perimeter.png'});
  assert.deepEqual(errors,[]);console.log('MAP_PRESENCE_OK '+JSON.stringify({state,collision,errors}));
 }finally{for(const ws of guests)ws.terminate();await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
