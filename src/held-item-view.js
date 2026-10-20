// Rendering decisions shared by the first-person model and regression tests.
// BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z.
import {tileForBlock} from './block-registry.js';
import {itemDefinition} from './item-registry.js';
export const BOX_FACE_NORMALS=Object.freeze([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(Object.freeze));
export function heldItemView(id){
 const item=itemDefinition(id);
 if(!item)return {id:0,kind:'empty',tiles:[]};
 if(id>=110&&id<=114)return {id,kind:'tool',tiles:[]};
 const block=item.blockId!==null;
 return {id,kind:block?'block':'item',tiles:BOX_FACE_NORMALS.map(n=>block?tileForBlock(item.blockId,n):item.iconTile)};
}
