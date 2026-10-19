export function lookDelta(yaw,pitch,dx,dy,sensitivity=.0024){
 return {yaw:yaw-dx*sensitivity,pitch:Math.max(-Math.PI/2+.02,Math.min(Math.PI/2-.02,pitch-dy*sensitivity))};
}
export function joystickDelta(dx,dy,radius=46){
 const magnitude=Math.hypot(dx,dy),scale=magnitude>radius?radius/magnitude:1;
 return {strafe:dx*scale/radius,forward:-dy*scale/radius,thumbX:dx*scale,thumbY:dy*scale};
}
