'use strict';
// Arena de evento separada do novo bioma. Apenas renderiza o estado validado pelo servidor.
(()=>{
 if(window.RoubeOvoRaid)return;
 const T=THREE,location3d={x:0,z:-300},state={hp:10000,maxHp:10000,respawnAt:0,portalOpen:true,candies:0,eggPrice:80};
 const portals=window.RoubeOvoLayout?.raidPortal||{town:{x:42,z:-10},arena:{x:17,z:-285}};
 // Portais físicos: a entrada fica ao lado da loja de trilhas e a saída na arena.
 function buildPortal(pos,title,color){
  const g=new T.Group();g.name=title;g.position.set(pos.x,0,pos.z);sc.add(g);
  const rim=new T.Mesh(new T.TorusGeometry(3.1,.34,10,36),new T.MeshBasicMaterial({color,side:T.DoubleSide}));
  rim.position.y=3.45;g.add(rim);
  const center=new T.Mesh(new T.CircleGeometry(2.85,40),
   new T.MeshBasicMaterial({color,transparent:true,opacity:.33,side:T.DoubleSide,depthWrite:false}));
  center.position.y=3.45;g.add(center);
  const foot=new T.Mesh(new T.CylinderGeometry(3,3,.16,32),
   new T.MeshLambertMaterial({color,emissive:color,emissiveIntensity:.2}));
  foot.position.y=.09;g.add(foot);
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#111b21';ctx.fillRect(0,0,768,128);
  ctx.strokeStyle='#92ffaf';ctx.lineWidth=8;ctx.strokeRect(4,4,760,120);
  ctx.fillStyle='#fff';ctx.font='bold 47px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(title,384,64,742);
  const label=new T.Mesh(new T.PlaneGeometry(10,1.75),
   new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas),side:T.DoubleSide}));
  label.position.y=8.2;g.add(label);
  return {group:g,rim,center,foot};
 }
 const entrance=buildPortal(portals.town,'☢ PORTAL DA BATALHA',0x4cf27d);
 const exit=buildPortal(portals.arena,'↩ VOLTAR À LOJA',0x75d8ff);
 let lastPortalAt=0,previousNear={town:false,arena:false};
 const root=new T.Group();root.name='Arena do monstro radioativo';root.position.set(location3d.x,0,location3d.z);sc.add(root);
 const floor=new T.Mesh(new T.CylinderGeometry(12,12,.24,48),new T.MeshLambertMaterial({color:0x31553b,emissive:0x102b18}));floor.position.y=.12;root.add(floor);
 const ring=new T.Mesh(new T.TorusGeometry(11.8,.2,8,52),new T.MeshBasicMaterial({color:0x9bff76}));ring.rotation.x=Math.PI/2;ring.position.y=.35;root.add(ring);
 const mob=new T.Group();root.add(mob);
 const body=new T.Mesh(new T.IcosahedronGeometry(2.9,1),new T.MeshLambertMaterial({color:0x4c9853,emissive:0x175f2b}));body.position.y=3.3;mob.add(body);
 const head=new T.Mesh(new T.IcosahedronGeometry(1.8,1),new T.MeshLambertMaterial({color:0x85d773,emissive:0x327a28}));head.position.y=6;mob.add(head);
 for(const x of [-.72,.72]){const eye=new T.Mesh(new T.SphereGeometry(.31,12,9),new T.MeshBasicMaterial({color:0xfff28a}));eye.position.set(x,6.3,1.45);mob.add(eye)}
 for(let i=0;i<10;i++){const a=i*Math.PI/5;const spine=new T.Mesh(new T.ConeGeometry(.43,1.8,7),new T.MeshLambertMaterial({color:0xa0ff76,emissive:0x337e25}));spine.position.set(Math.cos(a)*2.5,3.6,Math.sin(a)*2.5);spine.rotation.z=-Math.cos(a)*.9;spine.rotation.x=Math.sin(a)*.9;mob.add(spine)}
 const cv=document.createElement('canvas');cv.width=768;cv.height=128;const ctx=cv.getContext('2d');ctx.fillStyle='#122915';ctx.fillRect(0,0,768,128);ctx.strokeStyle='#b4ff77';ctx.lineWidth=8;ctx.strokeRect(5,5,758,118);ctx.fillStyle='white';ctx.font='bold 54px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('MONSTRO RADIOATIVO',384,64);
 const sign=new T.Mesh(new T.PlaneGeometry(13,2.2),new T.MeshBasicMaterial({map:new T.CanvasTexture(cv),side:T.DoubleSide}));sign.position.y=10;root.add(sign);

 // Cenário radioativo, independente do mapa normal.
 const sludge=new T.Group();sludge.name='Galões e gosma verde';root.add(sludge);
 const drumMetal=new T.MeshLambertMaterial({color:0x55665d}),goo=new T.MeshLambertMaterial({color:0x78ef32,emissive:0x2d9b17});
 const spillMat=new T.MeshBasicMaterial({color:0x87fa37,side:T.DoubleSide,transparent:true,opacity:.72,depthWrite:false});
 for(let i=0;i<9;i++){
  const a=i*2*Math.PI/9,rad=16+(i%3)*1.6,x=Math.sin(a)*rad,z=Math.cos(a)*rad;
  const spill=new T.Mesh(new T.CircleGeometry(2.5+(i%3)*.45,20),spillMat);
  spill.rotation.x=-Math.PI/2;spill.position.set(x,.14,z);sludge.add(spill);
  const b=new T.Group();b.position.set(x,.15,z);b.rotation.z=(i%2?-.16:.20);sludge.add(b);
  const shell=new T.Mesh(new T.CylinderGeometry(.8,.8,2,12),drumMetal);shell.position.y=1.25;b.add(shell);
  const top=new T.Mesh(new T.CylinderGeometry(.78,.78,.12,12),goo);top.position.y=2.28;b.add(top);
  const stripe=new T.Mesh(new T.CylinderGeometry(.81,.81,.33,12),goo);stripe.position.y=1.2;b.add(stripe);
  const leak=new T.Mesh(new T.CylinderGeometry(.13,.26,.9,8),goo);leak.position.set(.6,.55,.3);b.add(leak);
 }
 const radiationCanvas=document.createElement('canvas');radiationCanvas.width=radiationCanvas.height=256;
 const rc=radiationCanvas.getContext('2d');rc.fillStyle='#ffe84b';rc.fillRect(0,0,256,256);
 rc.fillStyle='#172a19';rc.font='190px sans-serif';rc.textAlign='center';rc.textBaseline='middle';rc.fillText('☢',128,133);
 const signHazard=new T.Mesh(new T.PlaneGeometry(5,5),new T.MeshBasicMaterial({map:new T.CanvasTexture(radiationCanvas),side:T.DoubleSide}));
 signHazard.position.set(-12,8,-6);root.add(signHazard);
 const blast=new T.Mesh(new T.RingGeometry(8.5,9.6,40),new T.MeshBasicMaterial({color:0xff9944,side:T.DoubleSide,transparent:true,opacity:.8,depthWrite:false}));
 blast.rotation.x=-Math.PI/2;blast.position.y=.42;root.add(blast);blast.visible=false;
 const dash=new T.Mesh(new T.PlaneGeometry(6.5,28),new T.MeshBasicMaterial({color:0xff593a,transparent:true,opacity:.40,side:T.DoubleSide,depthWrite:false}));
 dash.rotation.x=-Math.PI/2;dash.position.y=.41;root.add(dash);dash.visible=false;
 const roar=new Audio('/audio/raid-roar.ogg'),punch=new Audio('/audio/raid-punch.ogg');
 roar.volume=.68;punch.volume=.72;roar.preload=punch.preload='auto';
 const sound=a=>{if(!near())return;try{a.currentTime=0;a.play().catch(()=>{})}catch{}};
 let attackUntil=0,raidHp=300,chargeAnimation=null;
 function attackVisual(m){
  if(!near())return;
  if(m.phase==='warn'){
   attackUntil=m.impactAt-(MP.clockOffset||0)+1100;
   blast.visible=m.kind!=='charge';dash.visible=m.kind==='charge';
   if(m.kind==='charge'){
    const angle=Math.atan2(m.targetX-location3d.x,m.targetZ-location3d.z);
    dash.rotation.z=-angle;dash.position.set(Math.sin(angle)*14,.41,Math.cos(angle)*14);
    sound(roar);toast('☢ CORRIDA SUPREMA! Desvie da linha!');
   }else if(m.kind==='spin'){blast.material.color.setHex(0xda86ff);toast('☢ Giro do monstro! Afaste-se!')}
   else{blast.material.color.setHex(0xff9944);toast('☢ Soco no chão! Fuja da área!')}
  }else{sound(punch);if(m.kind==='spin')mob.rotation.y+=1.4;if(m.kind==='slam')mob.scale.setScalar(1.08);if(m.kind==='charge')chargeAnimation={time:Date.now(),dx:m.dx,dz:m.dz}}
 }
 function tintSky(){if(near()){bg.lerp(new T.Color(0x50ad39),.9);sc.fog.color.copy(bg)}}
 const css=document.createElement('style');css.textContent='#rue-raid-ui{position:fixed;z-index:59;right:calc(9px + env(safe-area-inset-right,0px));bottom:calc(155px + env(safe-area-inset-bottom,0px));padding:10px;width:min(246px,58vw);background:#11291fee;color:white;border:2px solid #b1f778;border-radius:15px;font:700 12px system-ui;display:none;box-shadow:0 4px 18px #0009}#rue-raid-ui strong{font-size:15px}#rue-raid-ui p{margin:7px 0}#rue-raid-ui button{width:100%;min-height:42px;margin-top:7px;padding:8px 5px;border-radius:10px;border:0;background:#abf586;color:#112910;font:900 12px system-ui}#rue-raid-buy{background:#ffcb7d!important}#rue-raid-ui button:disabled{opacity:.5}#rue-raid-life{height:11px;border-radius:6px;background:#3e5039;overflow:hidden}#rue-raid-life span{display:block;height:100%;background:#b6ff86;width:100%}';document.head.appendChild(css);
 const panel=document.createElement('section');panel.id='rue-raid-ui';panel.innerHTML='<strong>☢ BATALHA RADIOATIVA</strong><p id="rue-raid-hp">10.000 / 10.000 HP</p><div id="rue-raid-life"><span></span></div><p id="rue-raid-player-hp">❤️ Sua vida: 300 / 300</p><p id="rue-raid-wallet">🍬 0 doces</p><button id="rue-raid-hit" type="button">☢ ATACAR MONSTRO</button><button id="rue-raid-buy" type="button">🎃 COMPRAR OVO DE HALLOWEEN</button><p>Equipe o bastão radioativo. Ganhe doces na batalha!</p>';document.body.appendChild(panel);
 const hpLine=document.getElementById('rue-raid-hp'),bar=panel.querySelector('span'),walletLine=document.getElementById('rue-raid-wallet'),hit=document.getElementById('rue-raid-hit'),buy=document.getElementById('rue-raid-buy');
 const near=()=>Math.hypot(P.x-location3d.x,P.z-location3d.z)<24;let nextHit=0;
 function updatePortals(){
  const now=Date.now();
  for(const where of ['town','arena']){
   const spot=portals[where],touching=MP.connected&&Math.hypot(P.x-spot.x,P.z-spot.z)<3.3;
   // Só dispara ao ENTRAR na área do portal (evita teleporte em loop).
   if(touching&&!previousNear[where]&&now>=lastPortalAt&&!adminVisible&&!open&&!window.RoubeOvoHatching?.active){
    if(where==='town'&&!state.portalOpen){toast('🔒 Portal bloqueado! Próxima batalha em '+Math.max(1,Math.ceil((state.respawnAt-now-(MP.clockOffset||0))/1000))+'s.');}
    else if(typeof carry!=='undefined'&&carry){toast('🥚 Guarde ou solte o ovo para usar o portal.');}
    else if(!MP.pending){
     mpSend({type:'move',...mpPosition(),training:false});
     if(mpSend({type:'raid-portal',to:where==='town'?'arena':'town'}))lastPortalAt=now+2200;
    }
   }
   previousNear[where]=touching;
  }
  const glow=.74+.18*Math.sin(now/300);
  entrance.center.material.opacity=(state.portalOpen?glow*.42:.09);exit.center.material.opacity=glow*.42;
  entrance.rim.material.color.setHex(state.portalOpen?0x4cf27d:0xff5d5d);
  entrance.rim.rotation.z+=.015;exit.rim.rotation.z-=.015;
 }
 hit.onclick=()=>{if(!MP.connected||!near()||Date.now()<nextHit)return;nextHit=Date.now()+650;mpSend({type:'move',...mpPosition(),training:false});mpSend({type:'raid-hit'})};
 buy.onclick=()=>{if(MP.connected&&near())mpSend({type:'raid-buy',position:mpPosition()})};
 function refresh(){
  const show=MP.connected&&near()&&!adminVisible&&!open;panel.style.display=show?'block':'none';
  hpLine.textContent=state.hp?state.hp.toLocaleString('pt-BR')+' / 10.000 HP':'☢ Próxima batalha em '+Math.max(0,Math.ceil((state.respawnAt-Date.now()-(MP.clockOffset||0))/1000))+' s';
  bar.style.width=100*state.hp/state.maxHp+'%';walletLine.textContent='🍬 '+state.candies+' doces • Ovo: '+state.eggPrice;
  hit.disabled=!show||state.hp<=0||Date.now()<nextHit;buy.disabled=!show||state.candies<state.eggPrice;
  mob.visible=state.hp>0;mob.rotation.y+=.035;mob.position.y=Math.sin(Date.now()/550)*.13;
  if(Date.now()>attackUntil){blast.visible=dash.visible=false;mob.scale.setScalar(1)}
  if(chargeAnimation){const t=(Date.now()-chargeAnimation.time)/450;if(t>=1){chargeAnimation=null;mob.position.x=mob.position.z=0}else{mob.position.x=chargeAnimation.dx*28*t;mob.position.z=chargeAnimation.dz*28*t}}
  const hp=document.getElementById('rue-raid-player-hp');if(hp)hp.textContent='❤️ Sua vida: '+raidHp+' / 300';
  updatePortals();
 }
 setInterval(refresh,120);
 window.RoubeOvoRaid={incoming(m){
  if(m.type==='raid-state'){state.hp=m.hp;state.maxHp=m.maxHp||10000;state.respawnAt=m.respawnAt||0;state.portalOpen=!!m.portalOpen;state.eggPrice=m.eggPrice||80}
  if(['raid-state','raid-reward','raid-purchase'].includes(m.type)){
   if(Number.isSafeInteger(m.candies))state.candies=m.candies;
   if(m.raidWalletToken)try{localStorage.setItem('rue3d_raid_wallet_v1',m.raidWalletToken)}catch{}
  }
  if(m.type==='raid-attack')attackVisual(m);
  if(m.type==='raid-player-hp')raidHp=m.hp;
  if(m.type==='raid-player-hit'){raidHp=m.hp;toast(m.dead?'💀 Você foi derrotado!':'💥 -'+m.damage+' de vida! ('+m.hp+'/300)')}
  if(m.type==='raid-reward')toast('🍬 +'+m.earned+' doces pela vitória!');
  if(m.type==='raid-purchase')toast('🎃 Ovo '+m.rarity+' apareceu perto de você!');
  if(m.type==='raid-error')toast('☢ '+m.message);
 },get candies(){return state.candies},tintSky,refresh};
 refresh();
})();
