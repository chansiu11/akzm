import test from 'node:test';import assert from 'node:assert/strict';
import {createWaterFlow112} from '../src/water-flow112.js';
import {BLOCK,normalizeState} from '../src/block-registry.js';
import {MOB_MODELS112,modelFaceUV112,facingYaw112,hostileSpawnAllowed112} from '../src/mob-model112.js';
import {decide,spawnEntity} from '../src/entity-ai.js';
import {GRID_RECIPES,fillRecipe112,emptyCraftGrid,recipeAt} from '../src/crafting-grid.js';
import {readFileSync} from 'node:fs';
function waterWorld(){const edits=new Map();return {getBlock(x,y,z){return edits.get([x,y,z].join(','))??{id:y<=1?BLOCK.STONE:BLOCK.AIR,state:{}};},get(x,y,z){return this.getBlock(x,y,z).id;},set(x,y,z,id,state={}){if(y<=1)return false;edits.set([x,y,z].join(','),{id,state:normalizeState(id,state)});return true;}};}
test('water falls, spreads at most seven blocks and drains after source removal',()=>{
 const world=waterWorld(),flow=createWaterFlow112(world);world.set(0,3,0,BLOCK.WATER,{level:0});flow.notifyChange(0,3,0);
 for(let i=0;i<120;i++)flow.tick(.25);
 assert.equal(world.get(0,2,0),BLOCK.WATER);assert.equal(world.getBlock(0,2,0).state.level,8);
 assert.equal(world.get(7,2,0),BLOCK.WATER);assert.equal(world.get(8,2,0),BLOCK.AIR);
 world.set(0,3,0,BLOCK.AIR);flow.notifyChange(0,3,0);for(let i=0;i<200;i++)flow.tick(.25);
 assert.equal(world.get(0,2,0),BLOCK.AIR);assert.equal(world.get(7,2,0),BLOCK.AIR);
});
test('water obeys solid walls and makes a supported source between two sources',()=>{
 const world=waterWorld(),flow=createWaterFlow112(world);world.set(-1,2,0,BLOCK.WATER);world.set(1,2,0,BLOCK.WATER);world.set(0,2,1,BLOCK.STONE);flow.notifyChange(0,2,0);flow.tick(.25);
 assert.equal(world.getBlock(0,2,0).state.level,0);assert.equal(world.get(0,2,1),BLOCK.STONE);
});
test('hostiles cannot spawn in daylight or within 24 blocks',()=>{
 assert.equal(hostileSpawnAllowed112({distance:30,light:15,daylight:true}),false);
 assert.equal(hostileSpawnAllowed112({distance:23,light:0,daylight:false}),false);
 assert.equal(hostileSpawnAllowed112({distance:30,light:4,daylight:false}),true);
 const action=decide(spawnEntity('shooter',1,0,64,0),{x:1,y:64,z:0,invulnerable:true},.05,()=>.5);
 assert.equal(action.attack,false);assert.equal(action.mode,'wander');
});
test('mob proportions, front UV and facing use the same forward direction',()=>{
 const cow=MOB_MODELS112.grazer;assert.equal(cow[0].w,.75);assert.equal(cow[0].rotateX,Math.PI/2);assert.equal(cow.length,8);
 assert.equal(MOB_MODELS112.shooter[2].w,2/16);assert.equal(MOB_MODELS112.wanderer[2].w,4/16);
 assert.deepEqual(modelFaceUV112(MOB_MODELS112.wanderer[1])[5],[8,8,16,16]);
 assert.equal(facingYaw112(0,-1),0);assert.equal(facingYaw112(0,0,1.5),1.5);
});
test('recipe-book fills ingredients atomically and preserves stacks when insufficient',()=>{
 const r=GRID_RECIPES.find(r=>r.id==='crafting-table'),grid=emptyCraftGrid(),inv=[{id:BLOCK.PLANKS,count:3},{id:0,count:0}];
 assert.equal(fillRecipe112(r,2,grid,inv),false);assert.equal(inv[0].count,3);
 inv[0].count=4;assert.equal(fillRecipe112(r,2,grid,inv),true);assert.equal(recipeAt(grid,2).recipe.id,r.id);assert.equal(inv[0].count,0);
 assert.equal(fillRecipe112(r,2,grid,inv),true);assert.equal(grid.reduce((n,s)=>n+s.count,0),4);
});
test('fullscreen is an explicit setting and never a world-entry side effect',()=>{
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),menu=readFileSync(new URL('../src/menu.js',import.meta.url),'utf8');
 assert.doesNotMatch(main,/requestFullscreen|pendingFullscreenAfterWorldCreation/);assert.match(menu,/fullscreen.addEventListener\('click'/);
 assert.match(main,/if\(!mouseDrag112\)return/);assert.match(main,/player.invulnerable=creative112/);
});
