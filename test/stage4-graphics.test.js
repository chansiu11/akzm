import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/terrain.js';
import {BLOCK} from '../src/block-registry.js';
import {activeLampsNear,faceLight,unblockedLightRay,createChunkLight} from '../src/voxel-light.js';
import {uvFor} from '../src/atlas.js';
import {waterQuadUV,waterTileRegion} from '../src/water-visuals.js';
const quad=(x,y,z,dir=[0,1,0])=>({x,y,z,d:dir,v:[[0,1,0],[1,1,0],[1,1,1],[0,1,1]]});
test('sky-exposed face brighter than the same face below an opaque roof',()=>{
 const w=new World(null,{seed:17});const x=6,z=8;
 w.set(x,180,z,BLOCK.STONE);
 const shade=faceLight(w,quad(x,179,z));
 const sun=faceLight(w,quad(x,180,z));
 assert.ok(sun[0]>shade[0]*2,`sun ${sun[0]} vs shade ${shade[0]}`);
});
test('powered lamp lights nearby faces and off lamp no longer emits',()=>{
 const w=new World(null,{seed:17});w.set(3,180,3,BLOCK.LAMP,{powered:true});w.set(3,185,4,BLOCK.STONE);
 const face=quad(3,181,4),sources=activeLampsNear(w,0,0);
 assert.equal(sources.length,1);
 const lit=faceLight(w,face,sources),dark=faceLight(w,face,[]);
 assert.ok(lit[0]>dark[0]);
 w.set(3,180,3,BLOCK.LAMP,{powered:false});
 assert.equal(activeLampsNear(w,0,0).length,0);
});
test('opaque block prevents artificial lamp light leaking through a wall',()=>{
 const w=new World(null,{seed:17});
 w.set(2,180,2,BLOCK.STONE);
 assert.equal(unblockedLightRay(w,{x:1.5,y:180.5,z:2.5},{x:3.5,y:180.5,z:2.5}),false);
 w.set(2,180,2,BLOCK.GLASS);
 assert.equal(unblockedLightRay(w,{x:1.5,y:180.5,z:2.5},{x:3.5,y:180.5,z:2.5}),true);
});
test('lamp discovery only reads nearby, powered edits',()=>{
 const w=new World(null,{seed:17});
 w.set(0,180,0,BLOCK.LAMP,{powered:true});
 w.set(500,180,0,BLOCK.LAMP,{powered:true});
 w.set(1,180,1,BLOCK.LAMP,{powered:false});
 assert.equal(activeLampsNear(w,0,0).length,1);
 const paint=createChunkLight(w,0,0);
 assert.equal(paint(quad(0,180,1)).length,3);
});
test('water atlas cell maps to complete dedicated UV square',()=>{
 const uv=waterQuadUV(uvFor(7));
 assert.ok(uv.every(([u,v])=>u>=0&&u<=1&&v>=0&&v<=1));
 assert.ok(Math.abs(uv[0][0])<.01 && Math.abs(uv[1][0]-1)<.01);
 const rect=waterTileRegion({width:128,height:96});
 assert.deepEqual(rect,{x:112,y:0,width:16,height:16});
});
test('celestial positions follow a complete 24,000-tick cycle without moving out of view',async()=>{
 const {celestialPositions,SKY_CAMERA_FAR,CELESTIAL_DISTANCE}=await import('../src/sky-cycle.js');
 assert.ok(SKY_CAMERA_FAR>CELESTIAL_DISTANCE);
 const midnight=celestialPositions(18000),day=celestialPositions(6000);
 assert.ok(day.sun[1]>0&&midnight.sun[1]<0);
 assert.deepEqual(celestialPositions(5000),celestialPositions(29000));
});
