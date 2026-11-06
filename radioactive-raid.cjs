'use strict';
class RadioactiveRaid {
 constructor(random=Math.random){this.x=0;this.z=-1140;this.maxHp=10000;this.hp=10000;this.respawnAt=0;this.damage=new Map();this.wallets=new Map();this.random=random;this.attack=null;this.attackNumber=0;this.nextAttackAt=Date.now()+5000}
 state(now=Date.now()){return {type:'raid-state',hp:this.hp,maxHp:this.maxHp,respawnAt:this.respawnAt,portalOpen:this.hp>0,eggPrice:80,serverNow:now,x:this.x,z:this.z}}
 wallet(id,access){const row=this.wallets.get(id)||{balance:0,seq:0};return {candies:row.balance,raidWalletToken:access.sign({kind:'raid-wallet',id,balance:row.balance,seq:row.seq})}}
 restore(id,token,access){const d=access.verify(token,'raid-wallet'),old=this.wallets.get(id);if(d&&d.id===id&&Number.isSafeInteger(d.balance)&&d.balance>=0&&d.balance<=1000000000&&Number.isSafeInteger(d.seq)&&d.seq>=0&&(!old||d.seq>old.seq))this.wallets.set(id,{balance:d.balance,seq:d.seq});return this.wallet(id,access)}
 award(id,amount){const row=this.wallets.get(id)||{balance:0,seq:0};row.balance=Math.min(1000000000,row.balance+amount);row.seq++;this.wallets.set(id,row)}
 canBuy(id){return (this.wallets.get(id)?.balance||0)>=80}
 spend(id){if(!this.canBuy(id))return false;const row=this.wallets.get(id);row.balance-=80;row.seq++;return true}
 roll(){const n=this.random();return n<.000005?7:n<.050005?6:n<.300005?5:1+Math.floor(this.random()*4)}
 hit(player,now=Date.now()){
  if(player.inRaid===false)return {ok:false,reason:'Entre pelo portal da batalha.'};
  if(player.weapon!=='radioactive-bat')return {ok:false,reason:'Equipe o bastao radioativo no inventario.'};
  if(Math.hypot(player.x-this.x,player.z-this.z)>15)return {ok:false,reason:'Chegue mais perto do monstro.'};
  if(this.hp<=0)return {ok:false,reason:'O monstro esta se regenerando.'};
  if(now-(player.lastRaidHit||0)<650)return {ok:false,reason:'Aguarde o proximo golpe.'};
  player.lastRaidHit=now;const dealt=Math.min(50,this.hp);this.hp-=dealt;
  this.damage.set(player.principal,(this.damage.get(player.principal)||0)+dealt);
  if(this.hp>0)return {ok:true,dealt,defeated:false,awards:[]};
  this.respawnAt=now+120000;this.attack=null; // Próxima batalha dois minutos após a vitória
  const awards=[...this.damage].map(([id,damage])=>({id,candies:25+Math.floor(damage/50)}));
  for(const r of awards)this.award(r.id,r.candies);
  this.damage.clear();return {ok:true,dealt,defeated:true,awards};
 }
 tick(now=Date.now()){if(this.hp===0&&now>=this.respawnAt){this.hp=this.maxHp;this.respawnAt=0;this.nextAttackAt=now+5000;return true}return false}
 // O servidor avalia alcance real. A corrida só mata quem estiver na trajetória.
 attacks(now,players){
  if(this.hp<=0){this.attack=null;return []}
  const nearby=players.filter(p=>p.inRaid===true&&p.raidHp>0&&Math.hypot(p.x-this.x,p.z-this.z)<30);
  if(!nearby.length)return [];
  if(!this.attack){
   if(now<this.nextAttackAt)return [];
   const kind=['slam','spin','charge'][this.attackNumber++%3],target=nearby[0];
   const dx=target.x-this.x,dz=target.z-this.z,len=Math.hypot(dx,dz)||1;
   this.attack={kind,at:now+(kind==='charge'?1300:kind==='spin'?1050:900),dx:dx/len,dz:dz/len,targetX:target.x,targetZ:target.z,step:-1};
   this.nextAttackAt=now+(kind==='charge'?10500:6500);
   return [{type:'raid-attack',phase:'warn',kind,impactAt:this.attack.at,targetX:target.x,targetZ:target.z,x:this.x,z:this.z}];
  }
  const a=this.attack;if(now<a.at)return [];
  const latest=a.kind==='spin'?Math.min(3,Math.floor((now-a.at)/300)):0;
  if(latest<=a.step)return [];
  const result=[];
  for(let i=a.step+1;i<=latest;i++){
   result.push({type:'raid-attack',phase:'impact',kind:a.kind,step:i,dx:a.dx,dz:a.dz,x:this.x,z:this.z});
   for(const p of nearby){
    const dx=p.x-this.x,dz=p.z-this.z,distance=Math.hypot(dx,dz);let damage=0;
    if(a.kind==='slam'&&distance<=9)damage=80;
    if(a.kind==='spin'&&distance<=10)damage=50;
    if(a.kind==='charge'){
     const forward=dx*a.dx+dz*a.dz,sideways=Math.abs(dx*a.dz-dz*a.dx);
     if(forward>=0&&forward<=28&&sideways<=3.3)damage=p.raidHp;
    }
    if(!damage||p.raidHp<=0)continue;
    p.raidHp=Math.max(0,p.raidHp-damage);
    result.push({type:'raid-player-hit',id:p.id,hp:p.raidHp,maxHp:300,damage,kind:a.kind,dead:p.raidHp===0});
   }
  }
  a.step=latest;
  if(a.kind!=='spin'||latest===3)this.attack=null;
  return result;
 }
}
module.exports={RadioactiveRaid};
