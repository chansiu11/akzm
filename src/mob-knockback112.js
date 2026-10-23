// Collision-aware mob knockback separate from navigation and saved data.
export function applyMobKnockback112(mob,source,strength=5.8){
 const dx=(Number(mob.x)||0)-(Number(source?.x)||0),dz=(Number(mob.z)||0)-(Number(source?.z)||0);
 const length=Math.hypot(dx,dz);if(length<.001)return false;
 const power=Math.max(0,Math.min(16,Number(strength)||0));
 mob.knockVX=dx/length*power;mob.knockVZ=dz/length*power;return true;
}
export function stepMobKnockback112(mob,dt,solidAt){
 const time=Math.max(0,Math.min(.05,Number(dt)||0)),vx=Number(mob.knockVX)||0,vz=Number(mob.knockVZ)||0;
 if(!time||(!vx&&!vz))return;
 const dx=vx*time,dz=vz*time,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.2));
 for(let n=0;n<steps;n++){
  const x=mob.x+dx/steps,z=mob.z+dz/steps;
  if(!solidAt(x,mob.y+.4,mob.z))mob.x=x;else mob.knockVX=0;
  if(!solidAt(mob.x,mob.y+.4,z))mob.z=z;else mob.knockVZ=0;
 }
 const decay=Math.exp(-10*time);mob.knockVX*=decay;mob.knockVZ*=decay;
 if(Math.abs(mob.knockVX)<.02)mob.knockVX=0;
 if(Math.abs(mob.knockVZ)<.02)mob.knockVZ=0;
}
