// Pure geometry descriptors: unit-cube faces or exposed half-cell faces for partial models.
import {definition,renderBoxes,occupied,tileForBlock} from './block-registry.js';
import {uvFor} from './atlas.js';
export const FACES=Object.freeze([
 {d:[0,0,1],v:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]},
 {d:[0,0,-1],v:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]]},
 {d:[1,0,0],v:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]]},
 {d:[-1,0,0],v:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]},
 {d:[0,1,0],v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]]},
 {d:[0,-1,0],v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]}
]);
const center=v=>[0,1,2].map(i=>v.reduce((sum,p)=>sum+p[i],0)/4);
function subFace(face,u0,v0,step){
 const [a,b,,d]=face.v;
 const point=(u,v)=>a.map((n,i)=>n+(b[i]-n)*u+(d[i]-n)*v);
 return [point(u0,v0),point(u0+step,v0),point(u0+step,v0+step),point(u0,v0+step)];
}
function blockAt(world,x,y,z,local){
 let bx=x,by=y,bz=z,ox=local[0],oy=local[1],oz=local[2];
 while(ox<0){bx--;ox++}while(ox>=1){bx++;ox--}
 while(oy<0){by--;oy++}while(oy>=1){by++;oy--}
 while(oz<0){bz--;oz++}while(oz>=1){bz++;oz--}
 const block=world.getBlock(bx,by,bz);return {block,occupies:occupied(renderBoxes(block),ox,oy,oz)};
}
function hidesFace(block,other){
 const own=definition(block.id),against=definition(other.id);
 if(!own||!against)return false;
 if(own.layer==='opaque'||own.layer==='cutout')return against.layer==='opaque';
 if(own.layer==='glass')return against.layer==='opaque'||(against.layer==='glass'&&other.id===block.id);
 if(own.layer==='water')return against.layer==='opaque'||against.layer==='water';
 return false;
}
function hidden(world,x,y,z,block,face,local){
 const [dx,dy,dz]=face.d,at=local.map((n,i)=>n+face.d[i]*.002);
 const neighbor=blockAt(world,x,y,z,at);
 return neighbor.occupies&&hidesFace(block,neighbor.block);
}
function add(quads,x,y,z,id,face,v){quads.push({x,y,z,id,d:face.d,v});}
export function visibleBlockQuads(world,x,y,z){
 const block=world.getBlock(x,y,z),def=definition(block.id);if(!def||def.model==='empty')return [];
 const quads=[],boxes=renderBoxes(block);
 if(def.model==='post'){
  // Render a narrow lever post directly: 1/2-block occupancy samples miss it.
  for(const bounds of boxes)for(const face of FACES){
   const vertices=face.v.map(([px,py,pz])=>[
    bounds[0]+px*(bounds[3]-bounds[0]),bounds[1]+py*(bounds[4]-bounds[1]),bounds[2]+pz*(bounds[5]-bounds[2])]);
   add(quads,x,y,z,block.id,face,vertices);
  }
  return quads;
 }
 if(def.model==='cube'){
  for(const face of FACES){
   const [dx,dy,dz]=face.d,neighbor=world.getBlock(x+dx,y+dy,z+dz),nd=definition(neighbor.id);
   // A complete neighboring cube either hides this whole face or exposes it.
   // Avoid six extra getBlock + occupancy queries for nearly all terrain faces.
   if(!nd || nd.model==='empty'){add(quads,x,y,z,block.id,face,face.v);continue;}
   if(nd.model==='cube'){
    if(!hidesFace(block,neighbor))add(quads,x,y,z,block.id,face,face.v);
    continue;
   }
   const subdivisions=nd.model==='slab'||nd.model==='stairs'?2:1;
   for(let u=0;u<subdivisions;u++)for(let v=0;v<subdivisions;v++){
    const part=subdivisions===1?face.v:subFace(face,u/2,v/2,.5);
    if(!hidden(world,x,y,z,block,face,center(part)))add(quads,x,y,z,block.id,face,part);
   }
  }
  return quads;
 }
 // Shapes use up to eight half-block cells. Internal faces and external covered faces are removed.
 for(let ix=0;ix<2;ix++)for(let iy=0;iy<2;iy++)for(let iz=0;iz<2;iz++){
  const mx=(ix+.5)/2,my=(iy+.5)/2,mz=(iz+.5)/2;
  if(!occupied(boxes,mx,my,mz))continue;
  for(const face of FACES){
   const [dx,dy,dz]=face.d;
   const next=[mx+dx*.5,my+dy*.5,mz+dz*.5];
   const candidate=blockAt(world,x,y,z,next);
   if(candidate.occupies&&hidesFace(block,candidate.block))continue;
   const part=face.v.map(p=>[(ix+p[0])*.5,(iy+p[1])*.5,(iz+p[2])*.5]);
   add(quads,x,y,z,block.id,face,part);
  }
 }
 return quads;
}
export function quadUV(id,d,vertices){
 const tile=tileForBlock(id,d),uv=uvFor(tile);const [a,,c]=uv;
 return vertices.map(([x,y,z])=>{
  let u,v;
  if(d[2]===1){u=x;v=y}else if(d[2]===-1){u=1-x;v=y}
  else if(d[0]===1){u=1-z;v=y}else if(d[0]===-1){u=z;v=y}
  else if(d[1]===1){u=x;v=1-z}else{u=x;v=z}
  return [a[0]+(c[0]-a[0])*u,a[1]+(c[1]-a[1])*v];
 });
}
