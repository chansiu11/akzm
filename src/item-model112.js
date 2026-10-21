// Reads ONLY item-model metadata from the user's local 1.12.2 JAR.
// Do not publish the model JSON, textures, or any extracted assets.
export const ITEM_MODEL_NAME_112=Object.freeze({
 log:'oak_log',leaves:'oak_leaves',planks:'oak_planks',
 wooden_slab:'oak_slab',brick_block:'brick_block',
});
const SPECIAL_BY_ID=Object.freeze({5:'oak_log',6:'oak_leaves',7:'oak_planks',8:null,15:'oak_slab',24:'spruce_log',25:'spruce_leaves'});
const SAFE_NAME=/^[a-z0-9_]+$/;
const SAFE_PARENT=/^(?:block|item)\/[a-z0-9_/-]+$/;
export function ownerBlockItemModelName(item){
 if(!item||!Number.isInteger(item.blockId))return null;
 if(Object.hasOwn(SPECIAL_BY_ID,item.blockId))return SPECIAL_BY_ID[item.blockId];
 const name=String(item.key??'').split(':')[1]??'';
 return SAFE_NAME.test(name)?ITEM_MODEL_NAME_112[name]??name:null;
}
export function cleanGuiTransform112(input){
 if(!input||typeof input!=='object')return null;
 const entries={rotation:[0,0,0],translation:[0,0,0],scale:[1,1,1]};
 const valid=(a,limit,positive=false)=>Array.isArray(a)&&a.length===3&&a.every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=limit&&(!positive||v>0));
 if(!valid(input.rotation,360)||!valid(input.translation,80)||!valid(input.scale,4,true))return null;
 return Object.fromEntries(Object.keys(entries).map(key=>[key,input[key].slice()]));
}
export async function readOwnerBlockGuiModels(zip,items){
 const result={};
 for(const item of items){
  const name=ownerBlockItemModelName(item);
  if(!name)continue;
  let path='assets/minecraft/models/item/'+name+'.json';
  const visited=new Set();
  for(let step=0;step<16&&!visited.has(path);step++){
   visited.add(path);
   const entry=zip.file(path);if(!entry)break;
   let model;
   try{model=JSON.parse(await entry.async('string'));}catch{break;}
   const gui=cleanGuiTransform112(model?.display?.gui);
   if(gui){result[item.id]=gui;break;}
   const parent=String(model?.parent??'').replace(/^minecraft:/,'');
   if(!SAFE_PARENT.test(parent)||parent.includes('..'))break;
   path='assets/minecraft/models/'+parent+'.json';
  }
 }
 return result;
}
// Java JSON GUI model rotations are stored in Java's block-model convention.
// This adapts them to our front-facing Three.js mesh. Exact vanilla lightmap
// and item framebuffer rasterization still need screenshot-based validation.
export function blockIconPose112(gui){
 if(!gui)return {rotation:[30,45,0],translation:[0,0,0],scale:[1,1,1]};
 const y=gui.rotation[1]>180?gui.rotation[1]-180:gui.rotation[1];
 return {rotation:[gui.rotation[0],y,gui.rotation[2]],
  translation:gui.translation.map(v=>v/16),
  scale:gui.scale.map(v=>v/.625)};
}
