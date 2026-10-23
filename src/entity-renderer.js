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
 const arrowGeo=new THREE.BoxGeometry(.08,.08,.5),arrowMat=new THREE.MeshLambertMaterial({color:'#b9a581'});
 // Model parts and UVs map three existing AI kinds to the user's own 1.12.2
 // cow / zombie / skeleton sheets without bundling their PNG bytes.
 const colors={grazer:'#9e7952',wanderer:'#748e6a',shooter:'#d2cfc1'};
 const mat=Object.fromEntries(Object.entries(colors).map(([kind,color])=>[kind,new THREE.MeshLambertMaterial({color})]));
 const models={
  grazer:[[0,1.05,0,.83,.83,1.2,18,4,12,18,10],[0,1.65,-.6,.65,.65,.65,0,0,8,8,8],
   [-.27,.43,-.44,.23,.86,.23,0,16,4,12,4],[.27,.43,-.44,.23,.86,.23,0,16,4,12,4],
   [-.27,.43,.44,.23,.86,.23,0,16,4,12,4],[.27,.43,.44,.23,.86,.23,0,16,4,12,4]],
  wanderer:[[0,1.13,0,.62,.8,.33,16,16,8,12,4],[0,1.75,0,.62,.62,.62,0,0,8,8,8],
   [-.44,1.11,0,.24,.78,.24,40,16,4,12,4],[.44,1.11,0,.24,.78,.24,40,16,4,12,4],
   [-.17,.39,0,.24,.78,.26,0,16,4,12,4],[.17,.39,0,.24,.78,.26,0,16,4,12,4]],
  shooter:[[0,1.13,0,.46,.78,.24,16,16,8,12,4],[0,1.74,0,.56,.56,.56,0,0,8,8,8],
   [-.35,1.11,0,.14,.78,.14,40,16,4,12,4],[.35,1.11,0,.14,.78,.14,40,16,4,12,4],
   [-.12,.4,0,.16,.8,.16,0,16,4,12,4],[.12,.4,0,.16,.8,.16,0,16,4,12,4]]
 };
 const geometry=new Map(),ownerTexture=new Map();let textureGeneration=0;
 function partGeometry(kind,index,part){
  const key=kind+':'+index;if(geometry.has(key))return geometry.get(key);
  const [, , ,width,height,depth,u,v,w,h,d]=part;
  const geo=new THREE.BoxGeometry(width,height,depth),uv=geo.attributes.uv;
  const rects=[
   [u,v+d,u+d,v+d+h],[u+d+w,v+d,u+2*d+w,v+d+h],
   [u+d,v,u+d+w,v+d],[u+d+w,v,u+2*d+w,v+d],
   [u+d,v+d,u+d+w,v+d+h],[u+2*d+w,v+d,u+2*d+2*w,v+d+h]
  ];
  const sheetHeight=kind==='wanderer'?64:32;
  rects.forEach(([l,t,r,b],side)=>{
   [[l/64,1-t/sheetHeight],[r/64,1-t/sheetHeight],[l/64,1-b/sheetHeight],[r/64,1-b/sheetHeight]]
    .forEach(([x,y],n)=>uv.setXY(side*4+n,x,y));
  });
  uv.needsUpdate=true;geometry.set(key,geo);return geo;
 }
 async function setOwnerTextures(uris={}){
  const generation=++textureGeneration;
  const loaded=await Promise.all(Object.keys(colors).map(async(kind)=>{
   const uri=uris?.[kind];
   if(typeof uri!=='string'||!/^data:image\\/png;base64,[a-z0-9+/=]+$/i.test(uri))return [kind,null];
   const texture=await new THREE.TextureLoader().loadAsync(uri);
   texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
   texture.colorSpace=THREE.SRGBColorSpace;return [kind,texture];
  }));
  if(generation!==textureGeneration){for(const [,t] of loaded)t?.dispose();return;}
  for(const texture of ownerTexture.values())texture.dispose();ownerTexture.clear();
  for(const [kind,texture] of loaded){
   if(texture)ownerTexture.set(kind,texture);
   mat[kind].map=texture;mat[kind].color.set(texture?'#ffffff':colors[kind]);mat[kind].needsUpdate=true;
  }
 }
 function add(kind,x,y,z,saved=null){
  const entity=spawnEntity(kind,saved?.id??nextId++,x,y,z);
  if(saved){nextId=Math.max(nextId,saved.id+1);Object.assign(entity,saved);}
  const group=new THREE.Group(),limbs=[];
  models[kind].forEach((part,index)=>{
   const mesh=new THREE.Mesh(partGeometry(kind,index,part),mat[kind]);mesh.position.set(part[0],part[1],part[2]);group.add(mesh);
   if(index>=2)limbs.push(mesh);
  });
  group.position.set(x,y,z);scene.add(group);entries.push({entity,group,limbs});return entity;
 }
 for(const record of normalizeEntityRecords(savedEntities))add(record.kind,record.x,record.y,record.z,record);
 function update(dt,player){spawnTimer-=dt;
  // Restore dormant animals to the active scene when the player comes back.
  for(let i=dormant.length-1;i>=0;i--){const e=dormant[i];
   if(Math.hypot(e.x-player.x,e.z-player.z)>44)continue;
   dormant.splice(i,1);add(e.kind,e.x,e.y,e.z,e);
  }
  if(spawnTimer<=0&&entries.length<14){spawnTimer=8+Math.random()*6;const theta=Math.random()*Math.PI*2,r=8+Math.random()*11,x=Math.floor(player.x+Math.cos(theta)*r),z=Math.floor(player.z+Math.sin(theta)*r);const y=world.columnTop(x,z)+1;
   if(world.get(x,y,z)===0&&world.get(x,y+1,z)===0&&y>SEA_LEVEL-1)add(Math.random()<.55?'grazer':Math.random()<.75?'wanderer':'shooter',x+.5,y,z+.5);
  }
  for(let i=entries.length-1;i>=0;i--){const {entity:e,group,limbs}=entries[i];if(e.health<=0){scene.remove(group);entries.splice(i,1);continue;}
   if(Math.hypot(e.x-player.x,e.z-player.z)>55){dormant.push(e);scene.remove(group);entries.splice(i,1);continue;}
   e.hurtTimer=Math.max(0,(e.hurtTimer||0)-dt);
   let waypoint=null;
   if((e.kind==='wanderer'||e.kind==='shooter')&&Math.hypot(e.x-player.x,e.z-player.z)<15){
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
   const solidAt=(x,y,z)=>!!definition(world.get(Math.floor(x),Math.floor(y),Math.floor(z)))?.solid;
    const action=stepEntity(e,player,dt,solidAt,Math.random,{waypoint});
    stepMobKnockback112(e,dt,solidAt);
   // Keep simple walking entities at terrain surface. Pathfinding is not implemented.
   const newY=world.columnTop(Math.floor(e.x),Math.floor(e.z))+1;if(Math.abs(newY-e.y)<=1.05)e.y=newY;
   group.position.set(e.x,e.y,e.z);group.rotation.y=Math.atan2(action.vz,action.vx);
    for(let k=0;k<limbs.length;k++)limbs[k].rotation.x=Math.sin(performance.now()*.007+(k%2?Math.PI:0))*(Math.hypot(action.vx,action.vz)>.2?.33:.04);
   if(action.attack && clearLineOfSight(world,{x:e.x,y:e.y+1.25,z:e.z},{x:player.x,y:player.y+1.25,z:player.z})){
    if(e.kind==='shooter'&&arrows.length<64){
     const projectile=shootTowards({x:e.x,y:e.y+1.35,z:e.z},{x:player.x,y:player.y+1.2,z:player.z});
     const mesh=new THREE.Mesh(arrowGeo,arrowMat);scene.add(mesh);arrows.push({projectile,mesh,shooter:e});
    }else if(e.kind!=='shooter'&&Math.hypot(e.x-player.x,e.z-player.z)<2&&Math.abs(e.y-player.y)<1.6){onHit?.(2,e);}
   }
  }
  // Arrow collision is swept in substeps so walls can stop fast projectiles.
  for(let i=arrows.length-1;i>=0;i--){
   const a=arrows[i],p=a.projectile;
   const hit=stepProjectile(p,dt,(x,y,z)=>!!definition(world.get(x,y,z))?.solid,player);
   a.mesh.position.set(p.x,p.y,p.z);a.mesh.lookAt(p.x+p.vx,p.y+p.vy,p.z+p.vz);
   if(hit){if(hit==='player')onHit?.(2,a.shooter);scene.remove(a.mesh);arrows.splice(i,1);}
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
