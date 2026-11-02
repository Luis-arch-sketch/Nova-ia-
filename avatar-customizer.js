
'use strict';
// Personalização independente: preserva dinheiro, pets, velocidade e incubadoras.
(()=>{
 const KEY='rue3d_avatar_v1';
 const choices={
  kind:[['boy','👦 Menino'],['girl','👧 Menina']],
  hair:[['short','Curto'],['long','Comprido'],['curly','Cacheado'],['ponytail','Rabo de cavalo']],
  color:[['black','Preto'],['brown','Castanho'],['blonde','Loiro'],['pink','Rosa'],['blue','Azul']],
  outfit:[['blue','Azul'],['red','Vermelho'],['green','Verde'],['purple','Roxo']],
  accessory:[['none','Sem acessório'],['cap','🧢 Boné'],['glasses','🕶 Óculos'],['headphones','🎧 Fones']]
 };
 const defaults={kind:'boy',hair:'short',color:'black',outfit:'blue',accessory:'none'};
 const safe=(v)=>{const a={};for(const k of Object.keys(defaults))a[k]=choices[k].some(p=>p[0]===v?.[k])?v[k]:defaults[k];return a;};
 let current=defaults;try{current=safe(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){}
 const COLORS={black:0x22202a,brown:0x663c27,blonde:0xe9bd63,pink:0xff7cba,blue:0x54aaf5};
 const CLOTHES={blue:0x3576d9,red:0xd64f50,green:0x37a17b,purple:0x8659cb};
 const make=(parent,geometry,color,px,py,pz,sx=1,sy=1,sz=1)=>{
  const o=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color}));
  o.position.set(px,py,pz);o.scale.set(sx,sy,sz);o.castShadow=true;parent.add(o);return o;
 };
 const geometry={
  ball:new THREE.SphereGeometry(1,12,9),
  box:new THREE.BoxGeometry(1,1,1),
  cylinder:new THREE.CylinderGeometry(1,1,1,12),
  cone:new THREE.CylinderGeometry(.65,1,1,12),
  ring:new THREE.TorusGeometry(1,.08,7,18)
 };
 const clean=(grp)=>{
  const old=grp.getObjectByName('roube-avatar-details');
  if(!old)return;
  old.traverse(o=>{if(o.isMesh){o.material?.dispose();}});
  grp.remove(old);
 };
 function applyTo(group,appearance){
  if(!group||!group.add)return;
  const p=safe(appearance),signature=JSON.stringify(p);
  if(group.userData.roubeAvatarSignature===signature)return;
  clean(group);
  const root=new THREE.Group();root.name='roube-avatar-details';root.userData.signature=signature;group.add(root);
  const hair=COLORS[p.color],cloth=CLOTHES[p.outfit];
  // Jaqueta e acessórios originais continuam no rig, mas o novo traje cobre o torso.
  make(root,geometry.cylinder,cloth,0,1.48,0,.52,.94,.40);
  make(root,geometry.box,0xf3daaa,0,1.94,.29,.20,.12,.08);
  if(p.kind==='girl'){
   make(root,geometry.cone,cloth,0,.88,0,.57,.55,.52);
   make(root,geometry.box,0xf6eef7,0,1.70,.405,.28,.07,.04);
  }else{
   make(root,geometry.box,0x1a2945,0,1.05,.36,.82,.08,.46);
   make(root,geometry.box,0xf4b85e,0,1.72,.405,.13,.065,.035);
  }
  // O cabelo cobre o cabelo padrão, sem excluir nenhum osso ou animação.
  make(root,geometry.ball,hair,0,2.55,-.03,.43,.25,.42);
  if(p.hair==='short'){
   for(const x of [-.23,0,.23])make(root,geometry.ball,hair,x,2.52,.30,.17,.17,.16);
  }else if(p.hair==='long'){
   for(const x of [-.34,.34])make(root,geometry.ball,hair,x,2.17,-.08,.17,.50,.29);
   make(root,geometry.ball,hair,0,2.29,-.31,.35,.52,.16);
  }else if(p.hair==='curly'){
   for(let i=0;i<11;i++){const a=i*2.4;make(root,geometry.ball,hair,Math.sin(a)*.36,2.57+Math.cos(a*1.7)*.14,Math.cos(a)*.27,.20,.21,.19);}
  }else{
   make(root,geometry.ball,hair,0,2.37,-.43,.22,.20,.24);
   make(root,geometry.ball,hair,0,2.14,-.51,.16,.31,.18);
   for(const x of [-.17,.17])make(root,geometry.ball,hair,x,2.53,.26,.15,.19,.14);
  }
  if(p.accessory==='cap'){
   make(root,geometry.ball,0x212e66,0,2.67,-.02,.46,.23,.44);
   make(root,geometry.box,0x212e66,0,2.57,.42,.55,.075,.30);
  }else if(p.accessory==='glasses'){
   for(const x of [-.17,.17]){
    const lens=make(root,geometry.ring,0x1a1d28,x,2.28,.394,.155,.145,1);
    lens.rotation.z=.06;
    make(root,geometry.ball,0x384c69,x,2.28,.405,.105,.105,.025);
   }
   make(root,geometry.box,0x101721,0,2.29,.40,.15,.045,.04);
  }else if(p.accessory==='headphones'){
   const band=make(root,geometry.ring,0x222d43,0,2.60,0,.47,.48,1);band.rotation.x=Math.PI/2;
   for(const x of [-.44,.44])make(root,geometry.box,0x43b9df,x,2.32,0,.14,.35,.27);
  }
  group.userData.roubeAvatarSignature=signature;
 }
 const api={
  current:()=>({...current}),
  syncRemote:(group,appearance)=>applyTo(group,appearance||defaults)
 };
 window.RoubeOvoAvatar=api;
 try{applyTo(P.g,current);}catch(e){console.warn('Avatar aguardando mundo 3D',e);}
 const style=document.createElement('style');
 style.textContent=`
 #avatarOpen{position:fixed;top:calc(51px + env(safe-area-inset-top,0px));right:calc(10px + env(safe-area-inset-right,0px));z-index:40;background:#ffdd83;color:#242641;font-weight:900;padding:7px 12px;min-height:35px;border-radius:12px;box-shadow:0 2px 7px #0004}
 #avatarPanel{display:none;position:fixed;inset:0;z-index:140;background:#071425bd;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;touch-action:pan-y}
 #avatarPanel.open{display:flex}
 #avatarSheet{background:#182c47;color:#fff;border:2px solid #f3ce7b;box-shadow:0 15px 45px #0009;border-radius:16px;width:min(510px,100%);max-height:94dvh;overflow-y:auto;padding:14px 14px 18px;box-sizing:border-box;touch-action:pan-y}
 #avatarSheet h2{font-size:19px;margin:0;color:#ffdc8b}
 #avatarSheet .avatarTop{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}
 #avatarSheet label{display:block;font-weight:900;margin:10px 0 6px;color:#dceaff;font-size:13px}
 #avatarSheet .avatarOptions{display:flex;flex-wrap:wrap;gap:6px}
 #avatarSheet .avatarOptions button{background:#2c4565;color:#fff;min-height:38px;min-width:70px;border:1px solid #6583a5;font-size:13px;padding:8px 11px}
 #avatarSheet .avatarOptions button.selected{background:#ffd361;color:#22283a;border:2px solid #fff}
 #avatarSheet .avatarClose{background:#9f3e5c;color:#fff;min-width:43px}
 #horizontalButton{position:fixed;bottom:calc(9px + env(safe-area-inset-bottom,0px));right:calc(10px + env(safe-area-inset-right,0px));z-index:52;background:#ffdd83;color:#1a2b37;min-height:34px;display:none;font-size:12px}
 @media(orientation:portrait) and (pointer:coarse){#horizontalButton{display:block}}
 @media(max-width:700px) and (orientation:landscape){
  #avatarOpen{top:calc(8px + env(safe-area-inset-top,0px));right:calc(380px + env(safe-area-inset-right,0px));font-size:11px;padding:5px 8px;min-height:30px}
  #avatarSheet{max-height:90dvh}#avatarSheet .avatarOptions button{min-height:33px}
 }
 `;
 document.head.appendChild(style);
 const button=document.createElement('button');button.type='button';button.id='avatarOpen';button.textContent='👕 Personagem';document.body.appendChild(button);
 const panel=document.createElement('div');panel.id='avatarPanel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Personalizar personagem');
 const sheet=document.createElement('div');sheet.id='avatarSheet';panel.appendChild(sheet);document.body.appendChild(panel);
 const labels={kind:'Skin',hair:'Cabelo',color:'Cor do cabelo',outfit:'Roupa',accessory:'Acessórios'};
 function draw(){
  sheet.replaceChildren();
  const top=document.createElement('div');top.className='avatarTop';
  const title=document.createElement('h2');title.textContent='👕 Personalizar personagem';
  const close=document.createElement('button');close.type='button';close.textContent='✕';close.className='avatarClose';close.addEventListener('click',()=>panel.classList.remove('open'));
  top.append(title,close);sheet.appendChild(top);
  for(const [key,values] of Object.entries(choices)){
   const label=document.createElement('label');label.textContent=labels[key];sheet.appendChild(label);
   const row=document.createElement('div');row.className='avatarOptions';
   for(const [id,name] of values){
    const b=document.createElement('button');b.type='button';b.textContent=name;
    if(current[key]===id)b.classList.add('selected');
    b.addEventListener('click',()=>{
     current=safe({...current,[key]:id});
     try{localStorage.setItem(KEY,JSON.stringify(current))}catch(e){}
     applyTo(P.g,current);draw();
     if(typeof MP!=='undefined'&&MP.connected&&typeof mpSend==='function'&&typeof mpBaseState==='function'){
      mpSend({type:'stats',money:S.$,speed:S.sp,base:mpBaseState(),avatar:api.current()});
     }
    });row.appendChild(b);
   }sheet.appendChild(row);
  }
 }
 button.addEventListener('click',()=>{draw();panel.classList.add('open')});
 panel.addEventListener('click',e=>{if(e.target===panel)panel.classList.remove('open')});
 const horiz=document.createElement('button');horiz.id='horizontalButton';horiz.type='button';horiz.textContent='↔ Horizontal';
 const lock=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();await screen.orientation?.lock?.('landscape')}catch(e){try{await screen.orientation?.lock?.('landscape')}catch(x){}}};
 horiz.addEventListener('click',lock);document.body.appendChild(horiz);
})();
