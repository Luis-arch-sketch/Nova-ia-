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
  if(responses.length)console.warn(mode.toUpperCase()+' RESOURCE WARNINGS '+JSON.stringify(responses));
  await context.close();
 }
 console.log('AUDITORIA VISUAL OK: Android + desktop, todos os controles preservados');
}finally{await browser?.close();srv.kill('SIGTERM')}
