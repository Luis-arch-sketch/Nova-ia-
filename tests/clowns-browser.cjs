'use strict';
// npm install --no-save playwright; npx playwright install chromium
// node tests/clowns-browser.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const port=Number(process.env.CLOWN_TEST_PORT||3094),origin='http://127.0.0.1:'+port;
const results=path.resolve('test-results/clowns');fs.mkdirSync(results,{recursive:true});
const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
let log='',browser;for(const out of [server.stdout,server.stderr])out.on('data',c=>log+=c);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function move(page,offset){
 await page.evaluate(offset=>{
  const at=RoubeOvoClowns.positions[0];P.train=false;P.vx=P.vz=0;P.x=at.x;P.z=at.z+offset;
  RoubeOvoClowns.update();
 },offset);
}
(async()=>{
 try{
  let ready=false;for(let i=0;i<100;i++){
   if(server.exitCode!==null)throw Error(log);
   try{if((await fetch(origin+'/health')).ok){ready=true;break}}catch(e){}await pause(100);
  }
  assert(ready,'servidor iniciou');
  for(const [url,file,type] of [['/audio/clown-dance.webm','audio/clown-dance.webm','audio/webm'],['/audio/witch-laugh.mp3','audio/witch-laugh.mp3','audio/mpeg']]){
   const expected=fs.readFileSync(file),response=await fetch(origin+url);
   assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),type);
   assert.deepEqual(Buffer.from(await response.arrayBuffer()),expected);
   const range=await fetch(origin+url,{headers:{Range:'bytes=0-127'}});assert.equal(range.status,206);
   assert.deepEqual(Buffer.from(await range.arrayBuffer()),expected.subarray(0,128));
   const head=await fetch(origin+url,{method:'HEAD'});assert.equal(head.status,200);assert.equal(Number(head.headers.get('content-length')),expected.length);
  }
  browser=await chromium.launch({headless:true,executablePath:process.env.PW_CHROMIUM_EXECUTABLE_PATH||undefined,
   args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  for(const mobile of [true,false]){
   const mode=mobile?'android':'desktop',errors=[];
   const context=await browser.newContext({viewport:mobile?{width:393,height:852}:{width:1280,height:720},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.addInitScript(()=>{
    window.__audios=[];const Original=window.Audio;
    window.Audio=function(src){const a=new Original(src);a.testPlayCalls=0;const play=a.play.bind(a);
     a.play=()=>{a.testPlayCalls++;return play()};window.__audios.push(a);return a};
    window.Audio.prototype=Original.prototype;
   });
   await page.goto(origin,{waitUntil:'load'});await page.waitForFunction(()=>window.RoubeOvoClowns&&MP.connected);
   await page.locator('#roube-play').click();
   await page.evaluate(()=>{
    window.__clownMusic=__audios.find(a=>a.src.endsWith('/clown-dance.webm'));
    window.__witch=__audios.find(a=>a.src.endsWith('/witch-laugh.mp3'));
   });
   assert.equal(await page.evaluate(()=>RoubeOvoClowns.count),5);
   assert(await page.evaluate(()=>__clownMusic.paused&&__clownMusic.loop&&__witch.paused&&!__witch.loop));
   await move(page,4);
   await page.waitForFunction(()=>RoubeOvoClowns.musicPlaying&&__clownMusic.currentTime>.1,null,{timeout:15000});
   const before=await page.evaluate(()=>sc.getObjectByName('PalhacoDancaL-0').getObjectByName('PernaEsquerda').rotation.x);
   await page.waitForTimeout(220);
   const after=await page.evaluate(()=>sc.getObjectByName('PalhacoDancaL-0').getObjectByName('PernaEsquerda').rotation.x);
   assert.notEqual(before,after,'dança anima as pernas');
   assert.equal(await page.evaluate(()=>__clownMusic.testPlayCalls),1);
   await page.waitForFunction(()=>Number.isFinite(__clownMusic.duration)&&__clownMusic.duration>120);
   await page.evaluate(()=>{__clownMusic.currentTime=__clownMusic.duration-.2});
   await page.waitForFunction(()=>__clownMusic.currentTime<3&&!__clownMusic.paused,null,{timeout:15000});
   assert.equal(await page.evaluate(()=>__clownMusic.testPlayCalls),1,'o próprio áudio repete, sem outra faixa');
   await page.evaluate(()=>{P.dist=4;P.pitch=.13;P.yaw=0});
   await page.waitForTimeout(300);await page.screenshot({path:path.join(results,mode+'-clown-dance.png')});
   // A risada é global: toca longe de palhaços e só uma vez por sorteio.
   await move(page,14);await page.waitForFunction(()=>__clownMusic.paused);
   await page.evaluate(()=>{
    const realNow=performance.now.bind(performance),due=RoubeOvoClowns.nextWitchAt;
    performance.now=()=>due+1;RoubeOvoClowns.update();performance.now=realNow;
   });
   await page.waitForFunction(()=>!__witch.paused&&__witch.currentTime>.05);
   assert.equal(await page.evaluate(()=>__witch.testPlayCalls),1);assert(await page.evaluate(()=>__clownMusic.paused));
   await page.waitForFunction(()=>__witch.paused,null,{timeout:10000});
   assert(await page.evaluate(()=>RoubeOvoClowns.nextWitchAt>performance.now()+34000));
   await move(page,4);await page.waitForFunction(()=>!__clownMusic.paused);
   await move(page,9.5);assert.equal(await page.evaluate(()=>__clownMusic.paused),false);
   await move(page,12);await page.waitForFunction(()=>__clownMusic.paused);
   await move(page,4);await page.waitForFunction(()=>!__clownMusic.paused);
   // A chocagem continua funcionando e conserva o foco dos efeitos de suspense.
   await page.evaluate(()=>{S.inc[0]={s:6,z:1,w:2,a:Date.now()-1000,b:Date.now()-1};hatch(0)});
   await page.waitForFunction(()=>RoubeOvoHatching.phase==='mystery');
   assert(await page.evaluate(()=>__clownMusic.paused&&__witch.paused));
   await page.waitForFunction(()=>RoubeOvoHatching.phase==='reveal');await page.locator('#hatchContinue').click();
   await page.waitForFunction(()=>!__clownMusic.paused);
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
   assert(await page.evaluate(()=>__clownMusic.paused&&__witch.paused));
   await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
   await page.waitForFunction(()=>!__clownMusic.paused);
   assert.deepEqual(errors,[]);
   console.log(mode.toUpperCase()+': cinco palhaços animados, proximidade, loop real, risada separada, foco da chocagem e áudio em segundo plano OK');
   await context.close();
  }
  console.log('CLOWNS_BROWSER_OK');
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
