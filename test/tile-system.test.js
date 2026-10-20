import test from 'node:test';import assert from 'node:assert/strict';
import {BLOCK,definition,normalizeState} from '../src/block-registry.js';
import {TileStore,processFurnace,depositOne,withdrawOne} from '../src/tile-data.js';
import {expandInventory,countItem} from '../src/inventory-utils.js';
import {World} from '../src/terrain.js';

test('interactive block IDs are append-only; existing block IDs remain stable',()=>{
 assert.equal(BLOCK.GRASS,1);assert.equal(BLOCK.CRAFTING_TABLE,17);assert.equal(BLOCK.EMERALD_ORE,28);
 assert.deepEqual([BLOCK.CHEST,BLOCK.FURNACE,BLOCK.LEVER,BLOCK.LAMP],[29,30,31,32]);
 assert.equal(definition(BLOCK.CHEST).interact,'chest');assert.equal(definition(BLOCK.FURNACE).interact,'furnace');
 assert.deepEqual(normalizeState(BLOCK.LEVER),{powered:false});
});
test('tile store creates and persists chest contents',()=>{
 const t=new TileStore(),ch=t.ensure(0,75,0,'chest');assert.equal(ch.slots.length,27);
 const v=expandInventory([{id:BLOCK.STONE,count:2}]);assert.equal(depositOne(ch.slots,0,v,0),true);assert.equal(v[0].count,1);
 assert.equal(new TileStore(t.save()).ensure(0,75,0,'chest').slots[0].id,BLOCK.STONE);
 assert.equal(withdrawOne(ch.slots,0,v),true);assert.equal(countItem(v,BLOCK.STONE),2);
 assert.equal(t.remove(0,75,0),true);assert.equal(t.save().length,0);
});
test('furnace cannot smelt without coal or ore, consumes fuel and produces output',()=>{
 const t=new TileStore().ensure(3,80,5,'furnace');assert.equal(processFurnace(t,20),false);
 t.input={id:BLOCK.IRON_ORE,count:1};assert.equal(processFurnace(t,20),false);
 t.fuel={id:100,count:1};assert.equal(processFurnace(t,5),false);
 assert.equal(processFurnace(t,5.1),true);assert.deepEqual(t.output,{id:101,count:1});
 assert.equal(t.input.id,0);assert.equal(t.fuel.count,0);
});
test('lever and lamp state can round-trip through world serialization',()=>{
 const w=new World(null,{seed:349});assert.equal(w.set(0,125,0,BLOCK.LAMP,{powered:true}),true);
 assert.equal(w.set(1,125,0,BLOCK.LEVER,{powered:true}),true);
 const second=new World(w.serialize());assert.deepEqual(second.getState(0,125,0),{powered:true});
});
