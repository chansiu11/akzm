import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../menu112.css',import.meta.url),'utf8');
const audit=readFileSync(new URL('../tools/visit-deployed-site.mjs',import.meta.url),'utf8');
test('the in-world pause screen resembles the 1.12.2 200px GUI, not the title page',()=>{
 for(const id of ['pauseResume','pauseAdvancements','pauseStatistics','pauseOpenLan','pauseSettings','pauseTitle'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/id="weatherToggle"[^>]*hidden/);
 assert.match(css,/#overlay #menu-pause \.pause-buttons112/);
 assert.match(css,/#overlay:has\(#menu-pause:not\(\.hidden\)\)/);
 assert.ok(css.includes('#overlay #menu-pause #weatherToggle{display:none!important}'));
 assert.ok(css.includes('body.menu-open:has(#menu-pause:not(.hidden)) #menuPanorama'));
 assert.ok(audit.includes("pauseUI.panorama!=='none'"));
 assert.match(audit,/clickAndCapture\(page,'#pauseSettings'/);
 assert.match(audit,/clickAndCapture\(page,'#pauseResume'/);
});

test('1.12.2 pause options button is left of open-to-LAN on the same row',()=>{
 const row=html.match(/<div class="pause-pair112">\s*<button[^>]*id="pauseSettings"[^>]*>[\s\S]*?<button[^>]*id="pauseOpenLan"[^>]*>/);
 assert.ok(row,'Options must appear before Open to LAN');
 assert.match(audit,/optionsBeforeLan/);
});
