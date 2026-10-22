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
/**
 * Java 1.12.2 players have a 0.6 block-wide bounding box. A player can
 * remain in contact with water while its centre has already reached shore.
 * This detector is used for the water-to-bank jump and swimming drag.
 */
export function waterContact112(world,player,waterId){
 const radius=.29,offsets=[-radius,radius],levels=[.12,.7,1.35];
 for(const x of offsets)for(const z of offsets)for(const dy of levels)
  if(world.get(Math.floor(player.x+x),Math.floor(player.y+dy),Math.floor(player.z+z))===waterId)return true;
 return world.get(Math.floor(player.x),Math.floor(player.y+.7),Math.floor(player.z))===waterId;
}
export function waterExitLift112(velocityY,{jump=false,inWater=false,blockedByShore=false}={}){
 if(!jump||!inWater)return velocityY;
 // A shoreline block can be ascended by repeatedly swimming upward. Do not
 // teleport the player through the block; ordinary collision handles it.
 return Math.max(velocityY,blockedByShore?5.2:4);
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
