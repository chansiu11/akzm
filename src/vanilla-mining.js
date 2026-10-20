// Independent implementation of a small subset of Minecraft Java 1.8.9 mining rules.
// No original game code or assets are distributed.
import {BLOCK,definition} from './block-registry.js';
import {itemDefinition} from './item-registry.js';
export const TOOL_IDS=Object.freeze({WOOD_PICKAXE:110,STONE_PICKAXE:111,IRON_PICKAXE:112,GOLD_PICKAXE:113,DIAMOND_PICKAXE:114});
const MIN_PICK_LEVEL=new Map([
 [BLOCK.STONE,0],[BLOCK.COBBLE,0],[BLOCK.COAL,0],[BLOCK.SANDSTONE,0],
 [BLOCK.IRON_ORE,1],[BLOCK.LAPIS_ORE,1],
 [BLOCK.GOLD_ORE,2],[BLOCK.DIAMOND,2],[BLOCK.REDSTONE_ORE,2],[BLOCK.EMERALD_ORE,2]
]);
export function pickaxeLevel(itemId){return itemDefinition(itemId)?.pickaxeLevel??-1;}
export function canHarvest(blockId,toolId){if(!MIN_PICK_LEVEL.has(blockId))return true;return pickaxeLevel(toolId)>=MIN_PICK_LEVEL.get(blockId);}
export function mineSeconds(blockId,toolId){const def=definition(blockId);if(!def||def.hardness<0)return Infinity;
 const level=pickaxeLevel(toolId);const correct=MIN_PICK_LEVEL.has(blockId)&&level>=0;
 const speed=({110:2,111:4,112:6,113:12,114:8})[toolId]??1;
 // Base estimate using 1.8 style break speed / effective-tool divisor;
 // no Haste, underwater, airborne, potion, or enchantment modifiers yet.
 return correct&&canHarvest(blockId,toolId)?def.hardness*1.5/speed:def.hardness*5;
}
function n(rng,lo,hi){const r=Math.min(.999999,Math.max(0,Number(rng())));return lo+Math.floor(r*(hi-lo+1));}
export function blockDrops(blockId,{toolId=0,silkTouch=false,fortune=0,rng=Math.random}={}){
 if(blockId===BLOCK.AIR||blockId===BLOCK.BEDROCK||blockId===BLOCK.WATER)return [];
 if(!canHarvest(blockId,toolId))return [];
 if(silkTouch&&!([BLOCK.CHEST,BLOCK.FURNACE].includes(blockId)))return [{id:blockId,count:1}];
 switch(blockId){
  case BLOCK.GRASS:return [{id:BLOCK.DIRT,count:1}];
  case BLOCK.STONE:return [{id:BLOCK.COBBLE,count:1}];
  case BLOCK.COAL:return [{id:100,count:1+Math.max(0,Math.floor(fortune))*n(rng,0,1)}];
  case BLOCK.DIAMOND:return [{id:104,count:1+Math.max(0,Math.floor(fortune))*n(rng,0,1)}];
  case BLOCK.REDSTONE_ORE:return [{id:105,count:n(rng,4,5)}];
  case BLOCK.EMERALD_ORE:return [{id:106,count:1}];
  case BLOCK.LAPIS_ORE:return [{id:107,count:n(rng,4,8)}];
  case BLOCK.SNOW:return [{id:108,count:4}]; // Requires shovel in full vanilla; simplified here.
  case BLOCK.LEAVES:return rng()<.005?[{id:115,count:1}]:[]; // Apple only from this oak-like leaf type.
  case BLOCK.SPRUCE_LEAVES:return []; // Sapling and stick probabilities pending.
  case BLOCK.GLASS:return [];
  default:return [{id:blockId,count:1}];
 }
}
