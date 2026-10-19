import test from 'node:test';
import assert from 'node:assert/strict';
import {ChunkWorld} from '../public/chunk-world.js';
import {attachTouchLook} from '../public/touch-look.js';
test('chunks reproduce across load order, negative coordinates, cache eviction and saved edits',()=>{
 const a=new ChunkWorld('expansion'),b=new ChunkWorld('expansion');a.limit=2;
 const original=a.chunk(-20,30).slice();a.chunk(100,100);a.chunk(101,100);assert.ok(a.chunks.size<=2);
 assert.deepEqual(a.chunk(-20,30),original);b.chunk(-19,30);assert.deepEqual(b.chunk(-20,30),original);
 a.set(-315,20,485,5);a.set(-314,10,485,0);
 const restored=new ChunkWorld('expansion','overworld',false,4,{edits:a.serialize()});
 assert.equal(restored.get(-315,20,485),5);assert.equal(restored.get(-314,10,485),0);assert.equal(restored.get(10000,0,-10000),20);
});
test('structure placement is repeatable, seed-dependent and stamps across chunks',()=>{
 const a=new ChunkWorld('structures'),b=new ChunkWorld('structures'),c=new ChunkWorld('different');
 const list=w=>{let out=[];for(let x=-3;x<4;x++)for(let z=-3;z<4;z++)out.push(...w.region(x,z));return out;};
 const candidates=list(a);assert.ok(candidates.length>10);assert.deepEqual(candidates,list(b));assert.notDeepEqual(candidates,list(c));
 for(const st of candidates){const [x,,z]=st.pos,cx=Math.floor(x/16),cz=Math.floor(z/16);assert.deepEqual(a.chunk(cx,cz),b.chunk(cx,cz));}
 assert.ok(a.structures.length>0);
});
test('touch look continues during multi-touch and resets only for its own pointer',()=>{
 const handlers={},deltas=[],canvas={addEventListener:(n,f)=>handlers[n]=f,setPointerCapture:()=>{}};
 let enabled=true;const reset=attachTouchLook(canvas,()=>enabled,(x,y)=>deltas.push([x,y]));
 const event=(id,x=0,y=0)=>({pointerId:id,clientX:x,clientY:y,preventDefault(){}});
 handlers.pointerdown(event(1,10,10));handlers.pointermove(event(1,20,15));handlers.pointerdown(event(2));handlers.pointerup(event(2));handlers.pointermove(event(1,30,25));
 assert.deepEqual(deltas,[[10,5],[10,10]]);handlers.pointercancel(event(1));handlers.pointermove(event(1,40,40));assert.equal(deltas.length,2);
 handlers.pointerdown(event(3));handlers.pointermove(event(3,5,5));reset();handlers.pointermove(event(3,10,10));assert.equal(deltas.length,3);
 enabled=false;handlers.pointerdown(event(4));handlers.pointermove(event(4,5,5));assert.equal(deltas.length,3);
});
