import {itemDefinition} from './item-registry.js';
export const dropExpired=age=>Number.isFinite(age)&&age>=300;
export function normalizeDropRecords(records,maxCount=128){
 const out=[];
 if(!Array.isArray(records))return out;
 for(const d of records){
  if(out.length>=maxCount)break;
  if(!Number.isInteger(d?.id)||!itemDefinition(d.id)||!Number.isInteger(d.count)||d.count<=0||d.count>4096)continue;
  if(![d.x,d.y,d.z].every(Number.isFinite)||Math.abs(d.x)>3e7||Math.abs(d.z)>3e7||d.y<-8||d.y>256)continue;
  const age=Number.isFinite(d.age)?Math.max(0,d.age):0;
  if(dropExpired(age))continue;
  out.push({id:d.id,x:d.x,y:d.y,z:d.z,count:d.count,age,...(Number.isInteger(d.damage)&&d.damage>=0?{damage:d.damage}:{})});
 }
 return out;
}
