import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const smoke=readFileSync(new URL('../tools/verify-deployed-command.mjs',import.meta.url),'utf8');

test('desktop Escape opens pause regardless of pointer lock, without disturbing chat, inventory or menus',()=>{
 assert.match(main,/e\.code==='Escape'&&enteredWorld&&!inventoryOpen&&!survival\.dead&&!el\('overlay'\)\.classList\.contains\('show'\)/);
 assert.ok(!main.includes("e.code==='Escape'&&running&&touchMode"));
 assert.match(smoke,/page\.keyboard\.press\('Escape'\)/);
 assert.match(smoke,/page\.locator\('#menu-pause'\)\.waitFor\(\{state:'visible'/);
 assert.match(smoke,/page\.locator\('#pauseSettings'\)\.click\(\)/);
 assert.match(smoke,/page\.locator\('#pauseResume'\)\.click\(\)/);
});
