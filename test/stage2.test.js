import test from 'node:test';
import assert from 'node:assert/strict';
import {BLOCK, BLOCK_DEFS, BLOCK_NAMES, definition, normalizeState, isValidState,
  blockBoxes, intersectsAABB, renderBoxes, tileForBlock} from '../src/block-registry.js';
import {World, MAX_Y} from '../src/terrain.js';
import {ITEM_DEFS, itemDefinition, placeableItem, cleanInventory, starterInventory} from '../src/item-registry.js';
import {visibleBlockQuads, quadUV} from '../src/block-mesh.js';
import {REQUIRED_TILES} from '../src/resource-pack.js';
import {ATLAS_ROWS, ATLAS_COLUMNS, uvFor} from '../src/atlas.js';

test('existing saved block IDs 0..13 remain unchanged and new block IDs are unique', () => {
  assert.deepEqual(BLOCK_NAMES.slice(0, 14), ['Air','Grass','Dirt','Stone','Sand','Oak Log','Oak Leaves','Oak Planks','Water','Cobblestone','Coal Ore','Snow Block','Bricks','Bedrock']);
  assert.deepEqual([BLOCK.GLASS,BLOCK.SLAB,BLOCK.STAIRS,BLOCK.CRAFTING_TABLE], [14,15,16,17]);
  assert.equal(BLOCK_DEFS.length, new Set(BLOCK_DEFS.map(d => d.id)).size);
  assert.ok(BLOCK_DEFS.every((d,i) => d.id === i));
  assert.equal(definition(BLOCK.WATER).solid,false);
  assert.equal(definition(BLOCK.CRAFTING_TABLE).interact,'crafting');
});

test('block-state validation defaults and rejects unknown values', () => {
  assert.deepEqual(normalizeState(BLOCK.SLAB),{half:'bottom'});
  assert.deepEqual(normalizeState(BLOCK.SLAB,{half:'top'}),{half:'top'});
  assert.deepEqual(normalizeState(BLOCK.STAIRS,{facing:'west'}),{facing:'west'});
  assert.equal(isValidState(BLOCK.SLAB,{half:'top'}),true);
  assert.equal(isValidState(BLOCK.SLAB,{half:'sideways'}),false);
  assert.equal(isValidState(BLOCK.SLAB,{half:'top', hacked:true}),false);
  assert.equal(isValidState(200,{}),false);
});

test('half slab and stair shapes have distinct collision boxes', () => {
  const low=blockBoxes({id:BLOCK.SLAB,state:{half:'bottom'}});
  const high=blockBoxes({id:BLOCK.SLAB,state:{half:'top'}});
  assert.deepEqual(low,[[0,0,0,1,.5,1]]);
  assert.deepEqual(high,[[0,.5,0,1,1,1]]);
  assert.equal(intersectsAABB(low,0,1,0,.25,1.51,.25,.75,1.9,.75),false);
  assert.equal(intersectsAABB(low,0,1,0,.25,1.49,.25,.75,1.9,.75),true);
  assert.equal(blockBoxes({id:BLOCK.STAIRS,state:{facing:'north'}}).length,2);
  assert.equal(blockBoxes(BLOCK.WATER).length,0);
  assert.equal(renderBoxes(BLOCK.WATER).length,1);
});

test('existing JSON saves and new block states round-trip without losing other edits', () => {
  const old={version:1,edits:[['1,10,2',BLOCK.GRASS],['4,12,3',BLOCK.BRICK],['7,0,7',BLOCK.STONE]]};
  const world=new World(old);
  assert.equal(world.get(1,10,2),BLOCK.GRASS);
  assert.equal(world.get(4,12,3),BLOCK.BRICK);
  assert.equal(world.changes.has('7,0,7'),false);
  assert.equal(world.set(1,10,2,BLOCK.SLAB,{half:'top'}),true);
  assert.equal(world.set(4,12,3,BLOCK.STAIRS,{facing:'east'}),true);
  const saved=JSON.parse(JSON.stringify(world.serialize()));
  assert.equal(saved.version,4);
  assert.equal(saved.generator,1); // old terrain remains old terrain
  const reopened=new World(saved);
  assert.deepEqual(reopened.getBlock(1,10,2),{id:BLOCK.SLAB,state:{half:'top'}});
  assert.deepEqual(reopened.getBlock(4,12,3),{id:BLOCK.STAIRS,state:{facing:'east'}});
  assert.equal(reopened.set(1,10,2,BLOCK.SLAB,{half:'wrong'}),false);
  assert.equal(reopened.set(0,MAX_Y+1,0,BLOCK.GLASS),false);
});

test('item definitions and legacy hotbar are valid and separate from block definitions', () => {
  assert.equal(placeableItem(BLOCK.GLASS),BLOCK.GLASS);
  assert.equal(placeableItem(BLOCK.SLAB),BLOCK.SLAB);
  assert.equal(placeableItem(100),null);
  assert.equal(itemDefinition(100).key,'minecraft:coal');
  assert.ok(ITEM_DEFS.length>=35); // original block and standalone items remain registered after expansion
  const inv=cleanInventory([{id:BLOCK.GRASS,count:32},...starterInventory().slice(1)]);
  assert.equal(inv.length,9);
  assert.equal(inv[0].id,BLOCK.GRASS);
  assert.equal(inv[0].count,32);
  assert.equal(cleanInventory(null).length,9);
});

test('geometry emits only exposed faces with correct partial slab shape', () => {
  const dict=new Map();
  const w={getBlock:(x,y,z)=>dict.get(`${x},${y},${z}`)??{id:BLOCK.AIR,state:{}}};
  dict.set('0,1,0',{id:BLOCK.STONE,state:{}});
  const isolated=visibleBlockQuads(w,0,1,0);
  assert.equal(isolated.length,6);
  dict.set('1,1,0',{id:BLOCK.STONE,state:{}});
  assert.equal(visibleBlockQuads(w,0,1,0).length,5);
  dict.set('1,1,0',{id:BLOCK.SLAB,state:{half:'bottom'}});
  const partial=visibleBlockQuads(w,0,1,0);
  assert.equal(partial.length,7);
  dict.set('0,1,0',{id:BLOCK.SLAB,state:{half:'top'}});
  const shaped=visibleBlockQuads(w,0,1,0);
  assert.ok(shaped.length>=5);
  assert.ok(shaped.every(q=>q.v.every(p=>p[1]>=.5&&p[1]<=1)));
  assert.ok(shaped.every(q=>quadUV(q.id,q.d,q.v).every(p=>p.every(Number.isFinite))));
});

test('atlas tile references stay in range including crafting-table faces',()=>{
  assert.equal(ATLAS_COLUMNS,8);
  assert.equal(ATLAS_ROWS,6);
  assert.equal(REQUIRED_TILES.length,34);
  for(const d of BLOCK_DEFS){
    for(const normal of [[0,1,0],[0,-1,0],[0,0,1]]){
      const tile=tileForBlock(d.id,normal);
      assert.ok(Number.isInteger(tile)&&tile>=0&&tile<ATLAS_ROWS*ATLAS_COLUMNS,`${d.name}: tile ${tile}`);
      assert.ok(uvFor(tile).every(([u,v])=>u>=0&&u<=1&&v>=0&&v<=1));
    }
  }
});
