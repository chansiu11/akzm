import test from 'node:test';
import assert from 'node:assert/strict';
import {heldItemView} from '../src/held-item-view.js';
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
