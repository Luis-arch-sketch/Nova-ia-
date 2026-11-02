'use strict';
const crypto=require('node:crypto');
const LIMITED=104,REMOVED=new Set([0,9]),RARITIES=[0,1,2,3,4,7,8,9];
const SIZES=[.8,1,1.4,1.9,12/1.8],CHANCES={2:.4,3:.3,4:.2,7:.1,8:.04,9:.005};
const baseSpawn=slot=>({x:[0,52,-52][slot%3],z:8+Math.floor(slot/3)*56});
const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
// Colocar o visitante diante da câmera do amigo, onde ambos podem se enxergar.
const meetingSpawn=(friend,slot=0)=>{
 slot=Math.max(0,Math.floor(slot)||0);
 const angle=finite(friend.cameraYaw,-100,100)?friend.cameraYaw:0;
 const side=(slot%2?1:-1)*(1.2+Math.floor(slot%4/2)*.7),ahead=4.8+Math.floor(slot/4)*1.2;
 const x=Math.max(-97,Math.min(97,friend.x-Math.sin(angle)*ahead+Math.cos(angle)*side));
 const z=Math.max(-937,Math.min(333,friend.z-Math.cos(angle)*ahead-Math.sin(angle)*side));
 return {x,y:Math.max(0,Number(friend.y)||0),z,yaw:Math.atan2(friend.x-x,friend.z-z),cameraYaw:Math.atan2(x-friend.x,z-friend.z)};
};
class World {
 constructor(now=Date.now(),random=Math.random){
  this.random=random;this.eggs=new Map();this.reset=120000;this.phase='day';this.until=0;this.nextReset=now+this.reset;this.event=null;this.emptyAt=0;
  this.regrow(true,now);
 }
 add(b,j,size,x,z,now=Date.now(),species=b*8+j,nest=null){
  if(this.eggs.size>=400||REMOVED.has(species))return null;
  const collected=species>=105&&species<129,tier=collected?Math.floor((species-105)/4):0;
  const egg={id:crypto.randomUUID(),b,j,s:species,r:species===LIMITED?10:collected?11+tier:RARITIES[j],size,
   w:species===LIMITED?1:+((collected?3+tier*2:1+j*.9)*SIZES[size]*2).toFixed(1),x,z,nest,grownAt:now,expiresAt:species===LIMITED?null:now+this.reset};
  this.eggs.set(egg.id,egg);return egg;
 }
 size(){const n=this.random()*100;return n<50?0:n<85?1:n<97?2:3;}
 regrow(first,now){
  // Ovos abandonados e ninhos antigos expiram a cada ciclo; LIMITED e ovos carregados ficam preservados.
  if(!first)for(const [id,e] of this.eggs)if(e.s!==LIMITED)this.eggs.delete(id);
  const occupied=new Set([...this.eggs.values()].map(e=>e.nest));
  const spawn=(b,j)=>{const n=b*8+j;if(occupied.has(n)||REMOVED.has(n))return;
   const a=j/8*Math.PI*2;let size=this.size();if(!first&&this.random()<.32)size=Math.min(4,size+1);
   const e=this.add(b,j,size,Math.cos(a)*22,-65-70*b+Math.sin(a)*22,now,b*8+j,n);if(e)occupied.add(n);
  };
  for(let b=0;b<13;b++)for(let j=0;j<2;j++)spawn(b,j);
  if(!first)for(let j=2;j<8;j++){
   const chance=CHANCES[RARITIES[j]]*(j>=6?1.4:1);
   if(this.random()>=chance)continue;
   const candidates=Array.from({length:13},(_,b)=>b).filter(b=>!REMOVED.has(b*8+j)&&!occupied.has(b*8+j));
   if(candidates.length)spawn(candidates[Math.floor(this.random()*candidates.length)],j);
  }

 }
 tick(now=Date.now()){
  let changed=false;
  if(this.phase==='day'&&now>=this.nextReset){this.phase='night';this.until=now+9000;this.regrow(false,now);changed=true;}
  if(this.phase==='night'&&now>=this.until){this.phase='unlock';this.until+=3000;changed=true;}
  if(this.phase==='unlock'&&now>=this.until){this.phase='day';this.until=0;this.nextReset=now+this.reset;changed=true;}
  if(this.event&&now>=this.event.endsAt){this.event=null;changed=true;}
  return changed;
 }
 clock(now=Date.now()){return {serverNow:now,phase:this.phase,until:this.until,nextReset:this.nextReset};}
 snapshot(now=Date.now()){return {type:'world-sync',eggs:[...this.eggs.values()],clock:this.clock(now),event:this.event};}
 limited(){return [...this.eggs.values()].filter(e=>e.s===LIMITED);}
 take(player,id,now=Date.now()){
  const egg=this.eggs.get(id);
  if(this.phase!=='day'||player.heldEgg||!egg||now<egg.grownAt)return null;
  if(Math.hypot(player.x-egg.x,player.z-egg.z)>(egg.s===LIMITED?8:5))return null;
  this.eggs.delete(id);player.heldEgg=egg;return egg;
 }
 drop(player){
  if(!player.heldEgg)return null;
  const egg={...player.heldEgg,x:Math.max(-97,Math.min(97,player.x+Math.sin(player.yaw)*1.8)),z:Math.max(-937,Math.min(333,player.z+Math.cos(player.yaw)*1.8)),nest:null};
  this.eggs.set(egg.id,egg);player.heldEgg=null;return egg;
 }
 deposit(player){
  if(!player.heldEgg)return null;
  const home=baseSpawn(player.baseSlot);
  if(Math.hypot(player.x-home.x,player.z-(home.z-12))>4.6)return null;
  const egg=player.heldEgg;player.heldEgg=null;return egg;
 }
}
module.exports={World,LIMITED,baseSpawn,finite,meetingSpawn};
