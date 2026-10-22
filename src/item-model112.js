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
export function blockIconPose112(gui,{nativeModel=false}={}){
 if(!gui)return {rotation:[30,45,0],translation:[0,0,0],scale:[1,1,1]};
 const y=nativeModel?gui.rotation[1]:(gui.rotation[1]>180?gui.rotation[1]-180:gui.rotation[1]);
 return {rotation:[gui.rotation[0],y,gui.rotation[2]],
  translation:gui.translation.map(v=>v/16),
  scale:gui.scale.map(v=>v/.625)};
}


/* Owner-local vanilla block-item face shapes. Only numeric geometry references
   are cached on this browser origin; original JSON and image files never enter
   the public repository or its CI artifacts. */
import {REQUIRED_TILES,EXTRA_FACE_TILES} from './resource-pack.js';
const TILE_BY_NAME=new Map(REQUIRED_TILES.map((name,i)=>[name,i]));
for(const [id,name] of Object.entries(EXTRA_FACE_TILES))TILE_BY_NAME.set(name,Number(id));
const SIDE_NORMALS=Object.freeze({
 south:[0,0,1],north:[0,0,-1],east:[1,0,0],west:[-1,0,0],up:[0,1,0],down:[0,-1,0]
});
const FACE_VERTICES=Object.freeze({
 south:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],
 north:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],
 east:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],
 west:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],
 up:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],
 down:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]
});
const vec=(v,max=16)=>Array.isArray(v)&&v.length===3&&v.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max);
const uvRect=v=>Array.isArray(v)&&v.length===4&&v.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=16);
export function resolveOwnerBlockTile112(ref,textures){
 let value=String(ref??'');
 for(let i=0;i<8&&value.startsWith('#');i++)value=String(textures[value.slice(1)]??'');
 if(!value.startsWith('blocks/'))return null;
 const name=value.slice(7);
 // grass_side is already alpha-composited with its tint overlay in our atlas.
 if(name==='grass_side_overlay')return null;
 return TILE_BY_NAME.get(name)??null;
}
export async function readOwnerBlockIconModels(zip,items){
 const result={};
 for(const item of items){
  const name=ownerBlockItemModelName(item);
  if(!name)continue;
  let path='assets/minecraft/models/item/'+name+'.json';
  const seen=new Set(),textures={},models=[];
  let elements=null;
  for(let depth=0;depth<16&&!seen.has(path);depth++){
   seen.add(path);
   const entry=zip.file(path);if(!entry)break;
   let model;
   try{model=JSON.parse(await entry.async('string'));}catch{break;}
   if(!elements&&Array.isArray(model.elements))elements=model.elements;
   for(const [key,value] of Object.entries(model.textures??{}))if(!(key in textures))textures[key]=value;
   const parent=String(model.parent??'').replace(/^minecraft:/,'');
   if(!/^(?:block|item)\/[a-z0-9_/-]+$/.test(parent)||parent.includes('..'))break;
   path='assets/minecraft/models/'+parent+'.json';
  }
  if(!elements)continue;
  const parsed=[];
  for(const element of elements){
   if(!vec(element.from)||!vec(element.to)||element.from.some((n,i)=>n>element.to[i])||element.rotation)continue;
   const faces={};
   for(const [direction,face] of Object.entries(element.faces??{})){
    if(!(direction in SIDE_NORMALS)||!face||typeof face!=='object')continue;
    const tile=resolveOwnerBlockTile112(face.texture,textures);
    const uv=face.uv??[0,0,16,16],rotation=face.rotation??0;
    if(tile===null||!uvRect(uv)||![0,90,180,270].includes(rotation))continue;
    faces[direction]={tile,uv:uv.slice(),rotation};
   }
   if(Object.keys(faces).length)parsed.push({from:element.from.slice(),to:element.to.slice(),faces});
  }
  if(parsed.length)result[item.id]=parsed;
 }
 return result;
}
export function ownerBlockQuads112(elements){
 const out=[];
 for(const element of elements??[]){
  for(const [direction,face] of Object.entries(element.faces??{})){
   const vertices=FACE_VERTICES[direction],normal=SIDE_NORMALS[direction];
   if(!vertices||!normal||!Number.isInteger(face.tile))continue;
   const v=vertices.map(point=>point.map((n,i)=>(element.from[i]+n*(element.to[i]-element.from[i]))/16-.5));
   const [u0,v0,u1,v1]=face.uv;
   const corners=[[u0,v1],[u1,v1],[u1,v0],[u0,v0]];
   const steps=(face.rotation/90)%4;
   const uv=corners.map((_,i)=>{
    const [u,t]=corners[(i+steps)%4],col=face.tile%8,row=Math.floor(face.tile/8);
    return [(col+u/16)/8,1-(row+t/16)/6];
   });
   out.push({d:normal,v,uv,tile:face.tile});
  }
 }
 return out;
}

/**
 * Owner-local ItemModel display.firstperson_righthand; Java 1.12.2 resolves
 * missing child display transforms from the first parent defining them.
 * Save only validated numeric transforms, never JAR model source/assets.
 */
export function cleanHeldTransform112(transform){
 if(!transform||typeof transform!=='object')return null;
 const pick=(key,defaultValue,limit,positive=false)=>{
  const data=transform[key]??defaultValue;
  if(!Array.isArray(data)||data.length!==3||
    !data.every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=limit&&(!positive||v>0)))return null;
  return data.slice();
 };
 const rotation=pick('rotation',[0,0,0],360);
 const translation=pick('translation',[0,0,0],80);
 const scale=pick('scale',[1,1,1],4,true);
 return rotation&&translation&&scale?{rotation,translation,scale}:null;
}
export async function readOwnerFirstPersonModels112(zip,items){
 const result={};
 const cache=new Map();
 async function parsed(path){
  if(cache.has(path))return cache.get(path);
  const entry=zip.file(path);
  let value=null;
  if(entry)try{value=JSON.parse(await entry.async('string'));}catch{}
  cache.set(path,value);return value;
 }
 for(const item of items){
  const name=item?.blockId!==null&&item?.blockId!==undefined?
   ownerBlockItemModelName(item):String(item?.key??'').split(':')[1];
  if(!name||!SAFE_NAME.test(name))continue;
  let path='assets/minecraft/models/item/'+name+'.json';
  const visited=new Set();
  for(let depth=0;depth<16&&!visited.has(path);depth++){
   visited.add(path);
   const model=await parsed(path);if(!model)break;
   const transform=cleanHeldTransform112(model.display?.firstperson_righthand);
   if(transform){result[item.id]=transform;break;}
   const parent=String(model.parent??'').replace(/^minecraft:/,'');
   if(!SAFE_PARENT.test(parent)||parent.includes('..'))break;
   path='assets/minecraft/models/'+parent+'.json';
  }
 }
 return result;
}
export function firstPersonPose112(transform,{item=false}={}){
 // The world-view equip position remains the anchor. All model display
 // attributes retain their relative rotations (including negative Y).
 if(!transform)return {rotation:item?[0,-.65,-.15]:[.2,.78,.10],offset:[0,0,0],scale:[1,1,1]};
 const sign=Math.PI/180;
 return {
  rotation:transform.rotation.map(v=>v*sign),
  offset:transform.translation.map(v=>v/16),
  scale:transform.scale.map(v=>v/.68)
 };
}
