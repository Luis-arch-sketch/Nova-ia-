'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),port=3157,origin='http://127.0.0.1:'+port;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});let browser,log='';for(const output of [server.stdout,server.stderr])output.on('data',d=>log+=d);
 try{
  for(let i=0;i<150;i++){if(server.exitCode!==null)throw Error(log);try{if((await fetch(origin+'/health')).ok)break}catch{}await pause(25)}
  browser=await chromium.launch({headless:true,executablePath:process.env.PW_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});await context.addInitScript(()=>localStorage.setItem('rue3d_v1',JSON.stringify({pid:'radioactive-qa',sp:2e12,$:1e9,tm:0,bl:0,tr:-1,own:[],pets:[],inc:[null,null,null,null],idx:{},id:1,t:Date.now()})));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/?sala=RADIO-QA');
  if(await page.locator('#roube-play').isVisible())await page.locator('#roube-play').click({force:true});await page.waitForFunction(()=>MP.connected,null,{timeout:15000});
  await page.evaluate(()=>{for(let i=0;i<120;i++)window.RoubeOvoEntrance?.update(.05);A.freeze=true;A.god=true;mpPlace({x:0,z:-946});});
  await page.waitForFunction(()=>cb()===13&&sc.getObjectByName('biome-radioactive')?.visible);
  const state=await page.evaluate(()=>({biomes:BI.length,species:SPC.length,limited:LIMITED_ID,radioactive:eggs.filter(e=>e.b===13).map(e=>({s:e.s,id:e.netId,m:e.m})),guardian:GD[13].m.userData.radioactiveSpecies}));
  assert.equal(state.biomes,14);assert.equal(state.species,137);assert.equal(state.limited,104);assert.equal(state.guardian,136);assert.deepEqual(state.radioactive.map(e=>e.s).sort(),[129,130]);
  fs.mkdirSync('test-results/radioactive',{recursive:true});await page.screenshot({path:'test-results/radioactive/biome-radioactive-preview.png'});
  const id=await page.evaluate(()=>eggs.find(e=>e.b===13).netId);
  await page.evaluate(id=>{const egg=eggs.find(e=>e.netId===id);mpPlace({x:egg.mesh.position.x,z:egg.mesh.position.z});doAct()},id);await page.waitForFunction(()=>carry&&!MP.pending);
  await page.evaluate(()=>mpPlace({x:BASE_HOME.x,z:BASE_HOME.z-4}));await page.waitForFunction(()=>S.inc.some(e=>e?.s>=129));
  const pet=await page.evaluate(()=>{const index=S.inc.findIndex(e=>e?.s>=129);const pet=hatch(index,true);save();return {id:pet.s,name:SPC[pet.s].n}});assert(pet.id>=129&&pet.id<=136);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({...state,hatching:pet,unpublished:true}));
 }finally{await browser?.close();server.kill('SIGTERM')}
})().catch(error=>{console.error(error);process.exitCode=1});
