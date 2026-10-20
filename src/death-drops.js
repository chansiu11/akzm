// Pure data extraction: prevent default-survival inventories silently surviving death.
// The caller owns entity spawning and preserves unspawnable records for retry.
export function dropInventoryOnDeath(inventory,overflow=[]){
 const records=[];
 for(const slot of [...inventory,...overflow]){
  if(Number.isInteger(slot?.id)&&slot.id>0&&Number.isInteger(slot?.count)&&slot.count>0){
   records.push({id:slot.id,count:slot.count, ...(Number.isInteger(slot.damage)?{damage:slot.damage}:{})});
  }
 }
 for(const slot of inventory){slot.id=0;slot.count=0;delete slot.damage;}
 overflow.length=0;
 return records;
}
