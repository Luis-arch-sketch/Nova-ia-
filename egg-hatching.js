'use strict';
// A casca, a silhueta branca e a revelação usam o animal real da coleção.
(() => {
 const CRACK_END=2.1,REVEAL_AT=3.65;
 const readyButton=document.createElement('button');
 readyButton.id='hatchEggBtn';readyButton.type='button';readyButton.hidden=true;
 readyButton.textContent='🐣 Chocar ovo';document.body.appendChild(readyButton);
 const overlay=document.createElement('div');
 overlay.id='hatchOverlay';overlay.hidden=true;overlay.setAttribute('role','dialog');
 overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','hatchTitle');
 overlay.innerHTML='<div id="hatchCard"><p id="hatchEyebrow">UM NOVO AMIGO</p><h2 id="hatchTitle" aria-live="polite"></h2><p id="hatchSubtitle"></p><div id="hatchStage"><span id="hatchMystery" hidden aria-hidden="true">?</span><div id="hatchFlash"></div></div><p id="hatchDetails"></p><button id="hatchContinue" type="button" hidden>Continuar</button><div id="hatchProgress" aria-hidden="true"><span></span><span></span><span></span></div></div>';
 document.body.appendChild(overlay);
 const title=$('hatchTitle'),subtitle=$('hatchSubtitle'),details=$('hatchDetails');
 const stage=$('hatchStage'),question=$('hatchMystery'),next=$('hatchContinue');
 const dots=[...$('hatchProgress').children];
 const queue=[],soundBytes={},decoded={},sources=new Set();
 let active=null,renderer=null,previousFocus=null,previousSceneVisible=true;
 let hiddenAt=0;
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const [key,file] of Object.entries({crack:'egg-crack.mp3',suspense:'egg-suspense.mp3'})){
  soundBytes[key]=fetch('/audio/'+file).then(r=>{if(!r.ok)throw Error('Áudio indisponível');return r.arrayBuffer()}).catch(()=>null);
 }
 function audioContext(){
  try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume().catch(()=>{});return AC}catch(e){return null}
 }
 function prepareSounds(){
  const ctx=audioContext();if(!ctx)return;
  for(const key of Object.keys(soundBytes))if(!decoded[key]){
   decoded[key]=soundBytes[key].then(bytes=>bytes?ctx.decodeAudioData(bytes.slice(0)):null).catch(()=>null);
  }
 }
 // Desbloqueio no gesto do usuário: o segundo som pode tocar depois, no Android.
 addEventListener('pointerdown',prepareSounds,{capture:true,once:true});
 addEventListener('keydown',prepareSounds,{capture:true,once:true});
 function stopSounds(){for(const s of sources){try{s.stop()}catch(e){}}sources.clear()}
 function playSound(key,phase,offset=0){
  prepareSounds();const sequence=active,ctx=AC;if(!ctx||!decoded[key])return;
  decoded[key].then(buffer=>{
   if(!buffer||active!==sequence||active?.phase!==phase||document.hidden)return;
   const actualOffset=offset+Math.max(0,(performance.now()-sequence.soundRequestedAt)/1000);
   if(actualOffset>=buffer.duration)return;
   const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;
   gain.gain.value=key==='crack'?.9:.85;source.connect(gain);gain.connect(ctx.destination);
   source.onended=()=>{sources.delete(source);source.disconnect();gain.disconnect()};
   sources.add(source);source.start(0,actualOffset);
  }).catch(()=>{});
 }
 function updateButtons(){
  const ready=S.inc.map((s,k)=>s&&Date.now()>=s.b?k:-1).filter(k=>k>=0);
  readyButton.hidden=!!active||ready.length===0;
  readyButton.textContent='🐣 Chocar ovo'+(ready.length>1?' ('+ready.length+' prontos)':'');
  readyButton.setAttribute('aria-label','Chocar ovo'+(ready.length?' da incubadora '+(ready[0]+1):''));
  next.textContent=queue.length?'Próximo ovo ('+queue.length+')':'Continuar';
 }
 readyButton.onclick=()=>{
  if(active)return;prepareSounds();
  const k=S.inc.findIndex(s=>s&&Date.now()>=s.b);
  if(k>=0)hatch(k);updateButtons();
 };
 function resetInput(){
  jp=cp=null;J.x=J.y=0;Object.keys(K).forEach(k=>K[k]=0);
  P.train=false;P.vx=P.vz=0;
  $('js').style.display=$('jk').style.display='none';
 }
 function makePreview(p){
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,100);
  scene.add(new T.HemisphereLight(0xe7eeff,0x55477b,1.5));
  const light=new T.DirectionalLight(0xffffff,1.3);light.position.set(3,5,6);scene.add(light);
  const tint=new T.Color().setHSL((p.s*37%360)/360,.55,.6);
  if(p.m.length)tint.lerp(new T.Color(MUT[p.m[0]][3]),.6);
  const model=HW?.has(p.s)?HW.create(T,p.s,1,scene):window.RoubeOvoVisuals?.create(T,p.s,1,tint,scene)||creature(tint,1);
  const animal=new T.Group(),holder=new T.Group();animal.name='HatchAnimal';holder.add(model);animal.add(holder);scene.add(animal);
  animal.visible=false;
  const originalMaterials=new Map(),originalVisibility=new Map(),originalColors=new Map();
  const white=new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide,skinning:true,morphTargets:true});
  // Também neutraliza texturas, olhos, cores de vértices e brilho do Halloween.
  function makeWhite(){model.traverse(o=>{
   if(o.isSprite||o.isPoints){if(!originalVisibility.has(o))originalVisibility.set(o,o.visible);o.visible=false}
   else if(o.isMesh||o.isLine){
    if(!originalMaterials.has(o))originalMaterials.set(o,o.material);
    o.material=white;
    if(o.isInstancedMesh&&o.instanceColor&&!originalColors.has(o)){
     originalColors.set(o,o.instanceColor.array.slice());o.instanceColor.array.fill(1);o.instanceColor.needsUpdate=true;
    }
   }
  })}
  function restoreColors(){
   for(const [o,m] of originalMaterials)o.material=m;
   for(const [o,v] of originalVisibility)o.visible=v;
   for(const [o,c] of originalColors){o.instanceColor.array.set(c);o.instanceColor.needsUpdate=true}
  }
  function fitAnimal(){
   holder.scale.setScalar(1);holder.position.set(0,0,0);model.updateMatrixWorld(true);
   const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
   const scale=3.1/Math.max(size.x,size.y,size.z,.1);holder.scale.setScalar(scale);
   holder.position.copy(center).multiplyScalar(-scale);animal.position.set(0,.25,0);
  }
  fitAnimal();makeWhite();
  // Duas meias-cascas com borda irregular: a abertura é uma animação 3D real.
  const shell=new T.Group(),shellMaterial=new T.MeshLambertMaterial({color:HW?.has(p.s)?HW.types[HW.defs.find(d=>d.id===p.s).tier].color:0xffe7ad,side:T.DoubleSide});shell.name='HatchEggShell';
  const halves=[];
  for(let side=0;side<2;side++){
   const geometry=new T.SphereGeometry(1,32,18,0,Math.PI*2,side?Math.PI/2:0,Math.PI/2);
   const pos=geometry.attributes.position;
   for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),narrow=1-.17*(y+1)/2;
    const rim=Math.abs(y)<.001?.065*Math.sin(Math.atan2(z,x)*12):0;
    pos.setXYZ(i,x*narrow,(y+rim)*1.32,z*narrow);
   }
   geometry.computeVertexNormals();
   const half=new T.Mesh(geometry,shellMaterial);shell.add(half);halves.push(half);
  }
  shell.position.y=.15;scene.add(shell);
  const ringGeometry=new T.TorusGeometry(1.45,.035,6,64),ringMaterial=new T.MeshBasicMaterial({color:0xb4c7ff,transparent:true,opacity:.42});
  const ring=new T.Mesh(ringGeometry,ringMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=-1.38;scene.add(ring);
  let meshes=originalMaterials.size;
  return{scene,camera,model,animal,shell,halves,ring,makeWhite,restoreColors,fitAnimal,
   refreshModel(){let n=0;model.traverse(o=>{if(o.isMesh||o.isLine)n++});if(n!==meshes){meshes=n;fitAnimal()}},
   dispose(){restoreColors();white.dispose();shellMaterial.dispose();for(const h of halves)h.geometry.dispose();ringGeometry.dispose();ringMaterial.dispose()}
  };
 }
 function phase(name){
  if(!active||active.phase===name)return;
  active.phase=name;active.phaseStartedAt=performance.now();overlay.dataset.phase=name;
  dots.forEach((d,i)=>d.classList.toggle('done',i<=['crack','mystery','reveal'].indexOf(name)));
  if(name==='crack'){
   title.textContent='O ovo está abrindo...';subtitle.textContent='A casca começou a rachar!';
   active.soundRequestedAt=performance.now();playSound('crack',name);
  }else if(name==='mystery'){
   title.textContent='Qual animal será?';subtitle.textContent='Mais um instante...';question.hidden=false;
   stopSounds();active.soundRequestedAt=performance.now();playSound('suspense',name);
  }else{
   stopSounds();question.hidden=true;active.preview?.restoreColors();
   title.textContent=SPC[active.pet.s].n;subtitle.textContent='✨ Você chocou um novo animal!';
   const species=SPC[active.pet.s],rarity=species.hr??(active.pet.s===LIMITED_ID?10:RS[species.r]);
   details.textContent=SZ[active.pet.z][0]+' • '+RAR[rarity]+'\nRenda: $'+fm(pinc(active.pet))+'/s'+(active.pet.m.length?' • '+active.pet.m.map(i=>MUT[i][0]).join(' + '):'');
   next.hidden=false;updateButtons();next.focus({preventScroll:true});
  }
 }
 function start(item){
  if(!active){previousFocus=document.activeElement;previousSceneVisible=sc.visible}
  resetInput();sc.visible=false;
  active={pet:item.pet,phase:null,startedAt:performance.now(),preview:null};
  hiddenAt=document.hidden?performance.now():0;
  overlay.hidden=false;document.body.classList.add('hatchOpen');
  next.hidden=true;question.hidden=true;details.textContent='';
  try{
   if(!renderer){renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));stage.prepend(renderer.domElement)}
   active.preview=makePreview(item.pet);
  }catch(e){console.warn('Prévia da chocagem:',e)}
  overlay.tabIndex=-1;overlay.focus({preventScroll:true});phase('crack');updateButtons();
  window.dispatchEvent(new Event('egg-hatch-start'));
 }
 function play(pet,incubation){
  const item={pet,incubation};if(active)queue.push(item);else start(item);updateButtons();
 }
 function render(){
  if(!active||document.hidden)return;
  const now=performance.now();
  const phaseElapsed=(now-active.phaseStartedAt)/1000;
  // Cada etapa tem seu próprio relógio: um frame lento nunca pula o suspense.
  if(active.phase==='crack'&&phaseElapsed>=CRACK_END)phase('mystery');
  else if(active.phase==='mystery'&&phaseElapsed>=REVEAL_AT-CRACK_END)phase('reveal');
  const elapsed=(now-active.startedAt)/1000;
  const p=active.preview;if(!p||!renderer)return;
  const width=Math.max(1,stage.clientWidth),height=Math.max(1,stage.clientHeight);
  const size=renderer.getSize(new T.Vector2());if(size.x!==width||size.y!==height)renderer.setSize(width,height,false);
  p.camera.aspect=width/height;p.camera.updateProjectionMatrix();
  p.camera.position.set(0,.55,2.2/(Math.tan(19*Math.PI/180)*Math.min(1,p.camera.aspect)));
  p.camera.lookAt(0,.15,0);
  if(active.phase==='crack'){
   const split=Math.max(0,Math.min(1,(elapsed-.85)/1.1));
   p.shell.rotation.z=reducedMotion?0:Math.sin(elapsed*26)*.05*(1-split);
   p.halves[0].position.set(-split*.45,split*1.45,0);p.halves[0].rotation.z=split*.6;
   p.halves[1].position.set(split*.55,-split*.8,0);p.halves[1].rotation.z=-split*.45;
   p.shell.scale.setScalar(1-.35*split);p.shell.visible=true;p.animal.visible=false;
  }else{
   p.shell.visible=false;p.animal.visible=true;
   if(active.phase==='mystery'){p.makeWhite();p.refreshModel()}
   if(window.RoubeOvoVisuals)window.RoubeOvoVisuals.animate(p.model,elapsed,0);
   p.animal.rotation.y=reducedMotion?-.3:-.3+Math.sin(elapsed*.8)*.2;
   p.animal.position.y=.25+(reducedMotion?0:Math.sin(elapsed*2.3)*.04);
  }
  renderer.render(p.scene,p.camera);
 }
 function finish(){
  if(!active||active.phase!=='reveal')return;
  stopSounds();active.preview?.dispose();
  if(queue.length){const item=queue.shift();start(item);return}
  active=null;hiddenAt=0;sc.visible=previousSceneVisible;overlay.hidden=true;document.body.classList.remove('hatchOpen');
  if(renderer){const canvas=renderer.domElement;renderer.dispose();renderer.forceContextLoss();canvas.remove();renderer=null}
  window.dispatchEvent(new Event('egg-hatch-end'));updateButtons();
  if(previousFocus?.isConnected&&!previousFocus.hidden)previousFocus.focus({preventScroll:true});else $('bj').focus({preventScroll:true});
 }
 next.onclick=finish;
 overlay.addEventListener('keydown',e=>{
  if(e.code==='Escape'){e.preventDefault();finish()}
  if(e.code==='Tab'){e.preventDefault();(next.hidden?overlay:next).focus({preventScroll:true})}
 });
 document.addEventListener('visibilitychange',()=>{
  if(!active)return;
  if(document.hidden){hiddenAt=performance.now();stopSounds()}
  else if(hiddenAt){
   const paused=performance.now()-hiddenAt;active.startedAt+=paused;active.phaseStartedAt+=paused;hiddenAt=0;
   const elapsed=(performance.now()-active.phaseStartedAt)/1000;
   const key=active.phase==='crack'?'crack':active.phase==='mystery'?'suspense':null;
   if(key){active.soundRequestedAt=performance.now();playSound(key,active.phase,Math.max(0,elapsed))}
  }
 });
 window.RoubeOvoHatching=Object.freeze({get active(){return!!active},get phase(){return active?.phase||null},play,render,updateButtons});
 updateButtons();
})();
