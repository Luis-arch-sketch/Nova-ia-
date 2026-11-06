'use strict';
/* Planta compartilhada pelo servidor e pelo navegador. Só há espaço de base
 * para quem está online; a fileira de trás e as laterais formam a praça em U. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RoubeOvoLayout=api;})(typeof globalThis==='object'?globalThis:this,function(){
 const releaseAt=Date.parse('2026-11-06T23:30:00Z');
 const released=(at=Date.now())=>at>=releaseAt;
 const capacity=16,corridorHalfWidth=52,entranceZ=-40,shops={fusion:{x:-46,z:-24},sell:{x:-26,z:-24},trails:{x:46,z:-24}};
 // Entrada ao lado da loja de trilhas e saída segura perto da arena radioativa.
 // Sala de batalha isolada além do fim do corredor principal.
 const raidZone={x:0,z:-1140,halfWidth:27,halfDepth:27,shop:{x:-18,z:-1125}};
 const raidPortal={town:{x:42,z:-10},arena:{x:17,z:-1125},arrivalArena:{x:8,z:-1125},arrivalTown:{x:35,z:-10}};
 const fitRaid=p=>({x:Math.max(-26,Math.min(26,Number(p.x)||0)),z:Math.max(-1166,Math.min(-1114,Number(p.z)||-1140))});
 const count=n=>Math.max(1,Math.min(capacity,Math.floor(Number(n)||1)));
 function slots(n){
  n=count(n);const sideRows=Math.ceil(Math.max(0,n-5)/2),backZ=sideRows*48;
  return Array.from({length:capacity},(_,i)=>i<5?{x:(i-(Math.min(n,5)-1)/2)*48,z:backZ}:{x:(i%2?-1:1)*96,z:Math.floor((i-5)/2)*48});
 }
 function hub(n){n=count(n);const active=slots(n).slice(0,n);return {count:n,halfWidth:Math.max(64,...active.map(p=>Math.abs(p.x)+32)),endZ:Math.max(...active.map(p=>p.z))+46,entranceZ};}
 function state(n){n=count(n);return {count:n,slots:slots(n),hub:hub(n)};}
 function limits(z,h=hub(capacity)){return {x:Math.max(1,z<entranceZ?corridorHalfWidth-3:h.halfWidth-3),minZ:released()?-1008:-938,maxZ:h.endZ-2};}
 function fit(p,h=hub(capacity)){const z=Math.max(released()?-1008:-938,Math.min(h.endZ-2,p.z)),b=limits(z,h);return {x:Math.max(-b.x,Math.min(b.x,p.x)),z};}
 function base(slot,n=capacity){const p=slots(n)[slot]||slots(n)[0];return {x:p.x,z:p.z+8};}
 function outline(h){
  const w=h.halfWidth,end=h.endZ,points=[{x:-52.2,z:-40},{x:-24,z:-40}];
  function curve(c1,c2,b){const a=points[points.length-1];for(let i=1;i<=16;i++){const t=i/16,k=1-t;points.push({x:k*k*k*a.x+3*k*k*t*c1.x+3*k*t*t*c2.x+t*t*t*b.x,z:k*k*k*a.z+3*k*k*t*c1.z+3*k*t*t*c2.z+t*t*t*b.z})}}
  curve({x:-w,z:-40},{x:-w,z:-40},{x:-w,z:-16});points.push({x:-w,z:end-16});
  curve({x:-w,z:end},{x:-w*.65,z:end},{x:0,z:end});
  curve({x:w*.65,z:end},{x:w,z:end},{x:w,z:end-16});points.push({x:w,z:-16});
  curve({x:w,z:-40},{x:w,z:-40},{x:24,z:-40});points.push({x:52.2,z:-40});return points;
 }
 function contains(p,h){if(p.z<entranceZ)return Math.abs(p.x)<=corridorHalfWidth&&p.z>=(released()?-1008:-938);const edge=outline(h);let inside=false;for(let i=0,j=edge.length-1;i<edge.length;j=i++){const a=edge[i],b=edge[j];if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)inside=!inside}return inside;}
 return {releaseAt,released,capacity,corridorHalfWidth,entranceZ,shops,raidZone,raidPortal,fitRaid,slots,hub,state,limits,fit,base,outline,contains};
});
