import {itemDefinition} from './item-registry.js';
// Pure 36-slot inventory primitives. First nine slots are the hotbar.
export const EMPTY=()=>({id:0,count:0});
export function expandInventory(old=[]){const slots=Array.from({length:36},(_,i)=>{const s=old[i];const id=Number(s?.id),count=Number(s?.count);return Number.isInteger(id)&&id>0&&Number.isFinite(count)&&count>0?{id,count:Math.max(0,Math.min(999,Math.floor(count))),...(Number.isInteger(s.damage)&&s.damage>=0&&itemDefinition(id)?.stackLimit===1?{damage:s.damage}:{})}:EMPTY();});return slots;}
export function countItem(slots,id){return slots.reduce((n,s)=>n+(s.id===id?s.count:0),0)}
export function giveItem(slots,id,count=1,limit=64){if(!Number.isInteger(id)||id<=0||!Number.isInteger(count)||count<=0)return count;
 limit=Math.max(1,Math.min(limit,itemDefinition(id)?.stackLimit??64));let remaining=count;
 for(const s of slots){if(s.id!==id||s.count>=limit)continue;const n=Math.min(remaining,limit-s.count);s.count+=n;remaining-=n;if(!remaining)return 0;}
 for(const s of slots){if(s.id!==0&&s.count>0)continue;const n=Math.min(remaining,limit);s.id=id;s.count=n;remaining-=n;if(!remaining)return 0;}
 return remaining;
}
export function takeItem(slots,id,count=1){if(!Number.isInteger(count)||count<=0||countItem(slots,id)<count)return false;let left=count;
 for(const s of slots){if(s.id!==id)continue;const n=Math.min(left,s.count);s.count-=n;left-=n;if(s.count<=0){s.id=0;s.count=0;}if(left===0)return true;}
 return true;
}
export function moveStack(slots,from,to,amount=Infinity){if(from===to||!slots[from]||!slots[to])return false;const a=slots[from],b=slots[to];if(!a.id||!a.count)return false;if(b.id!==0&&b.id!==a.id){[slots[from],slots[to]]=[b,a];return true;}
 const stackLimit=itemDefinition(a.id)?.stackLimit??64;const moved=Math.min(a.count,amount,stackLimit-b.count);if(moved<=0)return false;
 if(b.id===0&&stackLimit===1&&Number.isInteger(a.damage))b.damage=a.damage;
 if(b.id===0&&stackLimit===1&&a.enchantments?.efficiency>0)b.enchantments={efficiency:a.enchantments.efficiency};
 b.id=a.id;b.count+=moved;a.count-=moved;if(a.count===0){a.id=0;delete a.damage;}return true;
}
