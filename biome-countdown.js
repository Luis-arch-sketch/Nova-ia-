'use strict';
// Estreia oficial: 6 de novembro de 2026, 20:30 Brasilia.
(()=>{
 if(document.getElementById('rue-biome-countdown'))return;
 const TARGET=Date.parse('2026-11-06T23:30:00Z');
 const css=document.createElement('style');
 css.textContent='#rue-biome-countdown{box-sizing:border-box;max-width:min(270px,47vw);border:1px solid #84ff94;background:rgba(12,34,20,.93);border-radius:12px;color:#eaffdc;box-shadow:0 3px 14px #000a;padding:8px;font:800 12px/1.3 system-ui,sans-serif;text-align:center;pointer-events:none}#rue-biome-countdown strong{display:block;color:#ffe580;font-size:14px;margin-top:4px}body.rue-panel-visible #rue-biome-countdown{display:none}@media(max-height:460px){#rue-biome-countdown{max-width:34vw;font-size:10px;padding:4px}#rue-biome-countdown strong{font-size:11px}}';
 document.head.appendChild(css);
 const badge=document.createElement('aside');badge.id='rue-biome-countdown';badge.setAttribute('aria-label','Contador do Admin Abuse e bioma radioativo');
 (document.getElementById('rue-player-controls')||document.body).appendChild(badge);
 const serverNow=()=>Date.now()+(typeof MP!=='undefined'&&Number.isFinite(MP.clockOffset)?MP.clockOffset:0);
 const released=()=>serverNow()>=TARGET;window.RoubeOvoEvent2026={target:TARGET,released};
 let zone=null;
 try{
  const T=THREE;zone=new T.Group();zone.name='Novo Bioma Radioativo';sc.add(zone);
  const ground=new T.Mesh(new T.PlaneGeometry(104,70),new T.MeshLambertMaterial({color:0x295b30,emissive:0x142f15}));
  ground.rotation.x=-Math.PI/2;ground.position.set(0,.048,-982);zone.add(ground);
  const road=new T.Mesh(new T.PlaneGeometry(14,70),new T.MeshLambertMaterial({color:0x244138}));
  road.rotation.x=-Math.PI/2;road.position.set(0,.072,-982);zone.add(road);
  const metal=new T.MeshLambertMaterial({color:0x4b6059});
  const neon=new T.MeshBasicMaterial({color:0x73ff43});
  const sludge=new T.MeshBasicMaterial({color:0x71f82d,side:T.DoubleSide,transparent:true,opacity:.65,depthWrite:false});
  for(const side of [-1,1])for(let i=0;i<6;i++){
   const x=side*(21+(i%3)*10),z=-952-i*11;
   const spill=new T.Mesh(new T.CircleGeometry(3+i%3,24),sludge);spill.rotation.x=-Math.PI/2;spill.position.set(x,.086,z);zone.add(spill);
   const barrel=new T.Mesh(new T.CylinderGeometry(1,1,2.7,12),metal);barrel.position.set(x,1.5,z);zone.add(barrel);
   const band=new T.Mesh(new T.CylinderGeometry(1.04,1.04,.36,12),neon);band.position.set(x,1.5,z);zone.add(band);
   const cap=new T.Mesh(new T.CylinderGeometry(.94,.94,.1,12),neon);cap.position.set(x,2.9,z);zone.add(cap);
   const crystal=new T.Mesh(new T.ConeGeometry(1.1,3.5,6),new T.MeshLambertMaterial({color:0x3b6e4b,emissive:0x173d1a}));crystal.position.set(x+side*4,2.05,z-2);zone.add(crystal);
  }
  const base=new T.Mesh(new T.CylinderGeometry(5.2,5.8,1.2,24),metal);base.position.set(-36,.7,-986);zone.add(base);
  const core=new T.Mesh(new T.IcosahedronGeometry(2.8,1),neon);core.position.set(-36,5,-986);zone.add(core);
  const ring=new T.Mesh(new T.TorusGeometry(3.8,.26,9,38),neon);ring.position.set(-36,5,-986);zone.add(ring);
  const light=new T.PointLight(0x7fff65,1.6,42);light.position.set(-35,9,-981);zone.add(light);
  const sign=document.createElement('canvas');sign.width=768;sign.height=190;
  const g=sign.getContext('2d');g.fillStyle='#0c2111';g.fillRect(0,0,768,190);g.strokeStyle='#8cff65';g.lineWidth=14;g.strokeRect(7,7,754,176);
  g.textAlign='center';g.fillStyle='#f0ffdc';g.font='900 56px sans-serif';g.fillText('☢ BIOMA RADIOATIVO',384,88);g.font='bold 38px sans-serif';g.fillText('ADMIN ABUSE 20:30',384,149);
  const billboard=new T.Mesh(new T.PlaneGeometry(15,3.7),new T.MeshBasicMaterial({map:new T.CanvasTexture(sign),side:T.DoubleSide}));
  billboard.position.set(0,10,-976);zone.add(billboard);zone.userData.core=core;zone.userData.ring=ring;
 }catch(e){console.warn('Decoracao radioativa indisponivel',e)}
 function update(){
  const seconds=Math.max(0,Math.ceil((TARGET-serverNow())/1000));
  if(zone){zone.visible=seconds===0;if(zone.visible){zone.userData.core.rotation.y+=.08;zone.userData.ring.rotation.z+=.04}}
  if(seconds===0){badge.innerHTML='☢ NOVO BIOMA <strong>🔥 RADIOATIVO LIBERADO!</strong>';return}
  const hh=Math.floor(seconds/3600),mm=Math.floor(seconds%3600/60),ss=seconds%60;
  badge.innerHTML='😈 ADMIN ABUSE • HOJE 20:30<strong>DAQUI '+String(hh).padStart(2,'0')+'h '+String(mm).padStart(2,'0')+'m '+String(ss).padStart(2,'0')+'s</strong>';
 }
 update();setInterval(update,1000);
})();