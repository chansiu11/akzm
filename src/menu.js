import {normalizeFov112,fovLabel112} from './fov112.js';
// Original UI implementation inspired by familiar sandbox game menu flows.
// This does not contain proprietary menu artwork, fonts, or game code.
export const WORLDS_KEY='voxel-frontier-worlds-v1';
export const ACTIVE_WORLD_KEY='voxel-frontier-active-world-v1';
export const SETTINGS_KEY='voxel-frontier-settings-v1';
const TITLE_LANGUAGE_KEY='akzm-local-title-language112';
export const AUTO_PLAY_WORLD_KEY='akzm-autoplay-new-world112';
function readTitleLanguage(){try{return localStorage.getItem(TITLE_LANGUAGE_KEY)==='en_us'?'en_us':'ko_kr'}catch{return 'ko_kr'}}
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
 if(!Array.isArray(worlds))return [{...DEFAULT_WORLD}];
 return worlds.filter(w=>w&&typeof w.id==='string'&&typeof w.name==='string').slice(0,30);
}
export const DEFAULT_SETTINGS=Object.freeze({fov:70,renderDistance:12,sensitivity:0.24,showCoordinates:true});
export function loadSettings(){const s=read(SETTINGS_KEY,{});return {
 fov:normalizeFov112(s?.fov),
 renderDistance:Math.max(12,Math.min(16,Math.round((s?.renderDistanceV2===true?Number(s?.renderDistance):Math.max(12,Number(s?.renderDistance)||12))||12))),
 sensitivity:Math.max(.08,Math.min(.6,Number(s?.sensitivity)||.24)),
 showCoordinates:s?.showCoordinates!==false
};}
export function setupMenu({play,save,applySettings,onTitle=()=>{}}){
 const loadedWorldId=activeWorldId();
 const state={page:'title',selection:loadedWorldId,settings:loadSettings(),language:readTitleLanguage()};
 const pages=['title','worlds','create','edit','delete','settings','video','controls','language','resources','help','pause'];
 let settingsBack='title';
 const titleStrings={ko_kr:['싱글플레이','멀티플레이','Minecraft Realms','설정...','게임 종료'],en_us:['Singleplayer','Multiplayer','Minecraft Realms','Options...','Quit Game']};
 function localizeTitle(){const labels=titleStrings[state.language]??titleStrings.ko_kr;['menuSingle','menuMultiplayer','menuRealms','menuSettings','menuExit'].forEach((id,i)=>$(id).textContent=labels[i]);$('menuLanguageSelect').value=state.language;}
 function open(page){state.page=page;$('overlay').classList.add('show');document.body.classList.add('menu-open');for(const p of pages)$('menu-'+p).classList.toggle('hidden',p!==page);if(page==='worlds')refreshWorlds();}
 function close(){ $('overlay').classList.remove('show');document.body.classList.remove('menu-open');}
 function refreshWorlds(){
  const worlds=listWorlds();
  if(!worlds.some(w=>w.id===state.selection))state.selection=worlds[0]?.id??'';
  const box=$('worldList');box.replaceChildren();
  for(const w of worlds){
   const row=document.createElement('button');row.type='button';
   row.className='world-row'+(state.selection===w.id?' selected':'');
   row.dataset.worldId=w.id;row.setAttribute('role','option');row.setAttribute('aria-selected',String(state.selection===w.id));
   const icon=document.createElement('span');icon.className='world-icon112';icon.setAttribute('aria-hidden','true');
   const detail=document.createElement('span');detail.className='world-text112';
   const label=document.createElement('strong');label.textContent=w.name;
   const meta=document.createElement('small');meta.textContent=w.created?
    w.name+' ('+new Date(w.created).toLocaleString('ko-KR')+')':w.name+' (브라우저에 저장됨)';
   const info=document.createElement('small');info.textContent=(w.mode==='survival'?'생존 모드':'건설 모드')+
    (w.allowCheats?' · 치트 허용':'')+' · 버전: 1.12.2 웹';
   detail.append(label,meta,info);row.append(icon,detail);
   row.addEventListener('click',()=>{
    state.selection=w.id;
    for(const entry of box.querySelectorAll('.world-row')){
     const selected=entry.dataset.worldId===w.id;
     entry.classList.toggle('selected',selected);entry.setAttribute('aria-selected',String(selected));
    }
   });
   row.addEventListener('dblclick',continueWorld);
   box.append(row);
  }
  for(const id of ['worldPlay','worldEdit','worldDelete','worldRecreate'])$(id).disabled=worlds.length===0;
 }
 function selectedWorld(){return listWorlds().find(w=>w.id===state.selection)??null;}
 function editSelectedWorld(){const w=selectedWorld();if(!w)return;$('worldEditName').value=w.name;open('edit');}
 function saveEditedWorld(){
  const worlds=listWorlds(),name=$('worldEditName').value.trim().slice(0,32)||'새로운 세계';
  if(!write(WORLDS_KEY,worlds.map(w=>w.id===state.selection?{...w,name}:w)))return;
  open('worlds');
 }
 function recreateSelectedWorld(){
  const w=selectedWorld();if(!w)return;
  $('worldName').value=(w.name+' 복사본').slice(0,32);
  $('worldSeed').value=String(Number.isSafeInteger(w.seed)?w.seed:activeWorldSeed());
  $('worldMode').value=w.mode==='survival'?'survival':'prototype';
  $('worldCheats').checked=!!w.allowCheats;$('worldError').textContent='';
  open('create');
 }
 function continueWorld(){
  if(!selectedWorld())return;
  if(state.selection!==loadedWorldId){
   try{
    localStorage.setItem(ACTIVE_WORLD_KEY,state.selection);
    sessionStorage.setItem(AUTO_PLAY_WORLD_KEY,state.selection);
   }catch{/* best effort: still load requested world */}
   location.reload();return;
  }
  close();play();
 }
 function createWorld(){const name=$('worldName').value.trim().slice(0,32)||'새로운 세계';const id='w'+Date.now().toString(36);const seed=parseWorldSeed($('worldSeed').value);const mode=$('worldMode').value==='survival'?'survival':'prototype';const allowCheats=$('worldCheats').checked;const worlds=listWorlds();
  if(!write(WORLDS_KEY,[{id,name,seed,mode,allowCheats,created:Date.now()},...worlds])){$('worldError').textContent='기기에 세계를 저장할 수 없습니다.';return;}
  try{localStorage.setItem(ACTIVE_WORLD_KEY,id)}catch{$('worldError').textContent='브라우저 저장소를 사용할 수 없습니다.';return;}
  try{sessionStorage.setItem(AUTO_PLAY_WORLD_KEY,id)}catch{}
  location.reload();
 }
 function deleteWorld(){
  const item=selectedWorld();if(!item)return;
  $('deleteWorldName').textContent=item.name;
  open('delete');
 }
 function confirmDeleteWorld(){
  const item=selectedWorld();if(!item){open('worlds');return;}
  const worlds=listWorlds().filter(w=>w.id!==item.id);
  // First persist the new world list, then delete the selected world's data.
  if(!write(WORLDS_KEY,worlds)){
   $('deleteError').textContent='브라우저에 삭제 결과를 저장할 수 없습니다.';return;
  }
  try{localStorage.removeItem(worldSaveKey(item.id));}catch{}
  if(activeWorldId()===item.id){
   try{
    if(worlds.length)localStorage.setItem(ACTIVE_WORLD_KEY,worlds[0].id);
    else localStorage.removeItem(ACTIVE_WORLD_KEY);
   }catch{}
  }
  state.selection=worlds[0]?.id??'';
  $('deleteError').textContent='';
  open('worlds');
 }

 function showSettings(from){settingsBack=from;const s=state.settings;$('settingFov').value=s.fov;$('settingDistance').value=s.renderDistance;$('settingSensitivity').value=s.sensitivity;$('settingCoords').checked=s.showCoordinates;$('menuLanguageSelect').value=state.language;updateSettingLabels();open('settings');}
 function updateSettingLabels(){$('fovValue').textContent=fovLabel112($('settingFov').value,state.language);$('settingFov').setAttribute('aria-valuetext',$('fovValue').textContent);$('distanceValue').textContent=$('settingDistance').value+'청크';$('sensitivityValue').textContent=(Number($('settingSensitivity').value)*100).toFixed(0)+'%';}
 function saveSettings(){state.settings={fov:Number($('settingFov').value),renderDistance:Number($('settingDistance').value),sensitivity:Number($('settingSensitivity').value),showCoordinates:$('settingCoords').checked};write(SETTINGS_KEY,{...state.settings,renderDistanceV2:true});
  state.language=$('menuLanguageSelect').value==='en_us'?'en_us':'ko_kr';try{localStorage.setItem(TITLE_LANGUAGE_KEY,state.language)}catch{}
  localizeTitle();applySettings(state.settings);open(settingsBack);}
 $('menuSingle').addEventListener('click',()=>open('worlds'));
 $('worldPlay').addEventListener('click',continueWorld);
 $('worldCreate').addEventListener('click',()=>{$('worldName').value='새로운 세계';$('worldSeed').value='';$('worldMode').value='survival';$('worldCheats').checked=false;$('worldError').textContent='';open('create')});
 $('worldDelete').addEventListener('click',deleteWorld);
 $('deleteConfirm').addEventListener('click',confirmDeleteWorld);
 $('deleteBack').addEventListener('click',()=>open('worlds'));
 $('worldEdit').addEventListener('click',editSelectedWorld);
 $('worldRecreate').addEventListener('click',recreateSelectedWorld);
 $('worldEditSave').addEventListener('click',saveEditedWorld);
 $('worldEditBack').addEventListener('click',()=>open('worlds'));
 $('worldEditName').addEventListener('keydown',e=>{if(e.key==='Enter')saveEditedWorld();});
 $('worldBack').addEventListener('click',()=>open('title'));
 $('createBack').addEventListener('click',()=>open('worlds'));
 $('createConfirm').addEventListener('click',createWorld);
 $('worldName').addEventListener('keydown',e=>{if(e.key==='Enter')createWorld()});
 $('menuSettings').addEventListener('click',()=>showSettings('title'));
 $('menuLanguage').addEventListener('click',()=>{showSettings('title');open('language');$('menuLanguageSelect').focus();});
 for(const [id,page] of [['settingsVideo','video'],['settingsControls','controls'],['settingsLanguage','language'],['settingsResources','resources']])$(id).addEventListener('click',()=>open(page));
 for(const id of ['videoDone','controlsDone','languageDone','resourcesDone'])$(id).addEventListener('click',()=>open('settings'));
 $('menuLanguageSelect').addEventListener('change',()=>{state.language=$('menuLanguageSelect').value==='en_us'?'en_us':'ko_kr';});
 $('pauseSettings').addEventListener('click',()=>showSettings('pause'));
 for(const id of ['settingFov','settingDistance','settingSensitivity'])$(id).addEventListener('input',updateSettingLabels);
 $('settingFov').addEventListener('input',()=>{state.settings={...state.settings,fov:normalizeFov112($('settingFov').value)};applySettings(state.settings);write(SETTINGS_KEY,{...state.settings,renderDistanceV2:true});});
 $('settingsSave').addEventListener('click',saveSettings);
 const fullscreen=$('settingFullscreen');
 const syncFullscreen=()=>{fullscreen.textContent='전체화면: '+(document.fullscreenElement?'켜짐':'꺼짐');fullscreen.setAttribute('aria-pressed',String(!!document.fullscreenElement));};
 fullscreen.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{fullscreen.textContent='전체화면: 브라우저에서 허용되지 않음';}syncFullscreen();});
 document.addEventListener('fullscreenchange',syncFullscreen);syncFullscreen();
 $('settingsBack').addEventListener('click',()=>open(settingsBack));
 $('menuMultiplayer').addEventListener('click',()=>open('help'));
 $('menuRealms').addEventListener('click',()=>open('help'));
 $('menuHelp').addEventListener('click',()=>open('help'));
 $('helpBack').addEventListener('click',()=>open('settings'));
 $('pauseResume').addEventListener('click',()=>{close();play()});
 $('pauseTitle').addEventListener('click',()=>{save();onTitle();open('title')});
 $('menuExit').addEventListener('click',()=>{const el=$('menuExit');el.textContent=state.language==='en_us'?'Close the browser tab to quit':'브라우저 탭을 닫으면 종료됩니다';setTimeout(localizeTitle,2500)});
 localizeTitle();open('title');applySettings(state.settings);
 try{
  const pending=sessionStorage.getItem(AUTO_PLAY_WORLD_KEY);
  if(pending&&pending===loadedWorldId&&listWorlds().some(w=>w.id===pending)){
   sessionStorage.removeItem(AUTO_PLAY_WORLD_KEY);
   queueMicrotask(()=>play({autoResume:true}));
  }
 }catch{} 
 return {open,close,getSettings:()=>state.settings,showPause:()=>open('pause')};
}
