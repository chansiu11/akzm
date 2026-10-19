export const SIZE=64, HEIGHT=40;
export const BLOCKS=[['공기','#ffffff'],['잔디','#69a544'],['흙','#806044'],['돌','#85858a'],['조약돌','#676b70'],['참나무 판자','#bc945a'],['원목','#795735'],['나뭇잎','#367d38'],['모래','#dfd094'],['유리','#acd8dd'],['벽돌','#ab5949'],['석재 벽돌','#81838a'],['흰 양털','#e5e5df'],['빨간 양털','#b63c39'],['파란 양털','#4056a1'],['금 블록','#e8ca48'],['다이아몬드 블록','#51cbbf'],['흑요석','#292036'],['발광석','#e1b963'],['눈','#f1f5f7'],['기반암','#36363b'],['물','#428bb7'],['TNT','#c65739'],['작업대','#9a703e'],['책장','#8d7951'],['화로','#777777'],['상자','#ae7c36'],['석탄 광석','#858585'],['철광석','#9a8b7c'],['금광석','#b5a278'],['다이아몬드 광석','#75a6a2'],['레드스톤 광석','#9c6666'],['에메랄드 광석','#73a67b'],['청금석 광석','#6a7eaa'],['철 블록','#d6d6d2'],['사암','#d6c58b'],['네더랙','#874340'],['영혼 모래','#63503d'],['엔드 돌','#e0dfa7'],['네더 벽돌','#472b2d'],['석영 블록','#e6e0d2'],['석탄 블록','#303033'],['수박','#7b9c31'],['호박','#c78527']];
export function hashSeed(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function noise(x,z,s){let h=Math.imul(x+374761393,668265263)^Math.imul(z+1274126177,2246822519)^s;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
export const index=(x,y,z)=>x+SIZE*(z+SIZE*y);
export function valid(x,y,z){return [x,y,z].every(Number.isInteger)&&x>=0&&z>=0&&y>=0&&x<SIZE&&z<SIZE&&y<HEIGHT;}
export function generate(seed,flat=false){const a=new Uint8Array(SIZE*SIZE*HEIGHT),s=hashSeed(seed);const put=(x,y,z,b)=>{if(valid(x,y,z))a[index(x,y,z)]=b;};for(let x=0;x<SIZE;x++)for(let z=0;z<SIZE;z++){const h=flat?6:Math.floor(10+Math.sin((x+s%47)/11)*3+Math.cos((z+s%31)/13)*3+noise(x>>2,z>>2,s)*2);for(let y=0;y<=(flat?h:Math.max(h,9));y++)put(x,y,z,y===0?20:y>h?21:y===h?(!flat&&h<10?8:1):y>h-3?2:3);if(!flat&&h>10&&x>3&&z>3&&x<SIZE-4&&z<SIZE-4&&noise(x,z,s+1)>.986){for(let y=h+1;y<h+5;y++)put(x,y,z,6);for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=3;dy<6;dy++)if(Math.abs(dx)+Math.abs(dz)<4)put(x+dx,h+dy,z+dz,7);put(x,h+4,z,6);}}return a;}
export function sanitizeEdits(edits){if(!Array.isArray(edits)||edits.length>SIZE*SIZE*HEIGHT)throw Error('월드 변경 데이터가 너무 큽니다.');const out=[];for(const e of edits){if(!Array.isArray(e)||e.length!==2||!(Number.isInteger(e[0])&&e[0]>=0&&e[0]<SIZE*SIZE*HEIGHT||typeof e[0]==='string'&&/^-?\d+,\d+,-?\d+$/.test(e[0])&&worldValid(...e[0].split(',').map(Number)))||!Number.isInteger(e[1])||e[1]<0||e[1]>=BLOCKS.length)throw Error('잘못된 블록 데이터');out.push(e);}return out;}

export function decorate(blocks,seed){const s=hashSeed(seed);for(let x=1;x<SIZE-1;x++)for(let z=1;z<SIZE-1;z++)for(let y=1;y<18;y++){const i=index(x,y,z);if(blocks[i]!==3)continue;let n=noise(x,y*79+z,s+73);if(n>.978)blocks[i]=y<5?30:y<8?29:y<12?28:27;else if(n>.963)blocks[i]=27;else if(n<.007&&y<8)blocks[i]=31;else if(n<.011&&y<10)blocks[i]=33;}return blocks;}
// Append IDs to preserve every previously saved voxel index.
BLOCKS.push(['용암','#ef6919'],['네더 차원문','#9d41ce'],['엔드 차원문','#10252b'],['엔드 차원문 틀','#6b8769'],['이끼 낀 조약돌','#64805a'],['프리즈머린','#639d91'],['바다 랜턴','#b1ded1'],['몬스터 생성기','#323c47'],['거미줄','#dddddd'],['네더 석영 광석','#a67a72'],['눈이 꽂힌 엔드 틀','#4a715b'],['횃불','#efc561'],['위더 스켈레톤 해골','#363636']);
export const NON_SOLID=new Set([0,21,44,45,46,52,55]);
export const isSolid=b=>!NON_SOLID.has(b);
export const DIMENSIONS={overworld:{name:'오버월드',sky:'#8abce0'},nether:{name:'네더',sky:'#421814'},end:{name:'디 엔드',sky:'#15121f'}};

export const WORLD_LIMIT=29999984;
export function worldValid(x,y,z){return [x,y,z].every(Number.isInteger)&&Math.abs(x)<WORLD_LIMIT&&Math.abs(z)<WORLD_LIMIT&&y>=0&&y<HEIGHT;}
