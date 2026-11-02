'use strict';
// Contagem compartilhada, com data absoluta para todos os jogadores.
(()=>{
 if(document.getElementById('rue-biome-countdown'))return;
 const TARGET=Date.parse('2026-11-07T00:13:00Z'); // 06 nov 2026, 21:13 em São Paulo.
 const style=document.createElement('style');
 style.textContent=`
 #rue-biome-countdown{box-sizing:border-box;max-width:min(255px,43vw);border:1px solid #ffacdc;background:rgba(39,12,52,.9);box-shadow:0 3px 13px #0008;border-radius:12px;color:#ffe5ff;padding:7px 9px;font:800 12px/1.3 system-ui,sans-serif;text-align:center;pointer-events:none;}
 #rue-biome-countdown strong{color:#ffda71;font-size:13px;display:block;}
 body.rue-panel-visible #rue-biome-countdown{display:none;}
 @media(max-height:460px){#rue-biome-countdown{max-width:min(210px,33vw);font-size:10px;padding:4px 6px;}#rue-biome-countdown strong{font-size:11px;}}
 `;
 document.head.appendChild(style);
 const el=document.createElement('aside');el.id='rue-biome-countdown';el.setAttribute('aria-label','Contagem regressiva para evento Admin Abuse do novo bioma');document.getElementById('rue-player-controls').appendChild(el);
 function update(){
  const seconds=Math.max(0,Math.ceil((TARGET-Date.now())/1000));
  if(!seconds){el.innerHTML='😈 ADMIN ABUSE <strong>🌎 Hoje: novo bioma!</strong>';return;}
  const days=Math.floor(seconds/86400),hours=Math.floor(seconds%86400/3600),minutes=Math.floor(seconds%3600/60),sec=seconds%60;
  el.innerHTML='😈 ADMIN ABUSE • NOVO BIOMA<strong>'+days+'d '+String(hours).padStart(2,'0')+'h '+String(minutes).padStart(2,'0')+'m '+String(sec).padStart(2,'0')+'s</strong>';
 }
 update();setInterval(update,1000);
})();
