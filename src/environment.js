// Standalone day/night + weather model; not the vanilla 1.8.9 renderer.
export const WEATHER = Object.freeze(['clear','rain','thunder']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smoothstep=(a,b,v)=>{
 const t=clamp((v-a)/(b-a),0,1);
 return t*t*(3-2*t);
};
export function daylight(ticks){
 const t=((ticks%24000)+24000)%24000;
 // Java 1.12.2 transitions rapidly near 12000 (sunset) and 23000 (dawn).
 // The previous 12,000-tick cosine left a bright blue sky long into night.
 if(t<=11500)return .85+.15*Math.sin(t/11500*Math.PI);
 if(t<13300)return .13+.72*(1-smoothstep(11500,13300,t));
 if(t<22500)return .13;
 return .13+.72*smoothstep(22500,24000,t);
}
export function skyColor(ticks,weather='clear'){
 const light=daylight(ticks),d=weather==='clear'?1:weather==='rain'?.68:.45;
 return [Math.round((20+115*light)*d),Math.round((27+163*light)*d),Math.round((44+181*light)*d)];
}
export function lightingInfo(ticks,weather='clear',{nightVision=false}={}){
 const level=daylight(ticks),dim=weather==='clear'?1:weather==='rain'?.8:.58;
 // A night-vision effect brightens the world lightmap, not the time of day.
 const visionLevel=nightVision?Math.max(level,.95):level;
 return {
  sky:skyColor(ticks,weather),
  sunIntensity:(.04+visionLevel*1.72)*dim,
  ambientIntensity:(.26+visionLevel*1.03)*dim,
  dayFactor:level,
  stars:clamp((.5-level)*2.6,0,1),
  fogNear:weather==='clear'?32:18,
  fogFar:weather==='clear'?110:weather==='rain'?70:45
 };
}
export class WeatherCycle {
 constructor(saved={}){this.kind=WEATHER.includes(saved.kind)?saved.kind:'clear';this.remaining=Number.isFinite(saved.remaining)&&saved.remaining>0?saved.remaining:600;this.locked=!!saved.locked;}
 set(kind,seconds=600){if(!WEATHER.includes(kind))return false;this.kind=kind;this.remaining=seconds;return true;}
 update(dt,rng=Math.random){if(this.locked)return;this.remaining-=dt;if(this.remaining<=0){const v=rng();this.set(v<.68?'clear':v<.93?'rain':'thunder',240+rng()*600);}}
 serialize(){return {kind:this.kind,remaining:this.remaining,locked:this.locked}}
}
