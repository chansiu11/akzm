import test from 'node:test';
import assert from 'node:assert/strict';
import {lookDelta,joystickDelta} from '../src/touch.js';
import {findTexturePath,REQUIRED_TILES} from '../src/resource-pack.js';

test('touch dragging changes yaw and pitch consistently with mouse',()=>{
 const a=lookDelta(0,0,100,-50,.0035);
 assert.ok(a.yaw<0);assert.ok(a.pitch>0);
 assert.ok(lookDelta(0,0,0,3000).pitch>-Math.PI/2);
 assert.ok(lookDelta(0,0,0,-3000).pitch<Math.PI/2);
});
test('virtual stick motion stays within -1...1 and up moves forward',()=>{
 const a=joystickDelta(0,-300);assert.equal(a.forward,1);assert.equal(a.strafe,0);
 const b=joystickDelta(100,100);assert.ok(Math.hypot(b.strafe,b.forward)<=1.00001);
});
test('vanilla JAR texture and nested resource pack paths resolve',()=>{
 const raw=['assets/minecraft/textures/blocks/grass_top.png','nested/assets/minecraft/textures/blocks/stone.png'];
 assert.equal(findTexturePath(raw,'grass_top'),raw[0]);
 assert.equal(findTexturePath(raw,'stone'),raw[1]);
 assert.equal(findTexturePath(raw,'nonexistent'),null);
 assert.equal(REQUIRED_TILES.length,34);
});
