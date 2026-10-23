import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('sprite buttons use a single cropped frame for each state, never competing halves',()=>{
 const css=read('../menu112.css');
 const gui=read('../src/gui112-assets.js');
 assert.match(css,/border-image-source:var\(--owner-death-button-normal/);
 assert.match(css,/border-image-source:var\(--owner-death-button-hover/);
 assert.match(css,/border-image-source:var\(--owner-death-button-disabled/);
 assert.match(css,/button\.stone-button::before,\s*html\.gui112-assets #overlay button\.stone-button::after/);
 assert.match(gui,/\['normal',66\],\['hover',86\],\['disabled',46\]/);
});
test('no swipe-only mining: an explicit viewport hold or mining control starts a break',()=>{
 const main=read('../src/main.js');
 assert.match(main,/function beginMiningInput\(/);
 assert.match(main,/!activeLook\.moved/);
 assert.match(main,/holdAction\('touchMine'/);
 assert.match(main,/rebuildEditedChunkNow\(t\.x,t\.z\)/);
});
test('all initial 625 chunks are counted before unpausing',()=>{
 const main=read('../src/main.js'),html=read('../index.html');
 assert.match(main,/const total=\(radius\*2\+1\)\*\*2/);
 assert.match(main,/if\(progress\.count===progress\.total\)/);
 assert.match(html,/id="worldLoading"/);
 assert.match(html,/id="loadingText112"/);
});
