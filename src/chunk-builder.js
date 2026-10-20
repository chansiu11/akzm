// Incremental CPU mesh construction so a 256-high chunk does not block a full frame.
// Pure logic, independent of Three.js; commits geometry only when fully computed.
import {definition} from './block-registry.js';
import {visibleBlockQuads} from './block-mesh.js';
export const CHUNK_SIZE=16;
export function beginChunk(world,cx,cz){
 return {world,cx,cz,index:0,dirty:false,layers:{opaque:[],cutout:[],glass:[],water:[]}};
}
export function progressChunk(task,columns=8){
 const size=CHUNK_SIZE,end=Math.min(size*size,task.index+Math.max(1,Math.floor(columns)));
 for(let i=task.index;i<end;i++){
  const x=task.cx*size+Math.floor(i/size),z=task.cz*size+i%size;
  const top=task.world.columnTop(x,z);
  for(let y=0;y<=top;y++){
   const id=task.world.get(x,y,z),layer=definition(id)?.layer;
   if(task.layers[layer])task.layers[layer].push(...visibleBlockQuads(task.world,x,y,z));
  }
 }
 task.index=end;return task.index===size*size;
}
