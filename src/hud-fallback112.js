// Own independently designed 9x9 HUD pixels. Native 1.12.2 icons
// supplied through a private JAR always take priority over these fallbacks.
const HEART=[
 '.##.##...',
 '########.',
 '#########',
 '#########',
 '.#######.',
 '..#####..',
 '...###...',
 '....#....',
 '.........'
];
const FOOD=[
 '....####.',
 '..######.',
 '.#######.',
 '.#######.',
 '..######.',
 '...#####.',
 '...##.#..',
 '.##..##..',
 '##.......'
];
const AIR=[
 '..#####..',
 '.##...##.',
 '##.....##',
 '#.......#',
 '#.......#',
 '##.....##',
 '.##...##.',
 '..#####..',
 '.........'
];
function sprite(documentRef,kind,fill){
 const canvas=documentRef.createElement('canvas');canvas.width=canvas.height=9;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 const map=kind==='heart'?HEART:kind==='food'?FOOD:AIR;
 for(let y=0;y<9;y++)for(let x=0;x<9;x++){
  if(map[y][x]!=='#')continue;
  const edge=y===0||x===0||x===8||y===7||
   map[y-1]?.[x]!== '#' ||map[y+1]?.[x]!=='#' ||
   map[y]?.[x-1]!=='#' ||map[y]?.[x+1]!=='#';
  const active=x<(fill===.5?5:fill===1?9:0);
  let color;
  if(kind==='heart'){
   color=edge?'#2a0b13':active?(y<=2&&x<=4?'#ff8586':'#e22333'):'#522c32';
  }else if(kind==='food'){
   color=edge?'#342c24':active?(y<=2?'#f3b573':'#ac632e'):'#4e403a';
   if(y>=6&&x<=3)color=active?'#ead2a1':'#716b62';
  }else color=edge?'#4b6778':active?'#bddff7':'#5c8491';
  ctx.fillStyle=color;ctx.fillRect(x,y,1,1);
 }
 return canvas.toDataURL('image/png');
}
let installed=false;
export function installHudFallback112(documentRef=typeof document==='undefined'?null:document){
 if(installed)return true;
 if(!documentRef?.documentElement||typeof documentRef.createElement!=='function')return false;
 for(const kind of ['heart','food','bubble']){
  for(const [level,name] of [[1,'full'],[.5,'half'],[0,'empty']]){
   const uri=sprite(documentRef,kind==='bubble'?'air':kind,level);
   if(!uri)return false;
   documentRef.documentElement.style.setProperty('--fallback112-'+kind+'-'+name,'url("'+uri+'")');
  }
 }
 documentRef.documentElement.classList.add('fallback-hud112');
 installed=true;
 return true;
}
