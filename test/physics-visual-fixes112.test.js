import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bitmapTextSupported112} from '../src/bitmap-font112.js';
import {horizontalVelocity112,verticalVelocity112,MOVE_SPEED112,defaultRenderDistance112,sanitizeRenderDistance112,fogDistances112} from '../src/player-motion112.js';
import {faceLight} from '../src/voxel-light.js';

test('Korean labels never get hidden underneath unreadable owner bitmap font sprites',()=>{
 assert.equal(bitmapTextSupported112('Singleplayer'),true);
 assert.equal(bitmapTextSupported112('Minecraft Realms'),true);
 assert.equal(bitmapTextSupported112('싱글플레이'),false);
 assert.equal(bitmapTextSupported112('설정 · 완료'),false);
 assert.equal(bitmapTextSupported112('포션 2개'),false);
 const js=readFileSync(new URL('../src/bitmap-font112.js',import.meta.url),'utf8');
 assert.match(js,/clearBitmap\(node\);return/);
 assert.match(js,/node\.classList\.remove\('bitmap-label'\)/);
});
test('horizontal acceleration and friction gradually approach the desired speed',()=>{
 const accelerating=horizontalVelocity112(0,0,4.317,0,1/60,{ground:true});
 assert.ok(accelerating.x>0&&accelerating.x<4.317);
 const coast=horizontalVelocity112(4.317,0,0,0,1/30,{ground:true});
 assert.ok(coast.x>0&&coast.x<4.317);
 const flying=horizontalVelocity112(0,0,4.317,0,1/60,{ground:false});
 assert.ok(flying.x<accelerating.x);
 assert.equal(verticalVelocity112(0,.1),-3);
 assert.equal(verticalVelocity112(-38,.1),-38);
 assert.ok(MOVE_SPEED112.sprint>MOVE_SPEED112.walk);
});
test('new desktop distance reaches 10 chunks and fog tracks actual world render distance',()=>{
 assert.equal(defaultRenderDistance112(false),6);
 assert.equal(defaultRenderDistance112(true),4);
 assert.equal(sanitizeRenderDistance112(99,false),10);
 assert.equal(sanitizeRenderDistance112(99,true),6);
 assert.equal(sanitizeRenderDistance112(-3,false),2);
 const near=fogDistances112(3),far=fogDistances112(8);
 assert.ok(far.far>near.far*2);
 assert.ok(far.near<far.far);
});
test('new placements show a mesh immediately and reprioritize dirty chunks',()=>{
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(main,/function showPlacementPreview\(x,y,z\)/);
 assert.match(main,/showPlacementPreview\(nx,ny,nz\);track\('placed'\)/);
 assert.match(main,/const targets=\[\.\.\.meshes\.values\(\)\]\.flat\(\)\.concat/);
 assert.match(main,/enqueue\(cx,cz,urgent=false\)/);
 assert.match(main,/pending\.unshift\(\[cx,cz\]\)/);
 assert.match(main,/clearPlacementPreviews\(cx,cz\)/);
 assert.match(main,/progressChunk\(activeBuild,touchMode\?12:28\)/);
});
