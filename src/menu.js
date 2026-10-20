// Original UI implementation inspired by familiar sandbox game menu flows.
// This does not contain proprietary menu artwork, fonts, or game code.
export const WORLDS_KEY='voxel-frontier-worlds-v1';
export const ACTIVE_WORLD_KEY='voxel-frontier-active-world-v1';
export const SETTINGS_KEY='voxel-frontier-settings-v1';
const DEFAULT_WORLD={id:'default',name:'첫 번째 세계',created:0};
const $=id=>document.getElementById(id);
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
export const activeWorldId=()=>{try{return localStorage.getItem(ACTIVE_WORLD_KEY)||'default'}catch{return 'default'}};
export const worldSaveKey=(id=activeWorldId())=>id==='default'?'voxel-frontier-save-v1':`voxel-frontier-save-v1-${id}`;
export function activeWorldMode(){const w=listWorlds().find(w=>w.id===activeWorldId());return w?.mode==='survival'?'survival':'prototype';}
export function activeWorldCheats(){const w=listWorlds().find(w=>w.id===activeWorldId());return w?.allowCheats===true||w?.mode!=='survival';}
export function activeWorldSeed(){const world=listWorlds().find(w=>w.id===activeWorldId());return Number.isSafeInteger(world?.seed)?world.seed:18909;}
export function parseWorldSeed(text){
 const raw=String(text??'').trim();
 if(!raw){return Math.floor(Math.random()*4294967296)-2147483648;}
 if(/^-?\d+$/.test(raw)){const n=Number(raw);if(Number.isSafeInteger(n))return n|0;}
 // Stable unsigned UTF-16 character hashing for custom seed strings.
 let h=0;for(let i=0;i<raw.length;i++)h=(Math.imul(h,31)+raw.charCodeAt(i))|0;
 return h;
}
export function listWorlds(){
 const worlds=read(WORLDS_KEY,null);
 if(!Array.isArray(worlds)||!worlds.length)return [{...DEFAULT_WORLD}];
 return worlds.filter(w=>w&&typeof w.id==='string'&&typeof w.name==='string').slice(0,30);
}
export const DEFAULT_SETTINGS=Object.freeze({fov:75,renderDistance:2,sensitivity:0.24,showCoordinates:true});
export function loadSettings(){const s=read(SETTINGS_KEY,{});return {
 fov:Math.max(60,Math.min(100,Number(s?.fov)||75)),
 renderDistance:Math.max(1,Math.min(3,Math.round(Number(s?.renderDistance)||2))),
 sensitivity:Math.max(.08,Math.min(.6,Number(s?.sensitivity)||.24)),
 showCoordinates:s?.showCoordinates!==false
};}
export function setupMenu({play,save,applySettings,onTitle=()=>{}}){
 const state={page:'title',selection:activeWorldId(),settings:loadSettings()};
 const pages=['title','worlds','create','settings','help','pause'];
 let settingsBack='title';
 function open(page){state.page=page;$('overlay').classList.add('show');document.body.classList.add('menu-open');for(const p of pages)$('menu-'+p).classList.toggle('hidden',p!==page);if(page==='worlds')refreshWorlds();}
 function close(){ $('overlay').classList.remove('show');document.body.classList.remove('menu-open');}
 function refreshWorlds(){const worlds=listWorlds();if(!worlds.some(w=>w.id===state.selection))state.selection=worlds[0].id;
  const box=$('worldList');box.replaceChildren();
  for(const w of worlds){const b=document.createElement('button');b.type='button';b.className='world-row'+(state.selection===w.id?' selected':'');b.dataset.worldId=w.id;
   const label=document.createElement('strong');label.textContent=w.name;
   const sub=document.createElement('small');let updated='아직 저장되지 않음';try{const v=localStorage.getItem(worldSaveKey(w.id));if(v)updated='플레이 기록 있음';}catch{}
   sub.textContent=`${updated} · 시드 ${Number.isSafeInteger(w.seed)?w.seed:'레거시'} · ${w.mode==='survival'?'생존':'건설 실험'}`;
   b.append(label,sub);b.addEventListener('click',()=>{state.selection=w.id;refreshWorlds()});b.addEventListener('dblclick',continueWorld);box.append(b);
  }
  $('worldDelete').disabled=worlds.length===0;
 }
 function continueWorld(){try{if(state.selection!==activeWorldId()){localStorage.setItem(ACTIVE_WORLD_KEY,state.selection);location.reload();return;}}catch{}close();play();}
 function createWorld(){const name=$('worldName').value.trim().slice(0,32)||'새로운 세계';const id='w'+Date.now().toString(36);const seed=parseWorldSeed($('worldSeed').value);const mode=$('worldMode').value==='survival'?'survival':'prototype';const allowCheats=$('worldCheats').checked;const worlds=listWorlds();
  if(!write(WORLDS_KEY,[{id,name,seed,mode,allowCheats,created:Date.now()},...worlds])){$('worldError').textContent='기기에 세계를 저장할 수 없습니다.';return;}
  try{localStorage.setItem(ACTIVE_WORLD_KEY,id)}catch{$('worldError').textContent='브라우저 저장소를 사용할 수 없습니다.';return;}
  location.reload();
 }
 function deleteWorld(){const item=listWorlds().find(w=>w.id===state.selection);if(!item)return;if(!window.confirm(`“${item.name}” 세계와 저장 기록을 삭제할까요? 복구할 수 없습니다.`))return;
  try{localStorage.removeItem(worldSaveKey(item.id));}catch{}
  let worlds=listWorlds().filter(w=>w.id!==item.id);if(!worlds.length)worlds=[{...DEFAULT_WORLD}];write(WORLDS_KEY,worlds);
  if(activeWorldId()===item.id){try{localStorage.setItem(ACTIVE_WORLD_KEY,worlds[0].id)}catch{} location.reload();return;}
  state.selection=worlds[0].id;refreshWorlds();
 }
 function showSettings(from){settingsBack=from;const s=state.settings;$('settingFov').value=s.fov;$('settingDistance').value=s.renderDistance;$('settingSensitivity').value=s.sensitivity;$('settingCoords').checked=s.showCoordinates;updateSettingLabels();open('settings');}
 function updateSettingLabels(){$('fovValue').textContent=$('settingFov').value+'°';$('distanceValue').textContent=$('settingDistance').value+'청크';$('sensitivityValue').textContent=(Number($('settingSensitivity').value)*100).toFixed(0)+'%';}
 function saveSettings(){state.settings={fov:Number($('settingFov').value),renderDistance:Number($('settingDistance').value),sensitivity:Number($('settingSensitivity').value),showCoordinates:$('settingCoords').checked};write(SETTINGS_KEY,state.settings);applySettings(state.settings);open(settingsBack);}
 $('menuSingle').addEventListener('click',()=>open('worlds'));
 $('worldPlay').addEventListener('click',continueWorld);
 $('worldCreate').addEventListener('click',()=>{$('worldName').value='새로운 세계';$('worldSeed').value='';$('worldMode').value='survival';$('worldCheats').checked=false;$('worldError').textContent='';open('create')});
 $('worldDelete').addEventListener('click',deleteWorld);
 $('worldBack').addEventListener('click',()=>open('title'));
 $('createBack').addEventListener('click',()=>open('worlds'));
 $('createConfirm').addEventListener('click',createWorld);
 $('worldName').addEventListener('keydown',e=>{if(e.key==='Enter')createWorld()});
 $('menuSettings').addEventListener('click',()=>showSettings('title'));
 $('pauseSettings').addEventListener('click',()=>showSettings('pause'));
 for(const id of ['settingFov','settingDistance','settingSensitivity'])$(id).addEventListener('input',updateSettingLabels);
 $('settingsSave').addEventListener('click',saveSettings);
 $('settingsBack').addEventListener('click',()=>open(settingsBack));
 $('menuHelp').addEventListener('click',()=>open('help'));
 $('helpBack').addEventListener('click',()=>open('title'));
 $('pauseResume').addEventListener('click',()=>{close();play()});
 $('pauseTitle').addEventListener('click',()=>{save();onTitle();open('title')});
 $('menuExit').addEventListener('click',()=>{const el=$('menuExit');el.textContent='브라우저 탭을 닫으면 종료됩니다';setTimeout(()=>{el.textContent='게임 종료'},2500)});
 open('title');applySettings(state.settings);
 return {open,close,getSettings:()=>state.settings,showPause:()=>open('pause')};
}
