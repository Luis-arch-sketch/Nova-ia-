'use strict';
/* Lojas e placas são objetos do mundo Three.js, junto às bases e à área pública.
 * Sem botões permanentes de Loja/Placar na HUD. Ação no mundo abre serviços reais.
 */
(()=>{
 if(window.RoubeOvoWorldActions)return;
 const root=new T.Group();root.name='Physical stores, fusion machine and leaderboard';sc.add(root);
 const own=new T.Group();own.name='Base stations';BASE_GROUP.add(own);
 const metal=new T.MeshLambertMaterial({color:0x353b53,metalness:.35});
 const dark=new T.MeshLambertMaterial({color:0x151d33});
 const cyan=new T.MeshLambertMaterial({color:0x67e3fb,emissive:0x216276});
 const violet=new T.MeshLambertMaterial({color:0xbb69ff,emissive:0x602590});
 const gold=new T.MeshLambertMaterial({color:0xffd46a});
 const wood=new T.MeshLambertMaterial({color:0x754224});
 function block(parent,x,y,z,w,h,d,mat){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=false;parent.add(m);return m}
 function circle(parent,x,y,z,r,mat){const m=new T.Mesh(new T.CylinderGeometry(r,r,.27,24),mat);m.position.set(x,y,z);parent.add(m);return m}
 function sign(parent,x,y,z,text,color,scale=8){
   const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;
   const ctx=canvas.getContext('2d');
   ctx.fillStyle='#11152bea';ctx.fillRect(0,0,768,160);ctx.strokeStyle=color;ctx.lineWidth=12;ctx.strokeRect(8,8,752,144);
   ctx.font='900 57px system-ui';ctx.fillStyle='white';ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillText(text,384,80,730);
   const t=new T.CanvasTexture(canvas);
   const mesh=new T.Mesh(new T.PlaneGeometry(scale,scale*160/768),new T.MeshBasicMaterial({map:t,transparent:false,side:T.DoubleSide}));
   mesh.position.set(x,y,z);parent.add(mesh);return mesh;
 }
 // Loja de trilhas: balcão, letreiro, esteira luminosa e mascote de brilho ciano.
 {
  const g=new T.Group();g.position.set(29,0,7);g.name='Loja de trilhas';own.add(g);
  circle(g,0,.13,0,5.2,metal);circle(g,0,.34,0,4.55,cyan);
  block(g,0,1.15,0,7,1.7,3.1,dark);
  block(g,0,2.15,1.2,6.8,.25,.30,cyan);
  for(let i=0;i<7;i++){const strip=block(g,(i-3)*.74,.49,-1.6,.32,.16,1.45,i%2?cyan:gold);strip.rotation.y=.25}
  for(const x of [-3.2,3.2])block(g,x,4.25,0,.37,4.4,.4,metal);
  sign(g,0,6.1,.28,'✨ LOJA DE TRILHAS','#4efaff',10.5);
  const halo=new T.Mesh(new T.TorusGeometry(1.8,.16,8,38),cyan);halo.rotation.x=Math.PI/2;halo.position.set(0,3.6,0);g.add(halo);
  const l=label('APERTE AÇÃO • TRILHAS',512,90,10);l.position.set(0,7.35,0);g.add(l);
 }
 // Máquina de fusão: câmara, três encaixes reais para ovos e energia roxa.
 const fusionObject=new T.Group();fusionObject.position.set(-29,0,7);fusionObject.name='Máquina de fusão 50%';own.add(fusionObject);
 {
  const g=fusionObject;
  circle(g,0,.19,0,5.1,dark);circle(g,0,.41,0,4.55,violet);
  block(g,0,1.16,-1,6.8,1.6,3.2,metal);block(g,0,3.7,-1.1,5.9,.36,1.5,violet);
  for(const x of [-2.1,0,2.1]){
   circle(g,x,2.14,-.2,.74,metal);circle(g,x,2.31,-.2,.6,violet);
   const egg=new T.Mesh(new T.SphereGeometry(.42,12,10),new T.MeshLambertMaterial({color:x===0?0x89f0ff:0xffe1a3,emissive:x===0?0x22788a:0x77552c}));
   egg.scale.y=1.36;egg.position.set(x,2.96,-.2);g.add(egg);
  }
  for(const x of [-3.2,3.2])block(g,x,4.25,-1.1,.38,4.2,.42,metal);
  sign(g,0,6.15,-.9,'🧬 FUSÃO DE OVOS','#ce89ff',10.4);
  const t=label('50% GANHA • 50% PERDE',512,85,10);t.position.set(0,7.55,-1);g.add(t);
 }
 // Placar fixo num cantinho do mapa, global para todos (base independe do slot).
 const ranking=new T.Group();ranking.name='Placar 3D dos melhores jogadores';ranking.position.set(-77,0,52);root.add(ranking);
 block(ranking,-9,3,0,.8,6,.9,wood);block(ranking,9,3,0,.8,6,.9,wood);
 block(ranking,0,8.8,0,21,12,1.25,metal);
 block(ranking,0,8.8,.78,19.5,10.5,.5,dark);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=640;
 const ctx=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);
 const screen=new T.Mesh(new T.PlaneGeometry(18.5,10.1),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,depthWrite:true}));
 screen.position.set(0,8.8,1.11);ranking.add(screen);
 sign(ranking,0,16.7,.35,'🏆 TOP JOGADORES','#ffdc72',16);
 function board(players,error){
   ctx.fillStyle='#121a32';ctx.fillRect(0,0,1024,640);
   ctx.fillStyle='#ffdb75';ctx.textAlign='center';ctx.font='900 47px system-ui';ctx.fillText('🏆 MELHORES JOGADORES',512,68);
   ctx.font='bold 25px system-ui';ctx.fillStyle='#b5cfff';ctx.fillText('PLACAR AO VIVO • DINHEIRO + SPEED',512,109);
   if(error){ctx.fillStyle='#ffc6bf';ctx.font='bold 29px system-ui';ctx.fillText('Atualizando placar...',512,298)}
   else if(!players.length){ctx.fillStyle='#d6ebff';ctx.font='bold 29px system-ui';ctx.fillText('Entre em uma sala para aparecer!',512,298)}
   else players.slice(0,5).forEach((p,i)=>{
    const y=173+i*89;ctx.fillStyle=i%2===0?'#242e50':'#1a2443';ctx.fillRect(34,y-38,958,77);
    ctx.font='bold 32px system-ui';ctx.textAlign='left';ctx.fillStyle=i===0?'#ffe47c':'#e5edff';
    const name=String(p.name||'Jogador').slice(0,18);
    ctx.fillText('#'+(i+1)+'  '+name,55,y+10,460);
    ctx.fillStyle='#9affb7';ctx.textAlign='right';ctx.font='bold 27px system-ui';ctx.fillText('$'+fm(p.money||0),973,y-1,416);
    ctx.font='bold 19px system-ui';ctx.fillStyle='#a9d8ff';ctx.fillText('⚡ '+fm(p.speed||0),973,y+27,420);
   });
   texture.needsUpdate=true;
 }
 board([],true);
 let refreshing=false,lastRefresh=0,people=[];
 async function refresh(){
  if(refreshing)return;refreshing=true;
  try{const response=await fetch('/api/leaderboard',{cache:'no-store'});
   if(!response.ok)throw Error('offline');const j=await response.json();people=Array.isArray(j.players)?j.players:[];
   board(people,false);
  }catch(e){board(people,people.length===0)}
  finally{refreshing=false;lastRefresh=Date.now()}
 }
 refresh();setInterval(refresh,15000);
 const points=[
  {id:'trails',name:'Loja de Trilhas',x:29,z:7,open:()=>window.RoubeOvoOpenShop?.(2)},
  {id:'fusion',name:'Máquina de Fusão',x:-29,z:7,open:()=>window.RoubeOvoFusion?.open()},
  {id:'ranking',name:'Placar dos Melhores',world:true,x:-77,z:52,open:()=>{refresh();if(typeof rankToggle==='function')rankToggle(true)}}
 ];
 function closest(){
  let p=null,d=8;
  for(const o of points){const x=o.x+(o.world?0:BASE_HOME.x),z=o.z+(o.world?0:BASE_HOME.z);
   const dist=Math.hypot(P.x-x,P.z-z);if(dist<d){p=o;d=dist}
  }return p;
 }
 const prompt=document.createElement('div');prompt.id='rue-physical-prompt';prompt.setAttribute('aria-live','off');
 const st=document.createElement('style');st.textContent='#rue-physical-prompt{position:fixed;z-index:56;bottom:calc(116px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);padding:7px 12px;border-radius:12px;background:#171c35db;color:#fff;border:1px solid #a0e8ff;box-shadow:0 3px 15px #0006;font:800 12px system-ui;white-space:nowrap;pointer-events:none;display:none}#bRank,#bm{display:none!important}';document.head.appendChild(st);document.body.appendChild(prompt);
 let current=null;
 function update(){
  current=closest();
  if(!current||window.RoubeOvoFusion?.active){prompt.style.display='none';return}
  prompt.textContent='🖐 AÇÃO: '+current.name;
  prompt.style.display='block';
 }
 setInterval(update,250);
 function interact(){const chosen=closest();if(!chosen)return false;chosen.open();return true}
 window.RoubeOvoWorldActions={interact,update,refresh,points,board,ranking,own,get nearest(){return closest()?.id||null}};
})();
