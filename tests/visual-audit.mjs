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
  // Entrada inicial nunca deve criar Rare/Epic/Legendary/Secret prontos.
  const initialEggs=await page.evaluate(()=>{
   const nested=eggs.filter(e=>e.nest);
   return {common:nested.filter(e=>e.r<=1).length,rarer:nested.filter(e=>e.r>=2).length,
    chanceSecret:CFG.rare[7]};
  });
  assert(initialEggs.common>=20,'Common e Uncommon continuam surgindo ao entrar');
  assert.equal(initialEggs.rarer,0,'Sem excesso de ovos raros prontos ao entrar');
  assert.equal(initialEggs.chanceSecret,.10,'Secret continua 10% por renovação');
  const tierAudit=await page.evaluate(()=>{
   const labels=[0,1,2,3,4,5,6,7].map(j=>RAR[RS[j]]);
   const costs=[0,1,2,3,4,5,6,7].map(j=>SPC[2*8+j].inc);
   const defaultOdds=[2,3,4,7,8,9].map(r=>CFG.rare[r]);
   return {labels,costs,defaultOdds,limitedRate:SPC[LIMITED_ID].inc,
    mostValuableNormal:Math.max(...SPC.slice(0,LIMITED_ID).map(p=>p.inc))};
  });
  assert.deepEqual(tierAudit.labels,['Common','Uncommon','Rare','Epic','Legendary','Secret','Eternal','Divine']);
  assert.deepEqual(tierAudit.defaultOdds,[.40,.30,.20,.10,.04,.005],'Chance decrescente com raridade');
  assert(tierAudit.costs.every((n,i,a)=>i===0||n>a[i-1]),'Evolução de ganho aumenta do Legendary ao Divine');
  assert(tierAudit.limitedRate>tierAudit.mostValuableNormal,'LIMITED é o ovo mais poderoso de todos');
  console.log(mode.toUpperCase()+' HIERARQUIA DAS RARIDADES '+JSON.stringify(tierAudit));

  console.log(mode.toUpperCase()+' ENTRADA SEM EXCESSO DE OVOS RAROS '+JSON.stringify(initialEggs));

  // DIA: as 13 áreas abertas; a BASE conserva sua própria cerca e portão.
  const fenceDay=await page.evaluate(()=>{
   const oldPhase=EGG_NIGHT.phase;
   try{
    EGG_NIGHT.phase='day';
    const crossings=[
     {name:'divisão centro',oldX:0,oldZ:-28,x:0,z:-32},
     {name:'divisão lateral',oldX:75,oldZ:-28,x:75,z:-32},
     {name:'divisão parte 4',oldX:40,oldZ:-238,x:40,z:-242}
    ];
    const openAreas=crossings.map(({name,oldX,oldZ,x,z})=>{
     const p={x,z,vx:4,vz:5};
     partBorderCollision(p,oldZ,oldX);
     return {name,free:p.x===x&&p.z===z};
    });
    const meshes=sc.children.filter(o=>o.isMesh&&o.material?.color?.getHex?.()===0xc89b5a);
    const front={x:-12.4,z:-10};
    const left={x:-19.1,z:8};
    const center={x:0,z:-10};
    push(front,.5);push(left,.5);push(center,.5);
    const fencePosts=OB.filter(o=>Math.abs(o.z+10)<.01&&Math.abs(o.x)>=6).length;
    return {openAreas,fenceMeshCount:meshes.length,fencePosts,
      frontStopped:front.x!==-12.4||front.z!==-10,
      leftStopped:left.x!==-19.1||left.z!==8,
      centralEntranceOpen:center.x===0&&center.z===-10,
      whiteAreas:GT.filter(g=>g.bar.visible||g.timer.visible).length};
   }finally{EGG_NIGHT.phase=oldPhase}
  });
  assert(fenceDay.openAreas.every(x=>x.free),'As 13 divisões permanecem abertas durante o dia');
  assert.equal(fenceDay.fenceMeshCount,5,'As cinco partes da cerca original da base estão visíveis');
  assert(fenceDay.fencePosts>0&&fenceDay.frontStopped&&fenceDay.leftStopped,
    'A cerca da base possui colisão nas laterais e na frente');
  assert(fenceDay.centralEntranceOpen,'Portão central permite entrar e sair da base');
  assert.equal(fenceDay.whiteAreas,0,'Sem paredes brancas nas áreas durante o dia');
  assert.equal(typeof NIGHT_BASE_WALLS,'undefined','Jamais existe parede branca na base');
  assert.equal(typeof NIGHT_BASE_TIMER,'undefined','Jamais existe cronômetro na cerca da base');
  console.log(mode.toUpperCase()+' CERCA DA BASE RESTAURADA '+JSON.stringify(fenceDay));

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
   const baseFenceDuringNight=sc.children.filter(o=>o.isMesh&&o.material?.color?.getHex?.()===0xc89b5a).length;
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
   const areaSide={x:75,z:gateZ-2,vz:-2};
   partBorderCollision(areaSide,gateZ+2,75);
   const areaSideBlocked=areaSide.z>gateZ;
   const baseFront={x:12.4,z:-10};
   push(baseFront,.5);
   const baseFrontBlocked=baseFront.x!==12.4||baseFront.z!==-10;
   const baseSide={x:19.1,z:8};
   push(baseSide,.5);
   const baseSideBlocked=baseSide.x!==19.1||baseSide.z!==8;
   const baseEntrance={x:0,z:-10};
   push(baseEntrance,.5);
   const baseEntranceOpen=baseEntrance.x===0&&baseEntrance.z===-10;
   updateEggNight(t0+9001);
   const sunrisePhase=EGG_NIGHT.phase;
   const secondClock=$('eggNightTime').textContent;
   const sunriseWallCount=GT.filter(g=>g.bar.visible&&g.timer.visible).length;
   const sunriseFenceCount=sc.children.filter(o=>o.isMesh&&o.material?.color?.getHex?.()===0xc89b5a).length;
   const noEggDuringUnlock=findEgg()===null;
   updateEggNight(t0+12001);
   const dayPhase=EGG_NIGHT.phase;
   const openWalls=GT.filter(g=>g.bar.visible||g.timer.visible).length;
   const originalBaseStillThere=sc.children.filter(o=>o.isMesh&&o.material?.color?.getHex?.()===0xc89b5a).length===5;
   const p2={x:0,z:gateZ-2,vz:-2};
   partBorderCollision(p2,gateZ+2);
   const gatesAreOpen=p2.z===gateZ-2;
   if(egg){egg.gr=1;egg.mesh.scale.copy(egg.base);P.x=egg.mesh.position.x;P.z=egg.mesh.position.z}
   const pickableInDay=!!egg&&findEgg()===egg;
   const ix=eggs.indexOf(limited);
   if(ix>=0)eggs.splice(ix,1);
   sc.remove(limited.mesh);
   P.x=0;P.z=8;P.vx=P.vz=0;upHud();
   return {started,previousEggs:oldEggs.length,newEggs:newEggs.length,removed,limitedKept,
    nightWallCount,baseFenceDuringNight,firstClock,initialGrowth,growth,
    noEggAtNight,takeProtected,wallPhysicallyBlocks,areaSideBlocked,baseFrontBlocked,baseSideBlocked,baseEntranceOpen,
    sunrisePhase,secondClock,sunriseWallCount,sunriseFenceCount,
    noEggDuringUnlock,dayPhase,openWalls,originalBaseStillThere,gatesAreOpen,pickableInDay};
  });
  assert(nightTest.started,'Night renewal starts');
  assert(nightTest.previousEggs>=20&&nightTest.newEggs>=20,'Normal eggs present without rare flood');
  assert(nightTest.removed,'Old nest eggs replaced');
  assert(nightTest.limitedKept,'Existing LIMITED remains untouched');
  assert.equal(nightTest.nightWallCount,13,'13 white walls closed');
  assert.equal(nightTest.baseFenceDuringNight,5,'A cerca original permanece na base durante os 9 segundos de noite');
  assert(nightTest.areaSideBlocked,'Parede branca da área bloqueia toda sua largura durante a noite');
  assert(nightTest.baseFrontBlocked&&nightTest.baseSideBlocked&&nightTest.baseEntranceOpen,
    'Na base continua a cerca original, com entrada central livre, sem parede branca');
  assert.equal(nightTest.firstClock,'9s','First 9 second countdown');
  assert(Math.abs(nightTest.growth-nightTest.initialGrowth-.12)<.001,'30× egg growth during night');
  assert(nightTest.noEggAtNight&&nightTest.takeProtected,'Egg collection blocked at night');
  assert(nightTest.wallPhysicallyBlocks,'Walls prevent crossing passage');
  assert.equal(nightTest.sunrisePhase,'unlock');
  assert.equal(nightTest.secondClock,'3s','Second 3 second countdown');
  assert.equal(nightTest.sunriseWallCount,13,'Walls remain for 3 extra seconds');
  assert.equal(nightTest.sunriseFenceCount,5,'Durante o segundo cronômetro a base mantém só a cerca original');
  assert(nightTest.noEggDuringUnlock,'Eggs still protected until unlocking');
  assert.equal(nightTest.dayPhase,'day');
  assert.equal(nightTest.openWalls,0,'All white walls vanish');
  assert(nightTest.originalBaseStillThere,'Ao amanhecer a cerca original da base continua no lugar');
  assert(nightTest.gatesAreOpen&&nightTest.pickableInDay,'Normal access to eggs and areas restored');
  console.log(mode.toUpperCase()+' NOITE DOS OVOS 9+3S '+JSON.stringify(nightTest));

  // Gravação do usuário: 20,1K Speed + trail Blue 2.5x = 50.25K
  // maior que 40K recomendados na Selva. Corrida absurda não deve disparar.
  const blueTrailScene=await page.evaluate(()=>{
   const old={sp:S.sp,tr:S.tr,carry,train:P.train,stun:P.stun,god:A.god,
     phase:EGG_NIGHT.phase,x:P.x,z:P.z,vx:P.vx,vz:P.vz};
   const g=raccoonGuard,gOld={st:g.st,t:g.t,pos:g.m.position.clone()};
   try{
    EGG_NIGHT.phase='day';A.god=false;P.train=false;P.stun=0;
    S.sp=20100;S.tr=2;P.x=g.home.x+11;P.z=g.home.z+1;
    P.vx=P.vz=0;
    const req=BI[3].req,effective=eff(),handsFreeSafe=!guardianShouldRush(3,g.home);
    const egg=eggs.find(e=>e.nest?.b===3&&e.j===0);
    if(!egg)return {error:'Ovo da Selva indisponível'};
    egg.gr=1;egg.mesh.scale.copy(egg.base);
    P.x=egg.mesh.position.x;P.z=egg.mesh.position.z;
    take(egg);
    const stole=carry===egg,noArtificialRush=!guardianShouldRush(3,g.home);
    const normalSpeed=guardianChaseSpeed(3);
    const playerSpeed=carryingRunSpeed();
    // Guarda legítimo acerta e recupera o ovo. Ele deve recuar, não acampar no corpo.
    g.m.position.set(P.x-1,0,P.z);
    hit(g);
    const emptyAfterHit=carry===null,shortStun=P.stun===.6;
    const distanceAfterHit=Math.hypot(P.x-g.m.position.x,P.z-g.m.position.z);
    const returning=g.st==='ret',safeText=!(carry&&g.st==='chase');
    step(.7);
    const upright=P.stun<=0;
    return {req,effective,handsFreeSafe,stole,noArtificialRush,normalSpeed,playerSpeed,
      emptyAfterHit,shortStun,distanceAfterHit,returning,safeText,upright};
   }finally{
    if(carry&&carry!==old.carry)drop();
    S.sp=old.sp;S.tr=old.tr;carry=old.carry;P.train=old.train;P.stun=old.stun;
    A.god=old.god;EGG_NIGHT.phase=old.phase;
    P.x=old.x;P.z=old.z;P.vx=old.vx;P.vz=old.vz;
    g.st=gOld.st;g.t=gOld.t;g.m.position.copy(gOld.pos);
    upHud();
   }
  });
  assert(!blueTrailScene.error,'Ovos Common da Selva continuam');
  assert.equal(blueTrailScene.req,40000,'Selva exige 40K recomendado');
  assert.equal(blueTrailScene.effective,50250,'Trail Blue = 2.5x');
  assert(blueTrailScene.handsFreeSafe,'Mãos livres na Selva: zero perseguição');
  assert(blueTrailScene.stole,'Pode pegar ovo fisicamente');
  assert(blueTrailScene.noArtificialRush,'50.25K efetivos impedem corrida exagerada');
  assert(blueTrailScene.playerSpeed>blueTrailScene.normalSpeed,'Jogador com trail pode fugir do guaxinim');
  assert(blueTrailScene.emptyAfterHit&&blueTrailScene.returning,'Ovo cai e guarda retorna ao posto');
  assert(blueTrailScene.shortStun&&blueTrailScene.distanceAfterHit>=4,'Guarda afasta-se após atingir');
  assert(blueTrailScene.safeText&&blueTrailScene.upright,'Recupera postura sem alerta permanente');
  console.log(mode.toUpperCase()+' GUAXINIM SELVA TRAIL CORRIGIDO '+JSON.stringify(blueTrailScene));

  // Reprodução do vídeo: HUD Mãos livres, Speed ~3,84K e guardião do Deserto.
  // Caminhar sem ovo NÃO pode iniciar perseguição, mesmo com Speed inferior a 10K.
  const guardTest=await page.evaluate(()=>{
   const old={sp:S.sp,x:P.x,z:P.z,vx:P.vx,vz:P.vz,stun:P.stun,train:P.train,
    god:A.god,freeze:A.freeze,phase:EGG_NIGHT.phase,carry};
   const desert=GD[2],lake=GD[1],rg=raccoonGuard;
   const guards=[desert,lake,rg].filter(Boolean);
   const states=guards.map(g=>({g,st:g.st,t:g.t,pos:g.m.position.clone()}));
   try{
    EGG_NIGHT.phase='day';A.god=false;A.freeze=false;P.train=false;P.stun=0;
    S.sp=3840;P.x=0;P.z=desert.home.z+20;P.vx=P.vz=0;carry=null;
    desert.st='sleep';desert.t=0;desert.m.position.copy(desert.home);
    const emptyHandTrigger=guardianShouldRush(2,desert.home);
    const initiallyIdle=desert.st==='sleep';
    step(.15);step(.15);
    const emptyHandsNoChase=desert.st!=='chase'&&desert.st!=='wake';
    const distanceFromHome=desert.m.position.distanceTo(desert.home);
    const walkToNextRegion=(P.stun<=0&&carry===null);
    // Raccoon also must ignore a slow player who has not stolen an egg.
    P.x=rg.home.x+22;P.z=rg.home.z;P.vx=P.vz=0;P.stun=0;
    rg.st='guard';rg.t=0;rg.m.position.copy(rg.home);
    const raccoonDoesNotRush=!guardianShouldRush(3,rg.home);
    step(.15);
    const raccoonRemainsGuard=rg.st==='guard';
    // Agora realmente roubar um ovo da área Lago: perseguir é legítimo.
    const egg=eggs.find(e=>e.nest?.b===1&&e.j===0);
    if(!egg)return {error:'Ovo da área Lago ausente'};
    egg.gr=1;egg.mesh.scale.copy(egg.base);
    P.x=egg.mesh.position.x;P.z=egg.mesh.position.z;P.vx=P.vz=0;P.stun=0;
    lake.st='sleep';lake.t=0;lake.m.position.copy(lake.home);
    const canPick=findEgg()===egg;
    // No Lago, Speed=0 fica ABAIXO dos 900 recomendados e ativa a corrida após o roubo.
    S.sp=0;
    take(egg);
    const stoleEgg=carry===egg;
    const lowSpeedChase=guardianShouldRush(1,lake.home);
    const chaseSpeed=guardianRushSpeed(1),walkingSpeed=walk(eff());
    step(.12);
    const guardChased=lake.st==='chase'||lake.st==='ret';
    const guardMoved=lake.m.position.distanceTo(lake.home)>1;
    // O roubo termina: todo guardião interrompe o ataque imediatamente.
    if(carry)drop();
    step(.01);
    const noChaseAfterDrop=lake.st!=='chase'&&lake.st!=='wake'&&rg.st!=='chase';
    return {emptyHandTrigger,initiallyIdle,emptyHandsNoChase,distanceFromHome,
     walkToNextRegion,raccoonDoesNotRush,raccoonRemainsGuard,canPick,stoleEgg,
     lowSpeedChase,chaseSpeed,walkingSpeed,guardChased,guardMoved,noChaseAfterDrop};
   }finally{
    S.sp=old.sp;P.x=old.x;P.z=old.z;P.vx=old.vx;P.vz=old.vz;
    P.stun=old.stun;P.train=old.train;A.god=old.god;A.freeze=old.freeze;
    EGG_NIGHT.phase=old.phase;carry=old.carry;
    for(const st of states){st.g.st=st.st;st.g.t=st.t;st.g.m.position.copy(st.pos)}
    upHud();
   }
  });
  console.log(mode.toUpperCase()+' ESTADO MÃOS LIVRES E ROUBO '+JSON.stringify(guardTest));
  assert(!guardTest.error,'Ovos normais carregados');
  assert.equal(guardTest.emptyHandTrigger,false,'Deserto ignora jogador com Mãos livres e 3,84K Speed');
  assert(guardTest.initiallyIdle&&guardTest.emptyHandsNoChase,'Guarda permanece quieto ao ver jogador sem ovo');
  assert(guardTest.distanceFromHome<.1,'Guarda não avança contra jogador de mãos vazias');
  assert(guardTest.walkToNextRegion,'Jogador pode explorar livremente sem ser atordoado');
  assert(guardTest.raccoonDoesNotRush&&guardTest.raccoonRemainsGuard,'Guaxinim parte 4 aguarda um roubo');
  assert(guardTest.canPick&&guardTest.stoleEgg,'Ovo pode ser roubado por aproximação');
  assert(guardTest.lowSpeedChase&&guardTest.guardChased&&guardTest.guardMoved,'Guarda corre após o roubo');
  assert(guardTest.chaseSpeed>guardTest.walkingSpeed*1.4,'Guarda mais rápido que um ladrão abaixo da Speed recomendada');
  assert(guardTest.noChaseAfterDrop,'Guardiões voltam ao posto após soltar ovo');
  console.log(mode.toUpperCase()+' BUG MÃOS LIVRES CORRIGIDO '+JSON.stringify(guardTest));

  // Teste físico completo: perseguição passa pelo portão em z=-10, alcança
  // a base em z=-4 e regressa depois de soltar o ovo (inclui parte 4).
  const reachBase=await page.evaluate(()=>{
   const old={sp:S.sp,tr:S.tr,carry,god:A.god,freeze:A.freeze,train:P.train,
    stun:P.stun,x:P.x,z:P.z,vx:P.vx,vz:P.vz,phase:EGG_NIGHT.phase,reset:nextReset};
   const guard=GD[0],raccoon=raccoonGuard;
   const snapshot=[guard,raccoon].map(g=>({g,st:g.st,t:g.t,rush:g.rush,
    pos:g.m.position.clone()}));
   try{
    EGG_NIGHT.phase='day';nextReset=Date.now()/1000+3600;
    A.god=true;A.freeze=false;P.train=false;P.stun=0;
    S.sp=100000;P.x=4;P.z=-4;P.vx=P.vz=0;
    // Primeiro testa a rota com colisão real da cerca: x=0, z=-10.
    guard.m.position.set(0,0,-30);
    for(let i=0;i<75;i++)aim(guard,4,-4,18,.05);
    const guardEntered=guard.m.position.z>-9.5;
    const guardAtDeposit=Math.hypot(guard.m.position.x-4,guard.m.position.z+4)<3;
    const guardBaseZ=guard.m.position.z;
    for(let i=0;i<100;i++)aim(guard,guard.home.x,guard.home.z,36,.05);
    const guardReturned=guard.m.position.distanceTo(guard.home)<1.5;
    // Roubo da parte 4: guaxinim inicia no fundo do mundo (-275),
    // com o jogador na base a >95m de distância. Ele deve continuar a caça.
    const egg=eggs.find(e=>e.nest?.b===3&&e.j===1);
    if(!egg)return {error:'Ovo da PARTE 4 indisponível'};
    egg.gr=1;egg.mesh.scale.copy(egg.base);
    take(egg);
    const holding=carry===egg;
    raccoon.st='chase';raccoon.rush=true;
    raccoon.m.position.copy(raccoon.home);
    const farDistance=Math.hypot(P.x-raccoon.home.x,P.z-raccoon.home.z);
    step(.05);
    const followsFromFar=raccoon.st==='chase'
      &&raccoon.m.position.z>raccoon.home.z+.2;
    const sprintHeld=raccoon.rush===true;
    // Caminho físico completo até a base, respeitando a abertura da cerca.
    for(let i=0;i<85;i++)aim(raccoon,4,-4,95,.05);
    const reachedByRaccoon=raccoon.m.position.z>-9.5
      &&Math.hypot(raccoon.m.position.x-4,raccoon.m.position.z+4)<3;
    const raccoonAtBaseZ=raccoon.m.position.z;
    // Após soltar, todos os guardiões param e voltam para as regiões.
    guard.st='chase';guard.rush=true;
    drop();
    const stopsAfterDrop=raccoon.st==='ret'&&guard.st==='ret'
      &&!raccoon.rush&&!guard.rush;
    for(let i=0;i<180;i++)aim(raccoon,raccoon.home.x,raccoon.home.z,36,.05);
    const raccoonReturned=raccoon.m.position.distanceTo(raccoon.home)<1.5;
    const handsFree=carry===null;
    return {guardEntered,guardAtDeposit,guardBaseZ,guardReturned,holding,
      farDistance,followsFromFar,sprintHeld,reachedByRaccoon,raccoonAtBaseZ,
      stopsAfterDrop,raccoonReturned,handsFree};
   }finally{
    if(carry&&carry!==old.carry)drop();
    S.sp=old.sp;S.tr=old.tr;carry=old.carry;
    A.god=old.god;A.freeze=old.freeze;P.train=old.train;P.stun=old.stun;
    P.x=old.x;P.z=old.z;P.vx=old.vx;P.vz=old.vz;
    EGG_NIGHT.phase=old.phase;nextReset=old.reset;
    for(const v of snapshot){
     v.g.st=v.st;v.g.t=v.t;v.g.rush=v.rush;v.g.m.position.copy(v.pos);
    }
    upHud();
   }
  });
  assert(!reachBase.error,'A parte 4 mantém os ovos normais');
  assert(reachBase.guardEntered&&reachBase.guardAtDeposit,'Guardião atravessa o portão e chega ao depósito');
  assert(reachBase.guardBaseZ>-9.5,'Guardião passa da antiga parede invisível em z=-14');
  assert(reachBase.guardReturned,'Guardião usa a mesma passagem para voltar ao ninho');
  assert(reachBase.holding,'O roubo da parte 4 foi efetuado');
  assert(reachBase.farDistance>200,'Ladrão já está longe do território do guaxinim');
  assert(reachBase.followsFromFar&&reachBase.sprintHeld,'Guaxinim continua caça a mais de 95 metros');
  assert(reachBase.reachedByRaccoon&&reachBase.raccoonAtBaseZ>-9.5,'Guaxinim entra na base pela cerca');
  assert(reachBase.stopsAfterDrop&&reachBase.handsFree,'Mãos livres encerram as perseguições');
  assert(reachBase.raccoonReturned,'Guaxinim regressa à parte 4 depois da perseguição');
  console.log(mode.toUpperCase()+' GUARDIÕES PERSEGUEM ATÉ A BASE '+JSON.stringify(reachBase));

  // CENÁRIO REPRODUZIDO: o jogador está com 200 mil de Speed (Selva recomenda 40K).
  // O guaxinim precisa perseguir imediatamente ao roubo, mas é MAIS LENTO
  // que o jogador enquanto a Speed efetiva está acima do recomendado.
  const fairRaccoon=await page.evaluate(()=>{
   const orig={sp:S.sp,tr:S.tr,carry,train:P.train,stun:P.stun,god:A.god,
    freeze:A.freeze,weightless:A.weightless,moveMult:A.moveMult,
    phase:EGG_NIGHT.phase,x:P.x,z:P.z,vx:P.vx,vz:P.vz,reset:nextReset};
   const rg=raccoonGuard,front=GD[2],other=GD[4],groups=[rg,front,other];
   const before=groups.map(g=>({g,st:g.st,t:g.t,rush:g.rush,pos:g.m.position.clone()}));
   const touched=[];
   try{
    EGG_NIGHT.phase='day';nextReset=Date.now()/1000+3600;
    A.god=false;A.freeze=false;A.weightless=false;A.moveMult=1;
    S.sp=200000;S.tr=-1;P.train=false;P.stun=0;P.vx=P.vz=0;
    // O cenário anterior pode ter usado o primeiro ovo da Selva.
    // Reconstruir um único ovo TEMPORÁRIO só no teste, sem mudar o jogo.
    const targetNest=NS.find(n=>n.b===3&&n.j===0);
    if(!targetNest)return {error:'Ninho da Selva ausente'};
    const created=!targetNest.e;
    const e=targetNest.e||newEgg(3,0);
    if(created){
     e.mesh=eggMesh(e);e.base=e.mesh.scale.clone();e.gr=1;
     e.nest=targetNest;targetNest.e=e;eggs.push(e);
     e.mesh.position.set(targetNest.x,.45+e.base.y,targetNest.z);
    }
    const gr=e.gr,scale=e.mesh.scale.clone(),pos=e.mesh.position.clone(),nest=e.nest,w=e.w;
    touched.push({e,gr,scale,pos,nest,w,created});
    e.gr=1;e.mesh.scale.copy(e.base);
    P.x=e.mesh.position.x;P.z=e.mesh.position.z;
    rg.st='guard';rg.rush=false;rg.m.position.copy(rg.home);
    front.st='sleep';front.m.position.copy(front.home);
    other.st='sleep';other.m.position.copy(other.home);
    const taken=take(e)===undefined&&carry===e;
    const instantChase=rg.st==='chase'&&stolenGuardArea()===3;
    const speedOfThief=carryingRunSpeed();
    const speedOfRaccoon=guardianChaseSpeed(3);
    const fairNormal=speedOfRaccoon<speedOfThief;
    const rec=BI[3].req;
    // Peso diferente de ovo jamais concede vantagem automática ao guaxinim.
    const weighted=[2,12,40,80].map(weight=>{
     e.w=weight;
     return {weight,player:carryingRunSpeed(),mob:guardianChaseSpeed(3)};
    });
    e.w=w;
    // No meio da divisa da Selva, o mob da frente tenta atacar indevidamente;
    // a lógica precisa desativá-lo e continuar com o guaxinim de trás.
    P.x=0;P.z=gz(3);P.vx=P.vz=0;
    front.st='chase';front.rush=true;
    other.st='chase';other.rush=true;
    const raccoonStart=rg.m.position.clone();
    step(.05);
    const onlyBack=rg.st==='chase'&&front.st!=='chase'&&other.st!=='chase';
    const raccoonMoved=rg.m.position.distanceTo(raccoonStart)>.2;
    const atBoundary=P.z===gz(3);
    // Ficar realmente abaixo da Speed recomendada faz o bicho ganhar a corrida.
    S.sp=1000;
    const lowSpeed=guardianChaseSpeed(3)>carryingRunSpeed();
    S.sp=200000;
    if(carry)drop();
    const endsWithDrop=rg.st==='ret'&&front.st!=='chase'&&other.st!=='chase';
    return {taken,instantChase,rec,speedOfThief,speedOfRaccoon,fairNormal,weighted,
     atBoundary,onlyBack,raccoonMoved,lowSpeed,endsWithDrop};
   }finally{
    if(carry&&carry!==orig.carry)drop();
    for(const t of touched){
     const {e,nest,gr,scale,pos,w,created}=t;
     if(created){
      e.mesh.parent?.remove(e.mesh);
      const index=eggs.indexOf(e);if(index>=0)eggs.splice(index,1);
      nest.e=null;continue;
     }
     e.w=w;
     if(e.mesh.parent!==sc){e.mesh.parent?.remove(e.mesh);sc.add(e.mesh)}
     e.gr=gr;e.mesh.scale.copy(scale);e.mesh.position.copy(pos);
     e.nest=nest;nest.e=e;if(!eggs.includes(e))eggs.push(e);
    }
    S.sp=orig.sp;S.tr=orig.tr;carry=orig.carry;P.train=orig.train;P.stun=orig.stun;
    A.god=orig.god;A.freeze=orig.freeze;A.weightless=orig.weightless;A.moveMult=orig.moveMult;
    EGG_NIGHT.phase=orig.phase;nextReset=orig.reset;
    P.x=orig.x;P.z=orig.z;P.vx=orig.vx;P.vz=orig.vz;
    for(const {g,st,t,rush,pos} of before){g.st=st;g.t=t;g.rush=rush;g.m.position.copy(pos)}
    upHud();
   }
  });
  assert(!fairRaccoon.error,'A Selva contém ovos comuns');
  assert(fairRaccoon.taken&&fairRaccoon.instantChase,'Roubo chama o guaxinim imediatamente');
  assert.equal(fairRaccoon.rec,40000,'Recomendação da Selva é de 40K');
  assert(fairRaccoon.fairNormal,'200 mil de Speed ultrapassa a corrida do guaxinim');
  assert(fairRaccoon.weighted.every(x=>x.player>x.mob),'Mesmo com ovo pesado o mob permanece mais lento');
  assert(fairRaccoon.atBoundary&&fairRaccoon.onlyBack,'No meio da divisa só o guaxinim de trás persegue');
  assert(fairRaccoon.raccoonMoved,'Guaxinim sai do posto e realmente se move atrás do ladrão');
  assert(fairRaccoon.lowSpeed,'Abaixo da recomendação o guaxinim ainda é perigoso');
  assert(fairRaccoon.endsWithDrop,'Mãos livres encerram a perseguição');
  console.log(mode.toUpperCase()+' GUAXINIM 200K E DIVISA SEM MOB DUPLO '+JSON.stringify(fairRaccoon));

  // Fronteira exata entre PARTE 2 e PARTE 3: só o mob de trás (parte 3)
  // protege o ovo roubado da parte 3. Repetir para guaxinim da PARTE 4.
  const borderOwnership=await page.evaluate(()=>{
   const saved={sp:S.sp,tr:S.tr,carry,train:P.train,stun:P.stun,
    god:A.god,freeze:A.freeze,phase:EGG_NIGHT.phase,reset:nextReset,
    x:P.x,z:P.z,vx:P.vx,vz:P.vz};
   const gBack=GD[2],gFront=GD[1],gOther=GD[4],rg=raccoonGuard;
   const guards=[gBack,gFront,gOther,rg].filter(Boolean);
   const original=guards.map(g=>({g,state:g.st,t:g.t,rush:g.rush,pos:g.m.position.clone()}));
   const touched=[];
   const setupEgg=(i,j=0)=>{
    let egg=eggs.find(e=>e.nest?.b===i&&e.j===j);
    let created=false,nest;
    // Outros cenários anteriores podem ter consumido os dois ovos comuns.
    // Criar um ovo comum SOMENTE no teste, restaurando o mundo no finally.
    if(!egg){
     nest=NS.find(n=>n.b===i&&n.j===j&&n.e===null);
     if(!nest)throw Error('Ninho de teste indisponível na parte '+(i+1));
     egg=newEgg(i,j);egg.mesh=eggMesh(egg);egg.base=egg.mesh.scale.clone();
     egg.gr=1;egg.mesh.position.set(nest.x,.45+egg.base.y,nest.z);
     egg.nest=nest;nest.e=egg;eggs.push(egg);created=true;
    }else nest=egg.nest;
    touched.push({egg,nest,created,position:egg.mesh.position.clone(),
      scale:egg.mesh.scale.clone(),gr:egg.gr,st:egg.st});
    egg.gr=1;egg.mesh.scale.copy(egg.base);
    return egg;
   };
   try{
    EGG_NIGHT.phase='day';nextReset=Date.now()/1e3+3600;
    A.god=false;A.freeze=false;P.train=false;P.stun=0;
    S.sp=0;S.tr=-1;P.vx=P.vz=0;
    const b=setupEgg(2);
    P.x=b.mesh.position.x;P.z=b.mesh.position.z;
    take(b);
    const ownedBack=stolenGuardArea()===2;
    // A divisa em z=-170 divide as partes 2 (frente) e 3 (atrás).
    P.x=0;P.z=gz(2);P.vx=P.vz=0;
    const exactBorder=P.z===-170;
    const backRush=guardianShouldRush(2,gBack.home);
    const frontRush=guardianShouldRush(1,gFront.home);
    step(.05);
    const backPursues=gBack.st==='chase';
    const frontIdle=gFront.st!=='chase'&&gFront.st!=='wake';
    const frontStillHome=gFront.m.position.distanceTo(gFront.home)<.1;
    if(carry)drop();

    // Guaxinim: ovo originário da PARTE 4, não da parte da frente.
    const e=setupEgg(3);
    P.x=e.mesh.position.x;P.z=e.mesh.position.z;P.stun=0;P.vx=P.vz=0;
    take(e);
    const ownedRaccoon=stolenGuardArea()===3;
    const raccoonWake=rg.st==='wake'||rg.st==='chase';
    P.x=0;P.z=gz(3);P.vx=P.vz=0;
    const raccoonRush=guardianShouldRush(3,rg.home);
    const neighborRush=guardianShouldRush(2,gBack.home);
    const raccoonBefore=rg.m.position.clone();
    step(.05);
    const raccoonChases=rg.st==='chase';
    const raccoonMoves=rg.m.position.distanceTo(raccoonBefore)>.25;
    const neighborIdle=gBack.st!=='chase'&&gBack.st!=='wake';
    const didNotSpawnSecondMob=!GD[3].m.parent;
    if(carry)drop();
    const afterDrop=rg.st==='ret'&&gBack.st!=='chase';
    // Cercas: a original está na base e paredes brancas só nas áreas.
    const baseFence=sc.children.filter(o=>o.isMesh
      &&o.material?.color?.getHex?.()===0xc89b5a).length;
    const baseWithoutWhiteWall=!('NIGHT_BASE_WALLS' in window);
    const whiteAreaCount=GT.length;
    return {ownedBack,exactBorder,backRush,frontRush,backPursues,frontIdle,frontStillHome,
      ownedRaccoon,raccoonWake,raccoonRush,neighborRush,raccoonChases,raccoonMoves,
      neighborIdle,didNotSpawnSecondMob,afterDrop,baseFence,baseWithoutWhiteWall,whiteAreaCount};
   }finally{
    if(carry&&carry!==saved.carry)drop();
    for(const v of touched){
     const {egg,nest,created,position,scale,gr,st}=v;
     if(created){
      egg.mesh.parent?.remove(egg.mesh);
      const idx=eggs.indexOf(egg);if(idx>=0)eggs.splice(idx,1);
      nest.e=null;continue;
     }
     if(egg.mesh.parent!==sc){egg.mesh.parent?.remove(egg.mesh);sc.add(egg.mesh)}
     egg.mesh.position.copy(position);egg.mesh.scale.copy(scale);egg.gr=gr;egg.st=st;
     egg.nest=nest;nest.e=egg;if(!eggs.includes(egg))eggs.push(egg);
    }
    S.sp=saved.sp;S.tr=saved.tr;carry=saved.carry;P.train=saved.train;P.stun=saved.stun;
    A.god=saved.god;A.freeze=saved.freeze;EGG_NIGHT.phase=saved.phase;
    nextReset=saved.reset;P.x=saved.x;P.z=saved.z;P.vx=saved.vx;P.vz=saved.vz;
    for(const {g,state,t,rush,pos} of original){
     g.st=state;g.t=t;g.rush=rush;g.m.position.copy(pos);
    }
    upHud();
   }
  });
  assert(borderOwnership.ownedBack&&borderOwnership.exactBorder,'O ovo da parte 3 mantém dono correto na linha -170');
  assert(borderOwnership.backRush&&!borderOwnership.frontRush,'Só o mob de trás detecta o roubo na divisa');
  assert(borderOwnership.backPursues&&borderOwnership.frontIdle&&borderOwnership.frontStillHome,
   'Só um mob persegue, o da frente fica em seu posto');
  assert(borderOwnership.ownedRaccoon&&borderOwnership.raccoonWake,'Roubar da PARTE 4 aciona o guaxinim');
  assert(borderOwnership.raccoonRush&&!borderOwnership.neighborRush,'Somente guaxinim reconhece o ovo na divisa da Selva');
  assert(borderOwnership.raccoonChases&&borderOwnership.raccoonMoves,'Guaxinim realmente persegue e se move');
  assert(borderOwnership.neighborIdle&&borderOwnership.didNotSpawnSecondMob,'Nenhum segundo guardião na parte 4');
  assert(borderOwnership.afterDrop,'Soltar ovo encerra a perseguição');
  assert.equal(borderOwnership.baseFence,5,'Cerca original da base preservada');
  assert(borderOwnership.baseWithoutWhiteWall&&borderOwnership.whiteAreaCount===13,
   'Paredes brancas reservadas às 13 divisões, sem paredão na base');
  console.log(mode.toUpperCase()+' GUAXINIM E FRONTEIRA GUARDA ÚNICA '+JSON.stringify(borderOwnership));

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
