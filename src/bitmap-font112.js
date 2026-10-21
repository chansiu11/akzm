// Bitmap glyph rendering from owner-local JAR assets. No font data ships here.
import {pngData} from './menu112-assets.js';
export function unicodeGlyphMetric(byte){return {start:byte>>>4,width:byte?((byte&15)-(byte>>>4)+1):0};}
let font=null,observer=null,pending=false;
const selectors='#overlay button,#overlay h2,#inventory .inventory-head strong,#inventory .container-slot span,#hotbar .slot span,#menuSplash';
async function imageData(uri){const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=uri;});return image;}
export async function applyBitmapFont112(assets){
 const data=assets?.bitmapFont;if(!pngData(data?.ascii)||typeof data?.sizes!=='string'||!data?.pages)return false;
 const sizes=Uint8Array.from(atob(data.sizes),c=>c.charCodeAt(0));if(sizes.length!==65536)return false;
 const ascii=await imageData(data.ascii),pages=new Map();
 for(const [key,uri] of Object.entries(data.pages))if(pngData(uri))pages.set(Number(key),await imageData(uri));
 const probe=document.createElement('canvas');probe.width=probe.height=128;const ctx=probe.getContext('2d');ctx.drawImage(ascii,0,0);const pixels=ctx.getImageData(0,0,128,128).data;
 const widths=Array.from({length:128},(_,code)=>{if(code===32)return 3;let width=0;for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(pixels[((Math.floor(code/16)*8+y)*128+code%16*8+x)*4+3]>0)width=Math.max(width,x+1);return width;});
 font={ascii,pages,sizes,widths};
 if(!observer){observer=new MutationObserver(records=>{if(records.every(r=>(r.type==='attributes'&&r.target.classList.contains('bitmap-label'))||r.type==='childList'&&[...r.addedNodes,...r.removedNodes].every(n=>n.nodeName==='CANVAS')))return;schedule();});observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','class']});window.addEventListener('resize',schedule);}
 schedule();return true;
}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;document.querySelectorAll(selectors).forEach(paint);});}
function paint(node){
 if(!font||!node.getBoundingClientRect().width)return;
 const text=[...node.childNodes].filter(n=>n.nodeName!=='CANVAS').map(n=>n.textContent).join('').trim();if(!text)return;
 const glyphs=[...text].map(c=>{const code=c.codePointAt(0);if(code<128)return {image:font.ascii,sx:code%16*8,sy:Math.floor(code/16)*8,sw:font.widths[code],sh:8,w:font.widths[code],advance:font.widths[code]+1};const m=unicodeGlyphMetric(font.sizes[code]??0);return {image:font.pages.get(code>>>8),sx:code%16*16+m.start,sy:Math.floor(code%256/16)*16,sw:m.width,sh:16,w:m.width/2,advance:m.width/2+1};});
 if(glyphs.some(g=>!g.image))return;
 const logicalWidth=Math.ceil(glyphs.reduce((s,g)=>s+g.advance,0)),layer=document.createElement('canvas');layer.width=logicalWidth+1;layer.height=10;const ctx=layer.getContext('2d');ctx.imageSmoothingEnabled=false;
 let x=0;for(const g of glyphs){if(g.sw)ctx.drawImage(g.image,g.sx,g.sy,g.sw,g.sh,x,0,g.w,8);x+=g.advance;}
 ctx.globalCompositeOperation='source-in';ctx.fillStyle=node.id==='menuSplash'?'#ffff00':node.disabled?'#a0a0a0':node.matches(':hover')&&node.nodeName==='BUTTON'?'#ffffa0':node.closest('#inventory')&&!node.matches('span')?'#404040':'#e0e0e0';ctx.fillRect(0,0,layer.width,10);
 let canvas=node.querySelector(':scope > canvas.bitmap-text');if(!canvas){canvas=document.createElement('canvas');canvas.className='bitmap-text';canvas.setAttribute('aria-hidden','true');node.append(canvas);node.addEventListener('mouseenter',()=>paint(node));node.addEventListener('mouseleave',()=>paint(node));}
 const rect=node.getBoundingClientRect(),size=parseFloat(getComputedStyle(node).fontSize)||16,scale=node.id==='menuSplash'?(1.8*100/(logicalWidth+32))*(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--menu-scale'))||1):Math.min(size/8,Math.max(1,rect.width-4)/layer.width);
 canvas.width=layer.width;canvas.height=10;canvas.style.width=layer.width*scale+'px';canvas.style.height=10*scale+'px';const out=canvas.getContext('2d');out.clearRect(0,0,canvas.width,canvas.height);
 if(!node.closest('#inventory')||node.matches('span')){out.drawImage(layer,1,1);out.globalCompositeOperation='source-in';out.fillStyle='#353535';out.fillRect(0,0,canvas.width,canvas.height);out.globalCompositeOperation='source-over';}
 out.drawImage(layer,0,0);node.classList.add('bitmap-label');
}
