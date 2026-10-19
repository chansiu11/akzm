// Keep one look pointer independent of fingers holding movement controls.
export function attachTouchLook(canvas,enabled,onDelta){
 let active=null;
 const release=e=>{if(active?.id===e.pointerId)active=null;};
 canvas.addEventListener('pointerdown',e=>{if(!enabled()||active)return;e.preventDefault();active={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(active?.id!==e.pointerId)return;if(!enabled()){active=null;return;}e.preventDefault();onDelta(e.clientX-active.x,e.clientY-active.y);active.x=e.clientX;active.y=e.clientY;});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,release);
 return ()=>{active=null;};
}
