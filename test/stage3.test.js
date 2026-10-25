import test from 'node:test';
import assert from 'node:assert/strict';
import {World,BIOMES,SEA_LEVEL,MAX_Y,GENERATOR_VERSION,SEED,BLOCK,biomeAt,heightAt,caveAt,ruinOrigin,legacyNaturalBlock} from '../src/terrain.js';
import {parseWorldSeed} from '../src/menu.js';
import {REQUIRED_TILES} from '../src/resource-pack.js';

// No original game's executable generator algorithm is imported or reproduced here.
test('stage3 world generation uses complete 0..255 coordinate range',()=>{
 assert.equal(MAX_Y,255);assert.equal(SEA_LEVEL,63);assert.equal(GENERATOR_VERSION,5);
 const w=new World(null,{seed:314159});
 assert.equal(w.generator,5);assert.equal(w.get(0,0,0),BLOCK.BEDROCK);
 assert.equal(w.get(0,MAX_Y+1,0),BLOCK.AIR);
 assert.ok(w.surfaceHeight(0,0)>0 && w.surfaceHeight(0,0)<MAX_Y);
 assert.equal(w.set(7,255,8,BLOCK.STONE),true);
 assert.equal(w.get(7,255,8),BLOCK.STONE);
 assert.equal(w.set(7,256,8,BLOCK.STONE),false);
});

test('distinct world seeds produce distinct and repeatable terrain independent of query order',()=>{
 const a=new World(null,{seed:52}),a2=new World(null,{seed:52}),b=new World(null,{seed:830});
 let differences=0;
 const sample=[];for(let x=-64;x<=64;x+=13)for(let z=-64;z<=64;z+=17)sample.push([x,z]);
 for(const [x,z] of sample){
  assert.equal(a.biome(x,z),a2.biome(x,z));
  assert.equal(a.surfaceHeight(x,z),a2.surfaceHeight(x,z));
  for(const y of [1,12,30,63,80,112,165])assert.equal(a.get(x,y,z),a2.get(x,y,z));
  if(a.surfaceHeight(x,z)!==b.surfaceHeight(x,z)||a.biome(x,z)!==b.biome(x,z))differences++;
 }
 assert.ok(differences>sample.length/4);
 const first=a.get(3,25,3);a.get(39,78,-71);assert.equal(a.get(3,25,3),first);
});

test('biome regions contain differing terrain and several mapped blocks',()=>{
 const w=new World(null,{seed:18909});
 const found=new Set(),surfaces=new Set();
 for(let x=-450;x<=450;x+=27)for(let z=-450;z<=450;z+=27){
  const biome=w.biome(x,z);found.add(biome);
  assert.ok(BIOMES.includes(biome));
  const h=w.surfaceHeight(x,z),s=w.get(x,h,z);surfaces.add(s);
  assert.ok(h>1&&h<MAX_Y);
  if(biome==='ocean'){assert.ok(h<=SEA_LEVEL);assert.equal(w.get(x,SEA_LEVEL,z),BLOCK.WATER);}
  if(biome==='snowy')assert.equal(s,BLOCK.SNOW);
 }
 assert.ok(found.size>=4,`biomes=${[...found]}`);
 assert.ok(surfaces.has(BLOCK.SAND));assert.ok(surfaces.has(BLOCK.GRASS)||surfaces.has(BLOCK.SNOW));
});

test('underground caves and multiple ore types actually materialize',()=>{
 const w=new World(null,{seed:910});let cave=0,iron=0,coal=0;
 for(let x=-36;x<36;x+=2)for(let z=-36;z<36;z+=2)for(let y=6;y<49;y+=2){
  const id=w.get(x,y,z),top=w.surfaceHeight(x,z);
  if(y<top-5&&id===BLOCK.AIR)cave++;
  if(id===BLOCK.IRON_ORE)iron++;
  if(id===BLOCK.COAL)coal++;
 }
 assert.ok(cave>20,`caves=${cave}`);assert.ok(iron>0);assert.ok(coal>0);
});

test('small ruined structures appear, even when crossing theoretical chunk boundaries',()=>{
 let origin=null;
 for(let cx=-10;cx<=10&&!origin;cx++)for(let cz=-10;cz<=10&&!origin;cz++)origin=ruinOrigin(cx,cz,2026);
 assert.ok(origin);
 const w=new World({generator:3,seed:2026,edits:[]});
 assert.equal(w.get(origin.x+3,origin.y,origin.z+3),origin.block);
 assert.equal(w.get(origin.x-3,origin.y,origin.z-3),origin.block);
 assert.notEqual(w.get(origin.x,origin.y,origin.z+3),BLOCK.BEDROCK);
});

test('old v1/v2 saved generator remains pixel-for-pixel the legacy block identities',()=>{
 const saved={version:2,seed:18909,edits:[['1,15,1',BLOCK.BRICK],['2,15,1',{id:BLOCK.SLAB,state:{half:'top'}}]]};
 const old=new World(saved);assert.equal(old.generator,1);
 assert.equal(old.get(1,15,1),BLOCK.BRICK);
 for(let x=-32;x<=32;x+=4)for(let z=-32;z<=32;z+=4)for(let y=0;y<36;y+=3){
  if(x===1&&z===1)continue;
  assert.equal(old.get(x,y,z),legacyNaturalBlock(x,y,z));
 }
 const reopen=new World(JSON.parse(JSON.stringify(old.serialize())));
 assert.equal(reopen.generator,1);assert.equal(reopen.get(1,15,1),BLOCK.BRICK);
 assert.deepEqual(reopen.getState(2,15,1),{half:'top'});
 assert.equal(old.get(1,180,1),BLOCK.AIR);
});

test('new world save restores same seed and edits; changing seed changes actual world',()=>{
 const a=new World(null,{seed:-2488234});
 assert.equal(a.set(10,220,12,BLOCK.GLASS),true);
 const saved=JSON.parse(JSON.stringify(a.serialize()));
 assert.equal(saved.generator,5);assert.equal(saved.seed,-2488234);
 const b=new World(saved,{seed:13});
 assert.equal(b.get(10,220,12),BLOCK.GLASS);
 assert.equal(b.get(6,20,6),a.get(6,20,6));
 assert.equal(b.biome(188,-131),a.biome(188,-131));
});

test('seed field reads stable text/negative numeric seed and random blank',()=>{
 assert.equal(parseWorldSeed('12345'),12345);
 assert.equal(parseWorldSeed('-12345'),-12345);
 assert.equal(parseWorldSeed('example'),parseWorldSeed('example'));
 assert.equal(parseWorldSeed('4294967296'),0); // signed 32-bit input
 assert.ok(Number.isSafeInteger(parseWorldSeed('')));
});

test('added block IDs and original texture filenames are indexed without reordering saved IDs',()=>{
 assert.deepEqual([BLOCK.GRASS,BLOCK.BEDROCK,BLOCK.CRAFTING_TABLE,BLOCK.IRON_ORE,BLOCK.DIAMOND], [1,13,17,18,20]);
 for(const tile of ['iron_ore','gold_ore','diamond_ore','gravel','sandstone_normal','clay','log_spruce','leaves_spruce','lapis_ore','redstone_ore','emerald_ore'])assert.ok(REQUIRED_TILES.includes(tile));
 assert.equal(REQUIRED_TILES.length,34);
});
