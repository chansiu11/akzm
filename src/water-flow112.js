// Scheduled local water propagation. Natural water and level 0 edits are sources.
// No global ocean scan: edits wake only their six neighbours.
import {BLOCK,definition} from './block-registry.js';
const sides=[[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];
export function createWaterFlow112(world,onChange=()=>{}){
 const pending=new Map();let time=0;
 const enqueue=(x,y,z)=>{if(y>0&&y<256)pending.set(`${x},${y},${z}`,[x,y,z]);};
 function notifyChange(x,y,z){enqueue(x,y,z);for(const [dx,dy,dz] of [...sides,[0,1,0],[0,-1,0]])enqueue(x+dx,y+dy,z+dz);}
 const water=(x,y,z)=>world.get(x,y,z)===BLOCK.WATER;
 const level=(x,y,z)=>world.getBlock(x,y,z).state?.level??0;
 const open=(x,y,z)=>world.get(x,y,z)===BLOCK.AIR||water(x,y,z);
 function set(x,y,z,id,l=0){const before=world.getBlock(x,y,z);if(before.id===id&&(id!==BLOCK.WATER||(before.state?.level??0)===l))return;
  if(world.set(x,y,z,id,id===BLOCK.WATER?{level:l}:{})){notifyChange(x,y,z);onChange(x,y,z);}}
 function update(x,y,z){
  const id=world.get(x,y,z);if(id!==BLOCK.AIR&&id!==BLOCK.WATER)return;
  let desired=-1;
  if(id===BLOCK.WATER&&level(x,y,z)===0)desired=0;
  else if(water(x,y+1,z))desired=8;
  else{
   let sources=0,best=8;
   for(const [dx,,dz] of sides)if(water(x+dx,y,z+dz)){
    const n=level(x+dx,y,z+dz);if(n===0)sources++;
    // Sideways flow starts on supported water, not halfway down a waterfall.
    if(!open(x+dx,y-1,z+dz)||water(x+dx,y-1,z+dz)&&level(x+dx,y-1,z+dz)===0)best=Math.min(best,n>=8?1:n+1);
   }
   if(sources>=2&&(definition(world.get(x,y-1,z))?.solid||water(x,y-1,z)&&level(x,y-1,z)===0))desired=0;
   else if(best<=7)desired=best;
  }
  if(desired<0){if(id===BLOCK.WATER)set(x,y,z,BLOCK.AIR);return;}
  set(x,y,z,BLOCK.WATER,desired);
  if(open(x,y-1,z))enqueue(x,y-1,z);else if(desired===0||desired>=8||desired<7)for(const [dx,,dz] of sides)if(open(x+dx,y,z+dz))enqueue(x+dx,y,z+dz);
 }
 return {notifyChange,tick(dt,budget=192){time+=Math.max(0,Math.min(.25,dt));if(time<.25)return 0;time-=.25;const batch=[...pending.values()].slice(0,budget);for(const p of batch)pending.delete(p.join(','));for(const p of batch)update(...p);return batch.length;},queued:()=>pending.size};
}
