// Approximate block line-of-sight for this voxel prototype. Uses actual block
// collision shapes (including half-slabs), not only a non-air ID test.
import {blockBoxes,occupied} from './block-registry.js';
export function clearLineOfSight(world,from,to,step=.1){
 const dx=to.x-from.x,dy=to.y-from.y,dz=to.z-from.z;
 const distance=Math.hypot(dx,dy,dz);
 if(!Number.isFinite(distance)||distance>24||distance===0)return distance===0;
 const segments=Math.ceil(distance/Math.min(.12,Math.max(.025,step)));
 for(let i=1;i<segments;i++){
  const t=i/segments,x=from.x+dx*t,y=from.y+dy*t,z=from.z+dz*t;
  const bx=Math.floor(x),by=Math.floor(y),bz=Math.floor(z);
  const b=typeof world.getBlock==='function'?world.getBlock(bx,by,bz):world.get(bx,by,bz);
  if(occupied(blockBoxes(b),x-bx,y-by,z-bz))return false;
 }
 return true;
}
