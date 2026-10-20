import test from 'node:test';
import assert from 'node:assert/strict';
import {blockBoxes,renderBoxes,BLOCK} from '../src/block-registry.js';
import {visibleBlockQuads} from '../src/block-mesh.js';
import {precipitationType} from '../src/precipitation.js';
test('lever renders as a post but does not block player collisions',()=>{
 assert.deepEqual(blockBoxes(BLOCK.LEVER),[]);
 assert.equal(renderBoxes(BLOCK.LEVER).length,1);
 const world={getBlock(x,y,z){return {id:x===0&&y===50&&z===0?BLOCK.LEVER:BLOCK.AIR,state:{}}}};
 assert.equal(visibleBlockQuads(world,0,50,0).length,6);
});
test('rain is blocked below roof, absent in desert, and snow in snowy biomes',()=>{
 const world={columnTop:()=>80,biome:()=> 'plains'};
 assert.equal(precipitationType(world,1,70,2,'rain'),'none');
 assert.equal(precipitationType(world,1,84,2,'rain'),'rain');
 assert.equal(precipitationType({...world,biome:()=> 'desert'},1,84,2,'rain'),'none');
 assert.equal(precipitationType({...world,biome:()=> 'snowy'},1,84,2,'rain'),'snow');
 assert.equal(precipitationType(world,1,84,2,'clear'),'none');
});
test('world height tracks a placed roof and lowers again after removal',async()=>{
 const {World}=await import('../src/terrain.js');const w=new World(null,{seed:18909});
 const x=120,z=120,base=w.columnTop(x,z),y=200;
 assert.ok(base<y);
 assert.equal(w.set(x,y,z,BLOCK.STONE),true);assert.equal(w.columnTop(x,z),y);
 assert.equal(w.set(x,y,z,BLOCK.AIR),true);assert.equal(w.columnTop(x,z),base);
});
test('legacy saved worlds report their real terrain height, not a fixed y=35',async()=>{
 const {World}=await import('../src/terrain.js');const w=new World({generator:1,seed:18909,edits:[]});
 assert.ok(w.columnTop(80,80)<35);
 const base=w.columnTop(80,80);
 assert.equal(w.set(80,30,80,BLOCK.STONE),true);
 assert.equal(w.columnTop(80,80),30);
 assert.equal(w.set(80,30,80,BLOCK.AIR),true);
 assert.equal(w.columnTop(80,80),base);
});
