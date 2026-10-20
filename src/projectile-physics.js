// Independent lightweight projectile simulation for the test ranged creature.
// Vanilla 1.8.9 arrow entities have additional properties not yet implemented.
export function shootTowards(origin,target,speed=10){
 const dx=target.x-origin.x,dy=target.y-origin.y,dz=target.z-origin.z;
 const magnitude=Math.hypot(dx,dy,dz)||1;
 return {x:origin.x,y:origin.y,z:origin.z,vx:dx/magnitude*speed,vy:dy/magnitude*speed+.38,vz:dz/magnitude*speed,age:0};
}
export function stepProjectile(p,dt,solidAt,player,{gravity=1.4,maxAge=5}={}){
 if(!Number.isFinite(dt)||dt<=0)return null;
 const time=Math.min(dt,.15),count=Math.max(1,Math.ceil(Math.hypot(p.vx,p.vy,p.vz)*time/.13));
 const step=time/count;
 for(let i=0;i<count;i++){
  p.x+=p.vx*step;p.y+=p.vy*step;p.z+=p.vz*step;
  p.vy-=gravity*step;
  if(solidAt(Math.floor(p.x),Math.floor(p.y),Math.floor(p.z)))return 'block';
  if(player&&Math.hypot(p.x-player.x,p.z-player.z)<.43&&p.y>=player.y&&p.y<player.y+1.8)return 'player';
 }
 p.age+=time;
 return p.age>=maxAge?'expired':null;
}
