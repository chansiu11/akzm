import {drawOwnerPanorama} from './menu112-assets.js';
// Low-resolution original voxel landscape panorama for the menu only. No textures or brand art copied.
// Perspective cube terrain replaces purely flat silhouette layers in the near field.
const rand=(x,y,z=0)=>{let n=Math.imul(x+19,374761393)^Math.imul(y+97,668265263)^Math.imul(z+7,2246822519);n=Math.imul(n^(n>>>13),1274126177);return (n>>>0)/4294967295};
const W=400,H=225;

function drawVoxelTerrain(ctx,offset){
 // Paint back-to-front cube terraces. Stable hashed samples create different
 // visible grass, soil and shallow river tones without embedding assets.
 for(let depth=31;depth>=5;depth--){
  const unit=Math.max(2,Math.round(90/depth));
  const visible=Math.ceil(W/(2*unit))+1;
  for(let col=-visible;col<=visible;col++){
   const worldX=col+Math.floor(offset*.015),worldZ=depth;
   const variation=rand(worldX,worldZ),slope=Math.sin(worldX*.16+depth*.11)*2.1+Math.sin(worldX*.35-depth*.23)*1.1;
   const ground=Math.round(slope+variation*.8);
   const x=Math.floor(W/2+col*unit);
   const y=Math.floor(119+(31-depth)*3-ground*unit*.47);
   if(x+unit<0||x>W||y>H+unit||y<-unit)continue;
   const streamX=Math.sin(depth*.18+1.3)*4;
   const wet=Math.abs(worldX-streamX)<2.1;
   const top=wet?(variation>.45?'#548fb0':'#4f8fa9'):(variation>.68?'#628d48':variation>.34?'#618345':'#75944e');
   const dirt=variation>.66?'#564a34':'#5c4a34';
   ctx.fillStyle=wet?'#49798d':dirt;ctx.fillRect(x,y,unit,Math.max(unit*.55,2));
   ctx.fillStyle=top;ctx.fillRect(x,y-unit*.24,unit,Math.max(1,unit*.32));
   ctx.fillStyle=wet?'#84b5c8':'#394930';ctx.fillRect(x+unit-1,y,1,Math.max(unit*.55,2));
   if(depth<20&&!wet&&variation>.989){
     const trunk=Math.max(1,Math.floor(unit*.27)),h=unit*2.5;
     ctx.fillStyle='#554735';ctx.fillRect(x+unit*.4,y-h,trunk,h);
     ctx.fillStyle=variation>.996?'#4d7754':'#406444';ctx.fillRect(x-unit*.2,y-h-unit*1.25,unit*1.45,unit*1.2);
     ctx.fillStyle='#527951';ctx.fillRect(x+unit*.02,y-h-unit*1.45,unit,unit*.3);
   }
  }
 }
}

export function drawPanoramaFrame(ctx,t=0){
 if(!ctx)return;
 const image=ctx.createLinearGradient(0,0,0,H);image.addColorStop(0,'#77b6e6');image.addColorStop(.72,'#c9e6ef');image.addColorStop(1,'#c8e3bc');ctx.fillStyle=image;ctx.fillRect(0,0,W,H);
 const offset=Math.floor(t*2)%W;
 // Sweeping, layered cubic hills show the game's own procedural world identity.
 for(let layer=0;layer<4;layer++){
  const colors=['#aec8b2','#8cae88','#547b59','#34563c'],ybase=[114,133,151,176][layer];
  ctx.fillStyle=colors[layer];ctx.beginPath();ctx.moveTo(0,H);
  for(let x=0;x<=W;x+=4){const p=(x+layer*48+offset*(.08+.1*layer));const hill=(Math.sin(p*.022)+Math.sin(p*.053+layer)*.48)*[21,18,23,19][layer];ctx.lineTo(x,Math.floor(ybase-hill)/4*4)}
  ctx.lineTo(W,H);ctx.closePath();ctx.fill();
  if(layer>0){for(let i=0;i<25;i++){const x=Math.floor((i*73+layer*49-offset*(.1+.3*layer)+W*300)%W/4)*4,y=Math.floor((ybase-7+Math.sin((x+layer*48)*.022)*-12)/4)*4;
    ctx.fillStyle=layer===3?'#253e30':'#43664a';ctx.fillRect(x,y-10,4,14);ctx.fillStyle=layer===3?'#315438':'#507f58';ctx.fillRect(x-5,y-23,14,16);ctx.fillRect(x-2,y-28,8,6);
  }}
 }
 // Blocky near-field earth and moss, with occasional rocks and tufts.
 for(let y=190;y<H;y+=5)for(let x=0;x<W;x+=5){const n=rand(x/5,y/5),a=n>.7?'#465a38':n>.35?'#3d5636':'#34502c';ctx.fillStyle=a;ctx.fillRect(x,y,5,5);if(n>.93){ctx.fillStyle='#9bad83';ctx.fillRect(x+1,y,1,2)}}
 for(let i=0;i<32;i++){const x=Math.floor(rand(i,3)*W/4)*4,y=186+Math.floor(rand(i,4)*38/4)*4;ctx.fillStyle=rand(i,5)>.5?'#b0aaa0':'#788273';ctx.fillRect(x,y,4,3)}
 drawVoxelTerrain(ctx,offset);
 // Clouds wander gently through the sky.
 for(let i=0;i<10;i++){const x=Math.floor((i*109-offset*.62+W*40)% (W+140))-60,y=12+(i*37)%74;
  ctx.fillStyle='#f0f5f2';ctx.fillRect(x,y,43,7);ctx.fillRect(x+9,y-6,28,7);ctx.fillRect(x+19,y-10,14,6);
  ctx.fillStyle='#b3d1d8';ctx.fillRect(x+6,y+7,32,2);
 }
 // Warm square sun rather than another game's sky image.
 ctx.fillStyle='#fff1b0';ctx.fillRect(302,31,24,24);ctx.fillStyle='#fdf7d6';ctx.fillRect(305,34,18,18);
 // Subtle atmospheric haze at horizon.
 const mist=ctx.createLinearGradient(0,112,0,176);mist.addColorStop(0,'#d9efe600');mist.addColorStop(.66,'#c8e3d922');mist.addColorStop(1,'#c8e3d900');ctx.fillStyle=mist;ctx.fillRect(0,105,W,80);
}
export function startMenuPanorama(canvas){
 if(!canvas)return ()=>{};canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d',{alpha:false});
 let handle=0,active=true,last=-Infinity,ownerFaces=null;
 canvas.addEventListener('owner-panorama',event=>{ownerFaces=event.detail;});
 function frame(time){if(!active)return;
  if(document.body.classList.contains('menu-open')&&time-last>75){if(ownerFaces)drawOwnerPanorama(ctx,ownerFaces,time/1000,W,H);else drawPanoramaFrame(ctx,time*.00016);last=time;}
  handle=requestAnimationFrame(frame);
 }
 handle=requestAnimationFrame(frame);return ()=>{active=false;cancelAnimationFrame(handle)};
}
