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
// Independent Java Edition 1.12.2-style block/tool selection.
export const TOOL_SPEED112=Object.freeze({
 110:2,111:4,112:6,113:12,114:8,
 117:2,118:4,119:6,120:12,121:8,
 122:2,123:4,124:6,125:12,126:8
});
const PICK_EFFECTIVE=new Set([
 BLOCK.STONE,BLOCK.COBBLE,BLOCK.COAL,BLOCK.IRON_ORE,BLOCK.GOLD_ORE,
 BLOCK.DIAMOND,BLOCK.LAPIS_ORE,BLOCK.REDSTONE_ORE,BLOCK.EMERALD_ORE,
 BLOCK.FURNACE,BLOCK.SANDSTONE,BLOCK.BRICK,BLOCK.LAMP
]);
const AXE_EFFECTIVE=new Set([BLOCK.LOG,BLOCK.SPRUCE_LOG,BLOCK.PLANKS,BLOCK.SLAB,BLOCK.STAIRS,BLOCK.CRAFTING_TABLE,BLOCK.CHEST]);
const SHOVEL_EFFECTIVE=new Set([BLOCK.GRASS,BLOCK.DIRT,BLOCK.SAND,BLOCK.GRAVEL,BLOCK.CLAY,BLOCK.SNOW]);
export function effectiveMiningTool112(blockId,itemId){
 if(itemId>=110&&itemId<=114)return PICK_EFFECTIVE.has(blockId);
 if(itemId>=117&&itemId<=121)return AXE_EFFECTIVE.has(blockId);
 if(itemId>=122&&itemId<=126)return SHOVEL_EFFECTIVE.has(blockId);
 return false;
}
export function mineSeconds(blockId,toolOrSlot=0,options={}){
 const def=definition(blockId);
 if(!def||def.hardness<0)return Infinity;
 if(def.hardness===0)return 0;
 const slot=typeof toolOrSlot==='object'&&toolOrSlot!==null?toolOrSlot:{id:toolOrSlot};
 const id=slot.id??0,helpful=effectiveMiningTool112(blockId,id);
 const canCollect=canHarvest(blockId,id);
 let speed=helpful?TOOL_SPEED112[id]:1;
 // Efficiency is applied only when the equipped tool is effective on this block.
 const enchant=slot.enchantments??slot.enchants??{};
 const efficiency=Math.max(0,Math.min(5,Math.floor(Number(enchant.efficiency??enchant.Efficiency??0)||0)));
 if(helpful&&efficiency)speed+=efficiency*efficiency+1;
 const haste=Math.max(0,Math.floor(Number(options.haste??0)||0));
 const fatigue=Math.max(0,Math.floor(Number(options.miningFatigue??0)||0));
 speed*=1+.2*haste;
 if(fatigue)speed*=[1,.3,.09,.0027,.00081][Math.min(fatigue,4)];
 if(options.underwater&&!options.aquaAffinity)speed/=5;
 if(options.onGround===false)speed/=5;
 const damage=speed/def.hardness/(canCollect?30:100);
 if(damage>=1)return 0;
 return Math.ceil(1/damage)/20;
}
export function mineStage112(seconds,requiredSeconds){
 if(!Number.isFinite(requiredSeconds))return -1;
 if(requiredSeconds<=0)return 9;
 return Math.max(0,Math.min(9,Math.floor(seconds/requiredSeconds*10)));
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
