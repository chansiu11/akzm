// Resource pack assets are always read in the user's own browser.
// NO Minecraft artwork or sound is shipped with this repository.
import {createAtlas} from './atlas.js';

const BLOCK_PATH='assets/minecraft/textures/blocks/';
const TILE_NAMES=[
 'grass_top','dirt','stone','sand','log_oak','leaves_oak','planks_oak','water_still',
 'cobblestone','coal_ore','snow','brick','bedrock','grass_side','log_oak_top','glass'
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
const TINT={grass_top:[142,199,97],leaves_oak:[115,163,85],water_still:[83,144,235]};
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
 const names=[...TILE_NAMES,...(overlayPath?['grass_side_overlay']:[])];
 const assets=new Map();
 for(const name of names){const path=findTexturePath(paths,name);if(!path)continue;try{assets.set(name,await decodePNG(zip.file(path)))}catch{/* keep the generated texture for missing/invalid entries */}}
 if(assets.size===0)throw new Error('블록 PNG를 찾지 못했습니다. 업로드한 1.8.9.jar 또는 블록 텍스처가 들어 있는 리소스팩 ZIP을 선택하세요.');
 const tileSize=Math.max(16,Math.min(64,...[...assets.values()].map(x=>Math.min(x.width,x.height))));
 const canvas=document.createElement('canvas');canvas.width=tileSize*8;canvas.height=tileSize*2;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
 const fallback=createAtlas();
 for(let i=0;i<16;i++){
  const x=i%8*tileSize,y=Math.floor(i/8)*tileSize,name=TILE_NAMES[i];
  const asset=assets.get(name);
  if(!asset){ctx.drawImage(fallback,i%8*16,Math.floor(i/8)*16,16,16,x,y,tileSize,tileSize);continue;}
  const tint=TINT[name];
  if(tint)ctx.drawImage(tintedImage(asset,tileSize,tint),x,y);
  else drawSquare(ctx,asset,x,y,tileSize);
  // Older grass block models combine a grass_side texture with a tinted transparent overlay.
  if(name==='grass_side'&&assets.has('grass_side_overlay'))ctx.drawImage(tintedImage(assets.get('grass_side_overlay'),tileSize,[142,199,97]),x,y);
 }
 return {canvas,loaded:assets.size,total:TILE_NAMES.length,fileName:file.name};
}

export function saveLocalAtlas(canvas){try{localStorage.setItem(LOCAL_ATLAS_KEY,canvas.toDataURL('image/png'));return true}catch{return false}}
export async function restoreLocalAtlas(){
 let uri;try{uri=localStorage.getItem(LOCAL_ATLAS_KEY)}catch{return null}if(!uri?.startsWith('data:image/png;base64,'))return null;
 try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=uri});const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;canvas.getContext('2d').drawImage(img,0,0);return canvas}catch{return null}
}
export function clearLocalAtlas(){try{localStorage.removeItem(LOCAL_ATLAS_KEY)}catch{}}
