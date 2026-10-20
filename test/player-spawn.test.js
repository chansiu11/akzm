import test from 'node:test';
import assert from 'node:assert/strict';
import {World,BLOCK} from '../src/terrain.js';
import {findSafeSpawn,playerCollides,restoreSafePlayerPosition,obstructingBlockTarget,safeStanding} from '../src/player-spawn.js';

test('new worlds choose a collision-free position with support',()=>{
 for(const seed of [1,18909,123456,9999]){
  const w=new World(null,{seed});const s=findSafeSpawn(w);
  assert.equal(playerCollides(w,s.x,s.y,s.z),false,`seed ${seed}`);
  assert.equal(safeStanding(w,s.x,s.y,s.z),true,`seed ${seed}`);
 }
});

test('trapped saved player is moved to a safe position without changing world blocks',()=>{
 const w=new World(null,{seed:18909});const spot=findSafeSpawn(w);
 assert.equal(w.set(Math.floor(spot.x),spot.y,Math.floor(spot.z),BLOCK.STONE),true);
 assert.equal(playerCollides(w,spot.x,spot.y,spot.z),true);
 const before=w.serialize();
 const restored=restoreSafePlayerPosition(w,spot);
 assert.equal(playerCollides(w,restored.x,restored.y,restored.z),false);
 assert.deepEqual(w.serialize(),before);
});

test('safe cave saved position remains unchanged',()=>{
 const w=new World(null,{seed:18909});const s=findSafeSpawn(w);
 assert.deepEqual(restoreSafePlayerPosition(w,s),s);
});

test('block inside player body is mineable by emergency target lookup',()=>{
 const w=new World(null,{seed:18909});const s=findSafeSpawn(w);
 w.set(Math.floor(s.x),s.y+1,Math.floor(s.z),BLOCK.STONE);
 const t=obstructingBlockTarget(w,s,{x:1,y:0,z:0});
 assert.equal(t?.id,BLOCK.STONE);assert.equal(t?.emergency,true);
 assert.equal(w.set(t.x,t.y,t.z,BLOCK.AIR),true);
 assert.equal(obstructingBlockTarget(w,s),null);
});

test('bedrock and water are never emergency mining targets',()=>{
 const w=new World(null,{seed:18909});const s=findSafeSpawn(w);
 w.set(Math.floor(s.x),s.y,Math.floor(s.z),BLOCK.WATER);
 assert.equal(obstructingBlockTarget(w,s),null);
});
