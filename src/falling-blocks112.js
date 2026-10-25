// Continuous falling entities; the world changes only at take-off and landing.
import {BLOCK,definition} from './block-registry.js';
import {isFallingBlock} from './block-gravity.js';
export function createFallingBlocks112(world,onChange=()=>{},saved=[]){
 const pending=new Map(),entities=[];let nextId=1;
 for(const e of saved??[])if(isFallingBlock(e.id)&&[e.x,e.y,e.z,e.vy].every(Number.isFinite))entities.push({...e,uid:nextId++});
 const watch=(x,y,z)=>{if(isFallingBlock(world.get(x,y,z)))pending.set(`${x},${y},${z}`,[x,y,z]);};
 function notifyChange(x,y,z){watch(x,y,z);watch(x,y+1,z);}
 function tick(dt,limit=64){
  let started=0;
  for(const [key,[x,y,z]] of pending){
   if(started>=limit)break;pending.delete(key);
   if(y<=1||!isFallingBlock(world.get(x,y,z))||definition(world.get(x,y-1,z))?.solid)continue;
   const block=world.getBlock(x,y,z);
   if(!world.set(x,y,z,BLOCK.AIR))continue;
   entities.push({uid:nextId++,id:block.id,state:{...block.state},x,y,z,vy:0});started++;onChange(x,y,z,y);watch(x,y+1,z);
  }
  const step=Math.min(.1,Math.max(0,dt));
  for(let i=entities.length-1;i>=0;i--){const e=entities[i];
   e.vy=(e.vy-16*step)*Math.pow(.98,step*20);
   const target=e.y+e.vy*step;
   let landing=null;
   for(let y=Math.floor(e.y);y>=Math.floor(target);y--)if(definition(world.get(e.x,y-1,e.z))?.solid){landing=y;break;}
   if(landing!==null){
    const y=Math.max(1,landing);if(world.set(e.x,y,e.z,e.id,e.state)){entities.splice(i,1);onChange(e.x,Math.floor(e.y),e.z,y);notifyChange(e.x,y,e.z);}
   }else{e.y=target;if(e.y<0)entities.splice(i,1);}
  }
  return started;
 }
 return {notifyChange,tick,entities,serialize:()=>entities.map(({uid,...e})=>({...e})),queued:()=>pending.size};
}
