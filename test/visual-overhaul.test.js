import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vitalsModel} from '../src/hud-view.js';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../visual-overhaul.css',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const panorama=readFileSync(new URL('../src/menu-panorama.js',import.meta.url),'utf8');
const firstPerson=readFileSync(new URL('../src/first-person.js',import.meta.url),'utf8');
const atlas=readFileSync(new URL('../src/atlas.js',import.meta.url),'utf8');

test('original pixel panorama is present and visually behind all menu pages',()=>{
 assert.match(html,/id="menuPanorama"/);assert.match(css,/#menuPanorama\{[^}]*z-index:4/);
 assert.match(css,/#overlay\{[^}]*z-index:5/);assert.match(main,/startMenuPanorama\(el\('menuPanorama'\)\)/);
 assert.match(panorama,/function drawPanoramaFrame\(/);
});
test('health, hunger, oxygen are clamped and independently represented as ten half icons',()=>{
 const v=vitalsModel(18,7,135);assert.equal(v.hearts.length,10);assert.equal(v.hearts[8],1);assert.equal(v.hearts[9],0);
 assert.deepEqual(v.food.slice(0,5),[1,1,1,.5,0]);assert.equal(v.bubbles.length,10);
 assert.equal(vitalsModel(-4,99,300).hearts.every(x=>x===0),true);
 assert.equal(vitalsModel(-4,99,300).food.every(x=>x===1),true);
 assert.equal(vitalsModel(20,20,300).bubbles.length,0);
});
test('game HUD has no emoji-only bars and block mining progress is visible',()=>{
 assert.ok(!main.includes("el('survivalHud').textContent="));
 assert.match(main,/hud\.update\(survival\.health,survival\.hunger,survival\.air\)/);
 assert.match(main,/mineProgress\(el\('miningIndicator'\),ratio/);
 assert.match(html,/id="miningIndicator"/);
 assert.match(css,/#hotbar \.slot/);assert.match(css,/\.pixel-vital\.heart/);assert.match(css,/\.pixel-vital\.food/);
});
test('first-person block arm is rendered after the world with depth reset',()=>{
 assert.match(main,/createFirstPerson\(renderer,texture\)/);
 assert.match(main,/firstPerson\.setItem\(inventory\[selected\]/);
 assert.match(firstPerson,/renderer\.clearDepth\(\)/);
 assert.match(main,/firstPerson\.render\(innerWidth,innerHeight\)/);
});
test('all previous controls, inventory, commands and world screens remain in DOM',()=>{
 for(const id of ['touchUp','touchLeft','touchDown','touchRight','touchJump','touchSneak','touchBag','touchPause','touchCommand','menu-title','menu-worlds','menu-create','menu-settings','menu-help','menu-pause','inventory','hotbar','commandPanel','touchControls']){
  assert.ok(html.includes(`id="${id}"`),`missing ${id}`);
 }
});
test('atlas receives individual procedural texture details instead of flat swatches',()=>{
 assert.match(atlas,/function textureDetail\(/);
 assert.match(atlas,/textureDetail\(ctx,i,ox,oy\)/);
 for(const i of ['i===0','i===13','i===7','i===15','i===30'])assert.ok(atlas.includes(i));
});
