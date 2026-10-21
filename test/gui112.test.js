import {readFileSync} from 'node:fs';
import test from 'node:test';import assert from 'node:assert/strict';
import {GUI112,gui112Scale} from '../src/gui112-layout.js';
import {GUI112_FILES,GUI112_SHA1,validGui112Assets,applyGui112,ownerItemTexturePath} from '../src/gui112-assets.js';
test('audited original 1.12.2 HUD sprite coordinates',()=>{
 assert.deepEqual(GUI112.hotbar,{x:0,y:0,w:182,h:22});
 assert.deepEqual(GUI112.selection,{x:0,y:22,w:24,h:22});
 assert.deepEqual(GUI112.crosshair,{x:0,y:0,w:16,h:16});
 assert.deepEqual(GUI112.xp,{empty:[0,64],full:[0,69],w:182,h:5});
 assert.deepEqual(GUI112.food.full,[52,27]);assert.deepEqual(GUI112.heart.full,[52,0]);
 assert.equal(GUI112_SHA1.length,40);
});
test('9 slots fit vanilla 182 pixel wide hotbar and mobile scaling remains safe',()=>{
 assert.equal(9*20+2,GUI112.hotbar.w);
 assert.equal(gui112Scale(1920,1080),4);
 assert.ok(gui112Scale(375,667,{touch:true})>=1);
});
test('owner-owned JAR importer rejects incomplete graphical assets',()=>{
 assert.equal(Object.keys(GUI112_FILES).length,7);
 assert.ok(Object.values(GUI112_FILES).every(p=>p.startsWith('assets/minecraft/textures/gui/')));
 assert.equal(validGui112Assets({widgets:'data:image/png;base64,AA=='}),false);
 assert.equal(applyGui112(null,{}),false);
});

test('owner sprite selectors target <html>, matching applyGui112(document.documentElement, assets)',()=>{
 const css=readFileSync(new URL('../gui112.css',import.meta.url),'utf8');
 const js=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(js,/applyGui112\(document\.documentElement,assets\)/);
 assert.match(js,/restoreGui112\(document\.documentElement\)/);
 assert.match(css,/html\.gui112-assets body #hotbar/);
 assert.match(css,/html\.gui112-assets body #crosshair/);
 assert.match(css,/html\.gui112-assets body #inventory\[data-container="inventory"\]/);
 assert.match(css,/html\.gui112-chest body #inventory/);
 assert.match(css,/html\.gui112-furnace body #inventory/);
 assert.doesNotMatch(css,/body\.gui112-(?:assets|chest|furnace)/);
 assert.match(html,/gui112\.css\?v=\d+\.\d+/);
});
test('owner-supplied four PNGs activate the root class and CSS properties',()=>{
 const names=new Set(),props={};
 const root={classList:{add:(x)=>names.add(x),toggle:(x,on)=>on?names.add(x):names.delete(x)},style:{setProperty:(k,v)=>props[k]=v}};
 const assets={widgets:'data:image/png;base64,AA==',icons:'data:image/png;base64,AA==',inventory:'data:image/png;base64,AA==',crafting:'data:image/png;base64,AA=='};
 assert.equal(applyGui112(root,assets),true);
 assert.ok(names.has('gui112-assets'));
 assert.ok(!names.has('gui112-chest'));
 assert.ok(!names.has('gui112-furnace'));
 assert.match(props['--gui112-widgets'],/data:image\/png/);
});

test('inventory overlay hides the gameplay HUD and restores it when closed',()=>{
 const css=readFileSync(new URL('../gui112.css',import.meta.url),'utf8');
 const js=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(css,/body\.inventory-open :is\(#hotbar,#survivalHud,#crosshair/);
 assert.match(css,/display:none!important/);
 assert.match(js,/inventoryOpen=true;document\.body\.classList\.add\('inventory-open'\)/);
 assert.match(js,/function closeInventory\(\)\{document\.body\.classList\.remove\('inventory-open'\)/);
 assert.match(js,/function requestPlay\(\)\{document\.body\.classList\.remove\('inventory-open'\)/);
 assert.match(html,/gui112\.css\?v=\d+\.\d+/);
});

test('touch inventory and external close control fit short landscape screens',()=>{
 for(const [w,h] of [[844,390],[740,320],[667,375],[390,844]]){
  const scale=gui112Scale(w,h,{touch:true});
  assert.ok(166*scale+40*scale<=h);
  assert.ok(182*scale<=w);
 }
});

test('1.12.2 item models choose real owner-local PNG paths instead of guessing from item IDs',()=>{
 const item=(id,key)=>({id,key:'minecraft:'+key});
 const src=(name)=>'assets/minecraft/textures/items/'+name+'.png';
 assert.equal(ownerItemTexturePath(item(110,'wooden_pickaxe')),src('wood_pickaxe'));
 assert.equal(ownerItemTexturePath(item(113,'golden_pickaxe')),src('gold_pickaxe'));
 assert.equal(ownerItemTexturePath(item(105,'redstone')),src('redstone_dust'));
 assert.equal(ownerItemTexturePath(item(111,'stone_pickaxe')),src('stone_pickaxe'));
 assert.equal(ownerItemTexturePath(item(107,'dye'),{textures:{layer0:'items/dye_powder_black'}}),src('dye_powder_blue'));
 assert.equal(ownerItemTexturePath(item(110,'wooden_pickaxe'),{textures:{layer0:'items/wood_pickaxe'}}),src('wood_pickaxe'));
 assert.equal(ownerItemTexturePath(item(110,'wooden_pickaxe'),{textures:{layer0:'minecraft:items/custom_wood'}}),src('custom_wood'));
 assert.equal(ownerItemTexturePath(item(100,'coal'),{textures:{layer0:'https://example.com/tracker'}}),src('coal'));
 assert.equal(ownerItemTexturePath(item(100,'coal'),{textures:{layer0:'items/../leak'}}),src('coal'));
 assert.equal(ownerItemTexturePath({id:1,key:'../bad'}),null);
});
test('new item model resolution triggers private cached JAR re-extraction',async()=>{
 const {PRIVATE_RESOURCE_VERSION}=await import('../src/private-resource-cache.js');
 assert.equal(PRIVATE_RESOURCE_VERSION,'112-menu-font-atlas6-v6');
});
