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

/** Spend a bounded amount of each animation frame on a single chunk.
 * Small batches avoid visible freezes while fast devices may finish dozens
 * of columns in one frame. clock is injectable for deterministic tests. */
export function progressChunkWithinBudget(task,{budgetMs=5,maxColumns=28,batchColumns=4,clock=()=>performance.now()}={}){
 const max=Math.max(1,Math.floor(maxColumns)),batch=Math.max(1,Math.floor(batchColumns));
 const start=clock(),startIndex=task.index;let done=false;
 do{
  const remaining=max-(task.index-startIndex);
  done=progressChunk(task,Math.min(batch,remaining));
 }while(!done&&task.index-startIndex<max&&clock()-start<budgetMs);
 return done;
}
