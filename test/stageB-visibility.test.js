import test from 'node:test';
import assert from 'node:assert/strict';
import {clearLineOfSight} from '../src/visibility.js';
import {BLOCK} from '../src/block-registry.js';
const w=(id,state={})=>({getBlock(x,y,z){return x===1&&y===1&&z===0?{id,state}:{id:BLOCK.AIR,state:{}}}});
const from={x:.5,y:1.6,z:.5},to={x:2.5,y:1.6,z:.5};
test('opaque wall blocks player and entity attacks',()=>{
 assert.equal(clearLineOfSight(w(BLOCK.STONE),from,to),false);
 assert.equal(clearLineOfSight(w(BLOCK.AIR),from,to),true);
});
test('half-slab collision shape blocks only the occupied half',()=>{
 assert.equal(clearLineOfSight(w(BLOCK.SLAB,{half:'bottom'}),from,to),true);
 assert.equal(clearLineOfSight(w(BLOCK.SLAB,{half:'top'}),from,to),false);
});
test('water is non-solid and transparent to melee line-of-sight',()=>{
 assert.equal(clearLineOfSight(w(BLOCK.WATER),from,to),true);
});
test('line of sight cannot be used for an unbounded remote range',()=>{
 assert.equal(clearLineOfSight(w(BLOCK.AIR),from,{x:200,y:1.6,z:.5}),false);
});
