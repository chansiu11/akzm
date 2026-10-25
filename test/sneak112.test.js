import test from 'node:test';
import assert from 'node:assert/strict';
import {sneakMovement112,playerEyeHeight112} from '../src/player-motion112.js';
import {playerCollides} from '../src/player-spawn.js';
import {BLOCK} from '../src/terrain.js';
const world={getBlock:(x,y,z)=>({id:y===0&&x===0&&z===0?BLOCK.STONE:0,state:{}})};
test('grounded sneaking retains support at a block edge in every direction',()=>{
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]]){
  const supported=(x,z)=>playerCollides(world,.5+x,0,.5+z);
  const m=sneakMovement112(dx,dz,{active:true,supported});
  assert.ok(supported(m.x,m.z));
  assert.ok(Math.hypot(m.x,m.z)<Math.hypot(dx,dz));
 }
});
test('walking, jumping and flying do not acquire edge protection',()=>{
 assert.deepEqual(sneakMovement112(1,1,{active:false,supported:()=>false}),{x:1,z:1});
});
test('supported floor motion is unchanged and unsupported motion terminates at zero',()=>{
 assert.deepEqual(sneakMovement112(.03,-.03,{active:true,supported:()=>true}),{x:.03,z:-.03});
 assert.deepEqual(sneakMovement112(.03,-.03,{active:true,supported:()=>false}),{x:0,z:0});
});
test('legacy crouching lowers eye height and releasing restores it',()=>{
 assert.equal(playerEyeHeight112(true),1.54);
 assert.equal(playerEyeHeight112(false),1.62);
});
