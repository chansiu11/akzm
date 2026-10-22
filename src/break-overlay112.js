// Public fallback is original generated crack artwork; the owner's ten
// personal destroy_stage PNGs override it entirely in that browser.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {visibleBlockQuads} from './block-mesh.js';

function fallbackStage(stage){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=16;
 const c=canvas.getContext('2d');c.clearRect(0,0,16,16);
 const count=4+stage*3;
 c.strokeStyle='rgba(9,8,8,.92)';c.lineWidth=1;c.lineJoin='miter';
 for(let n=0;n<count;n++){
  const x=(n*7+stage*3)%16,y=(n*11+stage*2)%16;
  c.beginPath();c.moveTo(x,y);c.lineTo((x+3+(n%3))%16,(y+3)%16);
  if(n%2===0)c.lineTo((x+5)%16,(y+6)%16);c.stroke();
 }
 return canvas;
}
function createMaterial(stage,img){
 const tex=new THREE.Texture(img);tex.needsUpdate=true;tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
 tex.wrapS=THREE.ClampToEdgeWrapping;tex.wrapT=THREE.ClampToEdgeWrapping;tex.generateMipmaps=false;
 const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,side:THREE.DoubleSide});
 mat.userData.texture=tex;return mat;
}
export function createBreakOverlay112(scene,world){
 let materials=Array.from({length:10},(_,i)=>createMaterial(i,fallbackStage(i)));
 let generation=0,key='',mesh=null;
 function clear(){if(mesh){scene.remove(mesh);mesh.geometry.dispose();mesh=null;}key='';}
 function geometry(x,y,z){
  const faces=visibleBlockQuads(world,x,y,z),p=[],uv=[],idx=[];
  for(const f of faces){
   const base=p.length/3,normal=f.d;
   for(const v of f.v){
    p.push(f.x+v[0]+normal[0]*.004,f.y+v[1]+normal[1]*.004,f.z+v[2]+normal[2]*.004);
    let u,vv;
    if(normal[2]){u=normal[2]>0?v[0]:1-v[0];vv=v[1];}
    else if(normal[0]){u=normal[0]>0?1-v[2]:v[2];vv=v[1];}
    else{u=v[0];vv=normal[1]>0?1-v[2]:v[2];}
    uv.push(u,vv);
   }
   idx.push(base,base+1,base+2,base,base+2,base+3);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);return geo;
 }
 function setTarget(hit,ratio){
  if(!hit||ratio<=0){clear();return;}
  const id=hit.x+','+hit.y+','+hit.z;
  if(key!==id){clear();const geo=geometry(hit.x,hit.y,hit.z);mesh=new THREE.Mesh(geo,materials[0]);mesh.renderOrder=12;mesh.frustumCulled=false;scene.add(mesh);key=id;}
  if(mesh)mesh.material=materials[Math.min(9,Math.floor(ratio*10))];
 }
 async function setOwnerStages(uris){
  const newGeneration=++generation;
  if(!Array.isArray(uris)||uris.length!==10)return false;
  const loaded=await Promise.all(uris.map(uri=>new Promise(resolve=>{
   if(!/^data:image\/png;base64,/i.test(uri)){resolve(null);return;}
   const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=uri;
  })));
  if(newGeneration!==generation||loaded.some(x=>!x))return false;
  const next=loaded.map((img,i)=>createMaterial(i,img));
  for(const mat of materials){mat.userData.texture.dispose();mat.dispose();}
  materials=next;if(mesh)mesh.material=materials[0];
  return true;
 }
 return {setTarget,setOwnerStages,clear,dispose(){++generation;clear();for(const m of materials){m.userData.texture.dispose();m.dispose();}}};
}
