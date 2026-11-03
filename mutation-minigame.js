'use strict';
/* Evento: UM minigame repetivel. Cada vitoria rende uma mutacao no inventario.
   Adiciona dados ao save existente sem alterar outros sistemas do jogo. */
(()=>{
 if(window.RoubeOvoMiniMutation)return;
 const $=id=>document.getElementById(id);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
 const names=()=>typeof MUT!=='undefined'?MUT:[];
 const bag=()=>{
  if(!Array.isArray(S.miniMutationBag))S.miniMutationBag=[];
  S.miniMutationBag=S.miniMutationBag.filter(n=>Number.isInteger(n)&&names()[n]);
  return S.miniMutationBag;
 };
 const wins=()=>Math.max(0,Number.isSafeInteger(S.miniMutationWins)?S.miniMutationWins:0);
 let round=false,score=0,deadline=0,timer=null,view='home';
 const style=document.createElement('style');
 style.textContent=
 '#rue-mini-launch{position:fixed;right:calc(8px + env(safe-area-inset-right,0px));top:46%;z-index:52;padding:9px 12px;background:linear-gradient(130deg,#ffdc63,#ef74e5);border:2px solid #fff;color:#23103d;box-shadow:0 4px 20px #0007;border-radius:15px;font:900 12px system-ui;max-width:113px;line-height:1.2;display:none}' +
 '#rue-mini-cover[hidden]{display:none!important}#rue-mini-cover{position:fixed;inset:0;z-index:1725;display:flex;align-items:center;justify-content:center;background:#050b1ddd;padding:12px;box-sizing:border-box;touch-action:pan-y}' +
 '#rue-mini-card{width:min(450px,100%);max-height:92dvh;overflow:auto;touch-action:pan-y;box-sizing:border-box;background:linear-gradient(150deg,#362064,#0e2848 70%);border:2px solid #ffdc77;border-radius:20px;padding:16px;color:#fff;font:600 14px system-ui;box-shadow:0 15px 60px #000b}' +
 '#rue-mini-card h2{font-size:20px;color:#ffe383;margin:0 0 9px}#rue-mini-card p{line-height:1.5;margin:8px 0;color:#e4dcff}' +
 '#rue-mini-card button{min-height:43px;background:#ffe080;color:#271c44;border-radius:12px;font-weight:850;margin:4px 4px 4px 0}' +
 '#rue-mini-card button.alt{background:#4e4389;color:white;border:1px solid #b7aaff}' +
 '#rue-mini-card button:disabled{opacity:.5}#rue-mini-card select{width:100%;box-sizing:border-box;padding:11px;background:#181b42;color:white;border:1px solid #ad9ce3;border-radius:10px;font:600 14px system-ui;margin:5px 0 12px;touch-action:auto}' +
 '#rue-mini-card label{display:block;margin-top:8px;color:#fff0b0}' +
 '#rue-mini-arena{position:relative;height:245px;border-radius:17px;background:radial-gradient(ellipse,#4b7b5b,#214959);border:3px solid #92d8ad;overflow:hidden;touch-action:manipulation;margin:13px 0}' +
 '#rue-mini-target{position:absolute;width:88px;height:88px;border-radius:48%;padding:0;background:radial-gradient(circle at 37% 28%,#fffbd5,#ffd700 54%,#d88408);color:#563212;font-size:39px;border:4px solid #fff9bb;box-shadow:0 0 18px #fff3a9,0 5px 14px #0007;transform:translate(-50%,-50%);touch-action:manipulation}' +
 '#rue-mini-progress{font-size:16px;font-weight:900;color:#fff3a3}';
 document.head.appendChild(style);
 const launch=document.createElement('button');launch.id='rue-mini-launch';launch.type='button';launch.textContent='🥚 EVENTO DE MUTAÇÕES';launch.setAttribute('aria-label','Abrir o minigame de mutações');document.body.appendChild(launch);
 const cover=document.createElement('div');cover.id='rue-mini-cover';cover.hidden=true;
 cover.innerHTML='<section id="rue-mini-card" role="dialog" aria-modal="true" aria-label="Evento de mutações"></section>';
 document.body.appendChild(cover);
 const card=$('rue-mini-card');
 const header=()=>'<div style="display:flex;align-items:center;justify-content:space-between;gap:5px"><h2>🥚 Desafio do Ovo Dourado</h2><button type="button" id="rue-mini-close" class="alt" aria-label="Fechar">✕</button></div>';
 const stop=()=>{if(timer!==null)clearInterval(timer);timer=null;round=false};
 function home(message=''){
  stop();view='home';const prizes=bag().length;
  card.innerHTML=header()+'<p>🎉 <b>UM minigame, quantas vezes quiser!</b> Toque no ovo dourado <b>3 vezes em 15 segundos</b>. Cada vitória dá <b>+1 mutação</b> para guardar ou aplicar nos seus ovos e animais.</p>'+
  '<p id="rue-mini-progress">🏆 Vitórias: '+wins()+' · 🎁 Mutações guardadas: '+prizes+'</p>'+
  (message?'<p style="color:#a9ffca">'+esc(message)+'</p>':'')+
  '<button type="button" id="rue-mini-play">▶️ JOGAR AGORA</button>'+
  '<button type="button" id="rue-mini-prizes" class="alt">🧬 Usar mutações ('+prizes+')</button>';
  $('rue-mini-play').onclick=start;
  $('rue-mini-prizes').onclick=()=>{stop();cover.hidden=true;window.RoubeOvoOpenShop?.(5)};
  wireClose();
 }
 function wireClose(){$('rue-mini-close').onclick=()=>{stop();cover.hidden=true}};
 function moveEgg(){
  const egg=$('rue-mini-target');if(!egg)return;
  egg.style.left=(22+Math.random()*56)+'%';
  egg.style.top=(28+Math.random()*43)+'%';
 }
 function start(){
  stop();round=true;view='play';score=0;deadline=Date.now()+15000;
  card.innerHTML=header()+'<p>Toque no ovo dourado 3 vezes para ganhar uma mutação! ✨</p>'+
   '<div id="rue-mini-progress">🥚 0/3 · ⏳ 15s</div><div id="rue-mini-arena"><button type="button" id="rue-mini-target" aria-label="Tocar no ovo dourado">🥚</button></div>'+
   '<button type="button" class="alt" id="rue-mini-back">Sair do desafio</button>';
  wireClose();$('rue-mini-back').onclick=()=>home();
  moveEgg();
  const update=()=>{if(!round)return;const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));$('rue-mini-progress').textContent='🥚 '+score+'/3 · ⏳ '+left+'s';if(left===0)home('⏱️ O tempo acabou! Pode tentar novamente.')};
  $('rue-mini-target').onclick=e=>{
   e.preventDefault();e.stopPropagation();
   if(!round||Date.now()>deadline){home('⏱️ Acabou o tempo. Tente mais uma vez!');return}
   score++;if(typeof beep==='function')beep(620+score*160,.1,'sine',.035);
   if(score===3){win();return}moveEgg();update();
  };
  timer=setInterval(update,120);
 }
 function win(){
  stop();
  const before=bag().slice(),oldWins=wins();
  const mutation=Math.floor(Math.random()*names().length);
  S.miniMutationBag.push(mutation);S.miniMutationWins=oldWins+1;
  if(typeof save==='function'&&!save()){
   S.miniMutationBag=before;S.miniMutationWins=oldWins;
   home('⚠ Erro ao salvar o prêmio. Libere espaço no aparelho e tente novamente.');return;
  }
  if(typeof beep==='function')beep(1020,.28,'triangle',.05);
  home('🎉 +1 mutação '+names()[mutation][0]+'! Jogue novamente para ganhar mais!');
 }

 // As mutacoes sao itens do inventario comum, em vez de uma loja separada.
 const equipped=()=>{
  const i=S.miniMutationEquipIndex;
  return Number.isInteger(i)&&i>=0&&i<bag().length&&names()[bag()[i]]?{index:i,mutation:bag()[i]}:null;
 };
 function inventoryHtml(){
  const b=bag(),active=equipped();
  return '<section class="rue-mini-bag" style="border:1px solid #a780ef;border-radius:13px;padding:10px;margin-top:12px;background:#42296d22">'+
   '<strong>🧬 Mutações ('+b.length+')</strong>'+
   (b.length?b.map((n,i)=>'<div class="r" style="gap:10px"><span>'+esc(names()[n][0])+' x'+names()[n][1]+
   '</span><button type="button" data-a="mut-equip:'+i+'" style="background:'+(active?.index===i?'#8eeac5':'#ffdb83')+'">'+
   (active?.index===i?'✅ Equipada':'Equipar')+'</button></div>').join(''):'<p>Seu inventário de mutações está vazio.</p>')+
   (active?'<button type="button" data-a="mut-off" style="background:#bacaf0">Desequipar</button>':'')+'</section>';
 }
 function handleInventory(action){
  if(action==='mut-off'){S.miniMutationEquipIndex=-1;save();return true;}
  if(!action.startsWith('mut-equip:'))return false;
  const index=Number(action.slice('mut-equip:'.length));
  if(!Number.isInteger(index)||!names()[bag()[index]])return true;
  S.miniMutationEquipIndex=equipped()?.index===index?-1:index;
  save();return true;
 }
 // O botao aparece apenas na proximidade de um ovo e com mutacao equipada.
 const applyButton=document.createElement('button');
 applyButton.type='button';applyButton.id='rue-mini-world-apply';applyButton.hidden=true;
 applyButton.style.cssText='position:fixed;bottom:calc(15px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);z-index:61;background:linear-gradient(110deg,#7e4ac5,#ffcf6f);border:2px solid #fff5cb;color:white;text-shadow:0 1px 3px #241335;font:900 13px system-ui;padding:12px 17px;max-width:55vw;border-radius:16px;box-shadow:0 7px 22px #0009;white-space:nowrap;touch-action:manipulation';
 document.body.appendChild(applyButton);
 let pending=null;
 function nearest(){
  const active=equipped();
  if(!active||typeof P==='undefined'||typeof eggs==='undefined'||typeof carry!=='undefined'&&carry)return null;
  let closest=null,range=5;
  for(const egg of eggs){
   if(!egg?.mesh||egg.gr<1||(typeof MP!=='undefined'&&MP.connected&&!egg.netId))continue;
   if(Array.isArray(egg.m)&&egg.m.includes(active.mutation))continue;
   const distance=Math.hypot(P.x-egg.mesh.position.x,P.z-egg.mesh.position.z);
   if(distance<range){range=distance;closest=egg;}
  }
  return closest;
 }
 function updateApplyButton(){
  const hidden=!!pending||!cover.hidden||$('roube-capa')!==null||
    $('pn')?.style.display==='block'||$('adWrap')?.style.display==='flex'||
    window.RoubeOvoHatching?.active;
  const egg=!hidden?nearest():null,active=equipped();
  applyButton.hidden=!egg||!active;
  if(egg&&active){
   applyButton.textContent='🧬 Aplicar '+names()[active.mutation][0];
   applyButton.dataset.egg=egg.netId||'';
  }
 }
 const consume=(index,mutation)=>{
  if(bag()[index]!==mutation)return false;
  const before=bag().slice(),old=S.miniMutationEquipIndex;
  S.miniMutationBag.splice(index,1);S.miniMutationEquipIndex=-1;
  if(!save()){S.miniMutationBag=before;S.miniMutationEquipIndex=old;return false}
  if(typeof beep==='function')beep(940,.16,'triangle',.045);
  if($('pn')?.style.display==='block'&&typeof ui==='function')ui();
  return true;
 };
 applyButton.onclick=()=>{
  if(pending)return;
  const item=equipped(),egg=nearest();if(!item||!egg)return;
  const mutation=item.mutation,index=item.index;
  if(typeof MP!=='undefined'&&MP.connected){
   if(!egg.netId||typeof mpSend!=='function'||typeof mpPosition!=='function')return;
   const requestId=crypto.randomUUID?.()||('mut-'+Date.now()+'-'+Math.random().toString(36).slice(2));
   pending={requestId,index,mutation,id:egg.netId};
   if(!mpSend({type:'egg-mutate',id:egg.netId,mutation,requestId,position:mpPosition()})){pending=null;return}
   setTimeout(()=>{if(pending?.requestId===requestId){pending=null;updateApplyButton()}},7000);
  }else{
   const old=Array.isArray(egg.m)?egg.m.slice():[];
   egg.m=[...old,mutation];
   if(!consume(index,mutation)){egg.m=old;return}
   if(typeof eggMutationMark==='function')eggMutationMark(egg.mesh,egg.m);
  }
  updateApplyButton();
 };
 addEventListener('roube-egg-mutate-result',e=>{
  const msg=e.detail;
  if(!pending||msg?.requestId!==pending.requestId)return;
  const p=pending;pending=null;
  if(msg.ok&&msg.id===p.id&&msg.mutation===p.mutation)consume(p.index,p.mutation);
  updateApplyButton();
 });
 setInterval(updateApplyButton,200);
 launch.onclick=()=>{if(window.RoubeOvoHatching?.active)return;cover.hidden=false;home()};
 cover.addEventListener('pointerdown',e=>{if(e.target===cover){stop();cover.hidden=true}});
 addEventListener('roube-start-game',()=>{launch.style.display='block'});
 addEventListener('DOMContentLoaded',()=>setTimeout(()=>{if(!$('roube-capa'))launch.style.display='block'},700));
 window.RoubeOvoMiniMutation={open:()=>launch.click(),inventoryHtml,handleInventory,getWins:wins,getStored:()=>bag().length};
})();
