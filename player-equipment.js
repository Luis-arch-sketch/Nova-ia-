'use strict';
(()=>{
 const KEY='rue3d_equipment_v1';let equipped=null,cooldown=0;const swings=new Map();
 try{if(localStorage.getItem(KEY)==='bat')equipped='bat'}catch{}
 const handleGeometry=new T.CylinderGeometry(.055,.055,.42,10),bodyGeometry=new T.CylinderGeometry(.14,.075,1.1,12),capGeometry=new T.SphereGeometry(.14,10,7);
 const wood=new T.MeshLambertMaterial({color:0x986035}),grip=new T.MeshLambertMaterial({color:0x382d2a});
 function makeBat(parent,local){
  const group=new T.Group();group.name='rue-equipped-bat';group.position.set(local?0:.6,local?-.85:1.15,.15);parent.add(group);
  for(const [geometry,material,z] of [[handleGeometry,grip,.12],[bodyGeometry,wood,.85],[capGeometry,wood,1.4]]){
   const mesh=new T.Mesh(geometry,material);mesh.rotation.x=Math.PI/2;mesh.position.z=z;mesh.castShadow=true;group.add(mesh);
  }
  return group;
 }
 const localBat=makeBat(aR,true);localBat.visible=equipped==='bat';
 const style=document.createElement('style');style.textContent='#rue-bat-hit{position:fixed;z-index:48;right:calc(118px + env(safe-area-inset-right,0px));bottom:calc(112px + env(safe-area-inset-bottom,0px));min-width:84px;min-height:44px;background:#b77942;color:white;font-weight:900;border:2px solid #ffe4b4;box-shadow:0 3px 12px #0007;display:none}body.rue-panel-visible #rue-bat-hit{display:none!important}#pn .batCard{padding:14px;border:2px solid #bd915c;border-radius:14px;background:#32465a;color:#fff;margin-top:14px}#pn .batCard h3{margin-top:0;color:#ffdf9a}';document.head.appendChild(style);
 const hit=document.createElement('button');hit.type='button';hit.id='rue-bat-hit';hit.textContent='🏏 Bater';hit.setAttribute('aria-label','Bater com o bastão');document.body.appendChild(hit);
 const allowed=()=>equipped==='bat'&&MP.connected&&!carry&&!MP.pending&&!adminVisible&&!open&&!window.RoubeOvoHatching?.active;
 function swing(){
  if(!allowed()||cooldown>0)return false;
  cooldown=.65;swings.set(MP.self,.28);beep(260,.05,'triangle',.025);mpSend({type:'move',...mpPosition(),training:false});return mpSend({type:'bat-swing'});
 }
 hit.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();swing()});
 hit.addEventListener('click',event=>{if(event.detail===0)swing()});
 window.addEventListener('keydown',event=>{
  if(event.code!=='KeyF'||event.repeat||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  if(allowed()){event.preventDefault();swing()}
 });
 function syncRemote(group,weapon){
  let bat=group.getObjectByName('rue-equipped-bat');if(!bat&&weapon==='bat'){const arm=group.getObjectByName('rue-peer-right-arm');bat=makeBat(arm||group,!!arm);}if(bat)bat.visible=weapon==='bat';return bat;
 }
 window.RoubeOvoEquipment={
  inventoryHtml:()=>`<section class="batCard"><h3>🏏 Bastão de madeira</h3><p>Grátis • Acerte um jogador que carrega um ovo para fazê-lo soltar. Pegue o ovo caído com Ação e leve para sua base.</p><p>Equipe e chegue perto de quem está carregando um ovo. Toque em <b>🏏 Bater</b> ou aperte <b>F</b>. Há um pequeno intervalo entre golpes.</p>${bt(equipped==='bat'?'unequipBat':'equipBat',equipped==='bat'?'Guardar bastão':'Equipar bastão')}</section>`,
  equip(weapon){equipped=weapon==='bat'?'bat':null;try{if(equipped)localStorage.setItem(KEY,equipped);else localStorage.removeItem(KEY)}catch{}localBat.visible=equipped==='bat';if(MP.connected)mpSend({type:'equip',weapon:equipped});},
  joined(){mpSend({type:'equip',weapon:equipped})},
  incoming(message){
   if(message.type==='equipment'){equipped=message.weapon==='bat'?'bat':null;localBat.visible=equipped==='bat'}
   if(message.type==='combat-swing'&&message.id!==MP.self)swings.set(message.id,.28);
   if(message.type==='combat-hit'&&message.id===MP.self){beep(140,.12,'triangle');toast('🏏 O jogador soltou o ovo! Use Ação para pegar.')}
   if(message.type==='bat-result'&&!message.ok&&message.message)toast(message.message);
  },
  update(dt){
   cooldown=Math.max(0,cooldown-dt);hit.style.display=allowed()?'block':'none';hit.disabled=cooldown>0;
   localBat.visible=equipped==='bat'&&!carry;
   for(const [id,time] of swings){const next=time-dt;if(next<=0)swings.delete(id);else swings.set(id,next)}
   const pose=(bat,arm,id)=>{const arc=swings.has(id)?Math.sin((1-swings.get(id)/.28)*Math.PI):0;bat.rotation.set(-.28-arc*.45,-.20-arc*1.25,arc*.12);if(arm){arm.rotation.z=.08-arc*.22;if(arc>0)arm.rotation.x=-.20-arc*.95}};
   pose(localBat,aR,MP.self);
   for(const [id,view] of MP.views){const user=MP.players.get(id);const bat=syncRemote(view.group,user?.weapon);if(bat){bat.visible=bat.visible&&!user?.carrying;pose(bat,view.group.getObjectByName('rue-peer-right-arm'),id)}}
  }
 };
 if(MP.connected)window.RoubeOvoEquipment.joined();
})();
