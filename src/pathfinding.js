// Bounded horizontal A* for prototype creatures. No source code/assets from Java 1.8.9.
const key=(x,z)=>`${x},${z}`;
const heuristic=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
export function findPath(start,goal,walkable,{maxNodes=250,maxDistance=18}={}){
 const a={x:Math.floor(start.x),z:Math.floor(start.z)},b={x:Math.floor(goal.x),z:Math.floor(goal.z)};
 if(heuristic(a,b)>maxDistance*2)return [];
 if(!walkable(a.x,a.z)||!walkable(b.x,b.z))return [];
 const open=[a],came=new Map(),scores=new Map([[key(a.x,a.z),0]]),closed=new Set();let visited=0;
 while(open.length&&visited++<maxNodes){open.sort((p,q)=>(scores.get(key(p.x,p.z))+heuristic(p,b))-(scores.get(key(q.x,q.z))+heuristic(q,b)));
  const cur=open.shift(),k=key(cur.x,cur.z);if(closed.has(k))continue;closed.add(k);
  if(cur.x===b.x&&cur.z===b.z){const path=[cur];let pointer=k;while(came.has(pointer)){const p=came.get(pointer);path.unshift(p);pointer=key(p.x,p.z);}return path;}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const x=cur.x+dx,z=cur.z+dz,nk=key(x,z);if(closed.has(nk)||Math.abs(x-a.x)>maxDistance||Math.abs(z-a.z)>maxDistance||!walkable(x,z))continue;
   const newCost=scores.get(k)+1;
   if(newCost<(scores.get(nk)??Infinity)){scores.set(nk,newCost);came.set(nk,cur);open.push({x,z});}
  }
 }
 return [];
}
