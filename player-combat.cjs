'use strict';
const BAT_RANGE=6.5,BAT_COOLDOWN=650,HIT_PROTECTION=0;
function swingBat(attacker,players,world,now=Date.now()){
 if(attacker.weapon!=='bat'||attacker.heldEgg)return {ok:false,reason:'Equipe o bastão e fique com as mãos livres.'};
 if(attacker.lastSwing!==undefined&&now-attacker.lastSwing<BAT_COOLDOWN)return {ok:false,reason:'Espere o próximo golpe.'};
 attacker.lastSwing=now;
 let target=null,distance=Infinity;
 for(const player of players){
  if(player===attacker||!player.heldEgg||Math.abs((player.y||0)-(attacker.y||0))>3)continue;
  const dx=player.x-attacker.x,dz=player.z-attacker.z,d=Math.hypot(dx,dz);
  if(d>BAT_RANGE||d>=distance)continue;
  target=player;distance=d;
 }
 if(!target)return {ok:true,target:null,egg:null};
 const egg=world.drop(target);if(!egg)return {ok:true,target:null,egg:null};
 target.hitProtectedUntil=now+HIT_PROTECTION;
 return {ok:true,target,egg};
}
module.exports={swingBat,BAT_RANGE,BAT_COOLDOWN,HIT_PROTECTION};
