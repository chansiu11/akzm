import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,activeWorldId,worldSaveKey,listWorlds,loadSettings,WORLDS_KEY,SETTINGS_KEY,ACTIVE_WORLD_KEY} from '../src/menu.js';
function mockStorage(){const map=new Map();globalThis.localStorage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};}
test('world names and player saves stay isolated by selected world',()=>{
 mockStorage();assert.equal(activeWorldId(),'default');assert.equal(worldSaveKey(),'voxel-frontier-save-v1');
 assert.equal(listWorlds()[0].id,'default');
 localStorage.setItem(WORLDS_KEY,JSON.stringify([{id:'test-new',name:'시험 세계',created:1},{id:'default',name:'기존',created:0}]));
 localStorage.setItem(ACTIVE_WORLD_KEY,'test-new');
 assert.equal(activeWorldId(),'test-new');assert.equal(worldSaveKey(),'voxel-frontier-save-v1-test-new');assert.equal(listWorlds()[0].name,'시험 세계');
});
test('settings are sanitized before use',()=>{
 mockStorage();assert.deepEqual(loadSettings(),{...DEFAULT_SETTINGS});
 localStorage.setItem(SETTINGS_KEY,JSON.stringify({fov:10000,renderDistance:99,sensitivity:-2,showCoordinates:false}));
 assert.deepEqual(loadSettings(),{...DEFAULT_SETTINGS,fov:110,renderDistance:16,sensitivity:0,showCoordinates:false});
 localStorage.setItem(SETTINGS_KEY,JSON.stringify({renderDistance:2}));
 assert.equal(loadSettings().renderDistance,2,'explicit low distance is respected');
 localStorage.setItem(SETTINGS_KEY,JSON.stringify({renderDistance:2,renderDistanceV2:true}));
 assert.equal(loadSettings().renderDistance,2,'explicit low distance is respected');

});

test('explicitly deleting the last world does not restore a phantom default entry',()=>{
 mockStorage();
 localStorage.setItem(WORLDS_KEY,JSON.stringify([{id:'w1',name:'To delete',created:1}]));
 localStorage.setItem(ACTIVE_WORLD_KEY,'w1');
 assert.equal(listWorlds().length,1);
 localStorage.setItem(WORLDS_KEY,JSON.stringify([]));
 localStorage.removeItem(ACTIVE_WORLD_KEY);
 assert.deepEqual(listWorlds(),[]);
 assert.equal(worldSaveKey('w1'),'voxel-frontier-save-v1-w1');
});
test('loaded world ID is pinned during saves, and autosave skips erased worlds',async()=>{
 const {readFileSync}=await import('node:fs');
 const game=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const menu=readFileSync(new URL('../src/menu.js',import.meta.url),'utf8');
 assert.match(game,/const runtimeWorldId112=activeWorldId\(\)/);
 assert.match(game,/worldSaveKey\(runtimeWorldId112\)/);
 assert.match(game,/listWorlds\(\)\.some\(w=>w\.id===runtimeWorldId112\)/);
 assert.match(menu,/sessionStorage\.setItem\(AUTO_PLAY_WORLD_KEY,id\)/);
 assert.match(menu,/queueMicrotask\(\(\)=>play\(\{autoResume:true\}\)\)/);
 assert.match(menu,/function confirmDeleteWorld\(\)/);
});
