// Deployed browser verification: actual user interactions, no private Minecraft JAR uploaded.
import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const label=process.env.REVIEW_VIEWPORT||'desktop';
const profiles={desktop:{width:1365,height:768,touch:false},mobile:{width:390,height:844,touch:true},landscape:{width:844,height:390,touch:true}};
const v=profiles[label]??profiles.desktop;
const dir='interaction-evidence';await fs.mkdir(dir,{recursive:true});
const site='https://chansiu11.github.io/akzm/';
const hash=v=>createHash('sha256').update(v).digest('hex');
const expected=hash(await readFile('src/first-person.js'));
for(let n=0;n<12;n++){
 try{const r=await fetch(new URL('src/first-person.js?audit='+Date.now(),site));if(r.ok&&hash(await r.text())===expected)break;}catch{}
 await new Promise(resolve=>setTimeout(resolve,5000));
}
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const ctx=await browser.newContext({viewport:{width:v.width,height:v.height},deviceScaleFactor:1,isMobile:v.touch,hasTouch:v.touch});
const page=await ctx.newPage();page.setDefaultTimeout(12000);const errors=[],events=[],checks={};let shots=0;
page.on('pageerror',e=>errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()===404)errors.push('404 '+r.url())});
function getState(){return page.evaluate(()=>{
 const el=id=>document.getElementById(id),style=id=>getComputedStyle(el(id));
 const p=document.querySelector('.pixel-vital.heart');
 const text=el('status')?.textContent??'';
 return {loading:!el('worldLoading').classList.contains('hidden'),loadingText:el('loadingText112').textContent,streamVisible:!el('chunkStream112').classList.contains('hidden'),streamText:el('chunkStream112').textContent,streamBox:el('chunkStream112').getBoundingClientRect().toJSON(),changedBlocks:Number(text.match(/변경 블록\s+(\d+)/)?.[1]??-1),hudColor:p?getComputedStyle(p).backgroundColor:null,hudBackground:p?getComputedStyle(p).backgroundImage:null,target:el('target')?.textContent,firstHotbarItem:el('hotbar')?.querySelector('.slot.active')?.dataset.i,mobileControls:style('touchControls').display,inventoryOpen:!el('inventory').classList.contains('hidden'),pauseOpen:!el('menu-pause').classList.contains('hidden')};
});}
async function capture(name){const file=label+'-'+(++shots)+'-'+name+'.png';await page.screenshot({path:dir+'/'+file,timeout:20000});events.push({file,state:await getState()});console.log('SCREEN '+file+' '+JSON.stringify(events.at(-1).state));}
async function test(name,action){try{await action();checks[name]=true;}catch(e){checks[name]=false;errors.push(name+': '+e.message);}}
try{
 await page.goto(site+'?interactionReview='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true',null,{timeout:30000});
 await capture('title');
 await page.locator('#menuSingle').click();await capture('worlds');
 await page.locator('#worldPlay').click();
 await page.waitForFunction(()=>document.getElementById('worldLoading').classList.contains('hidden'),null,{timeout:110000});
 await page.waitForTimeout(700);await capture('gameplay');
 // Move within Minecraft's five-block selection reach before testing mining.
 let before=await getState();
 if(!before.target){
  if(v.touch){
   const r=await page.locator('#touchUp').boundingBox();if(!r)throw Error('Missing mobile forward button');
   await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down({button:'left'});
   for(let i=0;i<15;i++){await page.waitForTimeout(300);before=await getState();if(before.target)break;}
   await page.mouse.up({button:'left'});
  }else{
   await page.keyboard.down('w');
   for(let i=0;i<15;i++){await page.waitForTimeout(300);before=await getState();if(before.target)break;}
   await page.keyboard.up('w');
  }
  await page.waitForTimeout(150);before=await getState();await capture('approach-reachable-block');
 }
 checks['aimed at a reachable block']=!!before.target;

 checks['visible HUD and stream']=!!before.streamVisible&&!!before.hudBackground;
 checks['public sprite transparent backing']=before.hudColor==='rgba(0, 0, 0, 0)';
 checks['desktop touch controls absent']=v.touch||before.mobileControls==='none';
 if(v.touch){
  checks['mobile stream below top controls']=before.streamBox.y>=45;
  await test('mobile tap break changes a block',async()=>{
   await page.locator('#touchMine').tap();
   await page.waitForTimeout(150);
   const state=await getState();
   checks['mobile tap break changes a block']=state.changedBlocks>before.changedBlocks;
   if(!checks['mobile tap break changes a block'])throw Error('Block edits did not increase: '+before.changedBlocks+' -> '+state.changedBlocks);
  });
  await capture('mine');
  await test('mobile inventory',async()=>{await page.locator('#touchBag').tap();await page.locator('#inventory').waitFor({state:'visible'});});
  await capture('inventory');
  await page.locator('#closeInventory').tap();await capture('return');
  await page.locator('#touchPause').tap();await page.locator('#menu-pause').waitFor({state:'visible'});await capture('pause');
  await page.locator('#pauseResume').tap();await capture('resume');
 }else{
  checks['mobile controls hidden']=before.mobileControls==='none';
  await test('desktop mouse break changes a block',async()=>{
   await page.mouse.move(v.width/2,v.height/2);await page.mouse.down({button:'left'});
   await page.waitForTimeout(250);await page.mouse.move(v.width/2+75,v.height/2+20,{steps:6});
   await page.waitForTimeout(250);await page.mouse.up({button:'left'});
   const state=await getState();if(state.changedBlocks<=before.changedBlocks)throw Error('Block edits did not increase: '+before.changedBlocks+' -> '+state.changedBlocks);
  });
  await capture('mine-and-look');
  await page.keyboard.press('e');await capture('inventory');
  await page.keyboard.press('e');await capture('return');
  await page.keyboard.press('Escape');await capture('pause');
  await page.locator('#pauseResume').click();await capture('resume');
 }
}catch(e){errors.push('FATAL '+(e.stack??e.message));await capture('failure').catch(()=>{});}
finally{await fs.writeFile(dir+'/'+label+'-report.json',JSON.stringify({label,checks,errors,events},null,2));console.log('AUDIT_RESULT '+JSON.stringify({label,checks,errors}));await browser.close();}
