import test from 'node:test';
import assert from 'node:assert/strict';
import {raycastVoxel112} from '../src/voxel-raycast112.js';
import {BLOCK} from '../src/block-registry.js';
const makeWorld=map=>({getBlock(x,y,z){return map.get([x,y,z].join(','))??{id:BLOCK.AIR,state:{}};}});
test('ray works before the 12-chunk mesh appears',()=>{
 const w=makeWorld(new Map([['0,1,-3',{id:BLOCK.STONE,state:{}}]]));
 const h=raycastVoxel112(w,{x:.5,y:1.5,z:.5},{x:0,y:0,z:-1});
 assert.equal(h?.id,BLOCK.STONE);assert.equal(h?.z,-3);assert.deepEqual(h?.normal,{x:0,y:0,z:1});
});
test('water is not mineable and does not block solid target',()=>{
 const w=makeWorld(new Map([['0,1,-1',{id:BLOCK.WATER,state:{}}],['0,1,-2',{id:BLOCK.GRASS,state:{}}]]));
 assert.equal(raycastVoxel112(w,{x:.5,y:1.5,z:.5},{x:0,y:0,z:-1})?.z,-2);
});
test('creative reach remains five blocks, no selection beyond it',()=>{
 const w=makeWorld(new Map([['0,1,-7',{id:BLOCK.STONE,state:{}}]]));
 assert.equal(raycastVoxel112(w,{x:.5,y:1.5,z:.5},{x:0,y:0,z:-1}),null);
});
test('slab ray checks true half-block geometry',()=>{
 const w=makeWorld(new Map([['0,1,-2',{id:BLOCK.SLAB,state:{half:'bottom'}}]]));
 assert.equal(raycastVoxel112(w,{x:.5,y:1.9,z:.5},{x:0,y:0,z:-1}),null);
 assert.equal(raycastVoxel112(w,{x:.5,y:1.25,z:.5},{x:0,y:0,z:-1})?.id,BLOCK.SLAB);
});
