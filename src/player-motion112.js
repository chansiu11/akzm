// Browser-only, independent movement integrator. World collision stays in main.js.
// Speeds are blocks/second; movement accelerates and slows smoothly.
export const MOVE_SPEED112=Object.freeze({walk:4.317,sprint:5.612,sneak:1.296,jump:8.35,gravity:30,terminal:38});
export function horizontalVelocity112(vx,vz,targetX,targetZ,dt,{ground=true,water=false}={}){
 const blend=1-Math.exp(-Math.max(0,dt)*(water?8:ground?18:5));
 return {x:vx+(targetX-vx)*blend,z:vz+(targetZ-vz)*blend};
}
export function verticalVelocity112(vy,dt,{water=false}={}){
 const gravity=water?6:MOVE_SPEED112.gravity;
 return Math.max(-MOVE_SPEED112.terminal,vy-gravity*Math.max(0,dt));
}
export function defaultRenderDistance112(touch=false){return touch?4:6;}
export function sanitizeRenderDistance112(distance,touch=false){
 const fallback=defaultRenderDistance112(touch);
 return Math.min(touch?6:10,Math.max(2,Math.round(Number(distance)||fallback)));
}
export function fogDistances112(radius,weather='clear'){
 const blocks=Math.max(2,radius)*16;
 const factor=weather==='clear'?1:weather==='rain'?.78:.64;
 const far=Math.max(65,blocks*1.75*factor);
 return {near:Math.max(18,far*.68),far};
}
