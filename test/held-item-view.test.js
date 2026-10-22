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

test('all fifteen legacy mining tools use handheld meshes, never block cubes',()=>{
 for(let id of [110,111,112,113,114,117,118,119,120,121,122,123,124,125,126])
  assert.equal(heldItemView(id).kind,'tool','tool id '+id);
});
import {cleanHeldTransform112,readOwnerFirstPersonModels112,firstPersonPose112} from '../src/item-model112.js';
test('the user-owned 1.12.2 JSON handheld display is resolved through parent inheritance',async()=>{
 const prefix='assets/minecraft/models/';
 const models={
  [prefix+'item/iron_axe.json']:{parent:'item/handheld'},
  [prefix+'item/handheld.json']:{parent:'item/generated',
   display:{firstperson_righthand:{rotation:[0,-90,25],translation:[1.13,3.2,1.13],scale:[.68,.68,.68]}}},
  [prefix+'item/oak_planks.json']:{parent:'block/oak_planks'},
  [prefix+'block/oak_planks.json']:{parent:'block/block'},
  [prefix+'block/block.json']:{display:{firstperson_righthand:{rotation:[0,45,0],translation:[0,0,0],scale:[.4,.4,.4]}}}
 };
 const zip={file:path=>models[path]?{async:async()=>JSON.stringify(models[path])}:null};
 const poses=await readOwnerFirstPersonModels112(zip,[
  {id:119,blockId:null,key:'minecraft:iron_axe'},
  {id:7,blockId:7,key:'minecraft:planks'}]);
 assert.deepEqual(poses[119].rotation,[0,-90,25]);
 assert.deepEqual(poses[7].rotation,[0,45,0]);
 assert.deepEqual(firstPersonPose112(poses[7]).scale,[1,1,1]);
 assert.deepEqual(firstPersonPose112(poses[119],{item:true}).scale,[1,1,1]);
 assert.ok(firstPersonPose112(poses[119],{item:true}).rotation.every(Number.isFinite));
});
test('invalid/unsafe owner display transforms are rejected',()=>{
 assert.equal(cleanHeldTransform112({scale:[-1,1,1]}),null);
 assert.equal(cleanHeldTransform112({rotation:[Number.NaN,0,0]}),null);
 assert.equal(cleanHeldTransform112({translation:[Infinity,0,0]}),null);
 assert.deepEqual(cleanHeldTransform112({rotation:[0,45,0]}),{
  rotation:[0,45,0],translation:[0,0,0],scale:[1,1,1]
 });
});

test('first-person viewport uses locally imported owner model metadata without an oversized held block',async()=>{
 const {readFileSync}=await import('node:fs');
 const renderer=readFileSync(new URL('../src/first-person.js',import.meta.url),'utf8');
 const importer=readFileSync(new URL('../src/gui112-assets.js',import.meta.url),'utf8');
 assert.match(renderer,/function setOwnerModels\(heldTransforms=\{\},blockModels=\{\}\)/);
 assert.match(renderer,/ownerBlockQuads112\(elements\)/);
 assert.match(renderer,/nativeBlock\?\.28:1/);
 assert.match(renderer,/ownerHeldTransforms\[view\.id\]/);
 assert.match(renderer,/arm\.rotation\.z=view\.kind==='empty' \? -\.12 : -\.19/);
 assert.match(importer,/a\.firstPersonModels=await readOwnerFirstPersonModels112\(zip,ITEM_DEFS\)/);
});
