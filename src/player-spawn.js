// Independent, testable player collision / safe spawn / emergency mining logic.
// Keep geometry in world units; the caller decides whether to teleport or mine.
import {BLOCK, MAX_Y} from './terrain.js';
import {blockBoxes, definition, intersectsAABB} from './block-registry.js';

export const PLAYER_RADIUS = .29;
export const PLAYER_HEIGHT = 1.8;

export function playerCollides(world,x,y,z,{radius=PLAYER_RADIUS,height=PLAYER_HEIGHT}={}) {
  if(![x,y,z,radius,height].every(Number.isFinite))return true;
  const eps=.001;
  for(let bx=Math.floor(x-radius);bx<=Math.floor(x+radius);bx++)
   for(let by=Math.floor(y+eps);by<=Math.floor(y+height-eps);by++)
    for(let bz=Math.floor(z-radius);bz<=Math.floor(z+radius);bz++){
      const boxes=blockBoxes(world.getBlock(bx,by,bz));
      if(intersectsAABB(boxes,bx,by,bz,x-radius,y+eps,z-radius,x+radius,y+height-eps,z+radius))return true;
    }
  return false;
}

export function safeStanding(world,x,y,z) {
  if(y<1 || y>MAX_Y+1 || playerCollides(world,x,y,z))return false;
  // A stable spawn cannot be inside water, over a void, or over an unsupported slab.
  if(world.get(Math.floor(x),Math.floor(y+.2),Math.floor(z))===BLOCK.WATER)return false;
  return playerCollides(world,x,y-.07,z);
}

function candidateHeight(world,bx,bz) {
  const surface=world.surfaceHeight(bx,bz), top=world.columnTop(bx,bz);
  // Prefer the original ground, then a solid canopy or user-built floor.
  return [...new Set([surface+1,top+1,top+2])].filter(y=>y>=1&&y<=MAX_Y+1);
}

/** Search nearby columns with complete 0.6 x 1.8 player AABB clearance. */
export function findSafeSpawn(world,{x=3,z=3,radius=18}={}) {
  const cx=Math.floor(Number.isFinite(x)?x:3),cz=Math.floor(Number.isFinite(z)?z:3);
  for(let r=0;r<=radius;r++){
    for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){
      if(r>0&&Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;
      const bx=cx+dx,bz=cz+dz;
      if(world.biome(bx,bz)==='ocean')continue;
      for(const y of candidateHeight(world,bx,bz)){
        const px=bx+.5,pz=bz+.5;
        if(safeStanding(world,px,y,pz))return {x:px,y,z:pz};
      }
    }
  }
  // Emergency high position: ensures body is free even if the local area is blocked.
  const top=world.columnTop(cx,cz);
  return {x:cx+.5,y:Math.max(2,Math.min(MAX_Y+2,top+3)),z:cz+.5};
}

/** Preserve legitimate saved cave positions; relocate only if obstructed. */
export function restoreSafePlayerPosition(world,saved,fallback=findSafeSpawn(world)){
  if(saved&&[saved.x,saved.y,saved.z].every(Number.isFinite)
      && saved.y>=0 && saved.y<=MAX_Y+2
      && !playerCollides(world,saved.x,saved.y,saved.z)){
    return {x:saved.x,y:saved.y,z:saved.z};
  }
  const x=Number.isFinite(saved?.x)?Math.floor(saved.x):Math.floor(fallback.x);
  const z=Number.isFinite(saved?.z)?Math.floor(saved.z):Math.floor(fallback.z);
  return findSafeSpawn(world,{x,z,radius:10});
}

/** Blocks overlapping a player's body may be mined even when their front faces are back-culled. */
export function obstructingBlockTarget(world,player,dir={x:0,y:0,z:-1}){
  const {x,y,z}=player,radius=PLAYER_RADIUS,height=PLAYER_HEIGHT;
  if(![x,y,z].every(Number.isFinite))return null;
  let best=null,bestScore=-Infinity;
  const eyeY=y+1.62;
  for(let bx=Math.floor(x-radius);bx<=Math.floor(x+radius);bx++)
    for(let by=Math.floor(y);by<=Math.floor(y+height);by++)
      for(let bz=Math.floor(z-radius);bz<=Math.floor(z+radius);bz++){
        const block=world.getBlock(bx,by,bz),def=definition(block.id);
        if(!def||def.hardness<0||block.id===BLOCK.WATER||block.id===BLOCK.AIR)continue;
        const boxes=blockBoxes(block);
        if(!intersectsAABB(boxes,bx,by,bz,x-radius,y+.001,z-radius,x+radius,y+height-.001,z+radius))continue;
        const eyeInside=boxes.some(b=>x>bx+b[0]&&x<bx+b[3]&&eyeY>by+b[1]&&eyeY<by+b[4]&&z>bz+b[2]&&z<bz+b[5]);
        const vx=bx+.5-x, vy=by+.5-eyeY, vz=bz+.5-z;
        const score=(eyeInside?1000:0)+(vx*(dir.x||0)+vy*(dir.y||0)+vz*(dir.z||0))-.01*(vx*vx+vy*vy+vz*vz);
        if(score>bestScore){bestScore=score;best={x:bx,y:by,z:bz,id:block.id,normal:{x:0,y:1,z:0},emergency:true};}
      }
  return best;
}
