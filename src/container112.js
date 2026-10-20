// Logical GUI coordinates; original artwork is loaded only from the owner's browser.
export function containerLayout112(kind='inventory'){
 if(!['inventory','crafting','chest','furnace'].includes(kind))throw new RangeError('Unknown container');
 const chest=kind==='chest';
 const slots=Array.from({length:36},(_,i)=>({index:i,x:8+(i%9)*18,y:i<9?(chest?200:142):(chest?142:84)+Math.floor((i-9)/9)*18}));
 // A single chest uses the top 71 rows plus the bottom 96 rows of generic_54.
 if(chest)for(const slot of slots)slot.y-=54;
 const size=kind==='crafting'?3:2;
 const craft=Array.from({length:size*size},(_,i)=>({x:(size===3?30:98)+(i%size)*18,y:18+Math.floor(i/size)*18}));
 return {kind,width:176,height:chest?168:166,slots,craft,
 output:kind==='crafting'?{x:124,y:35}:{x:154,y:28},
 chest:Array.from({length:27},(_,i)=>({x:8+i%9*18,y:18+Math.floor(i/9)*18})),
 furnace:{input:{x:56,y:17},fuel:{x:56,y:53},output:{x:116,y:35}}};
}
function position(node,p){if(!node||!p)return;node.style.setProperty('--slot-x',p.x);node.style.setProperty('--slot-y',p.y);node.classList.add('container-slot');}
export function layoutContainer112(root){
 if(!root?.dataset?.container)return;
 const layout=containerLayout112(root.dataset.container);
 root.style.setProperty('--container-height',layout.height);
 root.querySelectorAll('#invItems [data-i]').forEach(node=>position(node,layout.slots[Number(node.dataset.i)]));
 root.querySelectorAll('#craftGrid button').forEach((node,i)=>position(node,layout.craft[i]));
 position(root.querySelector('#craftOutput'),layout.output);
 root.querySelectorAll('#tileContents button').forEach((node,i)=>position(node,layout.kind==='chest'?layout.chest[i]:layout.furnace[node.dataset.furnaceSlot]));
 const title=root.querySelector('.inventory-head strong');if(title)title.textContent={inventory:'제작',crafting:'제작',chest:'상자',furnace:'화로'}[layout.kind];
}
