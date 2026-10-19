// Original pixel art. Three separate faces per block, no proprietary game assets.
import {BLOCKS,noise} from './world.js';
export const TILES=BLOCKS.length*3;
export const tileFor=(b,dy)=>b*3+(dy===1?1:dy===-1?2:0);
export function createTextures(){
 const atlas=document.createElement('canvas');atlas.width=TILES*16;atlas.height=16;const a=atlas.getContext('2d');const tiles=[];
 for(let b=0;b<BLOCKS.length;b++)for(let face=0;face<3;face++){
 const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');const rect=(color,x,y,w,h)=>{g.fillStyle=color;g.fillRect(x,y,w,h)};
 let base=b===1&&face!==1?'#79543a':BLOCKS[b][1];rect(base,0,0,16,16);
 for(let x=0;x<16;x++)for(let y=0;y<16;y++){const n=noise(x,y,b*7+face);rect(n>.5?`rgba(255,255,255,${(n-.5)*.48})`:`rgba(0,0,0,${(.5-n)*.55})`,x,y,1,1)}
 if(b===1&&face===0){rect('#5b9836',0,0,16,3);for(let x=0;x<16;x++)rect('#659b3b',x,2,1,1+Math.floor(noise(x,2,11)*4));}
 if([4,11,10].includes(b)){const brick=b===10;rect(brick?'#b4a18c':'#383b3b',0,0,16,16);for(let row=0;row<4;row++)for(let col=-1;col<3;col++){const x=col*8+(row%2?4:0),y=row*4;rect(brick?'#a85843':b===4?'#747677':'#898b88',x+1,y+1,7,3);rect(brick?'#c07a5d':'#a0a09b',x+1,y+1,6,1);if(b===4)rect('#555959',x+3,y+2,2,1);}}
 if(b===5){for(let y=3;y<16;y+=4){rect('#6c4e2e',0,y,16,1);rect('#d3b278',0,y-1,16,1);rect('#6c4e2e',y%8?5:12,y-3,1,3);}}
 if(b===6){if(face===0){for(let x=0;x<16;x+=3){rect('#4e3525',x,0,1,16);rect('#aa8250',x+1,Math.floor(noise(x,1,4)*5),1,9);}}else{rect('#b18b54',0,0,16,16);for(let r=1;r<8;r+=2){g.strokeStyle=r%4===1?'#775732':'#d2ad71';g.strokeRect(r+.5,r+.5,15-r*2,15-r*2);}rect('#72502c',7,6,2,3);}}
 if(b===7){g.clearRect(0,0,16,16);for(let x=0;x<16;x++)for(let y=0;y<16;y++){const n=noise(x,y,53);if(n>.25)rect(n>.7?'#659c3c':n>.46?'#3d772b':'#28581f',x,y,1,1);}}
 if(b===9){g.clearRect(0,0,16,16);rect('#c6e3e5',0,0,16,1);rect('#c6e3e5',0,15,16,1);rect('#adcdd0',0,0,1,16);rect('#adcdd0',15,0,1,16);for(let n=0;n<4;n++){rect('#d6eef0',3+n,8-n,1,1);rect('#d6eef0',9+n,11-n,1,1);}}
 if([15,16].includes(b)){g.strokeStyle=b===15?'#987321':'#218d8c';g.strokeRect(.5,.5,15,15);rect(b===15?'#fff098':'#bbfff1',1,1,14,1);rect(b===15?'#fff098':'#bbfff1',1,1,1,13);rect('#ffffff33',3,3,10,3);}
 if(b===17){for(let i=0;i<18;i++)rect(i%2?'#4c395a':'#171322',Math.floor(noise(i,1,9)*15),Math.floor(noise(i,2,9)*15),3,2);}
 if(b===18){rect('#80602c',0,0,16,16);for(let x=0;x<16;x+=4)for(let y=0;y<16;y+=4){rect('#e8ce80',x+1,y+1,3,3);rect('#fff2b0',x+1,y+1,2,1);}}
 if(b===21){for(let y=1;y<16;y+=4)rect('#93c6ec55',(y+face)%5,y,9,1);}
 if(b===22){if(face===0){rect('#e2d5bd',0,5,16,6);g.fillStyle='#282523';g.font='bold 7px monospace';g.fillText('TNT',1,11);}else{for(let x=1;x<16;x+=5)for(let y=1;y<16;y+=5){rect('#862e22',x,y,4,4);rect('#dc7651',x+1,y+1,2,2);}rect('#333',7,6,2,4);}}
 if(b===23){rect('#a27b47',0,0,16,16);rect('#5a3c22',0,0,16,2);rect('#5a3c22',0,14,16,2);if(face===1){for(let n=3;n<=12;n+=4){rect('#4c321e',n,3,1,10);rect('#4c321e',3,n,10,1);}}else if(face===0){rect('#593b24',2,3,2,10);rect('#593b24',12,3,2,10);rect('#c9c3ac',4,5,7,2);rect('#574532',7,5,2,8);}}
 if(b===24){rect('#b28b51',0,0,16,16);if(face===0){for(let y=2;y<14;y+=7){rect('#382b20',1,y,14,5);for(let x=1;x<15;x+=2){rect(['#b54437','#637d9d','#d3b35e','#68944a'][(x+y)%4],x,y+1,1,4);}}}}
 tiles.push(c);a.drawImage(c,(b*3+face)*16,0);
 }
 const icons=BLOCKS.map((_,b)=>{const c=document.createElement('canvas');c.width=c.height=48;const g=c.getContext('2d');g.imageSmoothingEnabled=false;function face(tile,transform,shade){g.save();g.setTransform(...transform);g.drawImage(tiles[tile],0,0,16,16);if(shade){g.fillStyle=`rgba(0,0,0,${shade})`;g.fillRect(0,0,16,16)}g.restore();}face(tileFor(b,1),[1.4,.7,-1.4,.7,24,2],0);face(tileFor(b,0),[1.4,.7,0,1.4,2,13.2],.13);face(tileFor(b,0),[1.4,-.7,0,1.4,24,24.4],.3);return c.toDataURL();});
 return {atlas,tiles,icons};
}
