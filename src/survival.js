// Simplified, independent survival state. Intentional differences from Java 1.8.9 are documented.
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const DIFFICULTIES=Object.freeze(['peaceful','easy','normal','hard']);
export function starvationFloor(difficulty){return difficulty==='easy'?10:difficulty==='normal'?1:difficulty==='hard'?0:20;}
export class Survival {
 constructor(saved={}){
  this.difficulty=DIFFICULTIES.includes(saved.difficulty)?saved.difficulty:'normal';
  this.maxHealth=20;this.health=clamp(Number(saved.health??20)||0,0,20);
  this.hunger=clamp(Number(saved.hunger??20)||0,0,20);
  // Java 1.8.x uses a separate saturation reserve before food level decreases.
  this.saturation=clamp(Number(saved.saturation??5)||0,0,this.hunger);
  this.exhaustion=clamp(Number(saved.exhaustion??0)||0,0,40);
  this.air=clamp(Number(saved.air??300)||0,0,300);
  this.regenTimer=0;this.waterTimer=0;this.foodTimer=0;
  this.dead=this.health<=0;
 }
 damage(amount){if(!Number.isFinite(amount)||amount<=0||this.dead)return 0;const change=Math.min(this.health,amount);this.health=clamp(this.health-amount,0,20);if(this.health<=0)this.dead=true;return change;}
 heal(amount){if(!Number.isFinite(amount)||amount<=0||this.dead)return 0;const old=this.health;this.health=clamp(this.health+amount,0,20);return this.health-old;}
 consume(food=4,saturationModifier=.6){if(this.dead)return false;this.hunger=clamp(this.hunger+food,0,20);this.saturation=clamp(this.saturation+food*saturationModifier*2,0,this.hunger);return true;}
 exert(amount){if(Number.isFinite(amount)&&amount>0)this.exhaustion+=amount;while(this.exhaustion>=4){this.exhaustion-=4;if(this.saturation>0)this.saturation=Math.max(0,this.saturation-1);else this.hunger=clamp(this.hunger-1,0,20);}}
 fall(distance){if(distance<=3||!Number.isFinite(distance))return 0;return this.damage(Math.max(0,Math.floor(distance-3)));}
 tick(dt,{underwater=false,moving=false,sprinting=false,travelDistance=null}={}){
  if(this.dead)return;
  if(underwater){this.air=clamp(this.air-dt*20,0,300);if(this.air===0){this.waterTimer+=dt;if(this.waterTimer>=1){this.waterTimer-=1;this.damage(2)}}}
  else{this.air=300;this.waterTimer=0;}
  // Java 1.8-era movement exhaustion is based on distance, not just time.
  const traveled=Number.isFinite(travelDistance)&&travelDistance>=0?travelDistance:(moving?dt*(sprinting?5.7:4.4):0);
  if(traveled>0)this.exert(traveled*(sprinting?.1:underwater?.015:.01));
  // Do not bank unlimited regeneration time while already at full health.
  if(this.hunger>=18&&this.health<20){
   this.regenTimer+=dt;
   if(this.regenTimer>=4){this.heal(1);this.exert(3);this.regenTimer=0;}
  }else this.regenTimer=0;
  // The starvation timer must not carry over from normal fed play.
  if(this.hunger===0 && this.difficulty!=='peaceful'){
   this.foodTimer+=dt;
   if(this.foodTimer>=4){
    const floor=starvationFloor(this.difficulty);
    if(this.health>floor)this.damage(Math.min(1,this.health-floor));
    this.foodTimer=0;
   }
  }else this.foodTimer=0;
 }
 respawn(){this.health=20;this.hunger=20;this.saturation=5;this.air=300;this.exhaustion=0;this.dead=false;this.regenTimer=0;this.waterTimer=0;}
 serialize(){return {difficulty:this.difficulty,health:this.health,hunger:this.hunger,saturation:this.saturation,air:this.air,exhaustion:this.exhaustion};}
}
