// Deterministic, testable lightweight entity decision logic, not vanilla navigation/pathfinding.
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const ENTITY_KINDS=Object.freeze({grazer:{health:10,speed:1.4,hostile:false},wanderer:{health:16,speed:1.9,hostile:true},shooter:{health:12,speed:1.6,hostile:true}});
export function spawnEntity(kind,id,x,y,z){const base=ENTITY_KINDS[kind];if(!base)throw Error('Unknown entity '+kind);return {id,kind,x,y,z,health:base.health,heading:0,think:0,attackTimer:0,goal:null};}
export function decide(e,player,dt,rng=Math.random){const meta=ENTITY_KINDS[e.kind];if(!meta||e.health<=0)return {mode:'dead',vx:0,vz:0,attack:false};
 e.attackTimer=Math.max(0,e.attackTimer-dt);e.think-=dt;
 const d=dist(e,player);let mode='wander',heading=e.heading;
 if(meta.hostile&&!player.invulnerable&&d<15){mode=e.kind==='shooter'&&d<=12?'ranged':d<2.0?'attack':'chase';heading=Math.atan2(player.z-e.z,player.x-e.x)}
 else if(e.think<=0){e.think=1.5+rng()*3;e.heading=rng()*Math.PI*2;heading=e.heading;}
 const speed=mode==='attack'||mode==='ranged'?0:meta.speed*(mode==='wander'?.35:1);
 const attack=(mode==='attack'||mode==='ranged')&&e.attackTimer<=0;if(attack)e.attackTimer=e.kind==='shooter'?2:1.2;
 return {mode,vx:Math.cos(heading)*speed,vz:Math.sin(heading)*speed,attack};
}
export function stepEntity(e,player,dt,solidAt,rng=Math.random,options={}){const action=decide(e,player,dt,rng);
 if(action.mode==='chase'&&options.waypoint){const dx=options.waypoint.x-e.x,dz=options.waypoint.z-e.z,len=Math.hypot(dx,dz);if(len>.03){const speed=ENTITY_KINDS[e.kind].speed;action.vx=dx/len*speed;action.vz=dz/len*speed;}}
 if(action.mode==='dead')return action;const nx=e.x+action.vx*dt,nz=e.z+action.vz*dt;
 if(!solidAt(nx,e.y,nz)){e.x=nx;e.z=nz;}else e.heading+=Math.PI*.6;
 return action;
}
