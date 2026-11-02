'use strict';
// Rascunho do próximo Admin Abuse: presente somente na branch de preparação.
(()=>{
 const FIRST=129,INDEX=13,CENTER=-975;
 const names=['Lesma Tóxica','Rato Mutante','Escorpião Nuclear','Coruja Isótopo','Lobo Plutônio','Hidra de Césio','Dragão de Urânio','Titã Radioativo'];
 let landscape=null;const instances=new WeakMap();
 function resources(T){
  if(instances.has(T))return instances.get(T);
  const geometries={sphere:new T.SphereGeometry(1,12,9),cylinder:new T.CylinderGeometry(1,1,1,12),cone:new T.ConeGeometry(1,1,10),ring:new T.TorusGeometry(1,.12,7,22)};
  const materials=new Map();
  const material=(color,glow=false)=>{const key=color+':'+glow;if(!materials.has(key))materials.set(key,new T.MeshLambertMaterial({color,emissive:glow?color:0,emissiveIntensity:glow?.5:0}));return materials.get(key)};
  const put=(parent,type,color,position,scale,glow=false)=>{const mesh=new T.Mesh(geometries[type],material(color,glow));mesh.position.set(...position);mesh.scale.set(...scale);mesh.castShadow=true;parent.add(mesh);return mesh};
  const data={...geometries,material,put};instances.set(T,data);return data;
 }
 const register=(biomes,species,ranks)=>{
  if(biomes.some(b=>b.key==='radioactive'))return;
  biomes.push({key:'radioactive',n:'☢ Radioativo',g:0x34452a,t:0x657044,req:1e12,gd:names[7],sp:names.slice()});
  names.forEach((name,j)=>species.push({id:FIRST+j,n:name,b:INDEX,r:j,inc:2e10*6**j}));
 };
 function create(T,id,k,color,scene){
  if(id<FIRST||id>=FIRST+8)return null;
  const type=id-FIRST,{put}=resources(T),root=new T.Group();root.userData.radioactiveSpecies=id;const body=new T.Group();root.add(body);
  const base=[0x5c8a36,0x777c5b,0x304e35,0x707a5e,0x2d3b36,0x35432c,0x283f2c,0x596357][type],toxic=0xbaff43,dark=0x15241a;
  const eye=(x,y,z,r=.07)=>put(body,'sphere',toxic,[x,y,z],[r,r,r],true);
  const limb=(x,z,scale=1)=>{const leg=put(body,'cylinder',base,[x,.45*scale,z],[.16*scale,.85*scale,.17*scale]);put(body,'sphere',dark,[x,.11*scale,z+.13],[.21*scale,.14*scale,.30*scale]);return leg};
  const limbs=[],heads=[],wings=[];
  if(type===0){
   for(let i=0;i<6;i++)put(body,'sphere',i%2?base:0x78944b,[0,.3+i*.035,.8-i*.30],[.48-i*.025,.32,.35]);
   for(const x of [-.2,.2]){const horn=put(body,'cylinder',base,[x,.73,.83],[.035,.45,.035]);horn.rotation.z=x<0?.2:-.2;eye(x,.98,.84,.09)}
   for(let i=0;i<5;i++)put(body,'sphere',toxic,[0,.58,.55-i*.28],[.12,.06,.13],true);
  }else if(type===1||type===4){
   put(body,'sphere',base,[0,.88,0],[.48,.54,.88]);put(body,'sphere',base,[0,1.25,.75],[.36,.4,.43]);
   put(body,'sphere',dark,[0,1.13,1.12],[.24,.15,.24]);
   for(const x of [-.28,.28]){put(body,type===1?'sphere':'cone',base,[x,1.72,.62],type===1?[.28,.29,.09]:[.17,.45,.2]);eye(x*.68,1.37,1.07)}
   for(const x of [-.35,.35])for(const z of [-.53,.5])limbs.push(limb(x,z));
   const tail=put(body,'cylinder',type===1?0xa08c75:base,[0,.9,-1.05],type===1?[.045,1.25,.045]:[.2,.95,.2]);tail.rotation.x=1.1;
   if(type===4)for(let i=0;i<5;i++)put(body,'cone',toxic,[0,1.42,-.60+i*.28],[.11,.20,.11],true);
  }else if(type===2){
   put(body,'sphere',base,[0,.55,0],[.56,.31,.8]);
   for(const side of [-1,1]){
    for(let i=0;i<4;i++){const leg=put(body,'cylinder',base,[side*.72,.30,.65-i*.4],[.065,.82,.065]);leg.rotation.z=side*1.15;limbs.push(leg)}
    const claw=put(body,'sphere',base,[side*.75,.63,1.0],[.33,.23,.48]);claw.rotation.y=side*.3;put(body,'cone',toxic,[side*.83,.64,1.42],[.15,.36,.15],true).rotation.x=1.5;
   }
   for(let i=0;i<6;i++)put(body,'sphere',i===5?toxic:base,[0,.65+i*.23,-.72-i*.12],[.19-i*.016,.2,.2],i===5);
   eye(-.17,.71,.72);eye(.17,.71,.72);
  }else if(type===3){
   put(body,'sphere',base,[0,.83,0],[.5,.76,.43]);put(body,'sphere',0xaab18b,[0,1.45,.23],[.57,.49,.22]);
   for(const side of [-1,1])put(body,'cone',base,[side*.39,1.91,.08],[.15,.35,.15]).rotation.z=-side*.25;
   for(const x of [-.23,.23]){put(body,'ring',toxic,[x,1.46,.45],[.19,.22,.65],true);eye(x,1.46,.5,.10)}
   put(body,'cone',0xdbc866,[0,1.2,.54],[.12,.25,.14]).rotation.x=1.5;
   for(const side of [-1,1]){const wing=put(body,'sphere',base,[side*.63,.9,-.02],[.27,.66,.15]);wing.rotation.z=side*.33;wings.push(wing)}
   for(const x of [-.22,.22])put(body,'sphere',dark,[x,.14,.17],[.18,.11,.23]);
  }else if(type===5||type===6){
   put(body,'sphere',base,[0,.75,-.2],[.68,.66,1.1]);for(const x of [-.5,.5])for(const z of [-.65,.45])limbs.push(limb(x,z));
   const count=type===5?3:1;
   for(let i=0;i<count;i++){const x=(i-(count-1)/2)*.62;put(body,'sphere',base,[x,1.35,.65],[.25,.7,.28]);const head=put(body,'sphere',base,[x,1.95,1.0],[.33,.3,.5]);heads.push(head);eye(x-.14,2.05,1.37);eye(x+.14,2.05,1.37);put(body,'cone',toxic,[x,2.35,.84],[.12,.4,.12],true)}
   for(let i=0;i<8;i++)put(body,'sphere',i%2?base:toxic,[Math.sin(i*.4)*.15,.62-i*.04,-1.15-i*.23],[.28-i*.025,.22-i*.018,.27],i%2===0);
   if(type===6)for(const side of [-1,1]){const wing=put(body,'sphere',base,[side*1.05,1.36,-.25],[.9,.2,.9]);wing.rotation.z=side*.4;wings.push(wing);for(let i=0;i<3;i++)put(body,'cone',toxic,[side*(.75+i*.33),1.42,-.52],[.1,.6,.14],true).rotation.z=-side*.8;}
  }else{
   put(body,'sphere',base,[0,1.5,0],[.88,1.12,.55]);put(body,'sphere',base,[0,2.75,.05],[.55,.52,.48]);
   for(const x of [-.35,.35]){eye(x*.55,2.85,.49,.12);put(body,'cone',toxic,[x,3.29,-.05],[.19,.6,.19],true)}
   for(const side of [-1,1]){const arm=put(body,'sphere',base,[side*1.03,1.56,.1],[.31,.82,.35]);arm.rotation.z=side*.16;limbs.push(arm);put(body,'sphere',dark,[side*1.1,.82,.15],[.34,.3,.34]);limbs.push(limb(side*.46,0,1.2))}
   put(body,'ring',dark,[0,1.76,.56],[.44,.44,1]);put(body,'sphere',toxic,[0,1.76,.6],[.31,.31,.12],true);
   for(let i=0;i<3;i++)put(body,'cone',toxic,[(i-1)*.62,2.35,-.2],[.2,.55,.2],true);
  }
  root.scale.setScalar(k);root.userData.customUpdate=(time,phase=0)=>{body.position.y=Math.sin(time*2+id)*.045;limbs.forEach((part,i)=>part.rotation.x=Math.sin(time*5+phase+i*Math.PI)*.13);heads.forEach((part,i)=>part.rotation.y=Math.sin(time*1.7+i)*.17);wings.forEach((part,i)=>part.rotation.z=(i%2?1:-1)*(.35+Math.sin(time*2.8)*.12))};
  root.userData.uniqueSculpture={id,signature:'radioactive-'+id,anatomy:names[type]};scene.add(root);return root;
 }
 function decorate(T,scene,obstacles){
  if(landscape)return;const {put}=resources(T);landscape=new T.Group();landscape.name='biome-radioactive';landscape.position.z=CENTER;scene.add(landscape);
  const toxic=0xbaff43,metal=0x434c4c;
  // Reator circular e torres abauladas, com a estrada central livre.
  for(const side of [-1,1]){
   const x=side*55;
   put(landscape,'cylinder',metal,[x,1.1,-8],[10,2.2,10]);
   put(landscape,'cylinder',0x53625c,[x,7.2,-8],[7,11,7]);
   const rim=put(landscape,'ring',0x899888,[x,12.7,-8],[7.2,7.2,1]);rim.rotation.x=Math.PI/2;
   put(landscape,'sphere',toxic,[x,12.3,-8],[6.8,.28,6.8],true);obstacles.push({x,z:CENTER-8,r:10});
   for(let i=0;i<4;i++){const pipe=put(landscape,'cylinder',metal,[side*(31+i*4.5),.9,16],[.6,5,.6]);pipe.rotation.z=Math.PI/2;}
  }
  for(let i=0;i<18;i++){
   const side=i%2?1:-1,x=side*(28+(i*17%64)),z=-27+(i*29%54),scale=2+(i%4);
   const spill=put(landscape,'sphere',0x74d836,[x,.1,z],[scale,.15,scale*.62],true);spill.rotation.y=i;
   for(let n=0;n<3;n++){const crystal=put(landscape,'cone',n%2?0xe0ff79:toxic,[x+n*.7,.9+n*.25,z-.9],[.5,1.8+n*.6,.55],true);crystal.rotation.z=(n-1)*.24;}
  }
  for(const side of [-1,1]){
   const x=side*13;put(landscape,'cylinder',metal,[x,2.5,25],[.18,5,.18]);
   const sign=put(landscape,'cylinder',0xffce35,[x,4.4,25],[1.6,.16,1.6]);sign.rotation.x=Math.PI/2;
   for(let i=0;i<3;i++){const hazard=put(landscape,'sphere',0x25291c,[x+Math.cos(i*Math.PI*2/3)*.8,4.4+Math.sin(i*Math.PI*2/3)*.8,25.16],[.53,.32,.045]);hazard.rotation.z=i*Math.PI*2/3;}
   put(landscape,'sphere',0x25291c,[x,4.4,25.2],[.25,.25,.05]);
  }
 }
 function update(time,player){if(landscape){landscape.visible=Math.abs(player.z-CENTER)<165;landscape.children.forEach((object,i)=>{if(object.material?.emissiveIntensity)object.material.emissiveIntensity=.4+Math.sin(time*1.7+i)*.12})}}
 window.RoubeOvoRadioactive={register,create,decorate,update,has:id=>id>=FIRST&&id<FIRST+8,names,index:INDEX,center:CENTER};
})();
