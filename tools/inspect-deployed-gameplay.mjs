// Actual public Pages test, no proprietary JAR/images uploaded.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const label=process.env.REVIEW_VIEWPORT||'desktop';
const profiles={desktop:{width:1365,height:768,touch:false},mobile:{width:390,height:844,touch:true},landscape:{width:844,height:390,touch:true}};
const v=profiles[label]||profiles.desktop;
const dir='gameplay-evidence';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const context=await browser.newContext({viewport:{width:v.width,height:v.height},deviceScaleFactor:1,isMobile:v.touch,hasTouch:v.touch});
const page=await context.newPage();
const errors=[],observations=[],shots=[];
page.on('pageerror',e=>errors.push('JS error: '+e.message));
page.on('console',m=>{if(m.type()==='error')errors.push('Console: '+m.text())});
page.on('requestfailed',r=>errors.push('Network: '+r.url()+' '+r.failure()?.errorText));
async function state(){
 return page.evaluate(()=>{
 const loading=document.getElementById('worldLoading'),ls=document.getElementById('loadingText112'),hud=document.getElementById('survivalHud'),touch=document.getElementById('touchControls'),canvas=document.getElementById('viewport');
 const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
 const visible=e=>!!e&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';
 return {ready:document.documentElement.dataset.appReady,loading:visible(loading),loadingText:ls?.textContent,worldVisible:!document.body.classList.contains('menu-open'),hudVisible:visible(hud),touchVisible:visible(touch),hudBox:box(hud),touchBox:box(touch),viewport:box(canvas),slotCount:document.querySelectorAll('#hotbar .slot').length,worldSaveKeys:Object.keys(localStorage).filter(x=>x.startsWith('voxel-frontier-save-v1')).length};
 });
}
let counter=0;
async function shot(name){
 const file=label+'-'+String(++counter).padStart(2,'0')+'-'+name+'.png';
 await page.screenshot({path:dir+'/'+file,timeout:30000}).catch(e=>errors.push('screenshot '+file+': '+e.message));
 const s=await state().catch(e=>({error:e.message}));observations.push({file,s});
 console.log('FRAME '+file+' '+JSON.stringify(s));
}
try{
 const res=await page.goto('https://chansiu11.github.io/akzm/?gameplayinspection='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 console.log('HTTP '+res?.status());
 await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true',null,{timeout:30000});
 await shot('title-before-click');
 await page.locator('#menuSingle').click();await shot('world-list-after-click');
 await page.locator('#worldPlay').click({timeout:12000,noWaitAfter:true});
 await shot('world-play-after-click');
 // The 12-chunk radius contains 625 chunks; observe actual completion or bottleneck.
 for(let i=1;i<=42;i++){
  if(!(await state()).loading)break;
  await page.waitForTimeout(10000);
  if(i===3||i===6||i===12||i===18||i===24||i===30||i===36||i===42)await shot('loading-'+(i*10)+'s');
 }
 const s=await state();
 if(s.loading){errors.push('Game remained behind loading overlay after 420 seconds: '+s.loadingText);}
 else{
  await shot('gameplay-ready');
  try{
   if(v.touch){
    await page.locator('#touchBag').click({timeout:10000});await shot('inventory-after-bag');
    await page.locator('#closeInventory').click({timeout:10000});await shot('inventory-closed');
    await page.locator('#touchJump').tap({timeout:10000});await shot('after-jump-tap');
    await page.locator('#touchMine').tap({timeout:10000});await shot('after-break-tap');
   }else{
    await page.keyboard.press('e');await page.waitForTimeout(300);await shot('inventory-after-e');
    await page.keyboard.press('e');await page.waitForTimeout(300);await shot('inventory-closed');
    await page.mouse.move(v.width/2,v.height/2);await page.mouse.down({button:'left'});
    await page.waitForTimeout(1000);await shot('mining-held');
    await page.mouse.move(v.width/2+80,v.height/2+35,{steps:8});await shot('mining-during-look');
    await page.mouse.up({button:'left'});await shot('mining-released');
    await page.keyboard.press('Escape');await shot('pause-after-escape');
   }
  }catch(e){errors.push('gameplay controls: '+(e.stack||e.message));await shot('interaction-failure');}
 }
}catch(e){errors.push('FATAL: '+(e.stack||e.message));await shot('failure').catch(()=>{});}
finally{await fs.writeFile(dir+'/'+label+'-report.json',JSON.stringify({label,observations,errors},null,2));console.log('GAMEPLAY_INSPECTION '+JSON.stringify({label,errors,shots:observations.map(o=>o.file)}));await browser.close();}
