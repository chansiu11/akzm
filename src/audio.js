// User-gesture enabled synthesized audio, no original recordings or proprietary samples.
export function createAudio(){let ctx=null,muted=false,masterVolume=1;
 const enabled=()=>{if(muted||masterVolume===0)return false;const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;if(!ctx)ctx=new C();if(ctx.state==='suspended')ctx.resume().catch(()=>{});return true};
 function beep(type='click',distance=0){if(!enabled()||distance>32)return;const now=ctx.currentTime;const out=ctx.createGain(),osc=ctx.createOscillator();osc.connect(out);out.connect(ctx.destination);
  const preset={click:[580,.03,'square'],break:[160,.08,'sawtooth'],place:[260,.05,'triangle'],hit:[110,.15,'sawtooth'],hurt:[158,.19,'triangle'],step:[90,.02,'triangle'],craft:[420,.08,'triangle'],rain:[200,.03,'sine']}[type]||[350,.04,'sine'];
  osc.type=preset[2];osc.frequency.setValueAtTime(preset[0],now);
  if(type==='hurt'){
   // Independent synthetic two-tone damage cue, not the copyrighted game sample.
   osc.frequency.setValueAtTime(172,now+.02);
   osc.frequency.exponentialRampToValueAtTime(84,now+preset[1]);
  }else osc.frequency.exponentialRampToValueAtTime(Math.max(60,preset[0]*.68),now+preset[1]);
  const volume=Math.max(.0005,.045*masterVolume/(1+distance*.15));out.gain.setValueAtTime(volume,now);out.gain.exponentialRampToValueAtTime(.0001,now+preset[1]);osc.start(now);osc.stop(now+preset[1]+.01);}
 return {beep,setVolume:v=>masterVolume=Math.max(0,Math.min(1,Number(v)||0)), setMuted:v=>muted=!!v,get muted(){return muted}};
}
