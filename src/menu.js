import {DEFAULT_BINDINGS112,normalizeBindings112,installBindings112} from './keybindings112.js';
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
export const DEFAULT_SETTINGS=Object.freeze({bindings:DEFAULT_BINDINGS112,fov:70,renderDistance:12,sensitivity:0.24,showCoordinates:true,brightness:.5,volume:1,viewBobbing:true,invertMouse:false,clouds:true,autoJump:false,guiScale:0,chatOpacity:1,difficulty:2,smoothLighting:true,graphics:true,maxFps:120,particles:0});
export function loadSettings(){const s=read(SETTINGS_KEY,{});return {
 ...DEFAULT_SETTINGS,bindings:normalizeBindings112(s?.bindings),
 fov:normalizeFov112(s?.fov),
 renderDistance:Math.max(2,Math.min(16,Math.round(Number(s?.renderDistance)||12))),
 sensitivity:Math.max(0,Math.min(1,Number.isFinite(Number(s?.sensitivity))?Number(s.sensitivity):.24)),
 brightness:Math.max(0,Math.min(1,Number(s?.brightness??.5))),volume:Math.max(0,Math.min(1,Number(s?.volume??1))),
 viewBobbing:s?.viewBobbing!==false,invertMouse:s?.invertMouse===true,clouds:s?.clouds!==false,autoJump:s?.autoJump===true,
 guiScale:Math.max(0,Math.min(4,Number(s?.guiScale)||0)),chatOpacity:Math.max(0,Math.min(1,Number(s?.chatOpacity??1))),
 graphics:s?.graphics!==false,maxFps:Math.max(30,Math.min(260,Number(s?.maxFps)||120)),particles:Math.max(0,Math.min(2,Number(s?.particles)||0)),
 difficulty:Math.max(0,Math.min(3,Number(s?.difficulty??2))),smoothLighting:s?.smoothLighting!==false,
 showCoordinates:s?.showCoordinates!==false
};}
export function setupMenu({play,save,applySettings,onTitle=()=>{}}){
 const loadedWorldId=activeWorldId();
 const state={page:'title',selection:loadedWorldId,settings:loadSettings(),language:readTitleLanguage()};
 const bindingUI=installBindings112(document,()=>state.settings.bindings,bindings=>{state.settings.bindings=bindings;write(SETTINGS_KEY,{...state.settings,renderDistanceV2:true});applySettings(state.settings);});
 const pages=['title','worlds','create','edit','delete','settings','video','controls','sound','chat','language','resources','help','pause'];
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

 function showSettings(from){settingsBack=from;const s=state.settings;$('settingFov').value=s.fov;$('settingDistance').value=s.renderDistance;$('settingSensitivity').value=s.sensitivity;$('settingCoords').checked=s.showCoordinates;$('menuLanguageSelect').value=state.language;for(const name of ['brightness','volume','viewBobbing','invertMouse','clouds','autoJump','guiScale','chatOpacity','difficulty','smoothLighting','graphics','maxFps','particles']){const e=$('setting_'+name);if(e.type==='checkbox')e.checked=s[name];else e.value=s[name];}updateSettingLabels();open('settings');}
 function updateSettingLabels(){$('cycleDifficulty112').textContent='난이도: '+['평화로움','쉬움','보통','어려움'][Number($('setting_difficulty').value)];
 for(const name of ['graphics','viewBobbing','clouds','smoothLighting','autoJump','invertMouse']){const input=$('setting_'+name),label=input.parentElement;let caption=label.querySelector('[data-setting-caption]');if(!caption){label.dataset.caption=label.textContent.trim();caption=document.createElement('span');caption.dataset.settingCaption='true';label.replaceChildren(input,caption);}caption.textContent=label.dataset.caption+': '+(name==='graphics'?(input.checked?'화려하게':'빠르게'):input.checked?'켜짐':'꺼짐');}
 for(const [name,title] of [['brightness','밝기'],['volume','전체 음량'],['chatOpacity','채팅 불투명도'],['guiScale','GUI 크기'],['maxFps','최대 프레임률']]){const input=$('setting_'+name),span=input.closest('label')?.querySelector('span');if(span)span.textContent=title+': '+(name==='maxFps'?(Number(input.value)===260?'무제한':input.value+' fps'):name==='guiScale'?(Number(input.value)===0?'자동':input.value):Math.round(Number(input.value)*100)+'%');}
$('cycleGuiScale112').textContent='GUI 크기: '+(['자동','작게','보통','크게','최대'][Number($('setting_guiScale').value)]);$('cycleParticles112').textContent='입자: '+['모두','적게','최소'][Number($('setting_particles').value)];$('fovValue').textContent=fovLabel112($('settingFov').value,state.language);$('settingFov').setAttribute('aria-valuetext',$('fovValue').textContent);$('distanceValue').textContent=$('settingDistance').value+'청크';$('sensitivityValue').textContent=(Number($('settingSensitivity').value)*100).toFixed(0)+'%';}
 function saveSettings(close=true){state.settings={...state.settings,fov:Number($('settingFov').value),renderDistance:Number($('settingDistance').value),sensitivity:Number($('settingSensitivity').value),showCoordinates:$('settingCoords').checked};for(const name of ['brightness','volume','viewBobbing','invertMouse','clouds','autoJump','guiScale','chatOpacity','difficulty','smoothLighting','graphics','maxFps','particles']){const e=$('setting_'+name);state.settings[name]=e.type==='checkbox'?e.checked:Number(e.value);}write(SETTINGS_KEY,{...state.settings,renderDistanceV2:true});
  state.language=$('menuLanguageSelect').value==='en_us'?'en_us':'ko_kr';try{localStorage.setItem(TITLE_LANGUAGE_KEY,state.language)}catch{}
  localizeTitle();applySettings(state.settings);if(close)open(settingsBack);}
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
 for(const [id,page] of [['settingsVideo','video'],['settingsControls','controls'],['settingsLanguage','language'],['settingsResources','resources'],['settingsSound','sound'],['settingsChat','chat']])$(id).addEventListener('click',()=>open(page));
 for(const id of ['videoDone','controlsDone','languageDone','resourcesDone','soundDone','chatDone'])$(id).addEventListener('click',()=>{saveSettings(false);open('settings')});
 $('menuLanguageSelect').addEventListener('change',()=>{state.language=$('menuLanguageSelect').value==='en_us'?'en_us':'ko_kr';});
 $('pauseSettings').addEventListener('click',()=>showSettings('pause'));
 for(const id of ['settingFov','settingDistance','settingSensitivity'])$(id).addEventListener('input',updateSettingLabels);
 $('settingFov').addEventListener('input',()=>{state.settings={...state.settings,fov:normalizeFov112($('settingFov').value)};applySettings(state.settings);write(SETTINGS_KEY,{...state.settings,renderDistanceV2:true});});
 $('cycleDifficulty112').addEventListener('click',()=>{$('setting_difficulty').value=(Number($('setting_difficulty').value)+1)%4;saveSettings(false);updateSettingLabels();});
 $('cycleGuiScale112').addEventListener('click',()=>{$('setting_guiScale').value=(Number($('setting_guiScale').value)+1)%5;saveSettings(false);updateSettingLabels();});
 $('cycleParticles112').addEventListener('click',()=>{$('setting_particles').value=(Number($('setting_particles').value)+1)%3;saveSettings(false);updateSettingLabels();});
 $('settingsSave').addEventListener('click',()=>saveSettings());
 for(const id of ['settingFov','settingDistance','settingSensitivity','settingCoords',...['brightness','volume','viewBobbing','invertMouse','clouds','autoJump','guiScale','chatOpacity','difficulty','smoothLighting','graphics','maxFps','particles'].map(n=>'setting_'+n)])$(id).addEventListener('input',()=>{saveSettings(false);updateSettingLabels();});
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
