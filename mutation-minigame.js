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
  $('rue-mini-prizes').onclick=inventory;
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
 function inventory(message=''){
  stop();view='inventory';
  const b=bag(),targets=[];
  S.inc.forEach((e,i)=>{if(e)targets.push({value:'egg:'+i,label:'🥚 Incubadora '+(i+1)+' · '+(SPC[e.s]?.n||'Ovo'),ref:e})});
  S.pets.forEach((p,i)=>{if(p)targets.push({value:'pet:'+i,label:'🐾 '+(SPC[p.s]?.n||'Animal')+' #'+(i+1),ref:p})});
  const opts=b.map((n,i)=>'<option value="'+i+'">'+esc(names()[n][0])+' x'+names()[n][1]+'</option>').join('');
  const targetOpts=targets.map(t=>'<option value="'+t.value+'">'+esc(t.label)+'</option>').join('');
  card.innerHTML=header()+
   '<p>🎁 <b>'+b.length+' mutações guardadas</b> · 🏆 '+wins()+' vitórias. Cada nova vitória acrescenta outra mutação ao seu inventário!</p>'+
   (message?'<p style="color:#a9ffca">'+esc(message)+'</p>':'')+
   (b.length?'<label>Qual mutação usar?</label><select id="rue-mini-mutation">'+opts+'</select>':'<p>Jogue para conseguir sua primeira mutação!</p>')+
   (targets.length?'<label>Aplicar em qual ovo ou animal?</label><select id="rue-mini-target-select">'+targetOpts+'</select>':'<p>Pegue um ovo e coloque na incubadora, ou choque um animal, para aplicar suas mutações.</p>')+
   (b.length&&targets.length?'<button id="rue-mini-apply" type="button">🧬 APLICAR MUTAÇÃO</button>':'')+
   '<button id="rue-mini-again" class="alt" type="button">▶️ Jogar de novo</button>';
  wireClose();$('rue-mini-again').onclick=start;
  if($('rue-mini-apply'))$('rue-mini-apply').onclick=()=>{
   const bagIndex=Number($('rue-mini-mutation').value),target= $('rue-mini-target-select').value;
   const tok=S.miniMutationBag[bagIndex],entry=targets.find(t=>t.value===target);
   if(!entry||!Number.isInteger(tok)||!names()[tok]){inventory('⚠ Escolha uma mutação e um ovo ou animal.');return}
   const current=Array.isArray(entry.ref.m)?entry.ref.m:[];
   if(current.includes(tok)){inventory('💡 Esse ovo ou animal já tem '+names()[tok][0]+'. Escolha outra mutação ou outro alvo.');return}
   const previous=current.slice(),prevBag=bag().slice();
   entry.ref.m=[...current,tok];
   S.miniMutationBag.splice(bagIndex,1);
   if(typeof save==='function'&&!save()){
    entry.ref.m=previous;S.miniMutationBag=prevBag;inventory('⚠ Falha ao salvar. Seu prêmio foi mantido.');return;
   }
   if(typeof recalc==='function')recalc();
   if(typeof upHud==='function')upHud();
   if(typeof MP!=='undefined'&&MP.connected&&typeof mpSend==='function'&&typeof mpBaseState==='function')mpSend({type:'stats',money:S.$,speed:S.sp,base:mpBaseState(),avatar:window.RoubeOvoAvatar?.current()});
   if(typeof toast==='function')toast('🧬 '+names()[tok][0]+' aplicada!');
   inventory('✅ '+names()[tok][0]+' aplicada com sucesso!');
  };
 }
 launch.onclick=()=>{if(window.RoubeOvoHatching?.active)return;cover.hidden=false;home()};
 cover.addEventListener('pointerdown',e=>{if(e.target===cover){stop();cover.hidden=true}});
 addEventListener('roube-start-game',()=>{launch.style.display='block'});
 addEventListener('DOMContentLoaded',()=>setTimeout(()=>{if(!$('roube-capa'))launch.style.display='block'},700));
 window.RoubeOvoMiniMutation={open:()=>launch.click(),getWins:wins,getStored:()=>bag().length};
})();
