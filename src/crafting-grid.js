// Spatial crafting for the subset of Java Edition 1.8.9 recipes implemented here.
// Patterns are interpreted by their actual ingredient positions (shaped recipes).
import {BLOCK} from './block-registry.js';
import {giveItem} from './inventory-utils.js';
const recipe=(id,name,pattern,keys,result)=>Object.freeze({id,name,pattern,keys,output:result,requiresTable:pattern.length>2||Math.max(...pattern.map(r=>r.length))>2});
export const GRID_RECIPES=Object.freeze([
 recipe('oak-planks','참나무 판자',['W'],{W:BLOCK.LOG},{id:BLOCK.PLANKS,count:4}),
 recipe('spruce-planks','가문비나무 판자',['W'],{W:BLOCK.SPRUCE_LOG},{id:BLOCK.PLANKS,count:4}),
 recipe('sticks','막대기',['P','P'],{P:BLOCK.PLANKS},{id:103,count:4}),
 recipe('crafting-table','제작대',['PP','PP'],{P:BLOCK.PLANKS},{id:BLOCK.CRAFTING_TABLE,count:1}),
 recipe('slab','나무 반 블록',['PPP'],{P:BLOCK.PLANKS},{id:BLOCK.SLAB,count:6}),
 recipe('stairs','나무 계단',['P  ','PP ','PPP'],{P:BLOCK.PLANKS},{id:BLOCK.STAIRS,count:4}),
 recipe('chest','상자',['PPP','P P','PPP'],{P:BLOCK.PLANKS},{id:BLOCK.CHEST,count:1}),
 recipe('furnace','화로',['CCC','C C','CCC'],{C:BLOCK.COBBLE},{id:BLOCK.FURNACE,count:1}),
 recipe('wooden-pickaxe','나무 곡괭이',['PPP',' S ',' S '],{P:BLOCK.PLANKS,S:103},{id:110,count:1}),
 recipe('stone-pickaxe','돌 곡괭이',['CCC',' S ',' S '],{C:BLOCK.COBBLE,S:103},{id:111,count:1}),
 recipe('iron-pickaxe','철 곡괭이',['III',' S ',' S '],{I:101,S:103},{id:112,count:1}),
 recipe('gold-pickaxe','금 곡괭이',['GGG',' S ',' S '],{G:102,S:103},{id:113,count:1}),
 recipe('diamond-pickaxe','다이아몬드 곡괭이',['DDD',' S ',' S '],{D:104,S:103},{id:114,count:1})
]);
export function emptyCraftGrid(size=2){if(size!==2&&size!==3)throw Error('grid must be 2x2 or 3x3');return Array.from({length:size*size},()=>({id:0,count:0}));}
function matchesAt(grid,size,r,ox,oy,mirrored=false){
 const width=Math.max(...r.pattern.map(row=>row.length)),height=r.pattern.length;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let character=' ';
  if(y>=oy&&y<oy+height&&x>=ox&&x<ox+width){
   const localX=x-ox;
   character=r.pattern[y-oy][mirrored?width-1-localX:localX]??' ';
  }
  const want=character===' '?0:r.keys[character],slot=grid[y*size+x];
  if(slot.id!==want||(want&&slot.count<1))return false;
 }
 return true;
}
export function recipeAt(grid,size=2){if((size!==2&&size!==3)||grid.length!==size*size)return null;
 for(const r of GRID_RECIPES){
  const width=Math.max(...r.pattern.map(row=>row.length)),height=r.pattern.length;
  if(width>size||height>size)continue;
  for(let oy=0;oy<=size-height;oy++)for(let ox=0;ox<=size-width;ox++){
   // The stairs recipe accepts the left and right stair outline in Java 1.8.9.
   for(const mirrored of r.id==='stairs'?[false,true]:[false]){
    if(matchesAt(grid,size,r,ox,oy,mirrored))return {recipe:r,offsetX:ox,offsetY:oy,mirrored};
   }
  }
 }
 return null;
}
export function placeCraftIngredient(grid,index,inventory,slot){const src=inventory[slot],dst=grid[index];if(!src?.id||src.count<=0||!dst||(dst.id&&dst.id!==src.id)||dst.count>=64)return false;
 dst.id=src.id;dst.count++;src.count--;if(src.count===0)src.id=0;return true;}
export function takeCraftIngredient(grid,index,inventory){const src=grid[index];if(!src?.id||src.count<=0)return false;const remaining=giveItem(inventory,src.id,1);if(remaining)return false;src.count--;if(src.count===0)src.id=0;return true;}
export function craftGridOnce(grid,size,inventory){const found=recipeAt(grid,size);if(!found)return null;
 const {recipe:r}=found;
 // Perform atomically: simulate output insertion after consuming one of each occupied ingredient.
 const invCopy=inventory.map(slot=>({...slot}));const gridCopy=grid.map(slot=>({...slot}));
 for(const slot of gridCopy){if(slot.id){slot.count--;if(!slot.count)slot.id=0;}}
 if(giveItem(invCopy,r.output.id,r.output.count,r.output.id>=110?1:64))return null;
 inventory.splice(0,inventory.length,...invCopy);grid.splice(0,grid.length,...gridCopy);
 return r.output;
}
export function clearCraftGrid(grid,inventory){let leftover=0;for(const slot of grid){if(!slot.id)continue;const rem=giveItem(inventory,slot.id,slot.count);leftover+=rem;if(rem){slot.count=rem}else{slot.id=0;slot.count=0}}
 return leftover;
}
