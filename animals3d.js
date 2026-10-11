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
 // 3º e 4º MOB: anatomias próprias; nada de reaproveitar corpo de pato.
 // Usar cores locais fixas: a tinta de raridade não apaga a máscara do guaxinim.
 if(id===3){
  // CORUJA: postura vertical, enorme disco facial, olhos voltados à frente e penas laterais.
  const feather=mat(0x714b30),feather2=mat(0x976a46),sand=mat(0xcaa77b),
        face=mat(0xf5dfac),ink=mat(0x202024),iris=mat(0xeeae22);
  const poly=(c,s,p,pa=root)=>{
   const o=new T.Mesh(new T.IcosahedronGeometry(1,1),c);
   o.scale.set(...s);o.position.set(...p);pa.add(o);return o;
  };
  // Cabeça maior que o tronco, silhueta quase cilíndrica — diferente de uma galinha.
  poly(feather,[.55,.82,.51],[0,.87,-.03]);
  poly(sand,[.43,.66,.24],[0,.90,.43]);
  for(let i=0;i<5;i++)
   poly(i%2?face:sand,[.12,.30,.085],[(i-2)*.16,.96+(i%2)*.06,.66]);
  const h=new T.Group();h.position.set(0,1.83,.09);root.add(h);motions.head=h;
  poly(feather,[.72,.65,.52],[0,0,0],h);
  // Disco facial bipartido de coruja, bordas em coração ao redor dos olhos.
  for(const sx of [-1,1]){
   poly(sand,[.43,.48,.16],[sx*.29,-.01,.40],h);
   poly(face,[.365,.407,.135],[sx*.29,-.03,.52],h);
   poly(feather2,[.26,.30,.045],[sx*.29,.04,.637],h);
   poly(iris,[.22,.235,.044],[sx*.29,.045,.681],h);
   poly(ink,[.13,.167,.042],[sx*.29,.045,.728],h);
   poly(face,[.048,.058,.020],[sx*.26,.105,.758],h);
   const brow=add('cone',feather,[.21,.55,.20],[sx*.41,.53,.09],h);brow.rotation.z=-sx*.29;
  }
  // Bico curto em gancho para baixo, nunca um bico de pato.
  const hook=add('cone',iris,[.165,.37,.155],[0,-.28,.65],h);
  hook.rotation.x=-.18;
  // Asas compactas presas ao tórax, cinco penas pontiagudas em cada lado.
  for(const sx of [-1,1]){
   const w=new T.Group();w.position.set(sx*.53,1.15,-.13);root.add(w);
   poly(feather,[.25,.48,.42],[sx*.08,-.08,0],w);
   for(let f=0;f<5;f++){
    const tip=add('cone',f%2?feather2:feather,[.105,.43-.037*f,.10],
      [sx*(.11+f*.06),-.38+(f*.08),-.25+f*.09],w);
    tip.rotation.z=-sx*(.26+f*.08);
   }
   motions.wings.push({p:w,sx});
   add('cylinder',feather2,[.12,.33,.12],[sx*.31,.26,.20]);
   for(let c=-1;c<=1;c++){
    const talon=add('cone',iris,[.047,.19,.047],[sx*.31+c*.095,.075,.39]);
    talon.rotation.x=Math.PI/2;
   }
  }
  for(let t=-2;t<=2;t++)poly(t%2?feather:feather2,[.105,.13,.37],[t*.13,.66,-.55]);
  // Tufos verticais nas laterais da cabeça tornam a coruja reconhecível por trás.
  for(const sx of [-1,1]){
   const tuft=add('cone',feather,[.19,.43,.17],[sx*.52,2.43,-.05]);
   tuft.rotation.z=-sx*.27;
  }
 }else if(id===4){
  // GUAXINIM: tronco horizontal alongado, quatro patas, olhos com máscara e cauda ANELADA.
  const fur=mat(0x757676),under=mat(0xa7a6a0),white=mat(0xe8e3d8),
        mask=mat(0x202127),dark=mat(0x141519),tailGray=mat(0xbbb8af);
  const poly=(c,s,p,pa=root)=>{
   const o=new T.Mesh(new T.IcosahedronGeometry(1,1),c);
   o.scale.set(...s);o.position.set(...p);pa.add(o);return o;
  };
  poly(fur,[.63,.49,1.18],[0,.89,-.21]);
  poly(under,[.49,.27,.91],[0,.62,.13]);
  // Pescoço curto e cabeça baixa, orientada no eixo +Z.
  const h=new T.Group();h.position.set(0,1.08,.72);root.add(h);motions.head=h;
  poly(fur,[.53,.39,.46],[0,.12,.05],h);
  poly(white,[.44,.26,.18],[0,-.09,.47],h);
  // Faixa preta de máscara atravessa ambos os olhos: marca registrada do guaxinim.
  poly(mask,[.49,.18,.105],[0,.20,.426],h);
  for(const sx of [-1,1]){
   poly(mask,[.265,.24,.075],[sx*.235,.18,.502],h);
   poly(white,[.115,.128,.036],[sx*.225,.21,.570],h);
   poly(dark,[.066,.08,.028],[sx*.225,.21,.607],h);
   const ear=add('cone',fur,[.20,.31,.17],[sx*.40,.50,-.01],h);ear.rotation.z=-sx*.12;
   add('cone',white,[.097,.17,.070],[sx*.41,.49,.12],h).rotation.z=-sx*.12;
   poly(white,[.22,.13,.18],[sx*.15,-.10,.61],h);
  }
  poly(dark,[.125,.084,.115],[0,-.10,.77],h);
  // Quatro patas visíveis, com pés e dedos escuros.
  for(const sx of [-1,1])for(const zz of [-1,1]){
   const leg=new T.Group();leg.position.set(sx*.41,.73,zz*.72);root.add(leg);
   poly(fur,[.21,.40,.23],[0,-.25,0],leg);
   poly(mask,[.24,.12,.30],[0,-.59,.20],leg);
   for(let c=-1;c<=1;c++)poly(dark,[.060,.045,.13],[c*.12,-.64,.42],leg);
   motions.legs.push(leg);
  }
  // Cauda longa e bem grossa, projetada para trás e para o lado.
  // Dez segmentos alternam cinza/preto criando anéis legíveis em distância.
  const tt=new T.Group();tt.position.set(.06,1.02,-1.18);root.add(tt);
  for(let i=0;i<10;i++){
   const band=i%2?mask:(i%4===0?tailGray:fur);
   poly(band,[.26-i*.012,.235-i*.008,.205],
    [.14*Math.sin(i*.22)+i*.07,.14*Math.sin(i*.18)+i*.065,-.20-i*.25],tt);
  }
  motions.tail=tt;
  // Cheeks and shoulder stripes emphasize the face and running silhouette.
  for(const sx of [-1,1]){
   poly(under,[.14,.31,.29],[sx*.56,.98,.33]);
   poly(mask,[.12,.07,.39],[sx*.57,1.12,-.28]);
  }
 }else if(family==='fish'){
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
 // Silhueta personalizada por espécie, para animais não parecerem o mesmo modelo recolorido.
 const naturalColors={"chicken":16378578,"dog":12421457,"bird":6269146,"owl":9531466,"raccoon":7897994,"fox":14382908,"bear":8477763,"fish":5679290,"turtle":6915418,"duck":16309899,"frog":5487732,"penguin":3951714,"walrus":10059117,"axolotl":16360393,"camel":12951644,"scorpion":9139802,"tiger":14391118,"gorilla":6120309,"panda":15265260,"redpanda":13469507,"peacock":3770293,"crab":13920365,"phoenix":15693378,"shark":6458282,"orca":4937323,"whale":7185338,"angelfish":7789020};
 const silhouettes={"chicken":[0.85,0.85,0.95],"dog":[0.92,1,1.2],"bird":[0.94,0.88,0.96],"owl":[1.06,1.3,0.88],"raccoon":[0.91,0.92,1.06],"fox":[0.78,0.91,1.28],"bear":[1.22,1.15,1.1],"tiger":[1.05,1.1,1.46],"lion":[1.12,1.2,1.37],"camel":[1.07,1.28,1.4],"turtle":[1.3,0.78,1.24],"fish":[1.12,0.86,1.5],"shark":[1.22,0.85,1.65],"whale":[1.48,0.92,1.77],"skywhale":[1.46,1.05,1.88],"frog":[1.28,0.78,1.1],"panda":[1.22,1.18,1.08],"walrus":[1.35,0.81,1.35],"penguin":[0.85,1.25,0.86],"dragon":[1.12,1.16,1.35],"trex":[0.89,1.39,1.6],"unicorn":[1.02,1.26,1.23],"cerberus":[1.25,1.14,1.21],"kitsune":[0.95,1.05,1.24],"octopus":[1.18,0.99,1.23],"kraken":[1.36,1.3,1.3]};
 const form=silhouettes[kind];
 if(form)root.scale.set(form[0],form[1],form[2]);
 // Cores zoológicas dos pets comuns; raridades especiais mantêm as cores originais.
 if(slot<5&&naturalColors[kind]!==undefined&&id!==104)
   base.color.lerp(new T.Color(naturalColors[kind]),.66);
 // Marcadores anatômicos exclusivos — focinhos, caudas, plumagem e padrões.
 if(kind==='chicken'){
  for(let i=0;i<3;i++)add('cone',0xd92d2d,[.16,.37,.15],[(i-1)*.16,2.15,.60]).rotation.z=(i-1)*-.2;
  add('sphere',0xdb3e39,[.13,.27,.13],[0,1.27,1.12]);
 }
 if(kind==='dog'){
  for(const sx of [-1,1]){const ear=add('sphere',0x7d5137,[.26,.45,.16],[sx*.46,1.95,.60]);ear.rotation.z=sx*.65;}
  add('sphere',0x32282b,[.23,.16,.17],[0,1.50,1.37]);
 }
 if(kind==='owl'){
  for(const sx of [-1,1]){add('sphere',0xf0c981,[.27,.30,.10],[sx*.27,1.67,1.23]);add('sphere',0x1e2025,[.13,.19,.10],[sx*.27,1.69,1.34]);}
  add('cone',0xc68d39,[.16,.25,.15],[0,1.50,1.38]).rotation.x=.6;
 }
 if(kind==='raccoon'){
  for(const sx of [-1,1])add('sphere',0x282e38,[.29,.23,.11],[sx*.28,1.70,1.24]);
  for(let i=0;i<4;i++)add('sphere',i%2?0xe6ebeb:0x333943,[.33,.16,.16],[0,.95,-1.0-i*.16]);
 }
 if(kind==='fox'||kind==='kitsune'){
  add('cone',0xfff1dc,[.38,.92,.34],[0,1.14,-1.62]).rotation.x=-Math.PI/2.8;
  add('sphere',0xffffff,[.31,.20,.28],[0,1.31,1.16]);
  if(kind==='kitsune')for(const sx of [-1,1])add('cone',0xffdcb9,[.20,1.03,.17],[sx*.50,1.05,-1.40]).rotation.x=-1.35;
 }
 if(kind==='bear'||kind==='panda'){
  for(const sx of [-1,1])add('sphere',kind==='panda'?0x24252c:0x67432e,[.23,.24,.22],[sx*.37,1.95,.63]);
  add('sphere',0xe3c3a0,[.40,.25,.27],[0,1.42,1.22]);
  add('sphere',0x353334,[.18,.13,.10],[0,1.49,1.47]);
 }
 if(kind==='tiger'){
  for(const sx of [-1,1])for(let i=0;i<5;i++){
   const mark=add('box',0x3e281e,[.06,.24,.12],[sx*.80,1.01,-.74+i*.34]);mark.rotation.z=sx*.20;
  }
 }
 if(kind==='lion'){add('sphere',0xb97936,[.73,.70,.32],[0,1.60,.43]);add('sphere',base,[.48,.48,.47],[0,1.67,.88]);}
 if(kind==='walrus'){for(const sx of [-1,1])add('cone',0xfff3da,[.13,.62,.14],[sx*.24,1.03,1.40]).rotation.x=Math.PI/2.6;}
 if(kind==='penguin'){add('sphere',0xf2f0e3,[.53,.74,.18],[0,1.01,.73]);for(const sx of [-1,1])add('sphere',0x222e39,[.58,.11,.34],[sx*.76,1.05,-.10]);}
 if(kind==='panda')for(const sx of [-1,1])add('sphere',0x202129,[.31,.41,.31],[sx*.65,.95,.40]);
 if(kind==='camel')for(const zz of [-.38,.36])add('sphere',0xaf8445,[.37,.44,.38],[0,1.69,zz]);
 if(kind==='scorpion')for(const sx of [-1,1]){add('sphere',0x8b4935,[.42,.30,.36],[sx*1.16,1.10,.63]);add('cone',0xbc6948,[.22,.49,.17],[sx*1.45,1.29,.72]).rotation.z=sx*.9;}
 if(kind==='dragon'||kind==='phoenix'||kind==='skywhale'){
  for(const sx of [-1,1]){
   const sail=add('cone',id===104?0xff9039:accent,[.38,1.25,.20],[sx*1.55,1.71,-.60]);
   sail.rotation.z=sx*.88;sail.rotation.x=-.25;
  }
 }
 if(kind==='trex'){for(const sx of [-1,1])add('sphere',base,[.19,.23,.21],[sx*.68,1.77,.60]);add('sphere',0xeee2d3,[.41,.12,.24],[0,2.11,1.00]);}
 if(kind==='turtle'||kind==='ankylosaur')for(let i=0;i<6;i++)add('sphere',0xb9d2a5,[.14,.09,.17],[Math.cos(i)*.64,1.55,Math.sin(i)*.60-.12]);
 if(kind==='unicorn'){for(let i=0;i<5;i++)add('cone',i%2?0xe3b6f8:0xa4e5f4,[.12,.29,.12],[0,2.13-i*.06,.42-i*.21]).rotation.x=.3;}
 if(kind==='kraken')for(let i=0;i<6;i++){const a=i*Math.PI/3;add('sphere',0xbacaf4,[.14,.20,.18],[Math.cos(a)*.83,.46,Math.sin(a)*.81]);}
 // Assinatura 3D específica: listras ou manchas, adereços únicos por espécie.
 // Guardiões lendários: anatomias especiais, não apenas bichos maiores da mesma cor.
 if(kind==='cerberus'){
   // Três cabeças caninas independentes, três narizes, olhos e crinas de lava.
   for(const side of [-1,1]){
     add('sphere',base,[.42,.42,.45],[side*.82,1.64,.82]);
     add('sphere',0xcf6549,[.31,.19,.32],[side*.82,1.43,1.23]);
     add('sphere',0x231b21,[.13,.12,.13],[side*.82,1.47,1.51]);
     for(const eye of [-1,1])add('sphere',0xffe97e,[.095,.095,.055],[side*.82+eye*.20,1.78,1.22]);
     for(const ear of [-1,1])add('cone',0x622231,[.18,.39,.17],[side*.82+ear*.26,2.12,.75]).rotation.z=ear*.17;
   }
   for(let t=0;t<3;t++)add('cone',0xff712a,[.24,.53,.21],[(t-1)*.35,1.84,-.58-t*.20]);
   add('sphere',0x9a282d,[1.08,.44,.8],[0,.93,.13]);
 }
 if(kind==='trex'){
   // Silhueta de dinossauro: cauda pesada, focinho longo e dentes pontudos.
   tail(2.15,.49);
   add('sphere',base,[.55,.29,.68],[0,2.09,1.06]);
   for(const eye of [-1,1])add('sphere',0xfef6b5,[.16,.13,.09],[eye*.33,2.32,1.13]);
   for(let t=0;t<5;t++)add('cone',0xf2eddf,[.07,.27,.07],[(t-2)*.18,1.77,1.53]).rotation.x=Math.PI;
 }
 if(kind==='sphinx'){
   // Sphinx royal: asas arqueadas, colar e diadema do deserto.
   wings(true);
   add('box',0xffd875,[1.07,.18,.17],[0,1.58,.97]);
   add('cone',0xfde3a0,[.23,.97,.23],[0,2.53,.78]);
   for(const side of [-1,1])add('sphere',0xf6bb5d,[.32,.53,.18],[side*.55,1.74,.55]);
 }
 if(id===68){ // Chefe Cosmic Skeleton
   add('sphere',0xf1f1dc,[.52,.42,.46],[0,2.15,.55]);
   for(const eye of [-1,1])add('sphere',0x161b35,[.16,.20,.09],[eye*.21,2.24,.96]);
   for(let j=0;j<4;j++)add('box',0xdce2eb,[.64,.065,.12],[0,1.60-j*.16,.58]);
   for(const side of [-1,1])add('cylinder',0xebebd6,[.11,.69,.11],[side*.62,1.20,.14]);
 }
 if(id===78){ // Oni Tiger
   for(const side of [-1,1])add('cone',0x9c2346,[.26,.92,.26],[side*.40,2.32,.66]).rotation.z=side*.22;
   for(const side of [-1,1])add('sphere',0xf25762,[.24,.15,.08],[side*.29,1.74,1.22]);
   add('sphere',0xf0d8c9,[.32,.19,.22],[0,1.37,1.22]);
 }
 if(id===86){ // Gorilla King
   add('box',0x465575,[1.67,.64,.60],[0,1.74,-.02]);
   add('cylinder',0xffcd3f,[.65,.32,.63],[0,2.66,.46]);
   for(let t=-2;t<=2;t++)add('cone',0xffdd67,[.16,.49,.17],[t*.27,2.99,.46]);
   add('sphere',0x65d8ec,[.24,.24,.13],[0,2.63,.94]);
 }
 if(id===102){ // Celestial Sunlion
   add('sphere',0xffd469,[.83,.81,.44],[0,1.61,.38]);
   for(let k=0;k<9;k++){
     const a=k*Math.PI*2/9;
     const ray=add('cone',k%2?0xffb245:0xffeb86,[.17,.62,.15],[Math.sin(a)*.70,1.64+Math.cos(a)*.66,.36]);
     ray.rotation.z=-a;
   }
   add('sphere',0xffebc1,[.50,.50,.47],[0,1.65,.93]);
   for(const side of [-1,1])add('sphere',0x442c34,[.10,.11,.09],[side*.24,1.79,1.33]);
 }
 if(kind==='redpanda'||kind==='raccoon')for(const zz of [-.40,-.73,-1.04])add('sphere',light,[.31,.08,.13],[0,1.00,zz]);
 if(kind==='owl'||kind==='tiger'||kind==='leopard')markings(3);
 if(id%5===0&&family!=='fish'&&family!=='arachnid')add('sphere',light,[.16,.12,.20],[0,1.02,.83]);
 if(id%7===3&&family==='quad')add('cone',accent,[.19,.53,.14],[0,2.14,.61]);
 if(id%8===7){horns(2,true);add('sphere',light,[.23,.23,.23],[0,2.50,.25]);}
 const sizeMultiplier=id===3?.72:id===4?1.85:1;
 g.scale.setScalar(k*sizeMultiplier);g.userData.motion=motions;g.userData.speciesId=id;
 // Importar a malha animada original do Quaternius (Cube World Kit, CC0).
 // Enquanto interpreta o glTF, a malha local funciona como fallback.
 if(id===4 && T.GLTFLoader && typeof RACCOON_SOURCE_JSON==="string"){
  try{
   new T.GLTFLoader().parse(RACCOON_SOURCE_JSON,"",function(asset){
    if(!asset.scene||!asset.scene.children.length)return;
    asset.scene.traverse(function(node){if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}});
    g.add(asset.scene);root.visible=false;
    g.userData.modelVersion="Quaternius CubeWorld Raccoon CC0";
    if(asset.animations&&asset.animations.length&&T.AnimationMixer){
     const mixer=new T.AnimationMixer(asset.scene);
     const selected=asset.animations.find(function(x){return x.name==="Idle";})||asset.animations[0];
     mixer.clipAction(selected).play();
     g.userData.mixer=mixer;
     g.userData.mixerLastTime=null;
    }
   },function(error){console.warn("Guaxinim Quaternius: fallback local",error)});
  }catch(error){console.warn("Guaxinim Quaternius: fallback local",error);}
 }

 g.userData.mobSizeMultiplier=sizeMultiplier;
 scene.add(g);return g;
}
function animate(g,t,phase){
 if(g?.userData?.mixer){
  const last=g.userData.mixerLastTime;
  g.userData.mixerLastTime=t;
  g.userData.mixer.update(Math.min(.08,Math.max(0,last===null?0:t-last)));
  return;
 }
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
function terrain(three,rx,ry){
 init(three);
 // Solo com manchas, pontinhos de grama e microveios no lugar do xadrez simples.
 // As cores de cada bioma vêm do material original; os caminhos permanecem nos mesmos lugares.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#e9efe0';ctx.fillRect(0,0,128,128);
 let seed=4317;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<95;i++){
  const x=random()*128,y=random()*128,r=3+random()*13;
  ctx.fillStyle=i%3===0?'rgba(255,255,255,.13)':i%3===1?'rgba(70,95,50,.07)':'rgba(100,80,55,.06)';
  ctx.beginPath();ctx.ellipse(x,y,r,r*(.42+random()),random()*Math.PI,0,Math.PI*2);ctx.fill();
 }
 for(let i=0;i<550;i++){
  const x=random()*128,y=random()*128,r=.35+random()*1.25;
  ctx.fillStyle=i%3===0?'rgba(56,85,35,.2)':i%3===1?'rgba(255,255,255,.28)':'rgba(98,116,73,.15)';
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
 }
 for(let i=0;i<36;i++){
  const x=random()*128,y=random()*128;
  ctx.strokeStyle='rgba(72,92,47,.18)';ctx.lineWidth=.45+random()*.9;
  ctx.beginPath();ctx.moveTo(x-1.6,y+1.7);ctx.lineTo(x,y-1.3);ctx.lineTo(x+1.1,y+.5);ctx.stroke();
 }
 const texture=new T.CanvasTexture(canvas);
 texture.wrapS=texture.wrapT=T.RepeatWrapping;
 texture.repeat.set(Math.max(.4,rx*.45),Math.max(.4,ry*.45));
 texture.anisotropy=3;
 return texture;
}
// Árvores e vegetação realmente diferentes para cada área, com somente
// cinco materiais e cinco instâncias no GPU Android.
function trees(three,scene,biomes,ob,random){
 init(three);
 const groups={sphere:[],cone:[],cylinder:[],box:[],tetra:[]};
 const add=(shape,x,y,z,w,h,d,c,rz=0,rx=0)=>groups[shape].push({p:[x,y,z],s:[w,h,d],c,r:[rx,0,rz]});
 const choose=(b,base,j,x,z,h)=>{
  const palette=b<0?[0x347e47,0x68b57d,0x745334]:biomePalettes[b],green=palette[0],bright=palette[1],brown=palette[2];
  const t=(height=h)=>add('cylinder',x,height*.5,z,.34,height,.34,b===10?0x9c9da5:b===6?0xed879b:b===2?0x5b9f61:0x866b52);
  switch(b){
   case 1: // aguapés, junco e beira d'água
    t(h*.70);add('sphere',x,h*.86,z,.85,.37,.92,0x62bfa5);
    for(const sx of [-1,1])add('cone',x+sx*.65,h*.74,z,.18,1.1,.18,0x558665);
    break;
   case 2: // cactus com braços, sem pinheiros verdes no deserto
    t(h*1.05);
    add('cylinder',x-.39,h*.48,z,.18,.93,.18,0x4b9366,.45);
    add('cylinder',x+.42,h*.65,z,.17,.85,.17,0x4b9366,-.42);
    add('sphere',x,h*1.02,z,.37,.28,.36,0x6db580);
    break;
   case 3: // floresta tropical com folhas largas
    t(h*1.2);
    for(let k=0;k<3;k++)add('sphere',x+(k-1)*.85,h*1.16+(k%2)*.37,z,.88,.62,1.0,k===1?0x1a854c:0x46af4b);
    break;
   case 4: // árvores de gelo
    t(h*.7);
    for(let k=0;k<3;k++)add('cone',x,h*.63+k*.62,z,1.35-k*.26,2.2-k*.32,1.35-k*.26,k%2?0x99dfff:0xe6f8ff);
    break;
   case 5: // obsidiana, rochas de lava
    add('tetra',x,h*.5,z,1.05,h,1.05,0x37282d,.11*j);
    add('tetra',x+.65,h*.32,z+.35,.36,h*.60,.35,0xef5427);
    break;
   case 6: // coral abissal ramificado
    t(h*.66);
    add('sphere',x,h*.82,z,.69,.43,.6,0xe879a9);
    for(const sx of [-1,1])add('cylinder',x+sx*.52,h*.75,z,.17,h*.63,.17,sx<0?0xf79c95:0x85eaff,sx*.52);
    break;
   case 7: // samambaias e palmeiras pré-históricas
    t(h*1.1);
    for(let k=0;k<4;k++)add('sphere',x+Math.sin(k*1.57)*1.0,h*1.08,z+Math.cos(k*1.57)*.85,1.18,.26,.4,0x669257,(k-2)*.31);
    break;
   case 8: // cristais cósmicos (sem troncos de pinheiro)
    add('tetra',x,h*.62,z,.78,h*1.20,.79,j%2?0x8d70d5:0xc18aff);
    add('sphere',x+.68,h*.9,z,.35,.35,.35,0x83ddec);
    break;
   case 9: // sakura — copas rosas espessas
    t(h*.95);
    for(let k=0;k<3;k++)add('sphere',x+(k-1)*.6,h*.95+(k%2)*.35,z,.82,.65,.82,k%2?0xffd9f0:0xf99acd);
    break;
   case 10: // pilares de pedra talhados
    add('cylinder',x,h*.45,z,.60,h*.88,.60,0x868c9e);
    add('box',x,h*.95,z,1.6,.29,1.45,0xcac8c0);
    add('box',x,.18,z,1.35,.35,1.28,0x6d697a);
    break;
   case 11: // folhas claras, flores angelicais
    t(h*.90);
    add('sphere',x,h*.90,z,1.27,.71,1.21,j%2?0xffe5bf:0xf1d1e5);
    add('cone',x,h*1.26,z,.35,.84,.35,0xfff4aa);
    break;
   case 12: // cogumelos encantados, brilhantes
    add('cylinder',x,h*.37,z,.29,h*.74,.29,0xf2e8dd);
    add('sphere',x,h*.79,z,1.18,.52,1.13,j%2?0xc592f6:0x87e6c8);
    add('sphere',x+.49,h*.93,z-.3,.19,.1,.19,0xf5e8ff);
    break;
   default: // bosque inicial de árvores redondas
    t(h*.96);
    if(j%3===0)add('sphere',x,h*1.07,z,1.25,1.06,1.20,0x489a4a);
    else for(let k=0;k<2;k++)add('cone',x,h*.71+k*.65,z,1.25-k*.3,2.25-k*.4,1.25-k*.3,k?0x4ca959:0x327e46);
    break;
  }
 };
 for(let k=0;k<252;k++){
  const b=Math.min(12,Math.floor(k/18)-1),zc=-65-70*b;
  let x,z,n=0;
  do{
   x=(random()*2-1)*96;
   z=b<0?50-random()*75:zc+(random()-.5)*66;
  }while((Math.abs(x)<10||(b<0?Math.abs(x)<24&&z>-14:Math.hypot(x,z-zc)<28))&&++n<100);
  const h=3.6+random()*2.5;
  choose(b,0,k,x,z,h);
  ob.push({x,z,r:1.1});
 }
 const M=new T.Matrix4(),Q=new T.Quaternion(),E=new T.Euler(),p=new T.Vector3(),ss=new T.Vector3();
 for(const [name,items] of Object.entries(groups)){
  if(!items.length)continue;
  const group=new T.InstancedMesh(shared[name],new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide}),items.length);
  items.forEach((it,j)=>{Q.setFromEuler(E.set(...it.r));M.compose(p.set(...it.p),Q,ss.set(...it.s));group.setMatrixAt(j,M);group.setColorAt(j,new T.Color(it.c));});
  group.instanceMatrix.needsUpdate=true;
  if(group.instanceColor)group.instanceColor.needsUpdate=true;
  group.castShadow=false;group.frustumCulled=false;scene.add(group);
 }
}
// Pontos de referência por bioma. Criados com somente seis instâncias
// para preservar o desempenho no Android mesmo ao olhar ao longo do mapa.
function landmarks(three,scene,biomes){
 init(three);
 const groups={sphere:[],box:[],cone:[],cylinder:[],tetra:[],torus:[]};
 const push=(shape,b,xyz,dim,tint,rot)=>{
  groups[shape].push({p:xyz,s:dim,c:tint??biomePalettes[b][1],r:rot||[0,0,0]});
 };
 biomes.forEach((_,b)=>{
  const x=b%2?31:-31,z=-65-70*b,dark=biomePalettes[b][2],bright=biomePalettes[b][1],main=biomePalettes[b][0];
  const P=(shape,dx,y,dz,sx,sy,sz,color,rz=0,rx=0)=>push(shape,b,[x+dx,y,z+dz],[sx,sy,sz],color,[rx,0,rz]);
  // Mesma base para a leitura espacial; materiais e elementos são diferentes por área.
  P('cylinder',0,.30,0,3.35,.60,3.35,dark);
  switch(b){
   case 0: // Floresta: tronco, copa em camadas, grandes cogumelos dourados
    P('cylinder',0,4,0,.75,7,.72,0x745134);
    for(let i=0;i<3;i++)P('cone',0,5.8+i*1.6,0,3.5-i*.65,3.1,3.5-i*.65,main);
    for(let i=-1;i<=1;i++){P('cylinder',i*1.8,.55,2,.24,.9,.24,0xf5e6c9);P('sphere',i*1.8,1.15,2,1.1,.48,1.1,0xe23d47)}
    break;
   case 1: // Lago: junco, cisne de pedra e gotículas
    P('sphere',0,3,0,1.65,1.0,2.5,main);
    P('cylinder',0,4.15,1.8,.33,2.4,.33,bright,.35);
    P('sphere',0,5.55,2.05,.70,.64,.69,0xebf7ff);
    for(let i=-2;i<=2;i++){P('cylinder',i*1.2,1.6,2.8,.13,2.8,.13,0x4f9365);P('cone',i*1.2,3.3,2.8,.28,.8,.28,0x9d6f45)}
    break;
   case 2: // Deserto: pirâmide de arenito, obeliscos e cactus
    P('cone',0,3.35,0,4.0,6.3,4.0,main);
    for(let i of [-1,1]){P('cylinder',i*3.5,2.3,1.2,.40,4.5,.40,dark);P('cone',i*3.5,4.8,1.2,.65,1.3,.65,bright)}
    P('cylinder',-3,.85,-2,.31,1.65,.31,0x508862);
    P('cylinder',-3.38,1.35,-2,.17,1,.16,0x508862,.45);
    break;
   case 3: // Selva: monólito com folhas gigantes e flores
    P('cylinder',0,3,0,1,5.4,1,dark);
    for(let i=0;i<5;i++){const a=i*1.256;P('sphere',Math.sin(a)*2.4,5+Math.sin(a)*.6,Math.cos(a)*2.4,2.1,.39,.9,main,a)}
    P('sphere',0,5.3,0,1.4,1.05,1.4,bright);
    for(const i of [-1,1])P('cone',i*2.5,2.3,-1.6,1,3,1,0x6fd68a,.5*i);
    break;
   case 4: // Neve: cristais em prismas
    P('tetra',0,5.3,0,2.1,4.8,2.1,0xb5efff);
    for(let i=-2;i<=2;i++)P('tetra',i*1.45,2.3+(i%2?1:0),1.5,0.95,2.7,1.0,i%2?0x80bbf3:0xe4f9ff,.24*i);
    break;
   case 5: // Vulcão: cratera, fluxos de lava e brasas
    P('cone',0,3.9,0,3.9,7.4,3.9,0x4b2a32);
    P('torus',0,7.4,0,2.1,.33,2.1,0xff802b,0,Math.PI/2);
    for(let i=-2;i<=2;i++){P('cone',i*.9,4.25-i*i*.15,3.1,0.34,3.0,0.32,0xff5120);P('sphere',i*.85,7.5+(i%2),-.5,.30,.3,.3,0xffce48)}
    break;
   case 6: // Abissal: coral ramificado e bolhas
    P('cylinder',0,3.1,0,.56,5.7,.56,0xf7798a);
    for(let i=-2;i<=2;i++){P('cylinder',i*.74,3.6+(i%2)*.65,0,.22,2.8,.22,0xffb2ba,i*.28);P('sphere',i*1.45,4+(i%3)*1.2,1.8,.52,.52,.52,0x92edff)}
    break;
   case 7: // Pré-história: ossos fósseis e pegadas gigantes
    for(const j of [-1,1]){P('cylinder',j*1.5,3.3,0,.35,5.7,.35,0xe4d2a0,j*.46);P('sphere',j*3.1,4.9,0,.65,.65,.65,0xf9eacb)}
    P('torus',0,4.9,0,2.35,.32,2.2,0xf7e9c9);
    for(let i=0;i<3;i++)P('sphere',i*1.15-1.1,.7,3.3,.66,.15,.96,dark);
    break;
   case 8: // Cósmico: planeta, anéis e meteoros brilhantes
    P('sphere',0,5.4,0,2.1,2.1,2.1,0x6869db);
    P('torus',0,5.4,0,3.1,.11,3.1,0xeecbff,.43,.7);
    for(let i=0;i<6;i++){const a=i*1.047;P('tetra',Math.sin(a)*3.2,7.2+Math.cos(a)*1.6,Math.cos(a)*3.2,.45,.72,.45,i%2?0xffd6b9:0x7cf9f7)}
    break;
   case 9: // Cerejeiras: árvore de flores com pétalas caídas
    P('cylinder',0,3.6,0,.59,6.7,.59,0x754c62);
    for(let i=0;i<7;i++){const a=i*2.399;P('sphere',Math.sin(a)*1.9,6.5+Math.cos(a)*.9,Math.cos(a)*1.9,1.65,1.0,1.45,i%2?0xffaddc:0xffd9ee)}
    for(let i=0;i<6;i++)P('sphere',(i%3-1)*1.7,.55,-3+Math.floor(i/3)*1.4,.30,.08,.40,0xffb1db);
    break;
   case 10: // Titãs: colunas monumentais com pedra talhada
    for(const i of [-1,1]){P('cylinder',i*2.3,3.4,0,.72,6.2,.72,0x868995);P('box',i*2.3,6.65,0,1.7,.57,1.6,0xe2d5b2);P('box',i*2.3,.5,0,2,.5,1.8,0x636a73)}
    P('box',0,7.0,0,6.6,.65,1.25,0xc5b9a5);
    break;
   case 11: // Anjos e Demônios: portal celestial, halo e chamas
    for(const i of [-1,1]){P('cone',i*2.5,3.1,0,.87,5.2,.87,i<0?0xffffff:0x752d44);P('sphere',i*2.1,5,0,.95,1.45,.4,i<0?0xfff3d5:0xe5485b,.23*i)}
    P('torus',0,6.2,0,2.3,.18,2.3,0xffec9a,.3);
    P('sphere',0,3.3,-1.6,.58,.64,.58,0xf9e9db);
    break;
   case 12: // Encantada: enormes cogumelos e cristal astral
    for(let i=-1;i<=1;i++){P('cylinder',i*2.15,1.8+(i===0?1:0),0,.40,2.7+(i===0?1.7:0),.4,0xf3f5ee);P('sphere',i*2.15,3.5+(i===0?1.8:0),0,1.75+(i===0?.6:0),.68,1.45,i===0?0xd791f4:0x85e4c7)}
    P('tetra',0,7.7,0,.85,1.7,.85,0xb8a2ff);
    for(const i of [-1,1])P('torus',i*2.4,4.3,1.4,1,.12,1,0xfbc8ff,.32);
    break;
  }
 });
 const M=new T.Matrix4(),Q=new T.Quaternion(),E=new T.Euler(),V=new T.Vector3(),S=new T.Vector3();
 for(const [name,part] of Object.entries(groups)){
  if(!part.length)continue;
  const inst=new T.InstancedMesh(shared[name],new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide}),part.length);
  part.forEach((p,i)=>{
   Q.setFromEuler(E.set(p.r[0],p.r[1],p.r[2]));
   M.compose(V.set(...p.p),Q,S.set(...p.s));
   inst.setMatrixAt(i,M);inst.setColorAt(i,new T.Color(p.c));
  });
  inst.instanceMatrix.needsUpdate=true;
  if(inst.instanceColor)inst.instanceColor.needsUpdate=true;
  inst.castShadow=false;inst.receiveShadow=false;
  inst.frustumCulled=false;scene.add(inst);
 }
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
 landmarks(three,scene,biomes);
}
// Personagem principal: rosto, cabelo, jaqueta, mochila e tênis animados
// pelos mesmos membros do rig atual; sem mudar controles, escala ou colisão.
function player(three,g,leftLeg,rightLeg,leftArm,rightArm){
 init(three);
 const add=(par,shape,c,w,h,d,x,y,z)=>{
  const mesh=new T.Mesh(shared[shape],mat(c));
  mesh.scale.set(w,h,d);mesh.position.set(x,y,z);par.add(mesh);return mesh;
 };
 // Expressão facial e cabelo
 for(const x of [-.16,.16]){
  add(g,'sphere',0xffffff,.095,.095,.040,x,2.29,.323);
  add(g,'sphere',0x232332,.052,.068,.037,x,2.29,.359);
  const brow=add(g,'box',0x383039,.18,.045,.040,x,2.43,.314);brow.rotation.z=x<0?.07:-.07;
 }
 add(g,'sphere',0xf2c296,.11,.095,.085,0,2.18,.36);
 const grin=add(g,'box',0xb45b57,.23,.035,.033,0,2.05,.325);grin.rotation.z=-.035;
 for(const x of [-.28,.28]){
  const tuft=add(g,'cone',0x282333,.16,.38,.20,x,2.64,-.01);tuft.rotation.z=x<0?.19:-.19;
 }
 add(g,'sphere',0x25232d,.41,.18,.39,0,2.49,-.14);
 // Camiseta, jaqueta com fecho, bolso e punhos
 add(g,'box',0x344f87,.67,.16,.10,0,1.96,.32);
 add(g,'box',0xffe1a3,.37,.19,.07,0,1.94,.39);
 add(g,'box',0xc8d8ff,.038,.58,.035,0,1.55,.286);
 for(const x of [-.31,.31])add(g,'box',0x183b66,.12,.31,.038,x,1.45,.286);
 for(const x of [-.6,.6])add(g,'sphere',0xeabb89,.15,.18,.16,x,1.05,.04);
 // Mochila discreta e alças
 add(g,'box',0x273d55,.72,.83,.38,0,1.52,-.43);
 add(g,'box',0x6cb0ba,.48,.28,.050,0,1.57,-.64);
 add(g,'box',0xe5cf8b,.12,.10,.065,0,1.49,-.68);
 for(const x of [-.31,.31])add(g,'box',0x141c2b,.09,.79,.13,x,1.51,-.19);
 // Tênis que seguem a rotação das pernas.
 for(const limb of [leftLeg,rightLeg]){
  if(!limb)continue;
  add(limb,'box',0xf6f8ff,.36,.17,.52,0,-.87,.17);
  add(limb,'box',0x232e40,.35,.075,.59,0,-.97,.20);
  add(limb,'box',0x6ea4ef,.19,.05,.10,0,-.76,.44);
 }
 for(const arm of [leftArm,rightArm]){
  if(!arm)continue;
  add(arm,'sphere',0xe5ae7f,.18,.18,.18,0,-.87,0);
  add(arm,'box',0x263d6b,.32,.14,.35,0,-.65,0);
 }
}
// Clima ambiente: neve, pétalas, cinzas e magia com UMA única chamada GPU.
// Ancorado no jogador para acompanhar a câmera, com contagem pequena no Android.
let atmosphere=null;
function weather(three,scene,player,biome,dt){
 init(three);
 const N=(navigator.maxTouchPoints||0)>0?64:116;
 if(!atmosphere){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  const ctx=canvas.getContext('2d');const gradient=ctx.createRadialGradient(16,16,1,16,16,16);
  gradient.addColorStop(0,'rgba(255,255,255,1)');
  gradient.addColorStop(.38,'rgba(255,255,255,.85)');
  gradient.addColorStop(.76,'rgba(255,255,255,.24)');
  gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32);
  const tex=new T.CanvasTexture(canvas);
  const geo=new T.BufferGeometry(),a=new Float32Array(N*3);
  for(let i=0;i<N;i++){a[i*3]=Math.sin(i*21.7)*25;a[i*3+1]=1+(i*7.133)%18;a[i*3+2]=Math.cos(i*11.1)*26}
  geo.setAttribute('position',new T.BufferAttribute(a,3));
  const material=new T.PointsMaterial({color:0xfff3cd,map:tex,size:.66,transparent:true,opacity:.72,depthWrite:false,alphaTest:.025,sizeAttenuation:true});
  const points=new T.Points(geo,material);
  points.frustumCulled=false;points.renderOrder=2;scene.add(points);
  atmosphere={points,a,geo,t:0,current:-1};
 }
 if(biome<0){atmosphere.points.visible=false;return}
 const fx=atmosphere;fx.points.visible=true;
 const variants={
  0:[0xf6efb5,.34,-1],1:[0xc6f9ff,.35,.6],2:[0xffdba1,.34,.1],
  3:[0xa5fb95,.31,-.4],4:[0xecfbff,.8,-1],5:[0xff7935,.79,1],
  6:[0x90dafa,.64,1],7:[0xe2cda1,.27,.12],8:[0xc399ff,.56,.5],
  9:[0xffa4d4,.71,-.55],10:[0xe3d9cd,.26,-.3],
  11:[0xffe5a8,.53,.1],12:[0xc6a5ff,.71,.6]
 };
 const [color,opacity,velocity]=variants[biome]||variants[0];
 if(fx.current!==biome){fx.current=biome;fx.points.material.color.setHex(color);fx.points.material.opacity=opacity;fx.points.material.size=biome===4?.65:biome===9?.85:biome===5?.42:.58}
 fx.points.position.set(player.x,0,player.z);
 fx.t+=dt;
 if(fx.t<.045)return;
 const secs=Math.min(fx.t,.12);fx.t=0;
 for(let i=0;i<N;i++){
  const q=i*3;
  fx.a[q]+=Math.sin(i*.7+player.x*.01)*secs*(biome===4?.6:1.6);
  fx.a[q+1]+=secs*(velocity*(biome===5?4.4:biome===4?2.4:2.2));
  fx.a[q+2]+=Math.cos(i*.51+player.z*.01)*secs*.7;
  if(fx.a[q+1]>19)fx.a[q+1]=.5;
  if(fx.a[q+1]<.5)fx.a[q+1]=19;
  if(fx.a[q]>27)fx.a[q]=-27;else if(fx.a[q]<-27)fx.a[q]=27;
  if(fx.a[q+2]>27)fx.a[q+2]=-27;else if(fx.a[q+2]<-27)fx.a[q+2]=27;
 }
 fx.geo.attributes.position.needsUpdate=true;
}
window.RoubeOvoVisuals={create,animate,egg,decorate,terrain,weather,trees,player,species:SPECIES};
})();
