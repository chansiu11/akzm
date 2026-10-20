// Exact 1.12.2 sprite coordinates confirmed against the owner's original GUI PNGs.
export const GUI112=Object.freeze({
 atlas:256,hotbar:{x:0,y:0,w:182,h:22},selection:{x:0,y:22,w:24,h:22},
 crosshair:{x:0,y:0,w:16,h:16},heart:{empty:[16,0],full:[52,0],half:[61,0],w:9,h:9,step:8},
 food:{empty:[16,27],full:[52,27],half:[61,27],w:9,h:9,step:8},
 air:{full:[16,18],partial:[25,18],w:9,h:9},xp:{empty:[0,64],full:[0,69],w:182,h:5}
});
export function gui112Scale(width,height,{touch=false}={}){
 const w=Math.max(1,Math.floor(Number(width)||1)),h=Math.max(1,Math.floor(Number(height)||1));
 const scale=Math.max(1,Math.min(4,Math.floor(w/320),Math.floor(h/240)));
 // Reserve 166 logical pixels for the panel and 40 for external close control/margins.
 return touch?Math.max(1,Math.min(2,Math.floor((w-12)/GUI112.hotbar.w),Math.floor(h/206))):scale;
}
export function applyGui112Scale(root,width,height,opts={}){const s=gui112Scale(width,height,opts);root?.style?.setProperty('--gui-scale',String(s));return s;}
