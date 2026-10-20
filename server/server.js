// Optional private WebSocket prototype. Requires: cd server && npm install && npm start.
// Server is NOT deployed and client multiplayer is NOT integrated.
import http from 'node:http';
import {WebSocketServer} from 'ws';
import {Session} from './session.js';
import {randomUUID} from 'node:crypto';
import {readSessionState,writeSessionState} from './state-store.js';
const savePath=process.env.SAVE_PATH||'./server-state.json';
const session=new Session(Number(process.env.WORLD_SEED)||18909,readSessionState(savePath));
const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({app:'voxel-frontier-prototype',players:session.players.size}))});
const wss=new WebSocketServer({server,maxPayload:8192});
const clients=new Map();
function send(ws,msg){if(ws.readyState===ws.OPEN)ws.send(JSON.stringify(msg));}
function broadcast(msg){for(const ws of clients.keys())send(ws,msg)}
wss.on('connection',(ws)=>{
 const id=randomUUID();clients.set(ws,id);let joined=false;let windowStart=Date.now(),count=0;
 ws.on('message',(buf)=>{
  const now=Date.now();if(now-windowStart>1000){count=0;windowStart=now}if(++count>40){ws.close(1008,'RATE_LIMIT');return}
  let msg;try{msg=JSON.parse(buf.toString('utf8'))}catch{send(ws,{type:'error',code:'BAD_JSON'});return}
  if(typeof msg!=='object'||!msg){send(ws,{type:'error',code:'INVALID_MESSAGE'});return}
  if(msg.type==='join'&&!joined){const response=session.join(id,msg.name||'Player');if(!response.ok){send(ws,{type:'error',code:response.error});return}
   joined=true;send(ws,session.snapshot());broadcast({type:'player-join',id,name:msg.name||'Player'});return;}
  if(!joined){send(ws,{type:'error',code:'NOT_JOINED'});return}
  if(msg.type==='move'){const result=session.move(id,msg.position,now);if(!result.ok)send(ws,{type:'error',code:result.error});return}
  if(msg.type==='edit'){const result=session.edit(id,msg);if(result.ok)broadcast(result.event);else send(ws,{type:'error',code:result.error});return}
  send(ws,{type:'error',code:'UNKNOWN_MESSAGE'});
 });
 ws.on('close',()=>{clients.delete(ws);if(session.leave(id))broadcast({type:'player-leave',id})});
});
setInterval(()=>{broadcast({type:'players',players:session.snapshot().players})},100);
// Save the shared world even without connected clients. Hosting requires persistent disk.
setInterval(()=>writeSessionState(savePath,session),30000).unref();
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{writeSessionState(savePath,session);server.close(()=>process.exit(0));});
const port=Number(process.env.PORT)||10000;server.listen(port,'0.0.0.0',()=>console.log('Voxel Frontier private prototype listening on',port));
