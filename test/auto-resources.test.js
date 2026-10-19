import test from 'node:test';
import assert from 'node:assert/strict';
import {mapBlockTextures,BLOCK_ROOT} from '../src/auto-resources.js';

test('all existing block image slots have a deterministic original-JAR path',()=>{
 const names=['grass_top','dirt','stone','sand','log_oak','leaves_oak','planks_oak','water_still','cobblestone','coal_ore','snow','brick','bedrock','grass_side','log_oak_top','glass'];
 const paths=names.map(x=>BLOCK_ROOT+x+'.png').concat(BLOCK_ROOT+'grass_side_overlay.png');
 const mapping=mapBlockTextures({paths});
 for(const name of names)assert.equal(mapping[name],BLOCK_ROOT+name+'.png');
 assert.equal(Object.values(mapping).filter(Boolean).length,17);
});
test('missing or corrupt manifests cannot silently masquerade as a complete texture set',()=>{
 const map=mapBlockTextures({paths:[BLOCK_ROOT+'stone.png','other-dir/grass_top.png']});
 assert.equal(map.stone,BLOCK_ROOT+'stone.png');assert.equal(map.grass_top,null);
 assert.equal(map.grass_side_overlay,null);
 assert.equal(mapBlockTextures(null).stone,null);
});
