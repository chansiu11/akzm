// Durability counters for the five pickaxe tiers. Other tools, enchantments and anvil repair are pending.
export const PICKAXE_DURABILITY=Object.freeze({110:59,111:131,112:250,113:32,114:1561});
export const MINING_TOOL_DURABILITY112=Object.freeze({110:59,111:131,112:250,113:32,114:1561,117:59,118:131,119:250,120:32,121:1561,122:59,123:131,124:250,125:32,126:1561});
export function usePickaxe(slot){
 if(!slot||!MINING_TOOL_DURABILITY112[slot.id]||slot.count!==1)return {used:false,broken:false};
 const limit=PICKAXE_DURABILITY[slot.id];
 slot.damage=Math.max(0,Math.floor(slot.damage||0))+1;
 if(slot.damage>=limit){slot.id=0;slot.count=0;delete slot.damage;return {used:true,broken:true};}
 return {used:true,broken:false};
}
