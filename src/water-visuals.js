// UV adapter for an independent animated water tile. No original art is bundled.
import {ATLAS_COLUMNS,ATLAS_ROWS} from './atlas.js';
export const WATER_TILE=7;
export function waterQuadUV(originalUV){
 const x=WATER_TILE%ATLAS_COLUMNS,y=Math.floor(WATER_TILE/ATLAS_COLUMNS);
 return originalUV.map(([u,v])=>[
  Math.max(0,Math.min(1,(u*ATLAS_COLUMNS-x))),
  Math.max(0,Math.min(1,(v*ATLAS_ROWS-(ATLAS_ROWS-y-1))))
 ]);
}
export function waterTileRegion(canvas){
 const cell=canvas.width/ATLAS_COLUMNS;
 const row=canvas.height/ATLAS_ROWS;
 return {x:(WATER_TILE%ATLAS_COLUMNS)*cell,y:Math.floor(WATER_TILE/ATLAS_COLUMNS)*row,width:cell,height:row};
}
