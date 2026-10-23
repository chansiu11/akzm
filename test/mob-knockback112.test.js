import test from 'node:test';
import assert from 'node:assert/strict';
import {applyMobKnockback112,stepMobKnockback112} from '../src/mob-knockback112.js';
test('mob is knocked away from attacker and slows naturally',()=>{
 const mob={x:2,y:65,z:0};
 assert.equal(applyMobKnockback112(mob,{x:0,z:0}),true);
 const initial=mob.knockVX;assert.ok(initial>0);
 stepMobKnockback112(mob,.05,()=>false);
 assert.ok(mob.x>2);assert.ok(mob.knockVX<initial);
});
test('knockback respects a solid collision without moving through walls',()=>{
 const mob={x:.9,y:65,z:0};
 applyMobKnockback112(mob,{x:-2,z:0});
 stepMobKnockback112(mob,.05,(x)=>x>=1);
 assert.ok(mob.x<1);assert.equal(mob.knockVX,0);
});
test('zero-distance knockback never creates NaNs',()=>{
 const mob={x:0,y:0,z:0};
 assert.equal(applyMobKnockback112(mob,{x:0,z:0}),false);
 assert.equal(mob.knockVX,undefined);
});
