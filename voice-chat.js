'use strict';
/* Voz por sala: WebRTC com permissão explícita do microfone. Áudio direto entre pares,
   sinalização autenticada pelo servidor. Começa desligada e permite silenciar jogadores. */
(()=>{
 if(window.RoubeOvoVoiceChat)return;
 const state={active:false,starting:false,stream:null,peers:new Map(),muted:new Set(),present:new Set()};
 const css=document.createElement('style');
 css.textContent='#rue-voice-btn{position:fixed;left:calc(12px + env(safe-area-inset-left,0px));bottom:calc(72px + env(safe-area-inset-bottom,0px));z-index:100;border:2px solid #d9f2ff;border-radius:100px;padding:10px 12px;background:#244968;color:white;min-height:43px;font:bold 13px system-ui;box-shadow:0 3px 14px #0009}#rue-voice-btn.active{background:#247f57}#rue-voice-btn:disabled{opacity:.5}#rue-voice-list{position:fixed;left:calc(10px + env(safe-area-inset-left,0px));bottom:calc(123px + env(safe-area-inset-bottom,0px));z-index:101;width:min(280px,80vw);max-height:35vh;overflow:auto;border:1px solid #8ddcfa;border-radius:12px;background:#122b40f4;color:#fff;padding:9px;font:12px system-ui;display:none}#rue-voice-list strong{display:block;margin:4px}#rue-voice-list button{padding:8px;background:#375970;color:white;border:1px solid #8ebad1;border-radius:8px;margin:4px 0;min-height:38px;width:100%}body.rue-panel-visible #rue-voice-list{display:none!important}';
 document.head.appendChild(css);
 const toggle=document.createElement('button');toggle.id='rue-voice-btn';toggle.type='button';toggle.textContent='🎤 Ativar voz';toggle.setAttribute('aria-label','Ativar conversa por voz na sala');document.body.appendChild(toggle);
 const list=document.createElement('section');list.id='rue-voice-list';list.setAttribute('aria-label','Controles do chat de voz');document.body.appendChild(list);
 const signal=(target,signal)=>mpSend({type:'voice-signal',target,signal});
 const closePeer=id=>{const p=state.peers.get(id);if(!p)return;state.peers.delete(id);try{p.pc.close()}catch{}try{p.audio.pause();p.audio.srcObject=null;p.audio.remove()}catch{}};
 const draw=()=>{
  toggle.textContent=state.starting?'⏳ Microfone…':state.active?'🎙️ Voz ligada':'🎤 Chat de voz';
  toggle.classList.toggle('active',state.active);
  toggle.disabled=state.starting||!MP.connected||!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection;
  if(!state.active){list.style.display='none';return}
  list.innerHTML='';
  const title=document.createElement('strong');title.textContent='🎧 Voz global da sala • qualquer distância';list.appendChild(title);
  const others=[...MP.players.values()].filter(p=>p.id!==MP.self&&p.voice);
  if(!others.length){const p=document.createElement('p');p.textContent='Mais ninguém está usando voz agora.';list.appendChild(p)}
  for(const peer of others){
   const b=document.createElement('button'),muted=state.muted.has(peer.id);
   b.textContent=(muted?'🔇 Ouvir ':'🔊 Silenciar ')+String(peer.name||'Jogador').slice(0,20);
   b.addEventListener('click',()=>{if(muted)state.muted.delete(peer.id);else state.muted.add(peer.id);const current=state.peers.get(peer.id);if(current)current.audio.muted=state.muted.has(peer.id);draw()});list.appendChild(b);
  }
 };
 function stop(){
  if(state.active&&MP.connected)mpSend({type:'voice-state',enabled:false});
  state.active=false;state.starting=false;
  for(const id of [...state.peers.keys()])closePeer(id);
  state.stream?.getTracks().forEach(track=>track.stop());state.stream=null;draw();
 }
 const createPeer=id=>{
  if(!state.active||!id||id===MP.self)return null;
  if(state.peers.has(id))return state.peers.get(id);
  const pc=new RTCPeerConnection({iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}]});
  const audio=document.createElement('audio');audio.autoplay=true;audio.playsInline=true;audio.style.display='none';audio.muted=state.muted.has(id);document.body.appendChild(audio);
  const peer={pc,audio,ice:[],offering:false};state.peers.set(id,peer);
  for(const track of state.stream?.getAudioTracks()||[])pc.addTrack(track,state.stream);
  pc.onicecandidate=e=>{if(e.candidate)signal(id,{type:'candidate',candidate:e.candidate.toJSON()})};
  pc.ontrack=e=>{audio.srcObject=e.streams[0]||(new MediaStream([e.track]));audio.muted=state.muted.has(id);audio.volume=1;audio.play().catch(()=>{toast('🎧 Toque no chat de voz para liberar o som.')})};
  pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(pc.connectionState))closePeer(id)};
  return peer;
 };
 async function makeOffer(id){
  if(!state.active||!MP.connected||!MP.self||MP.self.localeCompare(id)>=0)return;
  const p=createPeer(id);if(!p||p.offering||p.pc.signalingState!=='stable')return;
  p.offering=true;
  try{await p.pc.setLocalDescription(await p.pc.createOffer());signal(id,{type:'offer',sdp:p.pc.localDescription.sdp})}
  catch(err){console.warn('Falha ao iniciar voz:',err);closePeer(id)}
  finally{p.offering=false}
 }
 async function incoming(m){
  if(m.type==='voice-presence'){
   if(m.id===MP.self)return;
   if(m.enabled){state.present.add(m.id);if(state.active&&MP.self.localeCompare(m.id)<0)await makeOffer(m.id)}
   else {state.present.delete(m.id);closePeer(m.id)}
   draw();return;
  }
  if(m.type!=='voice-signal'||!state.active||!m.from)return;
  const s=m.signal;if(!s||!['offer','answer','candidate'].includes(s.type))return;
  const p=createPeer(m.from);if(!p)return;
  try{
   if(s.type==='offer'){
    await p.pc.setRemoteDescription({type:'offer',sdp:s.sdp});
    for(const ice of p.ice.splice(0))await p.pc.addIceCandidate(ice).catch(()=>{});
    await p.pc.setLocalDescription(await p.pc.createAnswer());
    signal(m.from,{type:'answer',sdp:p.pc.localDescription.sdp});
   }else if(s.type==='answer'){
    if(p.pc.signalingState==='have-local-offer')await p.pc.setRemoteDescription({type:'answer',sdp:s.sdp});
    for(const ice of p.ice.splice(0))await p.pc.addIceCandidate(ice).catch(()=>{});
   }else if(s.candidate){
    if(p.pc.remoteDescription)await p.pc.addIceCandidate(s.candidate).catch(()=>{});
    else p.ice.push(s.candidate);
   }
  }catch(err){console.warn('Falha na conexão de voz:',err);closePeer(m.from)}
 }
 const onPlayers=players=>{
  const ids=new Set((players||[]).filter(p=>p.voice&&p.id!==MP.self).map(p=>p.id));
  state.present=ids;
  for(const id of [...state.peers.keys()])if(!ids.has(id))closePeer(id);
  if(state.active)for(const id of ids)if(MP.self.localeCompare(id)<0&&!state.peers.has(id))makeOffer(id);
  draw();
 };
 async function start(){
  if(state.active||state.starting||!MP.connected)return;
  if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection){toast('🎙️ Microfone indisponível neste navegador.');return}
  state.starting=true;draw();
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
   if(!MP.connected){stream.getTracks().forEach(track=>track.stop());return}
   state.stream=stream;state.active=true;
   stream.getAudioTracks()[0]?.addEventListener('ended',stop,{once:true});
   mpSend({type:'voice-state',enabled:true});
   for(const id of state.present)if(MP.self.localeCompare(id)<0)makeOffer(id);
   toast('🎙️ Voz ligada. Use fones de ouvido para evitar eco.');
  }catch(err){toast('🎙️ Permissão do microfone recusada ou indisponível.')}
  finally{state.starting=false;draw()}
 }
 toggle.addEventListener('click',()=>{
  for(const p of state.peers.values())p.audio.play().catch(()=>{});
  if(state.active){stop();return}
  start().then(()=>{if(state.active)list.style.display='block'});
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.active)stop()});
 window.RoubeOvoVoiceChat={incoming,onPlayers,stop,refresh:draw,get active(){return state.active}};
 draw();
})();
