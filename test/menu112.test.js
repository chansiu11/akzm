import test from 'node:test';
import assert from 'node:assert/strict';
import {MENU112_FILES,menuAssetsReady,cubeSample} from '../src/menu112-assets.js';
import {tileForBlock,BLOCK} from '../src/block-registry.js';
test('owner menu requires logo edition dirt and six panorama faces',()=>{
 assert.equal(Object.keys(MENU112_FILES).length,9);
 const assets=Object.fromEntries(Object.keys(MENU112_FILES).map(k=>[k,'data:image/png;base64,AA==']));
 assert.ok(menuAssetsReady(assets));delete assets.panorama5;assert.equal(menuAssetsReady(assets),false);
 assets.panorama5='https://example.com/image.png';assert.equal(menuAssetsReady(assets),false);
});
test('cubemap centers resolve to six distinct centered faces',()=>{
 const samples=[[0,0,1],[1,0,0],[0,0,-1],[-1,0,0],[0,1,0],[0,-1,0]].map(v=>cubeSample(...v));
 assert.deepEqual(samples.map(s=>s.face),[0,1,2,3,4,5]);
 assert.ok(samples.every(s=>s.u===.5&&s.v===.5));
});
test('furnace sandstone spruce and chest use their own face textures',()=>{
 assert.equal(tileForBlock(BLOCK.FURNACE,[1,0,0]),36);
 assert.equal(tileForBlock(BLOCK.FURNACE,[0,1,0]),37);
 assert.equal(tileForBlock(BLOCK.FURNACE,[0,0,1]),31);
 assert.equal(tileForBlock(BLOCK.SANDSTONE,[0,1,0]),38);
 assert.equal(tileForBlock(BLOCK.SANDSTONE,[0,-1,0]),39);
 assert.equal(tileForBlock(BLOCK.SPRUCE_LOG,[0,1,0]),40);
 assert.equal(tileForBlock(BLOCK.CHEST,[0,0,1]),43);
});
