import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {World,BLOCK} from '../src/terrain.js';import {TileStore} from '../src/tile-data.js';
import {Survival} from '../src/survival.js';import {WeatherCycle} from '../src/environment.js';import {Progression} from '../src/progression.js';
import {expandInventory,giveItem} from '../src/inventory-utils.js';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
test('world, tiles, inventory, survival, weather and progress save round-trip together',()=>{
 const world=new World(null,{seed:309});world.set(9,117,9,BLOCK.CHEST);
 const tiles=new TileStore();tiles.ensure(9,117,9,'chest').slots[0]={id:BLOCK.STONE,count:3};
 const inventory=expandInventory();giveItem(inventory,BLOCK.PLANKS,17);
 const survival=new Survival({health:15,hunger:12}),weather=new WeatherCycle({kind:'rain',remaining:100}),progression=new Progression();progression.add('mined');
 const json=JSON.stringify({world:world.serialize(),tiles:tiles.save(),inventory,survival:survival.serialize(),weather:weather.serialize(),progression:progression.serialize()});
 const data=JSON.parse(json);assert.equal(new World(data.world).get(9,117,9),BLOCK.CHEST);
 assert.equal(new TileStore(data.tiles).ensure(9,117,9,'chest').slots[0].count,3);
 assert.equal(expandInventory(data.inventory).find(i=>i.id===BLOCK.PLANKS).count,17);
 assert.equal(new Survival(data.survival).health,15);assert.equal(new WeatherCycle(data.weather).kind,'rain');
 assert.equal(new Progression(data.progression).unlocked.has('first_block'),true);
});
test('manual, autosave and unload all use the same complete snapshot',()=>{
 const script=fs.readFileSync(path.join(root,'src/main.js'),'utf8');
 assert.equal(script.split('JSON.stringify(snapshot())').length-1,3);
 assert.match(script,/function snapshot\(\).*tiles:tiles\.save\(\).*progression:progression\.serialize\(\)/);
});
