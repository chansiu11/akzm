import {MENU112_FILES,pngData} from './menu112-assets.js';
import {ITEM_DEFS,BLOCK_ITEMS} from './item-registry.js';
import {readOwnerBlockGuiModels} from './item-model112.js';
// Personal-use importer: all original images are read from a locally chosen JAR.
// Never include proprietary game files or encoded copies in this public repository.
export const GUI112_SHA1='0f275bc1547d01fa5f56ba34bdc87d981ee12daf';
export const GUI112_KEY='voxel-frontier-private-gui112-v1';
export const GUI112_FILES=Object.freeze({
 widgets:'assets/minecraft/textures/gui/widgets.png',
 icons:'assets/minecraft/textures/gui/icons.png',
 inventory:'assets/minecraft/textures/gui/container/inventory.png',
 crafting:'assets/minecraft/textures/gui/container/crafting_table.png',
 chest:'assets/minecraft/textures/gui/container/generic_54.png',
 furnace:'assets/minecraft/textures/gui/container/furnace.png',
 recipeBook:'assets/minecraft/textures/gui/recipe_book.png'
});
// 1.12.2 item model IDs and PNG basenames can differ (e.g. wooden -> wood).
// Prefer the layer0 path declared by the owner's local model JSON. Do not publish it.
const ITEM112_ALIASES=Object.freeze({wooden_pickaxe:'wood_pickaxe',golden_pickaxe:'gold_pickaxe',redstone:'redstone_dust',dye:'dye_powder_blue'});
export function ownerItemTexturePath(item,model=null){
 const name=String(item?.key??'').split(':').pop();
 if(!/^[a-z0-9_]+$/.test(name))return null;
 // Lapis is dye metadata 4 in 1.12.2: do not use the model's generic dye default.
 if(item.id!==107){
  const layer=String(model?.textures?.layer0??'').replace(/^minecraft:/,'');
  if(/^items\/[a-z0-9_/-]+$/.test(layer)&&!layer.includes('..'))
   return 'assets/minecraft/textures/'+layer+'.png';
 }
 return 'assets/minecraft/textures/items/'+(ITEM112_ALIASES[name]??name)+'.png';
}
export function validGui112Assets(a){return ['widgets','icons','inventory','crafting'].every(k=>typeof a?.[k]==='string'&&/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(a[k]));}
export function applyGui112(root,a){if(!root||!validGui112Assets(a))return false;for(const k of Object.keys(GUI112_FILES))if(typeof a[k]==='string'&&/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(a[k]))root.style.setProperty('--gui112-'+k,'url("'+a[k]+'")');root.classList.add('gui112-assets');for(const k of ['chest','furnace','recipeBook'])root.classList.toggle('gui112-'+k,typeof a[k]==='string'&&/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(a[k]));return true;}
export function restoreGui112(root){try{const a=JSON.parse(localStorage.getItem(GUI112_KEY)||'null');return applyGui112(root,a)?a:null;}catch{return null;}}
export function storeGui112(a){if(!validGui112Assets(a))return false;try{localStorage.setItem(GUI112_KEY,JSON.stringify(a));return true;}catch{return false;}}
export async function readOwner112Jar(file){
 if(!file||file.size>70*1024*1024)throw Error('70MB 이하의 정품 1.12.2.jar를 선택하세요.');
 const data=await file.arrayBuffer();
 if(!crypto?.subtle)throw Error('보안 연결에서 파일 확인이 필요합니다.');
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1',data)),v=>v.toString(16).padStart(2,'0')).join('');
 if(digest!==GUI112_SHA1)throw Error('정품 Minecraft Java Edition 1.12.2.jar SHA-1과 일치하지 않습니다.');
 const m=await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
 const JSZip=m.default??m;
 const zip=await JSZip.loadAsync(data,{checkCRC32:true});
 const a={};
 const splashes=zip.file('assets/minecraft/texts/splashes.txt');if(splashes)a.splashes=(await splashes.async('string')).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 for(const [key,path] of Object.entries(GUI112_FILES)){
  const f=zip.file(path);if(!f)throw Error('원본 UI PNG 누락: '+path);
  const b=await f.async('uint8array');
  if(b.length<24||b[0]!==137||b[1]!==80||b[2]!==78||b[3]!==71)throw Error('잘못된 PNG: '+path);
  const view=new DataView(b.buffer,b.byteOffset,b.byteLength);
  if(view.getUint32(16)!==256||view.getUint32(20)!==256)throw Error('UI 텍스처 크기 불일치: '+path);
  a[key]='data:image/png;base64,'+await f.async('base64');
 }
 for(const [key,path] of Object.entries(MENU112_FILES)){
  const entry=zip.file(path);if(entry)a[key]='data:image/png;base64,'+await entry.async('base64');
 }
 a.blockGuiModels=await readOwnerBlockGuiModels(zip,BLOCK_ITEMS);
 const steve=zip.file('assets/minecraft/textures/entity/steve.png');if(steve)a.playerSkin='data:image/png;base64,'+await steve.async('base64');
 a.itemIcons={};
 for(const item of ITEM_DEFS.filter(i=>i.blockId===null)){
  const modelName=item.key.split(':')[1];
  const modelEntry=zip.file('assets/minecraft/models/item/'+modelName+'.json');
  let model=null;
  if(modelEntry){try{model=JSON.parse(await modelEntry.async('string'));}catch{/* use 1.12.2 fallback naming */}}
  const path=ownerItemTexturePath(item,model);
  const entry=path&&zip.file(path);
  if(entry)a.itemIcons[item.id]='data:image/png;base64,'+await entry.async('base64');
 }
 a.bitmapFont={ascii:'data:image/png;base64,'+await zip.file('assets/minecraft/textures/font/ascii.png').async('base64'),sizes:await zip.file('assets/minecraft/font/glyph_sizes.bin').async('base64'),pages:{}};
 const pages=new Set([0,0x20,0x21,0x25,0x30,...Array.from({length:44},(_,i)=>0xac+i)]);
 for(const page of pages){const f=zip.file('assets/minecraft/textures/font/unicode_page_'+page.toString(16).padStart(2,'0')+'.png');if(f)a.bitmapFont.pages[page]='data:image/png;base64,'+await f.async('base64');}
 return {assets:a,JSZip};
}
