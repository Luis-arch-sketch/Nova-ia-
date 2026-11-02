'use strict';
/* Fusão física: risco real 50/50, custo crescente, sem modificar chaves de saves. */
(()=>{
 const rules=window.RoubeOvoFusionRules;if(!rules||window.RoubeOvoFusion)return;
 const $=id=>document.getElementById(id);
 const fmt=n=>typeof fm==='function'?fm(n):Math.round(n).toLocaleString('pt-BR');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const speciesName=s=>SPC[s]?.n||('Ovo '+s);
 const safeSpecies=s=>!!SPC[s]&&s!==LIMITED_ID&&!REMOVED_BIRDS.has(s);
 const count=()=>Number.isSafeInteger(S.fusionCount)&&S.fusionCount>=0?S.fusionCount:0;
 const price=items=>rules.price(Math.max(...items.map(p=>Number(SPC[p.s]?.inc)||1000)),count());
 const petKinds=()=>{const groups=new Map();for(const p of S.pets)if(safeSpecies(p.s))groups.set(p.s,(groups.get(p.s)||0)+1);return [...groups].filter(([,n])=>n>=3)};
 const eggSlots=()=>S.inc.map((e,i)=>e?{...e,i}:null).filter(Boolean);
 let mode='eggs',slots=[],species=-1,working=false,last='';
 const layer=document.createElement('section');layer.id='rue-fusion-panel';layer.hidden=true;layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-label','Máquina de fusão');
 const content=document.createElement('div');content.id='rue-fusion-card';layer.appendChild(content);document.body.appendChild(layer);
 const style=document.createElement('style');
 style.textContent='#rue-fusion-panel[hidden]{display:none!important}#rue-fusion-panel{position:fixed;inset:0;z-index:1720;background:#050817d9;padding:12px;display:flex;align-items:center;justify-content:center;box-sizing:border-box}#rue-fusion-card{width:min(490px,100%);max-height:93dvh;overflow:auto;padding:16px;background:linear-gradient(145deg,#32205d,#101b36);color:white;border:2px solid #c7a0ff;border-radius:17px;font:14px system-ui;box-shadow:0 20px 60px #000b}#rue-fusion-card h2{margin:0 0 8px;color:#f0ddff;font-size:20px}#rue-fusion-card button{min-height:42px;border-radius:10px;padding:8px 12px;margin:2px;border:1px solid #9f9bff;background:#323d74;color:white;font-weight:800}#rue-fusion-card button:disabled{opacity:.45}#rue-fusion-card .chosen{background:#7848b0}#rue-fusion-card .risk{border:1px solid #d6a7ff;background:#111733;padding:10px;border-radius:10px;line-height:1.5;margin:12px 0}#rue-fusion-card .risk b{color:#ffcf8b}#rue-fusion-card input[type=checkbox]{width:22px;height:22px;accent-color:#ae6be4}#rue-fusion-card label{display:flex;gap:9px;align-items:center;padding:8px 0;border-bottom:1px solid #ffffff30}#rue-fusion-card select{width:100%;padding:11px;border-radius:9px;background:#202747;color:white;border:1px solid #b5a7ec}#rue-fusion-card #rue-fuse-go{width:99%;background:#9341b1;font-size:16px}';
 document.head.appendChild(style);
 function close(){layer.hidden=true}
 layer.onclick=e=>{if(e.target===layer)close()};
 function inputs(){
   return mode==='eggs'?slots.length===3&&new Set(slots).size===3?slots.map(i=>S.inc[i]).filter(Boolean):[]
      :S.pets.filter(p=>p.s===species).sort((a,b)=>pinc(a)-pinc(b)).slice(0,3);
 }
 function view(){
  if(mode==='pets'&&!petKinds().some(([id])=>id===species))species=petKinds()[0]?.[0]??-1;
  const current=inputs(),ready=current.length===3&&(mode==='eggs'||S.inc.some(e=>!e)),cost=ready?price(current):0;
  const header='<div style="display:flex;align-items:center;justify-content:space-between"><h2>🧬 MÁQUINA DE FUSÃO</h2><button id="rue-fuse-close">✕</button></div>';
  const tip='<div class="risk"><b>🎲 50% DE SUCESSO • 50% DE PERDER TUDO</b><div>Se ganhar: nasce um ovo melhor ou maior.<br>Se perder: desaparecem os 3 insumos e o dinheiro.<br>Cada tentativa custa 40% a mais que a anterior.</div></div>';
  const modeBtns='<button id="rue-fuse-eggs" class="'+(mode==='eggs'?'chosen':'')+'">🥚 3 ovos</button><button id="rue-fuse-pets" class="'+(mode==='pets'?'chosen':'')+'">🐾 3 animais</button>';
  let choice='';
  if(mode==='eggs'){
   const eggs=eggSlots();choice=eggs.length<3?'<p>Guarde pelo menos três ovos nas incubadoras para usar a máquina.</p>':'<p>Escolha três ovos das incubadoras:</p>'+eggs.map(e=>'<label><input type="checkbox" data-egg="'+e.i+'" '+(slots.includes(e.i)?'checked':'')+' '+(slots.length>=3&&!slots.includes(e.i)?'disabled':'')+'> 🥚 '+esc(speciesName(e.s))+' • '+esc(SZ[e.z]?.[0]||e.z)+'</label>').join('');
  }else{
   const kinds=petKinds();if(!kinds.some(([id])=>id===species))species=kinds[0]?.[0]??-1;
   choice=kinds.length===0?'<p>Você precisa de três animais da mesma espécie.</p>':'<p>Escolha três animais da mesma espécie:</p><select id="rue-fuse-species">'+kinds.map(([id,n])=>'<option value="'+id+'" '+(id===species?'selected':'')+'>'+esc(speciesName(id))+' ('+n+')</option>').join('')+'</select><p>Será preciso uma incubadora livre para receber o ovo da fusão.</p>';
  }
  content.innerHTML=header+tip+modeBtns+choice+'<p><strong>'+(ready?'💰 Custo: $'+fmt(cost):'Escolha os três insumos')+'</strong><br>Seu dinheiro: $'+fmt(S.$)+' • Fusões tentadas: '+count()+'</p>'+(last?'<p class="risk" role="status">'+esc(last)+'</p>':'')+'<button id="rue-fuse-go" '+(working||!ready||S.$<cost?'disabled':'')+'>⚡ CONFIRMAR FUSÃO (50/50)</button>';
  $('rue-fuse-close').onclick=close;
  $('rue-fuse-eggs').onclick=()=>{mode='eggs';last='';view()};
  $('rue-fuse-pets').onclick=()=>{mode='pets';last='';view()};
  for(const chk of content.querySelectorAll('[data-egg]'))chk.onchange=()=>{const i=Number(chk.dataset.egg);slots=chk.checked?[...slots,i]:slots.filter(n=>n!==i);view()};
  if($('rue-fuse-species'))$('rue-fuse-species').onchange=e=>{species=Number(e.target.value);view()};
  $('rue-fuse-go').onclick=attempt;
 }
 function newEgg(b,s,z){
  const now=Date.now(),length=(25+z*20)*1000;
  return {s,z,w:+((1+(SPC[s]?.r||0)*.9)*SZ[z][1]*2).toFixed(1),a:now,b:now+length,initialScale:[.85,1,.85],maxGrowth:20,m:Array.isArray(b?.m)?b.m.slice():[]};
 }
 function attempt(){
  if(working)return false;
  const items=inputs(),current=mode,selected=slots.slice(),chosen=species;
  if(items.length!==3||current==='pets'&&!S.inc.some(x=>!x)){last='⚠ Faltam três insumos ou uma incubadora vazia.';view();return false}
  const cost=price(items);if(S.$<cost){last='⚠ Dinheiro insuficiente.';view();return false}
  if(!window.confirm('Fusão de $'+fmt(cost)+' com 50% de perder os três insumos e o dinheiro. Confirmar?'))return false;
  working=true;
  const draw=new Uint32Array(1);if(crypto?.getRandomValues)crypto.getRandomValues(draw);else draw[0]=Math.floor(Math.random()*4294967296);
  const success=rules.roll(()=>draw[0]/4294967296);
  const award=success?rules.reward(items,safeSpecies):null;
  const snapshot={money:S.$,count:count(),inc:S.inc.slice(),pets:S.pets.slice(),idx:{...S.idx}};
  S.$-=cost;S.fusionCount=count()+1;
  if(current==='eggs'){
    for(const k of selected)S.inc[k]=null;
    if(success){S.inc[selected[0]]=newEgg(items[0],award.s,award.z);S.idx[award.s]=1;}
  }else{
    const ids=new Set(items.map(p=>p.id));S.pets=S.pets.filter(p=>!ids.has(p.id));
    if(success){const open=S.inc.findIndex(e=>!e);S.inc[open]=newEgg(items[0],award.s,award.z);S.idx[award.s]=1;}
  }
  recalc();
  if(!save()){
    S.$=snapshot.money;S.fusionCount=snapshot.count;S.inc=snapshot.inc;S.pets=snapshot.pets;S.idx=snapshot.idx;recalc();
    last='⚠ Problema ao salvar: a fusão foi cancelada e seus itens foram restaurados.';working=false;view();return false;
  }
  last=success?'🎉 SUCESSO! Ovo '+speciesName(award.s)+' de tamanho '+(SZ[award.z]?.[0]||award.z)+' na incubadora!':'💥 FALHOU! Três insumos e $'+fmt(cost)+' perdidos.';
  toast(last);beep(success?950:170,.26,success?'triangle':'sawtooth');upHud();
  if(typeof MP!=='undefined'&&MP.connected&&typeof mpSend==='function')mpSend({type:'stats',money:S.$,speed:S.sp,base:mpBaseState(),avatar:window.RoubeOvoAvatar?.current()});
  working=false;slots=[];view();return success;
 }
 function open(){if(window.RoubeOvoHatching?.active)return;mode='eggs';slots=[];last='';layer.hidden=false;view()}
 function pets(s){mode='pets';species=Number(s);slots=[];last='';layer.hidden=false;view()}
 window.RoubeOvoFusion={open,close,fusePets:pets,attempt,get count(){return count()},get active(){return !layer.hidden}};
})();
