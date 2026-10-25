import test from 'node:test';import assert from 'node:assert/strict';
import {World,BLOCK,terrainHeight,heightAt} from '../src/terrain.js';
import {createFallingBlocks112} from '../src/falling-blocks112.js';
import {blocksBrowserShortcut112} from '../src/keyboard112.js';
import {loadSettings,SETTINGS_KEY} from '../src/menu.js';
test('falling blocks occupy intermediate positions and settle without duplication',()=>{
 const w=new World({generator:4,seed:19,edits:[]});for(let y=195;y<=205;y++)w.set(0,y,0,0);w.set(0,194,0,BLOCK.STONE);w.set(0,200,0,BLOCK.SAND);
 const sim=createFallingBlocks112(w);sim.notifyChange(0,200,0);sim.tick(.05);
 assert.equal(w.get(0,200,0),0);assert.equal(sim.entities.length,1);assert.ok(sim.entities[0].y<200&&sim.entities[0].y>199);
 const restored=createFallingBlocks112(w,()=>{},sim.serialize());for(let i=0;i<100;i++)restored.tick(.05);
 assert.equal(restored.entities.length,0);assert.equal(w.get(0,195,0),BLOCK.SAND);assert.equal(w.get(0,196,0),0);
});
test('old generator terrain remains unchanged while new terrain is deterministic and blended',()=>{
 const old=new World({generator:4,seed:42,edits:[]}),copy=new World(old.serialize());
 for(let x=-100;x<100;x+=7){assert.equal(copy.surfaceHeight(x,31),heightAt(x,31,42));assert.equal(terrainHeight(x,31,42),terrainHeight(x,31,42));assert.ok(Math.abs(terrainHeight(x+1,31,42)-terrainHeight(x,31,42))<=5);}
});
test('navigation shortcuts are intercepted only in game and do not block text editing',()=>{
 for(const e of [{code:'ArrowLeft',altKey:true},{code:'KeyS',ctrlKey:true},{code:'Space'},{code:'Equal',ctrlKey:true}]){
 assert.equal(blocksBrowserShortcut112(e,{playing:true}),true);assert.equal(blocksBrowserShortcut112(e,{playing:true,editing:true}),false);assert.equal(blocksBrowserShortcut112(e),false);}
 assert.equal(blocksBrowserShortcut112({code:'KeyW'},{playing:true}),false);
});
test('settings persist zero values and all new toggle states',()=>{
 const data={sensitivity:0,brightness:0,volume:0,chatOpacity:0,viewBobbing:false,clouds:false,invertMouse:true,autoJump:true,guiScale:2,renderDistance:2};
 globalThis.localStorage={getItem:key=>key===SETTINGS_KEY?JSON.stringify(data):null};const actual=loadSettings();for(const [key,value] of Object.entries(data))assert.equal(actual[key],value,key);
});
import {titleLayout112} from '../src/title-layout112.js';
test('GUI size preference changes menu logical dimensions and clamps to the viewport',()=>{
 assert.equal(titleLayout112(1280,960,1).scale,1);assert.equal(titleLayout112(1280,960,2).width,640);assert.equal(titleLayout112(640,480,4).scale,2);assert.equal(titleLayout112(1280,960,0).scale,4);
});
