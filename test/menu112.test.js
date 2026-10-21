import {readFileSync} from 'node:fs';
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

import {ownerBlockItemModelName,cleanGuiTransform112,readOwnerBlockGuiModels,blockIconPose112} from '../src/item-model112.js';
test('vanilla 1.12.2 variant names use the local model JSON for oak and spruce items',()=>{
 assert.equal(ownerBlockItemModelName({blockId:5,key:'minecraft:log'}),'oak_log');
 assert.equal(ownerBlockItemModelName({blockId:24,key:'minecraft:log'}),'spruce_log');
 assert.equal(ownerBlockItemModelName({blockId:15,key:'minecraft:wooden_slab'}),'oak_slab');
 assert.equal(ownerBlockItemModelName({blockId:16,key:'minecraft:oak_stairs'}),'oak_stairs');
 assert.equal(ownerBlockItemModelName({blockId:8,key:'minecraft:water'}),null);
});
test('owner model JSON inherits GUI pose through block parents without publishing assets',async()=>{
 const prefix='assets/minecraft/models/';
 const models={
  [prefix+'item/oak_stairs.json']:{parent:'block/oak_stairs'},
  [prefix+'block/oak_stairs.json']:{parent:'block/stairs'},
  [prefix+'block/stairs.json']:{display:{gui:{rotation:[30,135,0],translation:[0,0,0],scale:[.625,.625,.625]}}},
  [prefix+'item/grass.json']:{parent:'block/grass_normal'},
  [prefix+'block/grass_normal.json']:{parent:'block/block'},
  [prefix+'block/block.json']:{display:{gui:{rotation:[30,225,0],translation:[0,0,0],scale:[.625,.625,.625]}}}
 };
 const zip={file:path=>models[path]?{async:async()=>JSON.stringify(models[path])}:null};
 const loaded=await readOwnerBlockGuiModels(zip,[{id:16,blockId:16,key:'minecraft:oak_stairs'},{id:1,blockId:1,key:'minecraft:grass'}]);
 assert.deepEqual(loaded[16].rotation,[30,135,0]);
 assert.deepEqual(loaded[1].rotation,[30,225,0]);
 assert.deepEqual(blockIconPose112(loaded[1]).rotation,[30,45,0]);
 assert.deepEqual(blockIconPose112(loaded[16]).rotation,[30,135,0]);
 assert.deepEqual(blockIconPose112(loaded[16]).scale,[1,1,1]);
 assert.equal(cleanGuiTransform112({rotation:['x',0,0],translation:[0,0,0],scale:[1,1,1]}),null);
});
test('restoring cached owner JAR recomputes local GUI models',async()=>{
 const {PRIVATE_RESOURCE_VERSION}=await import('../src/private-resource-cache.js');
 assert.equal(PRIVATE_RESOURCE_VERSION,'112-menu-font-atlas6-v5');
});

import {panoramaAngles112} from '../src/menu112-assets.js';
test('vanilla 1.12.2 panorama rotates two degrees per second',()=>{
 const a=panoramaAngles112(0),b=panoramaAngles112(1);
 assert.ok(Math.abs(a.pitch-20*Math.PI/180)<1e-9);
 assert.ok(Math.abs(b.yaw+2*Math.PI/180)<1e-9);
 assert.ok(Math.abs(panoramaAngles112(-5).yaw)<1e-12);
});
test('title includes owner-local language button at vanilla bottom row and functional settings',()=>{
 const css=readFileSync(new URL('../menu112.css',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const menu=readFileSync(new URL('../src/menu.js',import.meta.url),'utf8');
 assert.match(html,/id="menuLanguage"/);assert.match(html,/id="menuLanguageSelect"/);
 assert.match(css,/title-language-y/);assert.match(css,/margin-top:calc\(12px/);
 assert.match(css,/-106px/);assert.match(css,/-126px/);
 assert.match(menu,/menuLanguageSelect/);
});
