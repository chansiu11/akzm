import test from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../server/session.js';
import {BLOCK} from '../src/terrain.js';
test('session limits participants, refuses malformed names and stores a stable seed',()=>{
 const s=new Session(444);assert.equal(s.join('a','Player1').ok,true);assert.equal(s.join('a','Player1').ok,false);
 assert.equal(s.join('b','<x>').ok,false);assert.equal(s.snapshot().seed,444);
});
test('session rejects invalid edits and movement outside plausible range',()=>{
 const s=new Session(33);s.join('a','A');
 assert.equal(s.move('a',{x:1,y:120,z:1},1000).ok,true);
 assert.equal(s.move('a',{x:999,y:120,z:999},1001).ok,false);
 assert.equal(s.edit('a',{x:1,y:0,z:1,block:BLOCK.STONE}).ok,false);
 assert.equal(s.edit('a',{x:100,y:120,z:100,block:BLOCK.STONE}).ok,false);
});
test('session accepts a nearby valid block change and sequences events',()=>{
 const s=new Session(33);s.join('a','A');s.move('a',{x:1,y:120,z:1},1000);
 const r=s.edit('a',{x:1,y:120,z:1,block:BLOCK.GLASS});assert.equal(r.ok,true);assert.equal(r.event.seq,1);
 assert.equal(s.snapshot().seq,1);assert.equal(s.world.get(1,120,1),BLOCK.GLASS);s.leave('a');assert.equal(s.players.size,0);
});
