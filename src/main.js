import {renderBlockItemIcons} from './block-item-icons.js';
import {installTitleLayout112} from './title-layout112.js';
import {PRIVATE_RESOURCE_VERSION,readPrivateResources,writePrivateResources,decodePrivateAtlas} from './private-resource-cache.js';
import {applyBitmapFont112} from './bitmap-font112.js';
import {applyMenu112,pngData} from './menu112-assets.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import {BLOCK,BLOCK_NAMES,SOLID,World,MAX_Y,heightAt,SEA_LEVEL} from './terrain.js';
import {createAtlas,tileFor,ATLAS_ROWS} from './atlas.js?v=1.7';
import {definition,blockBoxes,intersectsAABB,normalizeState} from './block-registry.js';
import {BLOCK_ITEMS,cleanInventory,itemDefinition,placeableItem} from './item-registry.js';
import {visibleBlockQuads,quadUV} from './block-mesh.js';
import {beginChunk,progressChunk} from './chunk-builder.js';
import {restoreLocalAtlas,loadLocalResourcePack,saveLocalAtlas} from './resource-pack.js?v=1.2';
import {loadAutomaticTextures} from './auto-resources.js';
import {lookDelta} from './touch.js';
import {playerCollides,findSafeSpawn,restoreSafePlayerPosition,obstructingBlockTarget} from './player-spawn.js';
import {setupMenu,activeWorldId,activeWorldSeed,activeWorldMode,activeWorldCheats,worldSaveKey,loadSettings} from './menu.js';
import {setupCommandUI} from './command-ui.js';
import {createParticles} from './particles.js';
import {WeatherCycle} from './environment.js';
import {createWorldVisuals} from './world-visuals.js';
import {createChunkLight} from './voxel-light.js';
import {waterQuadUV,waterTileRegion} from './water-visuals.js';
import {SKY_CAMERA_FAR} from './sky-cycle.js';
import {Survival} from './survival.js';
import {shouldAdvanceWorld} from './simulation-state.js';
import {expandInventory,giveItem,moveStack} from './inventory-utils.js';
import {restoreInventory,replenishOverflow} from './inventory-restore.js';
import {createEntityWorld} from './entity-renderer.js';
import {createDrops} from './drops.js';
import {createAudio} from './audio.js';
import {TileStore,processFurnace,depositOne,withdrawOne,tileDrops,tileKey} from './tile-data.js';
import {Progression,GOALS} from './progression.js';
import {blockDrops,mineSeconds} from './vanilla-mining.js';
import {recomputeNearbyLamps} from './redstone-lite.js';
import {usePickaxe} from './tool-durability.js';
import {eatHeld,foodFor} from './food.js';
import {dropInventoryOnDeath} from './death-drops.js';
import {giveDamagedItem} from './damaged-items.js';
import {changeBlockWithLifecycle} from './block-change.js';
import {createGravityTicks} from './block-gravity.js';
import {GRID_RECIPES,emptyCraftGrid,recipeAt,placeCraftIngredient,takeCraftIngredient,craftGridOnce,clearCraftGrid} from './crafting-grid.js';
import {CommandWorldState} from './command-worldstate.js';
import {createHud,mineProgress} from './hud-view.js';
import {startMenuPanorama} from './menu-panorama.js?v=1.1';
import {createFirstPerson} from './first-person.js?v=1.6';
import {installRecipeBook112} from './recipe-book112.js?v=1.1';
import {layoutContainer112} from './container112.js';
import {applyGui112Scale} from './gui112-layout.js';
import {readOwner112Jar,restoreGui112,applyGui112,storeGui112} from './gui112-assets.js?v=1.6';

const el=id=>document.getElementById(id);
const canvas=el('viewport');startMenuPanorama(el('menuPanorama'));const hud=createHud(el('survivalHud'));const renderer=new THREE.WebGLRenderer({canvas,antialias:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color('#83b3e1');scene.fog=new THREE.Fog('#83b3e1',32,68);
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.06,SKY_CAMERA_FAR);camera.rotation.order='YXZ';
const sunlight=new THREE.DirectionalLight('#fff6d8',1.4);scene.add(sunlight);const ambient=new THREE.HemisphereLight('#cfe9ff','#576644',1.2);scene.add(ambient);
const texture=new THREE.CanvasTexture(createAtlas());texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;
// Dedicated water atlas tile: UVs scroll without moving all other block textures.
function extractWaterImage(atlas){
 const rect=waterTileRegion(atlas),tile=document.createElement('canvas');tile.width=tile.height=Math.round(rect.width);
 const context=tile.getContext('2d');context.imageSmoothingEnabled=false;
 context.drawImage(atlas,rect.x,rect.y,rect.width,rect.height,0,0,tile.width,tile.height);
 return tile;
}
const waterTexture=new THREE.CanvasTexture(extractWaterImage(texture.image));
waterTexture.magFilter=THREE.NearestFilter;waterTexture.minFilter=THREE.NearestFilter;
waterTexture.wrapS=THREE.RepeatWrapping;waterTexture.wrapT=THREE.RepeatWrapping;
waterTexture.colorSpace=THREE.SRGBColorSpace;
const solidMat=new THREE.MeshLambertMaterial({map:texture,vertexColors:true,side:THREE.FrontSide});
const leafMat=new THREE.MeshLambertMaterial({map:texture,vertexColors:true,side:THREE.DoubleSide,alphaTest:.45});
const glassMat=new THREE.MeshLambertMaterial({map:texture,vertexColors:true,transparent:true,opacity:1,depthWrite:false,side:THREE.DoubleSide});
const waterMat=new THREE.MeshLambertMaterial({map:waterTexture,vertexColors:true,transparent:true,opacity:.67,depthWrite:false,side:THREE.DoubleSide});
const firstPerson=createFirstPerson(renderer,texture);const saved=readSave(),gameMode=activeWorldMode(),cheatsAllowed=activeWorldCheats(),world=new World(saved?.world,{seed:activeWorldSeed()});
const inventoryRestore=restoreInventory(Array.isArray(saved?.inventory)?saved.inventory:gameMode==='survival'?[]:cleanInventory(null),saved?.inventoryOverflow);
const inventory=inventoryRestore.slots,inventoryOverflow=inventoryRestore.overflow;
let selected=Number.isInteger(saved?.selected)?Math.max(0,Math.min(8,saved.selected)):0;
const commandState=new CommandWorldState(saved?.commandState);
const spawn=findSafeSpawn(world);
const restoredPosition=restoreSafePlayerPosition(world,saved?.player,spawn);
const player={x:restoredPosition.x,y:restoredPosition.y,z:restoredPosition.z,vy:0,onGround:false,yaw:saved?.player?.yaw??0,pitch:saved?.player?.pitch??0};
let settings=loadSettings();let running=false,enteredWorld=false,worldPaused=true,inventoryOpen=false,day=saved?.day??.21,daylightCycle=saved?.daylightCycle!==false,clickHold=false,damage=0,aimKey='',saveTimer=0,noticeTimer=0;
const keys=new Set(),meshes=new Map(),pending=[],queued=new Set();let activeBuild=null;
const effects=createParticles(scene);
const survival=new Survival(saved?.survival);
const weatherCycle=new WeatherCycle(saved?.weather);
const worldVisuals=createWorldVisuals(scene,renderer,world);
const audio=createAudio();
const progression=new Progression(saved?.progression);const tiles=new TileStore(saved?.tiles);let activeTile=null;
let craftingSize=2;let craftingCells=emptyCraftGrid(2);
const entityWorld=createEntityWorld(scene,world,(amount,e)=>{if(survival.damage(amount)>0){audio.beep('hit');notify(`${e.kind}에게 피해를 받았습니다 (-${amount})`)}if(survival.dead)showDeath()},saved?.entities);
const drops=createDrops(scene,world,(id,count,damage)=>{const left=Number.isInteger(damage)?giveDamagedItem(inventory,id,count,damage):giveItem(inventory,id,count);if(left<count){updateUI();saveTimer=0;audio.beep('craft')}return left},saved?.drops);
let fallDistance=0,voidDamageTime=0,usingFood=false,foodHold=0;
const touchMode=window.matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints>0;
if(touchMode)document.body.classList.add('touch-ui');
applyGui112Scale(document.documentElement,innerWidth,innerHeight,{touch:touchMode});
const mobileMove={forward:0,strafe:0};let mobileJump=false,mobileSneak=false;let activeLook=null;const size=16;let renderRadius=settings.renderDistance;let lastChunk='';
function makeGeo(store,lightForFace,isWater=false){const pos=[],norm=[],uv=[],colors=[],indexes=[];
 for(const f of store){const base=pos.length/3,rawUV=quadUV(f.id,f.d,f.v),tex=isWater?waterQuadUV(rawUV):rawUV,shade=lightForFace(f);
  for(let i=0;i<4;i++){const p=f.v[i];pos.push(f.x+p[0],f.y+p[1],f.z+p[2]);norm.push(...f.d);uv.push(...tex[i]);colors.push(...shade);}
  indexes.push(base,base+1,base+2,base,base+2,base+3);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indexes);g.computeBoundingSphere();return g;
}
function chunkId(cx,cz){return `${cx},${cz}`}
function commitChunk(task){
 const {cx,cz,layers}=task,id=chunkId(cx,cz);
 if(meshes.has(id))for(const m of meshes.get(id)){scene.remove(m);m.geometry.dispose();}
 const entries=[],lightForFace=createChunkLight(world,cx,cz);
 for(const [key,mat] of [['opaque',solidMat],['cutout',leafMat],['glass',glassMat],['water',waterMat]]){
  if(!layers[key].length)continue;const mesh=new THREE.Mesh(makeGeo(layers[key],lightForFace,key==='water'),mat);mesh.frustumCulled=true;scene.add(mesh);entries.push(mesh);
 }
 meshes.set(id,entries);
 if(task.dirty)enqueue(cx,cz);
}
function enqueue(cx,cz){
 if(activeBuild?.cx===cx&&activeBuild?.cz===cz){activeBuild.dirty=true;return;}
 const k=chunkId(cx,cz);
 if(!queued.has(k)){queued.add(k);pending.push([cx,cz])}
}
function loadArea(){const cx=Math.floor(player.x/size),cz=Math.floor(player.z/size),base=chunkId(cx,cz);if(base===lastChunk)return;lastChunk=base;
 for(let r=0;r<=renderRadius;r++)for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;const x=cx+dx,z=cz+dz;if(!meshes.has(chunkId(x,z)))enqueue(x,z)}
 for(const [id,list] of [...meshes]){const [a,b]=id.split(',').map(Number);if(Math.abs(a-cx)>renderRadius+1||Math.abs(b-cz)>renderRadius+1){for(const m of list){scene.remove(m);m.geometry.dispose()}meshes.delete(id)}}}
const gravityTicks=createGravityTicks(world,(x,y,z,toY)=>{updateNearBlock(x,z);saveTimer=0;});
function updateNearBlock(x,z){let cx=Math.floor(x/size),cz=Math.floor(z/size);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)if(meshes.has(chunkId(cx+dx,cz+dz)))enqueue(cx+dx,cz+dz)}
function collides(x,y,z){return playerCollides(world,x,y,z)}
function moveAxis(axis,delta){
 if(!delta)return;
 const steps=Math.ceil(Math.abs(delta)/.09),d=delta/steps;
 for(let i=0;i<steps;i++){
  const nv=player[axis]+d;
  const tx=axis==='x'?nv:player.x,ty=axis==='y'?nv:player.y,tz=axis==='z'?nv:player.z;
  if(collides(tx,ty,tz)){
   // A 0.6-block auto-step supports walking onto half slabs and stair steps.
   // Never pass through ceilings or full blocks; require a clear AABB at the raised position.
   if(axis!=='y' && player.onGround && !collides(tx,player.y+.6,tz)){
    player.y+=.6;player[axis]=nv;player.onGround=false;continue;
   }
   if(axis==='y'){if(d<0)player.onGround=true;player.vy=0}
   return;
  }
  player[axis]=nv;
 }
}
function stepPhysics(dt){const initialY=player.y,startX=player.x,startZ=player.z;let front=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)+mobileMove.forward,strafe=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+mobileMove.strafe;const sneaking=keys.has('ShiftLeft')||mobileSneak;const sprinting=keys.has('ControlLeft') && survival.hunger>6 && !sneaking;let speed=sneaking?2:sprinting?5.7:4.4;if(usingFood)speed*=.2;if(front||strafe){const l=Math.hypot(front,strafe);front/=l;strafe/=l;moveAxis('x',(-Math.sin(player.yaw)*front+Math.cos(player.yaw)*strafe)*dt*speed);moveAxis('z',(-Math.cos(player.yaw)*front-Math.sin(player.yaw)*strafe)*dt*speed)}
 const water=world.get(Math.floor(player.x),Math.floor(player.y+.7),Math.floor(player.z))===BLOCK.WATER;
 const headUnderwater=world.get(Math.floor(player.x),Math.floor(player.y+1.62),Math.floor(player.z))===BLOCK.WATER;
 if((keys.has('Space')||mobileJump)&&(player.onGround||water)){player.vy=water?4:8.2;player.onGround=false;survival.exert(sprinting?.8:.2)}
 player.vy=Math.max(-24,player.vy-(water?6:22)*dt);player.onGround=false;moveAxis('y',player.vy*dt);
 if(!player.onGround && player.y<initialY)fallDistance+=initialY-player.y;
 if(player.onGround){if(fallDistance>3){const amount=survival.fall(fallDistance);if(amount){audio.beep('hit');notify(`낙하 피해 -${amount}`)}}fallDistance=0;}
 survival.tick(dt,{underwater:headUnderwater,moving:!!(front||strafe),sprinting,travelDistance:Math.hypot(player.x-startX,player.z-startZ)});
 if(survival.dead)showDeath();
 if(player.y<-64){voidDamageTime+=dt;while(voidDamageTime>=.5&&!survival.dead){voidDamageTime-=.5;survival.damage(4);}}else voidDamageTime=0;
 if(survival.dead)showDeath();
 camera.position.set(player.x,player.y+1.62,player.z);camera.rotation.set(player.pitch,player.yaw,0);}
const selectOutline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01,1.01,1.01)),new THREE.LineBasicMaterial({color:'#141818',depthTest:true}));selectOutline.visible=false;scene.add(selectOutline);
const raycaster=new THREE.Raycaster();raycaster.far=5;const forward=new THREE.Vector3();let currentHit=null;
function look(){
 const facing=camera.getWorldDirection(forward);
 const blocked=obstructingBlockTarget(world,player,facing);
 if(blocked){
  currentHit=null;
  selectOutline.position.set(blocked.x+.5,blocked.y+.5,blocked.z+.5);
  selectOutline.visible=true;
  el('target').textContent=`${BLOCK_NAMES[blocked.id]} · 끼인 블록 · ${blocked.x} ${blocked.y} ${blocked.z}`;
  return blocked;
 }
 raycaster.setFromCamera({x:0,y:0},camera);
 const targets=[...meshes.values()].flat();
 const hits=raycaster.intersectObjects(targets,false);
 const h=hits.find(hit=>hit.object.material!==waterMat);currentHit=h||null;
 if(h){
  const n=h.face.normal,p=h.point;
  const x=Math.floor(p.x-n.x*.002),y=Math.floor(p.y-n.y*.002),z=Math.floor(p.z-n.z*.002);
  selectOutline.position.set(x+.5,y+.5,z+.5);selectOutline.visible=true;
  el('target').textContent=`${BLOCK_NAMES[world.get(x,y,z)]} · ${x} ${y} ${z}`;
  return {x,y,z,normal:n,id:world.get(x,y,z),hitY:p.y};
 }
 selectOutline.visible=false;el('target').textContent='';return null;
}
function snapshot(){return {world:world.serialize(),inventory,inventoryOverflow,selected,player:{x:player.x,y:player.y,z:player.z,yaw:player.yaw,pitch:player.pitch},day,daylightCycle,survival:survival.serialize(),weather:weatherCycle.serialize(),tiles:tiles.save(),progression:progression.serialize(),commandState:commandState.serialize(),entities:entityWorld.serialize(),drops:drops.serialize()};}
function save(){try{localStorage.setItem(worldSaveKey(),JSON.stringify(snapshot()));notify('월드 저장 완료')}catch{notify('저장할 수 없습니다: 브라우저 저장공간을 확인하세요')}}
function readSave(){try{return JSON.parse(localStorage.getItem(worldSaveKey())||'null')}catch{return null}}
function notify(s){el('gameNotice').textContent=s;noticeTimer=3}
function track(stat,amount=1){for(const g of progression.add(stat,amount))notify('목표 달성: '+g.label);}
let ownerItemIcons={},blockItemIcons={};
const itemIconURI=id=>ownerItemIcons[id]??blockItemIcons[id];
function iconClass(id){if(pngData(itemIconURI(id)))return ' owner-item-icon';return id>=110&&id<=114?' toolIcon tool-'+id:'';}
function iconOffset(id){if(pngData(itemIconURI(id)))return `background-image:url('${itemIconURI(id)}')!important;background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important`;const item=itemDefinition(id),tile=item?.iconTile??tileFor(id,[0,1,0]);
 return `background-position:${(tile%8*100/7).toFixed(3)}% ${(Math.floor(tile/8)*100/(ATLAS_ROWS-1)).toFixed(3)}%`;
}
function showAtlas(canvas){try{blockItemIcons=renderBlockItemIcons(canvas);}catch(error){console.warn('Block item icons:',error);}texture.image=canvas;texture.needsUpdate=true;waterTexture.image=extractWaterImage(canvas);waterTexture.needsUpdate=true;document.documentElement.style.setProperty('--block-atlas',`url("${canvas.toDataURL('image/png')}")`);updateUI();}
function updateUI(){
 replenishOverflow(inventory,inventoryOverflow);
 firstPerson.setItem(inventory[selected]?.count>0?inventory[selected].id:0);
 el('hotbar').innerHTML=inventory.slice(0,9).map((item,i)=>`<button class="slot ${selected===i?'active':''}" data-i="${i}" title="${itemDefinition(item.id)?.name??'Unknown'}"><small>${i+1}</small><i class="tileIcon${iconClass(item.id)}" style="${item.id&&item.count>0?iconOffset(item.id):'visibility:hidden'}"></i><span>${item.count>1?item.count:''}</span></button>`).join('');
 el('invItems').innerHTML=inventory.map((item,i)=>`<button class="item ${selected===i?'selected':''}" data-i="${i}" title="${itemDefinition(item.id)?.name??'Empty'}"><i class="tileIcon${iconClass(item.id)}" style="${item.id&&item.count>0?iconOffset(item.id):'visibility:hidden'}"></i><span>${item.id?(item.count>1?item.count:''):''}</span></button>`).join('');
 layoutContainer112(el('inventory'));
}
function slotArtwork(button,item){button.innerHTML=`<i class="tileIcon${iconClass(item.id)}" style="${item.id&&item.count>0?iconOffset(item.id):'visibility:hidden'}"></i><span>${item.count>1?item.count:''}</span>`;button.title=item.id?(itemDefinition(item.id)?.name??String(item.id)):'빈칸';}
function breakBlock(t){
 if(!t||definition(t.id)?.hardness<0||t.id===BLOCK.WATER||!definition(t.id))return;
 if(world.set(t.x,t.y,t.z,0)){
  const tile=tiles.items.get(tileKey(t.x,t.y,t.z));
  for(const item of tileDrops(tile))drops.spawn(item.id,t.x+.5,t.y+.6,t.z+.5,item.count,0,item.damage);
  tiles.remove(t.x,t.y,t.z);
  if(t.id===BLOCK.LEVER)recomputeNearbyLamps(world,t.x,t.y,t.z);
  updateNearBlock(t.x,t.z);gravityTicks.notifyChange(t.x,t.y,t.z);
  for(const drop of blockDrops(t.id,{toolId:inventory[selected]?.id??0})){
    drops.spawn(drop.id,t.x+.5,t.y+.6,t.z+.5,drop.count);
  }
  track('mined');if(t.id===BLOCK.LOG||t.id===BLOCK.SPRUCE_LOG)track('woodMined');survival.exert(.025);
  const wear=usePickaxe(inventory[selected]);if(wear.broken)notify('곡괭이가 부서졌습니다.');
  firstPerson.swing();effects.emit('block',[t.x+.5,t.y+.5,t.z+.5],[.35,.35,.35],.2,12);audio.beep('break');updateUI();saveTimer=7;
 }
}
function placementState(blockId,target){
 if(blockId===BLOCK.SLAB)return {half:target.normal.y===-1 || (target.normal.y===0&&target.hitY%1>.5)?'top':'bottom'};
 if(blockId===BLOCK.STAIRS){const yaw=((player.yaw%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
  return {facing:yaw<Math.PI/4||yaw>=Math.PI*7/4?'north':yaw<Math.PI*3/4?'west':yaw<Math.PI*5/4?'south':'east'};
 }
 return {};
}
function placeBlock(t){
 if(!t)return;const kind=definition(t.id)?.interact;if(kind){interactBlock(t,kind);return;}const item=inventory[selected];if(!item||item.count<=0)return;
 const blockId=placeableItem(item.id);if(blockId===null||blockId===BLOCK.BEDROCK||blockId===BLOCK.WATER)return;
 const {x,y,z}=t,n=t.normal;const nx=x+n.x,ny=y+n.y,nz=z+n.z;
 if(world.get(nx,ny,nz)!==BLOCK.AIR&&world.get(nx,ny,nz)!==BLOCK.WATER)return;
 if(ny<=0||ny>MAX_Y)return;
 const prev=world.getBlock(nx,ny,nz),state=placementState(blockId,t);
 if(!world.set(nx,ny,nz,blockId,state))return;
 if(collides(player.x,player.y,player.z)){world.set(nx,ny,nz,prev.id,prev.state);return}
 if(blockId===BLOCK.LEVER||blockId===BLOCK.LAMP)recomputeNearbyLamps(world,nx,ny,nz);
 track('placed');item.count--;if(item.count<=0){item.id=0;item.count=0}audio.beep('place');effects.emit('block',[nx+.5,ny+.5,nz+.5],[.25,.25,.25],.08,6);updateNearBlock(nx,nz);gravityTicks.notifyChange(nx,ny,nz);updateUI();saveTimer=7;
}
function hardness(id){const value=definition(id)?.hardness??1;return value<=0?999:value}
function useOrPlace(){
 const t=look();
 if(t&&definition(t.id)?.interact){placeBlock(t);return;}
 if(!startUseSelected())placeBlock(t);
}
function startUseSelected(){
 const food=foodFor(inventory[selected]?.id);
 if(!food)return false;
 if(survival.hunger<20&&!survival.dead){usingFood=true;foodHold=0;}
 return true; // Do not attempt to place edible items as blocks.
}
function cancelUsing(){usingFood=false;foodHold=0;}

function openInventory({table=false}={}){if(!enteredWorld)return;menus.close();el('inventory').dataset.container=activeTile?.kind??(table?'crafting':'inventory');mineProgress(el('miningIndicator'),0);cancelUsing();if(!table&&!activeTile)track('openedInventory');craftingSize=table?3:2;craftingCells=emptyCraftGrid(craftingSize);updateRecipes();el('progressionPanel').replaceChildren(...GOALS.map(g=>{const n=document.createElement('span');n.textContent=(progression.unlocked.has(g.id)?'✓ ':'□ ')+g.label+` (${Math.floor(progression.stats[g.stat])}/${g.goal})`;return n}));inventoryOpen=true;document.body.classList.add('inventory-open');running=false;clickHold=false;mobileMove.forward=0;mobileMove.strafe=0;mobileJump=false;activeLook=null;heldDirections.clear();document.exitPointerLock?.();el('inventory').classList.remove('hidden');updateUI();layoutContainer112(el('inventory'))}
function closeInventory(){document.body.classList.remove('inventory-open');recipeBook112.close();returnUncrafted();activeTile=null;el('tilePanel').classList.add('hidden');inventoryOpen=false;el('inventory').classList.add('hidden');if(!survival.dead)requestPlay()}
function requestPlay(){document.body.classList.remove('inventory-open');enteredWorld=true;worldPaused=false;menus.close();el('inventory').classList.add('hidden');inventoryOpen=false;if(touchMode){running=true;return}{const lock=canvas.requestPointerLock?.();lock?.catch(()=>menus.showPause())}}
function pauseGame(){mineProgress(el('miningIndicator'),0);worldPaused=true;running=false;usingFood=false;clickHold=false;mobileMove.forward=mobileMove.strafe=0;mobileJump=false;activeLook=null;heldDirections.clear();document.exitPointerLock?.();menus.showPause()}
// Initial command subset; commands never bypass the same World.set limits as normal placing.
const commandUI=setupCommandUI({
 onOpen:()=>{running=false;cancelUsing();clickHold=false;keys.clear();mobileMove.forward=mobileMove.strafe=0;mobileJump=false;document.exitPointerLock?.()},
 onClose:()=>{if(!survival.dead)requestPlay();},
 onResult:result=>notify(result.message),
 context:()=>({
  position:()=>[player.x,player.y,player.z],
  blockTarget:()=>{const b=look();return b?{x:b.x,y:b.y,z:b.z}:null;},
  maxY:()=>MAX_Y,
  getSeed:()=>world.seed,
  players:()=>['Player'],
  entities:()=>entityWorld.entities,
  objectives:()=>[...commandState.board.objectives.keys()],
  teams:()=>[...commandState.board.teams.keys()],
  scoreboard:()=>{saveTimer=0;return commandState.board;},
  getRule:name=>name==='doDaylightCycle'?daylightCycle:commandState.getRule(name),
  setRule:(name,value)=>{if(name==='doDaylightCycle')daylightCycle=value;commandState.setRule(name,value);saveTimer=0;},
  setDifficulty:value=>{survival.difficulty=value;saveTimer=0;},
  setWeather:(kind,seconds)=>{weatherCycle.set(kind,seconds);saveTimer=0;},
  getWeather:()=>weatherCycle.kind,
  giveItem:(id,count)=>{const left=giveItem(inventory,id,count);updateUI();saveTimer=0;return left;},
  clearItem:(id,limit)=>{let removed=0;for(const slot of inventory){if((id!==null&&slot.id!==id)||slot.id===0)continue;const n=Math.min(slot.count,limit-removed);if(n<=0)break;slot.count-=n;removed+=n;if(slot.count===0){slot.id=0;delete slot.damage;}}updateUI();saveTimer=0;return removed;},
  killSelf:()=>{survival.damage(survival.health);showDeath();},
  getBlock:(x,y,z)=>world.get(x,y,z),
  setWorldSpawn:coords=>{commandState.worldSpawn=coords;saveTimer=0;},
  setSpawnpoint:coords=>{commandState.personalSpawn=coords;saveTimer=0;},
  spawnEntity:(name,coords)=>{if(!['grazer','wanderer','shooter'].includes(name))throw Error('이 세계에 해당 바닐라 엔티티 모델·AI가 없습니다: '+name);entityWorld.add(name,...coords);saveTimer=0;},
  announce:message=>notify(message),
  teleport:(x,y,z)=>{player.x=x;player.y=y;player.z=z;player.vy=0;lastChunk='';return true},
  getTime:()=>((day%1+1)%1)*24000,
  setTime:t=>{day=((t%24000)+24000)%24000/24000;saveTimer=0},
  getDaylightCycle:()=>daylightCycle,
  setDaylightCycle:value=>{daylightCycle=value;saveTimer=0},
  setBlock:(x,y,z,id)=>{if(!changeBlockWithLifecycle(world,tiles,x,y,z,id))return false;gravityTicks.notifyChange(x,y,z);updateNearBlock(x,z);saveTimer=0;return true},
  fill:(from,to,id)=>{let count=0;const touched=new Set();for(let x=from[0];x<=to[0];x++)for(let y=from[1];y<=to[1];y++)for(let z=from[2];z<=to[2];z++){
   if(world.get(x,y,z)===id)continue;if(changeBlockWithLifecycle(world,tiles,x,y,z,id)){count++;touched.add(chunkId(Math.floor(x/size),Math.floor(z/size)));}
  }
  for(const key of touched){const [cx,cz]=key.split(',').map(Number);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)if(meshes.has(chunkId(cx+dx,cz+dz)))enqueue(cx+dx,cz+dz)}
  saveTimer=0;return count},
  particle:(type,coords,spread,speed,count)=>effects.emit(type,coords,spread,speed,count)
 })
});
let discardLockMovement=true;
const onPointer=()=>{discardLockMovement=true;if(touchMode)return;running=document.pointerLockElement===canvas&&!inventoryOpen;if(!running)cancelUsing();if(!survival.dead&&!running&&!inventoryOpen&&!commandUI.isOpen()&&!el('overlay').classList.contains('show'))menus.showPause();clickHold=false;damage=0};document.addEventListener('pointerlockchange',onPointer);
document.addEventListener('mousemove',e=>{if(!running||touchMode||document.pointerLockElement!==canvas)return;if(discardLockMovement){discardLockMovement=false;return;}Object.assign(player,lookDelta(player.yaw,player.pitch,e.movementX,e.movementY,settings.sensitivity/100))});
// Minecraft-style touch: drag to look, tap to use/place, hold a block to mine.
// Pointer-captured viewport gestures do not interfere with the independent D-pad.
function endTouchLook(e,cancelled=false){
 if(!activeLook||activeLook.id!==e.pointerId)return;
 const gesture=activeLook;activeLook=null;
 const wasMining=gesture.mining;
 if(wasMining){clickHold=false;damage=0;aimKey='';return;}
 if(!cancelled&&running&&!gesture.moved&&performance.now()-gesture.start<550){
  const victim=entityWorld.attackRay(camera.position,camera.getWorldDirection(new THREE.Vector3()));
  if(victim){firstPerson.swing();effects.emit('crit',[victim.x,victim.y+1.2,victim.z],[.3,.3,.3],.1,6);audio.beep('hit');track('entityHits');survival.exert(.3);}
  else useOrPlace();
 }
}
canvas.addEventListener('pointerdown',e=>{
 if(!touchMode||e.pointerType==='mouse'||!running||activeLook)return;
 e.preventDefault();activeLook={id:e.pointerId,x:e.clientX,y:e.clientY,start:performance.now(),distance:0,moved:false,mining:false};
 canvas.setPointerCapture?.(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 if(!running||!activeLook||activeLook.id!==e.pointerId)return;
 e.preventDefault();const g=activeLook,dx=e.clientX-g.x,dy=e.clientY-g.y;
 g.x=e.clientX;g.y=e.clientY;g.distance+=Math.hypot(dx,dy);
 if(g.distance>10){g.moved=true;if(g.mining){clickHold=false;damage=0;g.mining=false;}}
 if(g.moved)Object.assign(player,lookDelta(player.yaw,player.pitch,dx,dy,settings.sensitivity/100*1.46));
});
canvas.addEventListener('pointerup',e=>endTouchLook(e));
canvas.addEventListener('pointercancel',e=>endTouchLook(e,true));
canvas.addEventListener('lostpointercapture',e=>endTouchLook(e,true));
window.addEventListener('keydown',e=>{if(e.code==='F3'&&!e.repeat){e.preventDefault();document.body.classList.toggle('debug-overlay');return;}if(commandUI.isOpen())return;if(document.activeElement?.tagName==='INPUT'){if(e.code==='Escape'&&inventoryOpen){e.preventDefault();closeInventory();}return;}if(running&&cheatsAllowed&&(e.key==='/'||e.code==='Slash')){e.preventDefault();commandUI.show();return;}if(['Space','ArrowDown','ArrowUp'].includes(e.code))e.preventDefault();if(e.code==='KeyE'&&!e.repeat){if(inventoryOpen)closeInventory();else openInventory();return}if(e.code==='KeyP'){save();return}if(e.code==='Escape'&&inventoryOpen){closeInventory();return}if(e.code==='Escape'&&running&&touchMode){pauseGame();return}if(/Digit[1-9]/.test(e.code)){selected=Number(e.code.slice(-1))-1;updateUI()}keys.add(e.code)});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
canvas.addEventListener('mousedown',e=>{if(!running){requestPlay();return}if(e.button===0){firstPerson.swing();const victim=entityWorld.attackRay(camera.position,camera.getWorldDirection(new THREE.Vector3()));if(victim){firstPerson.swing();effects.emit('crit',[victim.x,victim.y+1.3,victim.z],[.35,.35,.35],.1,9);audio.beep('hit');track('entityHits');survival.exert(.3);}clickHold=true;damage=0;aimKey=''}if(e.button===2)useOrPlace()});window.addEventListener('mouseup',e=>{if(e.button===0){clickHold=false;damage=0}if(e.button===2)cancelUsing()});canvas.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('wheel',e=>{if(!running)return;selected=(selected+(e.deltaY>0?1:8))%9;updateUI();e.preventDefault()},{passive:false});
// Direction pad and classic touch action buttons. All iconography is original CSS/text.
const heldDirections=new Set();
function syncDpad(){
 mobileMove.forward=(heldDirections.has('up')?1:0)-(heldDirections.has('down')?1:0);
 mobileMove.strafe=(heldDirections.has('right')?1:0)-(heldDirections.has('left')?1:0);
}
function holdAction(id,onStart,onEnd){
 const b=el(id);let heldPointer=null;
 b.addEventListener('pointerdown',e=>{if(!running||heldPointer!==null)return;e.preventDefault();heldPointer=e.pointerId;b.setPointerCapture?.(e.pointerId);onStart();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>{
  if(e.pointerId===heldPointer){heldPointer=null;onEnd?.();}
 });
}
for(const [direction,id] of [['up','touchUp'],['down','touchDown'],['left','touchLeft'],['right','touchRight']]){
 holdAction(id,()=>{heldDirections.add(direction);syncDpad()},()=>{heldDirections.delete(direction);syncDpad()});
}
holdAction('touchJump',()=>{mobileJump=true},()=>{mobileJump=false});
el('touchSneak').addEventListener('click',()=>{
 if(!running)return;mobileSneak=!mobileSneak;
 el('touchSneak').classList.toggle('pressed',mobileSneak);
 el('touchSneak').setAttribute('aria-pressed',String(mobileSneak));
});
el('touchCommand').classList.toggle('hidden',!cheatsAllowed);
el('touchCommand').addEventListener('click',()=>{if(running&&cheatsAllowed)commandUI.show()});
el('touchBag').addEventListener('click',()=>{if(running)openInventory()});
el('touchPause').addEventListener('click',()=>{if(running)pauseGame()});
// Automatically use every supported existing tile from locally prepared resources.
// On a public GitHub Pages deployment the extracted original images are intentionally absent.
showAtlas(texture.image);
const storedGui112=restoreGui112(document.documentElement);
function applyOwnerAppearance(assets){firstPerson.setOwnerSkin(assets?.playerSkin).catch(error=>console.warn('Owner player skin:',error));applyBitmapFont112(assets).catch(error=>console.warn('Bitmap font:',error));ownerItemIcons=assets?.itemIcons??{};firstPerson.setOwnerItems(ownerItemIcons).catch(error=>console.warn('Owner item models:',error));applyMenu112(assets).catch(error=>console.warn('Menu assets:',error));updateUI();}
if(storedGui112)applyOwnerAppearance(storedGui112);
async function importOwnerJar(jar){
 const {assets,JSZip}=await readOwner112Jar(jar);
 window.JSZip=JSZip;
 const atlas=await loadLocalResourcePack(jar);
 if(!applyGui112(document.documentElement,assets))throw Error('원본 HUD 이미지 적용 실패');
 applyOwnerAppearance(assets);showAtlas(atlas.canvas);
 const saved=await writePrivateResources({version:PRIVATE_RESOURCE_VERSION,jar,assets,atlas:atlas.canvas.toDataURL('image/png')});
 if(!saved){storeGui112(assets);saveLocalAtlas(atlas.canvas);}
 return saved;
}
el('loadJar112').addEventListener('click',()=>el('jar112Input').click());
el('jar112Input').addEventListener('change',async event=>{
 const jar=event.target.files?.[0];if(!jar)return;
 const button=el('loadJar112'),status=el('packStatus');button.disabled=true;status.textContent='1.12.2.jar 검증 중…';
 try{
  const saved=await importOwnerJar(jar);
  status.textContent='원본 메뉴·글꼴·UI·블록 이미지 적용'+(saved?' · 다음 접속부터 자동 불러오기':' · 자동 저장 실패: 다음 접속 시 다시 선택하세요');
 }catch(error){status.textContent='JAR 불러오기 실패: '+(error?.message??String(error));}
 finally{button.disabled=false;event.target.value='';}
});
(async()=>{
 const status=el('packStatus'),button=el('loadJar112');button.disabled=true;
 status.textContent='저장된 원본 리소스 자동 불러오는 중…';
 try{
  const cached=await readPrivateResources();
  if(cached){
   try{
    if(cached.version===PRIVATE_RESOURCE_VERSION){
     const canvas=await decodePrivateAtlas(cached.atlas);
     if(!applyGui112(document.documentElement,cached.assets))throw Error('Invalid cached UI');
     applyOwnerAppearance(cached.assets);showAtlas(canvas);
    }else if(cached.jar){await importOwnerJar(cached.jar);}
    else throw Error('Missing cached JAR');
    status.textContent='저장된 원본 메뉴·글꼴·UI·블록 자동 불러오기 완료';return;
   }catch(error){console.warn('Private resource restore:',error);}
  }
  const auto=await loadAutomaticTextures();
  if(auto){showAtlas(auto.canvas);status.textContent=`로컬 블록 텍스처 적용: ${auto.loaded}/${auto.total}`;return;}
  const legacy=await restoreLocalAtlas();
  if(legacy)showAtlas(legacy);
  status.textContent=storedGui112||legacy?'이전 이미지 복원 · JAR을 한 번 다시 선택하면 이후 업데이트도 자동 적용됩니다.':'1.12.2.jar를 처음 한 번 선택하세요. 이후 이 브라우저에서 자동으로 불러옵니다.';
 }catch(error){status.textContent='자동 불러오기 실패 · JAR을 직접 선택해 주세요.';}
 finally{button.disabled=false;}
})();
const menus=setupMenu({play:requestPlay,save,onTitle:()=>{worldPaused=true;enteredWorld=false;running=false;},applySettings:(next)=>{settings=next;renderRadius=settings.renderDistance;camera.fov=settings.fov;camera.updateProjectionMatrix();lastChunk='';if(!settings.showCoordinates)document.body.classList.remove('debug-overlay');}});
installTitleLayout112();
document.documentElement.dataset.appReady='true';
const palette=el('blockCatalog');
if(gameMode==='survival'){palette.classList.add('hidden');document.querySelector('.catalog-title')?.classList.add('hidden');document.querySelector('.catalog-title')?.nextElementSibling?.classList.add('hidden');}
const recipePane=el('craftRecipes');
const recipeBook112=installRecipeBook112(el('inventory'),GRID_RECIPES,()=>craftingSize);
recipeBook112.setNames([...new Set(GRID_RECIPES.flatMap(r=>Object.values(r.keys)))].map(id=>[id,itemDefinition(id)?.name??String(id)]));
function renderTile(){renderTileContents();layoutContainer112(el('inventory'));}
function renderTileContents(){const panel=el('tilePanel'),items=el('tileContents');items.replaceChildren();if(!activeTile){panel.classList.add('hidden');return;}panel.classList.remove('hidden');const {x,y,z,kind}=activeTile;const t=tiles.ensure(x,y,z,kind);el('tileTitle').textContent=kind==='chest'?'상자 (입금: 클릭 / 회수: Shift+클릭)':'화로 (선택 슬롯의 광석·연료 넣기)';
 if(kind==='chest'){t.slots.forEach((slot,i)=>{const b=document.createElement('button');b.textContent=slot.id?(itemDefinition(slot.id)?.name||slot.id)+' '+slot.count:'빈칸';b.addEventListener('click',e=>{const ok=e.shiftKey?withdrawOne(t.slots,i,inventory):depositOne(t.slots,i,inventory,selected);if(ok){updateUI();renderTile();saveTimer=0}});slotArtwork(b,slot);items.append(b)});}
 if(kind==='furnace'){for(const key of ['input','fuel','output']){const b=document.createElement('button');const slot=t[key];b.textContent=`${key}: ${slot.id?(itemDefinition(slot.id)?.name||slot.id)+' '+slot.count:'비어 있음'}`;b.addEventListener('click',()=>{let ok=false;if(key==='output'){ok=withdrawOne({output:t.output},'output',inventory)}else{const item=inventory[selected];if(item?.count>0&&(key==='input'?[18,19,4].includes(item.id):item.id===100)){ok=depositOne(t,key,inventory,selected)}}if(ok){renderTile();updateUI();saveTimer=0}});b.dataset.furnaceSlot=key;slotArtwork(b,slot);items.append(b)}const p=document.createElement('span');p.textContent='제련: '+Math.floor(t.progress*10)+'% / 연료 '+Math.ceil(t.burn)+'초';p.className='furnace-status';items.append(p);const arrow=document.createElement('i');arrow.className='furnace-progress';arrow.style.setProperty('--progress',Math.floor(Math.min(1,t.progress/10)*24));items.append(arrow);const flame=document.createElement('i');flame.className='furnace-flame';flame.style.setProperty('--burn',Math.ceil(Math.min(1,t.burn/80)*13));items.append(flame);}
}
function interactBlock(t,kind){if(kind==='lever'){const state=world.getState(t.x,t.y,t.z);const enabled=!state.powered;world.set(t.x,t.y,t.z,BLOCK.LEVER,{powered:enabled});updateNearBlock(t.x,t.z);recomputeNearbyLamps(world,t.x,t.y,t.z);notify('레버: '+(enabled?'켜짐':'꺼짐'));saveTimer=0;return;}
 if(kind==='crafting'){openInventory({table:true});notify('3×3 제작대 · 재료를 직접 배치하세요');return;}
 if(kind==='chest'||kind==='furnace'){activeTile={x:t.x,y:t.y,z:t.z,kind};openInventory();renderTile();layoutContainer112(el('inventory'));return;}
}
function returnUncrafted(){
 clearCraftGrid(craftingCells,inventory);
 for(const cell of craftingCells){if(cell.id&&cell.count){drops.spawn(cell.id,player.x,player.y+1,player.z,cell.count);cell.id=0;cell.count=0;}}
 updateUI();
}
function updateRecipes(){
 recipeBook112.refresh();
 recipePane.replaceChildren(...GRID_RECIPES.map(recipe=>{const el=document.createElement('span');el.textContent=`${recipe.name}: ${recipe.requiresTable?'3×3 제작대':'2×2 가능'} · ×${recipe.output.count}`;return el;}));
 renderCrafting();
}
function renderCrafting(){
 const cells=el('craftGrid'),output=el('craftOutput');cells.replaceChildren();
 cells.style.setProperty('--grid-side',craftingSize);
 el('craftTitle').textContent=`제작 · ${craftingSize}×${craftingSize}`;
 craftingCells.forEach((item,index)=>{
  const button=document.createElement('button');button.type='button';button.title=`${index+1}번 제작 칸, 재료 선택 후 클릭 또는 Shift+클릭으로 반환`;
  slotArtwork(button,item);
  button.addEventListener('click',event=>{
   const success=event.shiftKey?takeCraftIngredient(craftingCells,index,inventory):placeCraftIngredient(craftingCells,index,inventory,selected);
   if(success){updateUI();renderCrafting();saveTimer=0;}
  });cells.append(button);
 });
 const match=recipeAt(craftingCells,craftingSize);
 output.disabled=!match;slotArtwork(output,match?.recipe.output??{id:0,count:0});layoutContainer112(el('inventory'));
}
el('craftOutput').addEventListener('click',()=>{const product=craftGridOnce(craftingCells,craftingSize,inventory);
 if(product){audio.beep('craft');track('crafted');if(product.id===BLOCK.CRAFTING_TABLE)track('craftedTable');if(product.id>=110&&product.id<=114)track('craftedPickaxe');updateUI();renderCrafting();notify(`아이템 ×${product.count} 제작 완료`);saveTimer=0;}
});
el('weatherToggle').addEventListener('click',()=>{weatherCycle.set(weatherCycle.kind==='clear'?'rain':weatherCycle.kind==='rain'?'thunder':'clear');el('weatherToggle').textContent='날씨 미리보기: '+weatherCycle.kind;notify('날씨: '+weatherCycle.kind)});
el('respawnButton').addEventListener('click',()=>{survival.respawn();const requestedSpawn=commandState.personalSpawn||commandState.worldSpawn||[spawn.x,spawn.y,spawn.z];const safeRespawn=restoreSafePlayerPosition(world,{x:requestedSpawn[0],y:requestedSpawn[1],z:requestedSpawn[2]},spawn);player.x=safeRespawn.x;player.y=safeRespawn.y;player.z=safeRespawn.z;player.vy=0;fallDistance=0;voidDamageTime=0;el('deathScreen').classList.add('hidden');requestPlay();saveTimer=0});
function showDeath(){if(!survival.dead||!el('deathScreen').classList.contains('hidden'))return;
 cancelUsing();running=false;document.exitPointerLock?.();
 if(gameMode==='survival'&&!commandState.rules.keepInventory){for(const item of dropInventoryOnDeath(inventory,inventoryOverflow)){
   if(!drops.spawn(item.id,player.x,Math.max(1,player.y)+1,player.z,item.count,0,item.damage))inventoryOverflow.push(item);
  }updateUI();}
 el('deathScreen').classList.remove('hidden');worldPaused=true;saveTimer=0;}

for(const def of BLOCK_ITEMS.filter(item=>item.blockId!==BLOCK.BEDROCK&&item.blockId!==BLOCK.WATER)){
 const button=document.createElement('button');button.type='button';button.className='catalog-item';
 button.title=def.key;button.dataset.blockId=String(def.id);
 const icon=document.createElement('i');icon.className='tileIcon';icon.style.cssText=iconOffset(def.id);
 const label=document.createElement('span');label.textContent=def.name;button.append(icon,label);palette.append(button);
}
palette.addEventListener('click',e=>{if(gameMode==='survival')return;const button=e.target.closest('[data-block-id]');if(!button)return;
 const id=Number(button.dataset.blockId);if(!itemDefinition(id))return;
 inventory[selected]={id,count:32};updateUI();saveTimer=0;notify(`${itemDefinition(id).name}을(를) ${selected+1}번 슬롯에 넣었습니다.`);
});
el('closeInventory').addEventListener('click',closeInventory);
el('hotbar').addEventListener('click',e=>{const s=e.target.closest('[data-i]');if(s){selected=Number(s.dataset.i);updateUI()}});
el('invItems').addEventListener('click',e=>{const slot=e.target.closest('[data-i]');if(!slot)return;const i=Number(slot.dataset.i);if(i>=9){moveStack(inventory,i,selected);saveTimer=0;}else selected=i;updateUI();updateRecipes();});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);applyGui112Scale(document.documentElement,innerWidth,innerHeight,{touch:touchMode});});
function loop(now){requestAnimationFrame(loop);
 if(touchMode&&running&&activeLook&&!activeLook.moved&&!activeLook.mining&&now-activeLook.start>=420){activeLook.mining=true;clickHold=true;damage=0;aimKey='';}const dt=Math.min(.05,(now-(loop.prev??now))/1000);loop.prev=now;
 if(shouldAdvanceWorld({enteredWorld,paused:worldPaused,dead:survival.dead})){
  for(const t of tiles.items.values())if(t.kind==='furnace')processFurnace(t,dt);gravityTicks.tick(dt);
  if(running){const lastX=player.x,lastZ=player.z;stepPhysics(dt);track('walked',Math.hypot(player.x-lastX,player.z-lastZ));
   if(usingFood){foodHold+=dt;const food=foodFor(inventory[selected]?.id);if(!food||survival.dead)cancelUsing();else if(foodHold>=food.seconds){if(eatHeld(inventory,selected,survival)){audio.beep('craft');updateUI();notify('음식을 먹었습니다.');saveTimer=0;}cancelUsing();}}
  }
  else survival.tick(dt,{underwater:world.get(Math.floor(player.x),Math.floor(player.y+1.62),Math.floor(player.z))===BLOCK.WATER});
  weatherCycle.update(dt);entityWorld.update(dt,player);drops.update(dt,player);if(activeTile?.kind==='furnace' && inventoryOpen && Math.floor(now/250)!==Math.floor((now-dt*1000)/250))renderTile();
  if(daylightCycle)day=(day+dt/1200)%1;effects.update(dt);const angle=day*Math.PI*2,light=Math.max(.12,Math.sin(angle)*.9+.32);sunlight.position.set(Math.cos(angle)*40,Math.sin(angle)*60,25);sunlight.intensity=light*1.5;ambient.intensity=.35+light*.9;worldVisuals.update(dt,day*24000,weatherCycle.kind,player,sunlight,ambient);waterTexture.offset.y=(waterTexture.offset.y-dt*.032+1)%1;const t=running?look():null;if(clickHold&&t&&t.id&&definition(t.id)?.hardness>=0&&t.id!==BLOCK.WATER){const id=`${t.x},${t.y},${t.z}`;if(id!==aimKey){aimKey=id;damage=0}damage+=dt;const ratio=Math.min(1,damage/mineSeconds(t.id,inventory[selected]?.id??0));mineProgress(el('miningIndicator'),ratio,BLOCK_NAMES[t.id]??'블록');el('miningIndicator').setAttribute('aria-valuenow',String(Math.round(ratio*100)));if(damage>=mineSeconds(t.id,inventory[selected]?.id??0)){breakBlock(t);damage=0}}else{damage=0;mineProgress(el('miningIndicator'),0);}
 saveTimer-=dt;if(saveTimer<=0){saveTimer=20;try{localStorage.setItem(worldSaveKey(),JSON.stringify(snapshot()))}catch{}}
 }
 loadArea();if(!activeBuild && pending.length){
  const [cx,cz]=pending.shift();queued.delete(chunkId(cx,cz));
  const pcx=Math.floor(player.x/size),pcz=Math.floor(player.z/size);
  if(Math.abs(cx-pcx)<=renderRadius&&Math.abs(cz-pcz)<=renderRadius)activeBuild=beginChunk(world,cx,cz);
 }
 if(activeBuild){
  // CPU mesh generation is spread over multiple animation frames.
  if(progressChunk(activeBuild,4)){const finished=activeBuild;activeBuild=null;commitChunk(finished);}
 }
 if(noticeTimer>0){noticeTimer-=dt;if(noticeTimer<=0)el('gameNotice').textContent=''}hud.update(survival.health,survival.hunger,survival.air);firstPerson.update(dt,running&&(keys.has('KeyW')||keys.has('KeyA')||keys.has('KeyS')||keys.has('KeyD')||mobileMove.forward!==0||mobileMove.strafe!==0),clickHold);const dayLabel=Math.sin(day*Math.PI*2)>.0?'낮':'밤';el('status').textContent=`Minecraft 1.12.2 · 웹 재현\n좌표 ${player.x.toFixed(1)} / ${player.y.toFixed(1)} / ${player.z.toFixed(1)}\n${dayLabel} · 청크 ${meshes.size} · 바이옴 ${world.biome(Math.floor(player.x),Math.floor(player.z))} · 시드 ${world.seed} · 변경 블록 ${world.changes.size}`;
 renderer.render(scene,camera);if(enteredWorld&&!document.body.classList.contains('menu-open')&&!survival.dead&&!inventoryOpen&&!commandUI.isOpen())firstPerson.render(innerWidth,innerHeight)}
updateUI();loadArea();requestAnimationFrame(loop);window.addEventListener('beforeunload',()=>{try{localStorage.setItem(worldSaveKey(),JSON.stringify(snapshot()))}catch{}});
