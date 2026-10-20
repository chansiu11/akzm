// On every successful GitHub Pages deployment, open the real public website in Chromium.
// Captures screenshots and checks menu flow and browser-applied owner-GUI selectors.
// No copyrighted Minecraft assets, login, saved worlds or private files are used here.
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const site='https://chansiu11.github.io/akzm/';
await mkdir('site-review',{recursive:true});
// A push may start before Pages finishes. Never call old deployed files a test
// of the new commit: wait for the entry point and changed visual modules.
const sources=['index.html','gui112.css','src/main.js','src/first-person.js','src/held-item-view.js'];
const digest=data=>createHash('sha256').update(data).digest('hex');
const expected=Object.fromEntries(await Promise.all(sources.map(async file=>[file,digest(await readFile(file))])));
let pending=sources.slice();
const deadline=Date.now()+360000;
while(pending.length&&Date.now()<deadline){
 pending=[];
 for(const file of sources){
  try{const response=await fetch(new URL(file+'?review='+Date.now(),site),{signal:AbortSignal.timeout(15000)});
   if(!response.ok||digest(Buffer.from(await response.arrayBuffer()))!==expected[file])pending.push(file);
  }catch{pending.push(file);}
 }
 if(pending.length){console.log('Waiting for matching deployment: '+pending.join(', '));await new Promise(resolve=>setTimeout(resolve,10000));}
}
if(pending.length)throw Error('Pages does not match checkout: '+pending.join(', '));
await writeFile('site-review/deployment.json',JSON.stringify({commit:process.env.GITHUB_SHA??null,site,sha256:expected},null,2));
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const failures=[];
async function review(viewport,label,touch=false){
 const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:touch,hasTouch:touch});
 const page=await context.newPage();
 page.on('pageerror',e=>failures.push(label+': JS error: '+e.message));
 try{
  const response=await page.goto(site,{waitUntil:'domcontentloaded',timeout:60000});
  if(!response?.ok())throw Error('Website HTTP status '+response?.status());
  await page.locator('#menuSingle').waitFor({state:'visible',timeout:30000});
  await page.screenshot({path:'site-review/'+label+'-title.png',fullPage:true});
  // The menu navigation is installed by main.js, so this tests code executed, not only static HTML.
  await page.locator('#menuSingle').click({timeout:30000});
  await page.locator('#menu-worlds').waitFor({state:'visible',timeout:30000});
  await page.screenshot({path:'site-review/'+label+'-worlds.png'});
  // Regression test: the site's real CSS must react to the class on <html>.
  const result=await page.evaluate(()=>{
   const root=document.documentElement,bar=document.getElementById('hotbar'),cross=document.getElementById('crosshair');
   const old=root.style.getPropertyValue('--gui112-widgets');
   root.style.setProperty('--gui112-widgets','url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/2gAAAABJRU5ErkJggg==")');
   root.classList.add('gui112-assets');
   const bg=getComputedStyle(bar).backgroundImage;
   const width=getComputedStyle(cross).width;
   root.classList.remove('gui112-assets');
   if(old)root.style.setProperty('--gui112-widgets',old);else root.style.removeProperty('--gui112-widgets');
   return {spriteApplied:bg.includes('data:image/png'),crossWidth:width};
  });
  if(!result.spriteApplied)throw Error('Imported GUI sprite CSS did not activate on <html>.');
  await page.locator('#worldPlay').click({timeout:30000});
  await page.waitForTimeout(7000);
  await page.screenshot({path:'site-review/'+label+'-gameplay.png'});
  // Opening inventory also checks the interactive JavaScript hooks for the 1.12.2 GUI.
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',key:'e',bubbles:true})));
  await page.locator('#inventory').waitFor({state:'visible',timeout:12000});
  const overlayHud=await page.locator('#hotbar').evaluate(el=>getComputedStyle(el).display);
  if(overlayHud!=='none')throw Error('Vanilla inventory regression: gameplay HUD is still visible.');
  const bounds=await page.locator('#inventory').boundingBox();
  if(!bounds||bounds.x<0||bounds.y<0||bounds.x+bounds.width>viewport.width||bounds.y+bounds.height>viewport.height)throw Error('Inventory panel exceeds viewport');
  await page.screenshot({path:'site-review/'+label+'-inventory.png'});
  await page.locator('#closeInventory').click();
  await page.locator('#inventory').waitFor({state:'hidden'});
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',key:'e',bubbles:true})));
  await page.locator('#inventory').waitFor({state:'visible'});
  if(await page.locator('#hotbar').evaluate(el=>getComputedStyle(el).display)!=='none')throw Error('HUD visible after reopening inventory');
  console.log(JSON.stringify({label,menu:'ok',worlds:'ok',ownerGuiCSS:result,inventory:'ok'}));
 }catch(e){failures.push(label+': '+e.message);await page.screenshot({path:'site-review/'+label+'-failure.png'}).catch(()=>{});}
 finally{await context.close();}
}
await review({width:1440,height:900},'desktop');
await review({width:390,height:844},'mobile',true);
await review({width:844,height:390},'mobile-landscape',true);
await browser.close();
if(failures.length){for(const f of failures)console.error(f);process.exitCode=1;}
