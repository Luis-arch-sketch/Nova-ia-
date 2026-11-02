/* Mais vida para Roube um Ovo: cenário procedural decorativo.
 * Sem mudanças em save, salas, colisão, ovos, bases ou mecânicas.
 * Malhas instanciadas para preservar desempenho no Android.
 */
(function(){
'use strict';
try {
 if(typeof T==='undefined'||typeof sc==='undefined'||typeof BI==='undefined'||typeof BASE_GROUP==='undefined')return;
 if(window.RoubeOvoWorldDetail?.installed)return;
 const shapes={
   round:new T.SphereGeometry(1,12,9),
   column:new T.CylinderGeometry(1,1,1,12),
   cone:new T.ConeGeometry(1,1,11),
   stone:new T.DodecahedronGeometry(1,0),
   ring:new T.TorusGeometry(1,.095,5,20),
   plank:new T.BoxGeometry(1,1,1)
 };
 const parts={world:{},base:{}};
 const colors=[
   [0x65a75f,0xabd77b,0x8d6b4b,0xf8df94],
   [0x4f9f91,0x81d9c9,0x947f68,0xc8f7f3],
   [0xc99a5a,0xefc77a,0xae7552,0xffe0a4],
   [0x22794f,0x7bd66f,0x846849,0xe8f7aa],
   [0x8ac5ed,0xe5f8ff,0x8c9cb2,0xfaffff],
   [0x684955,0xed7040,0x49373b,0xffc46b],
   [0x4e7895,0x7fd4e1,0xb26c9b,0xc9f3ff],
   [0x7e9d65,0xc3be83,0x8e755d,0xffedba],
   [0x555ba1,0x9b90f2,0x363971,0x8bf4ff],
   [0xa780ad,0xf6b8d6,0x85647b,0xffe5eb],
   [0x8e8b9d,0xd3cdb9,0x6a6678,0xfbf4df],
   [0xb8abca,0xf7e5b6,0x6e5d83,0xfff5da],
   [0x6a9f91,0xc1a6ef,0x756592,0xf2dfff]
 ];
 const rand=n=>{let x=Math.sin(n*127.13+65.43)*43758.5453;return x-Math.floor(x)};
 const add=(target,shape,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0)=>{
   const bag=parts[target], list=bag[shape]||(bag[shape]=[]);
   list.push({x,y,z,sx,sy,sz,color,rx,ry,rz});
 };
 const a=(shape,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0)=>
   add('world',shape,x,y,z,sx,sy,sz,color,rx,ry,rz);
 const ba=(shape,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0)=>
   add('base',shape,x,y,z,sx,sy,sz,color,rx,ry,rz);
 const ROUND=Math.PI/2;
 function flower(x,z,c,k){
   const r=.17+(k%5)*.035,h=.52+(k%4)*.10;
   a('column',x,h*.5,z,.052,h,.052,0x477b48);
   for(let j=0;j<5;j++){
     const t=j*Math.PI*2/5;
     a('round',x+Math.cos(t)*r,h,z+Math.sin(t)*r,.17,.095,.16,c);
   }
   a('round',x,h+.015,z,.12,.13,.12,0xffe39c);
 }
 function streetLamp(x,z,c,style){
   const h=3.8+(style%3)*.35;
   a('column',x,h*.50,z,.11,h,.11,0x54566a);
   a('column',x,.16,z,.39,.28,.39,0x655c66);
   a('round',x,h+.16,z,.39,.52,.39,c);
   a('cone',x,h+.76,z,.68,.45,.68,0x544c57);
   a('ring',x,h+.17,z,.45,.45,.45,0xffe6ad,ROUND);
 }
 function boulder(x,z,b,n){
   const p=colors[b],height=.48+(n%5)*.19,r=.75+(n%7)*.15;
   a('stone',x,height*.47,z,r,height,r*.84,p[2],.10*(n%3),.33*n);
   if(n%4===0)a('round',x+.8,.21,z+.5,.65,.20,.55,p[0]);
 }
 function cabin(x,z,b,k){
   const p=colors[b],r=3.2+(k%3)*.42;
   const taller=b===3||b===10||b===11;
   const h=taller?5.8:4.1;
   const body=(b===4?0xe5f6ff:b===5?0x55424b:b===8?0x7275bb:b===9?0xf5e1e1:b===2?0xe4bd80:b===6?0x92b6bd:0xd6b991);
   const roof=(b===2?0xb77e49:b===4?0x81bded:b===5?0x793b3d:b===8?0x433c8a:b===9?0xe17ea8:b===11?0xffedaa:p[0]);
   a('column',x,h/2,z,r,h,r,body);
   a('round',x,h+.18,z,r*1.05,.50,r*1.05,p[2]);
   if(b===4){ // Iglu de gelo, arredondado e com aro polar.
     a('round',x,h+.6,z,r*1.33,2.2,r*1.33,0xf0fbff);
     a('ring',x,h+1.05,z,r*.9,r*.9,r*.9,0x8fd6ff,ROUND);
   }else if(b===2||b===6||b===8){
     a('round',x,h+1.45,z,r*1.12,1.45,r*1.12,roof);
     a('ring',x,h+.43,z,r*1.10,r*1.10,r*1.10,p[3],ROUND);
   }else{
     a('cone',x,h+1.8,z,r*1.3,3.4,r*1.3,roof);
     a('round',x,h+3.56,z,.43,.35,.43,p[3]);
   }
   // Porta oval, varanda e janelas laterais.
   a('round',x,h*.37,z+r*.94,1.0,h*.36,.16,0x594a51);
   a('ring',x,h*.42,z+r*1.01,.95,h*.34,.95,p[3]);
   for(const side of [-1,1]){
     a('round',x+side*r*.76,h*.60,z+r*.63,.56,.65,.14,0xb6e5e6);
     a('round',x+side*(r+1.2),.21,z+2.0,1.2,.19,1.0,p[1]);
     if(k%2===0)a('stone',x+side*(r+1.5),.32,z-2.5,.58,.38,.61,p[2]);
   }
   if(b===5||b===8||b===11){
     a('round',x,h+4.65,z,.40,.46,.40,b===5?0xff7347:b===8?0x6efcff:0xfff7c2);
   }
 }
 // 13 biomas já publicados. A área radioativa futura permanece fora deste cenário.
 for(let b=0;b<BI.length&&b<13;b++){
   const p=colors[b],zc=-65-70*b;
   // Praças redondas e construções dos dois lados: o corredor dos ovos permanece aberto.
   for(const side of [-1,1]){
     const x=side*(61+(b%3)*5),z=zc+(side>0?13:-13);
     a('column',x,.065,z,9.8,.12,9.8,p[2]);
     a('ring',x,.15,z,9.85,9.85,9.85,p[3],ROUND);
     cabin(x,z,b,side>0?b:b+1);
     for(let j=0;j<5;j++){
       const t=j*(Math.PI*2/5)+b*.2;
       const px=x+Math.cos(t)*12,pz=z+Math.sin(t)*10;
       boulder(px,pz,b,j+b*3);
       if(j%2===0)flower(px+1.4,pz+1.2,p[1],j+b);
     }
     // Jardins, bancos arredondados, pedras naturais ao lado dos refúgios.
     for(let j=0;j<8;j++){
       const xx=side*(36+rand(b*100+j*11+side)*55);
       const zz=zc-29+rand(b*77+j*31+side*2)*58;
       if(Math.hypot(xx-x,zz-z)<8)continue;
       if(j%3===0)boulder(xx,zz,b,j+12);
       else if(j%3===1)flower(xx,zz,p[1],j);
       else{
         a('round',xx,.18,zz,1.0,.24,.8,p[0]);
         a('round',xx+.45,.28,zz+.7,.45,.38,.42,p[1]);
       }
     }
   }
   // Passeio principal: detalhes que acompanham a via, sem fechar a passagem.
   for(let j=0;j<8;j++){
     const z=zc-27+j*7.7,x=(j%2?1:-1)*(9.1+(j%3)*1.1);
     a('stone',x,.075,z,1.1,.10,.62,j%2?p[1]:0xe6dab8,.0,j*.36);
     if(j%2===0)streetLamp((j%4===0?-1:1)*17,z+1.2,p[3],j);
   }
   // O centro das áreas continua com guardiões e ninhos originais.
   for(let j=0;j<16;j++){
     const side=j%2?-1:1,x=side*(33+rand(19*b+j*7)*59);
     const z=zc-30+rand(61*b+j*17)*60;
     if(j%4===0)boulder(x,z,b,j);
     else if(j%4===1)flower(x,z,p[3],j);
     else if(j%4===2){
       a('column',x,.30,z,.72,.54,.72,p[2]);
       a('round',x,.72,z,.95,.36,.95,p[0]);
       a('round',x,1.03,z,.32,.20,.32,p[1]);
     } else{
       a('round',x,.11,z,.80,.15,1.15,p[1],0,j*.3);
     }
   }
   // Portais do bioma com curvas em lugar de paredes ou cubos.
   const gateX=b%2===0?-34:34,gateZ=zc-5;
   a('ring',gateX,5.5,gateZ,4.2,4.2,4.2,p[3],0,0,.07);
   for(const side of [-1,1]){
     a('column',gateX+side*4.0,2.8,gateZ,.48,5.6,.48,p[2]);
     a('round',gateX+side*4.0,5.55,gateZ,.70,.65,.70,p[1]);
   }
 }
 // Decoração de fundo da zona das bases; respeita as 16 posições do multiplayer.
 for(let j=0;j<26;j++){
   const side=j%2?-1:1,x=side*(86+(j%3)*4);
   const z=-12+j*13.2;
   if(j%3===0)streetLamp(x,z,0xffe4a3,j);
   else if(j%3===1) {
     a('round',x,.45,z,2.1,.55,1.75,0x5b9c64);
     a('round',x+1.3,.52,z+1.6,1.3,.76,1.3,0x7ac477);
   }else boulder(x,z,0,j);
 }
 // Interior das bases: postes redondos, jardins e detalhes seguindo cada base.
 for(const side of [-1,1]){
   for(const z of [-8,10,27]){
     const x=side*19.2;
     ba('column',x,1.6,z,.35,3.2,.35,0x96725b);
     ba('round',x,3.35,z,.53,.53,.53,0xffdf83);
     ba('cone',x,3.88,z,.69,.56,.69,0x7b594f);
   }
   for(let i=0;i<5;i++){
     const z=13.5+i*2.5,x=side*(16.1+(i%2)*.6);
     ba('round',x,.23,z,1.12,.29,.87,0x378c5a);
     for(let k=0;k<3;k++){
       const px=x+(k-1)*.42;
       ba('round',px,.62,z+(k%2)*.27,.24,.19,.25,(i+k)%2?0xff91bf:0xffd36b);
     }
   }
   // Entrada com pilastras curvas, preservando a passagem central.
   ba('column',side*6.3,2.1,-10.1,.53,4.2,.53,0xd3ae6f);
   ba('round',side*6.3,4.44,-10.1,.74,.69,.74,0xffd676);
 }
 // Um caminho irregular suave até o depósito, sem bloquear treino/incubadoras.
 for(let j=0;j<6;j++){
   const z=-9.4+j*1.05;
   ba('stone',Math.sin(j*.8)*.24,.085,z,1.7,.095,.44,0xe9cf9b,0,j*.14);
 }
 const install=(items,parent)=>{
   const m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),v=new T.Vector3(),s=new T.Vector3();
   let total=0;
   Object.entries(items).forEach(([shape,list])=>{
     if(!list.length)return;
     const material=new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide});
     const mesh=new T.InstancedMesh(shapes[shape],material,list.length);
     for(let i=0;i<list.length;i++){
       const it=list[i];q.setFromEuler(e.set(it.rx,it.ry,it.rz));
       m.compose(v.set(it.x,it.y,it.z),q,s.set(it.sx,it.sy,it.sz));
       mesh.setMatrixAt(i,m);
       mesh.setColorAt(i,new T.Color(it.color));
     }
     mesh.instanceMatrix.needsUpdate=true;
     if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
     mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
     parent.add(mesh);total+=list.length;
   });
   return total;
 };
 const fallbackWorld=new T.Group();fallbackWorld.name='Cenario procedural de reserva';sc.add(fallbackWorld);
 const fallbackBase=new T.Group();fallbackBase.name='Previous decorative base props';BASE_GROUP.add(fallbackBase);
 const worldCount=install(parts.world,fallbackWorld),baseCount=install(parts.base,fallbackBase);
 window.RoubeOvoWorldDetail={installed:true,worldCount,baseCount,biomes:Math.min(13,BI.length),fallbackWorld,fallbackBase};
} catch(error) {
 console.warn('Cenário extra decorativo ignorado:',error);
}
})();
