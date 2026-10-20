import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');

test('legacy joystick and break/place buttons are absent',()=>{
 for(const id of ['joystick','stickThumb','touchBreak','touchPlace']){
  assert.ok(!html.includes(`id="${id}"`));assert.ok(!main.includes(`el('${id}')`));
 }
});
test('all touch direction and action IDs are rendered and bound',()=>{
 for(const id of ['touchUp','touchDown','touchLeft','touchRight','touchJump','touchSneak','touchBag','touchPause','touchCommand']){
  assert.ok(html.includes(`id="${id}"`),`missing ${id} markup`);
  assert.ok(main.includes(`'${id}'`),`missing ${id} event wiring`);
 }
 assert.match(css,/#touchDpad/);
 assert.match(main,/obstructingBlockTarget\(world,player/);
});
