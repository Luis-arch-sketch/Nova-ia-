'use strict';
class RadioactiveRaid {
 constructor(random=Math.random){this.x=0;this.z=-300;this.maxHp=10000;this.hp=10000;this.respawnAt=0;this.damage=new Map();this.wallets=new Map();this.random=random}
 state(now=Date.now()){return {type:'raid-state',hp:this.hp,maxHp:this.maxHp,respawnAt:this.respawnAt,eggPrice:80,serverNow:now,x:this.x,z:this.z}}
 wallet(id,access){const row=this.wallets.get(id)||{balance:0,seq:0};return {candies:row.balance,raidWalletToken:access.sign({kind:'raid-wallet',id,balance:row.balance,seq:row.seq})}}
 restore(id,token,access){const d=access.verify(token,'raid-wallet'),old=this.wallets.get(id);if(d&&d.id===id&&Number.isSafeInteger(d.balance)&&d.balance>=0&&d.balance<=1000000000&&Number.isSafeInteger(d.seq)&&d.seq>=0&&(!old||d.seq>old.seq))this.wallets.set(id,{balance:d.balance,seq:d.seq});return this.wallet(id,access)}
 award(id,amount){const row=this.wallets.get(id)||{balance:0,seq:0};row.balance=Math.min(1000000000,row.balance+amount);row.seq++;this.wallets.set(id,row)}
 canBuy(id){return (this.wallets.get(id)?.balance||0)>=80}
 spend(id){if(!this.canBuy(id))return false;const row=this.wallets.get(id);row.balance-=80;row.seq++;return true}
 roll(){const n=this.random();return n<.000005?7:n<.050005?6:n<.300005?5:1+Math.floor(this.random()*4)}
 hit(player,now=Date.now()){
  if(player.weapon!=='radioactive-bat')return {ok:false,reason:'Equipe o bastao radioativo no inventario.'};
  if(Math.hypot(player.x-this.x,player.z-this.z)>15)return {ok:false,reason:'Chegue mais perto do monstro.'};
  if(this.hp<=0)return {ok:false,reason:'O monstro esta se regenerando.'};
  if(now-(player.lastRaidHit||0)<650)return {ok:false,reason:'Aguarde o proximo golpe.'};
  player.lastRaidHit=now;const dealt=Math.min(50,this.hp);this.hp-=dealt;
  this.damage.set(player.principal,(this.damage.get(player.principal)||0)+dealt);
  if(this.hp>0)return {ok:true,dealt,defeated:false,awards:[]};
  this.respawnAt=now+120000; // Próxima batalha dois minutos após a vitória
  const awards=[...this.damage].map(([id,damage])=>({id,candies:25+Math.floor(damage/50)}));
  for(const r of awards)this.award(r.id,r.candies);
  this.damage.clear();return {ok:true,dealt,defeated:true,awards};
 }
 tick(now=Date.now()){if(this.hp===0&&now>=this.respawnAt){this.hp=this.maxHp;this.respawnAt=0;return true}return false}
}
module.exports={RadioactiveRaid};
