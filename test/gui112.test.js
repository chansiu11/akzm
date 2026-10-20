import test from 'node:test';import assert from 'node:assert/strict';
import {GUI112,gui112Scale} from '../src/gui112-layout.js';
import {GUI112_FILES,GUI112_SHA1,validGui112Assets,applyGui112} from '../src/gui112-assets.js';
test('audited original 1.12.2 HUD sprite coordinates',()=>{
 assert.deepEqual(GUI112.hotbar,{x:0,y:0,w:182,h:22});
 assert.deepEqual(GUI112.selection,{x:0,y:22,w:24,h:22});
 assert.deepEqual(GUI112.crosshair,{x:0,y:0,w:16,h:16});
 assert.deepEqual(GUI112.xp,{empty:[0,64],full:[0,69],w:182,h:5});
 assert.deepEqual(GUI112.food.full,[52,27]);assert.deepEqual(GUI112.heart.full,[52,0]);
 assert.equal(GUI112_SHA1.length,40);
});
test('9 slots fit vanilla 182 pixel wide hotbar and mobile scaling remains safe',()=>{
 assert.equal(9*20+2,GUI112.hotbar.w);
 assert.equal(gui112Scale(1920,1080),4);
 assert.ok(gui112Scale(375,667,{touch:true})>=1);
});
test('owner-owned JAR importer rejects incomplete graphical assets',()=>{
 assert.equal(Object.keys(GUI112_FILES).length,7);
 assert.ok(Object.values(GUI112_FILES).every(p=>p.startsWith('assets/minecraft/textures/gui/')));
 assert.equal(validGui112Assets({widgets:'data:image/png;base64,AA=='}),false);
 assert.equal(applyGui112(null,{}),false);
});
