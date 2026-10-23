// Touch-specific live test. Uses only a fresh browser profile, no private game assets.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const mode=process.env.REVIEW_VIEWPORT||'mobile';
const profiles={mobile:{width:390,height:844},landscape:{width:844,height:390}};
const v=profiles[mode];if(!v)throw Error('Only mobile and landscape');
await fs.mkdir('touch-review',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const ctx=await browser.newContext({viewport:v,deviceScaleFactor:1,isMobile:true,hasTouch:true});
const page=await ctx.newPage(),cdp=await ctx.newCDPSession(page);
const errors=[],findings={},frames=[];
page.on('pageerror',e=>errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()===404)errors.push('HTTP404 '+r.url())});
async function state(){return page.evaluate(()=>{
 const pos=(document.getElementById('status')?.textContent||'').match(/좌표\s+(-?\d+\.?\d*)\s*\/\s*(-?\d+\.?\d*)\s*\/\s*(-?\d+\.?\d*)/);
 const blocks=(document.getElementById('status')?.textContent||'').match(/변경 블록\s+(\d+)/);
 const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
 return {position:pos?.slice(1).map(Number)??null,blocks:Number(blocks?.[1]??-1),target:document.getElementById('target')?.textContent??'',loading:!document.getElementById('worldLoading')?.classList.contains('hidden'),buttons:rect('touchActions'),hud:rect('survivalHud'),hotbar:rect('hotbar')};
})}
async function shot(name){const file=mode+'-'+String(frames.length+1).padStart(2,'0')+'-'+name+'.png';await page.screenshot({path:'touch-review/'+file});frames.push({file,info:await state()});console.log('SHOT '+file+' '+JSON.stringify(frames.at(-1).info));}
async function send(type,pts){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(p=>({x:p.x,y:p.y,id:p.id,radiusX:4,radiusY:4,force:1}))})}
try{
 await page.goto('https://chansiu11.github.io/akzm/?touchReview='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true',null,{timeout:30000});
 await shot('title');
 await page.locator('#menuSingle').tap();await shot('worlds');
 await page.locator('#worldPlay').tap();
 await page.waitForFunction(()=>document.getElementById('worldLoading')?.classList.contains('hidden')&&!document.getElementById('overlay')?.classList.contains('show'),null,{timeout:145000});
 await page.waitForTimeout(400);await shot('gameplay');
 // Real TouchEvents, not synthetic mouse events, on the look canvas.
 let turnY=Math.min(v.height*.42,200);
 const tx=v.width*.52,ty=turnY;
 const swipe=async delta=>{
  const start={x:tx,y:ty,id:1};
  await send('touchStart',[start]);
  for(let i=1;i<=6;i++){await send('touchMove',[{x:tx,y:ty+delta*i/6,id:1}]);await page.waitForTimeout(28);}
  await send('touchEnd',[]);await page.waitForTimeout(160);
 };
 await swipe(Math.min(v.height*.32,135));await shot('look-down-first');
 if(!(await state()).target){await swipe(Math.min(v.height*.23,95));await shot('look-down-second');}
 const afterLook=await state();findings.lookHasTarget=!!afterLook.target;findings.aimedBlock=afterLook.target;
 const mine=await page.locator('#touchMine').boundingBox();const minePoint={x:mine.x+mine.width/2,y:mine.y+mine.height/2,id:2};
 await send('touchStart',[minePoint]);await page.waitForTimeout(270);await shot('mine-held');await page.waitForTimeout(600);await send('touchEnd',[]);await shot('mine-released');
 const afterMine=await state();findings.creativeMineChangesWorld=afterMine.blocks>afterLook.blocks;findings.changedBlocks=afterMine.blocks;
 // Two simultaneous independent touches: hold D-pad forward while swiping viewpoint.
 const up=await page.locator('#touchUp').boundingBox();const forward={x:up.x+up.width/2,y:up.y+up.height/2,id:3};
 const look={x:tx,y:ty,id:4};const beforeMove=await state();
 await send('touchStart',[forward]);await send('touchStart',[forward,look]);
 for(let i=1;i<=6;i++){await send('touchMove',[forward,{...look,x:tx+Math.min(95,v.width*.19)*i/6,y:ty+16*i/6}]);await page.waitForTimeout(100);}
 await shot('forward-plus-look-held');await page.waitForTimeout(450);await send('touchEnd',[]);await shot('forward-plus-look-released');
 const afterMove=await state();const distance=(a,b)=>a&&b?Math.hypot(a[0]-b[0],a[2]-b[2]):0;
 findings.simultaneousForwardMoved=distance(beforeMove.position,afterMove.position)>.05;
 findings.movementBefore=beforeMove.position;findings.movementAfter=afterMove.position;
 const g=afterMove.buttons,h=afterMove.hud,b=afterMove.hotbar,overlap=(a,z)=>a.x<z.right&&a.right>z.x&&a.y<z.bottom&&a.bottom>z.y;
 findings.touchButtonsOverlapHUD=overlap(g,h)||overlap(g,b);
 if(!findings.lookHasTarget)errors.push('Touch camera could not aim within 5 blocks');
 if(!findings.creativeMineChangesWorld)errors.push('Touch mine button did not change a reachable block');
 if(!findings.simultaneousForwardMoved)errors.push('Forward D-pad touch did not move player during look swipe');
 if(findings.touchButtonsOverlapHUD)errors.push('Touch controls overlap HUD');
}catch(e){errors.push('FATAL '+(e.stack||e.message));await shot('failure').catch(()=>{});}
finally{
 await fs.writeFile('touch-review/'+mode+'-report.json',JSON.stringify({mode,errors,findings,frames},null,2));
 console.log('TOUCH_AUDIT '+JSON.stringify({mode,errors,findings}));
 await browser.close();
 // Report findings as a failed job if any play interaction genuinely fails.
 if(errors.length)process.exitCode=1;
}
