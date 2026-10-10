/* Roube um Ovo 3D — animais e biomas visuais v3.
   Modelos procedurais; mesma interface e mesmo save do jogo original. */
(function(){
'use strict';
const SPECIES=[
 ['chicken','dog','bird','owl','raccoon','fox','bear','golem'],
 ['frog','duck','fish','turtle','otter','swan','axolotl','dragon'],
 ['mouse','fox','camel','bird','snake','spider','scorpion','sphinx'],
 ['ape','toucan','croc','gorilla','fruit','spider','tiger','snake'],
 ['penguin','walrus','bear','tiger','mammoth','mammoth','yeti','dragon'],
 ['gecko','frog','bull','iguana','pepper','cerberus','phoenix','dragon'],
 ['fish','swordfish','shark','orca','shark','whale','kraken','leviathan'],
 ['dodo','ptero','ankylosaur','triceratops','bronto','trex','dinosaur','mosasaur'],
 ['centipede','gecko','gorilla','cow','skeleton','dragon','dragon','unicorn'],
 ['crane','salamander','redpanda','owl','koi','stag','tiger','kitsune'],
 ['spider','crab','armored','mantis','rhino','shark','gorilla','dragon'],
 ['sprite','dove','lamb','imp','hound','peacock','angel','dragon'],
 ['gecko','beetle','bluejay','jackalope','panda','fox','lion','skywhale']
];
const GENRE={
 chicken:'bird',dog:'quad',bird:'bird',owl:'bird',raccoon:'quad',fox:'quad',bear:'quad',
 golem:'biped',frog:'amphib',duck:'bird',fish:'fish',turtle:'shell',otter:'quad',
 swan:'bird',axolotl:'amphib',dragon:'dragon',mouse:'quad',camel:'hoof',
 snake:'serpent',spider:'arachnid',scorpion:'arachnid',sphinx:'lion',
 ape:'biped',toucan:'bird',croc:'reptile',gorilla:'biped',fruit:'biped',
 tiger:'quad',penguin:'bird',walrus:'seal',mammoth:'hoof',yeti:'biped',
 gecko:'reptile',bull:'hoof',iguana:'reptile',pepper:'biped',cerberus:'quad',
 phoenix:'bird',swordfish:'fish',shark:'fish',orca:'fish',whale:'fish',
 kraken:'cephalopod',leviathan:'serpent',dodo:'bird',ptero:'bird',
 ankylosaur:'reptile',triceratops:'hoof',bronto:'serpent',trex:'biped',
 dinosaur:'biped',mosasaur:'reptile',centipede:'arachnid',cow:'hoof',
 skeleton:'biped',unicorn:'hoof',crane:'bird',salamander:'reptile',
 redpanda:'quad',koi:'fish',stag:'hoof',kitsune:'quad',crab:'arachnid',
 armored:'reptile',mantis:'arachnid',rhino:'hoof',sprite:'bird',
 dove:'bird',lamb:'hoof',imp:'biped',hound:'quad',peacock:'bird',
 angel:'biped',beetle:'arachnid',bluejay:'bird',jackalope:'hoof',
 panda:'quad',lion:'lion',skywhale:'fish',seal:'seal'
};
const biomePalettes=[
 [0xe1ad4c,0xfdf0bf,0xc78143],[0x66c4ae,0xf6e4a0,0x3596c1],
 [0xd9ad61,0xffe5a7,0xaa6944],[0x56a977,0xffd15b,0x245b44],
 [0xf1f4ff,0x9cdaf8,0x7b9bce],[0xdb593d,0xffb040,0x6e3036],
 [0x50a9e2,0xd1eaff,0x295eaa],[0x7a9c66,0xe5bf7b,0x655742],
 [0x9270e8,0x71e0f2,0x363476],[0xe598b8,0xffddeb,0x725b93],
 [0xa1b0b8,0xe3c67e,0x5a718a],[0xffe9b6,0xf3a6d8,0xa56ea5],
 [0x87e2c9,0xf7d5fa,0x6468c2]
];
let T=null;const shared={},materials=new Map(),shells=new Map();
function init(three){
 if(T===three)return;
 T=three;
 shared.sphere=new T.SphereGeometry(1,12,9);
 shared.box=new T.BoxGeometry(1,1,1);
 shared.cone=new T.ConeGeometry(1,1,9);
 shared.cylinder=new T.CylinderGeometry(1,1,1,9);
 shared.tetra=new T.TetrahedronGeometry(1,0);
 shared.torus=new T.TorusGeometry(1,.14,5,12);
 shared.wing=new T.SphereGeometry(1,9,6);
}
function mat(c){
 const h=(c instanceof T.Color)?c.getHex():c;
 if(!materials.has(h))materials.set(h,new T.MeshLambertMaterial({color:h}));
 return materials.get(h);
}
function colorAccent(id,biome){
 const c=new T.Color(biomePalettes[biome][0]);
 c.offsetHSL((((id*7)%17)-8)/180,0,(((id*3)%9)-4)/70);
 return c;
}
function mesh(g,shape,c,scale,pos){
 const o=new T.Mesh(shared[shape]||shared.sphere,c?.isMaterial?c:mat(c));
 o.scale.set(scale[0],scale[1],scale[2]);o.position.set(pos[0],pos[1],pos[2]);
 o.castShadow=false;g.add(o);return o;
}
function create(three,id,k,col,scene){
 init(three);
 const bi=id>=0&&id<104?Math.floor(id/8):id===104?5:(id-105)%13;
 const slot=id>=0&&id<104?id%8:id===104?7:6;
 const kind=id===104?'dragon':SPECIES[bi]?.[slot]||'dragon';
 const family=GENRE[kind]||'quad';
 const v=(id*17+11)%23,accent=biomePalettes[bi][1],dark=biomePalettes[bi][2];
 const g=new T.Group(),root=new T.Group();g.add(root);
 const base=new T.MeshLambertMaterial({color:col||colorAccent(id,bi)});g.mat=base;
 const hooves=mat(dark),light=mat(accent);
 const motions={root,tail:null,wings:[],legs:[],head:null,kind,id};
 const add=(shape,c,s,p,group=root)=>mesh(group,shape,c,s,p);
 const body=s=>add('sphere',base,s,[0,.95,0]);
 const head=(s,p)=>{const pivot=new T.Group();pivot.position.set(p[0],p[1],p[2]);root.add(pivot);add('sphere',base,s,[0,0,0],pivot);motions.head=pivot;return pivot};
 const eyes=(x,y,z,size=.095,p=root)=>{
  for(const sign of [-1,1]){
   add('sphere',0xf8f8ff,[size*1.4,size*1.22,size*.65],[sign*x,y,z],p);
   add('sphere',0x111621,[size*.65,size*.8,size*.36],[sign*x,y,z+size*.5],p);
  }
 };
 const legs=(x=.55,z=.7,y=.34,sz=.24)=>{
  for(const sx of [-1,1])for(const zz of [-1,1]){
   const p=new T.Group();p.position.set(sx*x,.63,zz*z);root.add(p);
   add('sphere',base,[sz,y,sz],[0,-y*.8,0],p);
   add('sphere',hooves,[sz*1.1,.12,sz*1.4],[0,-y*1.7,.10],p);
   motions.legs.push(p);
  }
 };
 const tail=(length=.8,tip=.28)=>{
  const p=new T.Group();p.position.set(0,1,-.94);root.add(p);
  add('cone',base,[tip,length,tip],[0,.03,-length*.35],p).rotation.x=Math.PI/2.2;
  motions.tail=p;return p;
 };
 const ears=(s=.24,long=.4,p=root)=>{
  for(const x of [-s*2,s*2]){
   add('cone',base,[s,long,s],[x,1.98,.78],p).rotation.z=x>0?-.18:.18;
   add('cone',light,[s*.43,long*.53,s*.45],[x,1.98,.92],p).rotation.z=x>0?-.18:.18;
  }
 };
 const beak=(wide=.3,deep=.3,p=root)=>add('cone',accent,[wide,deep,wide],[0,1.48,1.27],p).rotation.x=Math.PI/2;
 const fins=()=>{
  const d=add('cone',light,[.25,.65,.14],[0,1.76,-.1]);d.rotation.x=.3;
  for(const sx of [-1,1]){const f=add('sphere',base,[.64,.09,.29],[sx*.9,.92,-.03]);f.rotation.z=sx*.25}
  add('cone',base,[.35,.7,.2],[0,.93,-1.42]).rotation.x=Math.PI/2;
 };
 const wings=(feather=false)=>{
  for(const sx of [-1,1]){
   const p=new T.Group();p.position.set(sx*.78,1.47,-.10);root.add(p);
   const w=add('sphere',feather?light:base,[.92,.16,.49],[sx*.62,-.08,-.22],p);
   w.rotation.z=sx*(feather?.32:.18);
   for(let f=0;f<(feather?3:2);f++)add('cone',feather?base:light,[.13,.66,.12],[sx*(.80+f*.24),-.08,-.34],p).rotation.z=sx*1.4;
   motions.wings.push({p,sx});
  }
 };
 const markings=(count=3)=>{
  for(let i=0;i<count;i++){
   const angle=.7+i*1.8+v*.2;
   add('sphere',i%2?hooves:light,[.16+.035*(i%2),.08,.25],[Math.cos(angle)*.68,1.27,Math.sin(angle)*.74]);
  }
 };
 const horns=(num=2,large=false)=>{
  for(let i=0;i<num;i++){
   const x=(i-(num-1)/2)*.56;
   add('cone',large?0xf3e0bf:light,[large?.19:.13,large?.8:.5,.16],[x,2.29,.81]).rotation.z=x*.12;
  }
 };
 // Anatomias próprias por família; cada espécie tem marcação, paleta e acessórios exclusivos.
 if(family==='fish'){
  body([.65,.57,1.15+(v%3)*.13]);head([.5,.47,.48],[0,1.10,.70]);
  eyes(.31,1.27,1.11,.115);fins();
  add('sphere',light,[.34,.035,.18],[0,.99,1.17]);
  if(['shark','orca','swordfish','skywhale','whale'].includes(kind)){
   add('cone',dark,[.35,.63,.12],[0,1.62,.1]).rotation.x=-.35;
   add('sphere',light,[.48,.17,.64],[0,.66,.30]);
  }
  if(kind==='swordfish')add('cone',0xdceefe,[.10,1.1,.1],[0,1.08,1.62]).rotation.x=Math.PI/2;
  if(kind==='koi'||kind==='fish')markings(4);
  if(kind==='skywhale'){wings(true);horns(1,true)}
 }else if(family==='bird'){
  body([.75,.76,.82]);const hd=head([.51,.48,.48],[0,1.56,.55]);eyes(.25,.13,.40,.1,hd);
  beak(kind==='toucan'?.26:.18,kind==='toucan'?.85:.33);
  legs(.40,.34,.31,.15);wings(kind==='phoenix'||kind==='peacock'||kind==='crane');
  const plume=kind==='chicken'||kind==='phoenix'||kind==='peacock'||kind==='toucan';
  if(plume)for(let i=0;i<3;i++)add('cone',kind==='phoenix'?0xffa020:accent,[.17,.52,.14],[(i-1)*.18,2.18,.55]).rotation.z=(i-1)*-.22;
  if(kind==='owl'){add('sphere',light,[.54,.16,.18],[0,1.66,.90]);ears(.19,.28)}
  if(kind==='swan'||kind==='crane')add('cylinder',base,[.20,.75,.19],[0,1.46,.52]);
  if(kind==='penguin')add('sphere',light,[.58,.61,.22],[0,.99,.65]);
  if(kind==='peacock')for(let i=-2;i<=2;i++)add('sphere',i%2?0x28b88b:0x297db7,[.26,.64,.07],[i*.28,1.57,-.82]).rotation.z=-i*.17;
 }else if(family==='dragon'){
  body([.81,.72,1.08]);const hd=head([.57,.48,.60],[0,1.63,.79]);eyes(.31,.16,.51,.10,hd);
  add('sphere',light,[.42,.24,.35],[0,-.17,.51],hd);legs(.58,.68,.34,.20);wings();horns(2,true);
  tail(1.35,.34);
  for(let i=0;i<4;i++)add('cone',accent,[.18,.4,.16],[0,1.68-i*.06,.24-i*.40]).rotation.x=-.1;
  if(kind==='cerberus')for(const x of [-.65,.65])add('sphere',base,[.31,.3,.40],[x,1.65,.77]);
  if(id===104){for(let j=0;j<5;j++)add('cone',0xff8a1d,[.18,.5,.17],[Math.sin(j*1.2)*.6,1.75,-j*.27]);}
 }else if(family==='arachnid'){
  body([.69,.49,.94]);head([.50,.35,.45],[0,1.13,.65]);eyes(.22,1.25,1.08,.09);
  for(const sx of [-1,1])for(let i=0;i<4;i++){
   const bar=add('cylinder',base,[.09,.92,.08],[sx*(.66+i*.09),.92,-.74+i*.46]);
   bar.rotation.z=sx*(.72+i*.07);bar.rotation.x=i%2?.25:-.16;
  }
  if(kind==='scorpion'){
   const p=tail(1.1,.21);p.rotation.x=-.75;add('cone',accent,[.25,.5,.25],[0,.82,-1.15]).rotation.x=-.6;
  }
  if(kind==='crab')for(const sx of [-1,1])add('sphere',light,[.42,.30,.27],[sx*1.23,1.2,.83]);
  if(kind==='beetle')add('sphere',light,[.66,.30,.75],[0,1.23,-.20]);
  if(kind==='mantis')add('cone',accent,[.24,.85,.19],[0,1.75,.82]).rotation.x=.5;
 }else if(family==='serpent'){
  body([.51,.49,1.23]);const hd=head([.51,.40,.52],[0,1.39,.84]);eyes(.28,.08,.43,.10,hd);
  for(let i=0;i<4;i++)add('sphere',i%2?base:light,[.41-i*.055,.30-i*.036,.34],[Math.sin(i*.7)*.20,.84-i*.08,-.78-i*.47]);
  if(['bronto','leviathan','snake'].includes(kind)){add('cone',light,[.17,.55,.17],[0,1.83,.65]);}
  if(kind==='leviathan'||kind==='bronto')fins();
 }else if(family==='reptile'||family==='amphib'||family==='shell'){
  const isTurtle=family==='shell';body(isTurtle?[.89,.5,1.02]:[.75,.40,1.00]);
  const hd=head([.56,.42,.53],[0,1.18,.74]);eyes(.30,.18,.44,.11,hd);legs(.57,.71,.25,.21);
  if(isTurtle){
   add('sphere',0x385c47,[.85,.40,.86],[0,1.18,-.15]);
   for(let i=0;i<5;i++){const a=i*Math.PI*2/5;add('sphere',light,[.22,.05,.26],[Math.cos(a)*.47,1.53,Math.sin(a)*.47-.15])}
  }else{
   tail(.85,.20);if(kind==='axolotl'||kind==='salamander')for(const sx of [-1,1])for(let i=0;i<3;i++)add('cone',0xfb8bad,[.15,.45,.13],[sx*.49,1.28+i*.18,.73]).rotation.z=sx*1.13;
   if(kind==='croc')add('box',light,[.45,.10,.40],[0,.94,1.23]);
   if(kind==='ankylosaur')for(let i=0;i<5;i++)add('cone',light,[.18,.45,.16],[0,1.40,-.82+i*.33]);
  }
  if(family==='amphib')add('sphere',light,[.39,.12,.35],[0,1.03,.98]);
 }else if(family==='hoof'||family==='lion'||family==='quad'){
  body([.85,.68,1.10+(v%3)*.13]);const hd=head([.56,.54,.52],[0,1.52,.77]);eyes(.27,.16,.48,.11,hd);
  legs(.58,.68,.39,.22);tail(.78,.22);
  const longEars=['fox','dog','mouse','jackalope','kitsune','fennec','redpanda','raccoon','hound'].includes(kind);
  if(longEars)ears(.20,kind==='jackalope'?.95:.52);
  if(['unicorn','stag','triceratops','bull','rhino','mammoth','camel','cow'].includes(kind))horns(kind==='unicorn'||kind==='rhino'?1:2,kind==='stag'||kind==='mammoth');
  if(kind==='unicorn')add('cone',0xffd8fa,[.2,.95,.2],[0,2.5,.86]);
  if(kind==='lion'||kind==='tiger'||kind==='fox'||kind==='kitsune')markings(4);
  if(kind==='panda')for(const sx of [-1,1])add('sphere',dark,[.23,.21,.07],[sx*.29,1.7,1.2]);
  if(kind==='mammoth'||kind==='walrus')for(const sx of [-1,1])add('cone',0xffefc9,[.15,.72,.15],[sx*.32,1.20,1.33]).rotation.x=Math.PI/2;
  if(kind==='camel')for(const sx of [-.38,.38])add('sphere',base,[.36,.35,.30],[0,1.60,sx]);
  if(kind==='triceratops')add('sphere',light,[.75,.60,.24],[0,1.68,.51]);
 }else if(family==='seal'){
  body([.91,.55,1.20]);head([.50,.42,.48],[0,1.28,.82]);eyes(.27,1.38,1.20,.11);
  fins();add('sphere',light,[.30,.11,.24],[0,1.10,1.19]);
 }else if(family==='cephalopod'){
  body([.65,.75,.67]);head([.72,.62,.69],[0,1.67,.19]);eyes(.37,1.72,.77,.16);
  for(let i=0;i<8;i++){
   const ang=i*Math.PI/4;
   const limb=add('cylinder',i%2?base:light,[.13,.66,.13],[Math.cos(ang)*.56,.37,Math.sin(ang)*.59]);
   limb.rotation.z=Math.sin(ang)*.7;
  }
  horns(2,true);
 }else{ // biped, gorilas, esqueletos, yetis, demônios e criaturas humanoides
  body([.74,.89,.60]);const hd=head([.54,.51,.51],[0,2.11,.48]);eyes(.28,.10,.47,.11,hd);
  for(const sx of [-1,1]){
   add('sphere',base,[.31,.56,.28],[sx*.62,.85,0]);
   add('sphere',hooves,[.29,.19,.33],[sx*.62,.25,.14]);
   add('sphere',base,[.27,.64,.27],[sx*.93,1.38,0]);
  }
  if(['yeti','gorilla','ape','trex','dinosaur'].includes(kind))markings(3);
  if(['imp','skeleton','golem'].includes(kind))horns(2);
  if(kind==='angel')wings(true);
  if(kind==='skeleton')add('sphere',0xf9f0d9,[.46,.22,.22],[0,1.20,.56]);
  if(kind==='fruit')add('cone',0x629635,[.47,.62,.40],[0,2.58,.05]);
 }
 // Assinatura 3D específica: listras ou manchas, adereços únicos por espécie.
 if(kind==='redpanda'||kind==='raccoon')for(const zz of [-.40,-.73,-1.04])add('sphere',light,[.31,.08,.13],[0,1.00,zz]);
 if(kind==='owl'||kind==='tiger'||kind==='leopard')markings(3);
 if(id%5===0&&family!=='fish'&&family!=='arachnid')add('sphere',light,[.16,.12,.20],[0,1.02,.83]);
 if(id%7===3&&family==='quad')add('cone',accent,[.19,.53,.14],[0,2.14,.61]);
 if(id%8===7){horns(2,true);add('sphere',light,[.23,.23,.23],[0,2.50,.25]);}
 g.scale.setScalar(k);g.userData.motion=motions;g.userData.speciesId=id;
 scene.add(g);return g;
}
function animate(g,t,phase){
 const a=g?.userData?.motion;if(!a)return;
 const n=t*2.2+(phase||0);
 if(a.tail)a.tail.rotation.y=Math.sin(n)*.35;
 for(const w of a.wings)w.p.rotation.z=w.sx*(.12+Math.sin(n*1.8)*.15);
 if(a.head)a.head.rotation.y=Math.sin(n*.55)*.075;
 for(let i=0;i<a.legs.length;i++)a.legs[i].rotation.x=Math.sin(n*1.35+(i%2?Math.PI:0))*.12;
}
function egg(three,e,GS,SZ,limitedId,scene){
 init(three);
 const id=e.s,limited=id===limitedId,b=Math.floor(id/8);
 let material=shells.get(id);
 if(!material){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d');
  const hue=limited?12:(id*37%360),h=(v)=>'hsl('+hue+', '+v+')';
  ctx.fillStyle=h(limited?'89%, 39%':'67%, 53%');ctx.fillRect(0,0,64,64);
  ctx.fillStyle=h('78%, 70%');
  const pattern=id%4;
  for(let i=0;i<9;i++)for(let j=0;j<7;j++){
   const x=(i*9+j*4+id)%70,y=j*10;
   if(pattern===0){ctx.beginPath();ctx.arc(x,y,2.3,0,Math.PI*2);ctx.fill()}
   else if(pattern===1)ctx.fillRect(x,y,7,2);
   else if(pattern===2){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+5,y+3);ctx.lineTo(x,y+7);ctx.fill()}
   else{ctx.beginPath();ctx.arc(x,y,4,Math.PI*.12,Math.PI*.88);ctx.strokeStyle=h('70%, 82%');ctx.lineWidth=2;ctx.stroke()}
  }
  ctx.strokeStyle=h('78%, 26%');ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(0,12+(id%7));for(let x=0;x<=64;x+=4)ctx.lineTo(x,12+(id%7)+Math.sin(x*.20+id)*3);ctx.stroke();
  ctx.fillStyle=limited?'#ffd06a':b%2?'#ffffff':'#e8ffe7';
  ctx.beginPath();ctx.arc(32,38,6,0,Math.PI*2);ctx.fill();
  const texture=new T.CanvasTexture(canvas);
  texture.anisotropy=2;
  material=new T.MeshLambertMaterial({map:texture,color:0xffffff,emissive:limited?0x8c2a10:e.j>=5?0x201510:0x000000,emissiveIntensity:limited?.48:.15});
  shells.set(id,material);
 }
 const g=new T.Mesh(GS,material);
 g.castShadow=!((navigator.maxTouchPoints||0)>0);
 g.scale.set(.55,.75,.55).multiplyScalar(SZ[e.z][1]*1.2*(limited?3.8:1));
 scene.add(g);return g;
}
function decorate(three,scene,biomes){
 init(three);
 // Somente InstancedMesh: novos detalhes sem centenas de draw calls no Android.
 const mat4=new T.Matrix4(),q=new T.Quaternion(),p=new T.Vector3(),scale=new T.Vector3();
 for(let b=0;b<biomes.length;b++){
  const zc=-65-70*b,colors=biomePalettes[b],n=24;
  const feature= b===1||b===6?'sphere':b===2||b===5||b===8?'cone':b===9||b===12?'sphere':'cone';
  const base=new T.InstancedMesh(shared.cylinder,mat(0x786f68),n);
  const top=new T.InstancedMesh(shared[feature],mat(colors[1]),n);
  for(let i=0;i<n;i++){
   const seed=(b+1)*263+(i+1)*47,side=i%2?-1:1;
   const x=side*(35+(seed*37%55)),z=zc-29+(seed*19%58);
   const height=.65+(seed%5)*.24;
   mat4.compose(p.set(x,height*.5,z),q,scale.set(.13+(b%3)*.06,height,.13+(b%3)*.06));
   base.setMatrixAt(i,mat4);
   mat4.compose(p.set(x,height+.25,z),q,scale.set(.45+((seed*3)%9)*.08,.55+((seed*7)%6)*.15,.45+((seed*3)%9)*.08));
   top.setMatrixAt(i,mat4);
   const tint=new T.Color(colors[i%3]);top.setColorAt(i,tint);
  }
  base.instanceMatrix.needsUpdate=true;top.instanceMatrix.needsUpdate=true;
  if(top.instanceColor)top.instanceColor.needsUpdate=true;
  base.castShadow=false;top.castShadow=false;base.receiveShadow=false;top.receiveShadow=false;
  base.frustumCulled=top.frustumCulled=false;scene.add(base,top);
 }
}
window.RoubeOvoVisuals={create,animate,egg,decorate,species:SPECIES};
})();
