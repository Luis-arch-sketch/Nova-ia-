'use strict';
// Keep the order fixed: these IDs are appended after the original LIMITED species.
(() => {
 const START=Date.parse('2026-10-13T00:00:00-03:00'),END=Date.parse('2026-11-01T00:00:00-03:00');
 let clock=()=>Date.now();
 const types=[
  {name:'Halloween Raro',short:'Raro',r:11,chance:.15,color:0xff8b24,glow:0xa43d00,income:2e9},
  {name:'Halloween Lendário',short:'Lendário',r:12,chance:.04,color:0x9c55ed,glow:0x44146b,income:2e10},
  {name:'Halloween Mítico',short:'Mítico',r:13,chance:.008,color:0x4df7bf,glow:0x075a44,income:2e11},
  {name:'Halloween Secreto',short:'Secreto',r:14,chance:.001,color:0xe83861,glow:0x650d22,income:2e12},
  {name:'Halloween Eternal',short:'Eternal',r:15,chance:.00065,color:0x4bdaff,glow:0x07517b,income:8e13},
  {name:'Halloween Divino',short:'Divino',r:16,chance:.00018,color:0xffde75,glow:0x9e621c,income:9e15}
 ];
 const defs=[
  ['Gato Bruxo','cat',0x252139,0x934ceb,0x68ffbc],
  ['Morcego Vampiro','bat',0x532248,0xe44562,0xffcf82],
  ['Coruja da Lua','owl',0x575185,0xdcd5f9,0xffcf64],
  ['Raposa Abóbora','fox',0xef792b,0xffe2ac,0x6b2baa],
  ['Lobo Lobisomem','wolf',0x7f87a5,0x332740,0xffb43e],
  ['Corvo do Eclipse','crow',0x212739,0x6759b3,0xdf5cff],
  ['Aranha Ametista','spider',0x542b7a,0xc774ec,0x67ffbe],
  ['Serpente Maldita','snake',0x1c7667,0xb9e06f,0xff8cad],
  ['Escorpião Necro','scorpion',0x283846,0x63d1ac,0xed9bff],
  ['Coelho Vodu','rabbit',0xbaa88c,0x614377,0xffab55],
  ['Cervo da Lua de Sangue','stag',0x6c2c3c,0xf6d7b4,0xff5869],
  ['Unicórnio Sombrio','unicorn',0x463968,0xa0f6e6,0xffbceb],
  ['Cérbero Infernal','cerberus',0x34242c,0xe77a30,0xffda67],
  ['Fênix da Meia-Noite','phoenix',0x583c96,0xf28643,0xffd083],
  ['Quimera Maldita','chimera',0x73745d,0x54365e,0x83ffbc],
  ['Dragão do Eclipse','dragon',0x222733,0xbb4866,0xfbdd9b],
  // ETERNAL: quatro criaturas inéditas com modelos e cores próprios.
  ['Hidra da Meia-Noite','hydra',0x153d4d,0x3cdded,0xa9ffff],
  ['Pantera do Vazio','panther',0x171b31,0x6457ed,0x7cf6ff],
  ['Grifo do Abismo','griffin',0x354366,0x63b7e9,0xffd18b],
  ['Leviatã Lunar','leviathan',0x234367,0x66ebed,0xe0a9ff],
  // DIVINO: os quatro animais mais difíceis de encontrar no Halloween.
  ['Dragão da Lua de Sangue','celestial_dragon',0x5d1638,0xffc04d,0xfff0bc],
  ['Fênix do Sol Negro','celestial_phoenix',0x6a2248,0xffce5a,0xfff8c9],
  ['Leão Astral Sagrado','celestial_lion',0xdbc3a4,0xffd44f,0xf6faff],
  ['Kirín das Estrelas','kirin',0xa5deea,0xf8d674,0xffffff]
 ].map((d,i)=>({key:'halloween2026-'+i,name:d[0],kind:d[1],body:d[2],accent:d[3],eye:d[4],tier:Math.floor(i/4),rank:i%4,id:null}));
 const byId=new Map(),caches=new WeakMap();
 const active=()=>clock()>=START&&clock()<END;
 function register(SPC,RAR){
  for(const type of types)RAR[type.r]=type.name;
  for(const d of defs){
   const existing=SPC.find(s=>s.halloweenKey===d.key);
   d.id=existing?existing.id:SPC.length;
   if(!existing)SPC.push({id:d.id,n:d.name,b:0,r:4+d.tier,hr:types[d.tier].r,
    inc:types[d.tier].income*(1+d.rank*.2),halloweenKey:d.key,halloweenTier:d.tier});
   byId.set(d.id,d);
  }
 }
 function init(T){
  if(caches.has(T))return caches.get(T);
  const c={
   sphere:new T.SphereGeometry(1,14,10),cone:new T.ConeGeometry(1,1,8),
   cylinder:new T.CylinderGeometry(1,1,1,8),ring:new T.TorusGeometry(1,.08,6,24),
   coil:new T.TorusGeometry(.8,.23,8,28),box:new T.BoxGeometry(1,1,1)
  };
  const face=new T.BufferGeometry();
  face.setAttribute('position',new T.Float32BufferAttribute([-.15,-.1,0,.15,-.1,0,0,.17,0],3));
  c.face=face;
  const shape=new T.Shape();shape.moveTo(0,.2);shape.lineTo(.85,.68);shape.lineTo(1.3,-.2);
  shape.quadraticCurveTo(.96,.08,.83,-.34);shape.quadraticCurveTo(.53,-.09,.39,-.49);shape.lineTo(0,-.14);
  c.wing=new T.ShapeGeometry(shape);
  caches.set(T,c);return c;
 }
 function create(T,id,k,scene){
  const d=byId.get(id);if(!d)return null;
  const geo=init(T),g=new T.Group(),root=new T.Group();g.name=d.name;g.add(root);
  const mat=(color,glow=0)=>new T.MeshLambertMaterial({color,emissive:glow,emissiveIntensity:.42,side:T.DoubleSide});
  const body=mat(d.body),accent=mat(d.accent),glow=mat(d.eye,d.eye);
  const cream=mat(0xffe8cd),dark=mat(0x101322),mane=mat(d.accent,types[d.tier].glow);
  const legs=[],wings=[],tails=[],heads=[];
  function mesh(shape,m,position,scale,parent=root){
   const o=new T.Mesh(geo[shape],m);o.position.set(...position);o.scale.set(...scale);
   o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
  }
  const orb=(m,p,s,parent=root)=>mesh('sphere',m,p,s,parent);
  const cone=(m,p,s,parent=root)=>mesh('cone',m,p,s,parent);
  function segment(a,b,r,m,parent=root){
   const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);
   const o=mesh('cylinder',m,av.add(bv).multiplyScalar(.5).toArray(),[r,v.length(),r],parent);
   o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;
  }
  function eyes(parent,large=false){
   for(const side of [-1,1]){
    orb(large?cream:glow,[side*(large?.29:.24),.11,.51],[large?.24:.11,large?.27:.14,.08],parent);
    if(large)orb(glow,[side*.29,.11,.59],[.11,.16,.035],parent);
    orb(dark,[side*(large?.29:.24),.11,large?.63:.58],[.04,.105,.025],parent);
    orb(cream,[side*(large?.29:.24)-.025,.16,large?.65:.60],[.025,.033,.017],parent);
   }
  }
  function head(x=0,y=2.13,z=.86,scale=1,ears=true){
   const h=new T.Group();h.position.set(x,y,z);h.scale.setScalar(scale);root.add(h);heads.push(h);
   orb(body,[0,0,0],[.55,.57,.55],h);
   orb(accent,[0,-.21,.50],[.32,.23,.34],h);orb(dark,[0,-.14,.79],[.14,.1,.09],h);
   eyes(h);
   if(ears)for(const side of [-1,1]){
    const e=cone(body,[side*.36,.61,-.02],[.25,.66,.23],h);e.rotation.z=-side*.17;
    cone(accent,[side*.36,.62,.10],[.125,.41,.04],h).rotation.z=-side*.17;
   }
   return h;
  }
  function quadruped(){
   orb(body,[0,1.42,-.15],[.77,.61,1.08]);
   orb(accent,[0,1.57,.55],[.54,.54,.57]);
   for(const x of [-.53,.53])for(const z of [-.77,.65]){
    const leg=new T.Group();leg.position.set(x,.98,z);root.add(leg);legs.push(leg);
    mesh('cylinder',body,[0,-.35,0],[.16,.82,.16],leg);
    orb(accent,[0,-.82,.11],[.23,.15,.31],leg);
   }
   return head();
  }
  function tail(bushy=false){
   const p=new T.Group();p.position.set(0,1.61,-1.1);root.add(p);tails.push(p);
   segment([0,0,0],[0,.24,-.47],bushy?.26:.1,body,p);
   segment([0,.24,-.47],[0,.65,-.84],bushy?.34:.09,body,p);
   orb(accent,[0,.72,-.88],bushy?[.28,.36,.25]:[.12,.13,.12],p);return p;
  }
  function horns(h,branch=false){
   for(const side of [-1,1]){
    segment([side*.30,.39,-.08],[side*.45,.95,-.12],.065,accent,h);
    if(branch){
     segment([side*.45,.75,-.1],[side*.72,1.04,.02],.047,accent,h);
     segment([side*.44,.63,-.1],[side*.65,.76,.25],.045,accent,h);
     cone(glow,[side*.45,1.07,-.12],[.065,.28,.065],h);
    }else cone(accent,[side*.46,1.01,-.13],[.1,.32,.1],h).rotation.z=-side*.27;
   }
  }
  function batWings(y=1.8,z=-.3){
   for(const side of [-1,1]){
    const p=new T.Group();p.position.set(side*.38,y,z);p.scale.x=side;root.add(p);wings.push({p,side,bat:true});
    mesh('wing',mane,[0,0,0],[1,1,1],p);
    segment([0,.2,.015],[.85,.68,.015],.035,accent,p);
    segment([.85,.68,.015],[1.3,-.2,.015],.035,accent,p);
    segment([0,.2,.015],[.83,-.34,.015],.022,accent,p);
   }
  }
  function bird(){
   orb(body,[0,1.58,-.12],[.62,.93,.58]);orb(accent,[0,1.65,.37],[.47,.67,.17]);
   for(const side of [-1,1]){
    segment([side*.25,.75,0],[side*.25,.15,.1],.09,accent);
    for(const off of [-1,0,1])segment([side*.25,.12,.1],[side*.25+off*.13,.08,.48],.045,accent);
    const p=new T.Group();p.position.set(side*.50,1.95,-.05);root.add(p);wings.push({p,side});
    for(let j=0;j<5;j++)orb(j%2?accent:body,[side*(.13+j*.07),-.25-j*.12,-j*.16],[.20,.48,.13],p).rotation.z=-side*.28;
   }
   const h=head(0,2.64,.12,1,false);h.children.filter(o=>o.isMesh&&o.material===dark&&o.position.z>.7).forEach(o=>o.visible=false);
   cone(accent,[0,-.15,.73],[.18,.56,.18],h).rotation.x=Math.PI/2;
   return h;
  }
  switch(d.kind){

   case 'hydra':{
    quadruped();const h1=head(-.68,2.18,.68,.78,false),h2=head(.68,2.18,.68,.78,false);
    const h3=head(0,2.79,.91,.87,false);
    for(const h of [h1,h2,h3])horns(h);
    tail(true);batWings(1.95,-.38);
    for(let j=0;j<7;j++)cone(mane,[0,1.97-j*.09,-.15-j*.24],[.16,.4,.16]);
    break;
   }
   case 'panther':{
    const h=quadruped();tail(true);
    for(const side of [-1,1])for(let j=0;j<4;j++){
     const stripe=cone(mane,[side*.69,1.66,-.72+j*.39],[.13,.43,.19]);
     stripe.rotation.z=side*.90;
    }
    for(const side of [-1,1]){
     cone(glow,[side*.37,.61,-.08],[.12,.47,.10],h).rotation.z=-side*.27;
     for(let j=0;j<3;j++)cone(cream,[side*.52+j*.08,-.52,.74],[.035,.17,.04],h).rotation.z=Math.PI;
    }
    break;
   }
   case 'griffin':{
    const h=bird();tail(true);
    for(const side of [-1,1]){
     orb(mane,[side*.48,1.37,.55],[.24,.50,.32]);
     for(let j=0;j<3;j++)cone(glow,[side*.25,1.10,.68+j*.13],[.08,.33,.1]);
    }
    for(let j=0;j<5;j++)cone(mane,[(j-2)*.13,.84,0],[.11,.54,.11],h).rotation.z=(j-2)*-.18;
    break;
   }
   case 'leviathan':{
    for(let j=0;j<5;j++){
     const seg=orb(j%2?accent:body,[0,.55+j*.24,.65-j*.40],[.70-j*.055,.42,.65]);
     if(j%2)seg.rotation.y=.24;
     for(const side of [-1,1])cone(mane,[side*(.57-j*.06),.73+j*.24,.61-j*.40],[.20,.55,.14]).rotation.z=-side*.46;
    }
    const h=head(0,2.22,.9,1.06,false);
    horns(h,true);tail(true);
    for(let j=0;j<5;j++)cone(glow,[0,1.32+j*.21,-1.15-j*.13],[.17,.50,.17]);
    break;
   }
   case 'celestial_dragon':{
    const h=quadruped();horns(h,true);tail(true);batWings(2.13,-.3);
    for(let j=0;j<9;j++)cone(mane,[0,2.15-j*.13,.32-j*.23],[.18,.59,.20]);
    for(const side of [-1,1]){
     orb(glow,[side*.67,2.12,-.55],[.19,.24,.19]);
     cone(cream,[side*.17,-.35,.70],[.055,.25,.05],h).rotation.z=Math.PI;
    }
    const halo=mesh('ring',glow,[0,3.77,.10],[.88,.88,1]);halo.rotation.x=Math.PI/3;
    break;
   }
   case 'celestial_phoenix':{
    const h=bird();
    for(const side of [-1,1])for(let j=0;j<5;j++){
     const feather=cone(j%2?mane:glow,[side*(.43+j*.19),1.88-j*.10,-.44-j*.12],[.16,.87+j*.09,.18]);
     feather.rotation.z=side*.48;
    }
    for(let j=0;j<9;j++)cone(j%2?glow:mane,[(j-4)*.16,.94,-.65-Math.abs(j-4)*.12],[.13,1.08,.15]).rotation.x=-.48;
    for(let j=0;j<5;j++)cone(glow,[(j-2)*.13,.75,-.06],[.09,.65,.09],h).rotation.z=(j-2)*-.16;
    const halo=mesh('ring',glow,[0,3.84,0],[.82,.82,1]);halo.rotation.x=.30;
    break;
   }
   case 'celestial_lion':{
    const h=quadruped();tail(true);
    orb(mane,[0,-.02,-.13],[.82,.77,.49],h);
    for(let j=0;j<12;j++){
     const a=j*Math.PI/6;
     const spike=cone(j%2?accent:mane,[Math.sin(a)*.64,Math.cos(a)*.68,-.13],[.19,.46,.15],h);
     spike.rotation.z=-a;
    }
    for(const side of [-1,1])for(let j=0;j<3;j++)cone(cream,[side*.55,.51,-.48+j*.30],[.08,.28,.10]).rotation.z=side*.4;
    break;
   }
   case 'kirin':{
    const h=quadruped();horns(h,true);tail(true);
    cone(glow,[0,1.00,.10],[.16,1.24,.16],h).rotation.x=.17;
    for(let j=0;j<7;j++)orb(j%2?mane:glow,[0,2.63-j*.19,.31-j*.22],[.23,.18,.21]);
    for(const side of [-1,1])for(const z of [-.77,.65])
     orb(glow,[side*.53,.17,z],[.18,.19,.25]);
    const halo=mesh('ring',glow,[0,3.59,.17],[.66,.66,1]);halo.rotation.x=Math.PI/2.6;
    break;
   }
   case 'cat':{
    const h=quadruped();tail();
    mesh('ring',accent,[0,.47,0],[.70,.70,1],h).rotation.x=Math.PI/2;
    cone(mane,[0,1.20,0],[.48,1.36,.48],h).rotation.z=-.16;
    mesh('ring',glow,[0,.77,0],[.30,.30,1],h).rotation.x=Math.PI/2;
    break;
   }
   case 'fox':{
    const h=quadruped();tail(true);
    for(const side of [-1,1])orb(cream,[side*.27,-.28,.41],[.25,.20,.26],h);
    for(let i=0;i<3;i++)cone(dark,[0,1.91-i*.18,.61],[.35-i*.05,.23,.08]).rotation.z=Math.PI;
    break;
   }
   case 'wolf':{
    const h=quadruped();tail(true);
    orb(body,[0,1.88,.33],[.69,.77,.62]);
    for(const side of [-1,1])for(let j=0;j<3;j++)cone(accent,[side*(.55+j*.08),1.79-j*.18,.38],[.21,.50,.23]).rotation.z=-side*.9;
    for(const side of [-1,1])cone(cream,[side*.17,-.32,.65],[.05,.28,.055],h).rotation.z=Math.PI;
    break;
   }
   case 'stag':{const h=quadruped();horns(h,true);tail();orb(glow,[0,.37,.50],[.16,.16,.035],h);break;}
   case 'unicorn':{
    const h=quadruped();tail(true);cone(glow,[0,.83,.24],[.15,1.03,.15],h).rotation.x=.22;
    for(let j=0;j<6;j++)orb(mane,[0,2.32-j*.13,.55-j*.14],[.22,.27,.24]);break;
   }
   case 'cerberus':{
    quadruped();head(-.69,1.96,.77,.80);head(.69,1.96,.77,.80);tail();
    for(let j=0;j<7;j++)cone(glow,[(j-3)*.17,1.79,.81],[.1,.34,.10]);break;
   }
   case 'dragon':
   case 'chimera':{
    const h=quadruped();horns(h);tail(true);batWings(1.85,-.40);
    for(let j=0;j<6;j++)cone(mane,[0,2.05-j*.10,.03-j*.24],[.15,.48,.14]);
    if(d.kind==='chimera'){const goat=head(-.69,2.03,.32,.60,false);horns(goat,true);orb(cream,[-.69,1.73,.52],[.16,.32,.13]);}
    else {orb(accent,[0,-.22,.69],[.31,.25,.47],h);for(const side of [-1,1])cone(cream,[side*.18,-.36,.79],[.055,.22,.055],h).rotation.z=Math.PI;}
    break;
   }
   case 'owl':
   case 'crow':
   case 'phoenix':{
    const h=bird();
    if(d.kind==='owl'){
     orb(accent,[-.25,.04,.36],[.35,.43,.24],h);orb(accent,[.25,.04,.36],[.35,.43,.24],h);eyes(h,true);
     for(const side of [-1,1])cone(body,[side*.39,.54,-.02],[.17,.45,.18],h).rotation.z=-side*.3;
    }else if(d.kind==='crow'){cone(accent,[0,.65,0],[.14,.4,.15],h).rotation.x=-.35;}
    else{
     for(const side of [-1,1])for(let j=0;j<3;j++)cone(glow,[side*(.16+j*.14),.60+j*.07,-.04],[.11,.57,.10],h).rotation.z=-side*.30;
     for(let j=0;j<5;j++)orb(j%2?glow:mane,[(j-2)*.16,.75,-.8-Math.abs(j-2)*.08],[.14,.65,.14]).rotation.x=-.50;
    }
    break;
   }
   case 'bat':{
    orb(body,[0,1.8,0],[.46,.74,.4]);const h=head(0,2.70,.12,.88,true);batWings(2,-.16);
    for(const side of [-1,1]){cone(cream,[side*.18,-.33,.64],[.065,.28,.065],h).rotation.z=Math.PI;orb(accent,[side*.19,.37,0],[.13,.22,.14]);}
    break;
   }
   case 'snake':{
    for(let j=0;j<3;j++)mesh('coil',j%2?accent:body,[0,.32+j*.30,-.25],[1-j*.10,1-j*.10,1],root).rotation.x=Math.PI/2;
    orb(body,[0,1.35,.20],[.30,.70,.30]);orb(mane,[0,1.71,.17],[.64,.80,.15]);
    const h=head(0,2.35,.41,.81,false);
    for(const side of [-1,1])cone(cream,[side*.17,-.23,.62],[.04,.23,.04],h).rotation.z=Math.PI;
    segment([0,-.33,.72],[0,-.33,1.02],.022,glow,h);
    for(const side of [-1,1])segment([0,-.33,1.02],[side*.10,-.33,1.17],.017,glow,h);break;
   }
   case 'spider':{
    orb(body,[0,1.40,-.40],[.79,.60,.81]);orb(accent,[0,1.18,.60],[.45,.38,.43]);
    for(const side of [-1,1])for(let j=0;j<4;j++){
     const z=-.72+j*.42,bend=[side*1.15,1.41+(j%2)*.18,z-.13],tip=[side*(1.48+(j%2)*.09),.1,z+.18];
     segment([side*.49,1.25,z],bend,.075,body);segment(bend,tip,.055,accent);
    }
    for(const x of [-.29,-.10,.10,.29])orb(glow,[x,1.35,.96],[.08,.09,.05]);
    for(const x of [-.13,.13]){orb(glow,[x,1.11,1.01],[.055,.06,.04]);cone(cream,[x,.97,.98],[.04,.24,.055]).rotation.z=Math.PI;}
    orb(mane,[0,1.93,-.48],[.32,.1,.34]);break;
   }
   case 'scorpion':{
    for(let j=0;j<4;j++)orb(j%2?accent:body,[0,.65,.55-j*.40],[.47,.35,.39]);
    for(const side of [-1,1])for(let j=0;j<4;j++){
     segment([side*.3,.6,.49-j*.38],[side*.9,.7,.68-j*.38],.065,body);
     segment([side*.9,.7,.68-j*.38],[side*1.18,.08,.81-j*.38],.045,accent);
    }
    for(const side of [-1,1]){
     segment([side*.37,.74,.79],[side*.88,.92,1.17],.13,body);
     orb(accent,[side*.93,.93,1.35],[.29,.21,.31]);
     for(const n of [-1,1])cone(accent,[side*.93+n*.15,.93,1.66],[.13,.44,.14]).rotation.x=Math.PI/2;
    }
    const points=[[0,.8,-.92],[0,1.21,-1.25],[0,1.79,-1.21],[0,2.29,-.77],[0,2.45,-.22]];
    for(let j=0;j<points.length-1;j++)segment(points[j],points[j+1],.16-j*.02,body);
    cone(glow,[0,2.29,.08],[.19,.61,.19]).rotation.x=-Math.PI*.65;
    for(const x of [-.19,.19])orb(glow,[x,.83,.87],[.07,.085,.05]);break;
   }
   case 'rabbit':{
    orb(body,[0,1.46,0],[.62,.80,.58]);orb(accent,[0,1.25,.47],[.40,.46,.12]);
    const h=head(0,2.4,.21,.97,false);
    for(const side of [-1,1]){
     orb(body,[side*.27,.94,-.06],[.18,.93,.18],h).rotation.z=-side*.16;
     orb(accent,[side*.27,.96,.10],[.09,.66,.035],h).rotation.z=-side*.16;
     orb(body,[side*.47,.39,.28],[.27,.32,.47]);orb(accent,[side*.54,1.46,.49],[.17,.37,.17]);
    }
    orb(accent,[-.23,.11,.59],[.14,.16,.045],h);
    segment([-.30,.04,.65],[-.16,.18,.65],.023,cream,h);segment([-.30,.18,.65],[-.16,.04,.65],.023,cream,h);
    orb(cream,[0,1.16,-.61],[.25,.24,.25]);break;
   }
  }
  g.scale.setScalar(k);g.mat=body;g.userData.halloweenSpecies=id;g.userData.modelVersion='Halloween animals 2026 v1';
  g.userData.customUpdate=(t,phase=0)=>{
   const n=t*2.1+phase;root.position.y=Math.sin(n)*.055;
   heads.forEach((h,i)=>h.rotation.y=Math.sin(n*.53+i)*.065);
   tails.forEach(p=>p.rotation.y=Math.sin(n)*.16);
   legs.forEach((p,i)=>p.rotation.x=Math.sin(n*1.3+(i%2?Math.PI:0))*.085);
   wings.forEach(w=>w.p.rotation.z=w.side*(w.bat?.11:.07)+Math.sin(n*(w.bat?2.2:1.2))*w.side*(w.bat?.19:.08));
  };
  if(scene)scene.add(g);return g;
 }
 function eggDecor(T,species,parent){
  const d=byId.get(species),type=types[d.tier],geo=init(T);
  const dark=new T.MeshBasicMaterial({color:0x251330,side:T.DoubleSide});
  const trim=new T.MeshLambertMaterial({color:type.color,emissive:type.glow});
  for(const side of [-1,1]){
   const eye=new T.Mesh(geo.face,dark);eye.position.set(side*.31,.19,.94);parent.add(eye);
  }
  const mouth=new T.Mesh(geo.box,dark);mouth.position.set(0,-.28,.97);mouth.scale.set(.59,.13,.035);parent.add(mouth);
  const ring=new T.Mesh(geo.ring,trim);ring.rotation.x=Math.PI/2;ring.scale.setScalar(.91);ring.position.y=-.35;parent.add(ring);
  for(let i=0;i<=d.tier;i++){
   const gem=new T.Mesh(geo.sphere,trim);gem.position.set((i-d.tier/2)*.21,.59,.80);gem.scale.setScalar(.09);parent.add(gem);
  }
 }
 function egg(T,e,SZ,scene){
  const d=byId.get(e.s);if(!d)return null;const type=types[d.tier],geo=init(T);
  const g=new T.Group(),shell=new T.Mesh(geo.sphere,new T.MeshLambertMaterial({color:type.color,emissive:type.glow,emissiveIntensity:.46}));
  shell.castShadow=true;g.add(shell);eggDecor(T,e.s,g);
  g.name='Ovo '+type.name;g.userData.halloweenTier=d.tier;g.scale.set(.55,.75,.55).multiplyScalar(SZ[e.z][1]*1.2);
  if(scene)scene.add(g);return g;
 }
 function styleIncubator(T,mesh,species){
  const d=byId.get(species),old=mesh.getObjectByName('HalloweenEggMark');
  if(!d){if(old)mesh.remove(old);mesh.material.emissive.setHex(0);return;}
  const type=types[d.tier];mesh.material.color.setHex(type.color);mesh.material.emissive.setHex(type.glow);
  if(old?.userData.species===species)return;
  if(old)mesh.remove(old);const group=new T.Group();group.name='HalloweenEggMark';group.userData.species=species;
  eggDecor(T,species,group);mesh.add(group);
 }
 function indexHtml(S){
  return '<p><b>🎃 Coleção de Halloween • 24 animais</b></p>'+types.map((t,i)=>{
   const group=defs.filter(d=>d.tier===i),found=group.filter(d=>S.idx[d.id]).length;
   return '<p><b>Ovo '+t.name+' ('+found+'/4)</b><br>'+group.map(d=>S.idx[d.id]?d.name:'???').join(' • ')+
    '<br><small>Chance de aparecer por renovação: '+Number((t.chance*100).toFixed(2))+'%.</small></p>';
  }).join('');
 }
 window.RoubeOvoHalloweenPets={
  types,defs,register,active,endsAt:END,setClock(fn){clock=fn},has:id=>byId.has(id),
  definition:id=>byId.get(id),draw:tier=>{const candidates=defs.filter(d=>d.tier===tier);return candidates[Math.floor(Math.random()*candidates.length)]},
  rarityName:s=>s?.hr!=null?types[s.halloweenTier].name:null,create,egg,styleIncubator,indexHtml,
  auras:Object.fromEntries(types.map((t,i)=>[t.r,[t.color,1.15+i*.16]]))
 };
})();
