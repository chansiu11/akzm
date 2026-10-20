import test from 'node:test';
import assert from 'node:assert/strict';
import {heldItemView,boxGeometryUV,firstPersonFov} from '../src/held-item-view.js';
import {BLOCK} from '../src/block-registry.js';
test('empty and unknown selection do not render a held object',()=>{
 for(const id of [0,undefined,-1,99999])assert.deepEqual(heldItemView(id),{id:0,kind:'empty',tiles:[]});
});
test('grass uses side, top and dirt faces instead of six tops',()=>{
 assert.deepEqual(heldItemView(BLOCK.GRASS).tiles,[13,13,0,1,13,13]);
});
test('logs and crafting tables preserve face-specific textures',()=>{
 assert.deepEqual(heldItemView(BLOCK.LOG).tiles,[4,4,14,14,4,4]);
 assert.deepEqual(heldItemView(BLOCK.CRAFTING_TABLE).tiles,[17,17,16,6,18,17]);
});
test('food is an item and pickaxes use the tool model',()=>{
 assert.equal(heldItemView(115).kind,'item');
 for(let id=110;id<=114;id++)assert.equal(heldItemView(id).kind,'tool');
});

test('box UVs use row order so the two triangles do not fold across the tile',()=>{
 assert.deepEqual(boxGeometryUV([[0,0],[1,0],[1,1],[0,1]]),[[0,1],[1,1],[0,0],[1,0]]);
});
test('portrait view keeps the same horizontal space for the held model',()=>{
 const horizontal=a=>a*Math.tan(firstPersonFov(a)*Math.PI/360);
 assert.ok(Math.abs(horizontal(390/844)-horizontal(1.4))<1e-10);
 assert.ok(Math.abs(firstPersonFov(1440/900)-70)<1e-10);
});
