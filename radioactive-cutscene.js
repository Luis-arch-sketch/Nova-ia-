
'use strict';
/* Vinganca Radioativa: mesmo video original com efeito de aura sincronizado, sem mudar progresso. */
(()=>{
 if(document.getElementById('rue-radio-cutscene'))return;
 const source='https://d2ol7oe51mr4n9.cloudfront.net/user_3JFcHz5Qa9DHhL0HgUC1tR9DRlP/e01d0c74-1160-428d-814f-1ff15215c9bb.mp4';
 const style=document.createElement('style');
 style.textContent='#rue-radio-cutscene[hidden],#rue-radio-tap[hidden]{display:none!important}#rue-radio-cutscene{position:fixed;inset:0;z-index:2001;background:#020701;overflow:hidden;display:flex;align-items:center;justify-content:center}#rue-radio-video{width:100%;height:100%;object-fit:contain;background:#020701}#rue-radio-fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}#rue-radio-skip{position:absolute;z-index:5;right:14px;top:16px;min-width:102px;min-height:46px;padding:9px 18px;border:2px solid #e3f5ff;border-radius:12px;background:#101a24e9;color:#fff;font:900 17px system-ui,sans-serif;cursor:pointer}#rue-radio-tap{position:absolute;z-index:4;left:50%;top:50%;transform:translate(-50%,-50%);border:2px solid #bdff78;border-radius:16px;padding:14px 24px;background:#021808e8;color:#fff;font:bold 18px system-ui,sans-serif}';
 document.head.appendChild(style);
 const overlay=document.createElement('section');overlay.id='rue-radio-cutscene';overlay.hidden=true;overlay.setAttribute('aria-label','Vinganca Radioativa');
 const video=document.createElement('video');video.id='rue-radio-video';video.src=source;video.preload='auto';video.playsInline=true;video.setAttribute('playsinline','');video.controls=false;
 const fx=document.createElement('canvas');fx.id='rue-radio-fx';fx.setAttribute('aria-hidden','true');
 const tap=document.createElement('button');tap.id='rue-radio-tap';tap.textContent='▶ Assistir cutscene';tap.hidden=true;
 const skip=document.createElement('button');skip.id='rue-radio-skip';skip.textContent='SKIP ⏭';skip.setAttribute('aria-label','Pular cutscene e jogar agora');
 overlay.append(video,fx,tap,skip);document.body.appendChild(overlay);
 const ctx=fx.getContext('2d');let opened=false,ended=false,raf=0;
 function play(){
  if(overlay.hidden||ended)return;
  const p=video.play();if(p&&p.then)p.then(()=>{tap.hidden=true}).catch(()=>{tap.hidden=false});
 }
 function paint(){
  if(overlay.hidden||ended)return;
  const w=fx.clientWidth,h=fx.clientHeight,dpr=Math.min(window.devicePixelRatio||1,1.5);
  if(fx.width!==Math.round(w*dpr)||fx.height!==Math.round(h*dpr)){fx.width=Math.round(w*dpr);fx.height=Math.round(h*dpr)}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const t=video.currentTime||0,short=Math.min(w,h),cx=w*.5,cy=h*.52;
  const zoom=t>=22.45&&t<24.05?1+.14*Math.sin(Math.PI*(t-22.45)/1.6):1;video.style.transform='scale('+zoom.toFixed(3)+')';
  // A aura comeca no MESMO instante da explosao nuclear.
  const start=24.1;
  if(t>=start&&t<28.1){
   const dt=t-start,fade=Math.max(0,1-dt/4),radius=short*(.08+1.75*Math.min(1,dt/2.4));
   const colors=['198,54,255','83,255,87','255,240,135'];
   ctx.save();ctx.globalCompositeOperation='screen';
   for(let j=0;j<3;j++){
    const r=radius*(1-j*.16),alpha=Math.max(0,fade*(.8-j*.13));
    const grad=ctx.createRadialGradient(cx,cy,Math.max(1,r*.38),cx,cy,r);
    grad.addColorStop(0,'rgba(255,255,255,0)');
    grad.addColorStop(.68,'rgba('+colors[j]+','+(alpha*.06)+')');
    grad.addColorStop(.89,'rgba('+colors[j]+','+(alpha*.45)+')');
    grad.addColorStop(1,'rgba('+colors[j]+',0)');
    ctx.fillStyle=grad;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba('+colors[j]+','+(alpha*.8)+')';ctx.lineWidth=Math.max(2,short*.011*(1-dt/5));ctx.beginPath();ctx.arc(cx,cy,r*.83,0,Math.PI*2);ctx.stroke();
   }
   if(dt<.19){ctx.fillStyle='rgba(255,250,230,'+(.32*(1-dt/.19))+')';ctx.fillRect(0,0,w,h)}
   ctx.restore();
  }

  // Substitui os textos de horario do MP4 original, mantendo as cenas originais.
  const vw=Math.min(w,h*16/9),vh=vw*9/16,left=(w-vw)/2,top=(h-vh)/2;
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  if(t<2.8){
   ctx.fillStyle='#10291b';ctx.fillRect(left+vw*.39,top+vh*.235,vw*.22,vh*.135);
   ctx.fillStyle='#d2ff89';ctx.shadowColor='#8aff69';ctx.shadowBlur=12;
   ctx.font='900 '+Math.max(11,Math.round(vh*.10))+'px system-ui,sans-serif';
   ctx.fillText('20:30',left+vw*.5,top+vh*.305);
  }
  if(t>=29){
   ctx.fillStyle='#102b20';ctx.fillRect(left+vw*.27,top+vh*.84,vw*.46,vh*.145);
   ctx.fillStyle='#d3ff89';ctx.shadowColor='#99ff72';ctx.shadowBlur=12;
   ctx.font='900 '+Math.max(11,Math.round(vh*.076))+'px system-ui,sans-serif';
   ctx.fillText('HOJE • 20:30',left+vw*.5,top+vh*.925);
  }
  ctx.restore();
  raf=requestAnimationFrame(paint);
 }
 function open(){if(opened)return;opened=true;ended=false;overlay.hidden=false;tap.hidden=true;video.currentTime=0;play();cancelAnimationFrame(raf);raf=requestAnimationFrame(paint)}
 function close(){if(ended)return;ended=true;overlay.hidden=true;cancelAnimationFrame(raf);video.pause();video.removeAttribute('src');video.load();window.RoubeOvoEntrance?.stop?.();const entrance=document.getElementById('mpEntrance');if(entrance)entrance.style.display='none'}
 tap.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();play()});
 skip.addEventListener('pointerdown',e=>e.stopPropagation());
 skip.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();close()});
 overlay.addEventListener('pointerdown',()=>{if(video.paused)play()});
 video.addEventListener('ended',close);video.addEventListener('error',()=>{tap.hidden=false;tap.textContent='▶ Tentar reproduzir'});
 window.RoubeOvoSkipRadioCutscene=close;
 window.addEventListener('roube-start-game',open);
 const cover=document.getElementById('roube-capa');
 if(!cover||getComputedStyle(cover).display==='none')requestAnimationFrame(open);
})();
