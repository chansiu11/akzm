import test from 'node:test';
import assert from 'node:assert/strict';
import {shootTowards,stepProjectile} from '../src/projectile-physics.js';
test('shooter creates a moving projectile aimed toward the player',()=>{
 const arrow=shootTowards({x:0,y:71,z:0},{x:5,y:71,z:0});
 assert.ok(arrow.vx>0);assert.ok(Math.abs(arrow.vz)<.001);
 let result=null;for(let i=0;i<80&&!result;i++)result=stepProjectile(arrow,.05,()=>false,{x:5,y:70,z:0});
 assert.equal(result,'player');
});
test('a solid wall intercepts a projectile before it reaches the target',()=>{
 const arrow=shootTowards({x:0,y:71,z:0},{x:5,y:71,z:0});
 let result=null;
 for(let i=0;i<80&&!result;i++)result=stepProjectile(arrow,.05,(x)=>x===2,{x:5,y:70,z:0});
 assert.equal(result,'block');
 assert.ok(arrow.x<3);
});
test('projectile eventually expires and invalid time never mutates its state',()=>{
 const arrow=shootTowards({x:0,y:71,z:0},{x:0,y:71,z:0});
 const initial={...arrow};assert.equal(stepProjectile(arrow,-1,()=>false,null),null);assert.deepEqual(arrow,initial);
 let result=null;for(let i=0;i<120&&!result;i++)result=stepProjectile(arrow,.05,()=>false,null);
 assert.equal(result,'expired');
});
