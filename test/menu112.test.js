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

import {unicodeGlyphMetric} from '../src/bitmap-font112.js';
test('Unicode bitmap metrics crop the source glyph without its side bearing',()=>{
 assert.deepEqual(unicodeGlyphMetric(0x0f),{start:0,width:16});
 assert.deepEqual(unicodeGlyphMetric(0x37),{start:3,width:5});
 assert.deepEqual(unicodeGlyphMetric(0),{start:0,width:0});
});

import {titleLayout112} from '../src/title-layout112.js';
test('title scaling reserves a 320 by 240 logical viewport independently of touch HUD',()=>{
 assert.deepEqual(titleLayout112(1440,900),{scale:3,width:480,height:300,logoX:103,logoY:30,buttonX:140,buttonY:123});
 assert.equal(titleLayout112(390,844).scale,1);
 assert.equal(titleLayout112(844,390).scale,1);
 const odd=titleLayout112(1365,767);assert.equal(odd.width,455);assert.equal(odd.height,256);
});
