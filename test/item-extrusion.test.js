import test from 'node:test';
import assert from 'node:assert/strict';
import {extrudeItemPixels,skinRectUV,RIGHT_ARM_UV_RECTS} from '../src/item-extrusion.js';
const pixels=rows=>{const data=new Uint8Array(rows.length*rows[0].length*4);rows.flat().forEach((a,i)=>data[i*4+3]=a?255:0);return data;};
test('isolated opaque texel has front back and four sides with 1/16 depth',()=>{
 const g=extrudeItemPixels(1,1,pixels([[1]]));assert.equal(g.indices.length,36);
 const z=g.positions.filter((_,i)=>i%3===2);assert.equal(Math.max(...z)-Math.min(...z),1/16);
 assert.ok(g.uvs.every(v=>v>=0&&v<=1));
});
test('adjacent pixels omit interior edges while holes retain their boundary',()=>{
 assert.equal(extrudeItemPixels(2,1,pixels([[1,1]])).indices.length/6,8);
 assert.equal(extrudeItemPixels(3,3,pixels([[1,1,1],[1,0,1],[1,1,1]])).indices.length/6,18);
 assert.equal(extrudeItemPixels(1,1,pixels([[0]])).indices.length/6,2);
});
test('right arm uses six separate skin rectangles within the source atlas',()=>{
 assert.equal(RIGHT_ARM_UV_RECTS.length,6);
 for(const rect of RIGHT_ARM_UV_RECTS)assert.ok(skinRectUV(rect).flat().every(v=>v>=0&&v<=1));
 assert.deepEqual(skinRectUV([44,20,48,32]),[[44/64,44/64],[48/64,44/64],[44/64,.5],[48/64,.5]]);
});
