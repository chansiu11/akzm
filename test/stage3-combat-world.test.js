import test from 'node:test';
import assert from 'node:assert/strict';
import {reachableByRay,registerHit,mayHit,MELEE_REACH} from '../src/combat-rules.js';
import {normalizeEntityRecords} from '../src/entity-save.js';
import {clearLineOfSight} from '../src/visibility.js';
import {World} from '../src/terrain.js';
import {TileStore} from '../src/tile-data.js';
import {BLOCK} from '../src/block-registry.js';
import {changeBlockWithLifecycle} from '../src/block-change.js';

test('melee hits targets inside three blocks, not at four blocks or behind player',()=>{
 const origin={x:0,y:70,z:0},dir={x:1,y:0,z:0};
 assert.equal(MELEE_REACH,3);
 assert.ok(reachableByRay({x:2,y:68.9,z:0},origin,dir)!==null);
 assert.equal(reachableByRay({x:4,y:68.9,z:0},origin,dir),null);
 assert.equal(reachableByRay({x:-1,y:68.9,z:0},origin,dir),null);
});
test('hurt resistance prevents duplicate consecutive damage until duration ends',()=>{
 const e={health:16,hurtTimer:0};
 assert.equal(registerHit(e,3),true);assert.equal(registerHit(e,3),false);assert.equal(e.health,13);
 e.hurtTimer=0;assert.equal(mayHit(e),true);assert.equal(registerHit(e,3),true);
 assert.equal(normalizeEntityRecords([{id:1,kind:'wanderer',x:0,y:70,z:0,health:e.health,hurtTimer:e.hurtTimer}])[0].hurtTimer,.5);
});
test('actual stone block between attacker and target prevents line of sight',()=>{
 const world=new World(null,{seed:10});world.set(1,170,0,BLOCK.STONE);
 assert.equal(clearLineOfSight(world,{x:.5,y:170.5,z:.5},{x:2.5,y:170.5,z:.5}),false);
 world.set(1,170,0,BLOCK.AIR);
 assert.equal(clearLineOfSight(world,{x:.5,y:170.5,z:.5},{x:2.5,y:170.5,z:.5}),true);
});
test('command-like block replacement clears incompatible chest contents from tile storage',()=>{
 const world=new World(null,{seed:10}),tiles=new TileStore();world.set(2,170,2,BLOCK.CHEST);tiles.ensure(2,170,2,'chest').slots[0]={id:BLOCK.STONE,count:16};
 assert.equal(changeBlockWithLifecycle(world,tiles,2,170,2,BLOCK.STONE),true);
 assert.equal(tiles.items.size,0);
 assert.equal(world.get(2,170,2),BLOCK.STONE);
});
test('replacing powered lever recalculates adjacent redstone lamp',()=>{
 const world=new World(null,{seed:10}),tiles=new TileStore();
 world.set(1,170,0,BLOCK.LEVER,{powered:true});world.set(0,170,0,BLOCK.LAMP,{powered:true});
 assert.equal(changeBlockWithLifecycle(world,tiles,1,170,0,BLOCK.AIR),true);
 assert.deepEqual(world.getState(0,170,0),{powered:false});
});
test('replacing powered lever with unpowered same type updates its neighboring lamp',()=>{
 const world=new World(null,{seed:10}),tiles=new TileStore();
 world.set(1,170,0,BLOCK.LEVER,{powered:true});world.set(0,170,0,BLOCK.LAMP,{powered:true});
 assert.equal(changeBlockWithLifecycle(world,tiles,1,170,0,BLOCK.LEVER),true);
 assert.deepEqual(world.getState(0,170,0),{powered:false});
});
