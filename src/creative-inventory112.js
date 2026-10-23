// Independent 195 x 136 logical-pixel creative inventory. Artwork stays local.
export function installCreativeInventory112(root,items,{paint,choose,selectHotbar,inventory}){
 const panel=document.createElement('section');panel.id='creativeInventory112';panel.hidden=true;panel.setAttribute('aria-label','크리에이티브 인벤토리');
 const tabs=document.createElement('div');tabs.className='creative-tabs112';
 const title=document.createElement('strong');title.className='creative-title112';
 const search=document.createElement('input');search.type='search';search.placeholder='검색';search.setAttribute('aria-label','아이템 검색');
 const grid=document.createElement('div');grid.className='creative-grid112';
 const bar=document.createElement('div');bar.className='creative-hotbar112';
 const scroll=document.createElement('input');scroll.type='range';scroll.min='0';scroll.step='1';scroll.value='0';scroll.setAttribute('aria-label','아이템 목록 스크롤');scroll.className='creative-scroll112';
 const groups=[['blocks','건축 블록',3],['decor','장식 블록',6],['redstone','레드스톤',31],['items','아이템',110],['search','아이템 검색',17]];
 let group='blocks',row=0;
 function filtered(){return items.filter(i=>{
  if(group==='search')return `${i.name} ${i.key}`.toLowerCase().includes(search.value.toLowerCase());
  if(group==='items')return i.blockId===null;
  if(group==='redstone')return [31,32,27].includes(i.blockId);
  if(group==='decor')return [6,14,17,25,29,30].includes(i.blockId);
  return i.blockId!==null;
 });}
 function refresh(){
  panel.dataset.tab=group;title.textContent=groups.find(g=>g[0]===group)[1];search.hidden=group!=='search';title.hidden=group==='search';
  const list=filtered(),max=Math.max(0,Math.ceil(list.length/9)-5);row=Math.min(row,max);scroll.max=String(max);scroll.value=String(row);scroll.disabled=max===0;
  grid.replaceChildren();for(let n=0;n<45;n++){const item=list[row*9+n],b=document.createElement('button');b.type='button';b.className='creative-slot112';paint(b,item?{id:item.id,count:1}:{id:0,count:0});b.setAttribute('aria-label',item?.name??'빈칸');b.disabled=!item;b.addEventListener('click',()=>{choose(item.id);refresh();});grid.append(b);}
  bar.replaceChildren();inventory().slice(0,9).forEach((item,i)=>{const b=document.createElement('button');b.type='button';b.className='creative-slot112';paint(b,item);b.addEventListener('click',()=>selectHotbar(i));bar.append(b);});
  for(const b of tabs.children)b.setAttribute('aria-selected',String(b.dataset.tab===group));
 }
 for(const [id,label,icon] of groups){const b=document.createElement('button');b.type='button';b.dataset.tab=id;b.title=label;b.setAttribute('aria-label',label);paint(b,{id:icon,count:1});b.addEventListener('click',()=>{group=id;row=0;refresh();if(id==='search')search.focus();});tabs.append(b);}
 search.addEventListener('input',()=>{row=0;refresh();});scroll.addEventListener('input',()=>{row=Number(scroll.value);refresh();});
 grid.addEventListener('wheel',e=>{e.preventDefault();row=Math.max(0,row+(e.deltaY>0?1:-1));refresh();},{passive:false});
 panel.append(tabs,title,search,grid,bar,scroll);root.append(panel);
 return {show(active){panel.hidden=!active;root.classList.toggle('creative-container112',active);if(active)refresh();},refresh(){if(!panel.hidden)refresh();}};
}
