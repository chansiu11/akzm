// All images come from the owner's local JAR; this module contains only paths/layout.
export const MENU112_FILES=Object.freeze({
 title:'assets/minecraft/textures/gui/title/minecraft.png',
 edition:'assets/minecraft/textures/gui/title/edition.png',
 dirt:'assets/minecraft/textures/gui/options_background.png',
 ...Object.fromEntries(Array.from({length:6},(_,i)=>['panorama'+i,`assets/minecraft/textures/gui/title/background/panorama_${i}.png`]))
});
export const pngData=value=>typeof value==='string'&&/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(value);
export function menuAssetsReady(assets){return Object.keys(MENU112_FILES).every(k=>pngData(assets?.[k]));}
export function cubeSample(x,y,z){
 const ax=Math.abs(x),ay=Math.abs(y),az=Math.abs(z);let face,u,v;
 if(az>=ax&&az>=ay){face=z>0?0:2;u=z>0?x/az:-x/az;v=-y/az;}
 else if(ax>=ay){face=x>0?1:3;u=x>0?-z/ax:z/ax;v=-y/ax;}
 else {face=y>0?4:5;u=x/ay;v=y>0?z/ay:-z/ay;}
 return {face,u:(u+1)/2,v:(v+1)/2};
}
export async function applyMenu112(assets){
 if(!menuAssetsReady(assets))return false;
 const images=await Promise.all(Object.keys(MENU112_FILES).map(key=>new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>resolve([key,image]);image.onerror=reject;image.src=assets[key];
 })));
 const map=Object.fromEntries(images),root=document.documentElement;
 for(const key of ['title','edition','dirt'])root.style.setProperty('--menu112-'+key,`url("${assets[key]}")`);
 const logo=document.getElementById('originalTitle112');
 if(logo){logo.width=274;logo.height=44;const ctx=logo.getContext('2d');ctx.clearRect(0,0,274,44);ctx.drawImage(map.title,0,0,155,44,0,0,155,44);ctx.drawImage(map.title,0,45,119,44,155,0,119,44);}
 const faces=Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.drawImage(map['panorama'+i],0,0);return ctx.getImageData(0,0,256,256).data;});
 const canvas=document.getElementById('menuPanorama');
 canvas.dispatchEvent(new CustomEvent('owner-panorama',{detail:faces}));
 root.classList.add('menu112-assets');return true;
}
export function drawOwnerPanorama(ctx,faces,time,width,height){
 const frame=ctx.createImageData(width,height),yaw=time*.012,pitch=.12+Math.sin(time*.025)*.035,aspect=width/height;
 const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const vx=(2*(x+.5)/width-1)*aspect,vy=1-2*(y+.5)/height;
  const py=vy*cp-sp,pz=vy*sp+cp;
  const sample=cubeSample(vx*cy+pz*sy,py,-vx*sy+pz*cy);
  const source=(Math.min(255,Math.max(0,Math.floor(sample.v*256)))*256+Math.min(255,Math.max(0,Math.floor(sample.u*256))))*4;
  const dest=(y*width+x)*4;frame.data.set(faces[sample.face].subarray(source,source+3),dest);frame.data[dest+3]=255;
 }
 ctx.putImageData(frame,0,0);
}
