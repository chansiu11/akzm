// Independent voxel-face light preview. This approximates skylight and placed lamps;
// it is NOT the Java 1.8.9 15-step propagation engine.
import {BLOCK,definition} from './block-registry.js';

export const LIGHT_RADIUS=15;
const clamp=(x,low,high)=>Math.min(high,Math.max(low,x));
const faceBrightness=normal=>normal[1]>0?1:normal[1]<0?.72:normal[0]!==0?.88:.95;

export function activeLampsNear(world,cx,cz,radius=LIGHT_RADIUS){
 const out=[];
 if(!(world.changes instanceof Map))return out;
 const left=cx*16-radius,right=(cx+1)*16+radius;
 const near=cz*16-radius,far=(cz+1)*16+radius;
 for(const [key,block] of world.changes){
  if(block?.id!==BLOCK.LAMP||block.state?.powered!==true)continue;
  const xyz=key.split(',').map(Number);
  if(xyz.length!==3||!xyz.every(Number.isSafeInteger))continue;
  const [x,y,z]=xyz;
  if(x>=left&&x<right&&z>=near&&z<far)out.push({x:x+.5,y:y+.5,z:z+.5});
 }
 return out;
}
function translucent(world,x,y,z){
 const def=definition(world.get(x,y,z));
 return !def||def.layer!=='opaque';
}
export function unblockedLightRay(world,source,target){
 const dx=target.x-source.x,dy=target.y-source.y,dz=target.z-source.z;
 const steps=Math.ceil(Math.hypot(dx,dy,dz)*2);
 if(steps<2)return true;
 for(let i=1;i<steps;i++){
  const t=i/steps;
  const bx=Math.floor(source.x+dx*t),by=Math.floor(source.y+dy*t),bz=Math.floor(source.z+dz*t);
  // Emitting and receiving blocks must not occlude their own light.
  if(bx===Math.floor(source.x)&&by===Math.floor(source.y)&&bz===Math.floor(source.z))continue;
  if(!translucent(world,bx,by,bz))return false;
 }
 return true;
}
export function faceLight(world,face,sources=[]){
 const midpoint=[0,1,2].map(axis=>face.v.reduce((sum,vertex)=>sum+vertex[axis],0)/4);
 const x=face.x+midpoint[0],y=face.y+midpoint[1],z=face.z+midpoint[2];
 const normal=face.d;
 const ax=Math.floor(x+normal[0]*.05),ay=Math.floor(y+normal[1]*.05),az=Math.floor(z+normal[2]*.05);
 const open=ay>world.columnTop(ax,az);
 const skylight=open?1:.23;
 let lamp=0;
 for(const source of sources){
  const dist=Math.abs(source.x-x)+Math.abs(source.y-y)+Math.abs(source.z-z);
  if(dist>=LIGHT_RADIUS)continue;
  const strength=1-dist/LIGHT_RADIUS;
  if(strength<=lamp||!unblockedLightRay(world,source,{x:x+normal[0]*.06,y:y+normal[1]*.06,z:z+normal[2]*.06}))continue;
  lamp=strength;
 }
 const value=clamp(Math.max(skylight,lamp)*faceBrightness(normal),.13,1);
 const warmth=lamp>skylight?Math.min(1,(lamp-skylight)*.35):0;
 return [value, value*(1-warmth*.24),value*(1-warmth*.55)];
}
export function createChunkLight(world,cx,cz){
 const lamps=activeLampsNear(world,cx,cz);
 return face=>faceLight(world,face,lamps);
}
