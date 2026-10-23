// Body-aware collision for existing mob types; independent of rendering.
import {definition} from './block-registry.js';
export function mobCollides112(world,e,x=e.x,y=e.y,z=e.z){
 const radius=e.kind==='grazer'?.45:.3,height=e.kind==='grazer'?1.4:1.95;
 for(let bx=Math.floor(x-radius);bx<=Math.floor(x+radius);bx++)
 for(let by=Math.floor(y+.001);by<=Math.floor(y+height-.001);by++)
 for(let bz=Math.floor(z-radius);bz<=Math.floor(z+radius);bz++)if(definition(world.get(bx,by,bz))?.solid)return true;
 return false;
}
export function stepMobVertical112(world,e,dt,{moving=false,blocked=false}={}){
 const collide=(y)=>mobCollides112(world,e,e.x,y,e.z);
 const ground=collide(e.y-.04);e.vy=Number.isFinite(e.vy)?e.vy:0;
 if(ground&&e.vy<0)e.vy=0;
 if(ground&&moving&&blocked&&!collide(e.y+1))e.vy=8.4;
 if(!ground||e.vy>0)e.vy=-78.4+(e.vy+78.4)*Math.pow(.98,dt*20);
 const dy=e.vy*dt,steps=Math.max(1,Math.ceil(Math.abs(dy)/.08));
 for(let n=0;n<steps;n++){const next=e.y+dy/steps;if(collide(next)){e.vy=0;break;}e.y=next;}
 if(e.y<-64)e.health=0;
 return {ground:collide(e.y-.04),y:e.y};
}
