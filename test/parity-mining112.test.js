import test from 'node:test';
import assert from 'node:assert/strict';
import {BLOCK,definition} from '../src/block-registry.js';
import {mineSeconds,mineStage112} from '../src/vanilla-mining.js';
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
