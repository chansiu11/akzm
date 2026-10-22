// Rendering decisions shared by the first-person model and regression tests.
// BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z.
import {tileForBlock} from './block-registry.js';
import {itemDefinition} from './item-registry.js';
export const BOX_FACE_NORMALS=Object.freeze([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(Object.freeze));
export function heldItemView(id){
 const item=itemDefinition(id);
 if(!item)return {id:0,kind:'empty',tiles:[]};
 if((id>=110&&id<=114)||(id>=117&&id<=126))return {id,kind:'tool',tiles:[]};
 const block=item.blockId!==null;
 return {id,kind:block?'block':'item',tiles:BOX_FACE_NORMALS.map(n=>block?tileForBlock(item.blockId,n):item.iconTile)};
}

// The world quad uses perimeter order; Three BoxGeometry uses two rows.
export const boxGeometryUV=corners=>[corners[3],corners[2],corners[0],corners[1]];
// Keep a minimum horizontal view for the hand on portrait screens, without
// stretching the model. World camera FOV is unaffected.
export function firstPersonFov(aspect){
 return 2*Math.atan(Math.tan(35*Math.PI/180)*Math.max(1,1.4/Math.max(.1,aspect)))*180/Math.PI;
}
