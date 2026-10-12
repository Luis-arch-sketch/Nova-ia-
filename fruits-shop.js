/* Vendedor de frutas do Roube um Ovo 3D.
   Executado no escopo do jogo após a criação da cena, antes do primeiro frame. */
const FRUIT_VENDOR_POS = {x:6,z:-7};
const FRUIT_CATALOG = Object.freeze({
 pear:{name:'Pera da Sombra',emoji:'🍐',price:50_000_000_000,mult:5,voice:'pear'},
 apple:{name:'Maçã',emoji:'🍎',price:1_000_000_000_000,mult:15,voice:'apple'}
});
/* Frutas temporárias: 30 minutos reais por compra, mesmo offline. */
const FRUIT_DURATION_MS=30*60*1000;
const fruitKeyFor=v=>Number(v)===5?'pear':Number(v)===15?'apple':null;
const fruitTimeLeft=key=>Math.max(0,(Number(S.fruitTimers?.[key])||0)-Date.now());
const fruitClock=ms=>{
 const sec=Math.ceil(Math.max(0,ms)/1000);
 return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
};
const fruitSpeedMult=()=>{
 const key=fruitKeyFor(S.fruitBoost);
 return key&&fruitTimeLeft(key)>0?FRUIT_CATALOG[key].mult:1;
};
if(!S.fruitTimersV2){
 const old=Array.isArray(S.fruitOwned)?S.fruitOwned:[];
 const now=Date.now();
 S.fruitTimers={
  pear:old.includes('pear')?now+FRUIT_DURATION_MS:0,
  apple:old.includes('apple')?now+FRUIT_DURATION_MS:0
 };
 S.fruitTimersV2=true;
 save();
}
if(!S.fruitTimers||typeof S.fruitTimers!=='object')S.fruitTimers={pear:0,apple:0};
for(const key of Object.keys(FRUIT_CATALOG)){
 const n=Number(S.fruitTimers[key]);
 S.fruitTimers[key]=Number.isFinite(n)&&n>Date.now()?n:0;
}
if(!fruitKeyFor(S.fruitBoost)||fruitSpeedMult()===1)S.fruitBoost=1;

/* Render carrega os arquivos gravados em /voices/fruits/. Se estiverem ausentes,
   a fala continua acessível pelo sintetizador português do Android. */
const FRUIT_VOICES={
 hello:{url:'/voices/fruits/saudacao.mp3',text:'E aí, cara, qual fruta você quer? Aqui é baratinho.'},
 options:{url:'/voices/fruits/opcoes.mp3',text:'Tem a pera da sombra e a maçã.'},
 pear:{url:'/voices/fruits/pera.mp3',text:'A pera está cinquenta bilhões.'},
 apple:{url:'/voices/fruits/maca.mp3',text:'E a maçã, um trilhão.'},
 prices:{url:'/voices/fruits/precos.mp3',text:'Qual você quer? A pera está cinquenta bilhões e a maçã está um trilhão.'}
};
let fruitAudio=null,fruitSpeaking=false;
function speakFruit(which){
 const v=FRUIT_VOICES[which];if(!v)return;
 if(fruitAudio){try{fruitAudio.pause()}catch(e){}fruitAudio=null;}
 if(window.speechSynthesis){try{speechSynthesis.cancel()}catch(e){}}
 let fallbackCalled=false;
 const fallback=()=>{
  if(fallbackCalled)return;fallbackCalled=true;
  if(!window.speechSynthesis)return;
  try{
   const u=new SpeechSynthesisUtterance(v.text);u.lang='pt-BR';u.rate=.92;u.pitch=.74;u.volume=.95;
   const avail=speechSynthesis.getVoices();
   u.voice=avail.find(q=>/^pt[-_]BR$/i.test(q.lang)&&/male|masculino|daniel|ricardo|antonio/i.test(q.name))
          ||avail.find(q=>/^pt[-_]BR$/i.test(q.lang))||null;
   speechSynthesis.speak(u);
  }catch(e){}
 };
 try{
  // As cinco falas originais enviadas pelo criador estão em um único Ogg Opus.
  // Posições: saudação, opções, pera, maçã e preços.
  const seg={hello:[0,3.50],options:[3.724,5.786],pear:[6.008,8.216],
             apple:[8.436,10.186],prices:[10.408,15.349]}[which];
  if(!seg){fallback();return}
  const player=new Audio('/voices/fruits/sprite.ogg');
  fruitAudio=player;player.volume=.9;player.preload='auto';
  player.addEventListener('loadedmetadata',()=>{
    try{player.currentTime=seg[0]}catch(e){fallback()}
  },{once:true});
  player.addEventListener('timeupdate',()=>{
    if(player.currentTime>=seg[1]-0.07){player.pause()}
  });
  player.addEventListener('error',fallback,{once:true});
  const attempt=player.play();
  if(attempt&&attempt.catch)attempt.catch(fallback);
 }catch(e){fallback()}
}
const fruitVendorGroup=new T.Group();
fruitVendorGroup.position.set(FRUIT_VENDOR_POS.x,0,FRUIT_VENDOR_POS.z);
sc.add(fruitVendorGroup);
const FV=(geom,color,scale,where)=>mk(geom,color,scale,fruitVendorGroup,where);
FV(GB,0x6d4326,[5.8,.34,2.6],[0,1.18,0]);
FV(GB,0x9b5f35,[5.6,1.15,2.2],[0,.52,0]);
FV(GB,0x2d1e18,[.45,3,.45],[-2.55,1.65,-1.1]);
FV(GB,0x2d1e18,[.45,3,.45],[2.55,1.65,-1.1]);
FV(GB,0xe54b49,[6.5,.27,3.2],[0,3.13,0]);
for(let i=-2;i<=2;i++)FV(GB,i%2?0xf2f0da:0xb3213b,[1.19,.17,3.3],[i*1.25,3.0,0]);
FV(GB,0xffffff,[2.5,2.3,.12],[0,2.55,-1.2]);
const fruitBoard=label('🍐 FRUTAS 🍎',512,96,5.3);fruitBoard.position.set(0,4.1,1.2);fruitVendorGroup.add(fruitBoard);
/* NPC com barba e avental */
FV(GB,0x293b40,[.64,1.1,.48],[0,1.8,.75]);
FV(GB,0x6c9c40,[.5,.8,.49],[0,1.95,1.04]);
FV(GS,0xc48c62,[.39,.44,.35],[0,2.67,.75]);
FV(GS,0x38241b,[.33,.32,.32],[0,2.52,.95]);
FV(GB,0x2b201a,[.81,.14,.75],[0,3.05,.73]);
FV(GB,0x4d382a,[.32,.77,.3],[-.2,.72,.7]);
FV(GB,0x4d382a,[.32,.77,.3],[.2,.72,.7]);
FV(GB,0xc48c62,[.18,.85,.23],[-.44,1.83,.77]);
FV(GB,0xc48c62,[.18,.85,.23],[.44,1.83,.77]);
for(const off of [-.12,.12])FV(GS,0x181513,[.045,.045,.05],[off,2.72,1.065]);
for(let i=0;i<4;i++){
 const x=-1.95+(i%2)*.85,z=-.12+Math.floor(i/2)*.5;
 FV(GS,0xc8242a,[.25,.26,.24],[x,1.49,z]);FV(GC,0x2b9644,[.08,.2,.1],[x,1.76,z]);
}
for(let i=0;i<4;i++){
 const x=.95+(i%2)*.8,z=-.12+Math.floor(i/2)*.5;
 FV(GS,0x4f783b,[.23,.34,.22],[x,1.52,z]);FV(GC,0x2d8841,[.08,.19,.1],[x,1.88,z]);
}
const fruitTag=label('🍎 BARRACA DE FRUTAS 🍐',640,90,7.3);
fruitTag.position.set(0,5.6,0);fruitVendorGroup.add(fruitTag);

/* UI segura para Android: mostra saldo, preço e bônus; mantém os outros menus. */
const fruitCss=document.createElement('style');
fruitCss.textContent='#fruitShopMask{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:#030e13b7;z-index:95;touch-action:pan-y;padding:12px;box-sizing:border-box}#fruitShopModal{width:min(440px,100%);max-height:88dvh;overflow:auto;touch-action:pan-y;background:linear-gradient(155deg,#25492f,#142720);color:white;border:3px solid #b7f084;border-radius:19px;padding:15px;box-shadow:0 20px 60px #000c;font:600 15px system-ui,sans-serif}#fruitShopModal button{cursor:pointer;touch-action:manipulation}#fruitShopClose{float:right;background:#493d35;color:white}#fruitShopModal h2{font-size:20px;margin:4px 0 7px}#fruitShopModal p{margin:7px 0}#fruitShopGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}#fruitShopGrid button{background:#eeffd9;color:#18251a;padding:14px 8px;min-height:112px;display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center;line-height:1.35}#fruitShopGrid button:disabled{opacity:.75}#fruitShopFoot{font-size:13px;color:#d8efd5}#fruitShopQuick{position:fixed;right:12px;bottom:175px;z-index:15;background:#f5dd7a;color:#273326;padding:8px 10px;min-height:40px;border:2px solid #6c915a;border-radius:11px;font-size:13px;display:none}@media(max-width:390px){#fruitShopGrid{gap:7px}#fruitShopGrid button{font-size:13px;padding:9px 4px}}';
document.head.appendChild(fruitCss);
const fruitMask=document.createElement('div');fruitMask.id='fruitShopMask';
fruitMask.innerHTML='<section id="fruitShopModal" role="dialog" aria-modal="true" aria-label="Vendedor de frutas"><button id="fruitShopClose" type="button">✕</button><h2>🍐🍎 Vendedor de Frutas</h2><p>“E aí, cara, qual fruta você quer? Aqui é baratinho!”</p><p id="fruitShopMoney"></p><div id="fruitShopGrid"></div><p id="fruitShopFoot">⏱️ Cada fruta dura 30 minutos em tempo real. Depois, compre novamente.</p><button id="fruitShopHear" type="button">🔊 Ouvir vendedor</button></section>';
document.body.appendChild(fruitMask);
const fruitQuick=document.createElement('button');
fruitQuick.id='fruitShopQuick';fruitQuick.textContent='🍎 Barraca';fruitQuick.style.display='block';
document.body.appendChild(fruitQuick);
const fruitOpen=()=>fruitMask.style.display==='flex';
function closeFruitShop(){
 fruitMask.style.display='none';
}
function fruitRefresh(){
 fruitUpdateCountdown();
 const grid=document.getElementById('fruitShopGrid');grid.textContent='';
 for(const [key,f] of Object.entries(FRUIT_CATALOG)){
  const remaining=fruitTimeLeft(key),equipped=S.fruitBoost===f.mult&&remaining>0;
  const btn=document.createElement('button');btn.type='button';
  const n=document.createElement('strong');n.textContent=f.emoji+' '+f.name;
  const e=document.createElement('span');e.textContent='⚡ '+f.mult+'× • 30 minutos';
  const p=document.createElement('span');
  p.textContent=remaining>0?(equipped?'✅ Ativa • '+fruitClock(remaining):'🎒 Equipar • '+fruitClock(remaining)):'💰 $'+fm(f.price);
  btn.append(n,e,p);
  if(equipped)btn.disabled=true;
  else btn.addEventListener('click',()=>fruitBuy(key));
  grid.append(btn);
 }
}

function openFruitShop(){
 if(adminVisible)return;
 fruitRefresh();fruitMask.style.display='flex';
 speakFruit('hello');
}
function fruitBuy(key){
 const f=FRUIT_CATALOG[key];if(!f)return;
 const left=fruitTimeLeft(key);
 if(S.fruitBoost===f.mult&&left>0){toast('⏱️ '+f.name+' por mais '+fruitClock(left));return}
 if(left<=0){
  if(!Number.isFinite(S.$)||S.$<f.price){
   speakFruit(f.voice);toast('💰 Precisa de $'+fm(f.price)+' para comprar '+f.name);return;
  }
  S.$-=f.price;
  S.fruitTimers[key]=Date.now()+FRUIT_DURATION_MS;
 }
 S.fruitBoost=f.mult;
 save();upHud();fruitRefresh();fruitUpdateCountdown();beep(680,.16);
 speakFruit(f.voice);
 toast(f.emoji+' '+f.name+' • '+f.mult+'× por '+fruitClock(fruitTimeLeft(key)));
}
/* Cronômetro na tela também com a loja fechada. */
const fruitTimerBadge=document.createElement('div');
fruitTimerBadge.id='fruitBuffCountdown';
fruitTimerBadge.setAttribute('role','status');
fruitTimerBadge.style.cssText='position:fixed;left:8px;bottom:175px;z-index:14;max-width:56vw;padding:7px 11px;border-radius:10px;background:#204e36e8;color:#fff2bd;border:1px solid #bdf084;font:800 13px system-ui,sans-serif;pointer-events:none;display:none';
document.body.appendChild(fruitTimerBadge);
function fruitUpdateCountdown(){
 const key=fruitKeyFor(S.fruitBoost),time=key?fruitTimeLeft(key):0;
 fruitTimerBadge.style.display=time>0?'block':'none';
 if(time>0)fruitTimerBadge.textContent=FRUIT_CATALOG[key].emoji+' '+FRUIT_CATALOG[key].mult+'× • '+fruitClock(time);
 const balance=document.getElementById('fruitShopMoney');
 if(balance&&fruitOpen())balance.textContent='💰 Saldo $'+moneyView()+' • Velocidade '+fruitSpeedMult()+'× • '+(time>0?fruitClock(time):'sem bônus');
}
function fruitExpireAndUpdate(){
 const now=Date.now();let changed=false,wasActive=false;
 for(const key of Object.keys(FRUIT_CATALOG)){
  const expiry=Number(S.fruitTimers[key])||0;
  if(expiry>0&&expiry<=now){
   S.fruitTimers[key]=0;changed=true;
   if(S.fruitBoost===FRUIT_CATALOG[key].mult){S.fruitBoost=1;wasActive=true}
  }
 }
 if(changed){
  save();upHud();if(fruitOpen())fruitRefresh();
  if(wasActive)toast('⏰ O efeito da fruta terminou! Velocidade normal.');
 }
 fruitUpdateCountdown();
}
fruitExpireAndUpdate();
setInterval(fruitExpireAndUpdate,1000);

fruitQuick.addEventListener('click',openFruitShop);
document.getElementById('fruitShopClose').addEventListener('click',closeFruitShop);
document.getElementById('fruitShopHear').addEventListener('click',()=>speakFruit('prices'));
fruitMask.addEventListener('click',e=>{if(e.target===fruitMask)closeFruitShop()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&fruitOpen()){e.preventDefault();closeFruitShop()}});
let fruitUiCounter=0;
setInterval(()=>{
 if(document.hidden)return;
 const nearby=near(FRUIT_VENDOR_POS.x,FRUIT_VENDOR_POS.z,9);
 const meters=Math.round(Math.hypot(P.x-FRUIT_VENDOR_POS.x,P.z-FRUIT_VENDOR_POS.z));
 fruitQuick.style.display=fruitOpen()?'none':'block';
 fruitQuick.textContent=nearby?'🍎 Comprar frutas':'🍎 Barraca • '+meters+'m';
 if(nearby&&fruitUiCounter++%5===0)fruitTag.set('🍎 BARRACA DE FRUTAS 🍐');
},600);
