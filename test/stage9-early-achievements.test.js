import test from 'node:test';
import assert from 'node:assert/strict';
import {Progression,GOALS} from '../src/progression.js';
test('inventory -> wood -> crafting table -> pickaxe dependency chain',()=>{
 const p=new Progression();
 assert.equal(p.add('woodMined').some(a=>a.id==='getting_wood'),false);
 assert.deepEqual(p.add('openedInventory').map(a=>a.id),['taking_inventory','getting_wood']);
 assert.equal(p.add('craftedPickaxe').some(a=>a.id==='time_to_mine'),false);
 assert.deepEqual(p.add('craftedTable').map(a=>a.id),['benchmarking','time_to_mine']);
 for(const name of ['taking_inventory','getting_wood','benchmarking','time_to_mine'])assert.ok(p.unlocked.has(name));
 const saved=JSON.parse(JSON.stringify(p.serialize()));
 assert.equal(new Progression(saved).unlocked.has('time_to_mine'),true);
});
test('existing custom progression stats and old save keys remain supported',()=>{
 const p=new Progression({stats:{mined:10},unlocked:['first_block']});
 assert.equal(p.stats.mined,10);
 assert.equal(p.stats.openedInventory,0);
 assert.deepEqual(p.add('mined'),[]);
 assert.equal(GOALS[0].id,'first_block');
});
