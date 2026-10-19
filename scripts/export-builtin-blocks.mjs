import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {configure,catalog} from '../public/survival.js';
import {blockItems} from '../public/items.js';
import {loadBuiltinAssets,resolveModel} from '../public/builtin-pack.js';
import {itemModelName} from '../public/model-icons.js';
globalThis.fetch=async url=>({json:async()=>JSON.parse(await fs.readFile(fileURLToPath(url),'utf8'))});
configure(JSON.parse(await fs.readFile('public/catalog.json','utf8')));await loadBuiltinAssets();
const existing=new Set(blockItems.slice(0,57)),extra=[];
for(const item of catalog.items){if(item.id>=256||item.id===0)continue;for(const meta of new Set([0,...(item.variations||[]).map(v=>v.metadata)])){const key=item.id+':'+meta;if(existing.has(key))continue;const name=itemModelName(key),model=name&&resolveModel(name);if(!model?.elements?.length)continue;const data=catalog.blocks.find(b=>b.id===item.id);extra.push({key,name:item.variations?.find(v=>v.metadata===meta)?.displayName||item.displayName,model:name,solid:data?.boundingBox==='block',transparent:!!data?.transparent,hardness:data?.hardness??1,harvestTools:data?.harvestTools||null,material:data?.material||null});}}
await fs.writeFile('public/extra-blocks.js','// Stable appended IDs generated from the supplied 1.8.9 models.\nexport const EXTRA_BLOCKS='+JSON.stringify(extra)+';\n');console.log('Additional placeable modeled blocks:',extra.length);
