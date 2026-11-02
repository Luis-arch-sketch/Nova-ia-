'use strict';
/* Matemática central da máquina de fusão: mesmo código no navegador e testes Node. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.RoubeOvoFusionRules=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 const chance=.5;
 const valid=x=>Number.isFinite(x)&&x>=0;
 function price(speciesIncome,attempts){
  const base=Math.max(1000,valid(Number(speciesIncome))?Number(speciesIncome)*100:1000);
  const multiplier=Math.pow(1.4,Math.max(0,Math.min(40,Number(attempts)||0)));
  return Math.ceil(Math.min(1e96,base*multiplier));
 }
 function roll(random=Math.random){return random()<chance}
 function bestIndex(items){return items.reduce((idx,x,i)=>Number(x.s)>Number(items[idx].s)||Number(x.s)===Number(items[idx].s)&&Number(x.z)>Number(items[idx].z)?i:idx,0)}
 function nextSpecies(s,validSpecies){
  if(!Number.isInteger(s)||s<0||s>103)return s;
  for(let i=s+1;i<=103;i++)if(validSpecies(i))return i;
  return s;
 }
 function reward(items,validSpecies){
  const best=items[bestIndex(items)],size=Math.min(4,(Number(best.z)||0)+1);
  const better=nextSpecies(Number(best.s),validSpecies||(()=>true));
  return {s:better,z:size};
 }
 return {chance,price,roll,reward};
});
