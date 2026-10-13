'use strict';
// Halloween 2026: termina depois de todo o dia 31, no horário de Brasília.
(() => {
 const STARTS_AT=Date.parse('2026-10-13T00:00:00-03:00');
 const ENDS_AT=Date.parse('2026-11-01T00:00:00-03:00');
 const MUSIC_URL='/audio/halloween-spooky-scary-skeletons.mp3';
 let serverTime=null,clockAnchor=0,active=false,interacted=false,playPending=false;
 let decorations=null,resources=[];
 const originalTitle=document.title,originalSunColor=sun.color.clone();
 const skyDay=new T.Color(0x63417d),skyNight=new T.Color(0x20132f),skyTone=new T.Color();
 const music=new Audio(MUSIC_URL);
 music.loop=true;music.controls=false;music.autoplay=true;music.preload='none';
 music.volume=.45;music.muted=false;
 const now=()=>serverTime===null?Date.now():serverTime+performance.now()-clockAnchor;
 if(window.RoubeOvoHalloweenPets)window.RoubeOvoHalloweenPets.setClock(now);
 const keep=r=>{resources.push(r);return r};
 const beginMusic=()=>{
  if(!active||playPending||!music.paused)return;
  playPending=true;
  try{Promise.resolve(music.play()).catch(()=>{}).finally(()=>{playPending=false})}
  catch(e){playPending=false}
 };
 const unlockMusic=()=>{interacted=true;beginMusic()};
 addEventListener('pointerdown',unlockMusic,{capture:true,passive:true});
 addEventListener('touchend',unlockMusic,{capture:true,passive:true});
 addEventListener('keydown',unlockMusic,{capture:true});
 music.addEventListener('ended',beginMusic);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkEvent();if(interacted)beginMusic()}});
 addEventListener('pageshow',()=>{checkEvent();if(interacted)beginMusic()});
 function makeDecorations(){
  const root=new T.Group();root.name='Halloween2026';
  const positions=[];
  // Mesma decoração nas dezesseis bases; estrada, incubadoras e ninhos ficam livres.
  for(let slot=0;slot<16;slot++){
   const x=[0,52,-52][slot%3],z=Math.floor(slot/3)*56;
   for(const [dx,dz] of [[-17,-20],[17,-20],[-17,17],[17,17]])positions.push({x:x+dx,z:z+dz,yaw:dx<0?Math.PI/2:-Math.PI/2,k:.78});
  }
  BI.forEach((b,i)=>{for(const side of [-1,1])for(const dz of [-22,0,22])positions.push({x:side*81,z:-65-70*i+dz,yaw:side<0?Math.PI/2:-Math.PI/2,k:1+(i%3)*.1})});
  const pumpkinGeo=keep(new T.SphereGeometry(1,18,12));
  const vertices=pumpkinGeo.attributes.position;
  for(let i=0;i<vertices.count;i++){
   const x=vertices.getX(i),z=vertices.getZ(i),rib=1+.07*Math.cos(8*Math.atan2(z,x));
   vertices.setXYZ(i,x*rib,vertices.getY(i),z*rib);
  }
  pumpkinGeo.computeVertexNormals();
  const orange=keep(new T.MeshLambertMaterial({color:0xff8624,emissive:0x622000}));
  const stemMat=keep(new T.MeshLambertMaterial({color:0x4c6528}));
  const faceMat=keep(new T.MeshBasicMaterial({color:0xffe19a,side:T.DoubleSide}));
  const eyeGeo=keep(new T.BufferGeometry());
  eyeGeo.setAttribute('position',new T.Float32BufferAttribute([-.34,-.2,0,.34,-.2,0,0,.35,0],3));
  const mouthShape=new T.Shape();mouthShape.moveTo(-.86,.1);mouthShape.lineTo(-.42,-.08);mouthShape.lineTo(-.14,.1);mouthShape.lineTo(.14,-.08);mouthShape.lineTo(.42,.1);mouthShape.lineTo(.86,.1);mouthShape.lineTo(.58,-.34);mouthShape.lineTo(-.58,-.34);mouthShape.closePath();
  const stemGeo=keep(new T.CylinderGeometry(.14,.22,.75,6));
  const mouthGeo=keep(new T.ShapeGeometry(mouthShape));
  const bodies=new T.InstancedMesh(pumpkinGeo,orange,positions.length);
  const stems=new T.InstancedMesh(stemGeo,stemMat,positions.length);
  const eyes=new T.InstancedMesh(eyeGeo,faceMat,positions.length*2);
  const mouths=new T.InstancedMesh(mouthGeo,faceMat,positions.length);
  const dummy=new T.Object3D();
  const place=(mesh,index,p,x,y,z,sx=1,sy=1,sz=1)=>{
   const cs=Math.cos(p.yaw),sn=Math.sin(p.yaw),k=p.k;
   dummy.position.set(p.x+k*(x*cs+z*sn),k*y,p.z+k*(-x*sn+z*cs));
   dummy.rotation.set(0,p.yaw,0);dummy.scale.set(k*sx,k*sy,k*sz);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);
  };
  const pumpkinColor=new T.Color();
  positions.forEach((p,i)=>{
   place(bodies,i,p,0,1.72,0,2.2,1.62,2.2);place(stems,i,p,0,3.53,0);
   place(eyes,i*2,p,-.62,2.12,2.26);place(eyes,i*2+1,p,.62,2.12,2.26);
   place(mouths,i,p,0,1.34,2.23);
   pumpkinColor.setHex(i%7===0?0xd49cff:i%4===0?0xffc374:0xffffff);bodies.setColorAt(i,pumpkinColor);
  });
  for(const mesh of [bodies,stems,eyes,mouths]){mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;root.add(mesh)}
  const postMat=keep(new T.MeshLambertMaterial({color:0x392147}));
  const postGeo=keep(new T.BoxGeometry(1,1,1));
  for(const x of [-12,12]){const post=new T.Mesh(postGeo,postMat);post.position.set(x,4.5,-28);post.scale.set(1.1,9,1.1);root.add(post)}
  const signCanvas=document.createElement('canvas');signCanvas.width=1024;signCanvas.height=192;
  const ctx=signCanvas.getContext('2d');ctx.fillStyle='#291238';ctx.fillRect(0,0,1024,192);ctx.strokeStyle='#ffb044';ctx.lineWidth=10;ctx.strokeRect(6,6,1012,180);
  ctx.fillStyle='#ffbe58';ctx.textAlign='center';ctx.font='900 70px system-ui';ctx.fillText('HALLOWEEN',512,86);
  ctx.fillStyle='#ffe7be';ctx.font='700 32px system-ui';ctx.fillText('ATÉ 31 DE OUTUBRO',512,145);
  const signTex=keep(new T.CanvasTexture(signCanvas));
  const signMat=keep(new T.MeshBasicMaterial({map:signTex,side:T.DoubleSide}));
  const signGeo=keep(new T.PlaneGeometry(24,4.5));
  const sign=new T.Mesh(signGeo,signMat);sign.position.set(0,9.4,-28);root.add(sign);
  const bulbGeo=keep(new T.SphereGeometry(.21,6,4));
  const bulbMat=keep(new T.MeshBasicMaterial({color:0xffffff}));
  const bulbs=new T.InstancedMesh(bulbGeo,bulbMat,25);
  for(let i=0;i<25;i++){dummy.position.set(-12+i,7.35-Math.sin(i/24*Math.PI)*1.1,-27.6);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();bulbs.setMatrixAt(i,dummy.matrix);bulbs.setColorAt(i,new T.Color(i%2?0xd99bff:0xffb744))}
  bulbs.instanceMatrix.needsUpdate=true;root.add(bulbs);
  sc.add(root);return root;
 }
 function checkEvent(){
  const time=now(),shouldBeActive=time>=STARTS_AT&&time<ENDS_AT;
  if(shouldBeActive!==active){
   active=shouldBeActive;
   if(active){
    decorations=makeDecorations();document.title='Roube um Ovo 3D — Halloween';
    if(typeof spawnHalloweenNestEggs==='function')spawnHalloweenNestEggs(true);
    music.preload='auto';beginMusic();
   }else{
    music.pause();music.currentTime=0;music.preload='none';
    if(window.RoubeOvoHalloweenPets)for(let i=eggs.length-1;i>=0;i--){
     const e=eggs[i];if(!window.RoubeOvoHalloweenPets.has(e.s))continue;
     sc.remove(e.mesh);if(e.aura)sc.remove(e.aura);if(e.nest)e.nest.e=null;eggs.splice(i,1);
    }
    if(decorations){sc.remove(decorations);decorations=null}
    for(const resource of resources)resource.dispose();resources=[];
    sun.color.copy(originalSunColor);document.title=originalTitle;
   }
  }
  return active;
 }
 async function syncClock(){
  try{const response=await fetch('/api/halloween',{cache:'no-store'});if(!response.ok)return;const data=await response.json();if(Number.isFinite(data.serverNow)){serverTime=data.serverNow;clockAnchor=performance.now();checkEvent()}}
  catch(e){/* Sem conexão, a data local mantém o término programado. */}
 }
 window.RoubeOvoHalloween=Object.freeze({
  get active(){return active},endsAt:ENDS_AT,
  update(){if(!checkEvent())return;skyTone.copy(skyDay).lerp(skyNight,A.night?1:nite*.92);bg.lerp(skyTone,.56);sc.fog.color.copy(bg);sun.color.setHex(0xffc38f)}
 });
 checkEvent();syncClock();setInterval(checkEvent,1000);setInterval(syncClock,60000);
})();
