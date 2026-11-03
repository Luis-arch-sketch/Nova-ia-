'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const port=3156,origin='http://127.0.0.1:'+port,dir=fs.mkdtempSync(path.join(os.tmpdir(),'rue-browser-'));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),ADMIN_PASSWORD_HASH:crypto.createHash('sha256').update('LOCAL_BROWSER_ONLY').digest('hex'),PLAYER_ACCESS_SECRET:crypto.randomBytes(32).toString('hex'),MODERATION_FILE:path.join(dir,'access.json')},stdio:['ignore','pipe','pipe']});
 let browser,log='';const debugPages=[];for(const stream of [server.stdout,server.stderr])stream.on('data',data=>log+=data);
 try{
  for(let i=0;i<150;i++){if(server.exitCode!==null)throw Error(log);try{if((await fetch(origin+'/health')).ok)break}catch{}await pause(30)}
  browser=await chromium.launch({headless:true,executablePath:process.env.PW_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  fs.mkdirSync('test-results/roles-combat',{recursive:true});const contexts=[],pages=[],errors=[];
  for(const [index,mobile] of [true,false].entries()){
   const context=await browser.newContext({viewport:mobile?{width:852,height:393}:{width:1280,height:720},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});contexts.push(context);
   await context.addInitScript(({index})=>{
    localStorage.setItem('rue3d_v1',JSON.stringify({pid:'preserved-player-'+index,sp:200000,$:456789,tm:0,bl:0,tr:-1,own:[],pets:[],inc:[null,null,null,null],idx:{},id:1,t:Date.now()}));
    localStorage.setItem('rue3d_admin_badge_verified_v1','yes');
    // O marcador legado não deve conceder o selo nem zerar o progresso.
   },{index});
   const page=await context.newPage();pages.push(page);debugPages.push(page);page.on('pageerror',error=>errors.push(error.message));
   // Teste de roubo/admin: impedir apenas no navegador de QA o trailer automático, que cobre os menus.
   await page.route('**/radioactive-cutscene.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
   await page.goto(origin+'/?sala=BAT-QA');console.log('UI ready',index,await page.locator('#roube-play').isVisible());if(await page.locator('#roube-play').isVisible())await page.locator('#roube-play').click({force:true});
   await page.waitForFunction(()=>MP.connected,null,{timeout:15000});
   await page.evaluate(()=>{for(let i=0;i<120;i++)window.RoubeOvoEntrance?.update(.05);A.freeze=true;A.god=true;});
   await page.waitForFunction(()=>!window.RoubeOvoEntrance?.active);
   assert.equal(await page.evaluate(()=>ownerVerified),false);assert.equal(await page.evaluate(()=>S.$),456789);assert.equal(await page.evaluate(()=>S.sp),200000);
  }
  const [owner,other]=pages;
  const eggIds=page=>page.evaluate(()=>eggs.map(e=>[e.netId,e.s,e.z,e.m]).sort((a,b)=>a[0].localeCompare(b[0])));
  assert.deepEqual(await eggIds(owner),await eggIds(other));
  await owner.locator('#bam').click();await owner.locator('#adKey').fill('LOCAL_BROWSER_ONLY');await owner.locator('#adEnter').click();
  await owner.waitForFunction(()=>MP.owner&&adminUnlocked);assert.equal(await other.evaluate(()=>ownerVerified),false);
  await owner.evaluate(()=>{adminSpawnEgg(0,5,4,'player',false,[0,2,6])});
  await owner.waitForFunction(()=>eggs.some(e=>e.s===5&&e.z===4&&e.netId));
  await other.waitForFunction(()=>eggs.some(e=>e.s===5&&e.z===4&&e.netId));
  assert.deepEqual(await eggIds(owner),await eggIds(other),'spawns não criam cópias locais extras');
  const eggId=await owner.evaluate(()=>eggs.find(e=>e.s===5&&e.z===4).netId);
  const opId=await other.evaluate(()=>MP.self);
  await owner.evaluate(()=>{adminTab=8;adminUI(true)});
  await owner.locator('[data-admin="moderate:refresh:"]').click();
  await owner.locator('[data-admin="moderate:grant:'+opId+'"]').click();
  await other.waitForFunction(()=>MP.canAdmin&&!MP.owner);assert.equal(await other.evaluate(()=>adminBadge.visible),false);
  await owner.locator('#adClose').click();
  await other.locator('#bInv').click();
  await other.getByRole('button',{name:'Equipar bastão',exact:true}).click();
  await other.screenshot({path:'test-results/roles-combat/desktop-inventory-bat.png'});
  await other.getByRole('button',{name:'Fechar',exact:true}).click();
  await owner.evaluate(id=>{const egg=eggs.find(e=>e.netId===id);mpPlace({x:egg.mesh.position.x,z:egg.mesh.position.z});take(egg)},eggId);
  await owner.waitForFunction(()=>carry&&!MP.pending);
  const position=await owner.evaluate(()=>({x:P.x,z:P.z}));
  await other.evaluate(pos=>{mpPlace({x:pos.x+5.5,z:pos.z,yaw:0});mpSend({type:'move',...mpPosition()})},position);
  await other.waitForFunction(id=>[...MP.players.values()].some(player=>player.carrying?.id===id),eggId);
  await other.locator('#rue-bat-hit').click();
  await owner.waitForFunction(()=>!carry&&!MP.pending);await other.waitForFunction(id=>eggs.some(e=>e.netId===id),eggId);
  await other.evaluate(id=>{const egg=eggs.find(e=>e.netId===id);mpPlace({x:egg.mesh.position.x,z:egg.mesh.position.z});take(egg)},eggId);
  await other.waitForFunction(id=>carry?.netId===id&&!MP.pending,eggId);
  assert.deepEqual(await other.evaluate(()=>Array.from(carry.m)),[0,2,6]);
  await owner.locator('#bam').click();await owner.evaluate(()=>{adminTab=8;adminUI(true)});await owner.locator('[data-admin="moderate:refresh:"]').click();
  await owner.locator('[data-admin="moderate:block:'+opId+'"]').click();await other.waitForFunction(()=>!MP.canAdmin&&!adminUnlocked);
  await owner.screenshot({path:'test-results/roles-combat/android-owner-controls.png'});
  await owner.locator('[data-admin="moderate:kick:'+opId+'"]').click();await other.waitForFunction(()=>MP.stopped&&!MP.connected);
  for(const [index,page] of pages.entries()){
   assert.equal(await page.evaluate(()=>S.pid),'preserved-player-'+index);assert.equal(await page.evaluate(()=>S.$),456789);assert.equal(await page.evaluate(()=>S.sp),200000);
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({android:true,desktop:true,ownerOnly:true,delegationRevoked:true,sharedEggs:true,batSteal:true,kick:true,progressPreserved:true}));
 }catch(error){for(const [i,page] of debugPages.entries())try{await page.screenshot({path:'test-results/roles-combat/failure-'+i+'.png'});console.error('PAGE',i,await page.locator('body').innerText())}catch{}throw error;}finally{await browser?.close();server.kill('SIGTERM');fs.rmSync(dir,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1});
