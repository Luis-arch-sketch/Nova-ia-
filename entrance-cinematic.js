'use strict';
/* Cutscene 3D real de entrada. Usa o mundo Three.js do próprio jogo, não uma tela de texto. */
(()=>{
 const state={active:false,ready:false,seconds:0,portal:null,actor:null,meshParts:[],sparkles:[],originalVisible:true};
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
 const tint=(color,opacity=1)=>new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1,side:T.DoubleSide});
 const addMesh=(geom,mat,x=0,y=0,z=0,into=state.portal)=>{
  const mesh=new T.Mesh(geom,mat);mesh.position.set(x,y,z);into.add(mesh);state.meshParts.push(mesh);return mesh;
 };
 const erase=()=>{
  if(state.portal){
   sc.remove(state.portal);
   for(const mesh of state.meshParts){mesh.geometry?.dispose();if(Array.isArray(mesh.material))mesh.material.forEach(m=>m.dispose());else mesh.material?.dispose();}
  }
  if(state.actor)sc.remove(state.actor); // O clone compartilha os materiais do personagem real.
  if(state.originalVisible!==undefined)P.g.visible=state.originalVisible;
  state.active=false;state.portal=null;state.actor=null;state.meshParts=[];state.sparkles=[];
  const layer=document.getElementById('mpEntrance');
  if(layer)layer.style.display='none';
 };
 const start=()=>{
  if(state.active)return;
  state.active=true;state.ready=false;state.seconds=0;
  state.originalVisible=P.g.visible;
  try{
   state.portal=new T.Group();sc.add(state.portal);
   const outer=addMesh(new T.TorusGeometry(3.15,.27,12,64),tint(0xffd154));
   outer.scale.y=1.35;
   const inner=addMesh(new T.TorusGeometry(2.7,.13,10,64),tint(0x99e5ff,.88));
   inner.scale.y=1.35;inner.position.z=.12;
   const membrane=addMesh(new T.CircleGeometry(2.75,48),tint(0x863eff,.43));
   membrane.scale.y=1.35;membrane.position.z=-.12;
   const glow=addMesh(new T.CircleGeometry(3.4,48),tint(0xc64bff,.12));
   glow.scale.y=1.35;glow.position.z=-.25;
   const light=new T.PointLight(0xbe79ff,2.6,19);light.position.set(0,2.5,2);state.portal.add(light);
   for(let i=0;i<24;i++){
    const c=i%3===0?0xffe1a2:i%3===1?0x83efff:0xf2a7ff;
    const particle=addMesh(new T.SphereGeometry(.07+(i%4)*.025,6,5),tint(c));
    state.sparkles.push({mesh:particle,phase:i*2.399,radius:2.9+(i%5)*.18});
   }
   state.actor=P.g.clone(true);
   state.actor.visible=true;
   sc.add(state.actor);P.g.visible=false;
   state.portal.position.set(P.x,P.y+3.9,P.z+6.5);
   state.actor.position.set(P.x,P.y,P.z+21);
  }catch(err){console.warn('Falha ao preparar a câmera de entrada:',err);erase();}
 };
 const update=dt=>{
  if(!state.active)return;
  state.seconds=Math.min(60,state.seconds+Math.max(0,Math.min(dt,.08)));
  const t=state.seconds,progress=ease(t/5.9),run=ease(t/4.45);
  try{
   state.portal.position.set(P.x,P.y+3.9,P.z+6.5);
   state.portal.rotation.z=Math.sin(t*.75)*.06;
   const [outer,inner,membrane,glow]=state.meshParts;
   if(outer)outer.rotation.z=t*.21;
   if(inner)inner.rotation.z=-t*.34;
   if(membrane){membrane.material.opacity=.42+Math.sin(t*4)*.13;membrane.scale.x=.94+Math.sin(t*3)*.03;}
   if(glow)glow.material.opacity=.09+.07*(.5+.5*Math.sin(t*5));
   for(const p of state.sparkles){
    const a=p.phase+t*(.35+(p.phase%3)*.1),r=p.radius+Math.sin(t*2+p.phase)*.08;
    p.mesh.position.set(Math.sin(a)*r,Math.cos(a)*r*1.32,.25+Math.sin(t*3+p.phase)*.2);
   }
   if(state.actor){
    const z=21-21*run;
    state.actor.position.set(P.x+Math.sin(t*10)*.07*(1-run),P.y+Math.abs(Math.sin(t*13))*.19*(1-run),P.z+z);
    state.actor.rotation.y=Math.PI+Math.sin(t*5)*.06*(1-run);
    state.actor.scale.setScalar(.94+.06*run);
   }
   const side=12-9.7*progress+Math.sin(t*.8)*.9,alt=17-12.6*progress,back=38-27*progress;
   cam.position.set(P.x+side,P.y+alt,P.z+back);
   cam.lookAt(P.x,P.y+2.5+1.8*(1-progress),P.z+10.8-9.9*progress);
  }catch(err){console.warn('Falha na animação de entrada:',err);erase();return;}
  if(state.ready&&t>=5.9)erase();
 };
 const finish=()=>{state.ready=true;if(!state.active){const layer=document.getElementById('mpEntrance');if(layer)layer.style.display='none';}};
 window.RoubeOvoEntrance={start,update,finish,stop:erase,get active(){return state.active},get seconds(){return state.seconds}};
})();
