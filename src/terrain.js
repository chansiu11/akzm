// Independent deterministic voxel world logic. No proprietary game code/assets.
export const SEA_LEVEL = 8;
export const MAX_Y = 35;
export const SEED = 18909;
export const BLOCK = Object.freeze({AIR:0, GRASS:1, DIRT:2, STONE:3, SAND:4, LOG:5, LEAVES:6, PLANKS:7, WATER:8, COBBLE:9, COAL:10, SNOW:11, BRICK:12, BEDROCK:13});
export const BLOCK_NAMES = ['Air','Grass','Dirt','Stone','Sand','Log','Leaves','Planks','Water','Cobblestone','Coal Ore','Snow','Bricks','Bedrock'];
export const SOLID = id => id > 0 && id !== BLOCK.WATER;
const floor = Math.floor;
function hash(x,z,seed=SEED) {let n = Math.imul(x,374761393) + Math.imul(z,668265263) + seed | 0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
function smooth(t){return t*t*(3-2*t)}
export function noise(x,z,scale=1){const a=x/scale,b=z/scale,xi=floor(a),zi=floor(b),tx=smooth(a-xi),tz=smooth(b-zi);const p=hash(xi,zi)*(1-tx)+hash(xi+1,zi)*tx;const q=hash(xi,zi+1)*(1-tx)+hash(xi+1,zi+1)*tx;return p*(1-tz)+q*tz;}
export function heightAt(x,z){return Math.max(3,Math.min(23,floor(7+noise(x,z,27)*10+noise(x+132,z-81,10)*5+noise(x-90,z+14,55)*4-5)));}
function sandy(x,z){return heightAt(x,z)<=SEA_LEVEL+1 || noise(x+500,z-150,34)<.22}
function treeOrigin(x,z){return x%7===0 && z%7===0 && hash(x/7,z/7)>.68 && heightAt(x,z)>SEA_LEVEL+1 && !sandy(x,z)}
export function naturalBlock(x,y,z){if(y<0||y>MAX_Y)return BLOCK.AIR;if(y===0)return BLOCK.BEDROCK;const h=heightAt(x,z);let b=BLOCK.AIR;if(y<=h){b=y===h?(sandy(x,z)?BLOCK.SAND:BLOCK.GRASS):y>h-4?(sandy(x,z)?BLOCK.SAND:BLOCK.DIRT):(hash(x+13*y,z-y*7)>.974?BLOCK.COAL:BLOCK.STONE)}
  else if(y<=SEA_LEVEL)b=BLOCK.WATER;
  for(let tx=Math.floor((x-2)/7)*7;tx<=x+2;tx+=7)for(let tz=Math.floor((z-2)/7)*7;tz<=z+2;tz+=7){if(!treeOrigin(tx,tz))continue;const root=heightAt(tx,tz), dx=x-tx,dz=z-tz;
    if(dx===0&&dz===0&&y>root&&y<=root+4)return BLOCK.LOG;
    if(Math.abs(dx)<=2&&Math.abs(dz)<=2&&y>=root+3&&y<=root+6){if(y===root+6&&Math.abs(dx)+Math.abs(dz)>1)continue;if(Math.abs(dx)===2&&Math.abs(dz)===2&&hash(tx+dx+y,tz+dz)<.34)continue;return BLOCK.LEAVES;}
  }return b;
}
export const key=(x,y,z)=>`${x},${y},${z}`;
export class World {
 constructor(saved){this.changes=new Map();if(saved?.edits){for(const [k,v] of saved.edits){if(typeof k==='string' && Number.isInteger(v) && v>=0 && v<BLOCK_NAMES.length)this.changes.set(k,v);}}}
 get(x,y,z){const k=key(x,y,z);return this.changes.has(k)?this.changes.get(k):naturalBlock(x,y,z)}
 set(x,y,z,id){if(y<1||y>MAX_Y||!Number.isInteger(id)||id<0||id>=BLOCK_NAMES.length)return false;const k=key(x,y,z);if(naturalBlock(x,y,z)===id)this.changes.delete(k);else this.changes.set(k,id);return true}
 serialize(){return {version:1,seed:SEED,edits:[...this.changes]}}
}
