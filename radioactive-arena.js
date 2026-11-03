'use strict';
// Arena de evento separada do novo bioma. Apenas renderiza o estado validado pelo servidor.
(()=>{
 if(window.RoubeOvoRaid)return;
 const T=THREE,location3d={x:0,z:-300},state={hp:10000,maxHp:10000,respawnAt:0,candies:0,eggPrice:80};
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
 hit.onclick=()=>{if(!MP.connected||!near()||Date.now()<nextHit)return;nextHit=Date.now()+650;mpSend({type:'move',...mpPosition(),training:false});mpSend({type:'raid-hit'})};
 buy.onclick=()=>{if(MP.connected&&near())mpSend({type:'raid-buy',position:mpPosition()})};
 function refresh(){
  const show=MP.connected&&near()&&!adminVisible&&!open;panel.style.display=show?'block':'none';
  hpLine.textContent=state.hp?state.hp.toLocaleString('pt-BR')+' / 10.000 HP':'Regenerando em '+Math.max(0,Math.ceil((state.respawnAt-Date.now()-(MP.clockOffset||0))/1000))+' s';
  bar.style.width=100*state.hp/state.maxHp+'%';walletLine.textContent='🍬 '+state.candies+' doces • Ovo: '+state.eggPrice;
  hit.disabled=!show||state.hp<=0||Date.now()<nextHit;buy.disabled=!show||state.candies<state.eggPrice;
  mob.visible=state.hp>0;mob.rotation.y+=.035;mob.position.y=Math.sin(Date.now()/550)*.13;
 }
 setInterval(refresh,120);
 window.RoubeOvoRaid={incoming(m){
  if(m.type==='raid-state'){state.hp=m.hp;state.maxHp=m.maxHp||10000;state.respawnAt=m.respawnAt||0;state.eggPrice=m.eggPrice||80}
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
