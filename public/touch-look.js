// One captured look pointer; dragging never turns into a placement tap.
export function attachTouchLook(canvas,enabled,onDelta,actions={}){
 let active=null,timer=null;
 const clear=()=>{clearTimeout(timer);timer=null;if(active?.holding)actions.end?.();active=null;};
 const release=e=>{if(active?.id!==e.pointerId)return;const tap=e.type==='pointerup'&&!active.moved&&!active.holding;clear();if(tap&&enabled())actions.tap?.();};
 canvas.addEventListener('pointerdown',e=>{if(!enabled()||active)return;e.preventDefault();active={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,holding:false};canvas.setPointerCapture(e.pointerId);timer=setTimeout(()=>{if(active&&!active.moved&&enabled()){active.holding=true;actions.start?.();}},350);});
 canvas.addEventListener('pointermove',e=>{if(active?.id!==e.pointerId)return;if(!enabled()){clear();return;}e.preventDefault();if(Math.hypot(e.clientX-active.startX,e.clientY-active.startY)>10){active.moved=true;clearTimeout(timer);}onDelta(e.clientX-active.x,e.clientY-active.y);active.x=e.clientX;active.y=e.clientY;});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,release);
 return clear;
}
