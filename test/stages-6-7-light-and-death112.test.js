import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {daylight,lightingInfo,skyColor} from '../src/environment.js';
import {BLOCK} from '../src/block-registry.js';
import {activeLampsNear,createChunkLight} from '../src/voxel-light.js';
import {deathMessageKey112,formatOwnerDeath112} from '../src/death-messages112.js';
import {executeExtended} from '../src/command-extras.js';

test('sunset and midnight remain darker than actual Java-style daytime',()=>{
 assert.ok(daylight(6000)>daylight(0));
 assert.ok(daylight(0)>daylight(18000));
 const noon=lightingInfo(6000),evening=lightingInfo(12500),midnight=lightingInfo(18000);
 assert.ok(noon.ambientIntensity>evening.ambientIntensity);
 assert.ok(evening.ambientIntensity>midnight.ambientIntensity);
 assert.ok(noon.sunIntensity>midnight.sunIntensity*2);
 assert.ok(skyColor(13000)[2]<100,'night should not still be bright blue at tick 13000');
 assert.ok(skyColor(6000)[2]>skyColor(13000)[2]*2);
 const visual=readFileSync(new URL('../src/world-visuals.js',import.meta.url),'utf8');
 assert.match(visual,/new THREE.Color\(\)\.setRGB\(\.\.\.l\.sky\.map\(v=>v\/255\),THREE\.SRGBColorSpace\)/);
 assert.ok(midnight.stars>.9);
});
test('temporary night-vision brightens nighttime world, without moving the sun or stars',()=>{
 const regular=lightingInfo(18000,'clear');
 const vision=lightingInfo(18000,'clear',{nightVision:true});
 assert.ok(vision.ambientIntensity>regular.ambientIntensity+0.7);
 assert.ok(vision.sunIntensity>regular.sunIntensity+1);
 assert.deepEqual(vision.sky,regular.sky);
 assert.equal(vision.stars,regular.stars);
});
test('an activated placed lamp provides local block light, unpowered lamp does not',()=>{
 const changes=new Map([
  ['1,65,1',{id:BLOCK.LAMP,state:{powered:true}}],
  ['3,65,3',{id:BLOCK.LAMP,state:{powered:false}}]
 ]);
 const world={
  changes,
  get:()=>0,
  columnTop:()=>65,
 };
 const lamps=activeLampsNear(world,0,0);
 assert.equal(lamps.length,1);
 assert.deepEqual(lamps[0],{x:1.5,y:65.5,z:1.5});
 const faces={x:1,y:65,z:1,v:[[0,0,0],[1,0,0],[1,1,0],[0,1,0]],d:[0,0,1]};
 const lit=createChunkLight(world,0,0)(faces);
 changes.get('1,65,1').state.powered=false;
 const unlit=createChunkLight(world,0,0)(faces);
 assert.ok(lit[0]>unlit[0]);
});
test('source-provided old-Java death strings are formatted, without making up translations',()=>{
 const originalFixture={
  'death.attack.fall':'%1$s FAKE-FIXTURE fall',
  'death.attack.drown':'%1$s FAKE-FIXTURE water',
  'death.attack.mob':'%1$s FAKE-FIXTURE %2$s',
  'death.attack.generic':'%1$s FAKE-FIXTURE generic'
 };
 assert.equal(deathMessageKey112('fall'),'death.attack.fall');
 assert.equal(deathMessageKey112('mob',null),'death.attack.generic');
 assert.equal(formatOwnerDeath112({},'fall'),'');
 assert.equal(formatOwnerDeath112(originalFixture,'fall',{name:'Alex'}),'Alex FAKE-FIXTURE fall');
 assert.equal(formatOwnerDeath112(originalFixture,'mob',{name:'Alex'}),'Alex FAKE-FIXTURE generic');
 assert.equal(formatOwnerDeath112(originalFixture,'mob',{name:'Alex',attacker:'Steve'}),'Alex FAKE-FIXTURE Steve');
});
test('only supported 1.12.2 night-vision commands change the local effect timer',()=>{
 let duration=null;
 const ctx={players:()=>['Player'],setNightVision:n=>{duration=n;}};
 assert.equal(executeExtended('/effect @p 16 60 0 true',ctx).ok,true);
 assert.equal(duration,60);
 assert.equal(executeExtended('/effect @p minecraft:night_vision 20',ctx).ok,true);
 assert.equal(duration,20);
 assert.equal(executeExtended('/effect @p clear',ctx).ok,true);
 assert.equal(duration,0);
 assert.equal(executeExtended('/effect @p 1 20',ctx).ok,false);
});
test('actual game loads all source and UI paths for night vision, lighting, damage and death',()=>{
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const visual=readFileSync(new URL('../src/world-visuals.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../visual-overhaul.css',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../src/gui112-assets.js',import.meta.url),'utf8');
 assert.match(main,/nightVisionSeconds/);
 assert.match(main,/setNightVision:seconds/);
 assert.match(main,/worldVisuals\.update\(dt,day\*24000,weatherCycle\.kind,player,sunlight,ambient,renderRadius,\{nightVision:nightVisionSeconds>0\}\)/);
 assert.match(main,/formatOwnerDeath112\(ownerDeathTexts/);
 assert.match(main,/audio\.beep\('hurt'\)/);
 assert.match(visual,/activeLampsNear\(world/);
 assert.match(css,/#hurtFlash112\{display:none!important\}/);
 assert.match(ui,/applyOwnerDeathButtons112\(root,a\.widgets\)/);
});
