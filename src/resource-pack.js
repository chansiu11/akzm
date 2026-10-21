// Resource pack assets are always read in the user's own browser.
// NO Minecraft artwork or sound is shipped with this repository.
import {createAtlas,ATLAS_ROWS} from './atlas.js';

export const EXTRA_FACE_TILES=Object.freeze({36:'furnace_side',37:'furnace_top',38:'sandstone_top',39:'sandstone_bottom',40:'log_spruce_top'});
const BLOCK_PATH='assets/minecraft/textures/blocks/';
const TILE_NAMES=[
 'grass_top','dirt','stone','sand','log_oak','leaves_oak','planks_oak','water_still',
 'cobblestone','coal_ore','snow','brick','bedrock','grass_side','log_oak_top','glass','crafting_table_top','crafting_table_side','crafting_table_front',
 'iron_ore','gold_ore','diamond_ore','gravel','sandstone_normal','clay','log_spruce','leaves_spruce','lapis_ore','redstone_ore','emerald_ore','planks_oak','furnace_front_off','lever','redstone_lamp_off'
];
export const REQUIRED_TILES=Object.freeze([...TILE_NAMES]);
export const LOCAL_ATLAS_KEY='voxel-frontier-user-atlas-v1';

export function findTexturePath(paths, name){
 const wanted=String(name).toLowerCase()+'.png';
 const names=Array.from(paths);
 const candidates=[
  BLOCK_PATH+wanted,
  'minecraft/textures/blocks/'+wanted,
  'textures/blocks/'+wanted,
  'assets/minecraft/textures/block/'+wanted,
  'minecraft/textures/block/'+wanted,
  'textures/block/'+wanted
 ];
 for(const c of candidates){const found=names.find(n=>n.toLowerCase().replace(/\\/g,'/').replace(/^\.\//,'')===c);if(found)return found}
 // Some resource packs add a top-level directory when compressed.
 for(const c of candidates){const found=names.find(n=>n.toLowerCase().replace(/\\/g,'/').endsWith('/'+c));if(found)return found}
 return null;
}

function drawSquare(ctx,img,x,y,size){const frame=Math.min(img.width,img.height);ctx.drawImage(img,0,0,frame,frame,x,y,size,size)}
function tintedImage(img,size,tint){
 const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
 drawSquare(ctx,img,0,0,size);
 const d=ctx.getImageData(0,0,size,size);for(let i=0;i<d.data.length;i+=4){d.data[i]=Math.round(d.data[i]*tint[0]/255);d.data[i+1]=Math.round(d.data[i+1]*tint[1]/255);d.data[i+2]=Math.round(d.data[i+2]*tint[2]/255)}ctx.putImageData(d,0,0);return c;
}
const TINT={grass_top:[145,189,89],leaves_oak:[119,171,47],leaves_spruce:[97,153,97]};
async function decodePNG(entry){
 const bytes=await entry.async('uint8array');const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
 try{return await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('PNG를 읽지 못했습니다'));image.src=url})}
 finally{URL.revokeObjectURL(url)}
}

export async function loadLocalResourcePack(file){
 if(!file)throw new Error('JAR 또는 ZIP을 선택하세요.');
 if(file.size>70*1024*1024)throw new Error('70MB 이하의 텍스처 JAR/ZIP을 선택하세요. 사운드 에셋 ZIP은 텍스처팩이 아닙니다.');
 if(!window.JSZip)throw new Error('ZIP 처리 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인하세요.');
 let zip;try{zip=await window.JSZip.loadAsync(file)}catch{throw new Error('유효한 JAR/ZIP 압축파일이 아닙니다.');}
 const paths=Object.keys(zip.files);
 const overlayPath=findTexturePath(paths,'grass_side_overlay');
 const names=[...TILE_NAMES,...Object.values(EXTRA_FACE_TILES),...(overlayPath?['grass_side_overlay']:[])];
 const assets=new Map();
 for(const name of names){const path=findTexturePath(paths,name);if(!path)continue;try{assets.set(name,await decodePNG(zip.file(path)))}catch{/* keep the generated texture for missing/invalid entries */}}
 if(assets.size===0)throw new Error('블록 PNG를 찾지 못했습니다. 업로드한 1.12.2.jar 또는 블록 텍스처가 들어 있는 리소스팩 ZIP을 선택하세요.');
 const tileSize=Math.max(16,Math.min(64,...[...assets.values()].map(x=>Math.min(x.width,x.height))));
 const canvas=document.createElement('canvas');canvas.width=tileSize*8;canvas.height=tileSize*ATLAS_ROWS;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
 const fallback=createAtlas();
 ctx.drawImage(fallback,0,0,canvas.width,canvas.height);
 for(let i=0;i<TILE_NAMES.length;i++){
  const x=i%8*tileSize,y=Math.floor(i/8)*tileSize,name=TILE_NAMES[i];
  const asset=assets.get(name);
  if(!asset){ctx.drawImage(fallback,i%8*16,Math.floor(i/8)*16,16,16,x,y,tileSize,tileSize);continue;}
  // Replace the fallback tile, including its alpha. Otherwise glass/leaves
  // inherit opaque procedural pixels beneath transparent source pixels.
  ctx.clearRect(x,y,tileSize,tileSize);
  const tint=TINT[name];
  if(tint)ctx.drawImage(tintedImage(asset,tileSize,tint),x,y);
  else drawSquare(ctx,asset,x,y,tileSize);
  // Older grass block models combine a grass_side texture with a tinted transparent overlay.
  if(name==='grass_side'&&assets.has('grass_side_overlay'))ctx.drawImage(tintedImage(assets.get('grass_side_overlay'),tileSize,TINT.grass_top),x,y);
 }
 for(const [index,name] of Object.entries(EXTRA_FACE_TILES)){
  const img=assets.get(name);if(img)drawSquare(ctx,img,index%8*tileSize,Math.floor(index/8)*tileSize,tileSize);
 }
 for(const [j,name] of ['apple','bread'].entries()){
  const entry=zip.file('assets/minecraft/textures/items/'+name+'.png');if(!entry)continue;
  const i=34+j,x=i%8*tileSize,y=Math.floor(i/8)*tileSize;ctx.clearRect(x,y,tileSize,tileSize);drawSquare(ctx,await decodePNG(entry),x,y,tileSize);
 }
 const chest=zip.file('assets/minecraft/textures/entity/chest/normal.png');
 if(chest){const image=await decodePNG(chest);
  for(const [index,u] of [[41,0],[43,14]]){const x=index%8*tileSize,y=Math.floor(index/8)*tileSize;ctx.clearRect(x,y,tileSize,tileSize);ctx.drawImage(image,u,14,14,5,x,y,tileSize,tileSize/3);ctx.drawImage(image,u,33,14,10,x,y+tileSize/3,tileSize,tileSize*2/3);}
  const index=42;ctx.drawImage(image,14,0,14,14,index%8*tileSize,Math.floor(index/8)*tileSize,tileSize,tileSize);
 }
 return {canvas,loaded:TILE_NAMES.filter(n=>assets.has(n)).length+Object.values(EXTRA_FACE_TILES).filter(n=>assets.has(n)).length,total:TILE_NAMES.length+Object.keys(EXTRA_FACE_TILES).length,fileName:file.name};
}

export function saveLocalAtlas(canvas){try{localStorage.setItem(LOCAL_ATLAS_KEY,canvas.toDataURL('image/png'));return true}catch{return false}}
export async function restoreLocalAtlas(){
 let uri;try{uri=localStorage.getItem(LOCAL_ATLAS_KEY)}catch{return null}
 if(!uri?.startsWith('data:image/png;base64,'))return null;
 try{
  const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=uri});
  const tileSize=img.width/8;
  if(!Number.isInteger(tileSize)||tileSize<16||![2,3,4,5,6].includes(img.height/tileSize))return null;
  const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=ATLAS_ROWS*tileSize;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  ctx.drawImage(createAtlas(),0,0,canvas.width,canvas.height);
  ctx.drawImage(img,0,0);
  return canvas;
 }catch{return null}
}
export function clearLocalAtlas(){try{localStorage.removeItem(LOCAL_ATLAS_KEY)}catch{}}
