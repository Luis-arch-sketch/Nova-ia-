'use strict';
// PLAYWRIGHT_MODULE=/path/to/playwright PW_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node tests/movement-browser.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const port=Number(process.env.MOVEMENT_TEST_PORT||3110),origin='http://127.0.0.1:'+port;
const results=path.resolve('test-results/movement');fs.mkdirSync(results,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});let browser,log='';
 server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
 try{
  for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error(log);try{if((await fetch(origin+'/health')).ok)break}catch{}await pause(30)}
  browser=await chromium.launch({headless:true,executablePath:process.env.PW_CHROMIUM_EXECUTABLE_PATH||undefined,
   args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-gpu-sandbox','--in-process-gpu']});
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:393,height:852}:{width:1280,height:720},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
   await context.addInitScript(()=>{
    if(!localStorage.getItem('rue3d_v1'))localStorage.setItem('rue3d_v1',JSON.stringify({pid:'qa-preserved-player',sp:200000,$:456789,tm:0,bl:0,tr:-1,own:[],pets:[{id:5,s:6,z:1,w:2,m:[]}],inc:[null,null,{s:7,z:1,w:2,a:Date.now(),b:Date.now()+600000},null],idx:{6:1},id:6,t:Date.now()}));
   });
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/?sala=QA-MOVE');await page.locator('#roube-play').click();
   await page.waitForFunction(()=>MP.connected,{},{timeout:15000});
   // Avançar a cutscene sem depender do FPS do renderizador de testes.
   await page.evaluate(()=>{for(let i=0;i<120;i++)window.RoubeOvoEntrance?.update(.05);A.god=true;A.freeze=true;window.requestAnimationFrame=()=>0});await pause(100);
   const motion=await page.evaluate(()=>{
    P.x=BASE_HOME.x;P.z=BASE_HOME.z+8;P.y=0;P.vx=P.vz=0;P.yaw=0;K.KeyD=1;
    const hand=arm=>arm.children.find(o=>o.isMesh&&o.position.y===-.87);
    step(.05);P.g.updateMatrixWorld(true);const first=hand(aL).getWorldPosition(new T.Vector3()).sub(P.g.position).toArray();
    step(.05);P.g.updateMatrixWorld(true);const second=hand(aL).getWorldPosition(new T.Vector3()).sub(P.g.position).toArray();K.KeyD=0;
    return{fixed:P.g.children.filter(o=>o.isMesh&&Math.abs(o.position.x)===.6&&o.position.y===1.05).length,left:!!hand(aL),right:!!hand(aR),first,second};
   });
   assert.equal(motion.fixed,0,'mãos duplicadas não ficam no tronco');assert(motion.left&&motion.right);assert.notDeepEqual(motion.first,motion.second,'mão acompanha o balanço do braço');
   const collision=await page.evaluate(()=>{
    const speed=S.sp;S.sp=1e40;A.moveMult=1000;P.x=BASE_HOME.x;P.z=BASE_HOME.z+5;P.y=0;P.vx=1400;P.vz=0;P.yaw=0;K.KeyD=1;step(.05);K.KeyD=0;
    const own=P.x-BASE_HOME.x;
    makePeerBase({id:'qa-wall',baseSlot:1,name:'QA Base'});P.x=52;P.z=5;P.vx=1400;P.vz=0;K.KeyD=1;step(.05);K.KeyD=0;const peer=P.x-52;removePeerBase('qa-wall');
    S.sp=speed;A.moveMult=1;P.vx=P.vz=0;mpPlace({x:BASE_HOME.x,z:BASE_HOME.z+8});R.render(sc,cam);return{own,peer};
   });
   assert(collision.own<20&&collision.peer<20,JSON.stringify(collision));
   const held=await page.evaluate(()=>{const e=eggs.find(e=>e.netId);mpPlace({x:e.mesh.position.x,z:e.mesh.position.z});take(e);return e.netId});
   await page.waitForFunction(()=>carry&&!MP.pending);
   const before=await page.evaluate(()=>({x:P.x,z:P.z,id:carry.netId}));
   await page.locator('#roomButton').click();if(mobile)await page.locator('#svGoHome').tap();else await page.locator('#svGoHome').click();
   assert.match(await page.locator('#svFriendsStatus').textContent(),/a pé/);
   assert.deepEqual(await page.evaluate(()=>({x:P.x,z:P.z,id:carry.netId})),before);
   await page.screenshot({path:path.join(results,(mobile?'android':'desktop')+'-blocked-home.png')});
   await page.evaluate(()=>mpSend({type:'go-home'}));await page.waitForFunction(()=>$('roomStatus').textContent.includes('carregando um ovo'));
   assert.equal(await page.evaluate(()=>carry.netId),held);assert.equal(await page.evaluate(()=>P.z),before.z);
   await page.evaluate(()=>drop());await page.waitForFunction(()=>!carry&&!MP.pending);
   if(mobile)await page.locator('#svGoHome').tap();else await page.locator('#svGoHome').click();
   await page.waitForFunction(()=>P.x===BASE_HOME.x&&P.z===BASE_HOME.z+8);
   assert(await page.locator('#roomPanel').isHidden());
   const saved=await page.evaluate(()=>{save();return{pid:S.pid,speed:S.sp,money:S.$,pet:S.pets[0].id,egg:S.inc[2].s}});
   await page.reload();await page.waitForFunction(()=>MP.connected,{},{timeout:15000});
   const restored=await page.evaluate(()=>({pid:S.pid,speed:S.sp,money:S.$,pet:S.pets[0].id,egg:S.inc[2].s}));
   assert.equal(restored.pid,saved.pid);assert.equal(restored.speed,saved.speed);assert(restored.money>=saved.money);assert.equal(restored.pet,saved.pet);assert.equal(restored.egg,saved.egg);
   assert.deepEqual(errors,[]);console.log(JSON.stringify({mode:mobile?'Android':'Desktop',hands:true,collision,homeBlocked:true,homeAfterDrop:true,progressPreserved:true}));
   await context.close();
  }
 }finally{if(browser)await browser.close();server.kill('SIGTERM')}
})().catch(e=>{console.error(e);process.exitCode=1});
