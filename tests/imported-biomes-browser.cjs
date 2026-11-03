'use strict';
// Browser smoke test: confirms real remote Kenney GLBs, not only old primitive fallback.
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const port=3196,base='http://127.0.0.1:'+port;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
 let browser,logs='';server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);
 try{
   let ready=false;
   for(let i=0;i<180;i++){if(server.exitCode!==null)throw Error(logs);
     try{if((await fetch(base+'/health')).ok){ready=true;break}}catch{}
     await sleep(60);
   }
   assert(ready,'Servidor do jogo');
   browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
   const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/?teste=kenney');
   await page.waitForFunction(()=>window.RoubeOvoMapRebuild?.installed===true,null,{timeout:15000});
   const map=await page.evaluate(()=>window.RoubeOvoMapRebuild);
   console.log('ORIGINAL STYLE ARCHITECTURE '+JSON.stringify(map));
   assert(map.originalTerrainPreserved&&map.oldGroundHidden===0,'A grama original deve permanecer sem pisos sobrepostos');
   assert(map.oldFenceHidden===5,'As cinco paredes da cerca devem virar trilhos laranja');
   assert(map.oldWallsHidden>=6,'Muralhas baixas devem ser substituídas');
   assert(map.cliffSections>=2&&map.groundTiles===0,'Paredões contínuos sem adicionar placas por cima da grama');
   assert(map.fenceSections===5,'Portão aberto e cercas com vãos corretos');
   await page.waitForFunction(()=>window.RoubeOvoImportedModels?.requestedTypes>=8,null,{timeout:15000});
   try{await page.waitForFunction(()=>window.RoubeOvoImportedModels?.loadedTypes>=5,null,{timeout:40000});}
   catch(e){const debug=await page.evaluate(()=>window.RoubeOvoImportedModels);throw Error('GLB remoto falhou: '+JSON.stringify(debug)+' | '+String(e));}
   const first=await page.evaluate(()=>({
     imported:window.RoubeOvoImportedModels,worldMeshes:sc.children.filter(m=>m.name?.startsWith('Kenney')).length,
     baseCount:BASE_GROUP.children.filter(m=>m.name?.startsWith('Kenney')).length,
     saved:localStorage.getItem('rue3d_v1')!==null
   }));
   console.log('KENNEY ANDROID GLB '+JSON.stringify({loaded:first.imported.loadedTypes,failed:first.imported.failedTypes,biomes:first.imported.modelsByBiome,oldReplaced:first.imported.oldSceneryReplaced,worldMeshes:first.worldMeshes,baseCount:first.baseCount,errors:first.imported.errors}));
   assert(first.imported.installed,'Modelos GLB devem carregar');
   assert(first.imported.loadedTypes>=5,'Cinco modelos diferentes');
   assert(first.worldMeshes>=2,'Cenas GLB instanciadas');
   assert.equal(errors.length,0,'Erros de JavaScript na tela: '+errors.join('; '));
   // Capturar o cenário 3D, e não a capa/cutscene que encobre a câmera nos screenshots antigos.
   await page.evaluate(()=>{
     document.getElementById('roube-capa')?.remove();
     const movie=document.getElementById('rue-radio-cutscene');
     if(movie){movie.hidden=true;movie.style.display='none';}
     if(window.RoubeOvoEntrance?.active)for(let i=0;i<180;i++)window.RoubeOvoEntrance.update(.05);
   });
   await page.waitForTimeout(500);
   require('node:fs').mkdirSync('test-results',{recursive:true});
   await page.screenshot({path:'test-results/roblox-style-base-android.png'});
   await page.evaluate(()=>{P.z=-65-9*70;P.g.position.z=P.z;});
   await page.waitForFunction(()=>window.RoubeOvoImportedModels?.modelsByBiome[9]>=2,null,{timeout:40000});
   const cherry=await page.evaluate(()=>({types:window.RoubeOvoImportedModels.modelsByBiome[9],visible:sc.children.some(o=>o.name==='Kenney CC0 - 10'&&o.visible&&o.children.length>0)}));
   await page.waitForTimeout(350);await page.screenshot({path:'test-results/roblox-style-cherry-android.png'});
   assert(cherry.visible,'Bioma das cerejeiras deve renderizar modelos reais');
   console.log('KENNEY CHERRY BLOSSOM '+JSON.stringify(cherry));
 }finally{await browser?.close();server.kill('SIGTERM')}
})().catch(e=>{console.error(e);process.exitCode=1});

