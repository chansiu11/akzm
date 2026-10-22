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

test('the mobile D-pad holds only while touched and clears on pointer cancellation or tab blur',()=>{
 assert.match(main,/function holdAction\(id,onStart,onEnd\)/);
 assert.match(main,/b\.setPointerCapture\?\.\(e\.pointerId\)/);
 assert.match(main,/b\.classList\.add\('pressed'\)/);
 assert.match(main,/b\.classList\.remove\('pressed'\)/);
 assert.match(main,/for\(const type of \['pointerup','pointercancel','lostpointercapture'\]\)/);
 assert.match(main,/window\.addEventListener\('blur'/);
 assert.match(main,/holdAction\('touchJump'/);
 assert.match(main,/el\('touchSneak'\)\.classList\.toggle\('pressed',mobileSneak\)/);
});
test('slash opens vanilla-style command chat and Enter/Escape close without trapping mobile keyboard',()=>{
 const cmd=readFileSync(new URL('../src/command-ui.js',import.meta.url),'utf8');
 const visuals=readFileSync(new URL('../visual-overhaul.css',import.meta.url),'utf8');
 assert.match(main,/e\.key==='\/'\|\|e\.code==='Slash'/);
 assert.match(main,/document\.body\.classList\.add\('command-open112'\)/);
 assert.match(main,/document\.body\.classList\.remove\('command-open112'\)/);
 assert.match(cmd,/if\(e\.key==='Escape'\)/);
 assert.match(cmd,/if\(e\.key==='Enter'\)/);
 assert.match(cmd,/hide\(true\);return result/);
 assert.match(cmd,/visualViewport/);
 assert.match(cmd,/command-keyboard-inset112/);
 assert.match(visuals,/body\.command-open112 #touchControls/);
 assert.match(visuals,/#commandPanel\.command-panel/);
 assert.match(html,/id="commandInput" type="text" inputmode="text" enterkeyhint="send"/);
});
