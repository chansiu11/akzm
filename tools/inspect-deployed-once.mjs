// One-shot inspection of public GitHub Pages. Never uploads user-owned JARs.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const label=process.env.REVIEW_VIEWPORT||'desktop';
const variants={desktop:{width:1365,height:768,touch:false},mobile:{width:390,height:844,touch:true},landscape:{width:844,height:390,touch:true}};
const v=variants[label]??variants.desktop;
await fs.mkdir('inspection-evidence',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const context=await browser.newContext({viewport:{width:v.width,height:v.height},deviceScaleFactor:1,isMobile:v.touch,hasTouch:v.touch});
const page=await context.newPage();
const notes=[],errors=[],snapshots=[];
const read=async()=>page.evaluate(()=>{
 const selectors=['#menu-title','#menu-worlds','#menu-create','#menu-settings','#worldLoading','#overlay','#viewport','#touchControls','#hotbar','#survivalHud'];
 const boxes={};for(const id of selectors){const el=document.querySelector(id);if(!el)continue;const r=el.getBoundingClientRect(),style=getComputedStyle(el);boxes[id]={visible:style.display!=='none'&&style.visibility!=='hidden'&&r.width>0&&r.height>0,rect:{x:r.x,y:r.y,w:r.width,h:r.height},background:style.backgroundImage.slice(0,130)};}
 return {ready:document.documentElement.dataset.appReady,viewport:{width:innerWidth,height:innerHeight},boxes,loadingText:document.querySelector('#loadingText112')?.textContent,menuOpen:document.body.classList.contains('menu-open'),touchUi:document.body.classList.contains('touch-ui'),gui112:document.documentElement.classList.contains('gui112-assets'),appReady:document.documentElement.dataset.appReady};
});
const snap=async(title)=>{
 const name=label+'-'+String(snapshots.length+1).padStart(2,'0')+'-'+title+'.png';
 await page.screenshot({path:'inspection-evidence/'+name,timeout:18000}).catch(e=>errors.push(name+' screenshot: '+e.message));
 snapshots.push({name,screen:await read()});
 console.log('CAPTURE '+name+' '+JSON.stringify(snapshots.at(-1).screen));
};
async function action(selector,title){
 try{await page.locator(selector).click({timeout:12000});notes.push('CLICK '+selector);await page.waitForTimeout(350);}catch(e){errors.push('click '+selector+': '+e.message)}
 await snap(title);
}
page.on('pageerror',e=>errors.push('JS: '+e.message));
page.on('console',m=>{if(m.type()==='error')errors.push('Console: '+m.text())});
page.on('requestfailed',request=>errors.push('Fetch '+request.url()+' '+request.failure()?.errorText));
try{
 const response=await page.goto('https://chansiu11.github.io/akzm/?inspection='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 notes.push('HTTP '+response?.status());
 await page.waitForTimeout(2000);await snap('initial-title-before');
 try{await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true',{timeout:20000})}catch(e){errors.push('appReady timeout: '+e.message)}
 await snap('initial-title-after');
 await action('#menuSingle','world-list');
 await action('#worldCreate','world-create');
 await action('#createBack','world-list-return');
 await action('#worldBack','title-return');
 await action('#menuSettings','settings');
 await action('#settingsSave','settings-return');
 await action('#menuSingle','world-list-2');
 await action('#worldCreate','create-world-form');
 try{await page.locator('#worldName').fill('VisualAudit '+Date.now(),{timeout:10000});await action('#createConfirm','create-click');}catch(e){errors.push('create flow: '+e.message);}
 await page.waitForTimeout(12000);await snap('world-loading-12sec');
 await page.waitForTimeout(13000);await snap('world-loading-25sec');
 if((await read()).boxes['#worldLoading']?.visible){notes.push('Loading overlay still visible after 25 seconds');}
 else {
  if(v.touch){
   await snap('touch-controls-before');
   await action('#touchBag','inventory-mobile');
   await action('#closeInventory','inventory-close-mobile');
  }else{
   await page.keyboard.press('KeyE');await snap('inventory-desktop');
   await page.keyboard.press('KeyE');await snap('inventory-closed');
   await page.keyboard.press('Escape');await snap('pause-desktop');
  }
 }
}catch(e){errors.push('FATAL '+(e.stack||e.message));await snap('unexpected-end')}
finally{
 await fs.writeFile('inspection-evidence/'+label+'-report.json',JSON.stringify({label,notes,errors,snapshots},null,2));
 console.log('INSPECTION_REPORT '+JSON.stringify({label,notes,errors,snapshots:snapshots.map(x=>x.name)}));
 await browser.close();
}
