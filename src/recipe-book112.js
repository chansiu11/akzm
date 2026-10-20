// This recipe guide covers implemented recipes, not the vanilla unlock database.
export function recipeBookEntries(recipes,size,query=''){
 const search=String(query).trim().toLocaleLowerCase();
 return recipes.filter(r=>(size===3||!r.requiresTable)&&(!search||`${r.name} ${r.id}`.toLocaleLowerCase().includes(search)));
}
export function installRecipeBook112(root,recipes,getSize){
 const toggle=document.createElement('button');toggle.id='recipeBookToggle';toggle.type='button';toggle.textContent='▤';toggle.title='제작법';toggle.setAttribute('aria-expanded','false');
 const panel=document.createElement('section');panel.id='recipeBook112';panel.hidden=true;panel.setAttribute('aria-label','구현된 제작법');
 const search=document.createElement('input');search.type='search';search.placeholder='검색';search.setAttribute('aria-label','제작법 검색');
 const list=document.createElement('div'),preview=document.createElement('div'),note=document.createElement('small');note.textContent='구현된 제작법 · 재료는 직접 배치';panel.append(search,list,preview,note);root.append(toggle,panel);
 function render(){list.replaceChildren();preview.replaceChildren();for(const r of recipeBookEntries(recipes,getSize(),search.value)){const b=document.createElement('button');b.type='button';b.textContent=r.name;b.addEventListener('click',()=>{preview.replaceChildren();const title=document.createElement('div');title.textContent=`${r.name} ×${r.output.count}`;preview.append(title);const pattern=document.createElement('pre');pattern.textContent=r.pattern.map(row=>[...row].map(c=>c===' '?'·':c).join(' ')).join('\n');preview.append(pattern);const legend=document.createElement('div');legend.textContent=Object.entries(r.keys).map(([symbol,id])=>`${symbol}: ${names.get(id)??id}`).join(' / ');preview.append(legend);});list.append(b);}}
 const names=new Map();
 toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){render();search.focus();}});
 search.addEventListener('input',render);
 return {refresh:render,setNames(entries){for(const [id,name] of entries)names.set(id,name);},close(){panel.hidden=true;toggle.setAttribute('aria-expanded','false');}};
}
