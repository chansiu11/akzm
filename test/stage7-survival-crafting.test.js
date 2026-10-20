import test from 'node:test';
import assert from 'node:assert/strict';
import {Survival,starvationFloor} from '../src/survival.js';
import {emptyCraftGrid,recipeAt,craftGridOnce} from '../src/crafting-grid.js';
import {BLOCK} from '../src/block-registry.js';
import {expandInventory} from '../src/inventory-utils.js';
test('starvation floor is difficulty-sensitive and a preexisting save defaults to normal',()=>{
 assert.deepEqual(['easy','normal','hard'].map(starvationFloor),[10,1,0]);
 for(const difficulty of ['easy','normal','hard']){
  const survivor=new Survival({difficulty,health:12,hunger:0,saturation:0});
  for(let i=0;i<65;i++)survivor.tick(4);
  assert.equal(survivor.health,starvationFloor(difficulty));
  assert.equal(survivor.dead,difficulty==='hard');
  assert.equal(new Survival(survivor.serialize()).difficulty,difficulty);
 }
 const old=new Survival({health:12,hunger:0});assert.equal(old.difficulty,'normal');
});
test('peaceful hunger exhaustion never generates starvation damage',()=>{
 const s=new Survival({difficulty:'peaceful',health:10,hunger:0});
 for(let i=0;i<25;i++)s.tick(4);
 assert.equal(s.health,10);
});
test('stairs can be crafted in either of the two 1.8.9-style mirrored patterns',()=>{
 const left=emptyCraftGrid(3),right=emptyCraftGrid(3);
 for(const [y,line] of ['P  ','PP ','PPP'].entries())for(let x=0;x<3;x++)if(line[x]==='P')left[y*3+x]={id:BLOCK.PLANKS,count:1};
 for(const [y,line] of ['  P',' PP','PPP'].entries())for(let x=0;x<3;x++)if(line[x]==='P')right[y*3+x]={id:BLOCK.PLANKS,count:1};
 assert.equal(recipeAt(left,3)?.recipe.id,'stairs');
 assert.equal(recipeAt(right,3)?.recipe.id,'stairs');
 assert.equal(recipeAt(right,3)?.mirrored,true);
 const inventory=expandInventory([]);
 assert.equal(craftGridOnce(right,3,inventory)?.count,4);
 assert.ok(inventory.some(slot=>slot.id===BLOCK.STAIRS&&slot.count===4));
});
test('non-stair shaped recipes do not automatically gain mirrored layouts',()=>{
 const grid=emptyCraftGrid(3);
 for(const [y,line] of [' S ',' S ','PPP'].entries())for(let x=0;x<3;x++)if(line[x]!==' ')grid[y*3+x]={id:line[x]==='P'?BLOCK.PLANKS:103,count:1};
 assert.equal(recipeAt(grid,3),null);
});
