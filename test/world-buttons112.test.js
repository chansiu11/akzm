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

const gui=readFileSync(new URL('../src/gui112-assets.js',import.meta.url),'utf8');
const fallback=readFileSync(new URL('../src/site-default112.js',import.meta.url),'utf8');
test('world selection has a grayscale fallback rather than diagonal swatches',()=>{
 assert.ok(!css.includes('background:linear-gradient(45deg'));
 assert.ok(css.includes('background-image:var(--owner-world-icon112,var(--site112-world))'));
 assert.ok(fallback.includes('sprites.world=wc.toDataURL'));
 assert.ok(gui.includes('textures/misc/unknown_server.png'));
});
test('world selection buttons use cropped sprites, not split halves',()=>{
 assert.ok(css.includes('world-actions112 button.stone-button::before'));
 assert.ok(css.includes('display:none!important;content:none!important;background-image:none!important'));
 assert.ok(css.includes('border-image-source:var(--owner-death-button-normal,var(--site112-normal))'));
 assert.ok(css.includes('border-image-slice:3 fill'));
 assert.ok(css.includes('owner-death-button-hover'));
 assert.ok(css.includes('owner-death-button-disabled'));
});
