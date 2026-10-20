import {ENTITY_KINDS} from './entity-ai.js';
// Persist only plain state, never rendering meshes, references or navigation caches.
export function normalizeEntityRecords(records,maxCount=64){
 const used=new Set(),out=[];
 if(!Array.isArray(records))return out;
 for(const value of records){
  const spec=ENTITY_KINDS[value?.kind];
  if(!spec||out.length>=maxCount)continue;
  if(!Number.isInteger(value.id)||value.id<=0||used.has(value.id))continue;
  if(![value.x,value.y,value.z,value.health].every(Number.isFinite))continue;
  if(Math.abs(value.x)>3e7||Math.abs(value.z)>3e7||value.y<0||value.y>256||value.health<=0)continue;
  used.add(value.id);
  out.push({id:value.id,kind:value.kind,x:value.x,y:value.y,z:value.z,
   health:Math.min(spec.health,value.health),heading:Number.isFinite(value.heading)?value.heading:0,
   think:Number.isFinite(value.think)?Math.max(0,value.think):0,
   attackTimer:Number.isFinite(value.attackTimer)?Math.max(0,value.attackTimer):0,
   hurtTimer:Number.isFinite(value.hurtTimer)?Math.min(.5,Math.max(0,value.hurtTimer)):0});
 }
 return out;
}
