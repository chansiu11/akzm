// Safe block edits shared by command-driven changes and future systems.
// Does not implement /setblock or /fill syntax. Clears stale block-entity data.
import {tileKey} from './tile-data.js';
import {BLOCK} from './block-registry.js';
import {recomputeNearbyLamps} from './redstone-lite.js';
export function changeBlockWithLifecycle(world,tiles,x,y,z,id,state={}){
 const before=world.getBlock(x,y,z);
 if(!world.set(x,y,z,id,state))return false;
 if(before.id!==id){
  // Vanilla-style replace without drop mode: remove incompatible block entity.
  if(tiles?.items?.has(tileKey(x,y,z)))tiles.remove(x,y,z);
 }
 // Even replacing a lever with the SAME ID can reset its powered metadata.
 if(before.id===BLOCK.LEVER||before.id===BLOCK.LAMP||id===BLOCK.LEVER||id===BLOCK.LAMP)
  recomputeNearbyLamps(world,x,y,z);
 return true;
}
