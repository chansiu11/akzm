// Independent, deterministic voxel terrain. NOT Mojang's 1.8.9 generator.
// Generator 1 preserves pre-stage-3 worlds; generator 3 is used for new worlds.
import {BLOCK,BLOCK_NAMES,definition,normalizeState,isValidState} from './block-registry.js';
export {BLOCK,BLOCK_NAMES};
export const SEA_LEVEL=63, MAX_Y=255, SEED=18909, GENERATOR_VERSION=5;
export const SOLID=id=>!!definition(id)?.solid;
const floor=Math.floor, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hash3(x,y,z,seed=SEED){
 let h=(Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,1442695041)^seed)|0;
 h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;
}
function hash(x,z,seed=SEED){return hash3(x,0,z,seed)}
const smooth=t=>t*t*(3-2*t);
export function noise(x,z,scale=1,seed=SEED){
 const a=x/scale,b=z/scale,xi=floor(a),zi=floor(b),tx=smooth(a-xi),tz=smooth(b-zi);
 const p=hash(xi,zi,seed)*(1-tx)+hash(xi+1,zi,seed)*tx;
 const q=hash(xi,zi+1,seed)*(1-tx)+hash(xi+1,zi+1,seed)*tx;
 return p*(1-tz)+q*tz;
}
function noise3(x,y,z,scale,seed){
 const a=x/scale,b=y/scale,c=z/scale,xi=floor(a),yi=floor(b),zi=floor(c);
 const u=smooth(a-xi),v=smooth(b-yi),w=smooth(c-zi);
 let out=0;
 for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++){
  out+=hash3(xi+i,yi+j,zi+k,seed)*(i?u:1-u)*(j?v:1-v)*(k?w:1-w);
 }
 return out;
}
// Distinct deterministic biome regions, without relying on game files or proprietary algorithms.
export const BIOMES=Object.freeze(['ocean','plains','forest','desert','mountains','snowy']);
export function biomeAt(x,z,seed=SEED){
 const continental=noise(x+830,z-480,370,seed+31),temp=noise(x-170,z+510,260,seed+53),wet=noise(x+1300,z+270,230,seed+71),ridge=noise(x-670,z-840,260,seed+107);
 if(continental<.28)return 'ocean';
 if(ridge>.70 && continental>.39)return 'mountains';
 if(temp>.64 && wet<.55)return 'desert';
 if(temp<.31)return 'snowy';
 return wet>.52?'forest':'plains';
}
export function heightAt(x,z,seed=SEED){
 const biome=biomeAt(x,z,seed),broad=noise(x,z,150,seed+11),detail=noise(x+401,z-190,34,seed+13);
 const coast=noise(x+830,z-480,370,seed+31);
 if(biome==='ocean')return clamp(floor(43+(coast-.16)*32+(detail-.5)*5),34,61);
 if(biome==='mountains')return clamp(floor(93+(broad-.5)*49+(detail-.5)*20),74,148);
 if(biome==='desert')return clamp(floor(70+(broad-.5)*15+(detail-.5)*8),62,88);
 if(biome==='snowy')return clamp(floor(82+(broad-.5)*32+(detail-.5)*10),65,118);
 if(biome==='forest')return clamp(floor(72+(broad-.5)*23+(detail-.5)*7),62,100);
 return clamp(floor(69+(broad-.5)*19+(detail-.5)*9),60,92);
}
// Continuous coast and ridge weights avoid vertical walls at biome boundaries.
export function terrainHeight(x,z,seed=SEED,generator=GENERATOR_VERSION){
 if(generator<5)return heightAt(x,z,seed);
 const land=noise(x+830,z-480,370,seed+31),ridge=noise(x-670,z-840,260,seed+107);
 const coast=smooth(clamp((land-.23)/.13,0,1));
 const hills=(noise(x,z,150,seed+11)-.5)*18+(noise(x+401,z-190,34,seed+13)-.5)*5;
 const mountain=smooth(clamp((ridge-.57)/.25,0,1))*48;
 const river=Math.abs(noise(x+221,z-613,190,seed+719)-.5);
 const valley=(1-smooth(clamp(river/.035,0,1)))*coast;
 const base=46+coast*(23+hills+mountain);
 return clamp(Math.floor(base*(1-valley)+Math.min(base,60)*valley),32,150);
}
function legacyHeightAt(x,z){return clamp(floor(7+noise(x,z,27)*10+noise(x+132,z-81,10)*5+noise(x-90,z+14,55)*4-5),3,23)}
function legacySandy(x,z){return legacyHeightAt(x,z)<=9||noise(x+500,z-150,34)<.22}
function legacyTreeOrigin(x,z){return x%7===0&&z%7===0&&hash(x/7,z/7)>.68&&legacyHeightAt(x,z)>9&&!legacySandy(x,z)}
export function legacyNaturalBlock(x,y,z){
 if(y<0||y>35)return BLOCK.AIR;
 if(y===0)return BLOCK.BEDROCK;
 const h=legacyHeightAt(x,z),sandy=legacySandy(x,z);
 let b=BLOCK.AIR;
 if(y<=h)b=y===h?(sandy?BLOCK.SAND:BLOCK.GRASS):y>h-4?(sandy?BLOCK.SAND:BLOCK.DIRT):(hash(x+13*y,z-y*7)>.974?BLOCK.COAL:BLOCK.STONE);
 else if(y<=8)b=BLOCK.WATER;
 for(let tx=floor((x-2)/7)*7;tx<=x+2;tx+=7)for(let tz=floor((z-2)/7)*7;tz<=z+2;tz+=7){
  if(!legacyTreeOrigin(tx,tz))continue;
  const root=legacyHeightAt(tx,tz),dx=x-tx,dz=z-tz;
  if(dx===0&&dz===0&&y>root&&y<=root+4)return BLOCK.LOG;
  if(Math.abs(dx)<=2&&Math.abs(dz)<=2&&y>=root+3&&y<=root+6){
   if(y===root+6&&Math.abs(dx)+Math.abs(dz)>1)continue;
   if(Math.abs(dx)===2&&Math.abs(dz)===2&&hash(tx+dx+y,tz+dz)<.34)continue;
   return BLOCK.LEAVES;
  }
 }
 return b;
}
// 3D caves and seeded ore clusters. The distribution is a creative approximation.
export function caveAt(x,y,z,seed=SEED,top=heightAt(x,z,seed)){
 if(y<6||y>top-5)return false;
 const a=noise3(x+81,y*.94,z-112,25,seed+223);
 if(a<.665)return false;
 const b=noise3(x-308,y+75,z+79,17,seed+239);
 return b>.48;
}
export const allowsEmeraldOre=biome=>biome==='mountains';
function oreAt(x,y,z,seed,biome,version=3){
 const n=hash3(floor(x/2),floor(y/2),floor(z/2),seed+167);
 const spot=hash3(x,y,z,seed+173);
 // Mineable clusters remain separate from air; their y ranges approximate natural depth bands.
 if(y<18 && n>.995 && spot>.18)return BLOCK.DIAMOND;
 if(y<33 && n>.986 && spot>.12)return BLOCK.GOLD;
 if(y<38 && n>.987 && spot>.20)return BLOCK.REDSTONE_ORE;
 if(y<32 && n>.993 && spot>.22)return BLOCK.LAPIS_ORE;
 if(y<36 && n>.997 && spot>.20 && (version<4||allowsEmeraldOre(biome)))return BLOCK.EMERALD_ORE;
 if(y<67 && n>.956 && spot>.16)return BLOCK.IRON_ORE;
 if(y<130 && n>.918 && spot>.12)return BLOCK.COAL;
 return BLOCK.STONE;
}
function treeAt(x,z,seed,generator=4){
 const tx=floor(x/9)*9, tz=floor(z/9)*9;
 // Tree locations are determined per cell, independent of chunk visitation order.
 const ox=tx+1+floor(hash(tx,tz,seed+293)*7);
 const oz=tz+1+floor(hash(tx,tz,seed+307)*7);
 if(x!==ox||z!==oz)return false;
 const biome=biomeAt(x,z,seed),h=terrainHeight(x,z,seed,generator);
 if(h<=SEA_LEVEL+1||!['forest','plains','snowy'].includes(biome))return false;
 return hash(tx,tz,seed+311)>(biome==='forest'?.36:biome==='snowy'?.57:.77);
}
function treeOverlays(column,x,z,seed,generator=4){
 // Search neighboring tree cells so leaves cross 16x16 chunk boundaries deterministically.
 const cx=floor(x/9),cz=floor(z/9);
 for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
  const gx=(cx+dx)*9,gz=(cz+dz)*9;
  const ox=gx+1+floor(hash(gx,gz,seed+293)*7),oz=gz+1+floor(hash(gx,gz,seed+307)*7);
  const offX=x-ox,offZ=z-oz;
  if(Math.abs(offX)>2||Math.abs(offZ)>2||!treeAt(ox,oz,seed,generator))continue;
  const root=terrainHeight(ox,oz,seed,generator);
  const snowy=biomeAt(ox,oz,seed)==='snowy';
  const height=3+floor(hash(ox,oz,seed+333)*3),leaf=snowy?BLOCK.SPRUCE_LEAVES:BLOCK.LEAVES,log=snowy?BLOCK.SPRUCE_LOG:BLOCK.LOG;
  if(offX===0&&offZ===0)for(let y=root+1;y<=root+height;y++)column[y]=log;
  for(let y=root+height-2;y<=root+height+2;y++){
   const reach=y>=root+height+1?1:2;
   if(Math.abs(offX)>reach||Math.abs(offZ)>reach|| (y===root+height+2 && Math.abs(offX)+Math.abs(offZ)>0))continue;
   if(hash3(x,y,z,seed+339)>.985)continue;
   if(column[y]===BLOCK.AIR)column[y]=leaf;
  }
 }
}
// Simple independent ruin, NOT a vanilla temple/village/stronghold.
export function ruinOrigin(cellX,cellZ,seed=SEED){
 const x=cellX*96+16+floor(hash(cellX,cellZ,seed+601)*62);
 const z=cellZ*96+16+floor(hash(cellX,cellZ,seed+613)*62);
 const biome=biomeAt(x,z,seed);
 return hash(cellX,cellZ,seed+631)>.65&&['plains','desert','snowy'].includes(biome)?{x,z,y:heightAt(x,z,seed)+1,block:biome==='desert'?BLOCK.SANDSTONE:BLOCK.COBBLE}:null;
}
function ruinOverlays(column,x,z,seed){
 const cx=floor(x/96),cz=floor(z/96);
 for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
  const site=ruinOrigin(cx+dx,cz+dz,seed);
  if(!site)continue;
  const rx=x-site.x,rz=z-site.z;
  if(Math.abs(rx)>3||Math.abs(rz)>3)continue;
  // A small hollow ruined ring, raised pillars and a broken entrance.
  const edge=Math.max(Math.abs(rx),Math.abs(rz));
  if(edge===3){
   if(rz===3&&rx===0)continue;
   column[site.y]=site.block;
   if((Math.abs(rx)===3&&Math.abs(rz)===3)||hash(x,z,seed+659)>.63)column[site.y+1]=site.block;
   if(Math.abs(rx)===3&&Math.abs(rz)===3)column[site.y+2]=site.block;
  }else if(edge<3 && (rx===0&&rz===0))column[site.y-1]=site.block;
 }
}
function makeColumn(x,z,seed=SEED,generator=GENERATOR_VERSION){
 const blocks=new Uint8Array(MAX_Y+1),h=terrainHeight(x,z,seed,generator),biome=biomeAt(x,z,seed);
 const sandy=biome==='desert'||biome==='ocean'||(generator>=5&&h<=SEA_LEVEL+1);
 for(let y=0;y<=Math.max(h,SEA_LEVEL);y++){
  if(y>h){blocks[y]=BLOCK.WATER;continue;}
  if(y===0){blocks[y]=BLOCK.BEDROCK;continue;}
  if(y<=4 && hash3(x,y,z,seed+421)<(5-y)/5){blocks[y]=BLOCK.BEDROCK;continue;}
  if(y===h){blocks[y]=biome==='snowy'||(biome==='mountains'&&h>112)?BLOCK.SNOW:sandy?BLOCK.SAND:BLOCK.GRASS;continue;}
  if(y>h-(sandy?5:4)){blocks[y]=sandy?(y<h-3?BLOCK.SANDSTONE:BLOCK.SAND):biome==='snowy'?BLOCK.DIRT:BLOCK.DIRT;continue;}
  if(caveAt(x,y,z,seed,h)){blocks[y]=BLOCK.AIR;continue;}
  if(y<SEA_LEVEL-4 && hash3(x,y,z,seed+437)>.997){blocks[y]=biome==='ocean'?BLOCK.CLAY:BLOCK.GRAVEL;continue;}
  blocks[y]=oreAt(x,y,z,seed,biome,generator);
 }
 // Generator 3 keeps already-created independent ruins; generator 4 avoids them
 // because they do not exist in the 1.8.9 vanilla structure set.
 treeOverlays(blocks,x,z,seed,generator);if(generator<4)ruinOverlays(blocks,x,z,seed);
 return blocks;
}
export function naturalBlock(x,y,z,seed=SEED){
 if(!Number.isSafeInteger(y)||y<0||y>MAX_Y)return BLOCK.AIR;
 return makeColumn(x,z,seed)[y];
}
export const key=(x,y,z)=>`${x},${y},${z}`;
function fromSaved(raw){
 if(Number.isInteger(raw)&&definition(raw))return {id:raw,state:normalizeState(raw)};
 if(!raw||typeof raw!=='object'||!Number.isInteger(raw.id)||!definition(raw.id)||!isValidState(raw.id,raw.state??{}))return null;
 return {id:raw.id,state:normalizeState(raw.id,raw.state)};
}
function readKey(s){if(typeof s!=='string'||! /^-?\d+,-?\d+,-?\d+$/.test(s))return null;
 const n=s.split(',').map(Number);return n.every(Number.isSafeInteger)&&n[1]>=1&&n[1]<=MAX_Y?n:null;}
export class World {
 constructor(saved,options={}){
  // Keep v1/v2 and v3 natural terrain unchanged when loading old saves.
  this.generator=[3,4,5].includes(saved?.generator)?saved.generator:saved&&(saved.generator===undefined||saved.generator===null||(Number.isInteger(saved.generator)&&saved.generator<3))?1:GENERATOR_VERSION;
  this.seed=Number.isSafeInteger(saved?.seed)?saved.seed:Number.isSafeInteger(options.seed)?options.seed:SEED;
  this.changes=new Map();this.columns=new Map();this.columnLimit=131072;
  if(Array.isArray(saved?.edits))for(const entry of saved.edits){
   if(!Array.isArray(entry)||entry.length<2)continue;
   const [k,raw]=entry;if(!readKey(k))continue;const value=fromSaved(raw);if(value)this.changes.set(k,value);
  }
  this.columnEdits=new Map();this.topCache=new Map();for(const k of this.changes.keys())this.markColumnEdit(k);
 }
 markColumnEdit(k){const [x,y,z]=k.split(',').map(Number),xz=`${x},${z}`;this.columnEdits.set(xz,Math.max(y,this.columnEdits.get(xz)??0));this.topCache.delete(xz);}
 column(x,z){
  if(this.generator===1)return null;
  const k=`${x},${z}`;
  let blocks=this.columns.get(k);
  if(!blocks){blocks=makeColumn(x,z,this.seed,this.generator);this.columns.set(k,blocks);
   if(this.columns.size>this.columnLimit)this.columns.delete(this.columns.keys().next().value);
  }
  return blocks;
 }
 getNatural(x,y,z){if(y<0||y>MAX_Y)return BLOCK.AIR;return this.generator===1?legacyNaturalBlock(x,y,z):this.column(x,z)[y]||BLOCK.AIR;}
 getBlock(x,y,z){const changed=this.changes.get(key(x,y,z));return changed??{id:this.getNatural(x,y,z),state:{}};}
 get(x,y,z){return this.getBlock(x,y,z).id;}
 getState(x,y,z){return {...this.getBlock(x,y,z).state};}
 surfaceHeight(x,z){return this.generator===1?legacyHeightAt(x,z):terrainHeight(x,z,this.seed,this.generator);}
 biome(x,z){return this.generator===1?'legacy':biomeAt(x,z,this.seed);}
 columnTop(x,z){
  const k=`${x},${z}`;
  if(this.topCache.has(k))return this.topCache.get(k);
  const editedTop=this.columnEdits.get(k)??0;
  // Natural terrain can be lower than the edit; erased roof blocks do not remain solid.
  // Cache the observed result so rain and AI checks cannot repeatedly scan 256 levels.
  let top=-1;
  if(this.generator===1){
   for(let y=Math.max(35,editedTop);y>=0;y--)if(this.get(x,y,z)!==BLOCK.AIR){top=y;break;}
  }else{
   const column=this.column(x,z);
   let naturalTop=-1;for(let y=MAX_Y;y>=0;y--)if(column[y]!==BLOCK.AIR){naturalTop=y;break;}
   for(let y=Math.max(naturalTop,editedTop);y>=0;y--){
    const edit=this.changes.get(key(x,y,z));
    if((edit?edit.id:column[y])!==BLOCK.AIR){top=y;break;}
   }
  }
  if(this.topCache.size>=131072)this.topCache.delete(this.topCache.keys().next().value);
  this.topCache.set(k,top);
  return top;
 }

 set(x,y,z,id,state={}){
  if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||!Number.isSafeInteger(z)||y<1||y>MAX_Y||!definition(id)||!isValidState(id,state))return false;
  const normalized=normalizeState(id,state),k=key(x,y,z);
  if(this.getNatural(x,y,z)===id&&Object.keys(normalized).length===0)this.changes.delete(k);
  else this.changes.set(k,{id,state:normalized});
  this.markColumnEdit(k);return true;
 }
 serialize(){return {version:4,generator:this.generator,seed:this.seed,edits:[...this.changes].map(([k,v])=>[k,Object.keys(v.state).length?{id:v.id,state:{...v.state}}:v.id])};}
}
