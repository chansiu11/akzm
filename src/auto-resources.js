// These URLs point to user-extracted local files. No game artwork is shipped in this repository.
import {createAtlas,ATLAS_ROWS} from './atlas.js';
import {REQUIRED_TILES} from './resource-pack.js';

export const RESOURCE_ROOT = 'assets/minecraft/textures/';
export const BLOCK_ROOT = RESOURCE_ROOT + 'blocks/';
export const ITEM_ROOT = RESOURCE_ROOT + 'items/';
export const SIMPLE_ITEM_ICONS = Object.freeze(['apple','bread']);
const TINT = {grass_top:[142,199,97],leaves_oak:[115,163,85],water_still:[83,144,235]};

export function mapBlockTextures(manifest){
  const paths = new Set(Array.isArray(manifest?.paths) ? manifest.paths : []);
  const result = Object.fromEntries(REQUIRED_TILES.map(name => [name, paths.has(BLOCK_ROOT+name+'.png') ? BLOCK_ROOT+name+'.png' : null]));
  result.grass_side_overlay = paths.has(BLOCK_ROOT+'grass_side_overlay.png') ? BLOCK_ROOT+'grass_side_overlay.png' : null;
  return result;
}

function loadImage(src){
  return new Promise((resolve,reject)=>{
    const image = new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('texture image failed: '+src));
    image.src=src;
  });
}
function drawFrame(ctx,img,x,y,size){
  const frame=Math.min(img.width,img.height);
  ctx.drawImage(img,0,0,frame,frame,x,y,size,size);
}
function applyTint(ctx,textureImg,x,y,size,tint){
  const layer=document.createElement('canvas');layer.width=layer.height=size;
  const layerCtx=layer.getContext('2d',{willReadFrequently:true});
  layerCtx.imageSmoothingEnabled=false;
  drawFrame(layerCtx,textureImg,0,0,size);
  const rgba=layerCtx.getImageData(0,0,size,size);
  for(let p=0;p<rgba.data.length;p+=4){
    rgba.data[p]=Math.round(rgba.data[p]*tint[0]/255);
    rgba.data[p+1]=Math.round(rgba.data[p+1]*tint[1]/255);
    rgba.data[p+2]=Math.round(rgba.data[p+2]*tint[2]/255);
  }
  layerCtx.putImageData(rgba,0,0);
  ctx.drawImage(layer,x,y);
}

/** Automatically applies locally extracted user-owned texture files, without a file picker. */
export async function loadAutomaticTextures(){
  const base=new URL('../local-resources/',import.meta.url);
  let manifest;
  try{
    const response=await fetch(new URL('manifest.json',base),{cache:'no-store'});
    if(!response.ok)return null;
    manifest=await response.json();
  }catch{return null;}
  const mapping=mapBlockTextures(manifest);
  const pathSet=new Set(manifest.paths||[]);
  for(const name of SIMPLE_ITEM_ICONS){const key=ITEM_ROOT+name+'.png';mapping['food:'+name]=pathSet.has(key)?key:null;}
  const images=new Map();
  await Promise.all(Object.entries(mapping).map(async ([name,relativePath])=>{
    if(!relativePath)return;
    try{images.set(name,await loadImage(new URL(relativePath,base).href));}catch{/* missing/invalid local files use generated fallback */}
  }));
  if(images.size===0)return null;
  const sizes=[...images.values()].map(img=>Math.min(img.width,img.height));
  const tileSize=Math.max(16,Math.min(64,...sizes));
  const canvas=document.createElement('canvas');canvas.width=8*tileSize;canvas.height=ATLAS_ROWS*tileSize;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
  const fallback=createAtlas();
  ctx.drawImage(fallback,0,0,canvas.width,canvas.height);
  for(let i=0;i<REQUIRED_TILES.length;i++){
    const name=REQUIRED_TILES[i],x=(i%8)*tileSize,y=Math.floor(i/8)*tileSize;
    const img=images.get(name);
    if(!img){ctx.drawImage(fallback,(i%8)*16,Math.floor(i/8)*16,16,16,x,y,tileSize,tileSize);continue;}
    if(TINT[name])applyTint(ctx,img,x,y,tileSize,TINT[name]);
    else drawFrame(ctx,img,x,y,tileSize);
    if(name==='grass_side'&&images.has('grass_side_overlay')){
      applyTint(ctx,images.get('grass_side_overlay'),x,y,tileSize,TINT.grass_top);
    }
  }
  for(let j=0;j<SIMPLE_ITEM_ICONS.length;j++){
   const i=REQUIRED_TILES.length+j,x=(i%8)*tileSize,y=Math.floor(i/8)*tileSize;
   const icon=images.get('food:'+SIMPLE_ITEM_ICONS[j]);
   if(icon)drawFrame(ctx,icon,x,y,tileSize);
   else ctx.drawImage(fallback,(i%8)*16,Math.floor(i/8)*16,16,16,x,y,tileSize,tileSize);
  }
  return {canvas,loaded:REQUIRED_TILES.filter(name=>images.has(name)).length,total:REQUIRED_TILES.length,available:manifest.paths?.length||0};
}
