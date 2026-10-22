import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('click screenshots cover three viewports and wait for terrain',()=>{
 const yaml=readFileSync(new URL('../.github/workflows/site-browser-review.yml',import.meta.url),'utf8');
 const js=readFileSync(new URL('../tools/visit-deployed-site.mjs',import.meta.url),'utf8');
 assert.match(yaml,/viewport: \[desktop, mobile, mobile-landscape\]/);
 assert.match(yaml,/REVIEW_VIEWPORT:/);
 assert.match(yaml,/akzm-site-screenshots-\$\{\{ matrix\.viewport \}\}/);
 assert.match(js,/process\.env\.REVIEW_VIEWPORT/);
 assert.match(js,/await clickAndCapture\(page,'#pauseSettings'/);
 assert.match(js,/await clickAndCapture\(page,'#pauseResume'/);
 assert.match(js,/Number\(match\[1\]\)>0/);
});
