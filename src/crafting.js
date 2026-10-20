// Prototype subset of common block-based recipes, not full Java 1.8.9 recipe registry.
import {countItem,giveItem,takeItem} from './inventory-utils.js';
import {BLOCK} from './block-registry.js';
export const RECIPES=Object.freeze([
 {id:'planks',name:'원목 → 판자 ×4',ingredients:[{id:BLOCK.LOG,count:1}],output:{id:BLOCK.PLANKS,count:4}},
 {id:'spruce-planks',name:'가문비 원목 → 판자 ×4',ingredients:[{id:BLOCK.SPRUCE_LOG,count:1}],output:{id:BLOCK.PLANKS,count:4}},
 {id:'crafting-table',name:'판자 ×4 → 제작대',ingredients:[{id:BLOCK.PLANKS,count:4}],output:{id:BLOCK.CRAFTING_TABLE,count:1}},
 {id:'slab',name:'판자 ×3 → 나무 반 블록 ×6',ingredients:[{id:BLOCK.PLANKS,count:3}],output:{id:BLOCK.SLAB,count:6}}
]);
export function canCraft(slots,recipe){return !!recipe&&recipe.ingredients.every(i=>countItem(slots,i.id)>=i.count)}
export function craft(slots,recipeId){const recipe=RECIPES.find(r=>r.id===recipeId);if(!canCraft(slots,recipe))return false;
 const snapshot=slots.map(s=>({...s}));for(const i of recipe.ingredients){if(!takeItem(slots,i.id,i.count)){slots.splice(0,slots.length,...snapshot);return false}}
 if(giveItem(slots,recipe.output.id,recipe.output.count)){slots.splice(0,slots.length,...snapshot);return false}return true;
}
