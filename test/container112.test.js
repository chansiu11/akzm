import test from 'node:test';
import assert from 'node:assert/strict';
import {containerLayout112,layoutContainer112} from '../src/container112.js';
import {applyGui112,validGui112Assets} from '../src/gui112-assets.js';
for(const kind of ['inventory','crafting','chest','furnace'])test(`${kind} slot layout stays inside background without overlap`,()=>{
 const m=containerLayout112(kind),cells=[...m.slots,...(kind==='chest'?m.chest:kind==='furnace'?Object.values(m.furnace):[...m.craft,m.output])];
 for(const s of cells){assert.ok(s.x>=0&&s.x+16<=m.width);assert.ok(s.y>=0&&s.y+16<=m.height);}
 for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++){const a=cells[i],b=cells[j];assert.ok(Math.abs(a.x-b.x)>=16||Math.abs(a.y-b.y)>=16);}
 assert.equal(m.slots.length,36);
 assert.equal(m.slots[0].y,kind==='chest'?146:142);
 assert.equal(m.slots[9].y,kind==='chest'?88:84);
});
test('container coordinates address inventory, crafting, and furnace outputs separately',()=>{
 assert.deepEqual(containerLayout112().output,{x:154,y:28});
 assert.deepEqual(containerLayout112('crafting').output,{x:124,y:35});
 assert.deepEqual(containerLayout112('furnace').furnace.output,{x:116,y:35});
 assert.throws(()=>containerLayout112('unknown'),RangeError);
 layoutContainer112(null);
});
test('old private caches keep HUD while optional textures cannot inject CSS',()=>{
 const assets=Object.fromEntries(['widgets','icons','inventory','crafting'].map(k=>[k,'data:image/png;base64,AA==']));
 assert.ok(validGui112Assets(assets));
 const styles=new Map(),classes=new Map();
 const root={style:{setProperty:(k,v)=>styles.set(k,v)},classList:{add:k=>classes.set(k,true),toggle:(k,v)=>classes.set(k,v)}};
 applyGui112(root,{...assets,chest:'url(https://invalid.example/)',furnace:'data:image/png;base64,AA=='});
 assert.equal(styles.has('--gui112-chest'),false);
 assert.equal(classes.get('gui112-furnace'),true);
});
