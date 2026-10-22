import test from 'node:test';
import assert from 'node:assert/strict';
import {BLOCK,definition} from '../src/block-registry.js';
import {mineSeconds,mineStage112,miningProgressPerTick112,effectiveMiningTool112} from '../src/vanilla-mining.js';
import {readFileSync} from 'node:fs';

test('Java 1.12.2 tick-rounded stone mining speeds by pickaxe tier',()=>{
 assert.equal(definition(BLOCK.STONE).hardness,1.5);
 assert.equal(mineSeconds(BLOCK.STONE,0),7.5);
 assert.equal(mineSeconds(BLOCK.STONE,110),1.15);
 assert.equal(mineSeconds(BLOCK.STONE,111),.6);
 assert.equal(mineSeconds(BLOCK.STONE,114),.3);
 assert.equal(mineSeconds(BLOCK.STONE,113),.2);
});
test('Efficiency, Haste, submerged and airborne penalties affect the tool speed',()=>{
 const plain=mineSeconds(BLOCK.STONE,{id:114});
 const enchanted=mineSeconds(BLOCK.STONE,{id:114,enchantments:{efficiency:5}});
 assert.ok(enchanted<plain);
 assert.equal(mineSeconds(BLOCK.STONE,{id:114,enchantments:{efficiency:5}},{haste:2}),0);
 assert.ok(mineSeconds(BLOCK.STONE,114,{underwater:true})>=plain*4);
 assert.ok(mineSeconds(BLOCK.STONE,114,{onGround:false})>=plain*4);
 assert.equal(mineSeconds(BLOCK.BEDROCK,114),Infinity);
});
test('destroy-stage progress maps through exactly ten visible frames',()=>{
 assert.equal(mineStage112(0,1),0);
 assert.equal(mineStage112(.5,1),5);
 assert.equal(mineStage112(.98,1),9);
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../visual-overhaul.css',import.meta.url),'utf8');
 assert.match(main,/breakOverlay\.setTarget\(t,ratio\)/);
 assert.match(css,/#miningIndicator,#miningIndicator\.visible\{display:none!important\}/);
 assert.match(html,/id="miningIndicator"/);
});

test('supported axe and shovel tiers use block-specific 1.12.2 mining speed',()=>{
 assert.equal(mineSeconds(BLOCK.LOG,0),3);
 assert.equal(mineSeconds(BLOCK.LOG,117),1.5);
 assert.equal(mineSeconds(BLOCK.LOG,120),.25);
 assert.equal(mineSeconds(BLOCK.DIRT,0),.75);
 assert.equal(mineSeconds(BLOCK.DIRT,123),.2);
 assert.equal(mineSeconds(BLOCK.STONE,117),7.5);
 assert.equal(effectiveMiningTool112(BLOCK.CRAFTING_TABLE,121),true);
 assert.equal(effectiveMiningTool112(BLOCK.DIRT,114),false);
 assert.equal(effectiveMiningTool112(BLOCK.FURNACE,114),true);
});
test('partial block damage adds across mining tools and persists an Efficiency enchant',async()=>{
 const stoneNoTool=miningProgressPerTick112(BLOCK.STONE,0);
 const stoneDiamond=miningProgressPerTick112(BLOCK.STONE,{id:114,enchantments:{efficiency:3}});
 assert.ok(stoneDiamond>stoneNoTool*10);
 assert.ok(stoneNoTool>0);
 assert.equal(miningProgressPerTick112(BLOCK.BEDROCK,114),0);
 const {restoreInventory}=await import('../src/inventory-restore.js');
 const {moveStack}=await import('../src/inventory-utils.js');
 const inventory=restoreInventory([{id:114,count:1,damage:12,enchantments:{efficiency:3}}]).slots;
 assert.equal(inventory[0].enchantments.efficiency,3);
 assert.equal(moveStack(inventory,0,1),true);
 assert.equal(inventory[1].enchantments.efficiency,3);
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(main,/while\(mineTickRemainder>=\.05\)/);
 assert.match(main,/damage\+=miningProgressPerTick112\(t\.id,equipped,conditions\)/);
 assert.match(main,/missedMineTime<\.12/);
});
