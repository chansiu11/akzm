// Optional local-only persistence for the independent WebSocket test server.
// This is not equivalent to vanilla Anvil/NBT world or per-account player storage.
import fs from 'node:fs';
import path from 'node:path';
export function readSessionState(filename){
 try{
  const parsed=JSON.parse(fs.readFileSync(filename,'utf8'));
  if(parsed?.format!==1||!Array.isArray(parsed.world?.edits))return null;
  return parsed;
 }catch{return null;}
}
export function writeSessionState(filename,session){
 if(!filename||!session?.world?.serialize)return false;
 const payload=JSON.stringify({format:1,seq:session.seq,world:session.world.serialize()});
 const directory=path.dirname(filename);const temp=filename+'.tmp-'+process.pid;
 try{
  fs.mkdirSync(directory,{recursive:true});
  fs.writeFileSync(temp,payload,{encoding:'utf8',mode:0o600});
  fs.renameSync(temp,filename);
  return true;
 }catch{
  try{fs.unlinkSync(temp)}catch{}
  return false;
 }
}
