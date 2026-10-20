// Fresh, independently designed pixel HUD. Not based on any proprietary sprite sheet.
const clamp=(value,max)=>Math.max(0,Math.min(max,Number(value)||0));
export function vitalsModel(health,hunger,air=300){
 const healthValue=clamp(health,20),foodValue=clamp(hunger,20);
 return {hearts:Array.from({length:10},(_,i)=>clamp(healthValue-i*2,2)/2),
  food:Array.from({length:10},(_,i)=>clamp(foodValue-i*2,2)/2),
  bubbles:air>=300?[]:Array.from({length:10},(_,i)=>clamp(air/30-i,1))};
}
function icon(type,fill){
 const s=document.createElement('span');s.className=`pixel-vital ${type}`+(fill===0?' empty':'');
 s.style.setProperty('--fill',`${fill*100}%`);s.dataset.fill=String(fill);s.setAttribute('aria-hidden','true');return s;
}
export function createHud(element){
 if(!element)return {update(){}};
 const healthRow=document.createElement('div'),foodRow=document.createElement('div'),airRow=document.createElement('div');
 healthRow.className='vital-hearts';foodRow.className='vital-food';airRow.className='vital-air';
 const top=document.createElement('div');top.className='vitals-top';top.append(healthRow,foodRow);
 const track=document.createElement('div');track.className='pixel-xp-track';const fill=document.createElement('div');fill.className='pixel-xp-fill';track.append(fill);
 element.replaceChildren(top,airRow,track);
 let previous='';
 return {update(health,hunger,air=300,xp=0){
  const state=vitalsModel(health,hunger,air),key=JSON.stringify([state,xp]);if(key===previous)return;previous=key;
  healthRow.replaceChildren(...state.hearts.map(v=>icon('heart',v)));
  foodRow.replaceChildren(...state.food.map(v=>icon('food',v)).reverse());
  airRow.replaceChildren(...state.bubbles.map(v=>icon('bubble',v)));
  fill.style.width=`${clamp(xp,1)*100}%`;
  element.setAttribute('aria-label',`체력 ${health} / 20, 허기 ${hunger} / 20${air<300?`, 산소 ${Math.ceil(air/30)} / 10`:''}`);
 }};
}
export function mineProgress(el,ratio,label=''){
 if(!el)return;const progress=clamp(ratio,1);
 el.classList.toggle('visible',progress>0);el.style.setProperty('--break-progress',`${Math.round(progress*100)}%`);
 el.setAttribute('aria-label',progress>0?`${label} 파괴 ${Math.round(progress*100)}%`:'');
}
