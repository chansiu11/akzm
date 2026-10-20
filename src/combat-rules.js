// Pure melee geometry and hurt cooldown; target geometry is still simplified.
export const MELEE_REACH=3;
export const HURT_RESISTANCE_SECONDS=.5;
export function reachableByRay(entity,origin,direction,maxDist=MELEE_REACH){
 const dx=entity.x-origin.x,dy=entity.y+1.1-origin.y,dz=entity.z-origin.z;
 const along=dx*direction.x+dy*direction.y+dz*direction.z;
 if(along<=0||along>=maxDist)return null;
 const off=Math.hypot(dx-direction.x*along,dy-direction.y*along,dz-direction.z*along);
 return off<.67?along:null;
}
export function mayHit(entity){return entity?.health>0&&(entity.hurtTimer||0)<=0;}
export function registerHit(entity,damage){
 if(!mayHit(entity)||!Number.isFinite(damage)||damage<=0)return false;
 entity.health-=damage;entity.hurtTimer=HURT_RESISTANCE_SECONDS;return true;
}
