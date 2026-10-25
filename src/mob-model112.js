// Cuboids in sixteenths of a block, independently assembled for local textures.
// x,y,z are centres. Limb pivot is at the upper joint, not the cuboid centre.
const part=(x,y,z,w,h,d,u,v,extra={})=>({x:x/16,y:y/16,z:z/16,w:w/16,h:h/16,d:d/16,u,v,tw:w,th:h,td:d,...extra});
const biped=(thin=false)=>[
 part(0,18,0,8,12,4,16,16),part(0,28,0,8,8,8,0,0),
 part(-6,18,0,thin?2:4,12,thin?2:4,40,16,{limb:true,arm:true}),part(6,18,0,thin?2:4,12,thin?2:4,40,16,{limb:true,arm:true}),
 part(-2,6,0,thin?2:4,12,thin?2:4,0,16,{limb:true}),part(2,6,0,thin?2:4,12,thin?2:4,0,16,{limb:true})];
export const MOB_MODELS112={
 grazer:[part(0,17,1,12,18,10,18,4,{rotateX:Math.PI/2}),part(0,20,-11,8,8,6,0,0),
  ...[[-4,7],[4,7],[-4,-5],[4,-5]].map(([x,z])=>part(x,6,z,4,12,4,0,16,{limb:true})),
  part(-4.5,24,-10.5,1,3,1,22,0),part(4.5,24,-10.5,1,3,1,22,0)],
 wanderer:biped(),shooter:biped(true)
};
export function modelFaceUV112(p){const {u,v,tw:w,th:h,td:d}=p;return [
 [u+d+w,v+d,u+2*d+w,v+d+h],[u,v+d,u+d,v+d+h],
 [u+d,v,u+d+w,v+d],[u+d+w,v,u+2*d+w,v+d],
 [u+2*d+w,v+d,u+2*d+2*w,v+d+h],[u+d,v+d,u+d+w,v+d+h]];}
export function facingYaw112(vx,vz,previous=0){return Math.hypot(vx,vz)>.01?(Math.atan2(-vx,-vz)||0):previous;}
export function hostileSpawnAllowed112({daylight=true,skyVisible=true,light=15,distance=0}={}){
 return distance>=24&&light<=7&&!(daylight&&skyVisible);
}
// ModelBox side faces reverse U relative to Three.js BoxGeometry's row order;
// top/bottom reverse V. Keep each face inside its own atlas rectangle.
export function modelFaceCorners112(rect,width=64,height=64,face=0){
 const [l,t,r,b]=rect,uv=[[l/width,1-t/height],[r/width,1-t/height],[l/width,1-b/height],[r/width,1-b/height]];
 return (face===2||face===3)?[uv[2],uv[3],uv[0],uv[1]]:[uv[1],uv[0],uv[3],uv[2]];
}
