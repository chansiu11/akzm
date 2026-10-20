import test from 'node:test';import assert from 'node:assert/strict';import {Progression,GOALS} from '../src/progression.js';
test('progression grants goal only once after crossing threshold',()=>{
 const p=new Progression();assert.deepEqual(p.add('mined'),[GOALS[0]]);assert.deepEqual(p.add('mined'),[]);assert.equal(p.stats.mined,2);
});
test('progression saves and restores movement and unlocked goals',()=>{
 const p=new Progression();p.add('walked',499);assert.equal(p.unlocked.has('explorer'),false);p.add('walked',1);assert.equal(p.unlocked.has('explorer'),true);
 const q=new Progression(p.serialize());assert.equal(q.stats.walked,500);assert.equal(q.unlocked.has('explorer'),true);
 assert.deepEqual(q.add('invalid',999),[]);
});
