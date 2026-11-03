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
   own:!!window.RoubeOvoWorldActions?.own&&window.RoubeOvoWorldActions.own.parent===sc.children.find(o=>o.name==='Physical stores, fusion machine and leaderboard'),
   board:window.RoubeOvoWorldActions.ranking.name,
   actions:window.RoubeOvoWorldActions.points.length,
   core:window.RoubeOvoFusionRules.roll(()=>.49)&&!window.RoubeOvoFusionRules.roll(()=>.5),
   escalation:window.RoubeOvoFusionRules.price(2000,2)>window.RoubeOvoFusionRules.price(2000,1),
   plaza:window.RoubeOvoPlaza?.installed&&window.RoubeOvoPlaza.slots===16,
   floor:window.RoubeOvoPlaza?.originalGrassPreserved&&window.RoubeOvoPlaza?.darkOverlayRemoved,
   curvedWalls:window.RoubeOvoPlaza?.curvedWallSections,
   corridorSections:window.RoubeOvoMapRebuild?.cliffSections,
   layout:window.RoubeOvoWorldActions.points.map(p=>({id:p.id,x:p.x,z:p.z,world:p.world})),
   initiallyAbsent:PEER_BASES.size===0
  }));
  assert.equal(before.shopDisplay,'none');assert.equal(before.rankDisplay,'none');
  assert(before.scene&&before.own&&before.board.includes('Placar'));assert.equal(before.actions,3);
  assert(before.core&&before.escalation);
  assert(before.plaza&&before.floor&&before.initiallyAbsent,'Pátio arredondado sem bases fantasmas');
  assert(before.curvedWalls>24&&before.corridorSections===60,'Muralhas contínuas acompanham o contorno da praça e o corredor');
  assert(before.layout[2].x===0&&before.layout[2].z===327,'Placar no fim arredondado, fora das bases');
  assert.deepEqual(before.layout.map(p=>p.id),['trails','fusion','ranking']);
  assert(before.layout[0].x<before.layout[1].x&&before.layout[0].z===before.layout[1].z,'Loja fica à esquerda da fusão');
  assert(before.layout.every(p=>p.world),'Loja, fusão e placar são áreas públicas independentes da base individual');
  console.log('ANDROID PHYSICAL STATIONS '+JSON.stringify(before));
  // As bases de outras pessoas só existem enquanto seus respectivos jogadores
  // estiverem na sala. A base própria e os obstáculos originais continuam.
  const presence=await page.evaluate(()=>{
    const empty=PEER_BASES.size,obstacles=OB.length;
    const fake={id:'rue-presence-test',name:'Outro Jogador',baseSlot:1,x:52,y:0,z:8,yaw:0,avatar:null};
    mpApplyUsers([fake]);
    const joined={bases:PEER_BASES.size,shown:PEER_BASES.has(fake.id),obstacles:OB.length};
    mpApplyUsers([]);
    const left={bases:PEER_BASES.size,obstacles:OB.length};
    return {empty,joined,left};
  });
  assert.equal(presence.empty,0,'Sem bases de terceiros quando sozinho');
  assert.equal(presence.joined.bases,1,'Base nasce quando outro jogador entra');
  assert(presence.joined.shown&&presence.joined.obstacles>presence.empty,'Base de amigo com colisão');
  assert.equal(presence.left.bases,0,'Base desaparece quando jogador sai');
  assert(presence.left.obstacles<presence.joined.obstacles,'Obstáculos de jogador ausente eliminados');
  console.log('ONLINE ONLY MULTIPLAYER BASES '+JSON.stringify(presence));
  const shop=await page.evaluate(()=>{
   P.x=-66;P.z=-24;
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
   P.x=-41;P.z=-24;
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
  const manifest=await fetch(base+'/manifest.webmanifest').then(r=>r.json());
  assert.equal(manifest.orientation,'landscape','O aplicativo instalado deve abrir deitado');
  const enterPage=await context.newPage();
  await enterPage.addInitScript(()=>{
   window.__startOrientation=[];
   Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,value:function(){window.__startOrientation.push('fullscreen');return Promise.resolve()}});
   if(typeof ScreenOrientation!=='undefined'){
    Object.defineProperty(ScreenOrientation.prototype,'lock',{configurable:true,value:function(direction){window.__startOrientation.push('lock:'+direction);return Promise.resolve()}});
   }
  });
  await enterPage.goto(base+'/?test=landscape-automatic',{waitUntil:'domcontentloaded'});
  await enterPage.locator('#roube-play').click();
  await enterPage.waitForFunction(()=>window.__startOrientation?.includes('lock:landscape'),null,{timeout:7000});
  const orientation=await enterPage.evaluate(()=>({calls:window.__startOrientation,cover:!!document.getElementById('roube-capa')}));
  assert.deepEqual(orientation.calls.slice(0,2),['fullscreen','lock:landscape'],'Primeiro toque JOGAR AGORA entra em tela cheia e tenta girar');
  assert.equal(orientation.cover,false);
  console.log('ANDROID AUTO LANDSCAPE AT PLAY '+JSON.stringify({orientation,manifest:manifest.orientation}));
  await enterPage.close();
  await context.close();
 }finally{await browser?.close();server.kill('SIGTERM')}
})().catch(e=>{console.error(e);process.exitCode=1});

