'use strict';
// Crédito de treino AFK ao minimizar o jogo, mantendo a chave principal do save intacta.
(()=>{
 const KEY='rue3d_training_away_v1',MAX_SECONDS=12*60*60;
 const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}};
 const clear=()=>{try{localStorage.removeItem(KEY)}catch(e){}};
 const rate=()=>{
  const r=Number(TM[S.tm]?.[1])*Number(CFG.train)*(typeof abuseTrainMult==='function'?Number(abuseTrainMult()):1);
  return Number.isFinite(r)&&r>0?Math.min(r,1e45):0;
 };
 const checkpoint=()=>{
  if(!P.train){clear();return}
  if(load()?.pid===S.pid)return;
  try{save();localStorage.setItem(KEY,JSON.stringify({pid:S.pid,at:Date.now(),rate:rate()}))}catch(e){}
 };
 const credit=()=>{
  const d=load();if(!d)return;
  clear();
  if(d.pid!==S.pid||!Number.isFinite(d.at)||!Number.isFinite(d.rate)||d.rate<=0)return;
  const seconds=Math.max(0,Math.min(MAX_SECONDS,(Date.now()-d.at)/1000));
  if(seconds<1)return;
  const earned=seconds*Math.min(1e45,d.rate);
  if(!Number.isFinite(earned)||!Number.isFinite(S.sp+earned))return;
  S.sp+=earned;save();
  try{toast('🏃 Treino AFK: +'+fm(earned)+' de velocidade!')}catch(e){}
 };
 // Permitir recuperar a velocidade após fechar ou reabrir o navegador.
 credit();
 document.addEventListener('visibilitychange',()=>{if(document.hidden)checkpoint();else credit()});
 addEventListener('pagehide',checkpoint);
 setInterval(()=>{if(!document.hidden&&!P.train&&load())clear()},1800);
})();
