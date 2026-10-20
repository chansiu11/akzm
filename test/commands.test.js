import test from 'node:test';
import assert from 'node:assert/strict';
import {COMMANDS, blockFromName, coordinate, suggestions,activeHelp,executeCommand} from '../src/commands.js';
import {BLOCK} from '../src/terrain.js';
const state={time:1000,blocks:new Map(),pos:[5,12,8],cycle:true,particles:[]};
const ctx={position:()=>state.pos,getTime:()=>state.time,setTime:n=>state.time=n,teleport:(...coords)=>(state.pos=coords,true),
 setBlock:(x,y,z,id)=>(state.blocks.set(`${x},${y},${z}`,id),true),fill:(from,to,id)=>{let count=0;for(let x=from[0];x<=to[0];x++)for(let y=from[1];y<=to[1];y++)for(let z=from[2];z<=to[2];z++){state.blocks.set(`${x},${y},${z}`,id);count++}return count},
 getDaylightCycle:()=>state.cycle,setDaylightCycle:v=>state.cycle=v,particle:(...a)=>state.particles.push(a)};
test('1.8.9 command names and detailed hints are available',()=>{
 assert.ok(COMMANDS.find(c=>c.name==='particle').syntax.includes('<dx>'));
 assert.ok(suggestions('/ti').some(s=>s.insert.startsWith('/time')));
 assert.ok(suggestions('/time s').some(s=>s.insert.includes('set')));
 assert.equal(activeHelp('/setblock ~ ~ ~ st').name,'setblock');
});
test('coordinates and block IDs validate without executing arbitrary text',()=>{
 assert.equal(coordinate('~3',5),8);assert.equal(coordinate('~-1.5',5),3.5);assert.equal(coordinate('~',5),5);
 assert.throws(()=>coordinate('Infinity',5));assert.throws(()=>coordinate('notanumber',5));
 assert.equal(blockFromName('minecraft:stone'),BLOCK.STONE);assert.equal(blockFromName('missing'),null);
});
test('real time commands set/add/query and daylight rule',()=>{
 assert.equal(executeCommand('/time set day',ctx).ok,true);assert.equal(state.time,1000);
 assert.equal(executeCommand('/time add 500',ctx).ok,true);assert.equal(state.time,1500);
 assert.match(executeCommand('/time query daytime',ctx).message,/1500/);
 assert.equal(executeCommand('/gamerule doDaylightCycle false',ctx).ok,true);assert.equal(state.cycle,false);
});
test('teleport supports relative Java 1.8.9 coordinates',()=>{
 assert.equal(executeCommand('/tp ~2 ~1 ~-3',ctx).ok,true);assert.deepEqual(state.pos,[7,13,5]);
});
test('setblock and fill change the world and enforce limits',()=>{
 assert.equal(executeCommand('/setblock ~ ~-1 ~ minecraft:stone',ctx).ok,true);
 assert.equal(state.blocks.get('7,12,5'),BLOCK.STONE);
 assert.equal(executeCommand('/fill 1 1 1 2 2 2 dirt',ctx).ok,true);
 assert.equal(state.blocks.get('2,2,2'),BLOCK.DIRT);
 assert.equal(executeCommand('/fill 1 1 1 20 20 20 dirt',ctx).ok,false);
 assert.equal(executeCommand('/setblock 0 0 0 stone',ctx).ok,false);
});
test('particles work with old syntax; invalid commands do not mutate world',()=>{
 assert.equal(executeCommand('/particle flame ~ ~1 ~ 1 1 1 0.1 30',ctx).ok,true);
 assert.equal(state.particles[0][4],30);
 assert.equal(executeCommand('/particle unknown ~ ~ ~ 0 0 0 0 1',ctx).ok,false);
 assert.equal(executeCommand('/execute as @a run say hi',ctx).ok,false);
});
test('help and seed work',()=>{
 assert.match(executeCommand('/help time',ctx).message,/time/);
 assert.match(executeCommand('/seed',ctx).message,/18909/);
});
