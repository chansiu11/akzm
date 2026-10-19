import {tryConstructMob} from './mobs.js';
import {equip} from './equipment.js';
import {furnaceAction,collectStack} from './furnaces.js';
import {add,take,item,parse,craft,eat,moveStack,stepSmelt} from './survival.js';
import {blockItems,itemToBlock,dropFor,needsPick,toolTier,harvestable} from './items.js';
import {valid,index} from './world.js';
export function miningTime(b,k,creative){if(creative)return 0;if([20,45,46,47,54].includes(b))return Infinity;const name=item(k)?.name||'',pick=toolTier(k),wood=[5,6,23,24,26].includes(b),dirt=[1,2,8,19,37].includes(b);let base=needsPick.has(b)?1.5:wood?1:dirt?.6:.35;if(b===17)base=9;if(pick&&needsPick.has(b))base/=pick*1.2;if(wood&&name.endsWith('_axe'))base/=3;if(dirt&&name.endsWith('_shovel'))base/=3;return Math.max(.12,base);}
export function applyAction(state,a,ctx){
 const fail=s=>{throw Error(s)},near=(p,range=7)=>Array.isArray(p)&&valid(...p)&&Math.hypot(ctx.pos[0]-p[0],ctx.pos[1]-p[1],ctx.pos[2]-p[2])<=range;
 if(a.selected!==undefined){if(!Number.isInteger(a.selected)||a.selected<0||a.selected>8)fail('잘못된 슬롯');state.selected=a.selected;}
 if(state.hp<=0&&a.kind!=='respawn')fail('먼저 리스폰하세요.');
 const held=()=>state.slots[state.selected];
 switch(a.kind){
 case 'select':break;
 case 'equip':equip(state,a.from,a.slot);break;
 case 'furnace':furnaceAction(state,a,ctx);break;
 case 'moveStack':moveStack(state,a.from,a.to,!!a.split);break;
 case 'creative':{if(state.mode!=='creative')fail('크리에이티브 모드에서만 가능합니다.');if(!item(a.key))fail('없는 아이템');state.slots[state.selected]={key:a.key,count:item(a.key).stackSize||64};break;}
 case 'craft':if(a.width===3&&(!near(a.at)||ctx.get(...a.at)!==23))fail('작업대 가까이에서 사용하세요.');craft(state,a.indices,a.width);break;
 case 'eat':eat(state,state.selected);break;
 case 'drop':take(state.slots,state.selected,a.all?held()?.count||1:1);break;
 case 'startMine':{if(!near(a.at)||a.at[1]===0)fail('채굴할 수 없는 위치');const b=ctx.get(...a.at);state.mining={at:a.at,block:b,started:ctx.now};break;}
 case 'mine':{if(!near(a.at)||a.at[1]===0)fail('채굴할 수 없는 위치');const b=ctx.get(...a.at),k=held()?.key,ms=miningTime(b,k,state.mode==='creative')*1000;if(!b||b===21)break;if(state.mode!=='creative'&&(!state.mining||state.mining.at.join(',')!==a.at.join(',')||state.mining.block!==b||ctx.now-state.mining.started<ms-70))fail('채굴이 완료되지 않았습니다.');const container=b===26?ctx.chests?.[a.at.join(',')]:b===25?ctx.furnaces?.[a.at.join(',')]?.slots:null;if(container?.some(Boolean))fail('내용물을 먼저 꺼내세요.');const drop=dropFor(b);if(state.mode!=='creative'&&drop&&harvestable(b,k)){const next=structuredClone(state.slots);if(add(next,drop,b===31?4:b===33?5:b===42?4:1))fail('인벤토리가 가득 찼습니다.');state.slots=next;if(b>=27&&b<=33)state.xp++;}if(b===26)ctx.chests[a.at.join(',')]=Array(27).fill(null);if(b===25&&ctx.furnaces)delete ctx.furnaces[a.at.join(',')];ctx.set(...a.at,0);state.mining=null;state.stats.mined++;if(state.mode!=='creative')wear(state);break;}
 case 'place':{if(!near(a.at)||a.at[1]===0)fail('설치할 수 없는 위치');const k=held()?.key,b=itemToBlock.get(k);if(!b||b===20&&state.mode!=='creative')fail('설치 가능한 블록이 아닙니다.');if(ctx.get(...a.at)&&ctx.get(...a.at)!==21)fail('이미 블록이 있습니다.');if(Math.abs(a.at[0]+.5-ctx.pos[0])<.8&&Math.abs(a.at[2]+.5-ctx.pos[2])<.8&&a.at[1]+1>ctx.pos[1]-1.65&&a.at[1]<ctx.pos[1]+.15)fail('플레이어 위치에 설치할 수 없습니다.');if(state.mode!=='creative')take(state.slots,state.selected);ctx.set(...a.at,b);tryConstructMob(ctx,a.at,b);state.stats.placed++;break;}
 case 'chest':{if(!near(a.at)||ctx.get(...a.at)!==26)fail('상자 가까이에서 사용하세요.');const id=a.at.join(','),slots=ctx.chests[id]??=Array(27).fill(null);if(!Number.isInteger(a.slot)||a.slot<0||a.slot>=27)fail('잘못된 상자 슬롯');if(a.direction==='in'){const v=state.slots[state.selected];if(!v)break;const target=slots[a.slot];if(!target){slots[a.slot]={...v};state.slots[state.selected]=null;}else if(target.key===v.key){const n=Math.min(v.count,(item(v.key).stackSize||64)-target.count);if(n>0){target.count+=n;take(state.slots,state.selected,n);}}}else{const v=slots[a.slot];if(v){collectStack(slots,a.slot,state.slots);}}break;}
 case 'respawn':state.hp=20;state.hunger=20;state.air=300;state.fallTop=null;state.stats.deaths++;break;
 default:fail('지원하지 않는 동작');
 }
 return state;
}
export function wear(state){const s=state.slots[state.selected],d=s&&item(s.key);if(!d?.maxDurability)return;s.wear=(s.wear||0)+1;if(s.wear>=d.maxDurability)state.slots[state.selected]=null;}
export function tickSurvival(state,dt,moving=false){if(state.poison>0){state.poison=Math.max(0,state.poison-dt);state.poisonTick=(state.poisonTick||0)+dt;if(state.poisonTick>=1){state.poisonTick-=1;state.hp=Math.max(1,state.hp-1);}}stepSmelt(state,dt);if(state.mode!=='survival'||state.hp<=0)return;state.foodTimer=(state.foodTimer||0)+dt*(moving?1:0.2);if(state.foodTimer>=45){state.foodTimer-=45;state.hunger=Math.max(0,state.hunger-1);}state.regenTimer=(state.regenTimer||0)+dt;if(state.regenTimer>=4){state.regenTimer=0;if(state.hunger>=18&&state.hp<20){state.hp++;state.hunger=Math.max(0,state.hunger-.5);}else if(state.hunger===0)state.hp=Math.max(1,state.hp-1);}}
