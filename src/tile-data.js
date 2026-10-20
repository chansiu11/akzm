// Prototype block-entity inventory/processing data; persistent per world.
import {expandInventory,giveItem,takeItem} from './inventory-utils.js';
import {giveDamagedItem} from './damaged-items.js';
import {itemDefinition} from './item-registry.js';
import {BLOCK} from './block-registry.js';
export const tileKey=(x,y,z)=>`${x},${y},${z}`;
export class TileStore {
 constructor(data=[]){this.items=new Map();if(Array.isArray(data))for(const [k,v] of data){if(typeof k==='string'&&v&&['chest','furnace'].includes(v.kind))this.items.set(k,structuredClone(v));}}
 ensure(x,y,z,kind){if(!['chest','furnace'].includes(kind))return null;const k=tileKey(x,y,z);let v=this.items.get(k);if(!v||v.kind!==kind){v=kind==='chest'?{kind,slots:Array.from({length:27},()=>({id:0,count:0}))}:{kind,input:{id:0,count:0},fuel:{id:0,count:0},output:{id:0,count:0},progress:0,burn:0};this.items.set(k,v);}return v;}
 remove(x,y,z){return this.items.delete(tileKey(x,y,z));}
 save(){return [...this.items].map(([key,value])=>[key,structuredClone(value)]);}
}
const OUTPUTS=Object.freeze({[BLOCK.IRON_ORE]:101,[BLOCK.GOLD_ORE]:102,[BLOCK.SAND]:BLOCK.GLASS});
export function processFurnace(furnace,dt){
 if(furnace?.kind!=='furnace'||!Number.isFinite(dt)||dt<=0)return false;
 const product=OUTPUTS[furnace.input.id];
 const canSmelt=()=>!!product&&furnace.input.count>0&&
   (furnace.output.id===0||furnace.output.id===product&&furnace.output.count<64);
 let remaining=dt,completed=false;
 if(!canSmelt())furnace.progress=0;
 while(remaining>1e-9){
  if(furnace.burn<=1e-9){
   furnace.burn=0;
   // Do not ignite fresh fuel unless there is work to do.
   if(!canSmelt()||furnace.fuel.id!==100||furnace.fuel.count<=0)break;
   furnace.fuel.count--;if(furnace.fuel.count===0)furnace.fuel.id=0;
   furnace.burn=80;
  }
  const active=canSmelt();
  const elapsed=Math.min(remaining,furnace.burn,active?Math.max(0,10-furnace.progress):Infinity);
  if(elapsed<=1e-9)break;
  furnace.burn=Math.max(0,furnace.burn-elapsed);
  remaining-=elapsed;
  if(active){
   furnace.progress+=elapsed;
   if(furnace.progress>=10-1e-9){
    furnace.progress=0;furnace.input.count--;
    if(furnace.input.count===0)furnace.input.id=0;
    furnace.output.id=product;furnace.output.count++;
    completed=true;
   }
  }else furnace.progress=0;
 }
 return completed;
}
export function depositOne(container,slot,inventory,index){
 const p=inventory[index],t=container[slot];
 if(!p||p.id===0||p.count<=0||!t)return false;
 const limit=itemDefinition(p.id)?.stackLimit??64;
 if((t.id!==0&&t.id!==p.id)||t.count>=limit)return false;
 if(limit===1&&t.id!==0)return false;
 if(t.id===0){t.id=p.id;t.count=0;if(Number.isInteger(p.damage))t.damage=p.damage;}
 t.count++;p.count--;
 if(!p.count){p.id=0;delete p.damage;}
 return true;
}
export function withdrawOne(container,slot,inventory){
 const p=container[slot];if(!p||!p.id||p.count<=0)return false;
 const left=Number.isInteger(p.damage)?giveDamagedItem(inventory,p.id,1,p.damage):giveItem(inventory,p.id,1);
 if(left)return false;
 p.count--;if(!p.count){p.id=0;delete p.damage;}
 return true;
}

/** Preserve chest/furnace contents as dropped items when a block entity is broken. */
export function tileDrops(tile){
 if(!tile)return [];
 const slots=tile.kind==='chest'?tile.slots:tile.kind==='furnace'?[tile.input,tile.fuel,tile.output]:[];
 return slots.filter(slot=>Number.isInteger(slot?.id)&&slot.id>0&&Number.isInteger(slot?.count)&&slot.count>0).map(slot=>({id:slot.id,count:slot.count,...(Number.isInteger(slot.damage)?{damage:slot.damage}:{})}));
}
