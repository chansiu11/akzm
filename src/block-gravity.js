// Tick-based approximation of Java 1.8.9 gravity blocks. Generated falling-block
// entities and landing-on-breakable-block rules are intentionally not reproduced.
import {BLOCK,definition} from './block-registry.js';
const FALLING=new Set([BLOCK.SAND,BLOCK.GRAVEL]);
export function isFallingBlock(id){return FALLING.has(id)}
export function gravityCanMove(world,x,y,z){
 const id=world.get(x,y,z);
 if(!FALLING.has(id)||y<=1)return false;
 const below=definition(world.get(x,y-1,z));
 return !below?.solid;
}
export function createGravityTicks(world,onMove=()=>{}){
 const pending=new Map();let accumulation=0;
 const key=(x,y,z)=>`${x},${y},${z}`;
 function watch(x,y,z){if(y>=1&&y<=255&&FALLING.has(world.get(x,y,z)))pending.set(key(x,y,z),[x,y,z]);}
 function notifyChange(x,y,z){watch(x,y,z);watch(x,y+1,z);}
 function tick(dt,limit=64){
  accumulation+=Math.max(0,Math.min(1,Number(dt)||0));
  let moved=0;
  while(accumulation>=.15){
   accumulation-=.15;
   const items=[...pending.values()];pending.clear();
   for(let index=0;index<items.length;index++){
    if(moved>=limit){
     const newlyQueued=[...pending.values()];pending.clear();
     for(const rest of items.slice(index))pending.set(key(...rest),rest);
     for(const fresh of newlyQueued)pending.set(key(...fresh),fresh);
     return moved;
    }
    const [x,y,z]=items[index];
    if(!gravityCanMove(world,x,y,z))continue;
    const block=world.getBlock(x,y,z);
    const former=world.getBlock(x,y-1,z);
    if(!world.set(x,y-1,z,block.id,block.state))continue;
    if(!world.set(x,y,z,BLOCK.AIR)){
     world.set(x,y-1,z,former.id,former.state);
     continue;
    }
    moved++;onMove(x,y,z,y-1);
    watch(x,y-1,z);watch(x,y+1,z);

   }
  }
  return moved;
 }
 return {notifyChange,tick,queued:()=>pending.size};
}
