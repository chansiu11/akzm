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
 assert.match(main,/updateNearBlock\(t\.x,t\.z\)/);
});
test('a 5x5 playable core starts first while the requested 625-chunk radius streams',()=>{
 const main=read('../src/main.js'),html=read('../index.html');
 assert.match(main,/const total=\(radius\*2\+1\)\*\*2/);
 assert.match(main,/readyChunkProgress\(2\)/);
 assert.match(main,/readyChunkProgress\(12\)/);
 assert.match(main,/if\(progress\.count===progress\.total\)/);
 assert.match(main,/주변 12청크 생성 중/);
 assert.match(html,/id="worldLoading"/);
 assert.match(html,/id="loadingText112"/);
 assert.match(html,/id="chunkStream112"/);
});

test('fallback HUD removes dark colored hearts behind transparent PNG pixels',()=>{
 const css=read('../visual-overhaul.css'),hand=read('../src/first-person.js'),mobile=read('../menu112.css');
 assert.match(css,/background-color:transparent!important/);
 assert.match(mobile,/body\.touch-ui #chunkStream112/);
 assert.match(hand,/held\.position\.set\(\.51\+/);
 assert.match(hand,/arm\.visible=view\.kind==='empty'/);
});

test('world creation controls use pixel-styled widgets instead of native blue browsers',()=>{
 const css=read('../menu112.css');
 assert.match(css,/select#worldMode\{/);
 assert.match(css,/input#worldCheats\{/);
 assert.match(css,/appearance:none!important/);
});

test('portrait touch actions sit above the bottom HUD instead of covering food glyphs',()=>{
 const menuCss=readFileSync(new URL('../menu112.css',import.meta.url),'utf8');
 assert.match(menuCss,/Stage 6: keep touch mining\/jump controls above/);
 assert.match(menuCss,/body\.touch-ui #touchActions\{bottom:max\(145px/);
});
