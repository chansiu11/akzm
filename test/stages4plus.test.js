import test from 'node:test';
import assert from 'node:assert/strict';
import {daylight,skyColor,lightingInfo,WeatherCycle} from '../src/environment.js';
import {Survival} from '../src/survival.js';
import {EMPTY,expandInventory,giveItem,takeItem,countItem,moveStack} from '../src/inventory-utils.js';
import {RECIPES,canCraft,craft} from '../src/crafting.js';
import {decide,spawnEntity,stepEntity} from '../src/entity-ai.js';
import {BLOCK} from '../src/block-registry.js';

test('stage4 daylight cycle has lighter noon, darker midnight, and bounded sky colors',()=>{
 assert.ok(daylight(6000)>daylight(18000));assert.deepEqual(skyColor(0),skyColor(24000));
 assert.ok(lightingInfo(6000,'thunder').sunIntensity<lightingInfo(6000,'clear').sunIntensity);
 assert.ok(skyColor(2500).every(v=>Number.isInteger(v)&&v>=0&&v<=255));
});
test('stage4 weather transitions, locks, and saves its data',()=>{
 const w=new WeatherCycle({kind:'clear',remaining:1});w.update(2,()=>.8);assert.equal(w.kind,'rain');
 const saved=w.serialize();assert.equal(new WeatherCycle(saved).kind,'rain');w.locked=true;w.update(999);assert.equal(w.kind,'rain');
 assert.equal(w.set('unknown'),false);
});
test('stage5 fall damage and respawn never exceed health boundaries',()=>{
 const s=new Survival();assert.equal(s.fall(3),0);assert.equal(s.fall(7.8),4);assert.equal(s.health,16);
 s.damage(50);assert.equal(s.health,0);assert.equal(s.dead,true);s.heal(9);assert.equal(s.health,0);s.respawn();assert.equal(s.health,20);
});
test('stage5 underwater exhaustion and food state survive serialization',()=>{
 const s=new Survival({health:10,hunger:19});s.tick(1,{underwater:true,moving:true,sprinting:true});assert.equal(s.air,280);
 s.exert(8);assert.equal(s.hunger,19);assert.ok(s.saturation<5);assert.deepEqual(new Survival(s.serialize()).serialize(),s.serialize());
});
test('stage6 9-slot legacy inventory extends without changing the hotbar',()=>{
 const v=expandInventory([{id:BLOCK.STONE,count:6}]);assert.equal(v.length,36);assert.equal(v[0].count,6);assert.deepEqual(v[9],EMPTY());
});
test('stage6 give/take stacks never dup or exceed cap',()=>{
 const v=expandInventory();assert.equal(giveItem(v,BLOCK.STONE,140),0);assert.equal(countItem(v,BLOCK.STONE),140);
 assert.equal(v[0].count,64);assert.equal(takeItem(v,BLOCK.STONE,150),false);assert.equal(countItem(v,BLOCK.STONE),140);
 assert.equal(takeItem(v,BLOCK.STONE,120),true);assert.equal(countItem(v,BLOCK.STONE),20);
});
test('stage6 moveStacks correctly swaps nonmatching stacks',()=>{
 const v=expandInventory([{id:1,count:8},{id:2,count:5}]);assert.equal(moveStack(v,0,1),true);assert.equal(v[0].id,2);assert.equal(v[1].id,1);
});
test('stage6 crafting checks ingredients and conserves output count',()=>{
 const v=expandInventory([{id:BLOCK.LOG,count:1}]);assert.equal(canCraft(v,RECIPES.find(r=>r.id==='planks')),true);
 assert.equal(craft(v,'planks'),true);assert.equal(countItem(v,BLOCK.LOG),0);assert.equal(countItem(v,BLOCK.PLANKS),4);
 assert.equal(craft(v,'crafting-table'),true);assert.equal(countItem(v,BLOCK.CRAFTING_TABLE),1);
 assert.equal(craft(v,'crafting-table'),false);
});
test('stage8 ai only attacks within proximity and has cooldown',()=>{
 const e=spawnEntity('wanderer',1,0,70,0),player={x:1,y:70,z:1};const a=decide(e,player,.1);
 assert.equal(a.mode,'attack');assert.equal(a.attack,true);assert.equal(decide(e,player,.1).attack,false);
 e.x=40;assert.equal(decide(e,player,3,()=>.4).mode,'wander');
});
test('stage8 grazing entities do not attack and collision prevents movement',()=>{
 const e=spawnEntity('grazer',2,0,70,0),p={x:.8,z:0};assert.equal(decide(e,p,.1,()=>0).attack,false);
 const x=e.x,z=e.z;stepEntity(e,p,.5,()=>true,()=>0);assert.equal(e.x,x);assert.equal(e.z,z);
});

test('legacy inventories with more than 64 items retain old counts when migrating',()=>{
 const inv=expandInventory([{id:BLOCK.STONE,count:220}]);assert.equal(inv[0].count,220);
});
test('craft works with full inventory when consumed ingredient makes the output slot',()=>{
 const inv=Array.from({length:36},()=>({id:BLOCK.STONE,count:64}));inv[0]={id:BLOCK.LOG,count:1};
 assert.equal(craft(inv,'planks'),true);assert.equal(countItem(inv,BLOCK.PLANKS),4);
});
