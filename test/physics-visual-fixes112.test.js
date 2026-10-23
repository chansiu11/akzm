import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bitmapTextSupported112} from '../src/bitmap-font112.js';
import {horizontalVelocity112,verticalVelocity112,MOVE_SPEED112,defaultRenderDistance112,sanitizeRenderDistance112,fogDistances112,waterContact112,waterExitLift112} from '../src/player-motion112.js';
import {faceLight} from '../src/voxel-light.js';
import {lightingInfo} from '../src/environment.js';

test('Korean labels never get hidden underneath unreadable owner bitmap font sprites',()=>{
 assert.equal(bitmapTextSupported112('Singleplayer'),true);
 assert.equal(bitmapTextSupported112('Minecraft Realms'),true);
 assert.equal(bitmapTextSupported112('싱글플레이'),false);
 assert.equal(bitmapTextSupported112('설정 · 완료'),false);
 assert.equal(bitmapTextSupported112('포션 2개'),false);
 const js=readFileSync(new URL('../src/bitmap-font112.js',import.meta.url),'utf8');
 assert.match(js,/if\(!lines\)\{clearLabel\(node\);return;\}/);
 assert.match(js,/node\.classList\.remove\('bitmap-label'\)/);
});
test('horizontal acceleration and friction gradually approach the desired speed',()=>{
 const accelerating=horizontalVelocity112(0,0,4.317,0,1/60,{ground:true});
 assert.ok(accelerating.x>0&&accelerating.x<4.317);
 const coast=horizontalVelocity112(4.317,0,0,0,1/30,{ground:true});
 assert.ok(coast.x>0&&coast.x<4.317);
 const flying=horizontalVelocity112(0,0,4.317,0,1/60,{ground:false});
 assert.ok(flying.x<accelerating.x);
 assert.ok(Math.abs(verticalVelocity112(0,.05)+1.568)<1e-8);
 assert.ok(Math.abs(verticalVelocity112(-78.4,.1)+78.4)<1e-8);
 let vy=MOVE_SPEED112.jump,height=0,maximum=0;
 for(let tick=0;tick<26;tick++){height+=vy/20;maximum=Math.max(maximum,height);vy=verticalVelocity112(vy,.05);}
 assert.ok(maximum>1.24&&maximum<1.27,'the original 0.42 per tick jump rises around 1.25 blocks');
 assert.ok(Math.abs(verticalVelocity112(0,.05,{water:true})+.32)<1e-8);
 assert.ok(MOVE_SPEED112.sprint>MOVE_SPEED112.walk);
});
test('all devices render at least 12 chunks and fog tracks actual world render distance',()=>{
 assert.equal(defaultRenderDistance112(false),12);
 assert.equal(defaultRenderDistance112(true),12);
 assert.equal(sanitizeRenderDistance112(99,false),16);
 assert.equal(sanitizeRenderDistance112(99,true),16);
 assert.equal(sanitizeRenderDistance112(-3,false),12);
 const near=fogDistances112(3),far=fogDistances112(8);
 assert.ok(far.far>near.far*2);
 assert.ok(far.near<far.far);
});
test('new placements show a mesh immediately and reprioritize dirty chunks',()=>{
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(main,/function showPlacementPreview\(x,y,z\)/);
 assert.match(main,/showPlacementPreview\(nx,ny,nz\);track\('placed'\)/);
 assert.match(main,/raycastVoxel112\(world,camera\.position,facing,5\)/);
 assert.match(main,/enqueue\(cx,cz,urgent=false\)/);
 assert.match(main,/pending\.unshift\(\[cx,cz\]\)/);
 assert.match(main,/clearPlacementPreviews\(cx,cz\)/);
 assert.match(main,/progressChunkWithinBudget\(activeBuild,\{budgetMs:Math\.max/);
});

test('daytime is materially brighter with a less aggressive face-shadow multiplier',()=>{
 const noon=lightingInfo(6000,'clear'),night=lightingInfo(18000,'clear');
 assert.ok(noon.sunIntensity>1.5);
 assert.ok(noon.ambientIntensity>1.2);
 assert.ok(noon.sunIntensity>night.sunIntensity);
 const light=readFileSync(new URL('../src/voxel-light.js',import.meta.url),'utf8');
 assert.match(light,/normal\[1\]<0\?\.72/);
 assert.match(light,/const skylight=open\?1:\.23/);
});
test('physics and terrain refresh code wire into the real game frame',()=>{
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(main,/horizontalVelocity112\(player\.vx,player\.vz/);
 assert.match(main,/verticalVelocity112\(player\.vy,dt,\{water\}\)/);
 assert.match(main,/player\.vx=player\.vz=player\.vy=0/);
 assert.match(main,/showPlacementPreview\(nx,ny,nz\)/);
 assert.match(main,/worldVisuals\.update\(dt,day\*24000,weatherCycle\.kind,player,sunlight,ambient,renderRadius,\{nightVision:nightVisionSeconds>0\}\)/);
 assert.match(main,/activeBuild\?\.cx===cx\+dx/);
});

import {beginChunk,progressChunkWithinBudget} from '../src/chunk-builder.js';
test('chunk work respects a maximum per frame while still yielding immediate updates',()=>{
 const world={columnTop:()=>0,get:()=>0,getBlock:()=>({id:0}),};
 const t=beginChunk(world,0,0);
 const over=progressChunkWithinBudget(t,{budgetMs:0,maxColumns:28,batchColumns:4,clock:()=>1});
 assert.equal(over,false);
 assert.equal(t.index,4);
 const next=progressChunkWithinBudget(t,{budgetMs:10,maxColumns:28,batchColumns:4,clock:()=>1});
 assert.equal(next,false);
 assert.equal(t.index,32);
});

test('water contact follows a 0.6-block player footprint at the shoreline',()=>{
 const world={get:(x,y,z)=>(x===0&&y===64&&z===0?8:0)};
 const player={x:1.10,y:64,z:.5};
 // Centre is in air, but the west edge of the avatar overlaps water.
 assert.equal(world.get(Math.floor(player.x),64,Math.floor(player.z)),0);
 assert.equal(waterContact112(world,player,8),true);
 assert.equal(waterContact112(world,{...player,x:1.4},8),false);
 assert.equal(waterExitLift112(-1,{jump:true,inWater:true,blockedByShore:true}),5.2);
 assert.equal(waterExitLift112(-1,{jump:true,inWater:true}),4);
 assert.equal(waterExitLift112(-1,{jump:false,inWater:true}),-1);
});
test('water jump held continuously does not charge jump exhaustion each animation frame',async()=>{
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(main,/if\(jumpPressed&&water\)player\.vy=waterExitLift112/);
 assert.match(main,/else if\(jumpPressed&&player\.onGround\)/);
 assert.match(main,/water\?Math\.hypot\(player\.x-startX,player\.y-initialY,player\.z-startZ\)/);
 const {Survival}=await import('../src/survival.js');
 const swimmer=new Survival({saturation:0,hunger:20});
 const walker=new Survival({saturation:0,hunger:20});
 for(let t=0;t<1200;t++){swimmer.tick(.05,{swimming:true,moving:true,travelDistance:.1});walker.tick(.05,{moving:true,travelDistance:.1});}
 assert.ok(Math.abs(swimmer.exhaustion-1.2)<.001);
 assert.equal(walker.exhaustion,0);
 assert.equal(swimmer.hunger,20);
});
