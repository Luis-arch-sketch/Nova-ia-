'use strict';
/* Trailer da Zona Radioativa: interface isolada, sem tocar no estado do jogador. */
(()=>{
 if(document.getElementById('rue-radio-cutscene'))return;
 const style=document.createElement('style');
 style.textContent=`
 #rue-radio-cutscene[hidden]{display:none!important}
 #rue-radio-cutscene{position:fixed;inset:0;z-index:2001;display:flex;flex-direction:column;background:#040b07;color:#dfffca;touch-action:auto;font:700 14px system-ui,sans-serif}
 #rue-radio-cutscene .rue-radio-bar{flex-shrink:0;display:flex;gap:10px;align-items:center;justify-content:space-between;padding:calc(6px + env(safe-area-inset-top,0px)) calc(10px + env(safe-area-inset-right,0px)) 6px calc(10px + env(safe-area-inset-left,0px));background:#0d2112;border-bottom:1px solid #456b39}
 #rue-radio-cutscene .rue-radio-bar strong{font-size:clamp(12px,2.8vw,17px);color:#c9ff8b}
 #rue-radio-cutscene button{font:800 14px system-ui,sans-serif;color:#172009;background:#baff6e;border:0;border-radius:10px;padding:10px 12px;white-space:nowrap;min-height:42px}
 #rue-radio-cutscene iframe{width:100%;height:100%;min-height:0;flex:1;border:0;display:block;background:#030a03}
 #rue-radio-open{min-width:36px;white-space:nowrap;flex-shrink:0;background:#b5ff67!important;color:#102405!important}
 #roube-capa #roube-radio-preview{background:#c8ff6a;color:#152d0e}
 @media(max-width:600px){#rue-radio-cutscene .rue-radio-bar{padding-top:calc(4px + env(safe-area-inset-top,0px))}#rue-radio-cutscene .rue-radio-bar strong{font-size:12px}#rue-radio-open{padding:7px 9px}}
 `;
 document.head.appendChild(style);
 const overlay=document.createElement('section');
 overlay.id='rue-radio-cutscene';overlay.hidden=true;
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
 overlay.setAttribute('aria-label','Cutscene Zona Radioativa');
 const bar=document.createElement('div');bar.className='rue-radio-bar';
 const title=document.createElement('strong');title.textContent='☢️ ZONA RADIOATIVA • CUTSCENE';
 const closeButton=document.createElement('button');closeButton.type='button';closeButton.textContent='✕ Voltar ao jogo';
 closeButton.setAttribute('aria-label','Fechar cutscene e voltar ao jogo');
 bar.append(title,closeButton);
 const frame=document.createElement('iframe');
 frame.title='Cena cinematográfica da Zona Radioativa';
 frame.setAttribute('allow','autoplay');
 frame.setAttribute('loading','eager');
 frame.src='about:blank';
 overlay.append(bar,frame);document.body.appendChild(overlay);
 let previousFocus=null;
 const open=()=>{
  if(!overlay.hidden)return;
  previousFocus=document.activeElement;
  overlay.hidden=false;
  frame.src='/cutscene-zona-radioativa.html?v=20261102-voz-final';
  closeButton.focus();
 };
 const close=()=>{
  if(overlay.hidden)return;
  overlay.hidden=true;
  // Desmontar o iframe interrompe as falas e os efeitos da cutscene.
  frame.src='about:blank';
  try{previousFocus?.focus?.()}catch(_){}
 };
 closeButton.addEventListener('click',close);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){e.preventDefault();close()}});
 const top=document.getElementById('top');
 if(top){
  const button=document.createElement('button');
  button.id='rue-radio-open';button.type='button';button.textContent='🎬';
  button.title='Ver cutscene da Zona Radioativa';
  button.setAttribute('aria-label','Ver cutscene da Zona Radioativa');
  button.addEventListener('click',open);top.prepend(button);
 }
 const cover=document.getElementById('roube-capa');
 const install=cover?.querySelector('#roube-install');
 if(cover&&install){
  const button=document.createElement('button');
  button.id='roube-radio-preview';button.type='button';
  button.textContent='🎬 CUTSCENE • ZONA RADIOATIVA';
  button.addEventListener('click',open);
  install.before(button);
 }
 // Na primeira entrada, exibir a cutscene sem alterar o inventário, sala ou progresso.
 window.addEventListener('roube-start-game',()=>{
  let seen=false;
  try{seen=sessionStorage.getItem('rue-radio-cutscene-firstview-v1')==='sim';sessionStorage.setItem('rue-radio-cutscene-firstview-v1','sim')}catch(_){}
  if(!seen)open();
 });
})();
