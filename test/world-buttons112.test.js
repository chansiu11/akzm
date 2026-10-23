import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../menu112.css',import.meta.url),'utf8');
const audit=readFileSync(new URL('../tools/verify-deployed-command.mjs',import.meta.url),'utf8');
const fullAudit=readFileSync(new URL('../tools/visit-deployed-site.mjs',import.meta.url),'utf8');
test('Java 1.12.2 Select World uses exact six button dimensions and offsets',()=>{
 assert.match(css,/#menu-worlds \.world-actions112\{\s*width:calc\(308px/);
 assert.match(css,/grid-template-columns:repeat\(2,calc\(150px/);
 assert.match(css,/column-gap:calc\(8px/);
 assert.match(css,/grid-template-columns:repeat\(4,calc\(72px/);
 assert.match(css,/:nth-child\(n\+3\)/);
 assert.match(audit,/WORLD_BUTTON_GEOMETRY_PASS/);
 assert.match(fullAudit,/World select button layout PASS/);
});
test('selection screen is still interactive and screenshots are created after clicks',()=>{
 for(const selector of ['#worldCreate','#createBack','#worldEdit','#worldEditBack','#worldPlay']){
  assert.ok(audit.includes(`page.locator('${selector}').click()`));
 }
});
