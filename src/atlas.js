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
export function createAtlas(){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=ATLAS_ROWS*16;const ctx=canvas.getContext('2d');for(let i=0;i<palette.length;i++){const [base,accent]=palette[i],ox=(i%8)*16,oy=Math.floor(i/8)*16;ctx.fillStyle=base;ctx.fillRect(ox,oy,16,16);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){let r=seed(i,x,y);if(i===7){if(y%4===0&&r>.48){ctx.fillStyle='#6baac6';ctx.fillRect(ox+x,oy+y,1,1)}continue}
 if(i===13 && y<4){ctx.fillStyle=seed(i,x,24)<.5?'#629744':'#77a34a'}
 else if(i===11){if(y%5===0)ctx.fillStyle='#44352e';else ctx.fillStyle=r>.45?accent:base}
 else if(i===4&&x%5===0||i===6&&y%5===0)ctx.fillStyle=accent;
 else ctx.fillStyle=r<.22?accent:r>.91?'#45494b':base;
 if(i===9&&r>.80)ctx.fillStyle='#24272b';if(i===10&&r>.7)ctx.fillStyle='#ffffff';if(i===12&&r>.82)ctx.fillStyle='#141519';
 ctx.fillRect(ox+x,oy+y,1,1)}
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
