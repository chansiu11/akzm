import test from 'node:test';
import assert from 'node:assert/strict';
import {Survival} from '../src/survival.js';
import {FOODS,foodFor,eatHeld} from '../src/food.js';
import {dropInventoryOnDeath} from '../src/death-drops.js';
import {blockDrops} from '../src/vanilla-mining.js';
import {BLOCK} from '../src/block-registry.js';
import {giveDamagedItem} from '../src/damaged-items.js';

test('eating apple takes one from stack, restores hunger and keeps saturation bounded',()=>{
 const s=new Survival({hunger:12,saturation:0}),slots=[{id:115,count:2}];
 assert.equal(foodFor(115).seconds,1.6);assert.equal(eatHeld(slots,0,s),true);
 assert.equal(s.hunger,16);assert.equal(s.saturation,2.4);assert.deepEqual(slots[0],{id:115,count:1});
 s.hunger=20;assert.equal(eatHeld(slots,0,s),false);assert.equal(slots[0].count,1);
});
test('food is not consumed when dead; full stack clears cleanly',()=>{
 const s=new Survival({hunger:2,saturation:0});const inv=[{id:116,count:1}];s.damage(100);
 assert.equal(eatHeld(inv,0,s),false);s.respawn();assert.equal(eatHeld(inv,0,s),false);
 s.hunger=15;assert.equal(eatHeld(inv,0,s),true);assert.deepEqual(inv[0],{id:0,count:0});
});
test('oak-like leaf drops an apple rarely but spruce does not',()=>{
 assert.deepEqual(blockDrops(BLOCK.LEAVES,{rng:()=>.004}),[{id:115,count:1}]);
 assert.deepEqual(blockDrops(BLOCK.LEAVES,{rng:()=>.5}),[]);
 assert.deepEqual(blockDrops(BLOCK.SPRUCE_LEAVES,{rng:()=>0}),[]);
});
test('survival death transfers inventory and overflow without mutating drop metadata',()=>{
 const inv=[{id:114,count:1,damage:42},{id:BLOCK.STONE,count:32},{id:0,count:0}],overflow=[{id:115,count:3}];
 const drops=dropInventoryOnDeath(inv,overflow);
 assert.deepEqual(drops,[{id:114,count:1,damage:42},{id:BLOCK.STONE,count:32},{id:115,count:3}]);
 assert.deepEqual(inv,[{id:0,count:0},{id:0,count:0},{id:0,count:0}]);assert.deepEqual(overflow,[]);
 const receiving=[{id:0,count:0}];assert.equal(giveDamagedItem(receiving,114,1,42),0);
 assert.deepEqual(receiving[0],{id:114,count:1,damage:42});
});
test('regeneration timer does not accumulate while player is at full health',()=>{
 const s=new Survival({health:20,hunger:20});s.tick(200);
 s.damage(4);s.tick(.2);assert.equal(s.health,16);
 s.tick(3.7);assert.equal(s.health,16);
 s.tick(.2);assert.equal(s.health,17);
});
test('air recovers on surfacing and starvation timer does not bank time while fed',()=>{
 const s=new Survival({health:20,hunger:10,air:0});s.tick(.25,{underwater:false});assert.equal(s.air,300);
 s.tick(80);s.hunger=0;s.tick(.1);assert.equal(s.health,20);
 s.tick(3.9);assert.equal(s.health,19);
});
test('movement exhaustion depends on distance and sprinting, not idling time',()=>{
 const walk=new Survival({saturation:5}),sprint=new Survival({saturation:5}),idle=new Survival({saturation:5});
 walk.tick(1,{moving:true,travelDistance:4,sprinting:false});
 sprint.tick(1,{moving:true,travelDistance:4,sprinting:true});
 idle.tick(100,{moving:false,travelDistance:0});
 assert.equal(walk.exhaustion,0);assert.equal(sprint.exhaustion,.4);
 assert.equal(idle.exhaustion,0);
});
