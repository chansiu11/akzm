import test from 'node:test';
import assert from 'node:assert/strict';
import {World,ruinOrigin,allowsEmeraldOre,GENERATOR_VERSION} from '../src/terrain.js';
import {BLOCK} from '../src/block-registry.js';
test('new generator removes independent ruin while preexisting gen 3 world keeps its structures',()=>{
 let origin=null;
 for(let cx=-10;cx<=10&&!origin;cx++)for(let cz=-10;cz<=10&&!origin;cz++)origin=ruinOrigin(cx,cz,2026);
 assert.ok(origin);
 const old=new World({generator:3,seed:2026,edits:[]});
 const now=new World(null,{seed:2026});
 assert.equal(GENERATOR_VERSION,4);
 assert.equal(old.generator,3);
 assert.equal(now.generator,4);
 assert.equal(old.get(origin.x+3,origin.y,origin.z+3),origin.block);
 assert.notEqual(now.get(origin.x+3,origin.y,origin.z+3),origin.block);
 const restored=new World(JSON.parse(JSON.stringify(old.serialize())));
 assert.equal(restored.generator,3);
 assert.equal(restored.get(origin.x+3,origin.y,origin.z+3),origin.block);
});
test('emerald generation is eligible only in mountain biome of the new custom generator',()=>{
 assert.equal(allowsEmeraldOre('mountains'),true);
 for(const biome of ['plains','forest','snowy','ocean','desert'])assert.equal(allowsEmeraldOre(biome),false);
});
test('new world version 4 round trips without damaging existing block edits',()=>{
 const world=new World(null,{seed:849102});
 assert.equal(world.set(17,200,34,BLOCK.GLASS),true);
 const copy=new World(JSON.parse(JSON.stringify(world.serialize())));
 assert.equal(copy.generator,4);
 assert.equal(copy.seed,849102);
 assert.equal(copy.get(17,200,34),BLOCK.GLASS);
 assert.equal(copy.get(11,26,-11),world.get(11,26,-11));
});
