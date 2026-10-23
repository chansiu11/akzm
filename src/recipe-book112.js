// Implemented recipes shown as item slots. Original artwork stays browser-local.
export function recipeBookEntries(recipes,size,query=''){
 const search=String(query).trim().toLocaleLowerCase();
 return recipes.filter(r=>(size===3||!r.requiresTable)&&(!search||`${r.name} ${r.id}`.toLocaleLowerCase().includes(search)));
}
export function installRecipeBook112(root,recipes,getSize,{paint,onSelect}={}){
 const toggle=document.createElement('button');toggle.id='recipeBookToggle';toggle.type='button';toggle.title='제작법';toggle.setAttribute('aria-label','제작법');toggle.setAttribute('aria-expanded','false');
 const panel=document.createElement('section');panel.id='recipeBook112';panel.hidden=true;panel.setAttribute('aria-label','구현된 제작법');
 const search=document.createElement('input');search.type='search';search.placeholder='검색';search.setAttribute('aria-label','제작법 검색');
 const list=document.createElement('div');list.className='recipe-grid112';
 const prev=document.createElement('button'),next=document.createElement('button'),count=document.createElement('span');
 prev.textContent='◀';next.textContent='▶';prev.setAttribute('aria-label','이전 제작법');next.setAttribute('aria-label','다음 제작법');prev.className='recipe-prev112';next.className='recipe-next112';count.className='recipe-page112';let page=0;
 function render(){const entries=recipeBookEntries(recipes,getSize(),search.value),pages=Math.max(1,Math.ceil(entries.length/20));page=Math.min(page,pages-1);list.replaceChildren();
  for(const r of entries.slice(page*20,page*20+20)){const b=document.createElement('button');b.type='button';b.className='recipe-item112';b.setAttribute('aria-label',r.name);if(paint)paint(b,{id:r.output.id,count:1});else b.textContent=r.name;b.title=r.name;b.addEventListener('click',()=>onSelect?.(r));list.append(b);}
  count.textContent=`${page+1}/${pages}`;prev.hidden=next.hidden=count.hidden=pages<=1;prev.disabled=page===0;next.disabled=page===pages-1;
 }
 function place(){const scale=Number(getComputedStyle(root).getPropertyValue('--gui-scale'))||1;root.classList.toggle('recipe-narrow',innerWidth<379*scale);root.classList.toggle('recipe-open',!panel.hidden);}
 prev.addEventListener('click',()=>{page--;render();});next.addEventListener('click',()=>{page++;render();});search.addEventListener('input',()=>{page=0;render();});
 window.addEventListener('resize',place);toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;place();toggle.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)render();});
 panel.append(search,list,prev,count,next);root.append(toggle,panel);
 return {refresh:render,setNames(){},close(){panel.hidden=true;place();toggle.setAttribute('aria-expanded','false');}};
}
