import test from 'node:test';
import assert from 'node:assert/strict';
import {World, BLOCK, heightAt, naturalBlock, SEA_LEVEL, MAX_Y} from '../src/terrain.js';
test('terrain is repeatable and always within bounds',()=>{for(let x=-50;x<=50;x+=5)for(let z=-50;z<=50;z+=5){assert.equal(heightAt(x,z),heightAt(x,z));assert.ok(heightAt(x,z)>1&&heightAt(x,z)<MAX_Y);assert.equal(naturalBlock(x,0,z),BLOCK.BEDROCK)}});
test('world edit, reset, save, restore',()=>{const w=new World();const original=w.get(1,15,1);assert.equal(w.set(1,15,1,BLOCK.BRICK),true);assert.equal(w.get(1,15,1),BLOCK.BRICK);const clone=new World(w.serialize());assert.equal(clone.get(1,15,1),BLOCK.BRICK);w.set(1,15,1,original);assert.equal(w.changes.size,0)});
test('invalid edits rejected',()=>{let w=new World();assert.equal(w.set(0,0,0,BLOCK.STONE),false);assert.equal(w.set(0,MAX_Y+1,0,BLOCK.STONE),false);assert.equal(w.set(0,5,0,555),false)});
test('water occupies low basins',()=>{let found=false;for(let x=-80;x<80;x++)for(let z=-80;z<80;z++)if(heightAt(x,z)<SEA_LEVEL){found=true;assert.equal(naturalBlock(x,SEA_LEVEL,z),BLOCK.WATER);break;}assert.ok(found)});
