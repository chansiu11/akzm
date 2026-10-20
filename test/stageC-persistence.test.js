import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEntityRecords} from '../src/entity-save.js';
import {normalizeDropRecords} from '../src/drop-save.js';
import {restoreInventory,replenishOverflow} from '../src/inventory-restore.js';
import {BLOCK} from '../src/block-registry.js';
test('entity save persists safe positions, unique IDs, combat health, and rejects invalid entities',()=>{
 const data=normalizeEntityRecords([
  {id:1,kind:'wanderer',x:20,y:74,z:-3,health:7,heading:.2},
  {id:1,kind:'wanderer',x:21,y:74,z:-3,health:7},
  {id:2,kind:'unknown',x:1,y:3,z:2,health:3},
  {id:3,kind:'grazer',x:1,y:4,z:5,health:0},
 ]);
 assert.equal(data.length,1);assert.equal(data[0].health,7);assert.equal(data[0].heading,.2);
});
test('dropped item state survives save, with age, quantity, and input validation',()=>{
 const data=normalizeDropRecords([{id:BLOCK.COBBLE,x:.5,y:70,z:1,count:28,age:3},{id:99999,x:3,y:3,z:3,count:1},{id:BLOCK.STONE,x:3,y:3,z:3,count:1,age:300}]);
 assert.deepEqual(data,[{id:BLOCK.COBBLE,x:.5,y:70,z:1,count:28,age:3}]);
});
test('legacy stacks are split by item stack limits rather than lost',()=>{
 const {slots,overflow}=restoreInventory([{id:BLOCK.STONE,count:500},{id:110,count:20,damage:5}]);
 assert.equal(slots.filter(s=>s.id===BLOCK.STONE).reduce((a,s)=>a+s.count,0),500);
 assert.equal(slots.filter(s=>s.id===110).reduce((a,s)=>a+s.count,0),20);
 assert.ok(slots.every(s=>s.count<=((s.id===110)?1:64)));assert.equal(overflow.length,0);
 assert.ok(slots.filter(s=>s.id===110).every(s=>s.damage===5));
});
test('legacy overflow remains saveable if inventory is full and is reclaimed when freed',()=>{
 const raw=Array.from({length:36},()=>({id:BLOCK.STONE,count:64}));raw[0].count=500;
 const {slots,overflow}=restoreInventory(raw);
 assert.equal(slots.length,36);assert.ok(overflow.some(v=>v.id===BLOCK.STONE));
 const remaining=overflow[0].count;slots[1]={id:0,count:0};
 assert.equal(replenishOverflow(slots,overflow),Math.min(64,remaining));
 assert.equal(slots[1].count,64);
});
