'use strict';
// Verifica o botão SKIP real em tela Android, em ambas as cutscenes.
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const port=3197,base='http://127.0.0.1:'+port;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const srv=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
 let logs='';srv.stdout.on('data',d=>logs+=d);srv.stderr.on('data',d=>logs+=d);
 let browser;
 try{
  let ready=false;for(let i=0;i<200;i++){if(srv.exitCode!==null)throw Error(logs);try{if((await fetch(base+'/')).ok){ready=true;break;}}catch{}await delay(65)}
  assert(ready,'Servidor responsivo');
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.RoubeOvoEntrance&&!!document.getElementById('rue-radio-skip'),null,{timeout:15000});
  await page.evaluate(()=>window.dispatchEvent(new Event('roube-start-game')));
  await page.waitForFunction(()=>document.getElementById('rue-radio-cutscene')?.hidden===false,null,{timeout:7000});
  assert(await page.locator('#rue-radio-skip').isVisible(),'SKIP visível na cutscene radioativa');
  assert(await page.locator('#rue-radio-skip').evaluate(e=>e.getBoundingClientRect().right<=innerWidth+1),'SKIP dentro da tela Android');
  await page.locator('#rue-radio-skip').click();
  const radio=await page.evaluate(()=>({hidden:document.getElementById('rue-radio-cutscene')?.hidden,src:document.querySelector('#rue-radio-cutscene iframe')?.getAttribute('src')}));
  assert(radio.hidden,'A cutscene fica invisível ao pular');
  assert.equal(radio.src,'about:blank','O áudio e o vídeo da cutscene param no Skip');
  console.log('RADIO CUTSCENE SKIP ANDROID '+JSON.stringify(radio));
  await page.evaluate(()=>{document.getElementById('mpEntrance').style.display='block';window.RoubeOvoEntrance.start()});
  await page.waitForFunction(()=>window.RoubeOvoEntrance?.active,null,{timeout:9000});
  assert(await page.locator('#mpEntranceSkip').isVisible(),'SKIP visível na cutscene 3D do multiplayer');
  await page.locator('#mpEntranceSkip').click();
  const entry=await page.evaluate(()=>({active:window.RoubeOvoEntrance.active,layer:document.getElementById('mpEntrance').style.display,avatarVisible:P.g.visible}));
  assert.equal(entry.active,false,'A animação 3D encerra instantaneamente');
  assert.equal(entry.layer,'none','A tela de ENTRANDO é removida');
  assert(entry.avatarVisible,'O personagem volta a aparecer');
  console.log('MULTIPLAYER ENTRANCE SKIP ANDROID '+JSON.stringify(entry));
  await context.close();
 }finally{await browser?.close();srv.kill('SIGTERM')}
})().catch(e=>{console.error(e);process.exitCode=1});