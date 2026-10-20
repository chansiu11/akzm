// Minimal prototype session for a private, independently hosted WebSocket test.
// Not production-grade anticheat, account auth, persistence, or vanilla protocol.
import {BLOCK,World} from '../src/terrain.js';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const dist2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export class Session {
 constructor(seed=18909,saved=null){this.world=new World(saved?.world??null,{seed});this.players=new Map();this.seq=Number.isSafeInteger(saved?.seq)&&saved.seq>=0?saved.seq:0;this.journal=[];}
 join(id,name='Player'){
  if(this.players.has(id)||this.players.size>=16||!String(name).match(/^[A-Za-z0-9_가-힣]{1,20}$/))return {ok:false,error:'INVALID_JOIN'};
  this.players.set(id,{id,name,x:0,y:120,z:0,lastMove:0});return {ok:true,seed:this.world.seed,players:this.players.size};
 }
 leave(id){return this.players.delete(id);}
 move(id,position,now=Date.now()){
  const p=this.players.get(id);if(!p)return {ok:false,error:'NOT_JOINED'};
  if(!position||![position.x,position.y,position.z].every(finite))return {ok:false,error:'INVALID_POSITION'};
  if(Math.max(Math.abs(position.x),Math.abs(position.z))>30000000||position.y<0||position.y>260)return {ok:false,error:'OUT_OF_BOUNDS'};
  if(p.lastMove&&dist2(p,position)>Math.max(2,Math.min(14,(now-p.lastMove)/1000*7+1)))return {ok:false,error:'IMPOSSIBLE_MOVE'};
  Object.assign(p,{x:position.x,y:position.y,z:position.z,lastMove:now});return {ok:true};
 }
 edit(id,change){const p=this.players.get(id);if(!p)return {ok:false,error:'NOT_JOINED'};
  if(!change||![change.x,change.y,change.z,change.block].every(Number.isSafeInteger)||Math.hypot(change.x-p.x,change.y-p.y,change.z-p.z)>7)return {ok:false,error:'OUT_OF_REACH'};
  if(change.y<1||change.y>255||change.block<0||change.block>32||this.world.get(change.x,change.y,change.z)===BLOCK.BEDROCK)return {ok:false,error:'INVALID_BLOCK'};
  if(!this.world.set(change.x,change.y,change.z,change.block))return {ok:false,error:'CHANGE_REJECTED'};
  const event={type:'edit',seq:++this.seq,...change,by:id};this.journal.push(event);if(this.journal.length>2000)this.journal.shift();return {ok:true,event};
 }
 snapshot(){return {type:'snapshot',seed:this.world.seed,seq:this.seq,players:[...this.players.values()].map(({id,name,x,y,z})=>({id,name,x,y,z})),edits:this.world.serialize().edits};}
}
