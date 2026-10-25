// Lightweight point-particle pool shared by block events and the /particle command.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const MAX_PARTICLES=650;
const TYPES={flame:[1,.58,.11],smoke:[.47,.47,.47],cloud:[.92,.94,.97],crit:[.62,.77,1],reddust:[.95,.15,.09],block:[.77,.68,.49]};
export function createParticles(scene){
 const pos=new Float32Array(MAX_PARTICLES*3),colors=new Float32Array(MAX_PARTICLES*3);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.setDrawRange(0,0);
 const points=new THREE.Points(geo,new THREE.PointsMaterial({size:.13,vertexColors:true,transparent:true,opacity:.92,depthWrite:false,sizeAttenuation:true}));points.frustumCulled=false;scene.add(points);
 const entities=[];let density=0;
 function emit(type,origin,spread=[.2,.2,.2],speed=.1,count=10){count=Math.ceil(count*(density===2?.1:density===1?.5:1));const color=TYPES[type]||TYPES.block;
  for(let i=0;i<Math.min(240,count);i++){
   if(entities.length>=MAX_PARTICLES)entities.shift();
   const p=origin.map((n,idx)=>n+(Math.random()*2-1)*(spread[idx]||0));
   const vel=[(Math.random()-.5)*speed,(Math.random()-.2)*speed,(Math.random()-.5)*speed];
   entities.push({p,vel,life:0.4+Math.random()*.7,age:0,type,color});
  }
 }
 function update(dt){let j=0;for(let i=entities.length-1;i>=0;i--){const e=entities[i];e.age+=dt;if(e.age>=e.life){entities.splice(i,1);continue}
   for(let axis=0;axis<3;axis++)e.p[axis]+=e.vel[axis]*dt*7;
   if(e.type==='block'||e.type==='crit')e.vel[1]-=dt*.75;
   else if(e.type==='flame'||e.type==='smoke')e.vel[1]+=dt*.08;
   e.vel[0]*=.985;e.vel[2]*=.985;
   for(let a=0;a<3;a++){pos[j*3+a]=e.p[a];colors[j*3+a]=e.color[a]*Math.max(.13,1-e.age/e.life)}j++;
  }
  geo.setDrawRange(0,j);geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;
 }
 return {setDensity:v=>density=v,emit,update,count:()=>entities.length};
}
