// This database stays in this browser origin. No JAR or extracted bytes are sent.
export const PRIVATE_RESOURCE_VERSION='112-menu-font-atlas6-mobs-v11';
function database(){return new Promise((resolve,reject)=>{
 const request=indexedDB.open('akzm-owner-resources',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('resources');
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 request.onblocked=()=>reject(Error('Resource database blocked'));
});}
async function transaction(mode,value){
 let db;try{db=await database();return await new Promise((resolve,reject)=>{
  const tx=db.transaction('resources',mode),store=tx.objectStore('resources');
  const request=mode==='readonly'?store.get('vanilla112'):store.put(value,'vanilla112');
  tx.oncomplete=()=>resolve(mode==='readonly'?request.result:true);
  tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });}finally{db?.close();}
}
export async function readPrivateResources(){try{return await transaction('readonly')??null;}catch{return null;}}
export async function writePrivateResources(value){try{return await transaction('readwrite',value);}catch{return false;}}
export async function decodePrivateAtlas(uri){
 if(typeof uri!=='string'||!/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(uri))throw Error('Invalid private atlas');
 const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=uri;});
 if(image.width%8||image.width<128||image.height!==image.width/8*6)throw Error('Invalid private atlas size');
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
 canvas.getContext('2d').drawImage(image,0,0);return canvas;
}
