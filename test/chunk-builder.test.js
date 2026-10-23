import test from 'node:test';
import assert from 'node:assert/strict';
import {World,SEA_LEVEL} from '../src/terrain.js';
import {beginChunk,progressChunk} from '../src/chunk-builder.js';
import {visibleBlockQuads} from '../src/block-mesh.js';
import {definition} from '../src/block-registry.js';
test('incremental mesh equals direct one-chunk geometry across partial updates',()=>{
 const w=new World(null,{seed:2026});
 const task=beginChunk(w,0,0);
 let steps=0;
 while(!progressChunk(task,7)){steps++;assert.ok(steps<100);}
 assert.ok(steps>1);
 const full={opaque:[],cutout:[],glass:[],water:[]};
 for(let x=0;x<16;x++)for(let z=0;z<16;z++)for(let y=0;y<=w.columnTop(x,z);y++){
  const id=w.get(x,y,z),layer=definition(id)?.layer;
  if(full[layer])full[layer].push(...visibleBlockQuads(w,x,y,z));
 }
 for(const k of Object.keys(full)){
  assert.equal(task.layers[k].length,full[k].length,k);
  assert.deepEqual(task.layers[k],full[k],`different quads in ${k}`);
 }
});

test('full-cube neighbor fast path preserves contiguous stone face count',()=>{
 const world={getBlock(x,y,z){return {id:3,state:{}}}};
 const faces=visibleBlockQuads(world,0,0,0);
 assert.equal(faces.length,0,'Opaque stone fully surrounded by other solid cubes has no visible faces');
 const airWorld={getBlock(x,y,z){return {id:(x===0&&y===0&&z===0)?3:0,state:{}}}};
 assert.equal(visibleBlockQuads(airWorld,0,0,0).length,6);
});
