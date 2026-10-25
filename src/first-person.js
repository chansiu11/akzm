import {extrudeItemPixels,RIGHT_ARM_UV_RECTS,skinRectUV} from './item-extrusion.js';
import {visibleBlockQuads,quadUV} from './block-mesh.js';
import {definition} from './block-registry.js';
import {ownerBlockQuads112,firstPersonPose112} from './item-model112.js?v=1.2';
// Independent low-poly voxel hand and held-block view model. Three.js is loaded by the game.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {uvFor} from './atlas.js?v=1.7';
import {heldItemView,BOX_FACE_NORMALS,boxGeometryUV,firstPersonFov,toolFamily112,toolMaterialTier112} from './held-item-view.js?v=1.3';
const skin=new THREE.MeshLambertMaterial({color:'#d9ab86'});
const sleeve=new THREE.MeshLambertMaterial({color:'#477c92'});
function cube(w,h,d,material){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)}
function textureBoxUV(mesh,tiles){const attr=mesh.geometry.attributes.uv;
 // BoxGeometry uses 4 vertices per face.
 for(let face=0;face<BOX_FACE_NORMALS.length;face++){const uv=boxGeometryUV(uvFor(tiles[face]));for(let j=0;j<4;j++)attr.setXY(face*4+j,uv[j][0],uv[j][1]);}attr.needsUpdate=true;
}
export function createFirstPerson(renderer,atlasTexture){
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(70,1,.01,10);
 const group=new THREE.Group();scene.add(group);
 const lit=new THREE.AmbientLight('#ffffff',1.35);scene.add(lit);
 const sun=new THREE.DirectionalLight('#fff8e8',1.2);sun.position.set(-2,4,3);scene.add(sun);
 const arm=cube(.25,.75,.25,skin);arm.position.set(.60,-.59,-.79);arm.rotation.z=-.12;group.add(arm);
 const cuff=cube(.27,.30,.27,sleeve);cuff.position.set(.61,-.82,-.80);cuff.rotation.z=-.12;group.add(cuff);
 const blockMaterial=new THREE.MeshLambertMaterial({map:atlasTexture,transparent:true,alphaTest:.05});
 const held=cube(.28,.28,.28,blockMaterial);held.position.set(.42,-.30,-.79);held.rotation.set(.20,.78,.10);group.add(held);
 const blockCubeGeometry=held.geometry,nonCubeGeometries=new Map();
 const toolGroup=new THREE.Group();toolGroup.position.set(.50,-.37,-.82);toolGroup.rotation.set(.10,0,-.53);group.add(toolGroup);
 const stickMat=new THREE.MeshLambertMaterial({color:'#94673f'});
 const toolMaterials=['#a77f53','#8e989c','#d2d9db','#f0c652','#56c2be'].map(color=>new THREE.MeshLambertMaterial({color}));
 const toolGeometry={
  pickaxe:{head:new THREE.BoxGeometry(.38,.10,.12),tip:new THREE.BoxGeometry(.09,.09,.12)},
  axe:{head:new THREE.BoxGeometry(.24,.22,.13),tip:new THREE.BoxGeometry(.07,.18,.13)},
  shovel:{head:new THREE.BoxGeometry(.17,.25,.12),tip:new THREE.BoxGeometry(.10,.05,.12)}
 };
 const shaft=cube(.072,.46,.09,stickMat);shaft.position.y=-.05;toolGroup.add(shaft);
 const head=new THREE.Mesh(toolGeometry.pickaxe.head,toolMaterials[0]);head.position.y=.17;toolGroup.add(head);
 const tip=new THREE.Mesh(toolGeometry.pickaxe.tip,toolMaterials[0]);tip.position.set(-.14,.11,0);toolGroup.add(tip);
 const ownerTextures=new Map(),ownerGeometry=new Map(),ownerBlockGeometry=new Map();
 let ownerHeldTransforms={};
 let ownerSkin=null,skinGeneration=0,itemGeneration=0;
 const spriteMaterial=new THREE.MeshBasicMaterial({transparent:true,alphaTest:.1,side:THREE.DoubleSide});
 const placeholderGeometry=new THREE.PlaneGeometry(1,1);
 const sprite=new THREE.Mesh(placeholderGeometry,spriteMaterial);sprite.scale.setScalar(.42);sprite.position.set(.49,-.32,-.81);sprite.rotation.set(.06,-.40,-.10);sprite.visible=false;group.add(sprite);
 async function setOwnerItems(icons){
  const generation=++itemGeneration;
  const loaded=await Promise.all(Object.entries(icons??{}).filter(([,uri])=>/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(uri)).map(async([id,uri])=>{
   const texture=await new THREE.TextureLoader().loadAsync(uri);texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.colorSpace=THREE.SRGBColorSpace;const c=document.createElement('canvas');c.width=texture.image.width;c.height=texture.image.height;
   const ctx=c.getContext('2d');ctx.drawImage(texture.image,0,0);
   const data=extrudeItemPixels(c.width,c.height,ctx.getImageData(0,0,c.width,c.height).data);
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(data.uvs,2));geometry.setIndex(data.indices);geometry.computeVertexNormals();
   return [Number(id),texture,geometry];
  }));
  if(generation!==itemGeneration){for(const [,texture,geometry] of loaded){texture.dispose();geometry.dispose();}return;}
  sprite.geometry=placeholderGeometry;
  for(const texture of ownerTextures.values())texture.dispose();for(const geometry of ownerGeometry.values())geometry.dispose();ownerTextures.clear();ownerGeometry.clear();
  for(const [id,texture,geometry] of loaded){ownerTextures.set(id,texture);ownerGeometry.set(id,geometry);}
  const previous=itemId;itemId=null;setItem(previous);
 }
 async function setOwnerSkin(uri){
  if(!/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(uri??''))return;
  const generation=++skinGeneration,texture=await new THREE.TextureLoader().loadAsync(uri);
  if(generation!==skinGeneration){texture.dispose();return;}
  if(texture.image.width!==64||![32,64].includes(texture.image.height)){texture.dispose();throw Error('Invalid player skin dimensions');}
  texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.colorSpace=THREE.SRGBColorSpace;
  ownerSkin?.dispose();ownerSkin=texture;
  // Skin UV top is the shoulder: point it toward the bottom of the view.
  arm.rotation.z=-.12;
  // The texture UVs face outward while the shoulder stays uppermost.
  if(arm.geometry.parameters.width!==.25||arm.geometry.parameters.height!==.75){arm.geometry.dispose();arm.geometry=new THREE.BoxGeometry(.25,.75,.25);}
  const uv=arm.geometry.attributes.uv;
  RIGHT_ARM_UV_RECTS.forEach((rect,face)=>skinRectUV(rect,64,texture.image.height).forEach(([u,v],i)=>uv.setXY(face*4+i,u,v)));uv.needsUpdate=true;
  skin.map=texture;skin.color.set('#ffffff');skin.needsUpdate=true;cuff.visible=false;
 }

 function setOwnerModels(heldTransforms={},blockModels={}){
  ownerHeldTransforms=heldTransforms&&typeof heldTransforms==='object'?heldTransforms:{};
  for(const geom of ownerBlockGeometry.values())geom.dispose();
  ownerBlockGeometry.clear();
  for(const [id,elements] of Object.entries(blockModels??{})){
   if(!Array.isArray(elements))continue;
   const quads=ownerBlockQuads112(elements);
   if(!quads.length)continue;
   const positions=[],uvs=[],normals=[],indices=[];
   for(const f of quads){
    const base=positions.length/3;
    f.v.forEach((v,i)=>{positions.push(...v);uvs.push(...f.uv[i]);normals.push(...f.d);});
    indices.push(base,base+1,base+2,base,base+2,base+3);
   }
   const geom=new THREE.BufferGeometry();
   geom.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
   geom.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
   geom.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
   geom.setIndex(indices);
   ownerBlockGeometry.set(Number(id),geom);
  }
  const old=itemId;itemId=null;setItem(old);
 }
 let itemId=null,age=0,swingRemaining=0;
 function nonCubeGeometry(id){
  if(nonCubeGeometries.has(id))return nonCubeGeometries.get(id);
  const world={getBlock:(x,y,z)=>({id:x===0&&y===0&&z===0?id:0,state:{}})};
  const quads=visibleBlockQuads(world,0,0,0),positions=[],uvs=[],normals=[],indices=[];
  for(const face of quads){
   const base=positions.length/3,uv=quadUV(id,face.d,face.v);
   face.v.forEach((v,i)=>{positions.push(...v.map(a=>a-.5));uvs.push(...uv[i]);normals.push(...face.d);});
   indices.push(base,base+1,base+2,base,base+2,base+3);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geo.setIndex(indices);nonCubeGeometries.set(id,geo);return geo;
 }
 function setItem(id){const view=heldItemView(id);if(itemId===view.id)return;itemId=view.id;
  const original=ownerTextures.get(view.id);sprite.visible=!!original&&(view.kind==='tool'||view.kind==='item');
  if(sprite.visible){sprite.geometry=ownerGeometry.get(view.id);spriteMaterial.map=original;spriteMaterial.needsUpdate=true;}
  toolGroup.visible=view.kind==='tool'&&!sprite.visible;
  held.visible=view.kind==='block'||(view.kind==='item'&&!sprite.visible);
  // Keep the upper arm near the shoulder and the hand below the held object.
  arm.rotation.z=view.kind==='empty' ? -.12 : -.19;
  cuff.rotation.z=arm.rotation.z;
  const native=ownerHeldTransforms[view.id]??null;
  if(sprite.visible){
   const pose=firstPersonPose112(native,{item:true});
   sprite.position.set(.49+pose.offset[0],-.32+pose.offset[1],-.81+pose.offset[2]);
   sprite.rotation.set(pose.rotation[0],pose.rotation[1],pose.rotation[2]);
   sprite.scale.set(...pose.scale);
  }
  if(toolGroup.visible){
   toolGroup.position.set(.50,-.37,-.82);
   toolGroup.rotation.set(.10,0,-.53);
  }
  if(held.visible){
   const shape=view.kind==='block'?definition(view.id)?.model:null;
   held.geometry=ownerBlockGeometry.get(view.id)??(shape&&shape!=='cube'?nonCubeGeometry(view.id):blockCubeGeometry);
   if(held.geometry===blockCubeGeometry)textureBoxUV(held,view.tiles);
   const pose=firstPersonPose112(native,{item:false});
   // Place an equipped block to the lower-right of the crosshair, not in front of it.
    held.position.set(.51+pose.offset[0],-.40+pose.offset[1],-.83+pose.offset[2]);
   held.rotation.set(...pose.rotation);
   // Native model JSON element vertices are 16/16 = 1 whole block, while
   // this first-person item's legacy cube geometry was only 0.28 wide.
   // Normalize the owner element geometry to the same held-object anchor.
   const geometryUnits=held.geometry===blockCubeGeometry?.28:1;
   held.scale.set(...pose.scale.map(value=>value/geometryUnits));
  }
  // Item-only view as requested; expose the skin arm when the slot is empty.
  arm.visible=view.kind==='empty';cuff.visible=view.kind==='empty'&&!ownerSkin;
  if(view.kind==='tool'){
   const family=toolFamily112(id)??'pickaxe',shape=toolGeometry[family];
   head.geometry=shape.head;tip.geometry=shape.tip;
   head.material=tip.material=toolMaterials[Math.max(0,toolMaterialTier112(id))];
   head.position.set(family==='axe' ? -.1 : 0,family==='shovel'?.16:.17,0);
   tip.position.set(family==='pickaxe'?-.14:family==='axe'?-.22:0,family==='shovel'?.31:.11,0);
   tip.visible=family!=='shovel';
   return;
  }
  if(held.visible&&view.kind==='item')held.scale.z*=.08;
 }
 setItem(0);
 function update(dt,moving=false,mining=false,bobbing=true){age+=dt;swingRemaining=Math.max(0,swingRemaining-dt);
  const bob=!bobbing?0:moving?Math.sin(age*10)*.025:Math.sin(age*2.5)*.006;
  group.position.y=bob+(mining?Math.sin(age*25)*.038:0);
  group.rotation.z=(bobbing?1:0)*Math.sin(age*(moving?9:2))*(moving?.025:.009);
  const swing=swingRemaining>0?Math.sin((1-swingRemaining/.27)*Math.PI):0;
  group.rotation.x=-swing*.45-(mining?.07:0);group.rotation.y=swing*.16;
 }
 function swing(){swingRemaining=.27;}
 function render(width,height){if(!width||!height)return;camera.aspect=width/height;camera.fov=firstPersonFov(camera.aspect);camera.updateProjectionMatrix();
  const old=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();renderer.render(scene,camera);renderer.autoClear=old;
 }
 return {setItem,setOwnerItems,setOwnerSkin,setOwnerModels,update,swing,render,dispose(){++itemGeneration;++skinGeneration;ownerSkin?.dispose();placeholderGeometry.dispose();for(const geometry of ownerGeometry.values())geometry.dispose();for(const geometry of nonCubeGeometries.values())geometry.dispose();for(const geometry of ownerBlockGeometry.values())geometry.dispose();spriteMaterial.dispose();for(const texture of ownerTextures.values())texture.dispose();for(const m of [arm,cuff])m.geometry.dispose();blockCubeGeometry.dispose();blockMaterial.dispose();stickMat.dispose();for(const mat of toolMaterials)mat.dispose();shaft.geometry.dispose();for(const type of Object.values(toolGeometry)){type.head.dispose();type.tip.dispose();}skin.dispose();sleeve.dispose();}};
}
