// Original implementation of legacy 1.8-era GUI geometry in logical pixels.
// Neither game artwork nor UI sprite sheets are redistributed.
export const GUI189={hotbarWidth:182,hotbarHeight:22,slotStep:20,slotSize:20,selectionSize:24,heart:9,heartStep:8,foodStep:8,experienceHeight:5,inventoryColumns:9,inventoryRows:4};
export function guiScale(width,height,{touch=false}={}){
 const w=Math.max(1,Math.floor(Number(width)||1)),h=Math.max(1,Math.floor(Number(height)||1));
 const max=Math.max(1,Math.min(4,Math.floor(w/320),Math.floor(h/240)));
 // Small mobile viewports have no native 1.8.9 GUI; enlarge enough to tap, never crop the 182px hotbar.
 return touch?Math.max(1,Math.min(2,Math.floor((w-12)/GUI189.hotbarWidth))):max;
}
export function guiPositions(scale){
 const s=Math.max(1,Math.floor(scale));
 return {hotbarWidth:182*s,hotbarHeight:22*s,slotStep:20*s,selectionSize:24*s,heartWidth:9*s,experienceWidth:182*s};
}
export function applyGuiScale(root,width,height,options={}){
 const scale=guiScale(width,height,options);root?.style?.setProperty('--gui-scale',String(scale));return scale;
}
