// Independent low-poly voxel hand and held-block view model. Three.js is loaded by the game.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {uvFor} from './atlas.js?v=1.6';
import {heldItemView,BOX_FACE_NORMALS} from './held-item-view.js';
const skin=new THREE.MeshLambertMaterial({color:'#d9ab86'});
const sleeve=new THREE.MeshLambertMaterial({color:'#477c92'});
function cube(w,h,d,material){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material)}
function textureBoxUV(mesh,tiles){const attr=mesh.geometry.attributes.uv;
 // BoxGeometry uses 4 vertices per face.
 for(let face=0;face<BOX_FACE_NORMALS.length;face++){const uv=uvFor(tiles[face]);for(let j=0;j<4;j++)attr.setXY(face*4+j,uv[j][0],uv[j][1]);}attr.needsUpdate=true;
}
export function createFirstPerson(renderer,atlasTexture){
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(70,1,.01,10);
 const group=new THREE.Group();scene.add(group);
 const lit=new THREE.AmbientLight('#ffffff',1.35);scene.add(lit);
 const sun=new THREE.DirectionalLight('#fff8e8',1.2);sun.position.set(-2,4,3);scene.add(sun);
 const arm=cube(.34,.56,.36,skin);arm.position.set(.45,-.50,-.85);arm.rotation.z=-.29;group.add(arm);
 const cuff=cube(.36,.40,.38,sleeve);cuff.position.set(.52,-.80,-.80);cuff.rotation.z=-.29;group.add(cuff);
 const blockMaterial=new THREE.MeshLambertMaterial({map:atlasTexture,transparent:true,alphaTest:.05});
 const held=cube(.28,.28,.28,blockMaterial);held.position.set(.45,-.32,-.85);held.rotation.set(.24,.65,.15);group.add(held);
 const toolGroup=new THREE.Group();toolGroup.position.set(.45,-.30,-.85);toolGroup.rotation.set(.08,0,-.45);group.add(toolGroup);
 const stickMat=new THREE.MeshLambertMaterial({color:'#94673f'});
 const toolMaterials={110:new THREE.MeshLambertMaterial({color:'#a77f53'}),111:new THREE.MeshLambertMaterial({color:'#8e989c'}),112:new THREE.MeshLambertMaterial({color:'#d2d9db'}),113:new THREE.MeshLambertMaterial({color:'#f0c652'}),114:new THREE.MeshLambertMaterial({color:'#56c2be'})};
 const shaft=cube(.072,.46,.09,stickMat);shaft.position.y=-.05;toolGroup.add(shaft);
 const head=cube(.38,.10,.12,toolMaterials[110]);head.position.y=.17;toolGroup.add(head);
 const tip=cube(.09,.09,.12,toolMaterials[110]);tip.position.set(-.14,.11,0);toolGroup.add(tip);
 let itemId=null,age=0,swingRemaining=0;
 function setItem(id){const view=heldItemView(id);if(itemId===view.id)return;itemId=view.id;
  toolGroup.visible=view.kind==='tool';held.visible=view.kind==='block'||view.kind==='item';
  arm.visible=cuff.visible=view.kind==='empty';
  if(view.kind==='tool'){head.material=tip.material=toolMaterials[id];return;}
  if(held.visible){textureBoxUV(held,view.tiles);held.scale.z=view.kind==='item'?.08:1;}
 }
 setItem(0);
 function update(dt,moving=false,mining=false){age+=dt;swingRemaining=Math.max(0,swingRemaining-dt);
  const bob=moving?Math.sin(age*10)*.025:Math.sin(age*2.5)*.006;
  group.position.y=bob+(mining?Math.sin(age*25)*.038:0);
  group.rotation.z=Math.sin(age*(moving?9:2))*(moving?.025:.009);
  const swing=swingRemaining>0?Math.sin((1-swingRemaining/.27)*Math.PI):0;
  group.rotation.x=-swing*.45-(mining?.07:0);group.rotation.y=swing*.16;
 }
 function swing(){swingRemaining=.27;}
 function render(width,height){if(!width||!height)return;camera.aspect=width/height;camera.updateProjectionMatrix();
  const old=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();renderer.render(scene,camera);renderer.autoClear=old;
 }
 return {setItem,update,swing,render,dispose(){for(const m of [arm,cuff,held])m.geometry.dispose();blockMaterial.dispose();stickMat.dispose();for(const mat of Object.values(toolMaterials))mat.dispose();for(const m of [shaft,head,tip])m.geometry.dispose();skin.dispose();sleeve.dispose();}};
}
