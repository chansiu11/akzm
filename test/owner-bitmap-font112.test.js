import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {unicodeGlyphMetric,bitmapTextSupported112,glyphDescriptor112} from '../src/bitmap-font112.js';

const pages=new Map([[0xac,{kind:'fake-hangul-image'}],[0x20,{kind:'fake-punctuation'}]]);
const sizes=new Uint8Array(65536);
sizes[0xac00]=0x1e;
sizes[0x2026]=0x1e;
const widths=Array.from({length:128},()=>6);
test('1.12.2 Unicode font metrics crop a 16px original image cell',()=>{
 assert.deepEqual(unicodeGlyphMetric(0x1e),{start:1,width:14});
 const g=glyphDescriptor112(0xac00,{widths,sizes,pages});
 assert.deepEqual({kind:g.kind,advance:g.advance,width:g.width,sx:g.sx,sy:g.sy},{kind:'unicode',advance:8,width:14,sx:1,sy:0});
 const k=glyphDescriptor112(0x2026,{widths,sizes,pages});
 assert.equal(k.page,pages.get(0x20));
});
test('Korean and punctuation are supported only when corresponding owner sheets exist',()=>{
 assert.equal(bitmapTextSupported112('세계 선택',pages),true);
 assert.equal(bitmapTextSupported112('시야각: 75°',pages),false);
 assert.equal(bitmapTextSupported112('World options',pages),true);
 assert.equal(bitmapTextSupported112('세계 선택',new Map()),false);
 assert.equal(glyphDescriptor112(0xac00,{widths,sizes,pages:new Map()}),null);
});
test('original glyph files and Korean pages are imported locally and drawn to canvases',()=>{
 const file=readFileSync(new URL('../src/gui112-assets.js',import.meta.url),'utf8');
 const font=readFileSync(new URL('../src/bitmap-font112.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../menu112.css',import.meta.url),'utf8');
 assert.match(file,/glyph_sizes\.bin/);
 assert.match(file,/unicode_page_/);
 assert.match(file,/0xac\+i/);
 assert.match(font,/font\.pages/);
 assert.match(font,/sourceLayer\(lines/);
 assert.match(font,/paintField/);
 assert.match(css,/canvas\.bitmap-text\.bitmap-left112/);
 assert.match(css,/canvas\.bitmap-field-layer112/);
 assert.doesNotMatch(font,/@font-face|Google Fonts/);
});
