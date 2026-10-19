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
 ['#d8e5f1','#9dc5d1']  // glass
];
function seed(i,x,y){let z=Math.imul(i+91,16777619)^Math.imul(x+11,374761393)^Math.imul(y+13,668265263);z=Math.imul(z^(z>>>13),1274126177);return (z>>>0)/4294967295}
export function createAtlas(){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=32;const ctx=canvas.getContext('2d');for(let i=0;i<16;i++){const [base,accent]=palette[i],ox=(i%8)*16,oy=Math.floor(i/8)*16;ctx.fillStyle=base;ctx.fillRect(ox,oy,16,16);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){let r=seed(i,x,y);if(i===7){if(y%4===0&&r>.48){ctx.fillStyle='#6baac6';ctx.fillRect(ox+x,oy+y,1,1)}continue}
 if(i===13 && y<4){ctx.fillStyle=seed(i,x,24)<.5?'#629744':'#77a34a'}
 else if(i===11){if(y%5===0)ctx.fillStyle='#44352e';else ctx.fillStyle=r>.45?accent:base}
 else if(i===4&&x%5===0||i===6&&y%5===0)ctx.fillStyle=accent;
 else ctx.fillStyle=r<.22?accent:r>.91?'#45494b':base;
 if(i===9&&r>.80)ctx.fillStyle='#24272b';if(i===10&&r>.7)ctx.fillStyle='#ffffff';if(i===12&&r>.82)ctx.fillStyle='#141519';
 ctx.fillRect(ox+x,oy+y,1,1)}}return canvas;}
export function tileFor(id,normal){if(id===1)return normal[1]===1?0:normal[1]===-1?1:13;if(id===5)return normal[1]!==0?14:4;if(id===8)return 7;if(id===13)return 12;return ({2:1,3:2,4:3,6:5,7:6,9:8,10:9,11:10,12:11})[id]??2;}
export function uvFor(tile){const x=tile%8,y=Math.floor(tile/8);const inset=.005; // CanvasTexture uv origin is bottom-left.
 const u0=(x+inset)/8,u1=(x+1-inset)/8;const v0=1-(y+1-inset)/2,v1=1-(y+inset)/2;return [[u0,v0],[u1,v0],[u1,v1],[u0,v1]];}
