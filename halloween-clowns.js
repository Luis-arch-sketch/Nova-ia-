'use strict';
// Palhaços da dança do L e risadas de bruxa são dois sons independentes.
(() => {
 const ENTER_RADIUS=8,EXIT_RADIUS=11;
 const music=new Audio('/audio/clown-dance.webm');
 const witch=new Audio('/audio/witch-laugh.mp3');
 music.loop=true;music.preload='none';music.volume=.65;
 witch.loop=false;witch.preload='auto';witch.volume=.70;
 let interacted=false,musicPending=false,witchPending=false,nearClown=false;
 let musicFocused=false,witchFocused=false,nextWitchAt=Infinity,retryMusicAt=0;
 let hatchOpen=false;
 const randomDelay=(min,max)=>1000*(min+Math.random()*(max-min));
 const focus=(type,on)=>window.dispatchEvent(new Event(type+(on?'-start':'-end')));
 function musicFocus(on){if(musicFocused===on)return;musicFocused=on;focus('clown-music',on)}
 function witchFocus(on){if(witchFocused===on)return;witchFocused=on;focus('witch-laugh',on)}
 function scheduleWitch(first=false){nextWitchAt=performance.now()+randomDelay(first?20:35,first?45:80)}
 function stopMusic(){music.pause();musicFocus(false)}
 function stopWitch(){witch.pause();witch.currentTime=0;witchPending=false;witchFocus(false)}
 function startMusic(){
  if(!interacted||!nearClown||document.hidden||hatchOpen||musicPending||!music.paused||performance.now()<retryMusicAt)return;
  musicPending=true;music.preload='auto';
  try{Promise.resolve(music.play()).then(()=>{
   if(!nearClown||document.hidden||hatchOpen){music.pause();musicFocus(false)}else musicFocus(true);
  }).catch(()=>{retryMusicAt=performance.now()+1500;musicFocus(false)}).finally(()=>{musicPending=false})}
  catch(e){musicPending=false;retryMusicAt=performance.now()+1500}
 }
 function playWitch(){
  if(!interacted||document.hidden||hatchOpen||witchPending||!witch.paused)return;
  witchPending=true;nextWitchAt=Infinity;witch.currentTime=0;
  try{Promise.resolve(witch.play()).then(()=>{
   if(document.hidden||hatchOpen){stopWitch();scheduleWitch()}else witchFocus(true);
  }).catch(()=>{witchFocus(false);scheduleWitch()}).finally(()=>{witchPending=false})}
  catch(e){witchPending=false;scheduleWitch()}
 }
 witch.addEventListener('ended',()=>{witchFocus(false);scheduleWitch()});
 witch.addEventListener('error',()=>{witchFocus(false);scheduleWitch()});
 music.addEventListener('error',()=>{musicFocus(false);retryMusicAt=performance.now()+5000});
 // Uma única faixa compartilhada: aproximar de dois palhaços não soma músicas.
 music.addEventListener('ended',()=>{if(nearClown)startMusic()});
 const unlock=()=>{if(!interacted){interacted=true;scheduleWitch(true)}retryMusicAt=0;startMusic()};
 addEventListener('pointerdown',unlock,{capture:true,passive:true});
 addEventListener('keydown',unlock,{capture:true});
 addEventListener('egg-hatch-start',()=>{hatchOpen=true;stopMusic();stopWitch();scheduleWitch()});
 addEventListener('egg-hatch-end',()=>{hatchOpen=false;startMusic()});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){stopMusic();stopWitch()}
  else{if(interacted)scheduleWitch();startMusic()}
 });
 addEventListener('pagehide',()=>{stopMusic();stopWitch()});

 const geometries={sphere:new T.SphereGeometry(1,12,9),cylinder:new T.CylinderGeometry(1,1,1,10),cone:new T.ConeGeometry(1,1,12)};
 const materials=new Map();
 const material=color=>{if(!materials.has(color))materials.set(color,new T.MeshLambertMaterial({color}));return materials.get(color)};
 function piece(parent,shape,color,scale,position,rotation=null){
  const mesh=new T.Mesh(geometries[shape],material(color));mesh.scale.set(...scale);mesh.position.set(...position);
  if(rotation)mesh.rotation.set(...rotation);mesh.castShadow=false;parent.add(mesh);return mesh;
 }
 function bone(parent,from,to,radius,color){
  const a=new T.Vector3(...from),b=new T.Vector3(...to),v=b.clone().sub(a);
  const mesh=piece(parent,'cylinder',color,[radius,v.length(),radius],a.clone().add(b).multiplyScalar(.5).toArray());
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return mesh;
 }
 // Unir partes imóveis por cor reduz as chamadas de desenho no Android.
 function batch(group){
  for(const child of [...group.children])if(child.isGroup)batch(child);
  const byMaterial=new Map();
  for(const m of group.children)if(m.isMesh){const list=byMaterial.get(m.material)||[];list.push(m);byMaterial.set(m.material,list)}
  for(const [mat,list] of byMaterial){
   if(list.length<2)continue;
   const positions=[],normals=[];
   for(const m of list){
    m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);
    for(const n of g.attributes.position.array)positions.push(n);
    for(const n of g.attributes.normal.array)normals.push(n);
    g.dispose();group.remove(m);
   }
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
   geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.computeBoundingSphere();
   group.add(new T.Mesh(geometry,mat));
  }
 }
 function createClown(index,primary,secondary,hair){
  const root=new T.Group(),body=new T.Group();root.name='PalhacoDancaL-'+index;root.add(body);
  const white=0xfff9ed,red=0xf33b56,yellow=0xffd04b,dark=0x222744;
  // Macacão arredondado, gola, pompons e sapatos grandes.
  piece(body,'sphere',primary,[.46,.64,.34],[0,1.78,0]);
  piece(body,'sphere',secondary,[.46,.27,.35],[0,1.25,0]);
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;piece(body,'sphere',white,[.15,.085,.15],[Math.cos(a)*.31,2.26,Math.sin(a)*.24])}
  for(const y of [1.52,1.80,2.07])piece(body,'sphere',yellow,[.105,.105,.105],[0,y,.335]);
  for(const s of [-1,1])for(const y of [1.51,1.91])piece(body,'sphere',secondary,[.065,.065,.035],[s*.27,y,.302]);
  piece(body,'sphere',white,[.40,.43,.35],[0,2.72,0]);
  piece(body,'sphere',0xffe3c4,[.25,.14,.09],[0,2.56,.306]);
  for(const s of [-1,1]){
   piece(body,'sphere',white,[.11,.15,.065],[s*.14,2.82,.313]);
   piece(body,'sphere',dark,[.046,.075,.030],[s*.14,2.82,.371]);
   piece(body,'cone',secondary,[.075,.18,.035],[s*.14,3.02,.31]);
   piece(body,'sphere',red,[.085,.06,.03],[s*.28,2.64,.275]);
   for(let j=0;j<3;j++)piece(body,'sphere',hair,[.18,.19,.19],[s*(.35+j*.025),2.68+j*.16,-.03]);
  }
  piece(body,'sphere',red,[.13,.13,.13],[0,2.72,.421]);
  for(let i=0;i<7;i++){const a=Math.PI+i*Math.PI/6;piece(body,'sphere',red,[.04,.036,.025],[Math.cos(a)*.17,2.57+Math.sin(a)*.10,.39])}
  piece(body,'cone',secondary,[.30,.58,.30],[0,3.31,-.03],[0,0,-.15]);
  piece(body,'sphere',yellow,[.10,.10,.10],[.045,3.63,-.03]);
  // Mão na testa: indicador vertical + polegar horizontal formam o L.
  const armL=new T.Group();armL.name='BracoDoL';armL.position.set(-.45,2.08,0);body.add(armL);
  bone(armL,[0,0,0],[-.36,.20,.10],.13,secondary);
  piece(armL,'sphere',yellow,[.145,.145,.145],[-.36,.20,.10]);
  bone(armL,[-.36,.20,.10],[.25,.70,.43],.105,primary);
  const hand=new T.Group();hand.name='MaoEmL';hand.position.set(.25,.70,.43);armL.add(hand);
  piece(hand,'sphere',white,[.115,.12,.055],[0,0,0]);
  bone(hand,[-.045,.02,0],[-.045,.34,0],.041,white);
  piece(hand,'sphere',white,[.041,.041,.041],[-.045,.34,0]);
  bone(hand,[.015,-.025,0],[.24,-.025,0],.043,white);
  piece(hand,'sphere',white,[.043,.043,.043],[.24,-.025,0]);
  const armR=new T.Group();armR.position.set(.45,2.08,0);body.add(armR);
  bone(armR,[0,0,0],[.36,-.32,.06],.13,primary);
  bone(armR,[.36,-.32,.06],[.05,-.62,.29],.10,secondary);
  piece(armR,'sphere',white,[.13,.13,.08],[.05,-.62,.29]);
  const legs=[];
  for(const s of [-1,1]){
   const hip=new T.Group(),knee=new T.Group();hip.name=s<0?'PernaEsquerda':'PernaDireita';
   hip.position.set(s*.23,1.18,0);body.add(hip);
   bone(hip,[0,0,0],[0,-.48,0],.17,s<0?primary:secondary);
   knee.position.set(0,-.48,0);hip.add(knee);
   bone(knee,[0,0,0],[0,-.43,0],.13,s<0?secondary:primary);
   piece(knee,'sphere',white,[.14,.08,.14],[0,-.38,0]);
   piece(knee,'sphere',red,[.25,.15,.43],[s*.025,-.48,.17]);
   piece(knee,'sphere',dark,[.255,.045,.43],[s*.025,-.58,.17]);
   legs.push({hip,knee,side:s});
  }
  batch(body);sc.add(root);
  return{root,body,armL,armR,legs,phase:index*.83};
 }
 const clowns=[
  createClown(0,0x8e51d1,0x24c6cf,0xf58a35),createClown(1,0xf066a6,0x467ae3,0x8b47cf),
  createClown(2,0x268bd9,0xffbe3c,0xed4d48),createClown(3,0xd74f66,0x6bbe54,0x299fda),
  createClown(4,0xc06af2,0xff9e48,0x3b9bce)
 ];
 function positionClowns(){
  clowns[0].root.position.set(BASE_HOME.x+11,0,BASE_HOME.z-4);
  clowns[1].root.position.set(BASE_HOME.x-9,0,BASE_HOME.z-19);
  clowns[2].root.position.set(13,0,-135);clowns[3].root.position.set(-13,0,-415);clowns[4].root.position.set(13,0,-765);
 }
 function animate(clown,time){
  const a=time*6.8+clown.phase,sway=Math.sin(a);
  clown.body.position.y=.07+Math.abs(sway)*.10;clown.body.rotation.z=sway*.085;
  clown.armL.rotation.z=Math.sin(a*.5)*.035;clown.armR.rotation.z=-sway*.12;
  for(const leg of clown.legs){const kick=Math.max(0,Math.sin(a+(leg.side<0?0:Math.PI)));
   leg.hip.rotation.x=-kick*.95;leg.hip.rotation.z=leg.side*(.10+kick*.20);leg.knee.rotation.x=kick*.32;
  }
 }
 function update(){
  positionClowns();const now=performance.now();let nearest=Infinity;
  for(const clown of clowns){
   const distance=Math.hypot(P.x-clown.root.position.x,P.z-clown.root.position.z);nearest=Math.min(nearest,distance);
   clown.root.visible=distance<115;if(clown.root.visible)animate(clown,now/1000);
  }
  nearClown=nearest<(nearClown?EXIT_RADIUS:ENTER_RADIUS);
  music.volume=(witchFocused?.17:.65)*Math.max(.12,Math.min(1,(EXIT_RADIUS-nearest)/8));
  if(!nearClown||document.hidden||hatchOpen)stopMusic();else startMusic();
  if(interacted&&!document.hidden&&!hatchOpen&&now>=nextWitchAt)playWitch();
 }
 window.RoubeOvoClowns=Object.freeze({update,
  get count(){return clowns.length},get near(){return nearClown},get musicPlaying(){return!music.paused},
  get witchPlaying(){return!witch.paused},get nextWitchAt(){return nextWitchAt},
  get positions(){return clowns.map(c=>({x:c.root.position.x,z:c.root.position.z}))}
 });
 update();
})();
