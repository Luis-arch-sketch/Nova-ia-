'use strict';
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const port=3198,base='http://127.0.0.1:'+port,delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
 let logs='';server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);
 let browser;
 try{
  let ready=false;for(let i=0;i<180;i++){if(server.exitCode!==null)throw Error(logs);try{if((await fetch(base+'/health')).ok){ready=true;break}}catch{}await delay(80)}
  assert(ready);
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const context=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/?test=stations',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.RoubeOvoFusion&&!!window.RoubeOvoWorldActions,null,{timeout:18000});
  const before=await page.evaluate(()=>({
   shopDisplay:getComputedStyle(document.getElementById('bm')).display,
   rankDisplay:getComputedStyle(document.getElementById('bRank')).display,
   scene:!!sc.children.find(o=>o.name==='Physical stores, fusion machine and leaderboard'),
   own:!!BASE_GROUP.children.find(o=>o.name==='Base stations'),
   board:window.RoubeOvoWorldActions.ranking.name,
   actions:window.RoubeOvoWorldActions.points.length,
   core:window.RoubeOvoFusionRules.roll(()=>.49)&&!window.RoubeOvoFusionRules.roll(()=>.5),
   escalation:window.RoubeOvoFusionRules.price(2000,2)>window.RoubeOvoFusionRules.price(2000,1)
  }));
  assert.equal(before.shopDisplay,'none');assert.equal(before.rankDisplay,'none');
  assert(before.scene&&before.own&&before.board.includes('Placar'));assert.equal(before.actions,3);
  assert(before.core&&before.escalation);
  console.log('ANDROID PHYSICAL STATIONS '+JSON.stringify(before));
  const shop=await page.evaluate(()=>{
   P.x=BASE_HOME.x+29;P.z=BASE_HOME.z+7;
   const hit=window.RoubeOvoWorldActions.interact();
   return {hit,visible:document.getElementById('pn').style.display,trail:document.getElementById('pn').textContent.includes('Equipada:')};
  });
  assert(shop.hit&&shop.visible==='block'&&shop.trail,'Loja de trilhas física abre catálogo real');
  // A loja física mostra APENAS as trilhas, sem as abas do menu antigo.
  const separated=await page.evaluate(()=>{
   const p=document.getElementById('pn');
   const trailOnly={heading:p.textContent.includes('LOJA DE TRILHAS'),allTabs:p.querySelectorAll('button[data-a^="T"]').length,hasBase:p.textContent.includes('Base nível'),hasTreadmill:p.textContent.includes('Próxima:')};
   document.getElementById('bInv').click();
   const inventory={open:p.style.display,heading:p.textContent.includes('INVENTÁRIO'),tabs:[...p.querySelectorAll('button[data-a^="T"]')].map(b=>b.textContent),hasInventory:p.textContent.includes('Inventário')};
   p.querySelector('button[data-a="T0"]').click();
   const treadmillTab={heading:p.textContent.includes('INVENTÁRIO'),body:p.textContent.includes('Sua esteira'),hasTrails:p.textContent.includes('LOJA DE TRILHAS')};
   document.getElementById('bInv').click();
   return {trailOnly,inventory,treadmillTab,horizontalButton:!!document.getElementById('horizontalButton')};
  });
  assert(separated.trailOnly.heading&&separated.trailOnly.allTabs===0&&!separated.trailOnly.hasBase&&!separated.trailOnly.hasTreadmill,'Loja física contém exclusivamente trilhas');
  assert(separated.inventory.open==='block'&&separated.inventory.heading&&separated.inventory.tabs.length===5&&!separated.inventory.tabs.includes('Trails'),'Inventário tem suas próprias opções e deixa trilhas na loja');
  assert(separated.treadmillTab.heading&&separated.treadmillTab.body&&!separated.treadmillTab.hasTrails,'Esteira está disponível pelo inventário');
  assert(!separated.horizontalButton,'Botão Horizontal removido');
  console.log('TRAIL SHOP + INVENTORY SEPARATED ANDROID '+JSON.stringify(separated));
  const opened=await page.evaluate(()=>{
   document.getElementById('pn').style.display='none';
   P.x=BASE_HOME.x-29;P.z=BASE_HOME.z+7;
   const hit=window.RoubeOvoWorldActions.interact();
   return {hit,active:window.RoubeOvoFusion.active,text:document.getElementById('rue-fusion-card').textContent};
  });
  assert(opened.hit&&opened.active&&opened.text.includes('50%')&&opened.text.includes('40%'));
  await page.evaluate(()=>{
   window.confirm=()=>true;
   S.$=1e15;S.fusionCount=0;
   S.inc=[0,1,2].map(()=>({s:1,z:0,w:1,a:1,b:2,m:[]})).concat(null);
   Object.defineProperty(window.crypto,'getRandomValues',{configurable:true,value:array=>{array[0]=4294967295;return array}});
   window.RoubeOvoFusion.open();
  });
  for(let i=0;i<3;i++)await page.locator('[data-egg="'+i+'"]').check();
  const fail=await page.evaluate(()=>{
   const old=S.$;
   document.getElementById('rue-fuse-go').click();
   return {remaining:S.inc.filter(Boolean).length,attempts:S.fusionCount,cost:old-S.$,text:document.getElementById('rue-fusion-card').textContent};
  });
  assert.equal(fail.remaining,0);assert.equal(fail.attempts,1);assert(fail.cost>0&&fail.text.includes('FALHOU'));
  console.log('FUSION FAILURE 50PCT '+JSON.stringify({remaining:fail.remaining,attempts:fail.attempts,cost:fail.cost}));
  await page.evaluate(()=>{
   S.inc=[0,1,2].map(()=>({s:1,z:0,w:1,a:1,b:2,m:[]})).concat(null);
   Object.defineProperty(window.crypto,'getRandomValues',{configurable:true,value:array=>{array[0]=0;return array}});
   window.RoubeOvoFusion.open();
  });
  for(let i=0;i<3;i++)await page.locator('[data-egg="'+i+'"]').check();
  const success=await page.evaluate(()=>{
   const old=S.$;
   document.getElementById('rue-fuse-go').click();
   return {remaining:S.inc.filter(Boolean).length,attempts:S.fusionCount,cost:old-S.$,newEgg:S.inc.find(Boolean),text:document.getElementById('rue-fusion-card').textContent};
  });
  assert.equal(success.remaining,1);assert.equal(success.attempts,2);
  assert(success.cost>fail.cost,'Preço maior na segunda fusão');
  assert(success.newEgg.z>=1,'Ovo com tamanho superior');
  assert(success.text.includes('SUCESSO'));
  console.log('FUSION SUCCESS 50PCT '+JSON.stringify({remaining:success.remaining,attempts:success.attempts,cost:success.cost,newEgg:{s:success.newEgg.s,z:success.newEgg.z},pageErrors:errors}));
  assert.equal(errors.length,0,errors.join('\n'));
  await context.close();
 }finally{await browser?.close();server.kill('SIGTERM')}
})().catch(e=>{console.error(e);process.exitCode=1});
