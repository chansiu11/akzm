// Procedural cloud/sky-weather visuals; uses no commercial art.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {lightingInfo} from './environment.js?v=1.3';
import {activeLampsNear} from './voxel-light.js';
import {fogDistances112} from './player-motion112.js';
import {precipitationType} from './precipitation.js';
import {celestialPositions,CELESTIAL_DISTANCE} from './sky-cycle.js';
export function createWorldVisuals(scene,renderer,world=null){
 const cloudRoot=new THREE.Group();scene.add(cloudRoot);
 const cloudMaterial=new THREE.MeshBasicMaterial({color:'#f4f4ed',transparent:true,opacity:.65,depthWrite:false,fog:false});
 const cloudGeo=new THREE.BoxGeometry(1,1,1);
 for(let i=0;i<25;i++){
  const mesh=new THREE.Mesh(cloudGeo,cloudMaterial);const angle=i*2.399963,rad=20+(i%7)*11;
  mesh.position.set(Math.cos(angle)*rad,175+i%3*4,Math.sin(angle)*rad);
  mesh.scale.set(9+i%4*4,.7,3+i%3*3);cloudRoot.add(mesh);
 }
 // Distant original procedurally generated night sky, not a game texture.
 const starPositions=new Float32Array(360*3);
 for(let i=0;i<360;i++){
  const a=(i*2.399963229728653)% (Math.PI*2),height=.08+((i*73)%257)/257*.87;
  const horizontal=Math.sqrt(Math.max(0,1-height*height));
  starPositions[i*3]=Math.cos(a)*CELESTIAL_DISTANCE*horizontal;
  starPositions[i*3+1]=CELESTIAL_DISTANCE*height;
  starPositions[i*3+2]=Math.sin(a)*CELESTIAL_DISTANCE*horizontal;
 }
 const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));
 const starMaterial=new THREE.PointsMaterial({color:'#e8efff',size:1.5,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false,fog:false});
 const stars=new THREE.Points(starGeometry,starMaterial);stars.frustumCulled=false;scene.add(stars);
 const sunMaterial=new THREE.MeshBasicMaterial({color:'#fff8cc',side:THREE.DoubleSide,depthWrite:false,fog:false});
 const moonMaterial=new THREE.MeshBasicMaterial({color:'#dce5f0',side:THREE.DoubleSide,depthWrite:false,fog:false});
 const celestialGeo=new THREE.PlaneGeometry(18,18);
 const sunDisc=new THREE.Mesh(celestialGeo,sunMaterial),moonDisc=new THREE.Mesh(celestialGeo,moonMaterial);
 scene.add(sunDisc,moonDisc);
 const rainGeo=new THREE.BufferGeometry();const count=280;const positions=new Float32Array(count*6);
 rainGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const colors=new Float32Array(count*6);rainGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
 const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.35,depthWrite:false}));rain.frustumCulled=false;scene.add(rain);
 const offsets=Array.from({length:count},(_,i)=>[(i*31.37%41)-20,(i*13.17%18),(i*71.61%41)-20]);
 // Fixed-size pool avoids growing the Three.js light/shader count as players build.
 const lampLights=Array.from({length:4},()=>{
  const light=new THREE.PointLight('#ffffff',0,18,2);
  light.visible=false;scene.add(light);return light;
 });
 let clock=0,lampUpdateTimer=0;
 function update(dt,ticks,weather,player,sun,ambient,renderRadius=6,{nightVision=false}={}){

  clock+=dt;const l=lightingInfo(ticks,weather,{nightVision});const sky=new THREE.Color().setRGB(...l.sky.map(v=>v/255));scene.background.copy(sky);if(scene.fog){scene.fog.color.copy(sky);const range=fogDistances112(renderRadius,weather);scene.fog.near=range.near;scene.fog.far=range.far}
  sun.intensity=l.sunIntensity;ambient.intensity=l.ambientIntensity;
  lampUpdateTimer+=dt;
  if(lampUpdateTimer>=.2 || lampUpdateTimer===dt){
   lampUpdateTimer=0;
   const nearby=world?activeLampsNear(world,Math.floor(player.x/16),Math.floor(player.z/16),20):[];
   nearby.sort((a,b)=>
    (a.x-player.x)**2+(a.y-player.y)**2+(a.z-player.z)**2-
    ((b.x-player.x)**2+(b.y-player.y)**2+(b.z-player.z)**2)
   );
   for(let i=0;i<lampLights.length;i++){
    const light=lampLights[i],source=nearby[i];
    light.visible=!!source;
    if(!source)continue;
    light.position.set(source.x,source.y,source.z);
    light.intensity=nightVision?.9:2.2;
   }
  }
  cloudRoot.position.set(player.x+clock*.35,player.y-118,player.z);
  stars.position.set(player.x,player.y,player.z);
  starMaterial.opacity=l.stars;
  stars.visible=l.stars>.01;
  const celestial=celestialPositions(ticks);
  sunDisc.position.set(player.x+celestial.sun[0],player.y+celestial.sun[1],player.z+celestial.sun[2]);
  moonDisc.position.set(player.x+celestial.moon[0],player.y+celestial.moon[1],player.z+celestial.moon[2]);
  sunDisc.lookAt(player.x,player.y,player.z);moonDisc.lookAt(player.x,player.y,player.z);
  sunDisc.visible=celestial.sun[1]>-.03*CELESTIAL_DISTANCE;
  moonDisc.visible=celestial.moon[1]>-.03*CELESTIAL_DISTANCE;
  cloudMaterial.color.set(weather==='clear'?'#f4f4ed':'#91979e');
  rain.visible=weather!=='clear';
  if(rain.visible){for(let i=0;i<count;i++){const [ox,oy,oz]=offsets[i],fall=((clock*12+i*1.71)%18);const y=player.y+15+oy-fall;
   const a=i*6,x=player.x+ox,z=player.z+oz;
   const precipitation=world?precipitationType(world,x,y-.8,z,weather):'rain';
   if(precipitation==='none'){
    // Move blocked precipitation safely out of view rather than writing NaN.
    positions[a]=positions[a+3]=x;positions[a+1]=positions[a+4]=-10000;positions[a+2]=positions[a+5]=z;
   }else{
    const snow=precipitation==='snow';
    positions[a]=x;positions[a+1]=y;positions[a+2]=z;
    positions[a+3]=x+(snow?.17:.12);positions[a+4]=y-(snow?.22:.8);positions[a+5]=z+.1;
    for(let p=a;p<a+6;p+=3){colors[p]=snow?1:.71;colors[p+1]=snow?1:.83;colors[p+2]=1;}
   }}
   rainGeo.attributes.position.needsUpdate=true;rainGeo.attributes.color.needsUpdate=true;
  }
 }
 return {update,dispose(){scene.remove(cloudRoot,stars,sunDisc,moonDisc,rain,...lampLights);cloudGeo.dispose();cloudMaterial.dispose();starGeometry.dispose();starMaterial.dispose();celestialGeo.dispose();sunMaterial.dispose();moonMaterial.dispose();rainGeo.dispose();rain.material.dispose()}};
}
