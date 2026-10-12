import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
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
   const ctx=c.getContext('webgl2')||c.getContext('webgl')||c.getContext('experimental-webgl');
   const keys=['bam','bRank','roomButton','bm','bf','bj','ba','recoverBtn'];
   const controls=keys.map(id=>({id,exists:!!document.getElementById(id)}));
   const species=(window.RoubeOvoVisuals?.species?.flat()?.filter(Boolean).length||0)+1; // 102 comuns + LIMITED ∞
   const visuals=window.RoubeOvoVisuals;
   return {
    controls,species,visualsReady:!!visuals,
    canvasSize:[c.width,c.height],
    webgl:!!ctx,
    status:(typeof S!=='undefined')?{saveKey:'rue3d_v1',pets:S.pets?.length}:null,
    renderer:(typeof R!=='undefined')?{triangles:R.info.render.triangles,calls:R.info.render.calls}:null,
    biomeCount:(typeof BI!=='undefined')?BI.length:null,
    sceneElements:(typeof sc!=='undefined')?sc.children.length:null,
    avatarParts:(typeof P!=='undefined')?P.g.children.length:null
   };
  });
  await page.screenshot({path:'test-results/'+mode+'.png'});
  console.log(mode.toUpperCase()+' STATE '+JSON.stringify(state));
  assert.equal(state.visualsReady,true,'Visuals must be initialized');
  assert.equal(state.species,103,'103 espécies ativas, com pato e pintinho retirados');
  assert.equal(state.biomeCount,13);
   const retired=await page.evaluate(()=>({
    emptySlots:[0,9].every(id=>window.RoubeOvoVisuals.species.flat()[id]===null),
    hasNoRemovedEggs:eggs.every(e=>e.s!==0&&e.s!==9),
    forestOrder:BI[0].sp.filter(Boolean).slice(0,4),
    activeIndexSize:ACTIVE_SPECIES.length,
    blockedSpawns:adminSpawnEgg(0,0,0)===null&&adminSpawnEgg(1,1,0)===null
   }));
   assert(retired.emptySlots&&retired.hasNoRemovedEggs&&retired.blockedSpawns,'Pato e pintinho devem ficar fora dos ninhos e do spawn');
   assert.equal(retired.activeIndexSize,103);
   assert.deepEqual(retired.forestOrder,['Dog','Bird','Burrowing Owl','Guaxinim'],'Coruja terceira e guaxinim quarto');
  assert(state.controls.every(e=>e.exists),'Every old button remains');
  assert(state.canvasSize[0]>100&&state.canvasSize[1]>100,'Canvas area');
  assert(state.sceneElements>50,'Scene detail');
  assert(state.avatarParts>=20,'O personagem deve ter roupa, mochila, cabelo e rosto detalhados');
  assert(state.webgl,'WebGL context created');
  assert(state.renderer?.calls>0,'Three.js must render at least one call');
  assert.equal(errors.length,0,'Game JavaScript runtime errors: '+JSON.stringify(errors));

  // Jogo padrão restaurado: ADMIN e jogador comum usam a mesma esteira inicial.
  const treadmill=await page.evaluate(()=>{
   const old={sp:S.sp,tm:S.tm,train:P.train,verified:ownerVerified,
    cfg:CFG.train,x:P.x,z:P.z,vx:P.vx,vz:P.vz,stun:P.stun};
   try{
    S.sp=100;S.tm=0;CFG.train=1;P.train=true;P.stun=0;
    ownerVerified=false;const beforeRegular=S.sp;step(.05);
    const gainedRegular=S.sp-beforeRegular;
    ownerVerified=true;P.train=true;const beforeAdmin=S.sp;step(.05);
    return {gainedRegular,gainedAdmin:S.sp-beforeAdmin,treadmillVisible:!!TMO&&sc.children.includes(TMO.g)};
   }finally{
    S.sp=old.sp;S.tm=old.tm;P.train=old.train;ownerVerified=old.verified;
    CFG.train=old.cfg;P.x=old.x;P.z=old.z;P.vx=old.vx;P.vz=old.vz;P.stun=old.stun;styleTM();
   }
  });
  assert(Math.abs(treadmill.gainedRegular-.1)<.001,'Esteira comum rende 0,1 Speed');
  assert(Math.abs(treadmill.gainedAdmin-.1)<.001,'Esteira igual para ADMIN e jogadores');
  assert(treadmill.treadmillVisible,'Esteira inicial normal disponível');
  console.log(mode.toUpperCase()+' PROGRESSÃO NORMAL '+JSON.stringify(treadmill));

  if(mobile){
    // Toque Android de verdade pelo protocolo Chromium, usando o joystick existente.
    const session=await context.newCDPSession(page);
    const startPos=await page.evaluate(()=>({x:P.x,z:P.z}));
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:76,y:645,id:1}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:76,y:575,id:1}]});
    await page.waitForTimeout(1700);
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const endPos=await page.evaluate(()=>({x:P.x,z:P.z}));
    console.log('ANDROID JOYSTICK '+JSON.stringify({start:startPos,end:endPos,deltaZ:endPos.z-startPos.z}));
    assert(endPos.z<startPos.z-.30,'Android joystick must move player forward');
  }
  const pageVisuals=await page.evaluate(()=>{
   const sample=[1,2,3,4,5,6,7,8,10,15,20,26,33,42,52,61,77,83,95,103,104];
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
  // Comparação geométrica real: 103 espécies, sem depender de recoloração.
  const sculptureAudit=await page.evaluate(()=>{
   const fingerprints=[],missing=[];
   for(let id=0;id<=104;id++){
    if(id===0||id===9)continue;
    const model=window.RoubeOvoVisuals.create(THREE,id,.7,new THREE.Color(0x777777),sc);
    const data=model?.userData?.uniqueSculpture;
    if(!data)missing.push(id);
    const shapes=[];
    model?.traverse(node=>{
     if(!node.isMesh)return;
     const p=node.position,z=node.scale;
     shapes.push([node.geometry?.type||'?',p.x.toFixed(2),p.y.toFixed(2),p.z.toFixed(2),z.x.toFixed(2),z.y.toFixed(2),z.z.toFixed(2)].join(':'));
    });
    fingerprints.push({
     signature:data?.signature,
     geometry:[model.children[0]?.scale.toArray().map(x=>x.toFixed(3)).join(','),shapes.sort().join('|')].join('~'),
     parts:shapes.length
    });
    sc.remove(model);
   }
   return {count:fingerprints.length,uniqueSignatures:new Set(fingerprints.map(x=>x.signature)).size,
    uniqueGeometry:new Set(fingerprints.map(x=>x.geometry)).size,
    minParts:Math.min(...fingerprints.map(x=>x.parts)),missing};
  });
  assert.equal(sculptureAudit.count,103,'103 modelos 3D ativos');
  assert.equal(sculptureAudit.uniqueSignatures,103,'Assinaturas individuais das 103 espécies');
  assert.equal(sculptureAudit.uniqueGeometry,103,'103 estruturas de geometria realmente diferentes');
  assert.equal(sculptureAudit.missing.length,0,'Nenhuma espécie sem novas partes de anatomia');
  assert(sculptureAudit.minParts>=10,'Anatomia detalhada também nos animais mais simples');
  console.log(mode.toUpperCase()+' ANIMAIS 3D ÚNICOS '+JSON.stringify(sculptureAudit));

  assert(pageVisuals.every(x=>x.meshCount>=7),'Each species model has detail');
  assert(new Set(pageVisuals.map(x=>x.kind)).size>=17,'Distinct species shapes');
  console.log(mode.toUpperCase()+' VISUALS '+JSON.stringify(pageVisuals));
  if(mode==='desktop'){
    const image=await page.evaluate(()=>{
      const showcase=new THREE.Scene();showcase.background=new THREE.Color(0x26344a);
      showcase.add(new THREE.HemisphereLight(0xffffff,0x5c7d83,1.35));
      const lamp=new THREE.DirectionalLight(0xffe7c4,1.35);lamp.position.set(7,16,13);showcase.add(lamp);
      const floor=new THREE.Mesh(new THREE.PlaneGeometry(45,34),new THREE.MeshLambertMaterial({color:0x6f9e87}));
      floor.rotation.x=-Math.PI/2;floor.position.y=-.06;showcase.add(floor);
      const ids=[1,2,3,4,5,6,15,20,33,42,52,61,77,83,95,103];
      for(let i=0;i<ids.length;i++){
        const species=ids[i];
        const color=new THREE.Color().setHSL((species*37%360)/360,.59,.59);
        const m=window.RoubeOvoVisuals.create(THREE,species,.96,color,showcase);
        m.position.set((i%8-3.5)*3.85,0,-3-Math.floor(i/8)*5.8);
        const pl=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.5,.12,20),new THREE.MeshLambertMaterial({color:0xc3c6b9}));
        pl.position.set(m.position.x,.01,m.position.z);showcase.add(pl);
      }
      const qc=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.3,130);
      qc.position.set(0,11,23);qc.lookAt(0,1,-4);
      R.render(showcase,qc);
      return document.getElementById('c').toDataURL('image/png');
    });
    assert(image.startsWith('data:image/png;base64,'),'3D gallery screenshot valid');
    await writeFile('test-results/animal-gallery.png',Buffer.from(image.split(',')[1],'base64'));
    console.log('ANIMAL GALLERY captured: 16 species');
    const bossGallery=await page.evaluate(()=>{
      const scene=new THREE.Scene();scene.background=new THREE.Color(0x203048);
      scene.add(new THREE.HemisphereLight(0xedf5ff,0x465765,.70));
      const light=new THREE.DirectionalLight(0xffe4b4,.90);light.position.set(8,17,12);scene.add(light);
      const ground=new THREE.Mesh(new THREE.PlaneGeometry(55,40),new THREE.MeshLambertMaterial({color:0x485a66}));
      ground.rotation.x=-Math.PI/2;ground.position.y=-.04;scene.add(ground);
      const ids=[7,15,23,45,61,68,78,86,94,102,103,104];
      ids.forEach((id,i)=>{
        const c=new THREE.Color().setHSL((id*37%360)/360,.6,.53);
        const g=window.RoubeOvoVisuals.create(THREE,id,id===104?.60:1.10,c,scene);
        g.position.set((i%6-2.5)*4.1,0,-3-Math.floor(i/6)*6.1);
        const p=new THREE.Mesh(new THREE.CylinderGeometry(1.62,1.65,.18,16),new THREE.MeshLambertMaterial({color:0xb2a991}));
        p.position.set(g.position.x,.02,g.position.z);scene.add(p);
      });
      const cam2=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.2,130);
      cam2.position.set(0,8,15);cam2.lookAt(0,1,-5.5);R.render(scene,cam2);
      return document.getElementById('c').toDataURL('image/png');
    });
    assert(bossGallery.startsWith('data:image/png;base64,'),'Boss gallery is a screenshot');
    await writeFile('test-results/boss-gallery.png',Buffer.from(bossGallery.split(',')[1],'base64'));
    console.log('BOSS GALLERY captured: 12 creatures');

    // Fotos reais de elementos exclusivos dos biomas, renderizadas no jogo.
    for(const [id,name] of [[2,'deserto'],[5,'vulcao'],[8,'cosmico'],[12,'encantada']]){
      const pic=await page.evaluate((b)=>{
        const x=b%2?31:-31,z=-65-70*b;
        const origin=cam.position.clone(),quat=cam.quaternion.clone(),previous={x:P.x,z:P.z};
        P.x=x;P.z=z;P.vx=P.vz=0;
        // Mostra clima e céu do bioma verdadeiro, como o jogador veria ao chegar.
        for(let i=0;i<65;i++)step(.05);
        cam.position.set(x+15,10,z+21);cam.lookAt(x,3.9,z);
        R.render(sc,cam);
        const pic=document.getElementById('c').toDataURL('image/png');
        P.x=previous.x;P.z=previous.z;P.vx=P.vz=0;
        cam.position.copy(origin);cam.quaternion.copy(quat);
        return pic;
      },id);
      assert(pic.startsWith('data:image/png;base64,'),'Biome screenshot produced');
      await writeFile('test-results/bioma-'+name+'.png',Buffer.from(pic.split(',')[1],'base64'));
    }
    console.log('LANDMARKS captured: Desert / Volcano / Cosmic / Enchanted');

  }
  if(mode==='desktop'){
    // Verifica 200 LIMITED sem sobreposição, isolamento de salas, persistência da Speed e recuperação do movimento.
    const spawned=await page.evaluate(()=>{
      S.sp=1234567;
      const before=eggs.filter(e=>e.s===LIMITED_ID).length;
      adminSpawnLimited(100,true);
      adminSpawnLimited(100,true);
      const created=eggs.filter(e=>e.s===LIMITED_ID);
      const count=created.length;
      const positions=new Set(created.map(e=>e.mesh.position.x+','+e.mesh.position.z));
      save();
      return {before,created:count,unique:positions.size};
    });
    assert.equal(spawned.created-spawned.before,200,'Duzentos LIMITED após 2 invocações');
    assert.equal(spawned.unique,spawned.created,'Ovos não empilhados em coordenadas iguais');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForTimeout(4200);
    const restored=await page.evaluate(()=>({
      eggs:eggs.filter(e=>e.s===LIMITED_ID).length,
      saved:S.limitedWorld?.length||0,
      speed:S.sp
    }));
    // Ovos LIMITED são exclusivos da sala. Ao recarregar, uma NOVA sala é criada.
    // Invocações locais, sem ADMIN autenticado na rede, jamais atravessam salas.
    assert.equal(restored.saved,0,'LIMITED não podem vazar para o save local de outra sala');
    assert.equal(restored.eggs,0,'Ovos LIMITED de uma sala anterior não aparecem numa sala nova');
    assert(restored.speed>=1234567,'Speed manteve valor salvo');
    await page.evaluate(()=>{P.x=42;P.z=-220;P.stun=1.5});
    await page.locator('#recoverBtn').click();
    const unstuck=await page.evaluate(()=>({x:P.x,z:P.z,stun:P.stun,speed:S.sp}));
    assert.equal(unstuck.x,0,'Destravar retorna à base');
    assert.equal(unstuck.z,8,'Destravar retorna ao spawn');
    assert.equal(unstuck.stun,0,'Destravar zera stun');
    assert(unstuck.speed>=1234567,'Destravar preserva Speed');
    console.log('GAMEPLAY REGRESSION '+JSON.stringify({spawned,restored,unstuck}));
  }
  // Night renewal integration: 13 gates, 9+3 countdowns, physical collision,
  // growth multiplier, protected LIMITED, eggs pickable again after sunrise.
  const nightTest=await page.evaluate(()=>{
   const t0=Date.now();
   const oldEggs=eggs.filter(e=>e.nest&&e.s!==LIMITED_ID);
   const limited=makeLimitedEgg(85,-200);
   const started=startEggNight(t0);
   const newEggs=eggs.filter(e=>e.nest&&e.s!==LIMITED_ID);
   const removed=oldEggs.every(e=>!eggs.includes(e));
   const limitedKept=eggs.includes(limited);
   const nightWallCount=GT.filter(g=>g.bar.visible&&g.timer.visible).length;
   const firstClock=$('eggNightTime').textContent;
   const egg=newEggs.find(e=>e.gr===0);
   const initialGrowth=egg?.gr;
   step(.01);
   const growth=egg?.gr;
   const noEggAtNight=findEgg()===null;
   const oldCarry=carry;
   if(egg)take(egg);
   const takeProtected=carry===oldCarry&&eggs.includes(egg);
   const gateZ=GT[0].z,p={x:0,z:gateZ-2,vz:-2};
   partBorderCollision(p,gateZ+2);
   const wallPhysicallyBlocks=p.z>gateZ;
   updateEggNight(t0+9001);
   const sunrisePhase=EGG_NIGHT.phase;
   const secondClock=$('eggNightTime').textContent;
   const sunriseWallCount=GT.filter(g=>g.bar.visible&&g.timer.visible).length;
   const noEggDuringUnlock=findEgg()===null;
   updateEggNight(t0+12001);
   const dayPhase=EGG_NIGHT.phase;
   const openWalls=GT.filter(g=>g.bar.visible||g.timer.visible).length;
   const p2={x:0,z:gateZ-2,vz:-2};
   partBorderCollision(p2,gateZ+2);
   const gatesAreOpen=p2.z===gateZ-2;
   if(egg){egg.gr=1;egg.mesh.scale.copy(egg.base);P.x=egg.mesh.position.x;P.z=egg.mesh.position.z}
   const savedNightSpeed=S.sp;
   if(egg)S.sp=eggSpeedRequired(egg)+1;
   const pickableInDay=!!egg&&findEgg()===egg;
   S.sp=savedNightSpeed;
   const ix=eggs.indexOf(limited);
   if(ix>=0)eggs.splice(ix,1);
   sc.remove(limited.mesh);
   P.x=0;P.z=8;P.vx=P.vz=0;upHud();
   return {started,previousEggs:oldEggs.length,newEggs:newEggs.length,removed,limitedKept,
    nightWallCount,firstClock,initialGrowth,growth,noEggAtNight,takeProtected,wallPhysicallyBlocks,
    sunrisePhase,secondClock,sunriseWallCount,noEggDuringUnlock,dayPhase,openWalls,gatesAreOpen,pickableInDay};
  });
  assert(nightTest.started,'Night renewal starts');
  assert(nightTest.previousEggs>50&&nightTest.newEggs>50,'Egg nests reset properly');
  assert(nightTest.removed,'Old nest eggs replaced');
  assert(nightTest.limitedKept,'Existing LIMITED remains untouched');
  assert.equal(nightTest.nightWallCount,13,'13 white walls closed');
  assert.equal(nightTest.firstClock,'9s','First 9 second countdown');
  assert(Math.abs(nightTest.growth-nightTest.initialGrowth-.12)<.001,'30× egg growth during night');
  assert(nightTest.noEggAtNight&&nightTest.takeProtected,'Egg collection blocked at night');
  assert(nightTest.wallPhysicallyBlocks,'Walls prevent crossing passage');
  assert.equal(nightTest.sunrisePhase,'unlock');
  assert.equal(nightTest.secondClock,'3s','Second 3 second countdown');
  assert.equal(nightTest.sunriseWallCount,13,'Walls remain for 3 extra seconds');
  assert(nightTest.noEggDuringUnlock,'Eggs still protected until unlocking');
  assert.equal(nightTest.dayPhase,'day');
  assert.equal(nightTest.openWalls,0,'All white walls vanish');
  assert(nightTest.gatesAreOpen&&nightTest.pickableInDay,'Normal access to eggs and areas restored');
  console.log(mode.toUpperCase()+' NOITE DOS OVOS 9+3S '+JSON.stringify(nightTest));

  // Speed exigida em todos os biomas: 0/igual bloqueia, maior libera.
  // Conferir também bloqueio direto via take(), inclusive ADMIN e LIMITED.
  const speedGateTest=await page.evaluate(()=>{
   const old={speed:S.sp,x:P.x,z:P.z,owner:ownerVerified,train:P.train};
   const cases=[];
   try{
    for(const index of [0,1,3,7,12]){
     const egg=eggs.find(e=>e.nest?.b===index);
     if(!egg){cases.push({index,error:'Nenhum ovo no ninho'});continue;}
     egg.gr=1;egg.mesh.scale.copy(egg.base);
     P.x=egg.mesh.position.x;P.z=egg.mesh.position.z;P.train=false;
     const req=BI[index].req;
     S.sp=req>0?req-1:0;
     const low={allowed:eggSpeedEnough(egg),selected:findEgg()===egg,locked:lockedEggNearby()===egg};
     const previousCarry=carry;take(egg);
     const directBlocked=carry===previousCarry&&eggs.includes(egg);
     S.sp=req;
     const equal={allowed:eggSpeedEnough(egg),selected:findEgg()===egg};
     S.sp=req+1;
     const high={allowed:eggSpeedEnough(egg),selected:findEgg()===egg};
     cases.push({index,req,low,directBlocked,equal,high});
    }
    const limited=makeLimitedEgg(75,-903),req=eggSpeedRequired(limited);
    P.x=limited.mesh.position.x;P.z=limited.mesh.position.z;
    S.sp=req;
    const limEqual=eggSpeedEnough(limited),limSelected=!!findEgg()&&findEgg()===limited;
    S.sp=req+1;
    const limGreater=eggSpeedEnough(limited),limPickable=findEgg()===limited;
    const ix=eggs.indexOf(limited);if(ix>=0)eggs.splice(ix,1);
    sc.remove(limited.mesh);
    const ownerEgg=eggs.find(e=>e.nest?.b===1);
    ownerVerified=true;S.sp=BI[1].req;
    const adminBlocked=!eggSpeedEnough(ownerEgg);
    return {cases,limited:{req,limEqual,limSelected,limGreater,limPickable},adminBlocked};
   }finally{
    S.sp=old.speed;P.x=old.x;P.z=old.z;ownerVerified=old.owner;P.train=old.train;upHud();
   }
  });
  assert.equal(speedGateTest.cases.length,5,'Testadas 5 áreas incluindo a última');
  for(const x of speedGateTest.cases){
   assert(!x.error,'Espécie ativa presente em '+x.index);
   assert(!x.low.allowed&&!x.low.selected&&x.low.locked&&x.directBlocked,'Speed baixa bloqueia coleta em '+x.index);
   assert(!x.equal.allowed&&!x.equal.selected,'Speed igual é insuficiente em '+x.index);
   assert(x.high.allowed&&x.high.selected,'Speed maior libera ovo em '+x.index);
  }
  assert.equal(speedGateTest.limited.req,5e10);
  assert(!speedGateTest.limited.limEqual&&!speedGateTest.limited.limSelected,'LIMITED bloqueado no requisito exato');
  assert(speedGateTest.limited.limGreater&&speedGateTest.limited.limPickable,'LIMITED liberado com Speed maior');
  assert(speedGateTest.adminBlocked,'ADMIN também obedece à recomendação');
  console.log(mode.toUpperCase()+' SPEED RECOMENDADA NA COLETA '+JSON.stringify(speedGateTest));

  if(responses.length)console.warn(mode.toUpperCase()+' RESOURCE WARNINGS '+JSON.stringify(responses));
  await context.close();
 }

 // Verifica a exclusão de uma conta antiga no navegador do ADMIN.
 const ownerCtx=await browser.newContext({viewport:{width:490,height:800}});
 await ownerCtx.addInitScript(()=>{
  if(localStorage.getItem('__owner_test_seeded'))return;
  localStorage.setItem('__owner_test_seeded','1');
  localStorage.setItem('rue3d_admin_badge_verified_v1','yes');
  localStorage.setItem('rue3d_v1',JSON.stringify({sp:999999,$:888888,tm:8,bl:4,tr:3,own:[0,1],
   pets:[{id:19,s:5,z:0,w:1,m:[]}],inc:[null,null,null,null],idx:{"5":1},id:20,t:Date.now()}));
  localStorage.setItem('rue3d_admin_v2',JSON.stringify({god:true,freeze:true,moveMult:7,trainMult:200}));
  localStorage.setItem('rue3d_mp_name','MeuNomeAntigo');
 });
 const ownerPage=await ownerCtx.newPage();
 await ownerPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
 await ownerPage.waitForTimeout(1500);
 const erased=await ownerPage.evaluate(()=>({
  money:S.$,speed:S.sp,pets:S.pets.length,tm:S.tm,bl:S.bl,tr:S.tr,
  idx:Object.keys(S.idx).length,own:S.own.length,god:A.god,move:A.moveMult,
  admin:ownerVerified,marker:localStorage.getItem(OWNER_RESET_KEY),
  badge:localStorage.getItem(ADMIN_DEVICE_KEY),
  previousName:localStorage.getItem('rue3d_mp_name')
 }));
 assert.deepEqual([erased.money,erased.speed,erased.pets,erased.tm,erased.bl,erased.tr,erased.idx,erased.own],
  [0,0,0,0,0,-1,0,0],'Progresso do dono começa totalmente zerado');
 assert.equal(erased.god,false);assert.equal(erased.move,1);
 assert(erased.admin&&erased.badge==='yes','ADMIN mantém identificação');
 assert.equal(erased.marker,'done','A exclusão ocorre uma única vez');
 assert.notEqual(erased.previousName,'MeuNomeAntigo','Nome antigo substituído por uma identidade nova');
 await ownerPage.evaluate(()=>{S.$=321;S.sp=42;save()});
 await ownerPage.reload({waitUntil:'domcontentloaded'});
 await ownerPage.waitForTimeout(700);
 const saved=await ownerPage.evaluate(()=>({
  money:S.$,speed:S.sp,admin:ownerVerified,marker:localStorage.getItem(OWNER_RESET_KEY)
 }));
 assert.equal(saved.money,321,'Dinheiro novo persistiu');
 assert.equal(saved.speed,42,'Speed nova persistiu');
 assert(saved.admin&&saved.marker==='done','ADMIN e conclusão do reset persistiram');
 await ownerCtx.close();
 console.log('RESET ÚNICO DE CONTA ADMIN '+JSON.stringify({erased,saved}));
 // Um jogador comum conserva o progresso, mesmo após a nova atualização do jogo.
 const normalCtx=await browser.newContext({viewport:{width:490,height:800}});
 await normalCtx.addInitScript(()=>{
  if(localStorage.getItem('__regular_test_seeded'))return;
  localStorage.setItem('__regular_test_seeded','1');
  localStorage.setItem('rue3d_v1',JSON.stringify({sp:999,$:12345,tm:1,bl:0,tr:-1,own:[],
   pets:[],inc:[null,null,null,null],idx:{},id:1,t:Date.now()}));
 });
 const normalPage=await normalCtx.newPage();
 await normalPage.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
 await normalPage.waitForTimeout(700);
 const normal=await normalPage.evaluate(()=>({
  money:S.$,speed:S.sp,admin:ownerVerified,marker:localStorage.getItem(OWNER_RESET_KEY)
 }));
 assert.equal(normal.money,12345,'O dinheiro de outros jogadores continua salvo');
 assert.equal(normal.speed,999,'A Speed de outros jogadores continua salva');
 assert.equal(normal.admin,false);assert.equal(normal.marker,null);
 await normalCtx.close();
 console.log('CONTA DE OUTROS JOGADORES INTACTA '+JSON.stringify(normal));

 console.log('AUDITORIA VISUAL OK: Android + desktop, todos os controles preservados');
}finally{await browser?.close();srv.kill('SIGTERM')}
