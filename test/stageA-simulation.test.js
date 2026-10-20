import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldAdvanceWorld,canControlPlayer} from '../src/simulation-state.js';
test('world continues when gameplay GUI takes control but not when paused or exited',()=>{
 assert.equal(shouldAdvanceWorld({enteredWorld:true,paused:false}),true);
 assert.equal(canControlPlayer({enteredWorld:true,paused:false,inventoryOpen:true}),false);
 assert.equal(shouldAdvanceWorld({enteredWorld:true,paused:true}),false);
 assert.equal(shouldAdvanceWorld({enteredWorld:false,paused:false}),false);
 assert.equal(shouldAdvanceWorld({enteredWorld:true,paused:false,dead:true}),false);
});
test('command input does not stop active world ticks or accept movement',()=>{
 assert.equal(shouldAdvanceWorld({enteredWorld:true,paused:false}),true);
 assert.equal(canControlPlayer({enteredWorld:true,paused:false,commandOpen:true}),false);
});
