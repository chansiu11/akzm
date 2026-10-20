import test from 'node:test';
import assert from 'node:assert/strict';
import {TileStore,processFurnace} from '../src/tile-data.js';
import {normalizeDropRecords,dropExpired} from '../src/drop-save.js';
import {BLOCK} from '../src/block-registry.js';

test('burning furnace consumes fuel time while input is temporarily empty',()=>{
 const f=new TileStore().ensure(1,110,1,'furnace');f.burn=70;
 assert.equal(processFurnace(f,10),false);assert.equal(f.burn,60);
});
test('blocked output does not stop active fuel countdown',()=>{
 const f=new TileStore().ensure(1,110,1,'furnace');f.burn=30;f.input={id:BLOCK.IRON_ORE,count:1};f.output={id:101,count:64};
 assert.equal(processFurnace(f,10),false);assert.equal(f.burn,20);assert.equal(f.input.count,1);
});
test('one large tick cannot smelt more than available fuel or inputs',()=>{
 const f=new TileStore().ensure(1,110,1,'furnace');f.input={id:BLOCK.IRON_ORE,count:4};f.fuel={id:100,count:1};
 assert.equal(processFurnace(f,42),true);assert.deepEqual(f.output,{id:101,count:4});assert.equal(f.burn,38);
 assert.equal(processFurnace(f,40),false);assert.equal(f.burn,0);assert.equal(f.fuel.count,0);
});
test('no new fuel is ignited when smelting has no work',()=>{
 const f=new TileStore().ensure(1,110,1,'furnace');f.fuel={id:100,count:2};
 assert.equal(processFurnace(f,80),false);assert.equal(f.fuel.count,2);assert.equal(f.burn,0);
});
test('expiry check is independent from item collection and damage survives serialization',()=>{
 assert.equal(dropExpired(300),true);assert.equal(dropExpired(299.99),false);
 const d=normalizeDropRecords([{id:114,x:3,y:70,z:3,count:1,age:22,damage:88},{id:114,x:1,y:70,z:1,count:1,age:301}]);
 assert.deepEqual(d,[{id:114,x:3,y:70,z:3,count:1,age:22,damage:88}]);
});
import {depositOne,withdrawOne,tileDrops} from '../src/tile-data.js';
import {expandInventory} from '../src/inventory-utils.js';

test('damaged pickaxe retains durability while deposited, removed and dropped from chest',()=>{
 const chest=new TileStore().ensure(2,80,1,'chest');
 const inv=expandInventory([{id:112,count:1,damage:199}]);
 assert.equal(depositOne(chest.slots,0,inv,0),true);
 assert.deepEqual(chest.slots[0],{id:112,count:1,damage:199});
 assert.deepEqual(tileDrops(chest),[{id:112,count:1,damage:199}]);
 assert.equal(inv[0].id,0);assert.equal(Object.hasOwn(inv[0],'damage'),false);
 assert.equal(withdrawOne(chest.slots,0,inv),true);
 assert.deepEqual(inv[0],{id:112,count:1,damage:199});
 assert.equal(chest.slots[0].id,0);assert.equal(Object.hasOwn(chest.slots[0],'damage'),false);
});
test('nonstackable tools cannot stack into same chest slot',()=>{
 const chest=new TileStore().ensure(2,80,1,'chest');
 const inv=expandInventory([{id:112,count:1,damage:10},{id:112,count:1,damage:100}]);
 assert.equal(depositOne(chest.slots,0,inv,0),true);
 assert.equal(depositOne(chest.slots,0,inv,1),false);
 assert.deepEqual(chest.slots[0],{id:112,count:1,damage:10});
});
