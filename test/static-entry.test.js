import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
test('GitHub Pages root opens the game and all browser imports resolve locally',async()=>{const entry=await readFile(resolve(root,'index.html'),'utf8');assert.match(entry,/url=\.\/public\//);assert.match(entry,/location\.replace/);await access(resolve(root,'.nojekyll'));const html=await readFile(resolve(root,'public/index.html'),'utf8');const map=JSON.parse(html.match(/<script type="importmap">(.*?)<\/script>/s)[1]);assert.equal(map.imports.three,'./vendor/three.module.min.js');const seen=new Set();async function visit(path){if(seen.has(path))return;seen.add(path);const content=await readFile(path,'utf8');for(const match of content.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){const spec=match[1];if(spec==='three')await visit(resolve(root,'public',map.imports.three));else if(spec.startsWith('.'))await visit(resolve(dirname(path),spec));else assert.fail('Unresolved browser dependency '+spec);}}await visit(resolve(root,'public/app.js'));assert.ok(seen.size>=15);assert.ok(seen.has(resolve(root,'public/vendor/three.core.min.js')));});
