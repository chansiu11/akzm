// Explicit owner-requested browser parity pass for survival empty hand, HUD, and mining.
// Uses only synthetic fallback graphics and ephemeral Playwright browser storage.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const profile=process.env.REVIEW_VIEWPORT||'desktop';
const v={desktop:{width:1365,height:768,touch:false},mobile:{width:390,height:844,touch:true},landscape:{width:844,height:390,touch:true}}[profile];
const dir='survival-evidence';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const ctx=await browser.newContext({viewport:{width:v.width,height:v.height},deviceScaleFactor:1,isMobile:v.touch,hasTouch:v.touch});
const page=await ctx.newPage();page.setDefaultTimeout(15000);
const findings={},errors=[],images=[];
page.on('pageerror',e=>errors.push('PAGEERROR '+e.message));page.on('response',r=>{if(r.status()===404)errors.push('404 '+r.url())});
async function snap(id){
 const filename=profile+'-'+String(images.length+1).padStart(2,'0')+'-'+id+'.png';
 await page.screenshot({path:dir+'/'+filename,timeout:30000});images.push(filename);
 console.log('SNAP '+filename);
}
async function status(){
 return page.evaluate(()=>{
 const hotbar=document.getElementById('hotbar'),ui=document.getElementById('survivalHud'),text=document.getElementById('status')?.textContent??'';
 return {hotbarCount:hotbar?.querySelectorAll('.slot').length??0,emptySlots:[...hotbar.querySelectorAll('.slot')].filter(x=>getComputedStyle(x.querySelector('i')).visibility==='hidden').length,hearts:ui?.querySelectorAll('.heart').length??0,food:ui?.querySelectorAll('.food').length??0,emptyHud:ui?.children.length??0,selectedTarget:document.getElementById('target')?.textContent??'',mineIndicator:Number(document.getElementById('miningIndicator')?.getAttribute('aria-valuenow')),changedBlocks:Number(text.match(/변경 블록\s+(\d+)/)?.[1]??-1),loadingHidden:document.getElementById('worldLoading')?.classList.contains('hidden'),screen:document.documentElement.dataset.appReady};
 });
}
try{
 await page.goto('https://chansiu11.github.io/akzm/?survivalVisual='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true',null,{timeout:30000});
 await snap('menu');
 await page.locator('#menuSingle').click();await snap('worlds');
 await page.locator('#worldCreate').click();await snap('create');
 await page.locator('#worldMode').selectOption('survival');
 await page.locator('#worldName').fill('Survival QA '+Date.now());
 await snap('survival-selected');
 await page.locator('#createConfirm').click();
 await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true'&&document.getElementById('worldLoading')?.classList.contains('hidden')&&!document.getElementById('overlay')?.classList.contains('show'),null,{timeout:130000});
 await page.waitForTimeout(1300);await snap('survival-spawn-empty-hand');
 const pre=await status();findings.initialState=pre;
 findings['HUD has ten hearts and ten food glyphs']=pre.hearts===10&&pre.food===10;
 findings['survival empty hand has nine empty hotbar cells']=pre.emptySlots===9&&pre.hotbarCount===9;
 // Clicking at empty air should never break a block; look target must be in five-block range.
 if(!pre.selectedTarget){
  if(v.touch){
   const box=await page.locator('#touchUp').boundingBox();
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
   for(let n=0;n<22;n++){await page.waitForTimeout(200);if((await status()).selectedTarget)break}
   await page.mouse.up();
  }else{
   await page.keyboard.down('w');
   for(let n=0;n<22;n++){await page.waitForTimeout(200);if((await status()).selectedTarget)break}
   await page.keyboard.up('w');
  }
 }
 const target=await status();findings.reachable=target.selectedTarget;
 await snap('target-and-empty-hand');
 if(v.touch){
  const b=await page.locator('#touchMine').boundingBox();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
  await page.waitForTimeout(230);await snap('touch-mining-230ms');
  await page.waitForTimeout(900);await snap('touch-mining-1130ms');
  await page.mouse.up();
  await page.locator('#touchBag').tap();await snap('survival-inventory');
  await page.locator('#closeInventory').tap();
 }else{
  await page.mouse.move(v.width/2,v.height/2);await page.mouse.down();
  await page.waitForTimeout(230);await snap('mouse-mining-230ms');
  await page.waitForTimeout(900);await snap('mouse-mining-1130ms');
  await page.mouse.up();
  await page.keyboard.press('e');await snap('survival-inventory');
  await page.keyboard.press('e');
 }
 findings.assetVersion=await page.evaluate(()=>document.querySelector('script[src*="src/main.js"]')?.getAttribute('src'));
 if(v.touch){
  findings.touchGeometry=await page.evaluate(()=>{
   const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   const actions=rect('touchActions'),hud=rect('survivalHud'),bar=rect('hotbar');
   const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
   return {actions,hud,bar,actionsOverlapHud:overlap(actions,hud),actionsOverlapHotbar:overlap(actions,bar)};
  });
  if(findings.touchGeometry.actionsOverlapHud||findings.touchGeometry.actionsOverlapHotbar)errors.push('Mobile touch action controls overlap HUD or hotbar');
 }
 findings.afterMine=await status();
 findings['survival UI remains playable']=findings.afterMine.loadingHidden;
 await snap('post-mining');
}catch(e){errors.push('FATAL '+(e.stack||e.message));await snap('failure').catch(()=>{});}
finally{await fs.writeFile(dir+'/'+profile+'-report.json',JSON.stringify({profile,findings,errors,images},null,2));console.log('SURVIVAL_AUDIT '+JSON.stringify({profile,findings,errors}));await browser.close();}
