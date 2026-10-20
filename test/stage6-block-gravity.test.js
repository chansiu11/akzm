import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/terrain.js';
import {BLOCK} from '../src/block-registry.js';
import {isFallingBlock,createGravityTicks} from '../src/block-gravity.js';
test('sand and gravel are falling blocks but ordinary stone is not',()=>{
 assert.ok(isFallingBlock(BLOCK.SAND));assert.ok(isFallingBlock(BLOCK.GRAVEL));
 assert.equal(isFallingBlock(BLOCK.STONE),false);
});
test('unsupported sand descends in ticks and stops on solid floor',()=>{
 const w=new World(null,{seed:40}),x=10,y=180,z=11;
 w.set(x,y-2,z,BLOCK.STONE);w.set(x,y-1,z,BLOCK.AIR);
 w.set(x,y,z,BLOCK.SAND);
 let callbacks=0;
 const gravity=createGravityTicks(w,()=>callbacks++);
 gravity.notifyChange(x,y,z);
 assert.equal(gravity.tick(.1),0);
 assert.equal(gravity.tick(.05),1);
 assert.equal(w.get(x,y,z),BLOCK.AIR);
 assert.equal(w.get(x,y-1,z),BLOCK.SAND);
 assert.equal(gravity.tick(.15),0);
 assert.equal(callbacks,1);
});
test('removing a support activates the gravity block above',()=>{
 const w=new World(null,{seed:40}),x=12,y=180,z=12;
 w.set(x,y,z,BLOCK.STONE);w.set(x,y+1,z,BLOCK.GRAVEL);
 const gravity=createGravityTicks(w);
 assert.equal(gravity.tick(.2),0);
 w.set(x,y,z,BLOCK.AIR);gravity.notifyChange(x,y,z);
 assert.equal(gravity.tick(.15),1);
 assert.equal(w.get(x,y,z),BLOCK.GRAVEL);
});
test('gravity edits survive saving and restored worlds',()=>{
 const w=new World(null,{seed:40});w.set(2,180,2,BLOCK.SAND);
 w.set(2,179,2,BLOCK.AIR);
 const gravity=createGravityTicks(w);gravity.notifyChange(2,180,2);gravity.tick(.15);
 const reopened=new World(JSON.parse(JSON.stringify(w.serialize())));
 assert.equal(reopened.get(2,179,2),BLOCK.SAND);
 assert.equal(reopened.get(2,180,2),BLOCK.AIR);
});

test('queued falling blocks over the processing limit remain queued for later ticks',()=>{
 const w=new World(null,{seed:40}),g=createGravityTicks(w);
 for(let x=0;x<4;x++){w.set(x,180,11,BLOCK.SAND);g.notifyChange(x,180,11);}
 assert.equal(g.tick(.15,2),2);assert.ok(g.queued()>0);
 assert.equal(g.tick(.15,2),2);
 assert.equal([0,1,2,3].filter(x=>w.get(x,179,11)===BLOCK.SAND||w.get(x,178,11)===BLOCK.SAND).length,4);
});
