'use strict';
// npm install --no-save playwright; npx playwright install chromium
// node tests/hatching-browser.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const port=Number(process.env.HATCH_TEST_PORT||3091),origin='http://127.0.0.1:'+port;
const results=path.resolve('test-results/hatching');fs.mkdirSync(results,{recursive:true});
const srv=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
let log='',browser;for(const out of [srv.stdout,srv.stderr])out.on('data',c=>log+=c);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function snapshot(page,name){
 // Congelar somente o relógio visual mantém a captura na fase inspecionada.
 await page.evaluate(()=>{window.__realNow=performance.now.bind(performance);const now=performance.now();performance.now=()=>now});
 try{await page.screenshot({path:path.join(results,name+'.png')})}
 finally{await page.evaluate(()=>{performance.now=window.__realNow})}
}
async function waitPhase(page,phase){await page.waitForFunction(p=>RoubeOvoHatching.phase===p,phase,{timeout:15000})}
async function seed(page,ids,ready=true){
 await page.evaluate(({ids,ready})=>{
  A.autoHatch=false;abuseStop(true);S.inc=[null,null,null,null];
  ids.forEach((s,k)=>S.inc[k]={s,z:k===0?1:4,w:12,a:Date.now()-20000,b:Date.now()+(ready?-10:10000)});
  RoubeOvoHatching.updateButtons();
 },{ids,ready});
}
function inspectAnimal(){
 const animal=window.__hatchScene.getObjectByName('HatchAnimal'),egg=window.__hatchScene.getObjectByName('HatchEggShell');
 const meshes=[];animal.traverse(o=>{if(o.isMesh)meshes.push(o)});
 return{visible:animal.visible,eggVisible:egg.visible,count:meshes.length,
  white:meshes.every(o=>o.material.color?.getHex()===0xffffff&&!o.material.map&&!o.material.vertexColors),
  colors:meshes.some(o=>o.material.color?.getHex()!==0xffffff)};
}
(async()=>{
 try{
  let ready=false;for(let i=0;i<100;i++){
   if(srv.exitCode!==null)throw Error(log);
   try{if((await fetch(origin+'/health')).ok){ready=true;break}}catch(e){}await pause(100);
  }
  assert(ready,'servidor iniciou');
  for(const [url,file] of [['/audio/egg-crack.mp3','audio/egg-crack.mp3'],['/audio/egg-suspense.mp3','audio/egg-suspense.mp3']]){
   const r=await fetch(origin+url);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'audio/mpeg');
   assert.deepEqual(Buffer.from(await r.arrayBuffer()),fs.readFileSync(file),'servidor entrega exatamente o som enviado');
  }
  browser=await chromium.launch({headless:true,executablePath:process.env.PW_CHROMIUM_EXECUTABLE_PATH||undefined,
   args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  for(const mobile of [true,false]){
   const mode=mobile?'android':'desktop',errors=[];
   const context=await browser.newContext({viewport:mobile?{width:393,height:852}:{width:1280,height:720},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto(origin,{waitUntil:'load'});
   await page.waitForFunction(()=>window.RoubeOvoHatching&&MP.connected);
   await page.locator('#roube-play').click();
   await page.evaluate(()=>{
    window.__soundPlays=[];
    const original=AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start=function(...args){window.__soundPlays.push({duration:this.buffer.duration,phase:RoubeOvoHatching.phase});return original.apply(this,args)};
    const Original=THREE.WebGLRenderer;
    THREE.WebGLRenderer=class extends Original{constructor(...args){super(...args);const render=this.render;this.render=(scene,camera)=>{window.__hatchScene=scene;return render.call(this,scene,camera)}}};
   });
   await page.evaluate(()=>{P.y=0;P.vy=0;P.stun=-.01});
   if(mobile)await page.locator('#bj').tap();else await page.keyboard.press('Space');
   await page.waitForFunction(()=>P.y>.3);await page.waitForFunction(()=>P.y===0,{},{timeout:10000});
   await page.evaluate(()=>{P.y=0;P.vy=0;P.stun=.02});
   await page.waitForFunction(()=>P.stun===0);
   if(mobile)await page.locator('#bj').tap();else await page.keyboard.press('Space');
   await page.waitForFunction(()=>P.y>.3);await page.waitForFunction(()=>P.y===0,{},{timeout:10000});
   await seed(page,[6],false);assert(await page.locator('#hatchEggBtn').isHidden());
   await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>S.pets.length),0);
   await page.evaluate(()=>{S.inc[0].b=Date.now()-1;RoubeOvoHatching.updateButtons()});
   assert(await page.locator('#hatchEggBtn').isVisible());await snapshot(page,mode+'-ready');
   // Dois cliques no mesmo evento de entrada precisam gerar somente um animal.
   await page.evaluate(()=>{const b=document.getElementById('hatchEggBtn');b.click();b.click()});
   await waitPhase(page,'crack');await snapshot(page,mode+'-crack');
   await waitPhase(page,'mystery');
   const white=await page.evaluate(inspectAnimal);assert(white.visible&&!white.eggVisible&&white.white&&white.count>0,JSON.stringify(white));
   assert.equal(await page.locator('#hatchTitle').textContent(),'Qual animal será?');
   assert.equal(await page.locator('#hatchDetails').textContent(),'');await snapshot(page,mode+'-mystery');
   await waitPhase(page,'reveal');
   assert((await page.evaluate(inspectAnimal)).colors);assert.equal(await page.locator('#hatchTitle').textContent(),'Bear');
   assert.equal(await page.evaluate(()=>S.pets.length),1);assert.equal(await page.evaluate(()=>S.inc[0]),null);
   const sounds=await page.evaluate(()=>window.__soundPlays);
   assert(sounds.some(s=>s.phase==='crack'&&s.duration>2&&s.duration<2.2),JSON.stringify(sounds));
   assert(sounds.some(s=>s.phase==='mystery'&&s.duration>1.3&&s.duration<1.5),JSON.stringify(sounds));
   await snapshot(page,mode+'-reveal');await page.locator('#hatchContinue').click();
   assert.equal(await page.evaluate(()=>RoubeOvoHatching.active),false);assert(await page.evaluate(()=>sc.visible));
   if(mobile){
    // Animal Divino já conquistado usa o próprio modelo e permanece branco até a revelação.
    await page.setViewportSize({width:852,height:393});await seed(page,[128]);await page.locator('#hatchEggBtn').tap();
    await waitPhase(page,'mystery');assert((await page.evaluate(inspectAnimal)).white);await snapshot(page,'android-landscape-mystery');
    await waitPhase(page,'reveal');assert.equal(await page.locator('#hatchTitle').textContent(),'Kirín das Estrelas');
    assert((await page.locator('#hatchDetails').textContent()).includes('Divino'));
    await snapshot(page,'android-landscape-reveal');await page.locator('#hatchContinue').click();
    await page.setViewportSize({width:393,height:852});await seed(page,[104]);await page.locator('#hatchEggBtn').tap();
    // Recarregar durante o suspense conserva o pet e consome o ovo uma única vez.
    await page.reload({waitUntil:'load'});await page.waitForFunction(()=>window.RoubeOvoHatching&&MP.connected);
    assert.equal(await page.evaluate(()=>S.pets.filter(p=>p.s===104).length),1);
    assert.equal(await page.evaluate(()=>S.inc[0]),null);assert.equal(await page.evaluate(()=>RoubeOvoHatching.active),false);
    await seed(page,[6,105,128]);
    await page.evaluate(()=>S.inc.forEach((s,i)=>{if(s)hatch(i,true)}));
    for(let i=0;i<3;i++){await waitPhase(page,'reveal');await page.locator('#hatchContinue').click()}
    assert.equal(await page.evaluate(()=>RoubeOvoHatching.active),false);
    assert(await page.evaluate(()=>S.inc.every(s=>s===null)));
   }
   assert.deepEqual(errors,[]);console.log(mode.toUpperCase()+': pulo, botão, casca, animal branco, sons, revelação e salvamento OK');
   await context.close();
  }
  console.log('HATCHING_BROWSER_OK');
 }finally{if(browser)await browser.close();srv.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
