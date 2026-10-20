// Original procedural sky positions driven by 24,000-tick day length.
export const SKY_CAMERA_FAR=300;
export const CELESTIAL_DISTANCE=220;
export function celestialPositions(ticks, distance=CELESTIAL_DISTANCE){
 const fraction=((ticks%24000)+24000)%24000/24000;
 const angle=fraction*Math.PI*2;
 const x=Math.cos(angle)*distance,y=Math.sin(angle)*distance;
 return {sun:[x,y,-30],moon:[-x,-y,30]};
}
