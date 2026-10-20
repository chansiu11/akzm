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
 for(const [key,path] of Object.entries(GUI112_FILES)){
  const f=zip.file(path);if(!f)throw Error('원본 UI PNG 누락: '+path);
  const b=await f.async('uint8array');
  if(b.length<24||b[0]!==137||b[1]!==80||b[2]!==78||b[3]!==71)throw Error('잘못된 PNG: '+path);
  const view=new DataView(b.buffer,b.byteOffset,b.byteLength);
  if(view.getUint32(16)!==256||view.getUint32(20)!==256)throw Error('UI 텍스처 크기 불일치: '+path);
  a[key]='data:image/png;base64,'+await f.async('base64');
 }
 return {assets:a,JSZip};
}
