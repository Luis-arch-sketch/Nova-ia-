'use strict';
(()=>{
 let players=[],blocked=[],grants=[],lastFetch=0,lastSignature='';
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const button=(action,id,title,kind='secondary')=>`<button type="button" data-admin="moderate:${action}:${escape(id)}" class="${kind}">${title}</button>`;
 const remember=token=>{if(typeof token==='string'){MP.accessBackup=token;try{localStorage.setItem('rue3d_access_backup_v1',token)}catch{}}};
 const request=()=>{if(MP.owner&&MP.connected){lastFetch=Date.now();mpSend({type:'moderation-list'})}};
 function render(){
  if(!MP.owner)return '<p>Somente o dono pode administrar o acesso dos jogadores.</p>';
  if(Date.now()-lastFetch>1500)setTimeout(request,0);
  let html='<h3>👑 Controle do dono</h3><p>Acesso ao painel não dá o selo ADMIN. Somente você pode expulsar jogadores e conceder ou bloquear o painel.</p>'+button('refresh','','🔄 Atualizar jogadores');
  html+='<div class="adGrid">'+players.map(player=>`<section class="adCard"><strong>${escape(player.name)} ${player.owner?'👑 DONO':''}</strong><p>Sala ${escape(player.room)} • ${player.owner?'Dono':player.canAdmin?'Painel autorizado':'Jogador'}</p>${player.owner?'':`<div class="adControls">${button('kick',player.id,'Expulsar','danger')}${button('block',player.id,'🚫 Banir do painel','danger')}${player.canAdmin?button('revoke',player.id,'Retirar acesso'):button('grant',player.id,'Permitir painel')}</div>`}</section>`).join('')+'</div>';
  html+='<h3>🚫 Bloqueados no painel</h3>'+(blocked.length?blocked.map(p=>`<div class="adControls"><span>${escape(p.name)}</span>${button('unblock-offline',p.id,'Remover bloqueio')}</div>`).join(''):'<p>Nenhum jogador bloqueado.</p>');
  const offline=grants.filter(p=>!players.some(u=>u.principal===p.id));
  if(offline.length)html+='<h3>Acessos fora da sala</h3>'+offline.map(p=>`<div class="adControls"><span>${escape(p.name)}</span>${button('block-offline',p.id,'🚫 Banir do painel','danger')}</div>`).join('');
  return html;
 }
 window.RoubeOvoAdmin={render,handle(action){
  if(!MP.owner)return;
  const [,operation,id]=action.split(':');if(operation==='refresh'){request();return}
  const offline=operation.endsWith('-offline'),kind=operation.replace('-offline','');
  mpSend({type:'moderate',action:kind,...(offline?{principal:id}:{id})});
 },incoming(message){
  if(message.type==='moderation-list'){
   const signature=JSON.stringify([message.players,message.blocked,message.grants]);
   const changed=signature!==lastSignature;lastSignature=signature;
   players=message.players||[];blocked=message.blocked||[];grants=message.grants||[];remember(message.backup);
   if(changed&&adminVisible&&adminUnlocked&&adminTab===8)adminUI();
  }else if(message.type==='moderation-result'){
   remember(message.accessBackup);const labels={kick:'expulso',block:'bloqueado no painel',grant:'autorizado no painel',revoke:'sem acesso ao painel',unblock:'desbloqueado'};
   adStatus('✅ '+message.name+': '+(labels[message.action]||'atualizado'));
  }
 }};
 setInterval(()=>{if(MP.owner&&adminVisible&&adminTab===8&&Date.now()-lastFetch>4000)request()},1000);
})();
