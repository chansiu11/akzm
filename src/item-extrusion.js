// Geometry only: source pixels remain in the owner's browser.
export function extrudeItemPixels(width,height,rgba,depth=1/16){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>256||height>256||rgba.length!==width*height*4)throw Error('Invalid item pixels');
 const positions=[],uvs=[],indices=[];
 function quad(vertices,uv){const base=positions.length/3;vertices.forEach(v=>positions.push(...v));uv.forEach(v=>uvs.push(...v));indices.push(base,base+1,base+2,base,base+2,base+3);}
 const z=depth/2;
 quad([[-.5,-.5,z],[.5,-.5,z],[.5,.5,z],[-.5,.5,z]],[[0,0],[1,0],[1,1],[0,1]]);
 quad([[.5,-.5,-z],[-.5,-.5,-z],[-.5,.5,-z],[.5,.5,-z]],[[1,0],[0,0],[0,1],[1,1]]);
 const solid=(x,y)=>x>=0&&x<width&&y>=0&&y<height&&rgba[(y*width+x)*4+3]>=26;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(solid(x,y)){
  const l=x/width-.5,r=(x+1)/width-.5,t=.5-y/height,b=.5-(y+1)/height;
  const uv=Array.from({length:4},()=>[(x+.5)/width,1-(y+.5)/height]);
  if(!solid(x-1,y))quad([[l,b,-z],[l,b,z],[l,t,z],[l,t,-z]],uv);
  if(!solid(x+1,y))quad([[r,b,z],[r,b,-z],[r,t,-z],[r,t,z]],uv);
  if(!solid(x,y-1))quad([[l,t,z],[r,t,z],[r,t,-z],[l,t,-z]],uv);
  if(!solid(x,y+1))quad([[l,b,-z],[r,b,-z],[r,b,z],[l,b,z]],uv);
 }
 return {positions,uvs,indices};
}
// BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z.
export const RIGHT_ARM_UV_RECTS=Object.freeze([[40,20,44,32],[48,20,52,32],[44,16,48,20],[48,16,52,20],[44,20,48,32],[52,20,56,32]]);
export function skinRectUV([l,t,r,b],width=64,height=64){return [[l/width,1-t/height],[r/width,1-t/height],[l/width,1-b/height],[r/width,1-b/height]];}
