// Independent, redistributable graphics for the PUBLIC site's default UI.
// Original Minecraft artwork is never embedded here or served from this site.
// A visitor's private JAR, when chosen, overrides these fallback graphics.
export const BUNDLED_SITE_THEME_VERSION='akzm-original-ui-v1';
export const SITE_MENU_COLORS=Object.freeze({
 normal:{base:[112,112,115],bright:[188,188,193],edge:[33,34,38],dark:[61,61,67]},
 hover:{base:[120,132,165],bright:[193,202,226],edge:[36,42,65],dark:[70,81,113]},
 disabled:{base:[67,67,70],bright:[100,100,103],edge:[30,30,33],dark:[49,49,51]}
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rand=(x,y,seed)=>{let z=Math.imul(x+13,374761393)^Math.imul(y+37,668265263)^Math.imul(seed+7,2246822519);z=Math.imul(z^(z>>>13),1274126177);return (z>>>0)/4294967295};
export function bundledButtonPixel112(state,x,y){
 const color=SITE_MENU_COLORS[state]??SITE_MENU_COLORS.normal;
 if(x===0||y===0||x===199||y===19)return [...color.edge,255];
 if(x===1||y===1)return [...color.bright,255];
 if(x===198||y===18)return [...color.dark,255];
 const grain=Math.round((rand(x,y,state==='hover'?19:3)-.5)*19);
 const shade=Math.round(y/19*15);
 return [...color.base.map(c=>clamp(c+grain-shade,0,255)),255];
}
export function drawBundledMenu112(documentRef=document){
 const c=documentRef.createElement('canvas');c.width=200;c.height=20;
 const ctx=c.getContext('2d',{willReadFrequently:true});if(!ctx)return null;
 const sprites={};
 for(const state of ['normal','hover','disabled']){
  const frame=ctx.createImageData(200,20);
  for(let y=0;y<20;y++)for(let x=0;x<200;x++){
   const offset=(y*200+x)*4;
   frame.data.set(bundledButtonPixel112(state,x,y),offset);
  }
  ctx.putImageData(frame,0,0);
  sprites[state]=c.toDataURL('image/png');
 }
 const globe=documentRef.createElement('canvas');globe.width=globe.height=20;
 const gc=globe.getContext('2d');if(!gc)return {...sprites};
 gc.fillStyle='#33343a';gc.fillRect(0,0,20,20);
 gc.fillStyle='#adadad';gc.fillRect(1,1,18,18);
 gc.fillStyle='#57575a';gc.fillRect(2,2,16,16);
 const pixel=(x,y,color)=>{gc.fillStyle=color;gc.fillRect(x,y,1,1)};
 for(let y=3;y<17;y++)for(let x=3;x<17;x++){
  const dx=x-9.5,dy=y-9.5,dist=dx*dx+dy*dy;
  if(dist>42)continue;
  const stripe=((x*5+y*13)%17)<4;
  pixel(x,y,dist>34?'#d0d5d9':stripe?'#6c9b79':'#4b7e9b');
 }
 sprites.language=globe.toDataURL('image/png');
 return sprites;
}

// Independent pixel-block logo used only on public devices without a private
// source JAR. The actual owner's logo.png is drawn by applyMenu112 instead.
const TITLE_FONT112=Object.freeze({
 M:['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
 I:['.###.','..#..','..#..','..#..','..#..','..#..','.###.'],
 N:['#...#','##..#','#.#.#','#..##','#...#','#...#','#...#'],
 E:['#####','#....','#....','####.','#....','#....','#####'],
 C:['.####','#....','#....','#....','#....','#....','.####'],
 R:['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
 A:['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
 F:['#####','#....','#....','####.','#....','#....','#....'],
 T:['#####','..#..','..#..','..#..','..#..','..#..','..#..']
});
export function drawBundledTitle112(documentRef){
 const canvas=documentRef?.getElementById?.('originalTitle112');
 const ctx=canvas?.getContext?.('2d',{willReadFrequently:true});
 if(!ctx)return false;
 canvas.width=274;canvas.height=44;
 ctx.clearRect(0,0,274,44);
 const text='MINECRAFT',size=5,startX=3,startY=1;
 // Eight-pixel silhouette depth underneath the face.
 for(let z=9;z>=1;z--){
  ctx.fillStyle=z>5?'#181a1c':'#393d41';
  for(let i=0;i<text.length;i++){
   const matrix=TITLE_FONT112[text[i]];
   for(let y=0;y<matrix.length;y++)for(let x=0;x<5;x++)if(matrix[y][x]==='#'){
    ctx.fillRect(startX+(i*6+x)*size,startY+y*size+z,size,size);
   }
  }
 }
 for(let i=0;i<text.length;i++){
  const matrix=TITLE_FONT112[text[i]];
  for(let y=0;y<matrix.length;y++)for(let x=0;x<5;x++)if(matrix[y][x]==='#'){
   const px=startX+(i*6+x)*size,py=startY+y*size;
   ctx.fillStyle='#282d32';ctx.fillRect(px-1,py-1,size+2,size+2);
   const grain=rand(i*5+x,y,113);
   ctx.fillStyle=grain>.78?'#f3f3ef':grain<.18?'#adb2b6':'#d4d5d3';
   ctx.fillRect(px,py,size,size);
   ctx.fillStyle='#eef0ef';ctx.fillRect(px,py,size,1);
   if(grain<.13){ctx.fillStyle='#81868a';ctx.fillRect(px+2,py+1,1,3);}
  }
 }
 const splash=documentRef.getElementById('menuSplash');
 if(splash&&!splash.textContent.trim())splash.textContent='Explore!';
 return true;
}

export function installBundledSiteTheme112(root=document.documentElement,documentRef=document){
 drawBundledTitle112(documentRef);
 const textures=drawBundledMenu112(documentRef);
 if(!textures)return false;
 for(const [name,uri] of Object.entries(textures))
  root.style.setProperty('--site112-'+name,'url("'+uri+'")');
 root.classList.add('site-default112');
 root.dataset.defaultVisuals='bundled';
 return true;
}
