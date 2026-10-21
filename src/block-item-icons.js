import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {visibleBlockQuads,quadUV} from './block-mesh.js';
import {BLOCK_ITEMS} from './item-registry.js';
import {ownerBlockQuads112} from './item-model112.js';
import {blockIconPose112} from './item-model112.js';
// Render existing block geometry/face textures, rather than displaying one flat atlas tile.
// The lighting and pose remain an approximation pending vanilla screenshot comparison.
export function renderBlockItemIcons(atlas,ownerGuiModels={},ownerIconModels={}){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true});
 renderer.setSize(32,32,false);renderer.setPixelRatio(1);renderer.setClearColor(0,0);
 const texture=new THREE.CanvasTexture(atlas);texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshBasicMaterial({map:texture,vertexColors:true,transparent:true,alphaTest:.1,side:THREE.DoubleSide});
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-.95,.95,.95,-.95,.1,10);camera.position.set(0,0,4);
 const output={};
 try{for(const item of BLOCK_ITEMS){
  const world={getBlock:(x,y,z)=>({id:x===0&&y===0&&z===0?item.blockId:0,state:{}})};
  const ownerFaces=ownerBlockQuads112(ownerIconModels[item.id]);
  const faces=ownerFaces.length?ownerFaces:visibleBlockQuads(world,0,0,0),fromOriginal=ownerFaces.length>0,positions=[],uvs=[],colors=[],indices=[];
  for(const face of faces){const base=positions.length/3,uv=fromOriginal?face.uv:quadUV(item.blockId,face.d,face.v),shade=face.d[1]>0?1:face.d[1]<0?.5:face.d[0]!==0?.6:.8;
   face.v.forEach((v,i)=>{positions.push(...v.map(n=>fromOriginal?n:n-.5));uvs.push(...uv[i]);colors.push(shade,shade,shade);});indices.push(base,base+1,base+2,base,base+2,base+3);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);
  const mesh=new THREE.Mesh(geometry,material);
  const pose=blockIconPose112(ownerGuiModels[item.id]);
  mesh.rotation.set(...pose.rotation.map(value=>value*Math.PI/180));
  mesh.position.set(...pose.translation);
  mesh.scale.set(...pose.scale);
  scene.add(mesh);renderer.render(scene,camera);output[item.id]=renderer.domElement.toDataURL();scene.remove(mesh);geometry.dispose();
 }}finally{texture.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();}
 return output;
}
