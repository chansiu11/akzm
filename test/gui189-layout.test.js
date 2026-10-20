import test from 'node:test';
import assert from 'node:assert/strict';
import {GUI189,guiScale,guiPositions,applyGuiScale} from '../src/gui189-layout.js';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
test('legacy UI logical hotbar, cells, icons and selection dimensions',()=>{
 assert.deepEqual([GUI189.hotbarWidth,GUI189.hotbarHeight,GUI189.slotStep,GUI189.heart,GUI189.experienceHeight],[182,22,20,9,5]);
 assert.equal(GUI189.inventoryColumns,9);
 assert.equal(guiPositions(3).hotbarWidth,546);
 assert.equal(guiPositions(2).hotbarHeight,44);
});
test('GUI auto scaling is integral and bounded on desktop/mobile',()=>{
 assert.equal(guiScale(1280,720),3);
 assert.equal(guiScale(1920,1080),4);
 assert.equal(guiScale(800,600),2);
 assert.equal(guiScale(390,844,{touch:true}),2);
 assert.equal(guiScale(320,700,{touch:true}),1);
 const history=[];
 assert.equal(applyGuiScale({style:{setProperty:(key,val)=>history.push([key,val])}},390,844,{touch:true}),2);
 assert.deepEqual(history,[['--gui-scale','2']]);
});
test('GUI is arranged like a classic world menu and inventory rather than card dashboard',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const css=readFileSync(new URL('../legacy189-gui.css',import.meta.url),'utf8');
 assert.match(html,/legacy189-gui\.css\?v=1\.7/);
 assert.match(html,/id="menuHelp" class="secondary-help"/);
 assert.match(html,/id="menuExit" class="stone-button"/);
 assert.match(html,/class="supplemental"/);
 assert.match(css,/repeat\(9,minmax\(0,1fr\)\)/);
 assert.match(css,/body:not\(\.debug-overlay\) #status/);
 assert.match(css,/#hotbar .slot.active/);
});
test('resizing refreshes responsive native GUI layout, F3 toggles in game',()=>{
 const js=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(js,/import \{applyGuiScale\} from '\.\/gui189-layout\.js'/);
 assert.match(js,/resize.*applyGuiScale\(document\.documentElement,innerWidth,innerHeight/);
 assert.match(js,/e\.code==='F3'.*debug-overlay/);
});
