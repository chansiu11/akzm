import test from 'node:test';
import assert from 'node:assert/strict';
import {Survival} from '../src/survival.js';
test('food saturation depletes before hunger',()=>{
 const s=new Survival({hunger:20,saturation:2});s.exert(8);
 assert.equal(s.hunger,20);assert.equal(s.saturation,0);
 s.exert(4);assert.equal(s.hunger,19);
});
test('food and saturation are both clamped by player food level and persist',()=>{
 const s=new Survival({hunger:10,saturation:3});s.consume(4,.6);
 assert.equal(s.hunger,14);assert.equal(s.saturation,7.8);
 assert.deepEqual(new Survival(s.serialize()).serialize(),s.serialize());
});
test('a fresh respawn replenishes both hunger and saturation',()=>{
 const s=new Survival({health:2,hunger:0,saturation:0});s.damage(10);s.respawn();
 assert.equal(s.hunger,20);assert.equal(s.saturation,5);assert.equal(s.dead,false);
});
