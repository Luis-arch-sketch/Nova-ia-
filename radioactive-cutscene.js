'use strict';
/* Trailer automatico: nada de botoes; preserva o estado do jogo e da sala. */
(()=>{
 if(document.getElementById('rue-radio-cutscene'))return;
 const style=document.createElement('style');
 style.textContent=`
 #rue-radio-cutscene[hidden]{display:none!important}
 #rue-radio-cutscene{position:fixed;inset:0;z-index:2001;display:block;background:#020701;overflow:hidden;touch-action:manipulation}
 #rue-radio-cutscene iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#020701;display:block}
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
  frame.src='about:blank';
 }
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
