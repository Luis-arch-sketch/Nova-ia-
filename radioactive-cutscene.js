'use strict';
/* Trailer automatico: nada de botoes; preserva o estado do jogo e da sala. */
(()=>{
 if(document.getElementById('rue-radio-cutscene'))return;
 const style=document.createElement('style');
 style.textContent=`
 #rue-radio-cutscene[hidden]{display:none!important}
 #rue-radio-cutscene{position:fixed;inset:0;z-index:2001;display:block;background:#020701;overflow:hidden;touch-action:manipulation}
 #rue-radio-cutscene iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#020701;display:block}
 #rue-radio-skip{position:absolute;z-index:5;right:max(14px,env(safe-area-inset-right,0px));top:calc(16px + env(safe-area-inset-top,0px));min-width:102px;min-height:46px;padding:9px 18px;border:2px solid #e3f5ff;border-radius:12px;background:#101a24e9;color:#fff;font:900 17px system-ui,sans-serif;letter-spacing:.12em;box-shadow:0 5px 22px #000a;cursor:pointer;touch-action:manipulation}
 #rue-radio-skip:focus-visible{outline:3px solid #61e1ff;outline-offset:3px}
 `;
 document.head.appendChild(style);
 const overlay=document.createElement('section');
 overlay.id='rue-radio-cutscene';
 overlay.hidden=true;
 overlay.setAttribute('role','dialog');
 overlay.setAttribute('aria-label','Cutscene da Zona Radioativa');
 const frame=document.createElement('iframe');
 frame.title='Trailer cinematografico da Zona Radioativa';
 frame.setAttribute('allow','autoplay');
 frame.setAttribute('loading','eager');
 frame.src='/cutscene-zona-radioativa.html?embed=1&v=20261102-autoplay1';
 overlay.appendChild(frame);
 const skip=document.createElement('button');
 skip.type='button';skip.id='rue-radio-skip';skip.textContent='SKIP ⏭';
 skip.setAttribute('aria-label','Pular cutscene e jogar agora');
 overlay.appendChild(skip);
 document.body.appendChild(overlay);
 let opened=false;
 function startInner(){
  try{
   const inner=frame.contentWindow;
   if(inner?.rueStartCutscene)inner.rueStartCutscene();
   else inner?.postMessage({type:'rue-radio-start'},location.origin);
  }catch(err){console.warn('Cutscene: aguardar carregamento do iframe',err)}
 }
 function open(){
  if(opened)return;
  opened=true;
  overlay.hidden=false;
  startInner();
 }
 function close(){
  if(overlay.hidden)return;
  overlay.hidden=true;
  // Descarrega o iframe para interromper o áudio e o vídeo imediatamente.
  frame.src='about:blank';
  // Se o portal de entrada estiver aberto, o jogador segue direto para o controle.
  window.RoubeOvoEntrance?.stop?.();
  const entrance=document.getElementById('mpEntrance');
  if(entrance)entrance.style.display='none';
 }
 skip.addEventListener('pointerdown',e=>{e.stopPropagation()});
 skip.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();close()});
 window.RoubeOvoSkipRadioCutscene=close;
 frame.addEventListener('load',()=>{if(!overlay.hidden)startInner()});
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(event.data?.type==='rue-radio-finished')close();
 });
 // O toque normal em JOGAR AGORA libera o audio no Android e inicia o trailer.
 window.addEventListener('roube-start-game',open);
 // Com a capa ja dispensada (PWA ou sessao anterior), abrir automaticamente.
 const cover=document.getElementById('roube-capa');
 if(!cover||getComputedStyle(cover).display==='none')
   requestAnimationFrame(()=>open());
 // Caso o navegador bloqueie autoplay, o toque em qualquer parte da cena libera o som.
 overlay.addEventListener('pointerdown',()=>{
  try{
   const inner=frame.contentWindow;
   if(inner?.AC?.state==='suspended')inner.AC.resume().catch(()=>{});
   if(inner&&(!inner.started||!inner.playing)&&inner.t===0)startInner();
  }catch(_){}
 });
})();
