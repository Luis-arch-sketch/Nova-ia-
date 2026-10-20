/* =============================================================
   MR. BEAN — MINI RUSH
   Endless car-jumping runner · HTML Canvas + WebAudio
   Assets: nine user-supplied characters + thirteen user-made maps.
   Everything is local/offline except optional web fonts.
   ============================================================= */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const W = 960, H = 540, GROUND = 430, MAP_W = 960, MAP_N = 13;
  const TAU = Math.PI * 2;
  const KEY = 'mrbean-mini-rush-save-v1';
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const rnd = (min, max) => min + Math.random() * (max - min);
  const mod = (n, m) => ((n % m) + m) % m;
  const money = n => Math.floor(n).toLocaleString('pt-BR');
  const timeFmt = t => `${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
  const rectsOverlap = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;

  const UPGRADES = [
    {id:'motor', name:'Motor preparado', emoji:'⚙️', currency:'coins', base:200, step:175, max:5,
      description:'Aumenta as moedas automáticas e a pontuação por distância em +20% por nível.'},
    {id:'suspensao', name:'Suspensão saltitante', emoji:'🦘', currency:'coins', base:170, step:170, max:5,
      description:'Salte mais alto e fique mais tempo no ar. Ideal para saltar caminhões.'},
    {id:'ima', name:'Ímã de moedas', emoji:'🧲', currency:'gems', base:2, step:2, max:4,
      description:'Aumenta o raio de coleta de moedas e diamantes que passam perto do Mini.'},
    {id:'escudo', name:'Proteção anti-batida', emoji:'🛡️', currency:'gems', base:4, step:3, max:3,
      description:'Comece cada corrida com um escudo por nível, absorvendo batidas.'},
    {id:'turbo', name:'Turbo do Teddy', emoji:'⚡', currency:'coins', base:300, step:250, max:4,
      description:'Libera o turbo (X). Durante a aceleração você fica invulnerável e ganha moedas extras.'}
  ];
  const MISSIONS = [
    {id:'first', emoji:'🛞', title:'Primeiro passeio', desc:'Percorra 400 metros', type:'distance', need:400, coins:180, gems:2},
    {id:'jumper', emoji:'🦘', title:'Pulo profissional', desc:'Pule 12 vezes', type:'jumps', need:12, coins:240, gems:2},
    {id:'driver', emoji:'🚗', title:'Rei do trânsito', desc:'Evite 15 carros', type:'dodged', need:15, coins:320, gems:3},
    {id:'pocket', emoji:'🪙', title:'Rico por acidente', desc:'Pegue 30 moedas na pista', type:'pickedCoins', need:30, coins:450, gems:3},
    {id:'survivor', emoji:'⏱️', title:'Paciência britânica', desc:'Sobreviva 90 segundos no total', type:'seconds', need:90, coins:550, gems:4},
    {id:'five', emoji:'🏁', title:'Só mais uma!', desc:'Inicie 5 corridas', type:'runs', need:5, coins:375, gems:3},
    {id:'distance', emoji:'🗺️', title:'Passeio por Londres', desc:'Percorra 5.000 metros no total', type:'distance', need:5000, coins:720, gems:5},
    {id:'diamonds', emoji:'💎', title:'Caçador de diamantes', desc:'Recolha 5 diamantes na pista', type:'pickedGems', need:5, coins:650, gems:6},
    {id:'acrobatic', emoji:'✨', title:'Bean imparável', desc:'Consiga combo de 8 carros evitados', type:'maxCombo', need:8, coins:490, gems:4},
    {id:'mechanic', emoji:'🔧', title:'Mestre mecânico', desc:'Compre 3 melhorias', type:'bought', need:3, coins:360, gems:4},
    {id:'legend', emoji:'🏆', title:'Lenda do Mini', desc:'Percorra 15.000 metros no total', type:'distance', need:15000, coins:1100, gems:8}
  ];
  const baseStats = () => ({distance:0,seconds:0,runs:0,jumps:0,dodged:0,pickedCoins:0,pickedGems:0,maxCombo:0,bought:0,crashes:0,best:0});
  const baseSave = () => ({coins:0,gems:0,upgrades:{motor:0,suspensao:0,ima:0,escudo:0,turbo:0},claimed:[],stats:baseStats(),sound:true});
  function loadSave() {
    const base = baseSave();
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!value || typeof value !== 'object') return base;
      return { ...base,
        coins:clamp(Number(value.coins) || 0,0,1e12), gems:clamp(Number(value.gems)||0,0,1e12),
        upgrades:Object.fromEntries(UPGRADES.map(up=>[up.id,clamp(Math.floor(Number(value.upgrades?.[up.id])||0),0,up.max)])),
        claimed:Array.isArray(value.claimed)?value.claimed.filter(x=>MISSIONS.some(m=>m.id===x)):[],
        stats:{...base.stats,...Object.fromEntries(Object.entries(value.stats||{}).map(([k,v])=>[k,clamp(Number(v)||0,0,1e12)]))},
        sound:value.sound !== false
      };
    } catch { return base; }
  }
  const save = loadSave();
  let saveCountdown = 0;
  function persist() { try { localStorage.setItem(KEY,JSON.stringify(save)); } catch {} }
  function moneyGain(amount, source, announce=false) {
    const n=Math.max(0,Math.floor(amount)); if (!n) return;
    save.coins+=n; run.coins+=n; syncWallet();
    if (announce) notification(`+${money(n)} 🪙 ${source}`,'');
  }
  function gemGain(amount, source, announce=false) {
    const n=Math.max(0,Math.floor(amount)); if (!n) return;
    save.gems+=n; run.gems+=n; syncWallet();
    if(announce) notification(`+${money(n)} 💎 ${source}`,'blue');
  }
  function syncWallet() { $('walletCoins').textContent=money(save.coins); $('walletGems').textContent=money(save.gems); }
  const images = {bean:null, bg:[]};
  const loadImage = src => new Promise(resolve => {const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=src;});
  Promise.all([loadImage(window.MINI_RUSH_ART?.characters?.bean || 'assets/sprites/bean.png'),...Array.from({length:13},(_,i)=>loadImage(window.MINI_RUSH_ART?.maps?.[i] || `assets/mapas/cenario_${String(i+1).padStart(2,'0')}.png`))]).then(all=>{images.bean=all[0];images.bg=all.slice(1);});
  let state='menu', activeTab='jogar', elapsed=0, wall=0, camera=0, last=0, introT=0, crashT=0, particles=[], shake=0, bannerTimeout=0, bannerText='', roadStreaks=[];
  const player = {x:195,w:147,h:79,z:0,vz:0,onGround:true,wheels:0,shields:0,invuln:0,turbo:0,turboCd:0,tilt:0};
  let run = newRun();
  function newRun() { return {time:0,distance:0,dodged:0,jumps:0,combo:0,bestCombo:0,coins:0,gems:0,pickedCoins:0,pickedGems:0,obstacles:[],pickups:[],spawnTimer:2.4,coinTimer:0,gemTimer:0,milestone:0,finalized:false}; }
  let audioCtx, engineOsc, engineGain, engineLfo, engineLfoGain;
  function initAudio() {
    if (!save.sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if(!Audio)return;
      audioCtx ||= new Audio();
      audioCtx.resume();
      if (!engineOsc) {
        engineOsc=audioCtx.createOscillator();engineOsc.type='sawtooth';
        engineGain=audioCtx.createGain();engineGain.gain.value=0;
        const lp=audioCtx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=490;
        engineOsc.connect(lp).connect(engineGain).connect(audioCtx.destination);
        engineOsc.frequency.value=75;engineOsc.start();
        engineLfo=audioCtx.createOscillator();engineLfo.frequency.value=15;
        engineLfoGain=audioCtx.createGain();engineLfoGain.gain.value=7;
        engineLfo.connect(engineLfoGain).connect(engineOsc.frequency);engineLfo.start();
      }
    } catch(e){ console.warn('Som não disponível:',e.message); }
  }
  function engineUpdate(dt) {
    if (!audioCtx||!engineOsc||!engineGain) return;
    const target=(state==='running'||state==='intro')&&save.sound ? (state==='intro'?.028:.051) : 0;
    engineGain.gain.setTargetAtTime(target,audioCtx.currentTime,.08);
    engineOsc.frequency.setTargetAtTime(75+(state==='running'?Math.min(run.time*1.1,35):0)+(player.turbo>0?55:0),audioCtx.currentTime,.08);
  }
  function tone(type,frequency,duration,volume=.14,fall=.45,delay=0) {
    if (!save.sound||!audioCtx)return;
    try { const now=audioCtx.currentTime+delay;
      const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;
      o.frequency.setValueAtTime(Math.max(10,frequency),now);
      o.frequency.exponentialRampToValueAtTime(Math.max(10,frequency*fall),now+duration);
      g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.012);
      g.gain.exponentialRampToValueAtTime(.0001,now+duration);
      o.connect(g).connect(audioCtx.destination);o.start(now);o.stop(now+duration+.02);
    }catch{} }
  function noise(duration,volume,lowpass=1200){
    if(!save.sound||!audioCtx)return;
    try {const len=Math.ceil(audioCtx.sampleRate*duration),buffer=audioCtx.createBuffer(1,len,audioCtx.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);
      const src=audioCtx.createBufferSource(),lp=audioCtx.createBiquadFilter(),g=audioCtx.createGain();lp.type='lowpass';lp.frequency.value=lowpass;g.gain.value=volume;src.buffer=buffer;src.connect(lp).connect(g).connect(audioCtx.destination);src.start();
    }catch{} }
  const sounds={jump(){tone('triangle',390,.26,.14,1.9);tone('sine',230,.13,.06,1.25);},coin(){tone('sine',760,.11,.07,1.45);tone('sine',1140,.13,.06,1.1,.085);},gem(){tone('sine',520,.12,.09,1.45);tone('sine',890,.13,.09,1.3,.12);tone('sine',1400,.20,.08,.95,.23);},skid(){noise(.16,.15,2900);tone('sawtooth',330,.19,.045,.34);},crash(){noise(.65,.37,890);tone('sawtooth',115,.75,.30,.18);tone('triangle',60,.9,.17,.26);},turbo(){tone('sawtooth',190,.48,.13,2.4);noise(.24,.08,2800);},buy(){tone('sine',580,.14,.09,1.5);tone('sine',840,.15,.07,1.25,.12);},error(){tone('square',225,.14,.035,.72);},banner(){tone('sine',940,.14,.065,1.3);}};
  function notification(message,variant='') {
    const el=document.createElement('div');el.className=`toast ${variant}`;el.textContent=message;$('toastArea').append(el);setTimeout(()=>el.remove(),3000);
  }
  function showBanner(text,seconds=1.35){bannerText=text;bannerTimeout=seconds;$('banner').textContent=text;$('banner').classList.add('active');}
  function tabSwitch(tab) {
    activeTab=tab;
    ['jogar','garagem','missoes','recordes'].forEach(t=>{$(t==='jogar'?'playPane':t==='garagem'?'garagePane':t==='missoes'?'missionsPane':'recordsPane').hidden=t!==tab;});
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    if(tab==='garagem')renderShop();
    if(tab==='missoes')renderMissions();
    if(tab==='recordes')renderRecords();
    if(tab!=='jogar'&&state==='running') pause();
  }
  function upgradeCost(u) {return u.base+save.upgrades[u.id]*u.step;}
  function renderShop(){ $('shopGrid').innerHTML=UPGRADES.map(u=>{
    const lvl=save.upgrades[u.id], maxed=lvl>=u.max, cost=upgradeCost(u), affordable=save[u.currency]>=cost;
    return `<div class="shop-card"><div class="shop-icon">${u.emoji}</div><div class="shop-info"><h3>${u.name}</h3><p>${u.description}</p><div class="shop-level">${Array.from({length:u.max},(_,i)=>`<span class="level-pip ${i<lvl?'filled':''}"></span>`).join('')}<span class="level-text">NÍVEL ${lvl}/${u.max}</span></div><button class="buy-btn ${maxed?'maxed':''}" data-upgrade="${u.id}" ${maxed?'disabled':''}>${maxed?'✅ NÍVEL MÁXIMO':`MELHORAR · ${u.currency==='coins'?'🪙':'💎'} ${money(cost)}`}${!maxed&&!affordable?' 🔒':''}</button></div></div>`;
  }).join(''); }
  function buyUpgrade(id) {
    const u=UPGRADES.find(u=>u.id===id);if(!u)return;
    if(save.upgrades[id]>=u.max){sounds.error();return;}
    const cost=upgradeCost(u);
    if(save[u.currency]<cost){sounds.error();notification(`Saldo insuficiente! Faltam ${money(cost-save[u.currency])} ${u.currency==='coins'?'moedas':'diamantes'}.`,'pink');return;}
    save[u.currency]-=cost;save.upgrades[id]++;save.stats.bought++;sounds.buy();notification(`${u.emoji} ${u.name}: nível ${save.upgrades[id]}!`);
    persist();syncWallet();renderShop();syncMissionNotices();
  }
  function missionProgress(m){return Math.min(m.need,Math.floor(save.stats[m.type]||0));}
  function readyMissions(){return MISSIONS.filter(m=>!save.claimed.includes(m.id)&&missionProgress(m)>=m.need);}
  function syncMissionNotices(){const ready=readyMissions().length;const n=$('claimCount');n.textContent=ready;n.hidden=!ready;}
  function renderMissions(){
    $('missionsDone').textContent=`${save.claimed.length}/${MISSIONS.length}`;$('missionsReady').textContent=readyMissions().length;
    $('missionList').innerHTML=MISSIONS.map(m=>{
      const done=save.claimed.includes(m.id),p=missionProgress(m),ready=p>=m.need;
      return `<div class="mission"><div class="mission-top"><div class="mission-emoji">${m.emoji}</div><div><h3>${m.title}</h3><small>${m.desc}</small></div></div><div class="mission-reward">PRÊMIO: 🪙 ${money(m.coins)} &nbsp; 💎 ${money(m.gems)}</div><div class="progress-track"><div class="progress-fill" style="width:${p/m.need*100}%"></div></div><div class="mission-foot"><small>${money(p)} / ${money(m.need)}</small><button class="claim-btn" data-mission="${m.id}" ${!ready||done?'disabled':''}>${done?'✅ RESGATADO':ready?'🎁 RESGATAR':'🔒 EM PROGRESSO'}</button></div></div>`;
    }).join('');}
  function claimMission(id){
    const m=MISSIONS.find(m=>m.id===id);if(!m||save.claimed.includes(id)||missionProgress(m)<m.need)return;
    save.claimed.push(id);save.coins+=m.coins;save.gems+=m.gems;sounds.gem();notification(`🎁 ${m.title}: +${money(m.coins)} 🪙 e +${m.gems} 💎`);
    syncWallet();syncMissionNotices();renderMissions();persist();
  }
  function renderRecords(){const s=save.stats;const records=[['🏆','MAIOR DISTÂNCIA',`${money(s.best)} m`],['🚗','CORRIDAS',money(s.runs)],['🛞','CARROS DESVIADOS',money(s.dodged)],['🦘','PULOS',money(s.jumps)],['🗺️','DISTÂNCIA TOTAL',`${money(s.distance)} m`],['⏱️','TEMPO DIRIGINDO',timeFmt(s.seconds)],['🪙','MOEDAS COLETADAS',money(s.pickedCoins)],['💎','DIAMANTES COLETADOS',money(s.pickedGems)],['⚡','MELHOR COMBO',`x${money(s.maxCombo)}`]];
    $('recordsGrid').innerHTML=records.map(([emoji,label,v])=>`<div class="record-tile"><span>${emoji}</span><div><small>${label}</small><strong>${v}</strong></div></div>`).join(''); }
  function updateHUD(){
    $('distance').innerHTML=`${money(run.distance)} <small>m</small>`;$('time').textContent=timeFmt(run.time);$('dodged').textContent=money(run.dodged);$('combo').textContent=`x${Math.max(1,run.combo)}`;$('best').innerHTML=`${money(Math.max(save.stats.best,Math.floor(run.distance)))} <small>m</small>`;
    $('turboTimer').textContent=!save.upgrades.turbo?'BLOQUEADO':player.turbo>0?'ATIVO':player.turboCd>0?`${Math.ceil(player.turboCd)}s`:'PRONTO';
    $('turboBtn').disabled=!save.upgrades.turbo||state!=='running'||player.turboCd>0||player.turbo>0;
  }
  function overlays(){ $('menuOverlay').classList.toggle('show',state==='menu');$('pauseOverlay').classList.toggle('show',state==='paused');$('overOverlay').classList.toggle('show',state==='gameover'); }
  function resetPlayer(){player.z=0;player.vz=0;player.onGround=true;player.invuln=0;player.turbo=0;player.turboCd=0;player.shields=save.upgrades.escudo;player.tilt=0;player.wheels=0;}
  function startGame(){
    if(activeTab!=='jogar')tabSwitch('jogar');initAudio();run=newRun();resetPlayer();elapsed=0;introT=0;shake=0;particles=[];roadStreaks=[];camera=0;
    state='intro';save.stats.runs++;persist();overlays();$('stageStatus').textContent='🧍 BEAN ENTRANDO NO MINI';updateHUD();
    canvas.focus({preventScroll:true});
  }
  function beginRun(){state='running';$('stageStatus').textContent='🚗 EM CORRIDA';showBanner('🏁 BOA SORTE, BEAN!',1.15);sounds.skid();overlays();}
  function jump(){
    if(state==='menu'){startGame();return;}
    if(state==='gameover'){startGame();return;}
    if(state!=='running'||!player.onGround)return;
    player.vz=845+save.upgrades.suspensao*65;player.z=.1;player.onGround=false;run.jumps++;save.stats.jumps++;player.tilt=-.10;sounds.jump();
    burst(player.x+30,GROUND-14-player.z,'#c9d2d5',7,65);syncMissionNotices();
  }
  function turbo(){
    if(state!=='running')return;
    if(!save.upgrades.turbo){notification('⚡ Desbloqueie o Turbo do Teddy na garagem!','pink');sounds.error();return;}
    if(player.turbo>0||player.turboCd>0)return;
    player.turbo=2.4+save.upgrades.turbo*.5;player.turboCd=25-save.upgrades.turbo*2;sounds.turbo();showBanner('⚡ TURBO DO TEDDY!',1.1);shake=5;
  }
  function pause(){if(state!=='running'&&state!=='intro')return;state='paused';$('stageStatus').textContent='⏸ PAUSADO';overlays();}
  function resume(){if(state!=='paused')return;state=run.time===0&&introT<1.85?'intro':'running';$('stageStatus').textContent='🚗 EM CORRIDA';overlays();canvas.focus({preventScroll:true});}
  function goHome(){if(state==='running'||state==='paused'||state==='intro')finishRun(false);state='menu';overlays();$('stageStatus').textContent='🚗 PRONTO PARA PARTIR';tabSwitch('jogar');}
  function bump(){
    if(state!=='running'||player.invuln>0)return;
    if(player.turbo>0){player.invuln=.2;return;}
    if(player.shields>0){player.shields--;player.invuln=1.7;showBanner(`🛡️ ESCUDO SALVOU! (${player.shields} RESTANTES)`,1.1);sounds.skid();shake=9;burst(player.x+110,GROUND-60-player.z,'#b7faff',30,175);return;}
    state='crashing';crashT=0;shake=25;sounds.crash();burst(player.x+85,GROUND-47-player.z,'#ff8c31',75,280);burst(player.x+90,GROUND-51-player.z,'#ffdf61',45,210);burst(player.x+90,GROUND-53-player.z,'#536072',23,160);
    $('stageStatus').textContent='💥 O MINI EXPLODIU!'; if(navigator.vibrate)try{navigator.vibrate([80,40,180])}catch{}
    finishRun(true);
  }
  function finishRun(crashed){
    if(run.finalized)return;
    run.finalized=true;save.stats.best=Math.max(save.stats.best,Math.floor(run.distance));if(crashed)save.stats.crashes++;
    persist();syncMissionNotices();
    $('endDistance').textContent=`${money(run.distance)} m`;$('endDodged').textContent=money(run.dodged);$('endCoins').textContent=`+${money(run.coins)} 🪙`;$('endGems').textContent=`+${money(run.gems)} 💎`;
    const prevBest=run.distance>=save.stats.best&&run.distance>0;
    $('newRecord').hidden=!prevBest;
  }
  function gameOver(){state='gameover';$('stageStatus').textContent='💥 GAME OVER';overlays();persist();}
  function spawnObstacle(){
    const possibilities=[{kind:'sedan',w:133,h:66,color:'#fa6770'},{kind:'taxi',w:144,h:71,color:'#f8cf48'},{kind:'van',w:159,h:83,color:'#5caadb'},{kind:'truck',w:179,h:99,color:'#ec8454'},{kind:'police',w:139,h:74,color:'#d8e7ed'}];
    const pool=run.time<14?possibilities.slice(0,2):run.time<38?possibilities.slice(0,4):possibilities;
    const o={...pool[Math.floor(rnd(0,pool.length))],x:W+90,y:GROUND,passed:false};run.obstacles.push(o);
    // Coins are placed ahead of the obstacle so a well-timed jump collects them.
    if(Math.random()<.8){const amount=Math.random()<.27?4:3;for(let i=0;i<amount;i++)run.pickups.push({type:'coin',x:o.x+20+(i-amount/2)*46,altitude:111+Math.sin(i/(amount-1)*Math.PI)*57,r:15,t:0});}
    else if(Math.random()<.18)run.pickups.push({type:'gem',x:o.x+35,altitude:150,r:17,t:0});
  }
  function spawnFreePickups(){
    if(Math.random()<.14){run.pickups.push({type:'gem',x:W+80,altitude:95+Math.random()*110,r:17,t:0});return;}
    const elevation=Math.random()<.7?45:125;
    for(let i=0;i<5;i++)run.pickups.push({type:'coin',x:W+45+i*48,altitude:elevation+Math.sin(i/4*Math.PI)*25,r:13,t:0});
  }
  function rewardDodge(){
    run.dodged++;save.stats.dodged++;run.combo++;run.bestCombo=Math.max(run.bestCombo,run.combo);save.stats.maxCombo=Math.max(save.stats.maxCombo,run.combo);
    const reward=Math.round((3+Math.min(run.combo,10))*(1+save.upgrades.motor*.2));moneyGain(reward,'carro evitado');
    if(run.combo>=3&&run.combo%3===0){showBanner(`🔥 COMBO x${run.combo}! +${reward} 🪙`);sounds.banner();}
    syncMissionNotices();
  }
  function pickup(p){
    p.taken=true;if(p.type==='coin') {run.pickedCoins++;save.stats.pickedCoins++;moneyGain(10*(1+save.upgrades.motor*.2),'moeda');sounds.coin();burst(p.x,GROUND-p.altitude,'#ffdd61',13,95);}
    else {run.pickedGems++;save.stats.pickedGems++;gemGain(1,'diamante');sounds.gem();burst(p.x,GROUND-p.altitude,'#7ce3ff',16,100);showBanner('💎 +1 DIAMANTE!',.9);}
    syncMissionNotices();
  }
  function burst(x,y,color,n=16,v=150){
    for(let i=0;i<n;i++){const a=rnd(0,TAU),s=rnd(v*.18,v);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-rnd(15,80),life:rnd(.34,1),size:rnd(2,8),color,rot:rnd(0,TAU),vr:rnd(-8,8)});}
    if(particles.length>340)particles.splice(0,particles.length-340);
  }
  function updateParticles(dt){
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=150*dt;p.life-=dt;p.rot+=p.vr*dt;}
    particles=particles.filter(p=>p.life>0);
  }
  function update(dt){
    wall+=dt;
    if(bannerTimeout>0){bannerTimeout-=dt;if(bannerTimeout<=0)$('banner').classList.remove('active');}
    updateParticles(dt);shake=Math.max(0,shake-35*dt);
    if(state==='menu'){camera+=dt*48;return;}
    if(state==='intro'){introT+=dt;camera+=dt*25;if(introT>2.05)beginRun();return;}
    if(state==='crashing'){crashT+=dt;camera+=dt*42;if(crashT>1.75)gameOver();return;}
    if(state!=='running')return;
    run.time+=dt;save.stats.seconds+=dt;
    const baseSpeed=310+Math.min(run.time*.95,155);const speed=baseSpeed+(player.turbo>0?135:0);
    const move=speed*dt;
    camera+=move;
    const meter=move/9;run.distance+=meter;save.stats.distance+=meter;
    player.wheels+=speed*dt/20;
    player.invuln=Math.max(0,player.invuln-dt);
    player.turbo=Math.max(0,player.turbo-dt);
    player.turboCd=Math.max(0,player.turboCd-dt);
    if(player.turbo>0&&Math.random()<dt*50)burst(player.x-3,GROUND-28-player.z,'#fff0ad',1,80);
    if(!player.onGround){player.z+=player.vz*dt;player.vz-=(1580-save.upgrades.suspensao*28)*dt;
      if(player.z<=0){player.z=0;player.vz=0;player.onGround=true;player.tilt=.14;burst(player.x+39,GROUND-6,'#c7d7d4',8,64);sounds.skid();}}
    player.tilt+=(0-player.tilt)*Math.min(1,dt*7);
    // Time-based rewards, saved even if the player exits before crashing.
    run.coinTimer+=dt;run.gemTimer+=dt;
    if(run.coinTimer>=5){run.coinTimer-=5;moneyGain(Math.round(8*(1+save.upgrades.motor*.2)*(player.turbo>0?2:1)),'por tempo',true);sounds.coin();}
    if(run.gemTimer>=40){run.gemTimer-=40;gemGain(1,'bônus de tempo',true);sounds.gem();}
    run.spawnTimer-=dt;
    if(run.spawnTimer<=0){spawnObstacle();run.spawnTimer=rnd(2.04,2.8)*Math.max(.87,310/baseSpeed);}
    for(const o of run.obstacles){o.x-=move;
      if(!o.passed&&o.x+o.w<player.x+player.w*.45){o.passed=true;rewardDodge();}
      const hb={x:o.x+16,y:GROUND-o.h+11,w:o.w-34,h:o.h-24};
      const playerBox={x:player.x+19,y:GROUND-player.h-player.z+12,w:player.w-39,h:player.h-19};
      if(rectsOverlap(playerBox,hb)&&player.z<o.h-8){
        if(player.turbo>0){if(!o.hit){o.hit=true;burst(o.x+o.w/2,GROUND-o.h*.55,'#fceca5',17,130);moneyGain(12,'turbo');}}
        else if(!o.hit){o.hit=true;bump();run.combo=0;}
      }
    }
    run.obstacles=run.obstacles.filter(o=>o.x+o.w>-200);
    // Periodic collectible waves between obstacles.
    if(run.time>=run.milestone){run.milestone=run.time+rnd(4.4,6.3);spawnFreePickups();}
    for(const p of run.pickups){p.x-=move;p.t+=dt;
      const effectiveRange=save.upgrades.ima*31;
      const cy=GROUND-43-player.z;
      const py=GROUND-p.altitude;
      const dx=Math.abs(p.x-(player.x+player.w*.55));const dy=Math.abs(py-cy);
      if(dx<32+effectiveRange&&dy<49+effectiveRange){pickup(p);}
    }
    run.pickups=run.pickups.filter(p=>!p.taken&&p.x>-50);
    saveCountdown+=dt;if(saveCountdown>4){saveCountdown=0;persist();syncMissionNotices();}
    if(Math.random()<.005)roadStreaks.push({x:W+10,y:GROUND+30+rnd(0,55),w:rnd(23,90)});
    for(const s of roadStreaks)s.x-=move;roadStreaks=roadStreaks.filter(s=>s.x+s.w>0);
    updateHUD();
  }
  function fillRound(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function drawBackground(){
    const xcam=mod(camera,MAP_W*MAP_N);ctx.fillStyle='#9fe5f8';ctx.fillRect(0,0,W,H);
    const left=Math.floor(xcam/MAP_W)-1;
    for(let i=left;i<=left+3;i++){
      const idx=mod(i,MAP_N),im=images.bg[idx],x=i*MAP_W-xcam;
      if(im)ctx.drawImage(im,Math.floor(x),0,MAP_W+2,H);
      else {fillRound(x,0,MAP_W+1,H,0,'#a9e3f6');fillRound(x+30,120,850,260,0,'#edb7a1');}
    }
    // The separately painted road creates a collision ground on all 13 map tiles.
    fillRound(0,GROUND+6,W,H-GROUND,0,'#515e66');
    fillRound(0,GROUND+3,W,8,0,'#a3aeb7');
    fillRound(0,GROUND+14,W,3,0,'#6a7780');
    const stripes=mod(camera*.94,210);
    ctx.fillStyle='#f7f0d8';for(let x=-stripes;x<W;x+=210)fillRound(x,GROUND+74,99,5,2,'#f8f0da');
    for(const s of roadStreaks)fillRound(s.x,s.y,s.w,2,1,'#83929b');
  }
  function drawWheel(x,y,r,spin=0){
    ctx.fillStyle='#21252b';ctx.beginPath();ctx.arc(x,y,r+3,0,TAU);ctx.fill();
    ctx.strokeStyle='#7f8992';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,r*.63,0,TAU);ctx.stroke();
    ctx.fillStyle='#bfc7c7';ctx.beginPath();ctx.arc(x,y,r*.30,0,TAU);ctx.fill();
    ctx.strokeStyle='#d7dedb';ctx.lineWidth=2;
    for(let i=0;i<4;i++){const a=spin+i*Math.PI/2;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*4,y+Math.sin(a)*4);ctx.lineTo(x+Math.cos(a)*r*.66,y+Math.sin(a)*r*.66);ctx.stroke();}
  }
  function drawCar(x,y,w,h,color='#9cc652',kind='mini',rotation=0,driver=false){
    ctx.save();ctx.translate(x+w*.5,y+h*.53);ctx.rotate(rotation);ctx.translate(-w*.5,-h*.53);
    const scale=w/147;ctx.scale(scale,h/79);
    const width=147, height=79;
    if(kind==='truck'){
      fillRound(0,27,139,40,9,color);fillRound(12,2,67,46,8,color);
      fillRound(20,10,51,27,6,'#b8e3f4');fillRound(87,10,54,20,2,'#d1d8d8');
    }else if(kind==='van'){
      fillRound(6,10,126,55,12,color);fillRound(21,18,89,24,5,'#b5e2ed');fillRound(115,21,17,30,3,color);
    }else if(kind==='mini'){
      // Classic little green British car (custom canvas illustration).
      fillRound(17,15,104,43,13,'#ecf1e5');
      fillRound(36,5,75,45,12,'#1c2932');
      fillRound(40,8,66,37,8,'#bfdfdf');
      if(driver&&images.bean){ctx.save();ctx.beginPath();ctx.roundRect(43,8,63,37,8);ctx.clip();const im=images.bean;ctx.drawImage(im,0,0,im.width,im.height*.37,54,0,42,51);ctx.restore();}
      else if(driver){ctx.fillStyle='#edb693';ctx.beginPath();ctx.arc(75,33,17,0,TAU);ctx.fill();}
      fillRound(5,42,137,28,13,color);
      fillRound(11,39,126,14,6,'#aed776');
      ctx.strokeStyle='#54773f';ctx.lineWidth=2;ctx.strokeRect(82,42,1,20);
      fillRound(1,51,14,12,3,'#fff2c9');fillRound(136,52,10,12,2,'#b2c4bd');
      fillRound(8,67,128,4,2,'#30383a');
      ctx.strokeStyle='#bcc7d2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(30,21);ctx.lineTo(30,39);ctx.stroke();
    } else {
      fillRound(8,25,131,40,13,color);fillRound(28,7,83,42,12,color);
      fillRound(35,13,67,29,6,'#b8e0ed');
      ctx.strokeStyle='#56778f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(73,14);ctx.lineTo(73,41);ctx.stroke();
      fillRound(6,48,16,11,4,'#ffe6a3');fillRound(133,47,10,12,3,'#c6d0d8');
      if(kind==='taxi'){fillRound(55,0,38,13,4,'#fdf4cd');ctx.fillStyle='#333';ctx.font='bold 10px sans-serif';ctx.fillText('TAXI',59,10);}
      if(kind==='police'){fillRound(56,0,40,11,4,'#d8ecfa');fillRound(57,2,17,7,2,'#ff6575');fillRound(78,2,16,7,2,'#4b9afa');}
    }
    ctx.globalAlpha=.98;
    drawWheel(37,67,12,player.wheels*(kind==='mini'?1:.8));drawWheel(112,67,12,player.wheels*(kind==='mini'?1:.8));
    ctx.restore();
  }
  function drawPlayer(){
    const x=player.x,y=GROUND-player.h-player.z;
    if(state==='crashing')return;
    ctx.save();
    if(player.invuln>0&&Math.sin(wall*33)>0.1)ctx.globalAlpha=.55;
    ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(x+player.w*.52,GROUND+3,58*Math.max(.55,1-player.z*.0025),9,0,0,TAU);ctx.fill();
    if(player.turbo>0){ctx.fillStyle='#fff7a0bb';for(let i=0;i<7;i++)fillRound(x-17-i*25+rnd(-3,3),y+43+rnd(-13,13),rnd(14,45),3,2,'#ffe781');}
    drawCar(x,y,player.w,player.h,'#8ec64a','mini',player.tilt+Math.sin(wall*18)*.007,true);
    if(player.shields>0||player.invuln>0){ctx.strokeStyle=player.invuln>0?'#a0eeffb0':'#80b8ff88';ctx.lineWidth=2+(Math.sin(wall*8)+1);ctx.beginPath();ctx.ellipse(x+player.w*.5,y+player.h*.5,player.w*.59,player.h*.85,0,0,TAU);ctx.stroke();}
    ctx.restore();
  }
  function drawCoin(x,y,r,t){
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(wall*4+t)*.10);const v=Math.max(.22,Math.abs(Math.cos(wall*4+t)));
    ctx.scale(v,1);ctx.fillStyle='#bf7c1a';ctx.beginPath();ctx.arc(0,1,r+2,0,TAU);ctx.fill();
    ctx.fillStyle='#ffda53';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();
    ctx.strokeStyle='#ffe98a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r*.75,0,TAU);ctx.stroke();
    ctx.fillStyle='#a66a10';ctx.font=`900 ${r*1.2}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('B',0,0);ctx.restore();
  }
  function drawGem(x,y,r,t){ctx.save();ctx.translate(x,y+Math.sin(wall*5+t)*4);ctx.shadowColor='#4fe8ff';ctx.shadowBlur=14;
    ctx.fillStyle='#60e0fa';ctx.strokeStyle='#e1fcff';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(-r*.55,-r*.75);ctx.lineTo(r*.6,-r*.75);ctx.lineTo(r,0);ctx.lineTo(0,r);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;ctx.strokeStyle='#b9f5ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.moveTo(-r*.55,-r*.75);ctx.lineTo(0,r);ctx.lineTo(r*.6,-r*.75);ctx.stroke();ctx.restore();}
  function drawPickups(){for(const p of run.pickups){if(p.taken||p.x<-40||p.x>W+40)continue;
    if(p.type==='coin')drawCoin(p.x,GROUND-p.altitude+Math.sin(wall*5+p.t)*3,p.r,p.t);else drawGem(p.x,GROUND-p.altitude,p.r,p.t);
  }}
  function drawObstacles(){for(const o of run.obstacles){
    if(o.x<-200||o.x>W+200)continue;
    ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(o.x+o.w*.55,GROUND+3,o.w*.4,8,0,0,TAU);ctx.fill();
    drawCar(o.x,GROUND-o.h,o.w,o.h,o.color,o.kind,Math.sin(wall*13+o.x)*.007,false);
  }}
  function drawEffects(){
    for(const p of particles){ctx.save();ctx.globalAlpha=clamp(p.life*1.6,0,1);ctx.translate(p.x,p.y);ctx.rotate(p.rot);fillRound(-p.size*.5,-p.size*.5,p.size,p.size*.64,1,p.color);ctx.restore();}
    if(state==='crashing'){
      const x=player.x+73,y=GROUND-45-player.z,r=20+Math.sin(crashT*25)*9;
      if(crashT<.76){ctx.globalAlpha=clamp(1-crashT*.8,0,1);
        for(let i=0;i<9;i++){const a=i*TAU/9+wall*.7,dr=r+Math.sin(i*13)*8;ctx.fillStyle=i%2?'#ffb526':'#ffeb9b';ctx.beginPath();ctx.arc(x+Math.cos(a)*dr,y+Math.sin(a)*dr,rnd(15,27),0,TAU);ctx.fill();}
        ctx.fillStyle='#fff9c4';ctx.beginPath();ctx.arc(x,y,r+12,0,TAU);ctx.fill();}
      ctx.globalAlpha=1;
      for(let i=0;i<6;i++){const a=i*1.1;ctx.globalAlpha=clamp(.6-crashT*.32,0,.6);ctx.fillStyle='#41515e';ctx.beginPath();ctx.arc(x+Math.cos(a)*crashT*75,y-35-crashT*40+Math.sin(a)*12,19+crashT*22,0,TAU);ctx.fill();}
      ctx.globalAlpha=1;
    }
  }
  function drawRunUI(){
    if(!['running','paused','crashing','intro'].includes(state))return;
    const shields=player.shields;
    fillRound(13,GROUND-78,shields?90:80,36,11,'#12283bc7');
    ctx.font='bold 14px Nunito, sans-serif';ctx.fillStyle='#e6f7fd';ctx.fillText(`🛡️ ${shields}`,25,GROUND-54);
    if(player.turbo>0){fillRound(365,GROUND-115,226,19,9,'#142a41d9');fillRound(368,GROUND-112,220*player.turbo/(2.4+save.upgrades.turbo*.5),13,7,'#fff36f');ctx.fillStyle='#1d2a29';ctx.font='900 11px Nunito,sans-serif';ctx.textAlign='center';ctx.fillText('⚡ TURBO',475,GROUND-102);ctx.textAlign='start';}
    if(state==='intro'){
      const t=clamp(introT/1.7,0,1);
      const bean=images.bean;
      if(bean){const px=player.x-160+145*t,py=GROUND-116;
        ctx.save();ctx.globalAlpha=1-t*.6;ctx.drawImage(bean,px,py,71,116);ctx.restore();}
      ctx.fillStyle='#fff';ctx.font='900 24px Baloo 2,sans-serif';ctx.textAlign='center';ctx.shadowColor='#102c39';ctx.shadowBlur=8;ctx.fillText(introT<1?'O Bean encontrou o Mini!':'Entrando no carro...',W/2,144);ctx.shadowBlur=0;ctx.textAlign='start';
    }
  }
  function render(){
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);
    if(shake>0){ctx.translate(rnd(-shake,shake),rnd(-shake*.5,shake*.5));}
    drawBackground();
    if(state==='menu'){
      drawCar(164,GROUND-78,147,79,'#8ec64a','mini',0,true);
      drawCar(780,GROUND-69,142,72,'#f7c45e','taxi');
      if(images.bean)ctx.drawImage(images.bean,60,GROUND-140,80,140);
      drawCoin(630,GROUND-170,15,0);drawGem(726,GROUND-195,17,0);
    } else {
      drawPickups();drawObstacles();drawPlayer();drawEffects();drawRunUI();
    }
    ctx.restore();
  }
  function loop(now){
    const dt=Math.min(.034,((now-last)||16.7)/1000);last=now;
    try {if(state!=='paused'&&state!=='gameover')update(dt);engineUpdate(dt);render();}
    catch(e){console.error('Erro no jogo:',e);}
    requestAnimationFrame(loop);
  }
  function onKey(e){
    const code=e.code;
    if(['Space','ArrowUp','KeyX','KeyP','Escape'].includes(code))e.preventDefault();
    if(e.repeat)return;
    if(code==='Space'||code==='ArrowUp'||code==='KeyW'){if(activeTab==='jogar')jump();}
    else if(code==='KeyX'){if(activeTab==='jogar')turbo();}
    else if(code==='KeyP'||code==='Escape') {if(state==='paused')resume();else pause();}
    else if(code==='KeyM'){$('soundBtn').click();}
  }
  function setupUI(){
    document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>tabSwitch(b.dataset.tab)));
    $('shopGrid').addEventListener('click',e=>{const b=e.target.closest('[data-upgrade]');if(b)buyUpgrade(b.dataset.upgrade);});
    $('missionList').addEventListener('click',e=>{const b=e.target.closest('[data-mission]');if(b)claimMission(b.dataset.mission);});
    $('startBtn').addEventListener('click',startGame);$('retryBtn').addEventListener('click',startGame);
    $('resumeBtn').addEventListener('click',resume);$('quitBtn').addEventListener('click',goHome);$('homeBtn').addEventListener('click',goHome);
    $('pauseBtn').addEventListener('click',()=>state==='paused'?resume():pause());
    $('jumpBtn').addEventListener('pointerdown',e=>{e.preventDefault();initAudio();jump();});
    $('turboBtn').addEventListener('pointerdown',e=>{e.preventDefault();initAudio();turbo();});
    canvas.addEventListener('pointerdown',e=>{if(state==='running'){e.preventDefault();jump();}});
    $('soundBtn').addEventListener('click',()=>{save.sound=!save.sound;persist();initAudio();$('soundBtn').textContent=save.sound?'🔊':'🔇';notification(save.sound?'🔊 Som ligado':'🔇 Som desligado','blue');});
    const helpOpen=()=>{$('helpDialog').hidden=false;};const helpClose=()=>{$('helpDialog').hidden=true;};
    $('helpBtn').addEventListener('click',helpOpen);$('helpBackdrop').addEventListener('click',helpClose);$('helpClose').addEventListener('click',helpClose);$('helpOK').addEventListener('click',helpClose);
    window.addEventListener('keydown',onKey,{passive:false});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
    window.addEventListener('pagehide',persist);
    // Do not navigate when clicking the decorative brand.
    document.querySelector('.logo').addEventListener('click',e=>{e.preventDefault();goHome();});
    $('soundBtn').textContent=save.sound?'🔊':'🔇';
    syncWallet();syncMissionNotices();updateHUD();overlays();
  }
  setupUI();requestAnimationFrame(loop);
  // Read-only diagnostics for smoke tests; not a gameplay cheat API.
  Object.defineProperty(window,'miniRushStatus',{get:()=>Object.freeze({state,distance:Math.floor(run.distance),coins:save.coins,gems:save.gems,jumps:run.jumps,dodged:run.dodged,shields:player.shields,obstacles:run.obstacles.length,images:images.bg.filter(Boolean).length})});
})();