import test from 'node:test';import assert from 'node:assert/strict';
import {verticalMotion112} from '../src/player-motion112.js';
import {DEFAULT_BINDINGS112,normalizeBindings112,rebind112,bindingDown112,bindingMatches112} from '../src/keybindings112.js';
import {modelFaceCorners112} from '../src/mob-model112.js';
test('legacy jump apex is consistent at 20, 30, 60, 120 and 144 fps',()=>{
 for(const fps of [20,30,60,120,144]){let vy=8.4,phase=0,y=0,apex=0;for(let frame=0;frame<fps;frame++){const next=verticalMotion112(vy,1/fps,phase);y+=next.dy;vy=next.vy;phase=next.phase;apex=Math.max(apex,y);}assert.ok(Math.abs(apex-1.25220335)<.004,`fps ${fps}: ${apex}`);}
});
test('key reassignment swaps collisions and roundtrips saved controls',()=>{
 const bindings=rebind112(DEFAULT_BINDINGS112,'jump','KeyW');assert.equal(bindings.jump,'KeyW');assert.equal(bindings.forward,'Space');assert.deepEqual(normalizeBindings112(JSON.parse(JSON.stringify(bindings))),bindings);assert.equal(bindingDown112(new Set(['KeyW']),bindings,'jump'),true);assert.equal(bindingDown112(new Set(['Space']),bindings,'jump'),false);
});
test('mouse actions and right-hand modifiers respect assignments',()=>{
 assert.equal(bindingMatches112(DEFAULT_BINDINGS112,'attack','Mouse0'),true);assert.equal(bindingDown112(new Set(['ShiftRight']),DEFAULT_BINDINGS112,'sneak'),true);assert.equal(bindingDown112(new Set(['ShiftRight']),rebind112(DEFAULT_BINDINGS112,'sneak','KeyZ'),'sneak'),false);
});
test('invalid and reserved bindings do not replace playable defaults',()=>{
 assert.equal(normalizeBindings112({jump:'Escape'}).jump,'Space');assert.equal(rebind112(DEFAULT_BINDINGS112,'jump','F5').jump,'Space');
});
test('asymmetric mob UVs orient sides and caps without crossing atlas rectangles',()=>{
 const rect=[8,12,16,24],side=modelFaceCorners112(rect,64,32,5),top=modelFaceCorners112(rect,64,32,2);assert.deepEqual(side,[[.25,.625],[.125,.625],[.25,.25],[.125,.25]]);assert.deepEqual(top,[[.125,.25],[.25,.25],[.125,.625],[.25,.625]]);
});
