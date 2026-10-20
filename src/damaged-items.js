import {itemDefinition} from './item-registry.js';
export function giveDamagedItem(inventory,id,count,damage){
 const def=itemDefinition(id);
 if(!def||def.stackLimit!==1||!Number.isInteger(damage)||damage<0)return count;
 let left=count;
 for(const slot of inventory){if(left===0)break;if(slot.id>0&&slot.count>0)continue;
  slot.id=id;slot.count=1;slot.damage=damage;left--;
 }
 return left;
}
