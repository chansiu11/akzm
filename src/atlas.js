import {tileForBlock} from './block-registry.js';
export const ATLAS_COLUMNS=8;
export const ATLAS_ROWS=5;
// Generated pixel art, not extracted from a commercial game's asset files.
const palette = [
 ['#6e9f48','#4e8437'], // grass top
 ['#7e5232','#73452a'], // dirt
 ['#7e8385','#65686c'], // stone
 ['#cdbb78','#e7d48f'], // sand
 ['#87623d','#aa7944'], // log side
 ['#3c7138','#5e934e'], // leaves
 ['#a37847','#c2935d'], // planks
 ['#377fae','#377fae'], // water
 ['#78787c','#66656a'], // cobble
 ['#6f747b','#20232b'], // coal
 ['#eef6fa','#e1edf1'], // snow
 ['#a7504b','#c16960'], // brick
 ['#272b30','#44434c'], // bedrock
 ['#62863b','#825632'], // grass side
 ['#8f643b','#b28b58'], // log top
 ['#d8e5f1','#9dc5d1'], // glass
 ['#ad8550','#765735'], // crafting top
 ['#936c40','#6b4b32'], // crafting side
 ['#af8251','#4e3422'], // crafting front
 ['#7c858e','#e2c69d'], // iron ore
 ['#828182','#e6cd51'], // gold ore
 ['#7c8285','#36cfcb'], // diamond ore
 ['#91948f','#62655f'], // gravel
 ['#dbc793','#c2a777'], // sandstone
 ['#a0a5b0','#b2b0bf'], // clay
 ['#4b392f','#6d513c'], // spruce bark
 ['#355344','#486b4c'], // spruce leaves
 ['#656780','#243a9e'], // lapis ore
 ['#6e7072','#c33736'], // redstone ore
 ['#777f75','#21bf79'], // emerald ore
 ['#a37c4e','#5f4426'], // chest
 ['#71747a','#2f3133'], // furnace
 ['#b38c5b','#4a3d36'], // lever
 ['#9d8754','#e7bc4d'], // redstone lamp
 ['#cb392e','#ad211b'], // original procedural apple icon
 ['#a46b35','#e6b66b'] // original procedural bread icon
];
function seed(i,x,y){let z=Math.imul(i+91,16777619)^Math.imul(x+11,374761393)^Math.imul(y+13,668265263);z=Math.imul(z^(z>>>13),1274126177);return (z>>>0)/4294967295}
function textureDetail(ctx,i,ox,oy){
 const dot=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(ox+x,oy+y,w,h)};
 const line=(y,col)=>dot(0,y,16,1,col);
 if(i===0){ // independent pixel grass: short moss clusters
  for(let k=0;k<26;k++){let x=Math.floor(seed(i,k,40)*16),y=Math.floor(seed(i,k,41)*16);
   dot(x,y,2,1,k%3?'#86b35c':'#385d32');}
 }
 if(i===13){ // turf edge and earthy exposed side
  dot(0,0,16,3,'#628f43');for(let x=0;x<16;x+=3){dot(x,3,1,seed(i,x,3)>.6?3:1,'#628b44');}
  for(let x=0;x<16;x+=5){dot(x,8+Math.floor(seed(i,x,15)*5),3,1,'#9a7048');}
 }
 if(i===1||i===22){for(let k=0;k<24;k++){let x=Math.floor(seed(i,k,30)*16),y=Math.floor(seed(i,k,31)*16);dot(x,y,2,1,k%2?'#936a4c':'#5d4935');}}
 if(i===2||[19,20,21,27,28,29].includes(i)){
  for(let k=0;k<17;k++){const x=Math.floor(seed(i,k,50)*16),y=Math.floor(seed(i,k,51)*16);dot(x,y,k%3===0?3:2,1,k%2?'#a0a3a3':'#666a6d');}
  if(i!==2){const metals={19:['#d7b68b','#fbdbba'],20:['#c8ac49','#fff0a1'],21:['#39bebb','#88f6de'],27:['#3650bb','#607bf0'],28:['#c83f38','#ff887b'],29:['#24ae7b','#70f9af']};
   const [ore,shine]=metals[i];for(let k=0;k<6;k++){const x=Math.floor(seed(i,k,70)*13),y=Math.floor(seed(i,k,71)*13);dot(x,y,3,3,ore);dot(x+1,y,1,1,shine);}
  }
 }
 if(i===3||i===23){for(let k=0;k<19;k++){let x=Math.floor(seed(i,k,32)*16),y=Math.floor(seed(i,k,33)*16);dot(x,y,1,1,k%2?'#aa955e':'#efe3ad');}}
 if(i===4||i===25){for(let x=2;x<16;x+=5){dot(x,0,2,16,i===25?'#2c2727':'#6a4929');for(let y=3;y<16;y+=6)dot(x-1,y,4,1,'#b18b5b');}}
 if(i===14){dot(1,1,14,14,'#ab8758');for(let r=0;r<5;r++){dot(2+r,2+r,12-r*2,1,r%2?'#765735':'#e4c092');dot(2+r,13-r,12-r*2,1,r%2?'#765735':'#e4c092');}}
 if(i===6||i===16||i===17||i===18){for(let y=4;y<16;y+=5){line(y,'#614729');dot((y===9?5:0),y+1,1,4,'#725231');dot(0,y-1,16,1,'#dcaa6e');}}
 if(i===8){for(let x=0;x<16;x+=5){dot(x,0,1,16,'#43474a');for(let y=0;y<16;y+=5){dot(x+(y%3),y,4,1,'#54595a');dot(x+1,y+1,3,2,'#999b97');}}}
 if(i===5||i===26){for(let k=0;k<31;k++){let x=Math.floor(seed(i,k,34)*16),y=Math.floor(seed(i,k,35)*16);
   dot(x,y,(k%5)+1,2,k%4===0?'#314a32':i===26?'#659571':'#75a95a');if(k%9===0)ctx.clearRect(ox+x,oy+y,2,2);
 }}
 if(i===7){for(let y=0;y<16;y+=4){let shift=(y%8)/4*2;for(let x=0;x<16;x+=7){dot((x+shift)%16,y,5,1,'#61a9c2');}}}
 if(i===9||i===12){for(let k=0;k<18;k++){let x=Math.floor(seed(i,k,36)*15),y=Math.floor(seed(i,k,37)*15);dot(x,y,2,2,i===12?'#171c23':'#22232a');}}
 if(i===10){for(let k=0;k<10;k++){let x=Math.floor(seed(i,k,38)*15),y=Math.floor(seed(i,k,39)*15);dot(x,y,2,1,'#ffffff');}}
 if(i===11){for(let y=0;y<16;y+=5){line(y,'#503733');for(let x=(y%2)*5;x<16;x+=9)dot(x,y,1,5,'#61443c');}}
 if(i===15){ctx.clearRect(ox,oy,16,16);dot(1,1,14,14,'#b9d4df');dot(1,1,14,1,'#f6fbfd');dot(1,1,1,14,'#f0fbfd');dot(14,1,1,14,'#7db6cb');dot(1,14,14,1,'#81bac8');}
 if(i===30){dot(1,2,14,12,'#977448');dot(1,2,14,2,'#d3af6b');dot(2,9,12,1,'#4c3626');dot(7,7,3,5,'#d5c897');dot(8,8,1,2,'#f7e5a6');}
 if(i===31){dot(2,3,12,12,'#393e42');dot(3,4,10,8,'#656b6c');dot(5,6,6,5,'#252a30');dot(7,9,2,2,'#e9ad49');}
 if(i===33){for(let y=2;y<15;y+=5)for(let x=2;x<15;x+=5){dot(x,y,4,4,'#554627');dot(x+1,y+1,2,2,'#e8ba51');}}
}
export function createAtlas(){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=ATLAS_ROWS*16;const ctx=canvas.getContext('2d');for(let i=0;i<palette.length;i++){const [base,accent]=palette[i],ox=(i%8)*16,oy=Math.floor(i/8)*16;ctx.fillStyle=base;ctx.fillRect(ox,oy,16,16);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){let r=seed(i,x,y);if(i===7){if(y%4===0&&r>.48){ctx.fillStyle='#6baac6';ctx.fillRect(ox+x,oy+y,1,1)}continue}
 if(i===13 && y<4){ctx.fillStyle=seed(i,x,24)<.5?'#629744':'#77a34a'}
 else if(i===11){if(y%5===0)ctx.fillStyle='#44352e';else ctx.fillStyle=r>.45?accent:base}
 else if(i===4&&x%5===0||i===6&&y%5===0)ctx.fillStyle=accent;
 else ctx.fillStyle=r<.22?accent:r>.91?'#45494b':base;
 if(i===9&&r>.80)ctx.fillStyle='#24272b';if(i===10&&r>.7)ctx.fillStyle='#ffffff';if(i===12&&r>.82)ctx.fillStyle='#141519';
 ctx.fillRect(ox+x,oy+y,1,1)}
 textureDetail(ctx,i,ox,oy);
 if(i===34){ctx.clearRect(ox,oy,16,16);
  ctx.fillStyle='#582d18';ctx.fillRect(ox+7,oy+2,2,3);
  ctx.fillStyle='#579042';ctx.fillRect(ox+9,oy+2,4,2);
  ctx.fillStyle='#a92727';ctx.fillRect(ox+3,oy+5,10,8);ctx.fillRect(ox+4,oy+4,4,1);ctx.fillRect(ox+9,oy+4,3,1);
  ctx.fillStyle='#e34d39';ctx.fillRect(ox+4,oy+6,4,5);ctx.fillRect(ox+5,oy+12,5,1);
  ctx.fillStyle='#f79272';ctx.fillRect(ox+5,oy+6,2,2);
 }
 if(i===35){ctx.clearRect(ox,oy,16,16);
  ctx.fillStyle='#744b2a';ctx.fillRect(ox+2,oy+7,12,6);ctx.fillRect(ox+4,oy+4,8,3);
  ctx.fillStyle='#d99b52';ctx.fillRect(ox+3,oy+6,10,6);ctx.fillRect(ox+5,oy+5,6,1);
  ctx.fillStyle='#f0c979';ctx.fillRect(ox+5,oy+7,2,4);ctx.fillRect(ox+9,oy+7,2,4);
 }
 }return canvas;}
export const tileFor=tileForBlock;
export function uvFor(tile){const x=tile%ATLAS_COLUMNS,y=Math.floor(tile/ATLAS_COLUMNS);const inset=.005;
 const u0=(x+inset)/ATLAS_COLUMNS,u1=(x+1-inset)/ATLAS_COLUMNS;
 const v0=1-(y+1-inset)/ATLAS_ROWS,v1=1-(y+inset)/ATLAS_ROWS;
 return [[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
}
