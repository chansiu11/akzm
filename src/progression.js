// Independent, lightweight progress statistics; not copied achievements or save format.
export const GOALS=Object.freeze([
 {id:'first_block',label:'첫 채굴',stat:'mined',goal:1},
 {id:'builder',label:'블록 20개 설치',stat:'placed',goal:20},
 {id:'maker',label:'첫 제작',stat:'crafted',goal:1},
 {id:'explorer',label:'500블록 이동',stat:'walked',goal:500},
 {id:'encounter',label:'첫 생물 공격',stat:'entityHits',goal:1},
 // Early 1.8.9-style achievement dependency chain; the full tree remains future work.
 {id:'taking_inventory',label:'인벤토리 열기',stat:'openedInventory',goal:1},
 {id:'getting_wood',label:'나무 획득',stat:'woodMined',goal:1,requires:'taking_inventory'},
 {id:'benchmarking',label:'제작대 만들기',stat:'craftedTable',goal:1,requires:'getting_wood'},
 {id:'time_to_mine',label:'곡괭이 만들기',stat:'craftedPickaxe',goal:1,requires:'benchmarking'}
]);
const stats=['mined','placed','crafted','walked','entityHits','openedInventory','woodMined','craftedTable','craftedPickaxe'];
export class Progression{
 constructor(saved={}){this.stats=Object.fromEntries(stats.map(key=>[key,Number.isFinite(saved?.stats?.[key])?Math.max(0,saved.stats[key]):0]));this.unlocked=new Set(Array.isArray(saved?.unlocked)?saved.unlocked.filter(id=>GOALS.some(x=>x.id===id)):[]);}
 add(stat,count=1){if(!stats.includes(stat)||!Number.isFinite(count)||count<=0)return [];
  this.stats[stat]+=count;const unlocked=[];let changed=true;
  while(changed){changed=false;for(const g of GOALS){
   if(this.unlocked.has(g.id)||this.stats[g.stat]<g.goal||(g.requires&&!this.unlocked.has(g.requires)))continue;
   this.unlocked.add(g.id);unlocked.push(g);changed=true;
  }}
  return unlocked;
 }
 serialize(){return {stats:{...this.stats},unlocked:[...this.unlocked]};}
}
