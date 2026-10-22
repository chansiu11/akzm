import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bundledButtonPixel112,BUNDLED_SITE_THEME_VERSION} from '../src/site-default112.js';

test('public site menu pixel resources are original reproducible code-only graphics',()=>{
 assert.equal(BUNDLED_SITE_THEME_VERSION,'akzm-original-ui-v1');
 assert.deepEqual(bundledButtonPixel112('normal',0,0),[33,34,38,255]);
 assert.deepEqual(bundledButtonPixel112('normal',1,1),[188,188,193,255]);
 assert.deepEqual(bundledButtonPixel112('normal',1,1),bundledButtonPixel112('normal',1,1));
 assert.notDeepEqual(bundledButtonPixel112('normal',99,10),bundledButtonPixel112('hover',99,10));
 assert.notDeepEqual(bundledButtonPixel112('normal',99,10),bundledButtonPixel112('disabled',99,10));
});
test('new site visitor receives bundled UI and blocks without uploading a JAR',()=>{
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../menu112.css',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(main,/installBundledSiteTheme112\(\)/);
 assert.match(main,/showAtlas\(texture\.image\)/);
 assert.match(main,/사이트 기본 블록·메뉴 그래픽이 자동 적용되었습니다/);
 assert.match(css,/site-default112:not\(\.gui112-assets\)/);
 assert.match(css,/--site112-normal/);
 assert.match(css,/--site112-dirt/);
 const site=readFileSync(new URL('../src/site-default112.js',import.meta.url),'utf8');
 assert.match(site,/sprites\.dirt=dirt\.toDataURL\('image\/png'\)/);
 assert.match(html,/원본 1\.12\.2\.jar 불러오기 \(선택\)/);
 assert.doesNotMatch(main,/1\.12\.2\.jar를 처음 한 번 선택하세요/);
});
