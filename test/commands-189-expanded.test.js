import test from 'node:test';
import assert from 'node:assert/strict';
import {COMMANDS,ALIASES,commandByName,suggestions,detailedSyntax,COMMAND_CATALOG_REFERENCE,commandImplementation} from '../src/command-catalog.js';
import {executeCommand} from '../src/commands.js';
import {CommandWorldState} from '../src/command-worldstate.js';
import {BLOCK} from '../src/block-registry.js';

const blocks=new Map(),given=new Map(),messages=[];
const state={time:0,seed:123456789,position:[5,70,8],weather:'clear',difficulty:'normal',daylight:true,life:20,spawn:null,personal:null};
const stateModel=new CommandWorldState();
const ctx={
 position:()=>state.position,getTime:()=>state.time,setTime:n=>state.time=n,teleport:(...p)=>(state.position=p,true),
 getSeed:()=>state.seed,maxY:()=>255,players:()=>['Player'],entities:()=>[],
 getBlock:(x,y,z)=>blocks.get(`${x},${y},${z}`)??0,
 setBlock:(x,y,z,id)=>(blocks.set(`${x},${y},${z}`,id),true),
 fill:(from,to,id)=>{let n=0;for(let x=from[0];x<=to[0];x++)for(let y=from[1];y<=to[1];y++)for(let z=from[2];z<=to[2];z++){blocks.set(`${x},${y},${z}`,id);n++}return n;},
 getDaylightCycle:()=>state.daylight,setDaylightCycle:v=>{state.daylight=v;},
 getRule:k=>k==='doDaylightCycle'?state.daylight:stateModel.getRule(k),setRule:(k,v)=>{stateModel.setRule(k,v);if(k==='doDaylightCycle')state.daylight=v;},
 getWeather:()=>state.weather,setWeather:(name)=>{state.weather=name;},setDifficulty:d=>state.difficulty=d,
 getSeed:()=>state.seed,giveItem:(id,count)=>{given.set(id,(given.get(id)||0)+count);return 0;},clearItem:(id,limit)=>{const n=Math.min(limit,given.get(id)||0);given.set(id,(given.get(id)||0)-n);return n;},
 killSelf:()=>{state.life=0;},setWorldSpawn:p=>state.spawn=p,setSpawnpoint:p=>state.personal=p,
 announce:msg=>messages.push(msg),scoreboard:()=>stateModel.board,
};

test('full 1.8.9 command roster has 59 canonical + 3 aliases without modern-only commands',()=>{
 assert.equal(COMMANDS.length,59);assert.equal(Object.keys(ALIASES).length,3);assert.equal(COMMAND_CATALOG_REFERENCE.version,'Java Edition 1.8.9');
 for(const name of ['achievement','stats','scoreboard','execute','worldborder','whitelist','trigger','testforblocks','save-all'])assert.ok(commandByName(name),name);
 for(const name of ['function','locate','teleport','stopsound','advancement','data','tag'])assert.equal(commandByName(name),null);
 assert.equal(commandByName('tell').name,'msg');assert.equal(commandByName('w').name,'msg');assert.equal(commandByName('?').name,'help');
});
test('TAB candidates cover nested 1.8.9 grammar and context names',()=>{
 const find=(line,word)=>suggestions(line,ctx).some(s=>s.label===word);
 for(const [line,word] of [['/sco','/scoreboard'],['/scoreboard ','objectives'],['/scoreboard objectives ','add'],['/scoreboard objectives add Test ','dummy'],['/scoreboard players ','operation'],['/scoreboard teams ','option'],['/whitelist ','reload'],['/worldborder ','damage'],['/worldborder damage ','amount'],['/title @p ','subtitle'],['/execute @p ~ ~ ~ ','detect'],['/stats entity @p ','set'],['/clone ~ ~ ~ ~ ~ ~ ~ ~ ~ ','masked'],['/particle ','flame'],['/gamemode ','creative'],['/gamerule ','keepInventory'],['/help ','scoreboard'],['/give @p ','minecraft:stone']]){
  assert.ok(find(line,word),`${line} => ${word}`);
 }
 assert.ok(suggestions('/scoreboard players set ',{players:()=>['Alex']}).some(s=>s.label==='Alex'));
 assert.ok(!suggestions('/execute ').some(s=>s.label==='@s')); // @s is not a valid Java 1.8.9 selector.
});
test('dynamic subcommand usage panel shows scoreboard, title, worldborder grammar',()=>{
 assert.match(detailedSyntax('/scoreboard objectives add xyz'),/criteria/);
 assert.match(detailedSyntax('/scoreboard players operation Alex test'),/operation/);
 assert.match(detailedSyntax('/title @p times'),/fadeIn/);
 assert.match(detailedSyntax('/worldborder warning time'),/seconds/);
});
test('commands actually modify isolated local-world state, not just a pretend success message',()=>{
 assert.equal(executeCommand('/seed',ctx).message,'Seed: 123456789');
 assert.equal(executeCommand('/weather rain 600',ctx).ok,true);assert.equal(state.weather,'rain');
 assert.equal(executeCommand('/toggledownfall',ctx).ok,true);assert.equal(state.weather,'clear');
 assert.equal(executeCommand('/difficulty hard',ctx).ok,true);assert.equal(state.difficulty,'hard');
 assert.equal(executeCommand('/gamerule keepInventory true',ctx).ok,true);assert.equal(stateModel.rules.keepInventory,true);
 assert.equal(executeCommand('/give @p minecraft:stone 8',ctx).ok,true);assert.equal(given.get(BLOCK.STONE),8);
 assert.equal(executeCommand('/clear @p minecraft:stone -1 3',ctx).ok,true);assert.equal(given.get(BLOCK.STONE),5);
 assert.equal(executeCommand('/setworldspawn 1 70 2',ctx).ok,true);assert.deepEqual(state.spawn,[1,70,2]);
 assert.equal(executeCommand('/spawnpoint @p 3 70 4',ctx).ok,true);assert.deepEqual(state.personal,[3,70,4]);
 assert.equal(executeCommand('/say Hello world',ctx).ok,true);assert.equal(messages.at(-1),'Hello world');
});
test('setblock keep, fill hollow, clone, testforblocks operate on actual block IDs',()=>{
 assert.equal(executeCommand('/setblock 1 70 1 stone 0 replace',ctx).ok,true);
 assert.equal(executeCommand('/setblock 1 70 1 dirt 0 keep',ctx).ok,false);
 assert.equal(executeCommand('/fill 1 70 1 3 72 3 stone 0 hollow',ctx).ok,true);
 assert.equal(ctx.getBlock(2,71,2),0);
 assert.equal(executeCommand('/clone 1 70 1 3 72 3 10 70 10 replace normal',ctx).ok,true);
 assert.equal(blocks.get('10,70,10'),BLOCK.STONE);
 assert.equal(executeCommand('/testforblocks 1 70 1 3 72 3 10 70 10 all',ctx).ok,true);
 assert.equal(executeCommand('/testforblock 10 70 10 stone',ctx).ok,true);
});
test('1.8.9 execute nested command uses old syntax not modern as/run syntax',()=>{
 assert.equal(executeCommand('/execute @p ~ ~ ~ setblock 0 70 0 dirt',ctx).ok,true);
 assert.equal(blocks.get('0,70,0'),BLOCK.DIRT);
 assert.equal(executeCommand('/execute as @a run say hello',ctx).ok,false);
 assert.equal(executeCommand('/execute @p ~ ~ ~ detect 0 70 0 dirt 0 say fine',ctx).ok,true);
 assert.equal(messages.at(-1),'fine');
});
test('scoreboard objective and score save round-trip',()=>{
 assert.equal(executeCommand('/scoreboard objectives add kills dummy Kills',ctx).ok,true);
 assert.equal(executeCommand('/scoreboard players set Player kills 5',ctx).ok,true);
 assert.equal(executeCommand('/scoreboard players add Player kills 2',ctx).ok,true);
 assert.equal(stateModel.board.scores.get('Player\0kills'),7);
 assert.equal(executeCommand('/scoreboard teams add red Red',ctx).ok,true);
 const restored=new CommandWorldState(stateModel.serialize());assert.equal(restored.board.scores.get('Player\0kills'),7);
 assert.ok(restored.board.teams.has('red'));
});
test('unsupported vanilla features and server commands explicitly fail instead of silently succeeding',()=>{
 for(const cmd of ['/op Steve','/save-all','/summon Zombie ~ ~ ~','/gamemode creative','/execute as @a run say hello','/gamerule doFireTick false','/worldborder set 100','/setblock ~ ~ ~ minecraft:chest 0 replace {Items:[]}','/give @p minecraft:diamond_sword 1']){
  const r=executeCommand(cmd,ctx);assert.equal(r.ok,false,cmd);assert.ok(r.message.length>10);
 }
 assert.equal(commandImplementation('op'),'서버 미연결');assert.equal(commandImplementation('clone'),'부분 실행');
});
