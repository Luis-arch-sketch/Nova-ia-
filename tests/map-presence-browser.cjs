'use strict';
const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const port=3187,origin='http://127.0.0.1:'+port,pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:'ignore'});
 let browser;
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
   meshes:window.RoubeOvoPlaza.group.children.length,wallObstacles:window.RoubeOvoPlaza.wallObstacles}));
  assert.equal(state.id,original.id);assert.deepEqual(state.home,original.home);
  assert.equal(state.players,1);assert.equal(state.views,1);assert.equal(state.bases,1);
  assert.equal(state.money,456789);assert.equal(state.speed,200000);
  assert(state.ground&&state.overlay&&state.wall);assert.equal(state.meshes,2,'apenas parede e acabamento; sem piso sobreposto');
  const collision=await second.evaluate(()=>{const p={x:120,z:160,vx:1400,vz:0};push(p,.5,80,160);const entry={x:0,z:-55};push(entry,.5,0,-35);return {x:p.x,z:entry.z}});
  assert(collision.x<94,'parede curva bloqueia a corrida');assert.equal(collision.z,-55,'entrada central livre');
  for(const asset of ['/map-plaza.js','/world-remake.js','/multiplayer-client.js'])assert.equal((await fetch(origin+asset)).headers.get('cache-control'),'no-store');
  fs.mkdirSync('test-results/map-presence',{recursive:true});
  await second.evaluate(()=>{P.x=35;P.z=85;P.yaw=0;P.pitch=.32;P.dist=12;P.g.position.set(P.x,0,P.z);cam.position.set(P.x,6,P.z+12);CT.set(P.x,2.2,P.z);cam.lookAt(CT);R.render(sc,cam)});await pause(100);
  await second.screenshot({path:'test-results/map-presence/grass-and-walls.png'});
  await second.evaluate(()=>{P.x=70;P.z=170;P.yaw=-Math.PI/2;P.pitch=.35;P.g.position.set(P.x,0,P.z);cam.position.set(P.x-12,6,P.z);CT.set(P.x,2.2,P.z);cam.lookAt(CT);R.render(sc,cam)});await pause(100);
  await second.screenshot({path:'test-results/map-presence/perimeter.png'});
  assert.deepEqual(errors,[]);console.log('MAP_PRESENCE_OK '+JSON.stringify({state,collision,errors}));
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
