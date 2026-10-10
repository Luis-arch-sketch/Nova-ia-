import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const port=3057;
const srv=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
let serverLog='';
for(const out of [srv.stdout,srv.stderr])out.on('data',c=>{serverLog+=String(c)});
const timeout=async ms=>new Promise(r=>setTimeout(r,ms));
async function waitForServer(){
 for(let n=0;n<90;n++){
  if(srv.exitCode!==null)throw new Error('Servidor encerrou: '+serverLog);
  try{const r=await fetch('http://127.0.0.1:'+port+'/health');if(r.ok)return}catch{}
  await timeout(350);
 }
 throw new Error('Servidor demorou: '+serverLog);
}
const browserArgs=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage'];
let browser;
const errs=[];
try{
 await waitForServer();await mkdir('test-results',{recursive:true});
 browser=await chromium.launch({headless:true,args:browserArgs});
 for(const mode of ['android','desktop']){
  const mobile=mode==='android';
  const context=await browser.newContext({
   viewport:mobile?{width:393,height:852}:{width:1280,height:720},
   isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?1:1
  });
  const page=await context.newPage();
  const errors=[];const responses=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('requestfailed',r=>responses.push(r.url()+': '+r.failure()?.errorText));
  page.on('console',m=>{if(m.type()==='error')errors.push('Console: '+m.text())});
  const nav=await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded',timeout:45000});
  assert.equal(nav?.status(),200);
  await page.waitForTimeout(6000);
  assert.equal(await page.evaluate(()=>typeof THREE),'object','Three.js must load');
  const state=await page.evaluate(()=>{
   const c=document.querySelector('#c');
   const ctx=c.getContext('webgl')||c.getContext('experimental-webgl');
   const keys=['bam','bRank','roomButton','bm','bf','bj','ba','recoverBtn'];
   const controls=keys.map(id=>({id,exists:!!document.getElementById(id)}));
   const species=window.RoubeOvoVisuals?.species?.flat()?.length;
   const visuals=window.RoubeOvoVisuals;
   return {
    controls,species,visualsReady:!!visuals,
    canvasSize:[c.width,c.height],
    webgl:!!ctx,
    status:(typeof S!=='undefined')?{saveKey:'rue3d_v1',pets:S.pets?.length}:null,
    renderer:(typeof R!=='undefined')?{triangles:R.info.render.triangles,calls:R.info.render.calls}:null,
    biomeCount:(typeof BI!=='undefined')?BI.length:null,
    sceneElements:(typeof sc!=='undefined')?sc.children.length:null
   };
  });
  await page.screenshot({path:'test-results/'+mode+'.png'});
  console.log(mode.toUpperCase()+' STATE '+JSON.stringify(state));
  assert.equal(state.visualsReady,true,'Visuals must be initialized');
  assert.equal(state.species,104,'13 biome species sets of 8 creatures');
  assert.equal(state.biomeCount,13);
  assert(state.controls.every(e=>e.exists),'Every old button remains');
  assert(state.canvasSize[0]>100&&state.canvasSize[1]>100,'Canvas area');
  assert(state.sceneElements>50,'Scene detail');
  assert(state.webgl,'WebGL context created');
  assert(state.renderer?.calls>0,'Three.js must render at least one call');
  assert.equal(errors.length,0,'Game JavaScript runtime errors: '+JSON.stringify(errors));
  const pageVisuals=await page.evaluate(()=>{
   const sample=[0,1,2,3,4,5,6,7,10,15,20,26,33,42,52,61,77,83,95,103,104];
   const codes=[];
   for(const id of sample){
    const m=window.RoubeOvoVisuals.create(THREE,id,.7,new THREE.Color(0xffffff),sc);
    const v=m.userData.motion;
    const meshCount=m.children[0]?.children?.length;
    codes.push({id,kind:v.kind,meshCount});
    sc.remove(m);
   }
   return codes;
  });
  assert(pageVisuals.every(x=>x.meshCount>=7),'Each species model has detail');
  assert(new Set(pageVisuals.map(x=>x.kind)).size>=17,'Distinct species shapes');
  console.log(mode.toUpperCase()+' VISUALS '+JSON.stringify(pageVisuals));
  if(responses.length)console.warn(mode.toUpperCase()+' RESOURCE WARNINGS '+JSON.stringify(responses));
  await context.close();
 }
 console.log('AUDITORIA VISUAL OK: Android + desktop, todos os controles preservados');
}finally{await browser?.close();srv.kill('SIGTERM')}
