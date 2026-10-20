// Minimal deterministic lever->lamp behavior. Not a complete 1.8.9 redstone network.
import {BLOCK} from './block-registry.js';
export const SIDES=Object.freeze([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]);
export function lampIsPowered(world,x,y,z){return SIDES.some(([dx,dy,dz])=>{
 const at=world.getBlock(x+dx,y+dy,z+dz);
 return at.id===BLOCK.LEVER&&at.state.powered===true;
});}
export function recomputeNearbyLamps(world,x,y,z){let updated=0;
 for(const [dx,dy,dz] of SIDES){const nx=x+dx,ny=y+dy,nz=z+dz;
  if(world.get(nx,ny,nz)!==BLOCK.LAMP)continue;
  const next=lampIsPowered(world,nx,ny,nz),state=world.getState(nx,ny,nz);
  if(state.powered!==next&&world.set(nx,ny,nz,BLOCK.LAMP,{powered:next}))updated++;
 }
 return updated;
}
