// Stable item definitions. Block items use their block ID while standalone items start at 100.
import {BLOCK_DEFS,definition} from './block-registry.js';
const entries=BLOCK_DEFS.filter(d=>d.id>0).map(d=>Object.freeze({id:d.id,name:d.name,key:d.key,blockId:d.id,iconTile:d.tile,stackLimit:64}));
export const ITEM_DEFS=Object.freeze([...entries,Object.freeze({id:100,name:'Coal',key:'minecraft:coal',blockId:null,iconTile:9,stackLimit:64}),Object.freeze({id:101,name:'Iron Ingot',key:'minecraft:iron_ingot',blockId:null,iconTile:19,stackLimit:64}),Object.freeze({id:102,name:'Gold Ingot',key:'minecraft:gold_ingot',blockId:null,iconTile:20,stackLimit:64}),
 ...[
 [103,'Stick','stick',6,64,-1],[104,'Diamond','diamond',21,64,-1],[105,'Redstone Dust','redstone',28,64,-1],
 [106,'Emerald','emerald',29,64,-1],[107,'Lapis Lazuli','dye',27,64,-1],[108,'Snowball','snowball',10,16,-1],
 [115,'Apple','apple',34,64,-1],[116,'Bread','bread',35,64,-1],
 [110,'Wooden Pickaxe','wooden_pickaxe',6,1,0],[111,'Stone Pickaxe','stone_pickaxe',8,1,1],
 [112,'Iron Pickaxe','iron_pickaxe',19,1,2],[113,'Golden Pickaxe','golden_pickaxe',20,1,0],
 [114,'Diamond Pickaxe','diamond_pickaxe',21,1,3],
 [117,'Wooden Axe','wooden_axe',6,1,-1],[118,'Stone Axe','stone_axe',8,1,-1],
 [119,'Iron Axe','iron_axe',19,1,-1],[120,'Golden Axe','golden_axe',20,1,-1],
 [121,'Diamond Axe','diamond_axe',21,1,-1],
 [122,'Wooden Shovel','wooden_shovel',6,1,-1],[123,'Stone Shovel','stone_shovel',8,1,-1],
 [124,'Iron Shovel','iron_shovel',19,1,-1],[125,'Golden Shovel','golden_shovel',20,1,-1],
 [126,'Diamond Shovel','diamond_shovel',21,1,-1]
 ].map(([id,name,asset,iconTile,stackLimit,pickaxeLevel])=>Object.freeze({id,name,key:'minecraft:'+asset,blockId:null,iconTile,stackLimit,pickaxeLevel}))]);
export const itemDefinition=id=>ITEM_DEFS.find(d=>d.id===id)??null;
export const placeableItem=id=>itemDefinition(id)?.blockId??null;
export const BLOCK_ITEMS=Object.freeze(ITEM_DEFS.filter(d=>d.blockId!==null));
export function starterInventory(){return [1,2,3,4,5,6,7,9,12].map((id,i)=>({id,count:i===4||i===5?16:32}));}
export function cleanInventory(candidate){
 if(!Array.isArray(candidate)||candidate.length!==9)return starterInventory();
 return candidate.map(slot=>{
  const item=itemDefinition(slot?.id);
  return item?{id:item.id,count:Math.max(0,Math.min(999,Number.isFinite(slot.count)?Math.trunc(slot.count):0))}:{id:1,count:0};
 });
}
