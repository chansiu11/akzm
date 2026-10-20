import test from 'node:test';
import assert from 'node:assert/strict';
import {BLOCK} from '../src/block-registry.js';
import {itemDefinition} from '../src/item-registry.js';
import {blockDrops,canHarvest,mineSeconds} from '../src/vanilla-mining.js';
import {emptyCraftGrid,recipeAt,placeCraftIngredient,takeCraftIngredient,craftGridOnce,clearCraftGrid} from '../src/crafting-grid.js';
import {expandInventory,countItem} from '../src/inventory-utils.js';
const set=(grid,size,x,y,id,count=1)=>grid[y*size+x]={id,count};

test('1.8.9-style grass and stone drops are no longer duplicate self blocks',()=>{
 assert.deepEqual(blockDrops(BLOCK.GRASS),[{id:BLOCK.DIRT,count:1}]);
 assert.deepEqual(blockDrops(BLOCK.STONE,{toolId:110}),[{id:BLOCK.COBBLE,count:1}]);
 assert.deepEqual(blockDrops(BLOCK.STONE,{toolId:0}),[]);
 assert.deepEqual(blockDrops(BLOCK.COAL,{toolId:110}),[{id:100,count:1}]);
 assert.deepEqual(blockDrops(BLOCK.GLASS),[]);
 assert.deepEqual(blockDrops(BLOCK.GLASS,{silkTouch:true}),[{id:BLOCK.GLASS,count:1}]);
});
test('ore harvesting obeys minimum pickaxe tier and golden pickaxe limits',()=>{
 assert.equal(canHarvest(BLOCK.IRON_ORE,110),false);
 assert.equal(canHarvest(BLOCK.IRON_ORE,111),true);
 assert.equal(canHarvest(BLOCK.DIAMOND,111),false);
 assert.equal(canHarvest(BLOCK.DIAMOND,112),true);
 assert.equal(canHarvest(BLOCK.DIAMOND,113),false);
 assert.deepEqual(blockDrops(BLOCK.DIAMOND,{toolId:112}),[{id:104,count:1}]);
 assert.deepEqual(blockDrops(BLOCK.GOLD_ORE,{toolId:112}),[{id:BLOCK.GOLD_ORE,count:1}]);
 assert.equal(mineSeconds(BLOCK.STONE,111)<mineSeconds(BLOCK.STONE,0),true);
});
test('redstone, lapis, emerald ore produce item types, not ore cubes',()=>{
 assert.deepEqual(blockDrops(BLOCK.REDSTONE_ORE,{toolId:112,rng:()=>0}),[{id:105,count:4}]);
 assert.deepEqual(blockDrops(BLOCK.LAPIS_ORE,{toolId:111,rng:()=>.999}),[{id:107,count:8}]);
 assert.deepEqual(blockDrops(BLOCK.EMERALD_ORE,{toolId:112}),[{id:106,count:1}]);
 for(const id of [103,104,105,106,107,108,110,111,112,113,114]) assert.ok(itemDefinition(id));
});
test('2x2 crafting requires exact two plank positions for sticks',()=>{
 const grid=emptyCraftGrid(2);set(grid,2,1,0,BLOCK.PLANKS);set(grid,2,1,1,BLOCK.PLANKS);
 assert.equal(recipeAt(grid,2)?.recipe.id,'sticks');
 set(grid,2,0,1,BLOCK.PLANKS);assert.equal(recipeAt(grid,2),null);
});
test('2x2 crafting table requires shape and consumes exactly four planks',()=>{
 const grid=emptyCraftGrid(2);const inv=expandInventory([{id:BLOCK.PLANKS,count:4}]);
 for(let n=0;n<4;n++)assert.equal(placeCraftIngredient(grid,n,inv,0),true);
 assert.equal(countItem(inv,BLOCK.PLANKS),0);
 assert.equal(recipeAt(grid,2).recipe.id,'crafting-table');
 assert.deepEqual(craftGridOnce(grid,2,inv),{id:BLOCK.CRAFTING_TABLE,count:1});
 assert.equal(countItem(inv,BLOCK.CRAFTING_TABLE),1);
 assert.equal(recipeAt(grid,2),null);
});
test('3x3 picks only valid recipe and cannot be crafted inside 2x2 inventory',()=>{
 const g=emptyCraftGrid(3);for(let x=0;x<3;x++)set(g,3,x,0,BLOCK.PLANKS);
 set(g,3,1,1,103);set(g,3,1,2,103);
 assert.equal(recipeAt(g,3).recipe.id,'wooden-pickaxe');
 const g2=emptyCraftGrid(2);set(g2,2,0,0,BLOCK.PLANKS);set(g2,2,1,0,BLOCK.PLANKS);
 assert.equal(recipeAt(g2,2),null);
});
test('full inventory prevents item loss while attempting crafting result',()=>{
 const inv=Array.from({length:36},()=>({id:BLOCK.STONE,count:64}));
 const g=emptyCraftGrid(2);set(g,2,0,0,BLOCK.LOG);
 const before=JSON.stringify(g);
 assert.equal(craftGridOnce(g,2,inv),null);assert.equal(JSON.stringify(g),before);
});
test('returning crafting materials never loses items when a slot has space',()=>{
 const inv=expandInventory([{id:BLOCK.PLANKS,count:5}]);const g=emptyCraftGrid(2);set(g,2,1,1,BLOCK.PLANKS,3);
 assert.equal(takeCraftIngredient(g,3,inv),true);assert.equal(countItem(inv,BLOCK.PLANKS),6);
 assert.equal(clearCraftGrid(g,inv),0);assert.equal(countItem(inv,BLOCK.PLANKS),8);
});

test('inventory respects unstackable tools and 16-stack snowballs',async()=>{
 const {giveItem,moveStack}=await import('../src/inventory-utils.js');
 const inv=expandInventory();assert.equal(giveItem(inv,110,3),0);
 assert.equal(inv.filter(s=>s.id===110).length,3);
 assert.deepEqual(inv.filter(s=>s.id===110).map(s=>s.count),[1,1,1]);
 const inv2=expandInventory();assert.equal(giveItem(inv2,108,33),0);assert.deepEqual(inv2.filter(s=>s.id===108).map(s=>s.count),[16,16,1]);
 assert.equal(moveStack(inv,1,0),false);
});
test('chest/furnace contents become drops when their blocks are removed',async()=>{
 const {TileStore,tileDrops}=await import('../src/tile-data.js');
 const store=new TileStore();const chest=store.ensure(1,2,3,'chest');chest.slots[0]={id:BLOCK.PLANKS,count:63};
 assert.deepEqual(tileDrops(chest),[{id:BLOCK.PLANKS,count:63}]);
 const furnace=store.ensure(2,2,3,'furnace');furnace.input={id:BLOCK.IRON_ORE,count:2};furnace.fuel={id:100,count:1};furnace.output={id:101,count:3};
 assert.equal(tileDrops(furnace).length,3);
 assert.equal(tileDrops(null).length,0);
});
test('lamp stays powered while any adjacent lever is active',async()=>{
 const {World}=await import('../src/terrain.js');const {recomputeNearbyLamps,lampIsPowered}=await import('../src/redstone-lite.js');
 const w=new World(); // World.set allows editing only inside valid Y range.
 assert.equal(w.set(0,100,0,BLOCK.LAMP,{powered:false}),true);
 assert.equal(w.set(-1,100,0,BLOCK.LEVER,{powered:true}),true);
 assert.equal(w.set(1,100,0,BLOCK.LEVER,{powered:true}),true);
 assert.equal(lampIsPowered(w,0,100,0),true);
 assert.equal(recomputeNearbyLamps(w,-1,100,0),1);assert.equal(w.getState(0,100,0).powered,true);
 w.set(-1,100,0,BLOCK.LEVER,{powered:false});recomputeNearbyLamps(w,-1,100,0);
 assert.equal(w.getState(0,100,0).powered,true);
 w.set(1,100,0,BLOCK.LEVER,{powered:false});recomputeNearbyLamps(w,1,100,0);
 assert.equal(w.getState(0,100,0).powered,false);
});

test('bounded pathfinder routes around obstacle instead of walking into a wall',async()=>{
 const {findPath}=await import('../src/pathfinding.js');
 const obstacle=new Set(['1,0','1,1']);
 const path=findPath({x:0,z:0},{x:3,z:0},(x,z)=>Math.abs(x)<=4&&Math.abs(z)<=4&&!obstacle.has(`${x},${z}`));
 assert.ok(path.length>=6);assert.deepEqual(path[0],{x:0,z:0});assert.deepEqual(path.at(-1),{x:3,z:0});
 for(const p of path) assert.equal(obstacle.has(`${p.x},${p.z}`),false);
});
test('bounded pathfinder does not run unbounded search for unreachable or remote goals',async()=>{
 const {findPath}=await import('../src/pathfinding.js');
 assert.deepEqual(findPath({x:0,z:0},{x:100,z:100},()=>true),[]);
 assert.deepEqual(findPath({x:0,z:0},{x:2,z:0},(x,z)=>x===0&&z===0,{maxNodes:5}),[]);
});

test('world save keys remain backwards-compatible and survival can be distinguished from prototype',async()=>{
 const {worldSaveKey,listWorlds,activeWorldMode,activeWorldCheats}=await import('../src/menu.js');
 assert.equal(worldSaveKey('default'),'voxel-frontier-save-v1');
 assert.equal(worldSaveKey('new'), 'voxel-frontier-save-v1-new');
 // Browser localStorage only is consulted when the user selects a world; no saves are mutated.
 assert.equal(typeof activeWorldMode,'function');assert.equal(typeof activeWorldCheats,'function');
});

test('pickaxe durability is preserved in inventory saves, and breaks at its limit',async()=>{
 const {usePickaxe,PICKAXE_DURABILITY}=await import('../src/tool-durability.js');
 const slot={id:110,count:1,damage:57};const inventory=expandInventory([slot]);
 assert.deepEqual(inventory[0],slot);
 assert.deepEqual(usePickaxe(inventory[0]),{used:true,broken:false});
 assert.deepEqual(usePickaxe(inventory[0]),{used:true,broken:true});
 assert.equal(inventory[0].id,0);
 assert.equal(PICKAXE_DURABILITY[110],59);
});
test('unstackable tool moved to empty slot retains damage counter',async()=>{
 const {moveStack}=await import('../src/inventory-utils.js');
 const inv=expandInventory([{id:112,count:1,damage:7}]);
 assert.equal(moveStack(inv,0,3),true);
 assert.deepEqual(inv[3],{id:112,count:1,damage:7});
 assert.deepEqual(inv[0],{id:0,count:0});
});
