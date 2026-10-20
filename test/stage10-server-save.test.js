import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import {Session} from '../server/session.js';
import {readSessionState,writeSessionState} from '../server/state-store.js';
import {BLOCK} from '../src/block-registry.js';
test('private server world edits and sequence numbers persist between restarts',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'akzm-save-'));
 try{
  const filename=path.join(dir,'world-state.json'),a=new Session(123);
  assert.ok(a.join('a','Player1').ok);
  assert.ok(a.move('a',{x:10,y:180,z:10}).ok);
  assert.ok(a.edit('a',{x:10,y:180,z:11,block:BLOCK.STONE}).ok);
  assert.ok(writeSessionState(filename,a));
  const saved=readSessionState(filename);
  assert.equal(saved.seq,1);
  const b=new Session(999,saved);
  assert.equal(b.world.get(10,180,11),BLOCK.STONE);
  assert.equal(b.world.seed,123);
  assert.equal(b.seq,a.seq);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('missing and corrupted world files do not crash server state loading',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'akzm-save-'));
 try{
  const filename=path.join(dir,'world.json');assert.equal(readSessionState(filename),null);
  fs.writeFileSync(filename,'{broken json');assert.equal(readSessionState(filename),null);
  fs.writeFileSync(filename,'{}');assert.equal(readSessionState(filename),null);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
