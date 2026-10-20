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
export function createEntityWorld(scene,world,onHit,savedEntities=[]){
 const entries=[],dormant=[],arrows=[];let nextId=1,spawnTimer=7;
 const arrowGeo=new THREE.BoxGeometry(.08,.08,.5),arrowMat=new THREE.MeshLambertMaterial({color:'#b9a581'});
 // Reuse shared meshes' geometries to prevent GPU buffer churn on repeated spawns.
 const bodyGeometry=new THREE.BoxGeometry(.6,1.25,.5),headGeometry=new THREE.BoxGeometry(.53,.53,.53);
 const colors={grazer:'#9e7952',wanderer:'#748e6a',shooter:'#d2cfc1'};
 const mat=Object.fromEntries(Object.entries(colors).map(([kind,color])=>[kind,new THREE.MeshLambertMaterial({color})]));
 function add(kind,x,y,z,saved=null){const entity=spawnEntity(kind,saved?.id??nextId++,x,y,z);
  if(saved){nextId=Math.max(nextId,saved.id+1);Object.assign(entity,saved);}const group=new THREE.Group();const box=new THREE.Mesh(bodyGeometry,mat[kind]);box.position.y=.63;group.add(box);
  const head=new THREE.Mesh(headGeometry,mat[kind]);head.position.y=1.54;group.add(head);
  group.position.set(x,y,z);scene.add(group);entries.push({entity,group});return entity;}
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
  for(let i=entries.length-1;i>=0;i--){const {entity:e,group}=entries[i];if(e.health<=0){scene.remove(group);entries.splice(i,1);continue;}
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
   const action=stepEntity(e,player,dt,(x,y,z)=>world.get(Math.floor(x),Math.floor(y),Math.floor(z))!==0,Math.random,{waypoint});
   // Keep simple walking entities at terrain surface. Pathfinding is not implemented.
   const newY=world.columnTop(Math.floor(e.x),Math.floor(e.z))+1;if(Math.abs(newY-e.y)<=1.05)e.y=newY;
   group.position.set(e.x,e.y,e.z);group.rotation.y=Math.atan2(action.vz,action.vx);
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
  if(hit && registerHit(hit,damage))return hit;return null;
 }
 function attackRay(origin,direction,maxDist=MELEE_REACH){let closest=null,closestAlong=maxDist;
  for(const entry of entries){const e=entry.entity;if(!mayHit(e))continue;
   const along=reachableByRay(e,origin,direction,maxDist);
   if(along!==null&&along<closestAlong&&clearLineOfSight(world,origin,{x:e.x,y:e.y+1.1,z:e.z})){closestAlong=along;closest=e;}}
  if(closest&&registerHit(closest,3))return closest;
  return null;
 }
 return {add,update,hit,attackRay,serialize:()=>normalizeEntityRecords([...entries.map(v=>v.entity),...dormant]),get entities(){return [...entries.map(v=>v.entity),...dormant]},dispose(){for(const v of entries)scene.remove(v.group);bodyGeometry.dispose();headGeometry.dispose();for(const a of arrows)scene.remove(a.mesh);arrowGeo.dispose();arrowMat.dispose();for(const m of Object.values(mat))m.dispose();}};
}
