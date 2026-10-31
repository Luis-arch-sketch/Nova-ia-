'use strict';
// Interface independente: exibe os valores reais existentes no jogo.
// Nao muda as chaves do save nem grava progresso em localStorage.
(() => {
  if (document.getElementById('rue-live-hud')) return;
  const style = document.createElement('style');
  style.textContent = [
    '#hud{display:none!important}',
    '#rue-live-hud{position:fixed;z-index:26;top:calc(53px + env(safe-area-inset-top,0px));left:calc(10px + env(safe-area-inset-left,0px));display:flex;flex-direction:column;gap:6px;pointer-events:none;font-family:system-ui,sans-serif;}',
    '.rue-live-counter{display:flex;align-items:center;gap:7px;padding:6px 11px;max-width:min(70vw,350px);width:max-content;box-sizing:border-box;min-height:38px;border-radius:15px;background:linear-gradient(130deg,rgba(3,28,18,.93),rgba(3,13,18,.93));border:2px solid #46f375;box-shadow:0 0 12px #2cfc6b6b,0 3px 7px #0007;color:#fff;font-size:clamp(13px,3.3vw,19px);font-weight:900;text-shadow:0 2px 3px #000c;white-space:nowrap;}',
    '.rue-live-counter .rue-ico{font-size:21px;line-height:1;}',
    '.rue-live-counter.rue-speed{background:linear-gradient(130deg,rgba(5,27,50,.95),rgba(2,17,36,.95));border-color:#35afff;box-shadow:0 0 12px #10bfff77,0 3px 7px #0007;}',
    '#rue-chat-open{position:fixed;z-index:45;right:calc(12px + env(safe-area-inset-right,0px));bottom:calc(178px + env(safe-area-inset-bottom,0px));background:#1978db;color:#fff;border:2px solid #e6f6ff;box-shadow:0 3px 14px #0008;padding:10px 14px;min-height:46px;border-radius:999px;font:bold 15px system-ui,sans-serif;touch-action:manipulation;}',
    '#rue-chat-open[aria-expanded=true]{background:#23435d;}',
    '#rue-chat-panel{position:fixed;z-index:46;right:calc(9px + env(safe-area-inset-right,0px));bottom:calc(234px + env(safe-area-inset-bottom,0px));box-sizing:border-box;width:min(360px,calc(100vw - 18px));height:min(355px,calc(100dvh - 252px));min-height:145px;border:2px solid #6ebcff;border-radius:17px;background:rgba(7,20,36,.97);color:white;box-shadow:0 9px 26px #000a;display:flex;flex-direction:column;overflow:hidden;font:500 14px system-ui,sans-serif;user-select:text;-webkit-user-select:text;touch-action:auto;}',
    '#rue-chat-panel[hidden]{display:none!important;}',
    '.rue-chat-title{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 11px;background:#123253;font-weight:900;}',
    '#rue-chat-close{background:transparent;color:white;font-size:20px;padding:3px 8px;min-width:34px;min-height:34px;}',
    '#rue-chat-status{padding:4px 10px;font-size:11px;color:#a6d5ff;background:#0d273f;}',
    '#rue-chat-messages{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;padding:9px;display:flex;flex-direction:column;gap:7px;}',
    '.rue-chat-line{font-size:13px;line-height:1.35;overflow-wrap:anywhere;white-space:pre-wrap;}',
    '.rue-chat-line strong{color:#8bd6ff;}',
    '.rue-chat-note{color:#aac3d2;font-size:12px;text-align:center;}',
    '#rue-chat-form{display:flex;gap:6px;padding:8px;border-top:1px solid #356086;background:#102b43;}',
    '#rue-chat-input{min-width:0;flex:1;height:39px;border:1px solid #9bb4d7;border-radius:9px;background:#f6faff;color:#102338;padding:0 10px;font:500 14px system-ui,sans-serif;user-select:text;-webkit-user-select:text;touch-action:manipulation;}',
    '#rue-chat-send{min-height:39px;border-radius:9px;background:#40a6ff;color:#06172b;font-weight:900;padding:7px 10px;}',
    '#rue-chat-send:disabled,#rue-chat-input:disabled{opacity:.55;}',
    '@media(max-width:450px){#rue-live-hud{top:calc(52px + env(safe-area-inset-top,0px));} .rue-live-counter{min-height:34px;padding:5px 8px;font-size:13px;}.rue-live-counter .rue-ico{font-size:17px;} #rue-chat-open{padding:9px 11px;font-size:13px;}}',
    '@media(max-height:480px){#rue-chat-open{bottom:calc(90px + env(safe-area-inset-bottom,0px));}#rue-chat-panel{bottom:calc(143px + env(safe-area-inset-bottom,0px));height:min(190px,calc(100dvh - 149px));min-height:110px;}}'
  ].join('\n');
  document.head.appendChild(style);

  const hud = document.createElement('div');
  hud.id = 'rue-live-hud';
  hud.setAttribute('aria-label', 'Dinheiro e velocidade do jogador');
  function counter(className, symbol) {
    const item=document.createElement('div');
    item.className='rue-live-counter '+className;
    const ico=document.createElement('span');ico.className='rue-ico';ico.textContent=symbol;
    const value=document.createElement('span');
    item.append(ico,value);hud.appendChild(item);
    return value;
  }
  const cashValue=counter('rue-money','💵');
  const speedValue=counter('rue-speed','🏃');
  document.body.appendChild(hud);

  const openButton=document.createElement('button');
  openButton.id='rue-chat-open';openButton.type='button';
  openButton.textContent='💬 Chat';openButton.setAttribute('aria-expanded','false');
  openButton.setAttribute('aria-controls','rue-chat-panel');
  const panel=document.createElement('section');
  panel.id='rue-chat-panel';panel.hidden=true;panel.setAttribute('aria-label','Chat do servidor');
  const title=document.createElement('div');title.className='rue-chat-title';
  const heading=document.createElement('span');heading.textContent='💬 CHAT DO SERVIDOR';
  const close=document.createElement('button');close.type='button';close.id='rue-chat-close';
  close.setAttribute('aria-label','Fechar chat');close.textContent='×';title.append(heading,close);
  const status=document.createElement('div');status.id='rue-chat-status';status.setAttribute('role','status');
  const messages=document.createElement('div');messages.id='rue-chat-messages';messages.setAttribute('role','log');
  messages.setAttribute('aria-live','polite');messages.setAttribute('aria-relevant','additions');
  const form=document.createElement('form');form.id='rue-chat-form';
  const input=document.createElement('input');input.id='rue-chat-input';input.type='text';
  input.maxLength=160;input.placeholder='Digite sua mensagem';input.autocomplete='off';input.spellcheck=true;
  const sendButton=document.createElement('button');sendButton.id='rue-chat-send';sendButton.type='submit';
  sendButton.textContent='Enviar';form.append(input,sendButton);
  panel.append(title,status,messages,form);
  document.body.append(openButton,panel);

  let currentRoom='', observedSocket=null, lastSentAt=-10000, unread=0;
  function note(text){
    const el=document.createElement('div');el.className='rue-chat-note';el.textContent=text;
    messages.appendChild(el);
  }
  function changeRoom(newRoom){
    if(newRoom===currentRoom)return;
    currentRoom=newRoom;unread=0;openButton.textContent='💬 Chat';
    messages.replaceChildren();
    if(newRoom)note('Mensagens somente da sala '+newRoom);
  }
  function setOpened(open){
    panel.hidden=!open;
    openButton.setAttribute('aria-expanded',String(open));
    if(open){unread=0;openButton.textContent='💬 Chat';messages.scrollTop=messages.scrollHeight;input.focus();}
  }
  openButton.addEventListener('click',()=>setOpened(panel.hidden));
  close.addEventListener('click',()=>setOpened(false));
  panel.addEventListener('keydown',ev=>{if(ev.key==='Escape')setOpened(false);ev.stopPropagation();});
  panel.addEventListener('pointerdown',ev=>ev.stopPropagation());
  form.addEventListener('submit',ev=>{
    ev.preventDefault();ev.stopPropagation();
    const mp=typeof MP==='undefined'?null:MP;
    if(!mp?.connected || mp.socket?.readyState!==WebSocket.OPEN)return;
    const value=input.value.replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').trim().slice(0,160);
    if(!value)return;
    const now=performance.now();
    if(now-lastSentAt<950)return;
    if(typeof mpSend==='function'&&mpSend({type:'chat',text:value})){
      lastSentAt=now;input.value='';
    }
  });
  function incoming(ev){
    if(ev.currentTarget!==observedSocket)return;
    let data;try{data=JSON.parse(ev.data)}catch{return;}
    if(!data||typeof data!=='object')return;
    if(data.type==='joined'&&typeof data.room==='string'){changeRoom(data.room);return;}
    if(data.type!=='chat'||data.room!==currentRoom||typeof data.text!=='string')return;
    const item=document.createElement('div');item.className='rue-chat-line';
    const name=document.createElement('strong');
    name.textContent=String(data.name||'Jogador').slice(0,20).toUpperCase()+': ';
    const body=document.createElement('span');body.textContent=data.text.slice(0,160);
    item.append(name,body);messages.appendChild(item);
    while(messages.children.length>80)messages.firstElementChild.remove();
    messages.scrollTop=messages.scrollHeight;
    if(panel.hidden){unread=Math.min(99,unread+1);openButton.textContent='💬 Chat ('+unread+')';}
  }
  function refresh(){
    try{
      if(typeof S!=='undefined'&&typeof fm==='function'){
        const money=Number(S.$),speed=Number(S.sp);
        cashValue.textContent='$ '+(Number.isFinite(money)?fm(money):'—');
        speedValue.textContent='Velocidade: '+(Number.isFinite(speed)?fm(speed):'—');
      }
      const mp=typeof MP==='undefined'?null:MP;
      if(mp?.socket!==observedSocket){
        observedSocket=mp?.socket||null;
        if(observedSocket)observedSocket.addEventListener('message',incoming);
      }
      if(mp?.connected&&mp.room)changeRoom(mp.room);
      const online=!!(mp?.connected&&mp.socket?.readyState===WebSocket.OPEN);
      input.disabled=!online;sendButton.disabled=!online;
      status.textContent=online?'🟢 Sala '+mp.room+' • Conversa com jogadores deste servidor':'🔄 Conectando ao servidor…';
    }catch(err){console.warn('HUD/chat:',err);}
  }
  refresh();setInterval(refresh,250);
})();
