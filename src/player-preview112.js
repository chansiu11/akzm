// A skin-textured inventory avatar, built only from the owner's browser-local JAR.
// No original pixels or vanilla game code are published here.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {RIGHT_ARM_UV_RECTS,skinRectUV} from './item-extrusion.js';
import {pngData} from './menu112-assets.js';

const HEAD=[[16,8,24,16],[0,8,8,16],[8,0,16,8],[16,0,24,8],[8,8,16,16],[24,8,32,16]];
const BODY=[[16,20,20,32],[28,20,32,32],[20,16,28,20],[28,16,36,20],[20,20,28,32],[32,20,40,32]];
const LEG=[[8,20,12,32],[0,20,4,32],[4,16,8,20],[8,16,12,20],[4,20,8,32],[12,20,16,32]];
const LEFT_ARM=[[48,52,52,64],[40,52,44,64],[44,48,48,52],[48,48,52,52],[44,52,48,64],[52,52,56,64]];
const LEFT_LEG=[[24,52,28,64],[16,52,20,64],[20,48,24,52],[24,48,28,52],[20,52,24,64],[28,52,32,64]];
export function playerPreviewModelUV(part,skinHeight=64){
 const shapes={head:HEAD,body:BODY,rightArm:RIGHT_ARM_UV_RECTS,leftArm:skinHeight===64?LEFT_ARM:RIGHT_ARM_UV_RECTS,rightLeg:LEG,leftLeg:skinHeight===64?LEFT_LEG:LEG};
 return shapes[part]?.map(rect=>skinRectUV(rect,64,skinHeight))??null;
}
export function createPlayerPreview112(panel){
 const canvas=panel?.querySelector('#ownerPlayerPreview112');
 if(!canvas)return {setSkin:async()=>false,draw:()=>{},dispose:()=>{}};
 let renderer=null,texture=null,material=null,avatar=null,generation=0;
 const scene=new THREE.Scene();
 const camera=new THREE.OrthographicCamera(-14.9,14.9,21,-21,.1,100);
 camera.position.set(0,17,75);camera.lookAt(0,16,0);
 function makePart(part,w,h,d,x,y,z,skinHeight){
  const geometry=new THREE.BoxGeometry(w,h,d),uv=geometry.attributes.uv;
  playerPreviewModelUV(part,skinHeight).forEach((face,i)=>face.forEach(([u,v],j)=>uv.setXY(i*4+j,u,v)));
  uv.needsUpdate=true;
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);avatar.add(mesh);return mesh;
 }
 function clearModel(){
  if(avatar){avatar.traverse(o=>o.geometry?.dispose());scene.remove(avatar);avatar=null;}
  texture?.dispose();material?.dispose();texture=material=null;
 }
 function draw(){
  if(!renderer||panel.classList.contains('hidden')||panel.dataset.container!=='inventory')return;
  renderer.setClearColor(0,0);renderer.clear();renderer.render(scene,camera);
 }
 async function setSkin(uri){
  const token=++generation;
  if(!pngData(uri)){clearModel();canvas.classList.remove('owner-preview-ready');return false;}
  const loaded=await new THREE.TextureLoader().loadAsync(uri);
  if(token!==generation){loaded.dispose();return false;}
  const {width,height}=loaded.image;
  if(width!==64||![32,64].includes(height)){loaded.dispose();throw Error('Invalid owner player skin');}
  if(!renderer){
   renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false});
   renderer.setPixelRatio(1);renderer.setSize(51,72,false);
   renderer.outputColorSpace=THREE.SRGBColorSpace;
  }
  clearModel();
  loaded.magFilter=loaded.minFilter=THREE.NearestFilter;loaded.generateMipmaps=false;loaded.colorSpace=THREE.SRGBColorSpace;
  texture=loaded;material=new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.05,side:THREE.FrontSide});
  avatar=new THREE.Group();scene.add(avatar);avatar.rotation.y=-.20;
  makePart('head',8,8,8,0,28,0,height);
  makePart('body',8,12,4,0,18,0,height);
  makePart('rightArm',4,12,4,-6,18,0,height);
  makePart('leftArm',4,12,4,6,18,0,height);
  makePart('rightLeg',4,12,4,-2,6,0,height);
  makePart('leftLeg',4,12,4,2,6,0,height);
  canvas.classList.add('owner-preview-ready');draw();return true;
 }
 return {setSkin,draw,dispose(){++generation;clearModel();renderer?.dispose();canvas.classList.remove('owner-preview-ready');}};
}
