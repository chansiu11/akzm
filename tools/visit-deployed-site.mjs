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
const sources=['index.html','gui112.css','src/main.js','src/first-person.js','src/held-item-view.js','src/gui112-layout.js','menu112.css','src/menu112-assets.js','src/gui112-assets.js','src/menu-panorama.js','src/resource-pack.js','src/atlas.js','src/block-registry.js','src/bitmap-font112.js','src/private-resource-cache.js','src/title-layout112.js','src/menu.js','src/item-extrusion.js','src/block-item-icons.js','src/player-preview112.js','src/item-model112.js','src/site-default112.js','src/player-motion112.js','src/chunk-builder.js','src/voxel-light.js','src/environment.js','src/world-visuals.js','src/bitmap-font112.js','src/vanilla-mining.js','src/break-overlay112.js','visual-overhaul.css'];
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
  const defaultGraphics=await page.evaluate(()=>{
   const root=document.documentElement,button=document.getElementById('menuSingle');
   const s=getComputedStyle(button);
   return {enabled:root.dataset.defaultVisuals==='bundled'&&root.classList.contains('site-default112'),
    hasSprite:s.borderImageSource.includes('data:image/png'),owner:root.classList.contains('gui112-assets'),
    menuLabel:document.getElementById('loadJar112').textContent};
  });
  if(!defaultGraphics.enabled||!defaultGraphics.hasSprite||defaultGraphics.owner)
   throw Error('Public site does not bundle its own menu sprite without a JAR: '+JSON.stringify(defaultGraphics));
  if(!defaultGraphics.menuLabel.includes('선택'))throw Error('Original resource upload must be optional');
  await page.screenshot({path:'site-review/'+label+'-title.png',fullPage:true});
  if(label==='desktop'){
   // The real deployed WebGL code must draw visibly different crack stages.
   const breakFixtureChanged=await page.evaluate(async()=>{
    const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
    const {createBreakOverlay112}=await import('./src/break-overlay112.js');
    const canvas=document.createElement('canvas');
    canvas.id='break-stage-visual-check';canvas.width=canvas.height=176;
    canvas.style.cssText='position:fixed;top:2px;left:2px;width:176px;height:176px;z-index:9999';
    document.body.append(canvas);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:false,preserveDrawingBuffer:true});
    renderer.setSize(176,176,false);
    const scene=new THREE.Scene();scene.background=new THREE.Color('#868686');
    const base=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:'#a5a5a5'}));
    base.position.set(.5,.5,.5);scene.add(base);
    const camera=new THREE.PerspectiveCamera(55,1,.01,30);
    camera.position.set(2,2.1,3.5);camera.lookAt(.5,.5,.5);
    const world={getBlock:(x,y,z)=>({id:x===0&&y===0&&z===0?3:0,state:{}})};
    const cracks=createBreakOverlay112(scene,world);
    cracks.setTarget({x:0,y:0,z:0},.1);renderer.render(scene,camera);
    const first=canvas.toDataURL();
    cracks.setTarget({x:0,y:0,z:0},.9);renderer.render(scene,camera);
    const last=canvas.toDataURL();
    cracks.dispose();renderer.dispose();base.geometry.dispose();base.material.dispose();
    return first!==last;
   });
   if(!breakFixtureChanged)throw Error('The ten 1.12.2 break texture stages render identically in deployed WebGL');
   await page.locator('#break-stage-visual-check').screenshot({path:'site-review/desktop-crack-overlay-stage9.png'});
   await page.evaluate(()=>document.getElementById('break-stage-visual-check')?.remove());
   // Separate browser profile validates persisted world creation and deletion.
   const worldContext=await browser.newContext({viewport,deviceScaleFactor:1,permissions:[]});
   const worldPage=await worldContext.newPage();
   try{
    await worldPage.goto(site,{waitUntil:'domcontentloaded',timeout:60000});
    await worldPage.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
    // Keep this browser smoke focused on creation/deletion rather than
    // rendering 6+ background chunks while testing storage navigation.
    await worldPage.evaluate(()=>localStorage.setItem('voxel-frontier-settings-v1',
      JSON.stringify({fov:75,renderDistance:2,renderDistanceV2:true,sensitivity:.24,showCoordinates:true})));
    await worldPage.locator('#menuSingle').click();
    await worldPage.locator('#worldCreate').click();
    await worldPage.locator('#menu-create').waitFor({state:'visible'});
    await worldPage.locator('#worldName').fill('자동 검사 새 세계');
    await worldPage.screenshot({path:'site-review/world-create-form.png'});
    await worldPage.locator('#createConfirm').click();
    await worldPage.waitForFunction(()=>{
     try{
      const a=JSON.parse(localStorage.getItem('voxel-frontier-worlds-v1')||'[]');
      return a.some(w=>w.name==='자동 검사 새 세계');
     }catch{return false;}
    },{timeout:20000});
    const newId=await worldPage.evaluate(()=>{
     const worlds=JSON.parse(localStorage.getItem('voxel-frontier-worlds-v1'));
     return worlds.find(w=>w.name==='자동 검사 새 세계').id;
    });
    await worldPage.waitForFunction(()=>document.querySelector('#overlay:not(.show)'),null,{timeout:65000});
    await worldPage.screenshot({path:'site-review/world-created-gameplay.png'});
    await worldPage.goto(site,{waitUntil:'domcontentloaded',timeout:60000});
    await worldPage.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
    await worldPage.locator('#menuSingle').click();
    await worldPage.locator('[data-world-id="'+newId+'"]').click();
    await worldPage.locator('#worldDelete').click();
    await worldPage.locator('#menu-delete').waitFor({state:'visible'});
    await worldPage.screenshot({path:'site-review/world-delete-confirmation.png'});
    await worldPage.locator('#deleteConfirm').click();
    await worldPage.locator('#menu-worlds').waitFor({state:'visible'});
    const deleted=await worldPage.evaluate(id=>{
     const worlds=JSON.parse(localStorage.getItem('voxel-frontier-worlds-v1')||'[]');
     return !worlds.some(w=>w.id===id)&&!localStorage.getItem('voxel-frontier-save-v1-'+id);
    },newId);
    if(!deleted)throw Error('World deletion did not persist in browser storage');
    if(await worldPage.locator('#menu-title').isVisible())throw Error('Deleting a world incorrectly returned to title');
    // Beforeunload must not resurrect a just-deleted active world's save.
    await worldPage.reload({waitUntil:'domcontentloaded',timeout:60000});
    await worldPage.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
    const survivedReload=await worldPage.evaluate(id=>{
     const worlds=JSON.parse(localStorage.getItem('voxel-frontier-worlds-v1')||'[]');
     return !worlds.some(w=>w.id===id)&&!localStorage.getItem('voxel-frontier-save-v1-'+id);
    },newId);
    if(!survivedReload)throw Error('Deleted world was resurrected by unload autosave');
    await worldPage.screenshot({path:'site-review/world-after-delete.png'});
   }finally{await worldContext.close();}
  }

  if(!await page.title().then(t=>t.includes('Minecraft 1.12.2')))throw Error('Game title mismatch');
  for(const selector of ['#menuSingle','#menuSettings','#menuExit']){
   const box=await page.locator(selector).boundingBox();
   if(!box||box.x<0||box.y<0||box.x+box.width>viewport.width||box.y+box.height>viewport.height)throw Error('Menu control clipped: '+selector);
  }
  const languageButton=await page.locator('#menuLanguage').boundingBox();
  const optionsButton=await page.locator('#menuSettings').boundingBox();
  if(!languageButton||!optionsButton||Math.abs(languageButton.y-optionsButton.y)>.6||languageButton.x+languageButton.width>optionsButton.x+1)throw Error('Owner language widget not aligned with bottom menu row');
  const titleGeometry=await page.locator('#menuSingle').boundingBox();
  const expectedScale=Math.max(1,Math.min(Math.floor(viewport.width/320),Math.floor(viewport.height/240)));
  if(Math.abs(titleGeometry.width-200*expectedScale)>.5||Math.abs(titleGeometry.height-20*expectedScale)>.5)throw Error('Title button dimensions differ from logical 200x20');
  // Newly installed sites expose a higher user-configurable view distance.
  const viewRange=await page.locator('#settingDistance').evaluate(input=>({min:input.min,max:input.max}));
  if(Number(viewRange.min)>2||Number(viewRange.max)<10)throw Error('Extended render-distance settings unavailable');
  // The 1.12.2-inspired Options menu uses dedicated language/resource/video screens.
  await page.locator('#menuLanguage').click();
  await page.locator('#menuLanguageSelect').waitFor({state:'visible'});
  await page.screenshot({path:'site-review/'+label+'-language.png'});
  await page.locator('#languageDone').click();
  await page.locator('#menu-settings').waitFor({state:'visible'});
  const twoColumnOptions=await page.locator('#settingsVideo').evaluate(button=>{
   const video=button.getBoundingClientRect(),controls=document.getElementById('settingsControls').getBoundingClientRect();
   const grid=getComputedStyle(button.parentElement);
   return {twoColumns:grid.gridTemplateColumns.trim().split(/\s+/).length>=2,videoX:video.x,controlsX:controls.x};
  });
  if(!twoColumnOptions.twoColumns||!(twoColumnOptions.controlsX>twoColumnOptions.videoX))throw Error('1.12.2 Options two-column grid failed');
  await page.screenshot({path:'site-review/'+label+'-options.png'});
  await page.locator('#settingsVideo').click();
  await page.locator('#menu-video').waitFor({state:'visible'});
  await page.locator('#settingDistance').waitFor({state:'visible'});
  await page.screenshot({path:'site-review/'+label+'-video-options.png'});
  await page.locator('#videoDone').click();
  await page.locator('#settingsResources').click();
  await page.locator('#loadJar112').waitFor({state:'visible'});
  await page.screenshot({path:'site-review/'+label+'-resource-options.png'});
  await page.locator('#resourcesDone').click();
  await page.locator('#settingsSave').click();
  // An original transparent texel must replace, not overlay, generated fallback art.
  await page.evaluate(async()=>{
   const {loadLocalResourcePack}=await import('./src/resource-pack.js?v=1.2');
   const c=document.createElement('canvas');c.width=c.height=16;
   const bytes=new Uint8Array(await (await fetch(c.toDataURL())).arrayBuffer());
   const previous=window.JSZip;
   try{
    const entry={async:async()=>bytes};
    window.JSZip={loadAsync:async()=>({files:{'assets/minecraft/textures/blocks/glass.png':entry,'assets/minecraft/textures/blocks/furnace_side.png':entry},file:path=>path.endsWith('/glass.png')||path.endsWith('/furnace_side.png')?entry:null})};
    const result=await loadLocalResourcePack(new Blob(['fixture']));
    const atlas=result.canvas.getContext('2d');
    if(atlas.getImageData(7*16,16,1,1).data[3]!==0)throw Error('Original transparent glass retains fallback pixels');
    if(atlas.getImageData(4*16,4*16,1,1).data[3]!==0)throw Error('Transparent extra-face tile retains fallback pixels');
   }finally{window.JSZip=previous;}
  });
  // Synthetic PNGs validate the local resource rendering path without uploading
  // the owner's JAR or copyrighted image bytes to Actions.
  const ownerMenu=await page.evaluate(async()=>{
   const {MENU112_FILES,applyMenu112}=await import('./src/menu112-assets.js');
   const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#6789ab';ctx.fillRect(0,0,256,256);
   const assets=Object.fromEntries(Object.keys(MENU112_FILES).map(k=>[k,c.toDataURL()]));
   await applyMenu112(assets);
   // Import a synthetic widgets.png through the same owner-GUI activation
   // path; this checks the language sprite instead of the placeholder emoji.
   const {applyGui112}=await import('./src/gui112-assets.js?v=1.8');
   applyGui112(document.documentElement,{widgets:c.toDataURL(),icons:c.toDataURL(),inventory:c.toDataURL(),crafting:c.toDataURL()});
   const langBg=getComputedStyle(document.getElementById('menuLanguage')).backgroundImage;
   if(!langBg.includes('data:image/png'))throw Error('Owner 1.12.2 language icon not using widgets texture');
   const logo=document.getElementById('originalTitle112').getBoundingClientRect();
   const ok=document.documentElement.classList.contains('menu112-assets')&&logo.width>0&&logo.right<=innerWidth;
   return ok;
  });
  if(!ownerMenu)throw Error('Owner menu resources did not render');
  // Record the synthetic owner-resource rendering instead of only a no-JAR title.
  await page.screenshot({path:'site-review/'+label+'-synthetic-owner-title.png'});
  await page.evaluate(()=>{
   document.documentElement.classList.remove('menu112-assets','gui112-assets');
   document.getElementById('menuPanorama').dispatchEvent(new CustomEvent('owner-panorama',{detail:null}));
  });
  // Exercise the owner-model path with independently authored block geometry.
  const ownerBlockModelFixture=await page.evaluate(async()=>{
   const {renderBlockItemIcons}=await import('./src/block-item-icons.js');
   const canvas=document.createElement('canvas');canvas.width=128;canvas.height=96;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#947d67';ctx.fillRect(0,0,128,96);
   const fromFallback=renderBlockItemIcons(canvas)[16];
   const fromModel=renderBlockItemIcons(canvas,{},{
    16:[{from:[0,0,0],to:[16,8,16],faces:{
      south:{tile:6,uv:[0,8,16,16],rotation:0},
      up:{tile:6,uv:[0,0,16,16],rotation:0}
    }}]
   })[16];
   const image=document.createElement('img');image.id='ownerBlockModelFixture';
   Object.assign(image.style,{position:'fixed',top:'0px',left:'0px',width:'64px',height:'64px',imageRendering:'pixelated',zIndex:'9999'});
   image.src=fromModel;document.body.append(image);
   return fromModel!==fromFallback;
  });
  if(!ownerBlockModelFixture)throw Error('Owner block JSON geometry did not replace procedural item geometry');
  await page.locator('#ownerBlockModelFixture').screenshot({path:'site-review/'+label+'-synthetic-block-model.png'});
  await page.evaluate(()=>document.getElementById('ownerBlockModelFixture')?.remove());
  // The menu navigation is installed by main.js, so this tests code executed, not only static HTML.
  await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
  await page.locator('#menuSingle').click({timeout:30000});
  await page.locator('#menu-worlds').waitFor({state:'visible',timeout:30000});
  for(const id of ['worldPlay','worldCreate','worldEdit','worldDelete','worldRecreate','worldBack'])
   await page.locator('#'+id).waitFor({state:'visible'});
  const footer=await page.evaluate(()=>{
   const play=document.getElementById('worldPlay').getBoundingClientRect();
   const create=document.getElementById('worldCreate').getBoundingClientRect();
   const edit=document.getElementById('worldEdit').getBoundingClientRect();
   const cancel=document.getElementById('worldBack').getBoundingClientRect();
   const list=document.getElementById('worldList').getBoundingClientRect();
   return {aligned:Math.abs(play.y-create.y)<1&&Math.abs(edit.y-cancel.y)<1,
    secondBelow:edit.y>play.y,listAbove:list.bottom<=play.top+1};
  });
  if(!footer.aligned||!footer.secondBelow||!footer.listAbove)throw Error('1.12.2 six-button world selection layout failed: '+JSON.stringify(footer));
  await page.screenshot({path:'site-review/'+label+'-worlds.png'});
  await page.locator('#worldEdit').click();
  await page.locator('#menu-edit').waitFor({state:'visible'});
  await page.locator('#worldEditName').waitFor({state:'visible'});
  await page.screenshot({path:'site-review/'+label+'-world-edit.png'});
  await page.locator('#worldEditBack').click();
  await page.locator('#worldRecreate').click();
  await page.locator('#menu-create').waitFor({state:'visible'});
  await page.locator('#createBack').click();
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
  const slotSprite=await page.evaluate(()=>{
   const root=document.documentElement;root.classList.add('gui112-assets');
   const slot=document.querySelector('#invItems button');slot.blur();
   const result={background:getComputedStyle(slot).backgroundColor,shadow:getComputedStyle(slot).boxShadow};root.classList.remove('gui112-assets');return result;
  });
  if(slotSprite.background!=='rgba(0, 0, 0, 0)'||slotSprite.shadow!=='none')throw Error('CSS still covers original inventory slot sprite');
  const iconApplied=await page.locator('#invItems .tileIcon').first().evaluate(el=>el.classList.contains('owner-item-icon')&&el.style.backgroundImage.includes('data:image/png'));
  if(!iconApplied)throw Error('Block inventory icon was not rendered from the model');

  await page.locator('#closeInventory').click();
  await page.locator('#inventory').waitFor({state:'hidden'});
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',key:'e',bubbles:true})));
  await page.locator('#inventory').waitFor({state:'visible'});
  if(await page.locator('#hotbar').evaluate(el=>getComputedStyle(el).display)!=='none')throw Error('HUD visible after reopening inventory');
  // Synthetic pixels exercise the same WebGL hand/item renderer without publishing owner art.
  await page.evaluate(async()=>{
   const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
   const {createFirstPerson}=await import('./src/first-person.js?v=1.7');
   const renderer=new THREE.WebGLRenderer({alpha:false,preserveDrawingBuffer:true});renderer.setSize(320,240);renderer.setClearColor('#9cc6df');
   renderer.domElement.id='modelFixture';Object.assign(renderer.domElement.style,{position:'fixed',top:'0',left:'0',zIndex:'9999'});document.body.append(renderer.domElement);
   const c=document.createElement('canvas');c.width=c.height=16;const ctx=c.getContext('2d');ctx.fillStyle='#88552a';ctx.fillRect(7,4,2,11);ctx.fillStyle='#35c8cf';ctx.fillRect(2,2,12,3);
   const model=createFirstPerson(renderer,new THREE.CanvasTexture(c));await model.setOwnerItems({110:c.toDataURL()});model.setItem(110);renderer.clear();model.render(320,240);
   if(renderer.info.render.triangles<=12)throw Error('Extruded item side geometry missing');
   window.fixtureModel={model,renderer,c};
  });
  await page.locator('#modelFixture').screenshot({path:'site-review/'+label+'-synthetic-item.png'});
  // The first-person model must retain non-cube geometry and a hand.
  await page.evaluate(()=>{
   const {model,renderer}=window.fixtureModel;
   model.setItem(1);renderer.clear();model.render(320,240);
   const cubeTriangles=renderer.info.render.triangles;
   model.setItem(16);renderer.clear();model.render(320,240);
   const stairsTriangles=renderer.info.render.triangles;
   if(stairsTriangles<=cubeTriangles)throw Error('Held stair still renders as a cube: '+JSON.stringify({stairsTriangles,cubeTriangles}));
  });
  await page.locator('#modelFixture').screenshot({path:'site-review/'+label+'-synthetic-held-stairs.png'});
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
   c.width=c.height=64;
   const skinCtx=c.getContext('2d');
   skinCtx.fillStyle='#f3a04f';skinCtx.fillRect(0,0,64,64);
   skinCtx.fillStyle='#2579d3';skinCtx.fillRect(16,16,40,16);
   skinCtx.fillStyle='#59351c';skinCtx.fillRect(0,0,32,16);
   assets.playerSkin=c.toDataURL();
   c.width=128;c.height=96;
   if(!await writePrivateResources({version:PRIVATE_RESOURCE_VERSION,assets,atlas:c.toDataURL()}))throw Error('Private cache write failed');
  });
  await page.reload();
  await page.waitForFunction(()=>document.getElementById('packStatus')?.textContent.includes('자동 불러오기 완료'));
  await page.waitForFunction(()=>document.documentElement.classList.contains('menu112-assets')&&document.documentElement.classList.contains('gui112-assets'));
  await page.locator('#menu-title .menu-stack > button:nth-child(3) canvas.bitmap-text').waitFor({state:'attached'});
  await page.locator('#menuSingle').click();
  await page.locator('#menu-worlds').waitFor({state:'visible'});
  const originalWorldDirt=await page.locator('#menu-worlds').evaluate(page=>getComputedStyle(page).backgroundImage);
  if(!originalWorldDirt.includes('data:image/png'))throw Error('Owner JAR menu dirt texture missing on world select');
  await page.screenshot({path:'site-review/'+label+'-synthetic-owner-worlds.png'});
  await page.locator('#worldBack').click();
  await page.locator('#menuSettings').click();
  await page.locator('#menu-settings').waitFor({state:'visible'});
  await page.screenshot({path:'site-review/'+label+'-synthetic-owner-options.png'});
  await page.locator('#settingsSave').click();
  const korean=await page.locator('#menuSingle').evaluate(button=>({
   value:button.textContent.trim(),
   hidden:button.classList.contains('bitmap-label'),
   stale:!!button.querySelector('canvas.bitmap-text'),
   css:getComputedStyle(button).color
  }));
  if(korean.value!=='싱글플레이'||korean.hidden||korean.stale||korean.css==='rgba(0, 0, 0, 0)')
   throw Error('Korean label corrupted after original bitmap font load: '+JSON.stringify(korean));
  const ownerButtonBg=await page.locator('#menuSingle').evaluate(button=>getComputedStyle(button,'::before').backgroundImage);
  if(!ownerButtonBg.includes('data:image/png'))throw Error('Owner JAR button texture not applied');
  await page.locator('#menuSingle').click();
  await page.locator('#worldPlay').click();
  await page.waitForTimeout(1000);
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',key:'e',bubbles:true})));
  await page.locator('#inventory').waitFor({state:'visible',timeout:12000});
  await page.locator('#ownerPlayerPreview112.owner-preview-ready').waitFor({state:'visible',timeout:12000});
  const preview=await page.locator('#ownerPlayerPreview112').boundingBox();
  const panel=await page.locator('#inventory').boundingBox();
  if(!preview||!panel||preview.x<panel.x||preview.y<panel.y||preview.x+preview.width>panel.x+panel.width||preview.y+preview.height>panel.y+panel.height)throw Error('Owner skin preview outside inventory panel');
  // WebGL canvas.toDataURL may read an empty back buffer even when Chromium
  // visibly composites the avatar. Inspect actual screenshot pixels instead.
  const avatarCapture=(await page.locator('#ownerPlayerPreview112').screenshot()).toString('base64');
  const paintedPixels=await page.evaluate(async encoded=>{
   const image=new Image();image.src='data:image/png;base64,'+encoded;
   await image.decode();
   const copy=document.createElement('canvas');copy.width=image.width;copy.height=image.height;
   const ctx=copy.getContext('2d');ctx.drawImage(image,0,0);
   const rgba=ctx.getImageData(0,0,copy.width,copy.height).data;
   let colored=0;
   for(let i=0;i<rgba.length;i+=4){
    const r=rgba[i],g=rgba[i+1],b=rgba[i+2],a=rgba[i+3];
    // Detect the orange or blue independently authored fixture skin,
    // not the all-black synthetic GUI background behind the canvas.
    if(a>64&&((r>165&&g>60&&g<190&&b<145)||(b>120&&b>r*1.25&&b>g*1.1)))colored++;
   }
   return colored;
  },avatarCapture);
  if(paintedPixels<25)throw Error('Synthetic owner skin is not visibly rendered in the browser screenshot: '+paintedPixels);
  await page.screenshot({path:'site-review/'+label+'-synthetic-owner-inventory.png'});
  console.log(JSON.stringify({label,automaticResourceRestore:'ok',menu:'ok',worlds:'ok',ownerGuiCSS:result,inventory:'ok',ownerSkinPreview:'ok'}));
 }catch(e){failures.push(label+': '+e.message);await page.screenshot({path:'site-review/'+label+'-failure.png'}).catch(()=>{});}
 finally{await context.close();}
}
await review({width:1440,height:900},'desktop');
await review({width:390,height:844},'mobile',true);
await review({width:844,height:390},'mobile-landscape',true);
await browser.close();
if(failures.length){for(const f of failures)console.error(f);process.exitCode=1;}
