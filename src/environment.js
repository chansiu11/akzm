// Standalone day/night + weather model; not the vanilla 1.8.9 renderer.
export const WEATHER = Object.freeze(['clear','rain','thunder']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function daylight(ticks){
 const t=((ticks%24000)+24000)%24000;
 const phase=Math.cos((t-6000)/12000*Math.PI);
 return clamp(.13+(phase+1)*.435,.13,1);
}
export function skyColor(ticks,weather='clear'){
 const light=daylight(ticks),d=weather==='clear'?1:weather==='rain'?.68:.45;
 return [Math.round((20+115*light)*d),Math.round((27+163*light)*d),Math.round((44+181*light)*d)];
}
export function lightingInfo(ticks,weather='clear'){
 const level=daylight(ticks),dim=weather==='clear'?1:weather==='rain'?.72:.45;
 return {sky:skyColor(ticks,weather),sunIntensity:(.1+level*1.25)*dim,ambientIntensity:.2+level*.85*dim,stars:clamp((.5-level)*2.6,0,1),fogNear:weather==='clear'?32:18,fogFar:weather==='clear'?110:weather==='rain'?70:45};
}
export class WeatherCycle {
 constructor(saved={}){this.kind=WEATHER.includes(saved.kind)?saved.kind:'clear';this.remaining=Number.isFinite(saved.remaining)&&saved.remaining>0?saved.remaining:600;this.locked=!!saved.locked;}
 set(kind,seconds=600){if(!WEATHER.includes(kind))return false;this.kind=kind;this.remaining=seconds;return true;}
 update(dt,rng=Math.random){if(this.locked)return;this.remaining-=dt;if(this.remaining<=0){const v=rng();this.set(v<.68?'clear':v<.93?'rain':'thunder',240+rng()*600);}}
 serialize(){return {kind:this.kind,remaining:this.remaining,locked:this.locked}}
}
