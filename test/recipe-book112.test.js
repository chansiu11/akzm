import test from 'node:test';import assert from 'node:assert/strict';
import {recipeBookEntries} from '../src/recipe-book112.js';import {GRID_RECIPES} from '../src/crafting-grid.js';
test('recipe guide filters by grid capacity and both Korean name and identifier',()=>{
 assert.ok(recipeBookEntries(GRID_RECIPES,2).every(r=>!r.requiresTable));
 assert.equal(recipeBookEntries(GRID_RECIPES,2,'pickaxe').length,0);
 assert.equal(recipeBookEntries(GRID_RECIPES,3,'IRON-PICKAXE')[0].id,'iron-pickaxe');
 assert.equal(recipeBookEntries(GRID_RECIPES,3,'  화로 ')[0].id,'furnace');
 assert.equal(recipeBookEntries(GRID_RECIPES,3,'no such recipe').length,0);
});
