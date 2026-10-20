// On every successful GitHub Pages deployment, open the real public website in Chromium.
// Captures screenshots and checks menu flow and browser-applied owner-GUI selectors.
// No copyrighted Minecraft assets, login, saved worlds or private files are used here.
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const site='https://chansiu11.github.io/akzm/';
await mkdir('site-review',{recursive:true});
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
  await page.waitForTimeout(1200);
  await page.screenshot({path:'site-review/'+label+'-gameplay.png'});
  // Opening inventory also checks the interactive JavaScript hooks for the 1.12.2 GUI.
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',key:'e',bubbles:true})));
  await page.locator('#inventory').waitFor({state:'visible',timeout:12000});
  await page.screenshot({path:'site-review/'+label+'-inventory.png'});
  console.log(JSON.stringify({label,menu:'ok',worlds:'ok',ownerGuiCSS:result,inventory:'ok'}));
 }catch(e){failures.push(label+': '+e.message);await page.screenshot({path:'site-review/'+label+'-failure.png'}).catch(()=>{});}
 finally{await context.close();}
}
await review({width:1440,height:900},'desktop');
await review({width:390,height:844},'mobile',true);
await browser.close();
if(failures.length){for(const f of failures)console.error(f);process.exitCode=1;}
