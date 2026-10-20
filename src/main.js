import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {BLOCK,BLOCK_NAMES,SOLID,World,MAX_Y,heightAt,SEA_LEVEL} from './terrain.js';
import {createAtlas,tileFor,uvFor} from './atlas.js';
import {restoreLocalAtlas} from './resource-pack.js';
import {loadAutomaticTextures} from './auto-resources.js';
import {lookDelta,joystickDelta} from './touch.js';
import {setupMenu,activeWorldId,worldSaveKey,loadSettings} from './menu.js';
import {setupCommandUI} from './command-ui.js';
import {createParticles} from './particles.js';

const el=id=>document.getElementById(id);
const canvas=el('viewport'); const renderer=new THREE.WebGLRenderer({canvas,antialias:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color('#83b3e1');scene.fog=new THREE.Fog('#83b3e1',32,68);
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.06,75);camera.rotation.order='YXZ';
const sunlight=new THREE.DirectionalLight('#fff6d8',1.4);scene.add(sunlight);const ambient=new THREE.HemisphereLight('#cfe9ff','#576644',1.2);scene.add(ambient);
const texture=new THREE.CanvasTexture(createAtlas());texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;
const solidMat=new THREE.MeshLambertMaterial({map:texture,side:THREE.FrontSide});const waterMat=new THREE.MeshLambertMaterial({map:texture,transparent:true,opacity:.67,depthWrite:false,side:THREE.DoubleSide});
const world=new World(readSave()?.world), saved=readSave();const inventory=saved?.inventory?.length===9?saved.inventory:[{id:1,count:32},{id:2,count:32},{id:3,count:32},{id:4,count:32},{id:5,count:16},{id:6,count:16},{id:7,count:32},{id:9,count:32},{id:12,count:32}];
let selected=Number.isInteger(saved?.selected)?Math.max(0,Math.min(8,saved.selected)):0;
const player={x:saved?.player?.x??3.5,y:saved?.player?.y??heightAt(3,3)+3,z:saved?.player?.z??3.5,vy:0,onGround:false,yaw:saved?.player?.yaw??0,pitch:saved?.player?.pitch??0};
let settings=loadSettings();let running=false,inventoryOpen=false,day=saved?.day??.21,daylightCycle=saved?.daylightCycle!==false,clickHold=false,damage=0,aimKey='',saveTimer=0,noticeTimer=0;
const keys=new Set(),meshes=new Map(),pending=[],queued=new Set();
const effects=createParticles(scene);
const touchMode=window.matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints>0;
if(touchMode)document.body.classList.add('touch-ui');
const mobileMove={forward:0,strafe:0};let mobileJump=false;let activeLook=null;const size=16;let renderRadius=settings.renderDistance;let lastChunk='';
const faces=[
 {d:[0,0,1],v:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]},
 {d:[0,0,-1],v:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]]},
 {d:[1,0,0],v:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]]},
 {d:[-1,0,0],v:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]},
 {d:[0,1,0],v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]]},
 {d:[0,-1,0],v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]}
];
function makeGeo(store){let pos=[],norm=[],uv=[],indexes=[];for(const f of store){let base=pos.length/3;const tex=uvFor(tileFor(f.id,f.d));for(let i=0;i<4;i++){const a=f.v[i];pos.push(f.x+a[0],f.y+a[1],f.z+a[2]);norm.push(...f.d);uv.push(...tex[i]);}indexes.push(base,base+1,base+2,base,base+2,base+3)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indexes);g.computeBoundingSphere();return g}
function chunkId(cx,cz){return `${cx},${cz}`}
function rebuild(cx,cz){const id=chunkId(cx,cz);if(meshes.has(id)){for(const m of meshes.get(id)){scene.remove(m);m.geometry.dispose();}}const solids=[],liquids=[];for(let x=cx*size;x<(cx+1)*size;x++)for(let z=cz*size;z<(cz+1)*size;z++)for(let y=0;y<=MAX_Y;y++){const bid=world.get(x,y,z);if(!bid)continue;for(const face of faces){const [dx,dy,dz]=face.d;const other=world.get(x+dx,y+dy,z+dz);if(bid===BLOCK.WATER ?(other===BLOCK.AIR):(other===BLOCK.AIR||other===BLOCK.WATER)){(bid===BLOCK.WATER?liquids:solids).push({x,y,z,id:bid,d:face.d,v:face.v})}}}
 const entries=[];for(const [list,mat] of [[solids,solidMat],[liquids,waterMat]])if(list.length){const mesh=new THREE.Mesh(makeGeo(list),mat);mesh.frustumCulled=true;scene.add(mesh);entries.push(mesh)}meshes.set(id,entries)}
function enqueue(cx,cz){let k=chunkId(cx,cz);if(!queued.has(k)){queued.add(k);pending.push([cx,cz])}}
function loadArea(){const cx=Math.floor(player.x/size),cz=Math.floor(player.z/size),base=chunkId(cx,cz);if(base===lastChunk)return;lastChunk=base;
 for(let r=0;r<=renderRadius;r++)for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;const x=cx+dx,z=cz+dz;if(!meshes.has(chunkId(x,z)))enqueue(x,z)}
 for(const [id,list] of [...meshes]){const [a,b]=id.split(',').map(Number);if(Math.abs(a-cx)>renderRadius+1||Math.abs(b-cz)>renderRadius+1){for(const m of list){scene.remove(m);m.geometry.dispose()}meshes.delete(id)}}}
function updateNearBlock(x,z){let cx=Math.floor(x/size),cz=Math.floor(z/size);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)if(meshes.has(chunkId(cx+dx,cz+dz)))enqueue(cx+dx,cz+dz)}
function collides(x,y,z){const r=.29,eps=.001;for(let bx=Math.floor(x-r);bx<=Math.floor(x+r);bx++)for(let by=Math.floor(y+eps);by<=Math.floor(y+1.8-eps);by++)for(let bz=Math.floor(z-r);bz<=Math.floor(z+r);bz++)if(SOLID(world.get(bx,by,bz)))return true;return false}
function moveAxis(axis,delta){if(!delta)return;const steps=Math.ceil(Math.abs(delta)/.09),d=delta/steps;for(let i=0;i<steps;i++){const nv=player[axis]+d;if(collides(axis==='x'?nv:player.x,axis==='y'?nv:player.y,axis==='z'?nv:player.z)){if(axis==='y'){if(d<0)player.onGround=true;player.vy=0}return}player[axis]=nv}}
function stepPhysics(dt){let front=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)+mobileMove.forward,strafe=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+mobileMove.strafe;let speed=keys.has('ShiftLeft')?2:keys.has('ControlLeft')?5.7:4.4;if(front||strafe){const l=Math.hypot(front,strafe);front/=l;strafe/=l;moveAxis('x',(-Math.sin(player.yaw)*front+Math.cos(player.yaw)*strafe)*dt*speed);moveAxis('z',(-Math.cos(player.yaw)*front-Math.sin(player.yaw)*strafe)*dt*speed)}
 const water=world.get(Math.floor(player.x),Math.floor(player.y+.7),Math.floor(player.z))===BLOCK.WATER;
 if((keys.has('Space')||mobileJump)&&(player.onGround||water)){player.vy=water?4:8.2;player.onGround=false}
 player.vy=Math.max(-24,player.vy-(water?6:22)*dt);player.onGround=false;moveAxis('y',player.vy*dt);
 if(player.y<-8){player.x=3.5;player.z=3.5;player.y=heightAt(3,3)+4;player.vy=0}
 camera.position.set(player.x,player.y+1.62,player.z);camera.rotation.set(player.pitch,player.yaw,0);}
const selectOutline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01,1.01,1.01)),new THREE.LineBasicMaterial({color:'#fff4c1',depthTest:false}));selectOutline.visible=false;scene.add(selectOutline);
const raycaster=new THREE.Raycaster();raycaster.far=5;const forward=new THREE.Vector3();let currentHit=null;
function look(){raycaster.setFromCamera({x:0,y:0},camera);const targets=[...meshes.values()].flat();const hits=raycaster.intersectObjects(targets,false);let h=hits.find(hit=>hit.object.material!==waterMat);currentHit=h||null;if(h){const n=h.face.normal,p=h.point;const x=Math.floor(p.x-n.x*.002),y=Math.floor(p.y-n.y*.002),z=Math.floor(p.z-n.z*.002);selectOutline.position.set(x+.5,y+.5,z+.5);selectOutline.visible=true;el('target').textContent=`${BLOCK_NAMES[world.get(x,y,z)]} · ${x} ${y} ${z}`;return {x,y,z,normal:n,id:world.get(x,y,z)}}selectOutline.visible=false;el('target').textContent='';return null}
function save(){try{localStorage.setItem(worldSaveKey(),JSON.stringify({world:world.serialize(),inventory,selected,player:{x:player.x,y:player.y,z:player.z,yaw:player.yaw,pitch:player.pitch},day,daylightCycle}));notify('월드 저장 완료')}catch{notify('저장할 수 없습니다: 브라우저 저장공간을 확인하세요')}}
function readSave(){try{return JSON.parse(localStorage.getItem(worldSaveKey())||'null')}catch{return null}}
function notify(s){el('gameNotice').textContent=s;noticeTimer=3}
function iconOffset(id){const tile=tileFor(id,[0,1,0]);return `background-position:${(tile%8*100/7).toFixed(3)}% ${Math.floor(tile/8)*100}%`;}
function showAtlas(canvas){texture.image=canvas;texture.needsUpdate=true;document.documentElement.style.setProperty('--block-atlas',`url("${canvas.toDataURL('image/png')}")`);}
function updateUI(){el('hotbar').innerHTML=inventory.map((item,i)=>`<button class="slot ${selected===i?'active':''}" data-i="${i}" title="${BLOCK_NAMES[item.id]}"><small>${i+1}</small><i class="tileIcon" style="${iconOffset(item.id)}"></i><span>${item.count}</span></button>`).join('');el('invItems').innerHTML=inventory.map((item,i)=>`<button class="item ${selected===i?'selected':''}" data-i="${i}"><i class="tileIcon" style="${iconOffset(item.id)}"></i>${BLOCK_NAMES[item.id]} · ${item.count}</button>`).join('');}
function breakBlock(t){if(!t||t.id===BLOCK.BEDROCK||t.id===BLOCK.WATER)return;if(world.set(t.x,t.y,t.z,0)){effects.emit('block',[t.x+.5,t.y+.5,t.z+.5],[.4,.4,.4],.3,18);updateNearBlock(t.x,t.z);let item=inventory.find(a=>a.id===t.id);if(item)item.count=Math.min(999,item.count+1);updateUI();saveTimer=7}}
function placeBlock(t){if(!t)return;const item=inventory[selected];if(!item||item.count<=0)return;const {x,y,z}=t, n=t.normal;const nx=x+n.x,ny=y+n.y,nz=z+n.z;if(world.get(nx,ny,nz)!==BLOCK.AIR&&world.get(nx,ny,nz)!==BLOCK.WATER)return;if(ny<=0||ny>MAX_Y)return;const prev=world.get(nx,ny,nz);world.set(nx,ny,nz,item.id);if(collides(player.x,player.y,player.z)){world.set(nx,ny,nz,prev);return}item.count--;effects.emit('block',[nx+.5,ny+.5,nz+.5],[.25,.25,.25],.08,6);updateNearBlock(nx,nz);updateUI();saveTimer=7}
function hardness(id){return ({1:.6,2:.55,3:1.6,4:.5,5:1.2,6:.25,7:.8,9:1.7,10:1.9,11:.15,12:1.7})[id]??1}
function openInventory(){inventoryOpen=true;running=false;clickHold=false;mobileMove.forward=0;mobileMove.strafe=0;mobileJump=false;document.exitPointerLock?.();el('inventory').classList.remove('hidden');updateUI()}
function closeInventory(){inventoryOpen=false;el('inventory').classList.add('hidden');menus.showPause()}
function requestPlay(){menus.close();el('inventory').classList.add('hidden');inventoryOpen=false;if(touchMode){running=true;return}{const lock=canvas.requestPointerLock?.();lock?.catch(()=>menus.showPause())}}
function pauseGame(){running=false;clickHold=false;mobileMove.forward=mobileMove.strafe=0;mobileJump=false;document.exitPointerLock?.();menus.showPause()}
// Initial command subset; commands never bypass the same World.set limits as normal placing.
const commandUI=setupCommandUI({
 onOpen:()=>{running=false;clickHold=false;keys.clear();mobileMove.forward=mobileMove.strafe=0;mobileJump=false;document.exitPointerLock?.()},
 onClose:()=>requestPlay(),
 onResult:result=>notify(result.message),
 context:()=>({
  position:()=>[player.x,player.y,player.z],
  teleport:(x,y,z)=>{player.x=x;player.y=y;player.z=z;player.vy=0;lastChunk='';return true},
  getTime:()=>((day%1+1)%1)*24000,
  setTime:t=>{day=((t%24000)+24000)%24000/24000;saveTimer=0},
  getDaylightCycle:()=>daylightCycle,
  setDaylightCycle:value=>{daylightCycle=value;saveTimer=0},
  setBlock:(x,y,z,id)=>{if(!world.set(x,y,z,id))return false;updateNearBlock(x,z);saveTimer=0;return true},
  fill:(from,to,id)=>{let count=0;const touched=new Set();for(let x=from[0];x<=to[0];x++)for(let y=from[1];y<=to[1];y++)for(let z=from[2];z<=to[2];z++){
   if(world.get(x,y,z)===id)continue;if(world.set(x,y,z,id)){count++;touched.add(chunkId(Math.floor(x/size),Math.floor(z/size)));}
  }
  for(const key of touched){const [cx,cz]=key.split(',').map(Number);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)if(meshes.has(chunkId(cx+dx,cz+dz)))enqueue(cx+dx,cz+dz)}
  saveTimer=0;return count},
  particle:(type,coords,spread,speed,count)=>effects.emit(type,coords,spread,speed,count)
 })
});
const onPointer=()=>{if(touchMode)return;running=document.pointerLockElement===canvas&&!inventoryOpen;if(!running&&!inventoryOpen&&!commandUI.isOpen()&&!el('overlay').classList.contains('show'))menus.showPause();clickHold=false;damage=0};document.addEventListener('pointerlockchange',onPointer);
document.addEventListener('mousemove',e=>{if(!running||touchMode)return;Object.assign(player,lookDelta(player.yaw,player.pitch,e.movementX,e.movementY,settings.sensitivity/100))});
// The mobile viewport only turns the camera. Movement/action overlays manage their own pointers.
canvas.addEventListener('pointerdown',e=>{if(!touchMode||e.pointerType==='mouse'||!running||activeLook)return;e.preventDefault();activeLook={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!running||!activeLook||activeLook.id!==e.pointerId)return;e.preventDefault();const dx=e.clientX-activeLook.x,dy=e.clientY-activeLook.y;activeLook.x=e.clientX;activeLook.y=e.clientY;Object.assign(player,lookDelta(player.yaw,player.pitch,dx,dy,settings.sensitivity/100*1.46))});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(activeLook?.id===e.pointerId)activeLook=null});
window.addEventListener('keydown',e=>{if(commandUI.isOpen())return;if(document.activeElement?.tagName==='INPUT')return;if(running&&(e.key==='/'||e.code==='Slash')){e.preventDefault();commandUI.show();return;}if(['Space','ArrowDown','ArrowUp'].includes(e.code))e.preventDefault();if(e.code==='KeyE'&&!e.repeat){if(inventoryOpen)closeInventory();else openInventory();return}if(e.code==='KeyP'){save();return}if(e.code==='Escape'&&inventoryOpen){closeInventory();return}if(e.code==='Escape'&&running&&touchMode){pauseGame();return}if(/Digit[1-9]/.test(e.code)){selected=Number(e.code.slice(-1))-1;updateUI()}keys.add(e.code)});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
canvas.addEventListener('mousedown',e=>{if(!running){requestPlay();return}if(e.button===0){clickHold=true;damage=0;aimKey=''}if(e.button===2)placeBlock(look())});window.addEventListener('mouseup',e=>{if(e.button===0){clickHold=false;damage=0}});canvas.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('wheel',e=>{selected=(selected+(e.deltaY>0?1:8))%9;updateUI();e.preventDefault()},{passive:false});
// Virtual joystick and independent touch actions. All pointer gestures are local-only.
const stick=el('joystick'),thumb=el('stickThumb');let stickPointer=null;
const resetStick=()=>{stickPointer=null;mobileMove.forward=mobileMove.strafe=0;thumb.style.transform='translate(-50%,-50%)'};
function trackStick(e){const r=stick.getBoundingClientRect();const d=joystickDelta(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2),46);mobileMove.forward=d.forward;mobileMove.strafe=d.strafe;thumb.style.transform=`translate(calc(-50% + ${d.thumbX}px),calc(-50% + ${d.thumbY}px))`}
stick.addEventListener('pointerdown',e=>{if(!running||stickPointer!==null)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture?.(e.pointerId);trackStick(e)});
stick.addEventListener('pointermove',e=>{if(stickPointer!==e.pointerId)return;e.preventDefault();trackStick(e)});
for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(stickPointer===e.pointerId)resetStick()});
function holdAction(id,onStart,onEnd){const b=el(id);let heldPointer=null;b.addEventListener('pointerdown',e=>{if(!running||heldPointer!==null)return;e.preventDefault();heldPointer=e.pointerId;b.setPointerCapture?.(e.pointerId);onStart()});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>{if(e.pointerId===heldPointer){heldPointer=null;onEnd?.()}})}
holdAction('touchBreak',()=>{clickHold=true;damage=0;aimKey=''},()=>{clickHold=false;damage=0});
holdAction('touchJump',()=>{mobileJump=true},()=>{mobileJump=false});
holdAction('touchPlace',()=>{placeBlock(look())},()=>{});
el('touchCommand').addEventListener('click',()=>{if(running)commandUI.show()});
el('touchBag').addEventListener('click',()=>{if(running)openInventory()});
el('touchPause').addEventListener('click',()=>{if(running)pauseGame()});
// Automatically use every supported existing tile from locally prepared resources.
// On a public GitHub Pages deployment the extracted original images are intentionally absent.
showAtlas(texture.image);
(async()=>{
 const status=el('packStatus');
 const auto=await loadAutomaticTextures();
 if(auto){showAtlas(auto.canvas);status.textContent=`로컬 원본 텍스처 자동 적용: ${auto.loaded}/${auto.total} 블록 슬롯 · ${auto.available}개 이미지 확인`;return;}
 const cached=await restoreLocalAtlas();
 if(cached){showAtlas(cached);status.textContent='이 브라우저에 이전에 저장된 텍스처 자동 적용';return;}
 status.textContent='기본 독립 제작 텍스처 사용 · 원본 파일은 공개 웹사이트에 포함되지 않음';
})();
const menus=setupMenu({play:requestPlay,save,applySettings:(next)=>{settings=next;renderRadius=settings.renderDistance;camera.fov=settings.fov;camera.updateProjectionMatrix();lastChunk='';el('status').style.display=settings.showCoordinates?'':'none';}});
el('closeInventory').addEventListener('click',closeInventory);
el('hotbar').addEventListener('click',e=>{const s=e.target.closest('[data-i]');if(s){selected=Number(s.dataset.i);updateUI()}});
el('invItems').addEventListener('click',e=>{const s=e.target.closest('[data-i]');if(s){selected=Number(s.dataset.i);updateUI()}});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-(loop.prev??now))/1000);loop.prev=now;
 if(running){stepPhysics(dt);if(daylightCycle)day=(day+dt/1200)%1;effects.update(dt);const angle=day*Math.PI*2,light=Math.max(.12,Math.sin(angle)*.9+.32);sunlight.position.set(Math.cos(angle)*40,Math.sin(angle)*60,25);sunlight.intensity=light*1.5;ambient.intensity=.35+light*.9;const sky=new THREE.Color('#101c32').lerp(new THREE.Color('#87bde3'),Math.min(1,light));scene.background.copy(sky);scene.fog.color.copy(sky);const t=look();if(clickHold&&t&&t.id&&t.id!==BLOCK.BEDROCK&&t.id!==BLOCK.WATER){const id=`${t.x},${t.y},${t.z}`;if(id!==aimKey){aimKey=id;damage=0}damage+=dt;el('target').textContent+=` · 파괴 ${Math.min(100,Math.floor(damage/hardness(t.id)*100))}%`;if(damage>=hardness(t.id)){breakBlock(t);damage=0}}else damage=0;
 saveTimer-=dt;if(saveTimer<=0){saveTimer=20;try{localStorage.setItem(worldSaveKey(),JSON.stringify({world:world.serialize(),inventory,selected,player:{x:player.x,y:player.y,z:player.z,yaw:player.y,pitch:player.pitch},day,daylightCycle}))}catch{}}
 }
 loadArea();if(pending.length){const [cx,cz]=pending.shift();queued.delete(chunkId(cx,cz));const pcx=Math.floor(player.x/size),pcz=Math.floor(player.z/size);if(Math.abs(cx-pcx)<=renderRadius&&Math.abs(cz-pcz)<=renderRadius)rebuild(cx,cz)}
 if(noticeTimer>0){noticeTimer-=dt;if(noticeTimer<=0)el('gameNotice').textContent=''}const dayLabel=Math.sin(day*Math.PI*2)>.0?'낮':'밤';el('status').textContent=`VOXEL FRONTIER · 0.4\n좌표 ${player.x.toFixed(1)} / ${player.y.toFixed(1)} / ${player.z.toFixed(1)}\n${dayLabel} · 청크 ${meshes.size} · 변경 블록 ${world.changes.size}`;
 renderer.render(scene,camera)}
updateUI();loadArea();requestAnimationFrame(loop);window.addEventListener('beforeunload',()=>{try{localStorage.setItem(worldSaveKey(),JSON.stringify({world:world.serialize(),inventory,selected,player:{x:player.x,y:player.y,z:player.z,yaw:player.y,pitch:player.pitch},day,daylightCycle}))}catch{}});
