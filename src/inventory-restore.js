// Migrate older saved inventories without silently deleting overstacked items.
// Excess items are held in an explicit saved backlog until an inventory slot opens.
import {itemDefinition} from './item-registry.js';
import {EMPTY,giveItem} from './inventory-utils.js';
function valid(raw){
 const id=raw?.id,count=raw?.count,def=itemDefinition(id);
 if(!def||!Number.isInteger(count)||count<1||count>1000000)return null;
 const result={id,count};
 if(def.stackLimit===1&&Number.isInteger(raw.damage)&&raw.damage>=0)result.damage=raw.damage;
 return result;
}
export function replenishOverflow(slots,backlog){
 if(!Array.isArray(backlog)||!backlog.length)return 0;
 let placed=0;
 for(let i=0;i<backlog.length;){
  const item=valid(backlog[i]);
  if(!item){backlog.splice(i,1);continue;}
  let remaining=item.count;
  if(itemDefinition(item.id).stackLimit===1){
   for(let n=0;n<slots.length&&remaining>0;n++)if(!slots[n]?.id){slots[n]={id:item.id,count:1,...(item.damage!==undefined?{damage:item.damage}:{})};remaining--;}
  }else remaining=giveItem(slots,item.id,remaining);
  placed+=item.count-remaining;
  if(remaining<=0)backlog.splice(i,1);
  else{backlog[i]={...item,count:remaining};i++;}
 }
 return placed;
}
export function restoreInventory(saved=[],savedOverflow=[]){
 const slots=Array.from({length:36},EMPTY),overflow=[];
 if(Array.isArray(saved))saved.forEach((raw,i)=>{
  const item=valid(raw);if(!item)return;
  if(i>=36){overflow.push(item);return;}
  const limit=itemDefinition(item.id).stackLimit??64;
  slots[i]={...item,count:Math.min(limit,item.count)};
  if(item.count>limit)overflow.push({...item,count:item.count-limit});
 });
 if(Array.isArray(savedOverflow))for(const raw of savedOverflow){const item=valid(raw);if(item)overflow.push(item);}
 replenishOverflow(slots,overflow);
 return {slots,overflow};
}
