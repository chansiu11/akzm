// Small collectible item entities; physics deliberately simplified.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {normalizeDropRecords,dropExpired} from './drop-save.js';
export function createDrops(scene,world,onCollect,savedDrops=[]){
 const items=[];const geometry=new THREE.BoxGeometry(.23,.23,.23);const material=new THREE.MeshLambertMaterial({color:'#e9c67f'});
 function spawn(id,x,y,z,count=1,age=0,damage=null){if(!Number.isInteger(id)||id<=0||!Number.isInteger(count)||count<1||items.length>=128)return false;
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);scene.add(mesh);items.push({id,x,y,z,count,age,...(Number.isInteger(damage)?{damage}:{}) ,mesh});return true;}
 for(const d of normalizeDropRecords(savedDrops))spawn(d.id,d.x,d.y,d.z,d.count,d.age,d.damage);
 function update(dt,player){for(let i=items.length-1;i>=0;i--){const it=items[i];it.age+=dt;const below=world.get(Math.floor(it.x),Math.floor(it.y-.19),Math.floor(it.z));
  if(below===0||below===8)it.y=Math.max(0,it.y-dt*2);it.mesh.position.set(it.x,it.y+.07*Math.sin(it.age*4),it.z);it.mesh.rotation.y+=dt*1.5;
  const d=Math.hypot(player.x-it.x,player.y+1-it.y,player.z-it.z);if(dropExpired(it.age)){scene.remove(it.mesh);items.splice(i,1);continue;}
  if(it.age>.4&&d<1.5){const left=onCollect(it.id,it.count,it.damage);if(left<=0){scene.remove(it.mesh);items.splice(i,1)}else{it.count=left;}}

 }}
 return {spawn,update,count:()=>items.length,serialize:()=>normalizeDropRecords(items)};
}
