// Focused smoke test against the actual deployed GitHub Pages site.
// Capture command-entry bounding boxes and screenshots on every viewport.
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const site='https://chansiu11.github.io/akzm/';
const targets={
 desktop:{viewport:{width:1440,height:900},touch:false},
 mobile:{viewport:{width:390,height:844},touch:true},
 'mobile-landscape':{viewport:{width:844,height:390},touch:true}
};
const label=process.env.REVIEW_VIEWPORT||'desktop';
if(!targets[label])throw Error('Unknown viewport: '+label);
await mkdir('command-review',{recursive:true});
const digest=buffer=>createHash('sha256').update(buffer).digest('hex');
const expected=Object.fromEntries(await Promise.all(
 ['index.html','visual-overhaul.css','src/command-ui.js'].map(async path=>[path,digest(await readFile(path))])));
let pending=Object.keys(expected);
const deadline=Date.now()+180000;
while(pending.length&&Date.now()<deadline){
 pending=[];
 for(const path of Object.keys(expected)){
  try{
   const response=await fetch(new URL(path+'?command-review='+Date.now(),site),{signal:AbortSignal.timeout(12000)});
   if(!response.ok||digest(Buffer.from(await response.arrayBuffer()))!==expected[path])pending.push(path);
  }catch{pending.push(path);}
 }
 if(pending.length){console.log('Pages files not current yet: '+pending.join(', '));await new Promise(resolve=>setTimeout(resolve,8000));}
}
if(pending.length)throw Error('Cannot verify stale Pages content: '+pending.join(', '));
const {viewport,touch}=targets[label];
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
let page;
try{
 const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:touch,hasTouch:touch});
 page=await context.newPage();
 const response=await page.goto(site,{waitUntil:'domcontentloaded',timeout:60000});
 if(!response?.ok())throw Error('Website unavailable: '+response?.status());
 await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true',null,{timeout:60000});
 await page.screenshot({path:'command-review/'+label+'-01-title.png'});
 await page.locator('#menuSingle').click();
 await page.locator('#menu-worlds').waitFor({state:'visible'});
 await page.screenshot({path:'command-review/'+label+'-02-worlds.png'});
 await page.locator('#worldPlay').click();
 await page.locator('#overlay:not(.show)').waitFor({state:'attached',timeout:90000});
 await page.screenshot({path:'command-review/'+label+'-03-game.png'});
 const openChat=async()=>{
  if(touch)await page.locator('#touchCommand').click();
  else await page.keyboard.press('Slash');
  await page.locator('#commandPanel').waitFor({state:'visible',timeout:15000});
 };
 await openChat();
 const result=await page.evaluate(()=>{
  const panel=document.getElementById('commandPanel');
  const input=document.getElementById('commandInput');
  const toJSON=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
  const style=getComputedStyle(panel);
  return {viewport:{width:innerWidth,height:innerHeight},
   panel:toJSON(panel),input:toJSON(input),
   computed:{transform:style.transform,translate:style.translate,left:style.left,right:style.right,width:style.width},
   prefill:input.value};
 });
 await writeFile('command-review/'+label+'-geometry.json',JSON.stringify(result,null,2));
 console.log('COMMAND_GEOMETRY '+JSON.stringify({label,...result}));
 for(const name of ['panel','input']){
  const r=result[name],v=result.viewport;
  if(!(r.width>0&&r.height>0&&r.x>=-1&&r.y>=-1&&r.right<=v.width+1&&r.bottom<=v.height+1))
   throw Error(label+' '+name+' is outside viewport: '+JSON.stringify(result));
 }
 if(result.prefill!=='/')throw Error('Slash prefill missing: '+JSON.stringify(result));
 if(result.computed.transform!=='none'||result.computed.translate!=='none')
  throw Error('Command panel retains a translation: '+JSON.stringify(result));
 await page.screenshot({path:'command-review/'+label+'-04-command-open.png'});
 await page.locator('#commandInput').press('Escape');
 await page.locator('#commandPanel').waitFor({state:'hidden'});
 await page.screenshot({path:'command-review/'+label+'-05-command-close.png'});
 await openChat();
 await page.locator('#commandInput').fill('/help');
 await page.locator('#commandInput').press('Enter');
 await page.locator('#commandPanel').waitFor({state:'hidden'});
 const reply=(await page.locator('#chatHistory112').textContent()||'').trim();
 if(!reply.length)throw Error('Enter did not execute /help into chat history');
 await page.screenshot({path:'command-review/'+label+'-06-after-help.png'});
 console.log('COMMAND_CHAT_PASS '+label);
 // The desktop must pause on Escape even if there is no pointer lock.
 // On mobile, the touch pause control follows the same menu path.
 const beforePause=await page.evaluate(()=>({
  activeElement:document.activeElement?.id||document.activeElement?.tagName,
  overlayVisible:document.getElementById('overlay').classList.contains('show'),
  pointerLocked:!!document.pointerLockElement,
  pauseHidden:document.getElementById('menu-pause').classList.contains('hidden')
 }));
 console.log('PAUSE_BEFORE '+JSON.stringify({label,...beforePause}));
 if(touch)await page.locator('#touchPause').click();
 else await page.keyboard.press('Escape');
 await page.locator('#menu-pause').waitFor({state:'visible',timeout:15000});
 const pauseCheck=await page.evaluate(()=>{
  const pause=document.getElementById('menu-pause');
  return {shown:getComputedStyle(pause).display!=='none',buttons:pause.querySelectorAll('.pause-buttons112 button.stone-button').length,
    worldCovered:document.getElementById('overlay').classList.contains('show')};
 });
 if(!pauseCheck.shown||pauseCheck.buttons!==6||!pauseCheck.worldCovered)
  throw Error('Pause menu malformed: '+JSON.stringify(pauseCheck));
 await page.screenshot({path:'command-review/'+label+'-07-pause-open.png'});
 await page.locator('#pauseSettings').click();
 await page.locator('#menu-settings').waitFor({state:'visible'});
 await page.screenshot({path:'command-review/'+label+'-08-pause-settings.png'});
 await page.locator('#settingsSave').click();
 await page.locator('#menu-pause').waitFor({state:'visible'});
 await page.screenshot({path:'command-review/'+label+'-09-return-pause.png'});
 await page.locator('#pauseResume').click();
 await page.locator('#overlay:not(.show)').waitFor({state:'attached',timeout:15000});
 await page.screenshot({path:'command-review/'+label+'-10-resume-game.png'});
 console.log('PAUSE_FLOW_PASS '+label);
} catch(error){
 console.error('COMMAND_CHAT_FAIL '+label+': '+error?.stack);
 if(page)await page.screenshot({path:'command-review/'+label+'-failure.png'}).catch(()=>{});
 process.exitCode=1;
} finally{await browser.close();}
