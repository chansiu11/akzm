import {definition,renderBoxes} from './block-registry.js';
const axes=['x','y','z'];
function boxHit(origin,dir,cell,bounds,reach){
 let near=-Infinity,far=Infinity,normal={x:0,y:0,z:0};
 for(let i=0;i<3;i++){
  const axis=axes[i],d=dir[axis],lo=cell[axis]+bounds[i],hi=cell[axis]+bounds[i+3];
  if(Math.abs(d)<1e-10){if(origin[axis]<lo||origin[axis]>hi)return null;continue;}
  let a=(lo-origin[axis])/d,b=(hi-origin[axis])/d,sign=-1;
  if(a>b){[a,b]=[b,a];sign=1;}
  if(a>near){near=a;normal={x:0,y:0,z:0};normal[axis]=sign;}
  far=Math.min(far,b);
  if(near>far)return null;
 }
 return far>=0&&near<=reach?{distance:Math.max(0,near),normal}:null;
}
/** Independent 5-block selection, even before a chunk mesh has finished loading. */
export function raycastVoxel112(world,origin,direction,maxDist=5){
 const length=Math.hypot(direction.x,direction.y,direction.z);
 if(!length||!Number.isFinite(length)||!Number.isFinite(maxDist)||maxDist<=0)return null;
 const dir={x:direction.x/length,y:direction.y/length,z:direction.z/length};
 const cell={x:Math.floor(origin.x),y:Math.floor(origin.y),z:Math.floor(origin.z)};
 const step={},next={},delta={};
 for(const axis of axes){
  step[axis]=Math.sign(dir[axis]);next[axis]=!step[axis]?Infinity:((step[axis]>0?cell[axis]+1:cell[axis])-origin[axis])/dir[axis];
  delta[axis]=!step[axis]?Infinity:Math.abs(1/dir[axis]);
 }
 for(let i=0;i<96;i++){
  const block=world.getBlock(cell.x,cell.y,cell.z),def=definition(block.id);
  if(def&&def.layer!=='water'&&def.model!=='empty'){
   let best=null;
   for(const b of renderBoxes(block)){
    const hit=boxHit(origin,dir,cell,b,maxDist);
    if(hit&&(!best||hit.distance<best.distance))best=hit;
   }
   if(best)return {...cell,id:block.id,normal:best.normal,hitY:origin.y+dir.y*best.distance,distance:best.distance};
  }
  let axis='x';if(next.y<next[axis])axis='y';if(next.z<next[axis])axis='z';
  if(next[axis]>maxDist||!Number.isFinite(next[axis]))return null;
  cell[axis]+=step[axis];next[axis]+=delta[axis];
 }
 return null;
}
