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
 const css=document.createElement('style');css.textContent='#rue-raid-ui{position:fixed;z-index:59;right:calc(9px + env(safe-area-inset-right,0px));bottom:calc(155px + env(safe-area-inset-bottom,0px));padding:10px;width:min(246px,58vw);background:#11291fee;color:white;border:2px solid #b1f778;border-radius:15px;font:700 12px system-ui;display:none;box-shadow:0 4px 18px #0009}#rue-raid-ui strong{font-size:15px}#rue-raid-ui p{margin:7px 0}#rue-raid-ui button{width:100%;min-height:42px;margin-top:7px;padding:8px 5px;border-radius:10px;border:0;background:#abf586;color:#112910;font:900 12px system-ui}#rue-raid-buy{background:#ffcb7d!important}#rue-raid-ui button:disabled{opacity:.5}#rue-raid-life{height:11px;border-radius:6px;background:#3e5039;overflow:hidden}#rue-raid-life span{display:block;height:100%;background:#b6ff86;width:100%}';document.head.appendChild(css);
 const panel=document.createElement('section');panel.id='rue-raid-ui';panel.innerHTML='<strong>☢ BATALHA RADIOATIVA</strong><p id="rue-raid-hp">10.000 / 10.000 HP</p><div id="rue-raid-life"><span></span></div><p id="rue-raid-wallet">🍬 0 doces</p><button id="rue-raid-hit" type="button">☢ ATACAR MONSTRO</button><button id="rue-raid-buy" type="button">🎃 COMPRAR OVO DE HALLOWEEN</button><p>Equipe o bastão radioativo. Ganhe doces na batalha!</p>';document.body.appendChild(panel);
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
  updatePortals();
 }
 setInterval(refresh,120);
 window.RoubeOvoRaid={incoming(m){
  if(m.type==='raid-state'){state.hp=m.hp;state.maxHp=m.maxHp||10000;state.respawnAt=m.respawnAt||0;state.portalOpen=!!m.portalOpen;state.eggPrice=m.eggPrice||80}
  if(['raid-state','raid-reward','raid-purchase'].includes(m.type)){
   if(Number.isSafeInteger(m.candies))state.candies=m.candies;
   if(m.raidWalletToken)try{localStorage.setItem('rue3d_raid_wallet_v1',m.raidWalletToken)}catch{}
  }
  if(m.type==='raid-reward')toast('🍬 +'+m.earned+' doces pela vitória!');
  if(m.type==='raid-purchase')toast('🎃 Ovo '+m.rarity+' apareceu perto de você!');
  if(m.type==='raid-error')toast('☢ '+m.message);
 },get candies(){return state.candies},refresh};
 refresh();
})();
