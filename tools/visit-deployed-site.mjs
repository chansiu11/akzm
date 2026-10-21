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
const sources=['index.html','gui112.css','src/main.js','src/first-person.js','src/held-item-view.js','src/gui112-layout.js','menu112.css','src/menu112-assets.js','src/gui112-assets.js','src/menu-panorama.js','src/resource-pack.js','src/atlas.js','src/block-registry.js','src/bitmap-font112.js','src/private-resource-cache.js','src/title-layout112.js','src/menu.js','src/item-extrusion.js'];
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
  await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
  await page.locator('#menuSingle').waitFor({state:'visible',timeout:30000});
  await page.screenshot({path:'site-review/'+label+'-title.png',fullPage:true});
  if(!await page.title().then(t=>t.includes('Minecraft 1.12.2')))throw Error('Game title mismatch');
  for(const selector of ['#menuSingle','#menuSettings','#menuExit']){
   const box=await page.locator(selector).boundingBox();
   if(!box||box.x<0||box.y<0||box.x+box.width>viewport.width||box.y+box.height>viewport.height)throw Error('Menu control clipped: '+selector);
  }
  const titleGeometry=await page.locator('#menuSingle').boundingBox();
  const expectedScale=Math.max(1,Math.min(Math.floor(viewport.width/320),Math.floor(viewport.height/240)));
  if(Math.abs(titleGeometry.width-200*expectedScale)>.5||Math.abs(titleGeometry.height-20*expectedScale)>.5)throw Error('Title button dimensions differ from logical 200x20');
  await page.locator('#menuSettings').click();
  await page.locator('#loadJar112').waitFor({state:'visible'});
  await page.locator('#settingsBack').click();
  // An original transparent texel must replace, not overlay, generated fallback art.
  await page.evaluate(async()=>{
   const {loadLocalResourcePack}=await import('./src/resource-pack.js?v=1.2');
   const c=document.createElement('canvas');c.width=c.height=16;
   const bytes=new Uint8Array(await (await fetch(c.toDataURL())).arrayBuffer());
   const previous=window.JSZip;
   try{
    const entry={async:async()=>bytes};
    window.JSZip={loadAsync:async()=>({files:{'assets/minecraft/textures/blocks/glass.png':entry},file:path=>path.endsWith('/glass.png')?entry:null})};
    const result=await loadLocalResourcePack(new Blob(['fixture']));
    if(result.canvas.getContext('2d').getImageData(7*16,16,1,1).data[3]!==0)throw Error('Original transparent glass retains fallback pixels');
   }finally{window.JSZip=previous;}
  });
  // Synthetic PNGs validate the local resource rendering path without uploading
  // the owner's JAR or copyrighted image bytes to Actions.
  const ownerMenu=await page.evaluate(async()=>{
   const {MENU112_FILES,applyMenu112}=await import('./src/menu112-assets.js');
   const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#6789ab';ctx.fillRect(0,0,256,256);
   const assets=Object.fromEntries(Object.keys(MENU112_FILES).map(k=>[k,c.toDataURL()]));
   await applyMenu112(assets);
   const logo=document.getElementById('originalTitle112').getBoundingClientRect();
   const ok=document.documentElement.classList.contains('menu112-assets')&&logo.width>0&&logo.right<=innerWidth;
   document.documentElement.classList.remove('menu112-assets');
   document.getElementById('menuPanorama').dispatchEvent(new CustomEvent('owner-panorama',{detail:null}));
   return ok;
  });
  if(!ownerMenu)throw Error('Owner menu resources did not render');
  // The menu navigation is installed by main.js, so this tests code executed, not only static HTML.
  await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
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
  const closeBounds=await page.locator('#closeInventory').boundingBox();
  if(!closeBounds||closeBounds.y<0||closeBounds.x<0||closeBounds.x+closeBounds.width>viewport.width)throw Error('Inventory close control is clipped');
  await page.screenshot({path:'site-review/'+label+'-inventory.png'});
  await page.locator('#closeInventory').click();
  await page.locator('#inventory').waitFor({state:'hidden'});
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',key:'e',bubbles:true})));
  await page.locator('#inventory').waitFor({state:'visible'});
  if(await page.locator('#hotbar').evaluate(el=>getComputedStyle(el).display)!=='none')throw Error('HUD visible after reopening inventory');
  // Synthetic pixels exercise the same WebGL hand/item renderer without publishing owner art.
  await page.evaluate(async()=>{
   const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
   const {createFirstPerson}=await import('./src/first-person.js?v=1.5');
   const renderer=new THREE.WebGLRenderer({alpha:false,preserveDrawingBuffer:true});renderer.setSize(320,240);renderer.setClearColor('#9cc6df');
   renderer.domElement.id='modelFixture';Object.assign(renderer.domElement.style,{position:'fixed',top:'0',left:'0',zIndex:'9999'});document.body.append(renderer.domElement);
   const c=document.createElement('canvas');c.width=c.height=16;const ctx=c.getContext('2d');ctx.fillStyle='#88552a';ctx.fillRect(7,4,2,11);ctx.fillStyle='#35c8cf';ctx.fillRect(2,2,12,3);
   const model=createFirstPerson(renderer,new THREE.CanvasTexture(c));await model.setOwnerItems({110:c.toDataURL()});model.setItem(110);renderer.clear();model.render(320,240);
   if(renderer.info.render.triangles<=12)throw Error('Extruded item side geometry missing');
   window.fixtureModel={model,renderer,c};
  });
  await page.locator('#modelFixture').screenshot({path:'site-review/'+label+'-synthetic-item.png'});
  await page.evaluate(async()=>{
   const {model,renderer,c}=window.fixtureModel;c.width=c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#d6a177';ctx.fillRect(40,16,16,16);ctx.fillStyle='#26859a';ctx.fillRect(40,16,16,8);
   await model.setOwnerSkin(c.toDataURL());model.setItem(0);renderer.clear();model.render(320,240);
   if(renderer.info.render.triangles!==12)throw Error('Textured arm should replace separate cuff');
  });
  await page.locator('#modelFixture').screenshot({path:'site-review/'+label+'-synthetic-arm.png'});
  await page.evaluate(()=>{const {model,renderer}=window.fixtureModel;model.dispose();renderer.domElement.remove();renderer.dispose();delete window.fixtureModel;});
  // Verify IndexedDB survives a real navigation and startup restores without a picker.
  await page.evaluate(async()=>{
   const {writePrivateResources,PRIVATE_RESOURCE_VERSION}=await import('./src/private-resource-cache.js');
   const {GUI112_FILES}=await import('./src/gui112-assets.js');
   const {MENU112_FILES}=await import('./src/menu112-assets.js');
   const c=document.createElement('canvas');c.width=c.height=256;
   c.getContext('2d').fillRect(0,0,256,256);
   const assets=Object.fromEntries([...Object.keys(GUI112_FILES),...Object.keys(MENU112_FILES)].map(k=>[k,c.toDataURL()]));
   assets.bitmapFont={ascii:c.toDataURL(),sizes:btoa(String.fromCharCode(15).repeat(65536)),pages:{172:c.toDataURL(),174:c.toDataURL(),179:c.toDataURL(),183:c.toDataURL(),185:c.toDataURL(),186:c.toDataURL(),189:c.toDataURL(),192:c.toDataURL(),196:c.toDataURL(),199:c.toDataURL(),200:c.toDataURL(),201:c.toDataURL(),203:c.toDataURL(),205:c.toDataURL(),208:c.toDataURL(),212:c.toDataURL()}};
   c.width=128;c.height=96;
   if(!await writePrivateResources({version:PRIVATE_RESOURCE_VERSION,assets,atlas:c.toDataURL()}))throw Error('Private cache write failed');
  });
  await page.reload();
  await page.waitForFunction(()=>document.getElementById('packStatus')?.textContent.includes('자동 불러오기 완료'));
  await page.waitForFunction(()=>document.documentElement.classList.contains('menu112-assets')&&document.documentElement.classList.contains('gui112-assets'));
  await page.locator('#menu-title .menu-stack > button:nth-child(3) canvas.bitmap-text').waitFor({state:'attached'});
  console.log(JSON.stringify({label,automaticResourceRestore:'ok',menu:'ok',worlds:'ok',ownerGuiCSS:result,inventory:'ok'}));
 }catch(e){failures.push(label+': '+e.message);await page.screenshot({path:'site-review/'+label+'-failure.png'}).catch(()=>{});}
 finally{await context.close();}
}
await review({width:1440,height:900},'desktop');
await review({width:390,height:844},'mobile',true);
await review({width:844,height:390},'mobile-landscape',true);
await browser.close();
if(failures.length){for(const f of failures)console.error(f);process.exitCode=1;}
