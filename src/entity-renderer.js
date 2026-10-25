import {mobCollides112,stepMobVertical112} from './mob-physics112.js';
import {MOB_MODELS112,modelFaceUV112,facingYaw112,hostileSpawnAllowed112} from './mob-model112.js?v=2';
// Basic original voxel creatures rendered as simple colored geometry.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {ENTITY_KINDS,spawnEntity,stepEntity} from './entity-ai.js';
import {SEA_LEVEL} from './terrain.js';
import {findPath} from './pathfinding.js';
import {clearLineOfSight} from './visibility.js';
import {normalizeEntityRecords} from './entity-save.js';
import {reachableByRay,mayHit,registerHit,MELEE_REACH} from './combat-rules.js';
import {shootTowards,stepProjectile} from './projectile-physics.js';
import {definition} from './block-registry.js';
import {applyMobKnockback112,stepMobKnockback112} from './mob-knockback112.js';
export function createEntityWorld(scene,world,onHit,savedEntities=[]){
 const entries=[],dormant=[],arrows=[];let nextId=1,spawnTimer=7;
 const arrowSpriteGeo=new THREE.PlaneGeometry(.9,.28);
 const arrowUV=arrowSpriteGeo.attributes.uv;for(let i=0;i<arrowUV.count;i++)arrowUV.setXY(i,arrowUV.getX(i)*.5,1-(1-arrowUV.getY(i))*5/32);
 const arrowSpriteMat=new THREE.MeshLambertMaterial({side:THREE.DoubleSide,transparent:true,alphaTest:.4});
 const featherMat=new THREE.MeshLambertMaterial({color:'#dedbd1',side:THREE.DoubleSide});
 const arrowGeo=new THREE.BoxGeometry(.035,.035,.9),arrowMat=new THREE.MeshLambertMaterial({color:'#b9a581'});
 // Model parts and UVs map three existing AI kinds to the user's own 1.12.2
 // cow / zombie / skeleton sheets without bundling their PNG bytes.
 const colors={grazer:'#9e7952',wanderer:'#748e6a',shooter:'#d2cfc1'};
 const bowMaterial=new THREE.MeshLambertMaterial({color:'#967044',side:THREE.DoubleSide,transparent:true,alphaTest:.4});
 const mat=Object.fromEntries(Object.entries(colors).map(([kind,color])=>[kind,new THREE.MeshLambertMaterial({color})]));
 const models=MOB_MODELS112;
 const geometry=new Map(),ownerTexture=new Map();let textureGeneration=0;
 function partGeometry(kind,index,part){
  const key=kind+':'+index;if(geometry.has(key))return geometry.get(key);
  const {w:width,h:height,d:depth}=part;
  const geo=new THREE.BoxGeometry(width,height,depth),uv=geo.attributes.uv;
  const rects=modelFaceUV112(part);
  const sheetHeight=kind==='wanderer'?64:32;
  rects.forEach(([l,t,r,b],side)=>{
   [[l/64,1-t/sheetHeight],[r/64,1-t/sheetHeight],[l/64,1-b/sheetHeight],[r/64,1-b/sheetHeight]]
    .forEach(([x,y],n)=>uv.setXY(side*4+n,x,y));
  });
  uv.needsUpdate=true;geometry.set(key,geo);return geo;
 }
 async function setOwnerTextures(uris={}){
  const generation=++textureGeneration;
  const loaded=await Promise.all([...Object.keys(colors),'bow','arrow'].map(async(kind)=>{
   const uri=uris?.[kind];
   if(typeof uri!=='string'||!/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(uri))return [kind,null];
   const texture=await new THREE.TextureLoader().loadAsync(uri);
   texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
   texture.colorSpace=THREE.SRGBColorSpace;return [kind,texture];
  }));
  if(generation!==textureGeneration){for(const [,t] of loaded)t?.dispose();return;}
  for(const texture of ownerTexture.values())texture.dispose();ownerTexture.clear();
  for(const [kind,texture] of loaded){
   if(texture)ownerTexture.set(kind,texture);
   const material=kind==='bow'?bowMaterial:kind==='arrow'?arrowSpriteMat:mat[kind];
   material.map=texture;material.color.set(texture?'#ffffff':colors[kind]??'#967044');material.needsUpdate=true;
  }
 }
 function add(kind,x,y,z,saved=null){
  const entity=spawnEntity(kind,saved?.id??nextId++,x,y,z);
  if(saved){nextId=Math.max(nextId,saved.id+1);Object.assign(entity,saved);}
  const group=new THREE.Group(),limbs=[];
  models[kind].forEach((part,index)=>{
   const mesh=new THREE.Mesh(partGeometry(kind,index,part),mat[kind]);
   if(part.limb){const pivot=new THREE.Group();pivot.position.set(part.x,part.y+part.h/2,part.z);mesh.position.y=-part.h/2;pivot.add(mesh);group.add(pivot);pivot.userData.arm=!!part.arm;limbs.push(pivot);}
   else{mesh.position.set(part.x,part.y,part.z);mesh.rotation.x=part.rotateX??0;group.add(mesh);}
  });
  if(kind==='shooter'){
   const bow=new THREE.Mesh(new THREE.PlaneGeometry(.75,.75),bowMaterial);bow.position.set(0,-.65,-.08);bow.rotation.y=Math.PI/2;limbs[1].add(bow);
  }
  group.position.set(x,y,z);scene.add(group);entries.push({entity,group,limbs});return entity;
 }
 for(const record of normalizeEntityRecords(savedEntities))add(record.kind,record.x,record.y,record.z,record);
 function update(dt,player,{daylight=true,difficulty=2}={}){spawnTimer-=dt;
  // Restore dormant animals to the active scene when the player comes back.
  for(let i=dormant.length-1;i>=0;i--){const e=dormant[i];
   if(difficulty===0&&ENTITY_KINDS[e.kind].hostile){dormant.splice(i,1);continue;}
   if(Math.hypot(e.x-player.x,e.z-player.z)>44)continue;
   dormant.splice(i,1);add(e.kind,e.x,e.y,e.z,e);
  }
  if(spawnTimer<=0&&entries.length<14){
   spawnTimer=8+Math.random()*6;
   const kind=daylight||difficulty===0?'grazer':Math.random()<.55?'grazer':Math.random()<.75?'wanderer':'shooter';
   const hostile=ENTITY_KINDS[kind].hostile,theta=Math.random()*Math.PI*2,r=hostile?25+Math.random()*18:8+Math.random()*16;
   const x=Math.floor(player.x+Math.cos(theta)*r),z=Math.floor(player.z+Math.sin(theta)*r),y=world.columnTop(x,z)+1;
   const clear=world.get(x,y,z)===0&&world.get(x,y+1,z)===0&&y>SEA_LEVEL-1;
   if(clear&&(!hostile||hostileSpawnAllowed112({daylight,skyVisible:true,light:daylight?15:4,distance:Math.hypot(x+.5-player.x,z+.5-player.z)})))add(kind,x+.5,y,z+.5);
  }
  for(let i=entries.length-1;i>=0;i--){const {entity:e,group,limbs}=entries[i];if(e.health<=0||(difficulty===0&&ENTITY_KINDS[e.kind].hostile)){scene.remove(group);entries.splice(i,1);continue;}
   if(Math.hypot(e.x-player.x,e.z-player.z)>55){dormant.push(e);scene.remove(group);entries.splice(i,1);continue;}
   if(ENTITY_KINDS[e.kind].hostile&&daylight&&world.columnTop(Math.floor(e.x),Math.floor(e.z))<e.y){e.sunBurn=(e.sunBurn??0)+dt;if(e.sunBurn>=1){e.health--;e.sunBurn=0;}}else e.sunBurn=0;
   e.hurtTimer=Math.max(0,(e.hurtTimer||0)-dt);
   let waypoint=null;
   if(!player.invulnerable&&(e.kind==='wanderer'||e.kind==='shooter')&&Math.hypot(e.x-player.x,e.z-player.z)<15){
    // Reuse paths for ~1 second; never compute full A* every animation frame.
    const nav=e.nav??(e.nav={timer:0,path:[]});nav.timer-=dt;
    if(nav.timer<=0){nav.timer=1+Math.random()*.5;
     const originY=Math.round(e.y);const walkable=(x,z)=>{
       const surface=world.columnTop(x,z)+1;
       return Math.abs(surface-originY)<=1&&world.get(x,surface,z)===0&&world.get(x,surface+1,z)===0;
     };
     nav.path=findPath(e,player,walkable,{maxNodes:140,maxDistance:16});
    }
    const next=e.nav.path.find(p=>Math.hypot(p.x+.5-e.x,p.z+.5-e.z)>.65);
    if(next)waypoint={x:next.x+.5,z:next.z+.5};
   }
   const solidAt=(x,y,z)=>mobCollides112(world,e,x,y,z);const previousX=e.x,previousZ=e.z;
    const action=stepEntity(e,player,dt,solidAt,Math.random,{waypoint});
    stepMobKnockback112(e,dt,solidAt);
   // Grounded AABB motion replaces snapping to the highest block in a column.
   stepMobVertical112(world,e,dt,{moving:Math.hypot(action.vx,action.vz)>.1,blocked:e.x===previousX&&e.z===previousZ});
   group.position.set(e.x,e.y,e.z);const dx=e.x-previousX,dz=e.z-previousZ;group.rotation.y=facingYaw112(action.mode==='ranged'||action.mode==='attack'?player.x-e.x:dx,action.mode==='ranged'||action.mode==='attack'?player.z-e.z:dz,group.rotation.y);
    const moving=Math.hypot(dx,dz)>.0001;e.walkPhase=(e.walkPhase??0)+Math.hypot(dx,dz)*4;
    for(let k=0;k<limbs.length;k++){const limb=limbs[k],phase=e.walkPhase+((e.kind==='grazer'?[0,1,1,0][k]:[0,1,1,0][k])?Math.PI:0);limb.rotation.x=limb.userData.arm&&e.kind==='wanderer'?Math.PI/2:limb.userData.arm&&e.kind==='shooter'&&action.mode==='ranged'?Math.PI/2:Math.sin(phase)*(moving?.65:0);}
   if(!player.invulnerable&&action.attack && clearLineOfSight(world,{x:e.x,y:e.y+1.25,z:e.z},{x:player.x,y:player.y+1.25,z:player.z})){
    if(e.kind==='shooter'&&arrows.length<64){
     const projectile=shootTowards({x:e.x,y:e.y+1.35,z:e.z},{x:player.x,y:player.y+1.2,z:player.z});
     const mesh=new THREE.Group();
     const shaft=new THREE.Mesh(arrowGeo,arrowMat);if(!ownerTexture.has('arrow'))mesh.add(shaft);
     if(ownerTexture.has('arrow'))for(let k=0;k<2;k++){const sprite=new THREE.Mesh(arrowSpriteGeo,arrowSpriteMat);sprite.rotation.y=Math.PI/2;sprite.rotateOnWorldAxis(new THREE.Vector3(0,0,1),k*Math.PI/2);mesh.add(sprite);}
     if(!ownerTexture.has('arrow'))for(let k=0;k<2;k++){const fin=new THREE.Mesh(new THREE.PlaneGeometry(.2,.22),featherMat);fin.rotation.x=Math.PI/2;fin.rotation.z=k*Math.PI/2;fin.position.z=-.22;mesh.add(fin);}
     scene.add(mesh);arrows.push({projectile,mesh,shooter:e});
    }else if(e.kind!=='shooter'&&Math.hypot(e.x-player.x,e.z-player.z)<2&&Math.abs(e.y-player.y)<1.6){onHit?.(2,e);}
   }
  }
  // Arrow collision is swept in substeps so walls can stop fast projectiles.
  for(let i=arrows.length-1;i>=0;i--){
   const a=arrows[i],p=a.projectile;
   const hit=stepProjectile(p,dt,(x,y,z)=>!!definition(world.get(x,y,z))?.solid,player);
   a.mesh.position.set(p.x,p.y,p.z);a.mesh.lookAt(p.x+p.vx,p.y+p.vy,p.z+p.vz);
   if(hit){if(hit==='player'&&!player.invulnerable)onHit?.(2,a.shooter);scene.remove(a.mesh);arrows.splice(i,1);}
  }
 }
 function hit(x,y,z,damage=2){let hit=null,d=1.3;for(const entry of entries){const e=entry.entity,q=Math.hypot(e.x-x,e.y+1-y,e.z-z);if(q<d){hit=e;d=q}}
  if(hit && registerHit(hit,damage)){applyMobKnockback112(hit,{x,y,z});return hit;}return null;
 }
 function attackRay(origin,direction,maxDist=MELEE_REACH){let closest=null,closestAlong=maxDist;
  for(const entry of entries){const e=entry.entity;if(!mayHit(e))continue;
   const along=reachableByRay(e,origin,direction,maxDist);
   if(along!==null&&along<closestAlong&&clearLineOfSight(world,origin,{x:e.x,y:e.y+1.1,z:e.z})){closestAlong=along;closest=e;}}
  if(closest&&registerHit(closest,3)){applyMobKnockback112(closest,origin);return closest;}
  return null;
 }
 return {add,update,hit,attackRay,setOwnerTextures,serialize:()=>normalizeEntityRecords([...entries.map(v=>v.entity),...dormant]),get entities(){return [...entries.map(v=>v.entity),...dormant]},dispose(){for(const v of entries)scene.remove(v.group);for(const g of geometry.values())g.dispose();for(const a of arrows)scene.remove(a.mesh);arrowGeo.dispose();arrowMat.dispose();for(const m of Object.values(mat))m.dispose();for(const t of ownerTexture.values())t.dispose();}};
}
