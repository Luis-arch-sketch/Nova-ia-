'use strict';
/* Praça curta e larga em U, como a planta: bases nas bordas, lojas junto
 * à entrada e corredor estreito comprido para os treze biomas. */
(()=>{
 try{
  if(window.RoubeOvoPlaza?.installed)return;
  const T=THREE,L=window.RoubeOvoLayout;
  if(!L||typeof sc==='undefined'||!window.RoubeOvoMapRebuild?.installed)return;
  const architecture=sc.getObjectByName('RoubeOvoMap - original-inspired architecture');
  const cliffs=architecture?.getObjectByName('Terracotta high canyon walls');
  if(!cliffs)throw Error('Paredes do corredor indisponíveis');
  const wallMaterial=cliffs.getObjectByName('Tall terracotta canyon (instanced)').material;
  const root=new T.Group();root.name='Compact U courtyard - original ground reused';cliffs.add(root);
  const wall=new T.Mesh(new T.BufferGeometry(),wallMaterial);
  wall.name='Continuous curved courtyard wall';wall.receiveShadow=true;root.add(wall);
  const cap=new T.Mesh(new T.BufferGeometry(),new T.MeshLambertMaterial({color:0x62b746,side:T.DoubleSide}));
  cap.name='Continuous courtyard wall trim';root.add(cap);
  let obstacles=[],signature='';
  const ray=new T.Raycaster(),direction=new T.Vector3();
  const api={installed:true,version:'20261103-compact-U-layout',shape:'short-wide-U-courtyard-and-long-egg-corridor',
   originalGrassPreserved:true,darkOverlayRemoved:true,frontWallAdded:true,slots:16,
   visibleEmptyPeerBases:false,sharedShops:true,group:root,servicePositions:Object.values(L.shops).map(p=>[p.x,p.z]),bounds:L.hub(1),
   clipCamera(camera,target){
    direction.copy(camera).sub(target);const distance=direction.length();if(distance<.01)return;
    ray.set(target,direction.multiplyScalar(1/distance));ray.far=distance;
    const hit=ray.intersectObject(wall,false)[0];if(hit)camera.copy(target).addScaledVector(direction,Math.max(.4,hit.distance-.9));
   },
   resize(hub){
    const key=hub.halfWidth+':'+hub.endZ;if(signature===key){api.bounds=hub;api.activeBases=hub.count;return}
    signature=key;api.bounds={...hub};const w=hub.halfWidth,end=hub.endZ,r=16;
    const edge=L.outline(hub);
    const positions=[],uv=[],indices=[],topPositions=[],topIndices=[],nextObstacles=[];let distance=0;
    for(let i=0;i<edge.length-1;i++){
     const a=edge[i],b=edge[i+1],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(length<.001)continue;
     const n=positions.length/3,u=distance/32,v=(distance+length)/32;
     positions.push(a.x,-.08,a.z,b.x,-.08,b.z,b.x,24,b.z,a.x,24,a.z);
     uv.push(u,0,v,0,v,1,u,1);indices.push(n,n+1,n+2,n,n+2,n+3);
     const nx=-dz/length*.85,nz=dx/length*.85,t=topPositions.length/3;
     topPositions.push(a.x+nx,24.05,a.z+nz,b.x+nx,24.05,b.z+nz,b.x-nx,24.05,b.z-nz,a.x-nx,24.05,a.z-nz);
     topIndices.push(t,t+1,t+2,t,t+2,t+3);
     for(let j=0,nSteps=Math.ceil(length/2);j<nSteps;j++)nextObstacles.push({x:a.x+dx*j/nSteps,z:a.z+dz*j/nSteps,r:1.15});
     distance+=length;
    }
    function geometry(vertices,indices,uv){
     const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
     if(uv)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
    }
    wall.geometry.dispose();wall.geometry=geometry(positions,indices,uv);
    cap.geometry.dispose();cap.geometry=geometry(topPositions,topIndices);
    const old=new Set(obstacles);for(let i=OB.length-1;i>=0;i--)if(old.has(OB[i]))OB.splice(i,1);
    obstacles=nextObstacles;OB.push(...obstacles);
    // Substitui a geometria do piso existente, sem adicionar uma camada.
    const outline=new T.Shape();edge.forEach((p,i)=>i?outline.lineTo(p.x,-p.z):outline.moveTo(p.x,-p.z));outline.closePath();
    const ground=new T.ShapeGeometry(outline),attr=ground.attributes.position,coords=ground.attributes.uv;
    for(let i=0;i<attr.count;i++)coords.setXY(i,attr.getX(i)/8,attr.getY(i)/8);
    courtyardGround.geometry.dispose();courtyardGround.geometry=ground;courtyardGround.position.set(0,.008,0);
    courtyardGround.material.map.repeat.set(.45,.45);
    const length=end+40;courtyardRoad.geometry.dispose();courtyardRoad.geometry=new T.PlaneGeometry(14,length);
    courtyardRoad.position.set(0,.045,(end-40)/2);courtyardRoad.material.map.repeat.set(.45,length/8*.45);
    wall.updateMatrixWorld(true);
    api.curvedWallSections=edge.length-1;api.wallObstacles=obstacles.length;api.activeBases=hub.count;
    api.courtyardDepth=length;api.corridorWidth=L.corridorHalfWidth*2;
    window.RoubeOvoWorldActions?.resize(hub);
   }};
  window.RoubeOvoPlaza=api;
  api.resize(L.hub(typeof MP!=='undefined'&&MP.connected?MP.players.size+1:1));
 }catch(err){console.error('Planta compacta do mapa:',err);window.RoubeOvoPlaza={installed:false,error:String(err)};}
})();

