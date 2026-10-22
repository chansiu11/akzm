import test from 'node:test';
import assert from 'node:assert/strict';
import {activeWorldId,worldSaveKey,listWorlds,loadSettings,WORLDS_KEY,SETTINGS_KEY,ACTIVE_WORLD_KEY} from '../src/menu.js';
function mockStorage(){const map=new Map();globalThis.localStorage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};}
test('world names and player saves stay isolated by selected world',()=>{
 mockStorage();assert.equal(activeWorldId(),'default');assert.equal(worldSaveKey(),'voxel-frontier-save-v1');
 assert.equal(listWorlds()[0].id,'default');
 localStorage.setItem(WORLDS_KEY,JSON.stringify([{id:'test-new',name:'시험 세계',created:1},{id:'default',name:'기존',created:0}]));
 localStorage.setItem(ACTIVE_WORLD_KEY,'test-new');
 assert.equal(activeWorldId(),'test-new');assert.equal(worldSaveKey(),'voxel-frontier-save-v1-test-new');assert.equal(listWorlds()[0].name,'시험 세계');
});
test('settings are sanitized before use',()=>{
 mockStorage();assert.deepEqual(loadSettings(),{fov:75,renderDistance:6,sensitivity:.24,showCoordinates:true});
 localStorage.setItem(SETTINGS_KEY,JSON.stringify({fov:10000,renderDistance:99,sensitivity:-2,showCoordinates:false}));
 assert.deepEqual(loadSettings(),{fov:100,renderDistance:10,sensitivity:.08,showCoordinates:false});
 localStorage.setItem(SETTINGS_KEY,JSON.stringify({renderDistance:2}));
 assert.equal(loadSettings().renderDistance,6,'upgrade old 2-chunk setting to a usable 6 chunks');
 localStorage.setItem(SETTINGS_KEY,JSON.stringify({renderDistance:2,renderDistanceV2:true}));
 assert.equal(loadSettings().renderDistance,2,'a new deliberate 2-chunk setting must persist');

});
