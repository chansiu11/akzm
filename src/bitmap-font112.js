// Owner-local Minecraft 1.12.2 bitmap typeface. Never upload/serve the JAR fonts.
// ASCII: 128x128, 8x8 cells. Unicode: 256x256, 16x16 cells at 1/2 scale.
// glyph_sizes.bin uses (startColumn<<4)|endColumn and contains 65536 bytes.
import {pngData} from './menu112-assets.js';
export function unicodeGlyphMetric(byte){
 const start=byte>>>4;
 return {start,width:byte?((byte&15)-start+1):0};
}
export function bitmapTextSupported112(value,pages=null){
 return [...String(value??'')].every(c=>{
  const n=c.codePointAt(0);
  return n===10||n===13||n===9||n===32||(n>=33&&n<127)||
   (pages!=null&&n<=65535&&pages.has(n>>>8));
 });
}
export function glyphDescriptor112(code,{widths=[],sizes=[],pages=new Map()}={}){
 if(code===32||code===160)return {kind:'space',width:0,advance:4};
 if(code===9)return {kind:'space',width:0,advance:16};
 if(code>=33&&code<127){
  const width=widths[code]??0;
  return width>0?{kind:'ascii',code,width,advance:width+1,sx:code%16*8,sy:Math.floor(code/16)*8}:null;
 }
 if(code>65535||code<32)return null;
 const page=pages.get(code>>>8);
 const metric=unicodeGlyphMetric(sizes[code]??0);
 return page&&metric.width>0?
  {kind:'unicode',code,width:metric.width,advance:metric.width/2+1,
   sx:(code&15)*16+metric.start,sy:((code>>>4)&15)*16,page}:null;
}
const selector=[
 '#overlay button','#overlay h2','#overlay p','#overlay strong','#overlay small',
 '#overlay label','#overlay output','#overlay summary','#overlay .world-text112 > *',
 '#overlay .help-text','#overlay .vanilla-resource-note112',
 '#inventory button','#inventory h2','#inventory h3','#inventory p','#inventory strong',
 '#inventory small','#inventory summary','#inventory label','#inventory .item span',
 '#inventory .container-slot span','#inventory #progressionPanel span','#inventory #craftRecipes span',
 '#inventory .catalog-hint','#inventory .recipe-item',
 '#hotbar .slot span','#status','#gameNotice','#chatHistory112',
 '#deathScreen h2','#deathScreen button','#deathScreen p',
 '#commandPanel button','#commandPanel strong','#commandPanel b',
 '#commandPanel p','#commandPanel small','#commandPanel code',
 '#commandPanel .command-arg','#commandPanel .command-output',
 '#touchControls button','#menuSplash','#packStatus'
].join(',');
const fieldSelector=[
 '#overlay input[type="text"]','#overlay input:not([type])',
 '#commandPanel input[type="text"]','#commandPanel input:not([type])',
 '#inventory input[type="text"]','#inventory input:not([type])'
].join(',');
const leftSelector=[
 '#overlay label','#overlay .world-text112 > *','#overlay p','#overlay small',
 '#overlay .help-text','#overlay summary','#overlay .vanilla-resource-note112',
 '#inventory p','#inventory label','#inventory summary','#inventory .item span',
 '#inventory .catalog-hint','#inventory .recipe-item','#inventory #progressionPanel span',
 '#commandPanel p','#commandPanel code','#commandPanel small',
 '#commandPanel .command-output','#status','#chatHistory112','#packStatus'
].join(',');
let font=null,observer=null,queued=false;
const labelCache=new WeakMap(),fieldCanvases=new Map(),composingInputs=new WeakSet();
const img=uri=>new Promise((resolve,reject)=>{
 const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=uri;
});
function sourceText(node){
 // Text nodes only: never hide the names of nested buttons or world icons.
 return [...node.childNodes].filter(n=>n.nodeType===3||n.nodeName==='BR').map(n=>n.nodeName==='BR'?'\n':n.textContent).join('')
   .replace(/\r\n?/g,'\n').trim();
}
function glyphLines(text,maxWidth=Infinity){
 const lines=text.split('\n').slice(0,24),output=[];
 for(const line of lines){
  const glyphs=[];
  for(const char of line){
   const entry=glyphDescriptor112(char.codePointAt(0),font);
   if(!entry)return null;
   glyphs.push(entry);
  }
  if(Number.isFinite(maxWidth)){
   let row=[],width=0;
   for(const g of glyphs){
    if(row.length&&width+g.advance>maxWidth){output.push(row);row=[];width=0;}
    row.push(g);width+=g.advance;
   }
   output.push(row);
  }else output.push(glyphs);
 }
 return output;
}
function sourceLayer(lines,{foreground='#e0e0e0',shadow='#373737'}={},lineHeight=10){
 // Keep the 2x logical raster: Unicode pages draw 16px glyphs at 8px game size.
 const maxWidth=Math.max(2,...lines.map(gs=>gs.reduce((w,g)=>w+g.advance*2,0)+4));
 const lineAdvance=Math.max(18,Math.round(lineHeight*2)),height=Math.max(20,(lines.length-1)*lineAdvance+20);
 const output=document.createElement('canvas');output.width=Math.ceil(maxWidth);output.height=height;
 const ctx=output.getContext('2d');ctx.imageSmoothingEnabled=false;
 const imageText=(context,ox,oy)=>{
  for(let i=0;i<lines.length;i++){
   let x=ox;
   for(const g of lines[i]){
    if(g.kind==='ascii')context.drawImage(font.ascii,g.sx,g.sy,g.width,8,x,oy+i*lineAdvance,g.width*2,16);
    else if(g.kind==='unicode')context.drawImage(g.page,g.sx,g.sy,g.width,16,x,oy+i*lineAdvance,g.width,16);
    x+=g.advance*2;
   }
  }
 };
 imageText(ctx,2,2);ctx.globalCompositeOperation='source-in';ctx.fillStyle=shadow;
 ctx.fillRect(0,0,output.width,height);ctx.globalCompositeOperation='source-over';
 const fg=document.createElement('canvas');fg.width=output.width;fg.height=height;
 const fgctx=fg.getContext('2d');fgctx.imageSmoothingEnabled=false;
 imageText(fgctx,0,0);fgctx.globalCompositeOperation='source-in';
 fgctx.fillStyle=foreground;fgctx.fillRect(0,0,output.width,height);
 ctx.drawImage(fg,0,0);
 return output;
}
function visible(node){
 if(!node.isConnected)return false;
 if(node.closest('.hidden'))return false;
 const s=getComputedStyle(node);
 return s.display!=='none'&&s.visibility!=='hidden'&&node.getClientRects().length>0;
}
function palette(node){
 const disabled=node.disabled||node.getAttribute('aria-disabled')==='true';
 const hover=!disabled&&node.matches(':hover')&&node.matches('button');
 const splash=node.id==='menuSplash';
 const dark=!!node.closest('#inventory')&&!node.closest('button')&&!node.matches('.container-slot span');
 return {foreground:splash?'#ffff00':disabled?'#a0a0a0':hover?'#ffffa0':dark?'#404040':'#e0e0e0',shadow:dark?'#aaa':'#373737'};
}
function paintLabel(node){
 if(!font||!visible(node)||node.closest('.bitmap-field-layer112'))return;
 const text=sourceText(node);
 if(!text){clearLabel(node);return;}
 const style=getComputedStyle(node),rect=node.getBoundingClientRect();
 const s=Math.max(1,Math.min(7,(parseFloat(style.fontSize)||12)/8));
 const flow=node.matches('.help-text,.vanilla-resource-note112,.command-output,#status,#chatHistory112,#inventory p,#overlay p');
 const lines=glyphLines(text,flow?Math.max(10,(rect.width-8)/s):Infinity);
 if(!lines){clearLabel(node);return;}
 const lh=parseFloat(style.lineHeight),lineHeight=Number.isFinite(lh)?Math.max(9,lh/s):10;
 const left=node.matches(leftSelector);
 const colors=palette(node);
 const key=JSON.stringify([text,s,lineHeight,left,flow,rect.width,rect.height,colors.foreground,colors.shadow]);
 const canvas=node.querySelector(':scope > canvas.bitmap-text');
 if(labelCache.get(node)===key&&canvas)return;
 const layer=sourceLayer(lines,colors,lineHeight);
 if(!layer)return;
 const maxWidth=Math.max(1,rect.width-(left?0:4)),scale=Math.min(s,maxWidth/(layer.width/2));
 const rendered=canvas||document.createElement('canvas');
 if(!canvas){rendered.className='bitmap-text';rendered.setAttribute('aria-hidden','true');node.append(rendered);}
 rendered.width=layer.width;rendered.height=layer.height;
 rendered.style.width=(layer.width/2*scale)+'px';
 rendered.style.height=(layer.height/2*scale)+'px';
 rendered.classList.toggle('bitmap-left112',left);
 rendered.classList.toggle('bitmap-flow112',flow);
 const out=rendered.getContext('2d');out.clearRect(0,0,layer.width,layer.height);out.drawImage(layer,0,0);
 node.classList.add('bitmap-label');
 labelCache.set(node,key);
}
function clearLabel(node){
 node.querySelector(':scope > canvas.bitmap-text')?.remove();
 node.classList.remove('bitmap-label');labelCache.delete(node);
}
function paintField(input){
 if(!font)return;
 // Native IME composition must stay visible and editable until committed.
 if(composingInputs.has(input))return;
 const text=input.value||input.placeholder||'',lines=glyphLines(text);
 const shouldPaint=visible(input)&&!!text&&!!lines&&!input.matches('[type="password"],[type="number"]');
 let canvas=fieldCanvases.get(input);
 if(!shouldPaint){if(canvas)canvas.style.display='none';input.classList.remove('bitmap-input112');return;}
 if(!canvas){
  canvas=document.createElement('canvas');canvas.className='bitmap-field-layer112';
  canvas.dataset.bitmapFor=input.id||'unnamed';
  canvas.setAttribute('aria-hidden','true');document.body.append(canvas);fieldCanvases.set(input,canvas);
 }
 const rect=input.getBoundingClientRect(),style=getComputedStyle(input);
 const scale=Math.max(1,Math.min(6,(parseFloat(style.fontSize)||16)/8));
 const image=sourceLayer(lines,{foreground:'#fff',shadow:'#333'});
 const pad=parseFloat(style.paddingLeft)||0,space=Math.max(1,rect.width-pad-(parseFloat(style.paddingRight)||0));
 const drawScale=Math.min(scale,space/(image.width/2));
 canvas.width=image.width;canvas.height=image.height;canvas.style.display='block';
 canvas.style.left=(rect.left+pad-input.scrollLeft)+'px';
 canvas.style.top=(rect.top+(rect.height-image.height/2*drawScale)/2)+'px';
 canvas.style.width=(image.width/2*drawScale)+'px';canvas.style.height=(image.height/2*drawScale)+'px';
 const out=canvas.getContext('2d');out.clearRect(0,0,image.width,image.height);out.drawImage(image,0,0);
 input.classList.add('bitmap-input112');
}
function schedule(){
 if(queued||!font)return;queued=true;
 requestAnimationFrame(()=>{
  queued=false;
  document.querySelectorAll(selector).forEach(paintLabel);
  document.querySelectorAll(fieldSelector).forEach(paintField);
  for(const [input,canvas] of fieldCanvases){if(!input.isConnected){canvas.remove();fieldCanvases.delete(input);}}
 });
}
export async function applyBitmapFont112(assets){
 const data=assets?.bitmapFont;
 if(!pngData(data?.ascii)||typeof data.sizes!=='string'||!data.pages)return false;
 const sizes=Uint8Array.from(atob(data.sizes),c=>c.charCodeAt(0));
 if(sizes.length!==65536)return false;
 const ascii=await img(data.ascii);
 const probe=document.createElement('canvas');probe.width=probe.height=128;
 const pctx=probe.getContext('2d');pctx.drawImage(ascii,0,0,128,128);
 const pixels=pctx.getImageData(0,0,128,128).data;
 const widths=Array.from({length:128},(_,code)=>{
  if(code===32)return 3;
  let w=0;
  for(let x=0;x<8;x++)for(let y=0;y<8;y++){
   const alpha=pixels[((Math.floor(code/16)*8+y)*128+code%16*8+x)*4+3];
   if(alpha>0)w=Math.max(w,x+1);
  }return w;
 });
 const entries=await Promise.all(Object.entries(data.pages)
  .filter(([,uri])=>pngData(uri)).map(async([page,uri])=>[Number(page),await img(uri)]));
 font={ascii,sizes,widths,pages:new Map(entries)};
 document.documentElement.classList.add('bitmap-font-ready112');
 if(!observer){
  observer=new MutationObserver(records=>{
   const meaningful=records.some(r=>{
    if(r.type==='characterData')return !r.target.parentElement?.closest('canvas.bitmap-text,canvas.bitmap-field-layer112');
    if(r.type==='attributes')return !(r.attributeName==='class'&&r.target.classList.contains('bitmap-label'));
    return [...r.addedNodes,...r.removedNodes].some(n=>
     n.nodeType===3||!(n.nodeName==='CANVAS'&&
      /bitmap-(text|field-layer112)/.test(n.className||'')));
   });
   if(meaningful)schedule();
  });
  observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled','class','value','placeholder']});
  document.addEventListener('input',e=>{if(e.target.matches?.(fieldSelector))paintField(e.target)},true);
  document.addEventListener('change',schedule,true);
  document.addEventListener('pointerover',e=>{const b=e.target.closest?.('button');if(b)paintLabel(b)},true);
  document.addEventListener('pointerout',e=>{const b=e.target.closest?.('button');if(b)paintLabel(b)},true);
  document.addEventListener('compositionstart',e=>{if(e.target.matches?.(fieldSelector)){composingInputs.add(e.target);e.target.classList.remove('bitmap-input112');const c=fieldCanvases.get(e.target);if(c)c.style.display='none';}},true);
  document.addEventListener('compositionend',e=>{if(e.target.matches?.(fieldSelector)){composingInputs.delete(e.target);paintField(e.target)}},true);
  document.addEventListener('scroll',schedule,true);
  window.addEventListener('resize',schedule);
 }
 schedule();return true;
}
