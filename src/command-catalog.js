// Independent, version-locked Java Edition 1.8.9 command catalog and completion.
// Syntax was checked against usage keys in the user-provided 1.8.9 JAR.
// The catalog describes vanilla grammar; a command being listed does not imply that
// this prototype contains the engine/server subsystem needed to execute it.
import {BLOCK_DEFS} from './block-registry.js';
import {ITEM_DEFS} from './item-registry.js';
import {ENTITY_KINDS} from './entity-ai.js';

const rows = [
 ['achievement','<give|take> <stat_name|*> [player]','업적 지급·회수','/achievement give achievement.openInventory'],
 ['clear','[player] [item] [data] [maxCount] [dataTag]','인벤토리에서 아이템 제거','/clear @p minecraft:stone'],
 ['defaultgamemode','<mode>','서버 기본 모드 변경','/defaultgamemode survival'],
 ['difficulty','<difficulty>','세계 난이도 변경','/difficulty normal'],
 ['effect','<player> <effect|clear> [seconds] [amplifier] [hideParticles]','효과 부여·제거','/effect @p 1 30 0 true'],
 ['enchant','<player> <enchantment> [level]','마법 부여','/enchant @p 16 1'],
 ['gamemode','<mode> [player]','게임 모드 변경','/gamemode creative @p'],
 ['gamerule','<rule> [value]','게임 규칙 변경','/gamerule doDaylightCycle false'],
 ['give','<player> <item> [amount] [data] [dataTag]','아이템 지급','/give @p minecraft:stone 64'],
 ['kill','[target]','플레이어·엔티티 제거','/kill @e[type=Item]'],
 ['seed','','월드 시드 조회','/seed'],
 ['setworldspawn','[x] [y] [z]','기본 월드 스폰 변경','/setworldspawn ~ ~ ~'],
 ['spawnpoint','[player] [x] [y] [z]','개인 부활 지점 설정','/spawnpoint @p ~ ~ ~'],
 ['spreadplayers','<x> <z> <spreadDistance> <maxRange> <respectTeams> <players...>','대상 분산 이동','/spreadplayers ~ ~ 4 30 false @a'],
 ['time','<set|add|query> <value>','시간 설정·증가·조회','/time set day'],
 ['toggledownfall','','비·눈 상태 전환','/toggledownfall'],
 ['tp','[target] <destination|x y z> [yaw] [pitch]','대상 순간이동','/tp ~ ~5 ~'],
 ['weather','<clear|rain|thunder> [duration]','날씨 변경','/weather clear 600'],
 ['worldborder','<set|add|center|damage|warning|get> ...','세계 경계 설정','/worldborder set 1000'],
 ['xp','<amount>[L] [player]','경험치 포인트·레벨 지급','/xp 10L @p'],
 ['blockdata','<x> <y> <z> <dataTag>','블록 엔티티 NBT 수정','/blockdata ~ ~-1 ~ {CustomName:"Box"}'],
 ['clone','<x1> <y1> <z1> <x2> <y2> <z2> <x> <y> <z> [maskMode] [cloneMode] [TileName]','블록 영역 복사','/clone ~ ~ ~ ~2 ~2 ~2 ~5 ~ ~'],
 ['entitydata','<entity> <dataTag>','엔티티 NBT 수정','/entitydata @e[type=Pig,c=1] {CustomName:"Pet"}'],
 ['execute','<entity> <x> <y> <z> [detect ...] <command...>','다른 엔티티를 기준으로 실행','/execute @p ~ ~ ~ say hello'],
 ['fill','<x1> <y1> <z1> <x2> <y2> <z2> <block> [data] [oldBlockHandling] [dataTag]','블록 영역 변경','/fill ~ ~ ~ ~3 ~3 ~3 stone'],
 ['particle','<name> <x> <y> <z> <dx> <dy> <dz> <speed> [count] [mode]','파티클 생성','/particle flame ~ ~ ~ 1 1 1 0.1 20'],
 ['playsound','<sound> <player> [x] [y] [z] [volume] [pitch] [minVolume]','대상에게 소리 재생','/playsound random.click @p'],
 ['replaceitem','<entity|block> ...','인벤토리 슬롯 교체','/replaceitem entity @p slot.hotbar.0 minecraft:stone'],
 ['scoreboard','<objectives|players|teams> ...','스코어보드·팀 관리','/scoreboard objectives list'],
 ['setblock','<x> <y> <z> <block> [data] [replace|destroy|keep] [dataTag]','한 블록 설정','/setblock ~ ~-1 ~ minecraft:stone'],
 ['stats','<entity|block> ...','명령 결과 점수 연결','/stats entity @p clear SuccessCount'],
 ['summon','<EntityName> [x] [y] [z] [dataTag]','엔티티 소환','/summon Pig ~ ~ ~'],
 ['testfor','<player|selector> [dataTag]','대상 존재 확인','/testfor @p'],
 ['testforblock','<x> <y> <z> <block> [data] [dataTag]','블록 검사','/testforblock ~ ~-1 ~ stone'],
 ['testforblocks','<x1> <y1> <z1> <x2> <y2> <z2> <x> <y> <z> [all|masked]','블록 영역 비교','/testforblocks ~ ~ ~ ~1 ~1 ~1 ~5 ~ ~'],
 ['title','<player> <title|subtitle|clear|reset|times> ...','타이틀 UI 전송','/title @p title {"text":"Hello"}'],
 ['trigger','<objective> <set|add> <value>','트리거 스코어 변경','/trigger example set 1'],
 ['help','[page|command]','명령어 목록·사용법','/help scoreboard'],
 ['me','<action...>','행동 메시지','/me waves'],
 ['msg','<player> <message...>','귓속말','/msg @p hello'],
 ['say','<message...>','전체 알림','/say hello'],
 ['tellraw','<player> <rawJson...>','JSON 채팅 전송','/tellraw @p {"text":"Hello"}'],
 ['debug','<start|stop>','성능 프로파일 시작·종료','/debug start'],
 ['publish','','싱글플레이 LAN 공개','/publish'],
 ['ban','<player> [reason...]','서버 계정 차단','/ban Steve'],
 ['ban-ip','<address|player> [reason...]','서버 IP 차단','/ban-ip 127.0.0.1'],
 ['banlist','[ips|players]','차단 목록','/banlist players'],
 ['deop','<player>','관리자 제거','/deop Steve'],
 ['kick','<player> [reason...]','서버 플레이어 추방','/kick Steve'],
 ['list','','접속자 표시','/list'],
 ['op','<player>','관리자 지정','/op Steve'],
 ['pardon','<player>','차단 해제','/pardon Steve'],
 ['pardon-ip','<address>','IP 차단 해제','/pardon-ip 127.0.0.1'],
 ['save-all','','서버 전체 저장','/save-all'],
 ['save-off','','서버 자동 저장 중지','/save-off'],
 ['save-on','','서버 자동 저장 재개','/save-on'],
 ['setidletimeout','<minutes>','서버 비활동 퇴장 시간','/setidletimeout 10'],
 ['stop','','서버 종료','/stop'],
 ['whitelist','<on|off|list|add|remove|reload> [player]','서버 접속 허용 목록','/whitelist list']
];
export const ALIASES=Object.freeze({'?':'help',tell:'msg',w:'msg'});
const COMMAND_SET=new Set(rows.map(r=>r[0]));
const SERVER_SET=new Set(['ban','ban-ip','banlist','deop','kick','list','op','pardon','pardon-ip','save-all','save-off','save-on','setidletimeout','stop','whitelist']);
const MODE=['survival','creative','adventure','spectator','0','1','2','3'];
const TARGET=['@p','@a','@r','@e','@e[type=Item]']; // @s did not exist in Java 1.8.9.
const BOOL=['true','false'];
const COORD=['~','~1','~-1','0','64'];
function coordinateChoices(ctx,index,offset=0){const look=ctx.blockTarget?.();const xyz=look?[look.x,look.y,look.z]:ctx.position?.();const c=Array.isArray(xyz)?xyz[Math.abs(index-offset)%3]:undefined;return Number.isFinite(c)?[String(Math.floor(c)),...COORD]:COORD;}
const DIFFICULTY=['peaceful','easy','normal','hard','0','1','2','3'];
const WEATHER=['clear','rain','thunder'];
const TIME=['day','night','0','1000','6000','12000','13000','18000'];
const GAMERULES=['commandBlockOutput','doDaylightCycle','doEntityDrops','doFireTick','doMobLoot','doMobSpawning','doTileDrops','keepInventory','logAdminCommands','mobGriefing','naturalRegeneration','randomTickSpeed','reducedDebugInfo','sendCommandFeedback','showDeathMessages'];
const SCORE_ROOT=['objectives','players','teams'];
const SCORE_ACTIONS={objectives:['list','add','remove','setdisplay'],players:['set','add','remove','reset','list','enable','test','operation'],teams:['list','add','remove','empty','join','leave','option']};
const SCORE_CRITERIA=['dummy','trigger','deathCount','playerKillCount','totalKillCount','health'];
const SCORE_OPTIONS=['color','friendlyfire','seeFriendlyInvisibles','nametagVisibility','deathMessageVisibility'];
const STATS=['SuccessCount','AffectedBlocks','AffectedEntities','AffectedItems','QueryResult'];
const ENTITIES=['Pig','Cow','Sheep','Chicken','Zombie','Skeleton','Creeper','Spider','Enderman','Villager','Item','ArmorStand','Arrow','PrimedTnt','Boat','Minecart',...Object.keys(ENTITY_KINDS)];
const PARTICLES=['explode','largeexplode','hugeexplosion','fireworksSpark','bubble','splash','wake','suspended','depthsuspend','crit','magicCrit','smoke','largesmoke','spell','instantSpell','mobSpell','mobSpellAmbient','witchMagic','dripWater','dripLava','angryVillager','happyVillager','townaura','note','portal','enchantmenttable','flame','lava','footstep','cloud','reddust','snowballpoof','snowshovel','slime','heart','barrier','iconcrack','blockcrack','blockdust','droplet','take','mobappearance'];
const BLOCKS=[...new Set(BLOCK_DEFS.filter(b=>b.id>0).flatMap(b=>[b.key,b.key.replace('minecraft:','')])),'minecraft:air','air'];
const ITEMS=[...new Set(ITEM_DEFS.filter(i=>i.id>0).flatMap(i=>[i.key,i.key.replace('minecraft:','')]))];
const OBJECTIVE_SLOT=['list','sidebar','belowName'];
const ARG_TYPES={target:TARGET,player:TARGET,entity:TARGET,mode:MODE,difficulty:DIFFICULTY,block:BLOCKS,item:ITEMS,EntityName:ENTITIES,name:PARTICLES,rule:GAMERULES,x:COORD,y:COORD,z:COORD,x1:COORD,y1:COORD,z1:COORD,x2:COORD,y2:COORD,z2:COORD};
const splitSpec=syntax=>syntax.match(/(<[^>]+>|\[[^\]]+\])/g)||[];
export const COMMANDS=Object.freeze(rows.map(([name,rest,description,example])=>{
 const args=splitSpec(rest).map(s=>{const optional=s[0]==='[';const n=s.slice(1,-1);return {name:n,optional,choices:ARG_TYPES[n]||[]};});
 return Object.freeze({name,syntax:'/'+name+(rest?' '+rest:''),description,example,args,serverOnly:SERVER_SET.has(name)});
}));
if(COMMANDS.length!==59||COMMAND_SET.size!==59)throw Error('1.8.9 catalog must contain 59 distinct canonical commands');
export const canonicalName=name=>ALIASES[String(name||'').toLowerCase()]||String(name||'').toLowerCase();
export const commandByName=name=>COMMANDS.find(c=>c.name===canonicalName(name))||null;
export const isServerOnly=name=>SERVER_SET.has(canonicalName(name));

function takeArguments(text){const bare=text.replace(/^\//,'');const trailing=/\s$/.test(bare);const tokens=bare.trim().length?bare.trim().split(/\s+/):[];if(trailing)tokens.push('');return tokens;}
function chooseCandidate(name,args,index,ctx={}){
 const previous=args[index-1],first=args[0];
 const players=[...(ctx.players?.()??['Player'])];
 const person=[...TARGET,...players];
 const savedNames=(kind)=>{try{return ctx[kind]?.()??[]}catch{return []}};
 const objective=savedNames('objectives'),teams=savedNames('teams');
 switch(name){
  case 'scoreboard':if(index===0)return SCORE_ROOT;
   if(index===1)return SCORE_ACTIONS[first]||[];
   if(first==='objectives'){
    if(args[1]==='add'&&index===3)return SCORE_CRITERIA;
    if(args[1]==='setdisplay'&&index===2)return OBJECTIVE_SLOT;
    if(['remove','setdisplay'].includes(args[1])&&index>=2)return objective;
   }
   if(first==='teams'){
    if(args[1]==='option'&&index===3)return SCORE_OPTIONS;
    if(['remove','empty','join','option'].includes(args[1])&&index===2)return teams;
    if(args[1]==='option'&&index===4)return args[3]==='color'?['black','dark_blue','dark_green','dark_aqua','dark_red','dark_purple','gold','gray','dark_gray','blue','green','aqua','red','light_purple','yellow','white','reset']:BOOL;
   }
   if(first==='players'){
    if(['set','add','remove','reset','test','enable','operation'].includes(args[1])&&index===2)return person;
    if(['set','add','remove','test','enable'].includes(args[1])&&index===3)return objective;
    if(args[1]==='operation'&&index===4)return ['+=','-=','*=','/=','%=','=','<','>','><'];
   }
   return [];
  case 'whitelist':return index===0?['on','off','list','add','remove','reload']:index===1?players:[];
  case 'time':return index===0?['set','add','query']:index===1?(first==='query'?['daytime','gametime','day']:TIME):[];
  case 'worldborder':return index===0?['set','add','center','damage','warning','get']:index===1?(first==='damage'?['buffer','amount']:first==='warning'?['time','distance']:first==='center'?COORD:[]):[];
  case 'title':return index===0?person:index===1?['title','subtitle','clear','reset','times']:[];
  case 'stats':return index===0?['entity','block']:index===(first==='block'?4:2)?['set','clear']:index===(first==='block'?5:3)?STATS:index===(first==='block'?6:4)?person:[];
  case 'replaceitem':return index===0?['entity','block']:index===(first==='block'?4:2)?['slot.hotbar.0','slot.hotbar.1','slot.hotbar.2','slot.inventory.0','slot.armor.head','slot.container.0']:index===(first==='block'?5:3)?ITEMS:(first==='entity'&&index===1)?person:(first==='block'&&index<=3)?COORD:[];
  case 'clone':return index<=8?coordinateChoices(ctx,index):index===9?['replace','masked','filtered']:index===10?['normal','force','move']:index===11?BLOCKS:[];
  case 'execute':return index===0?person:index<=3?COORD:index===4?['detect',...COMMANDS.map(c=>c.name)]:first==='detect'?[]:[];
  case 'gamerule':return index===0?GAMERULES:index===1?(first==='randomTickSpeed'?['0','1','3','20','100']:BOOL):[];
  case 'gamemode':return index===0?MODE:index===1?person:[];
  case 'defaultgamemode':return index===0?MODE:[];
  case 'difficulty':return index===0?DIFFICULTY:[];
  case 'weather':return index===0?WEATHER:index===1?['60','300','600','1200']:[];
  case 'achievement':return index===0?['give','take']:index===1?['*','achievement.openInventory','achievement.mineWood','achievement.buildWorkBench','achievement.buildPickaxe']:index===2?person:[];
  case 'effect':return index===0?person:index===1?['clear','1','2','5','8','10','minecraft:speed','minecraft:regeneration']:index===4?BOOL:[];
  case 'particle':return index===0?PARTICLES:index>=1&&index<=3?coordinateChoices(ctx,index,1):index===9?['normal','force']:[];
  case 'tp':return index<=3?[...COORD,...person]:[];
  case 'setblock':return index<=2?coordinateChoices(ctx,index):index===3?BLOCKS:index===5?['replace','destroy','keep']:[];
  case 'fill':return index<=5?coordinateChoices(ctx,index):index===6?BLOCKS:index===8?['replace','destroy','keep','hollow','outline']:[];
  case 'testforblocks':return index<=8?coordinateChoices(ctx,index):index===9?['all','masked']:[];
  case 'testforblock':return index<=2?coordinateChoices(ctx,index):index===3?BLOCKS:[];
  case 'spawnpoint':return index===0?[...person,...COORD]:COORD;
  case 'setworldspawn':return coordinateChoices(ctx,index);
  case 'spreadplayers':return index<2?COORD:index===4?BOOL:index>=5?person:[];
  case 'give':return index===0?person:index===1?ITEMS:[];
  case 'clear':return index===0?person:index===1?ITEMS:[];
  case 'summon':return index===0?ENTITIES:index<=3?COORD:[];
  case 'enchant':return index===0?person:index===1?['0','16','17','18','32','33','34','35','48','49','minecraft:sharpness','minecraft:efficiency']:[];
  case 'trigger':return index===0?objective:index===1?['set','add']:[];
  case 'help':return index===0?['1','2','3',...COMMANDS.map(c=>c.name)]:[];
  case 'debug':return index===0?['start','stop']:[];
  case 'banlist':return index===0?['ips','players']:[];
  case 'kill':case 'testfor':case 'entitydata':case 'op':case 'deop':case 'ban':case 'kick':case 'pardon':case 'list':case 'msg':case 'tellraw':case 'playsound':return index===0?person:[];
  default:return [];
 }
}
function suggestionLocation(input){const tokens=takeArguments(String(input||''));const partial=tokens.at(-1)??'';const index=Math.max(0,tokens.length-2);const name=canonicalName(tokens[0]||'');const start=String(input||'').length-partial.length;return {name,index,partial,prefix:String(input||'').slice(0,start),args:tokens.slice(1),tokens};}
export function suggestions(input,ctx={}){
 const {name,index,partial,prefix,args,tokens}=suggestionLocation(input);
 if(tokens.length<=1){const candidates=[...COMMANDS.map(c=>c.name),...Object.keys(ALIASES)];return candidates.filter(n=>n.startsWith(name)).map(n=>({label:'/'+n,insert:'/'+n+' ',description:commandByName(n)?.description||''}));}
 const cmd=commandByName(name);if(!cmd)return [];
 const choices=[...new Set(chooseCandidate(cmd.name,args,index,ctx))];
 return choices.filter(s=>s.toLowerCase().startsWith(partial.toLowerCase())).map(s=>({label:s,insert:prefix+s+' ',description:cmd.args[index]?.name||'인수'}));
}
const DETAILED_FORMS={
 scoreboard:{objectives:{list:'/scoreboard objectives list',add:'/scoreboard objectives add <name> <criteria> [displayName...]',remove:'/scoreboard objectives remove <name>',setdisplay:'/scoreboard objectives setdisplay <slot> [objective]'},players:{set:'/scoreboard players set <player> <objective> <score> [dataTag]',add:'/scoreboard players add <player> <objective> <count> [dataTag]',remove:'/scoreboard players remove <player> <objective> <count> [dataTag]',reset:'/scoreboard players reset <player> [objective]',list:'/scoreboard players list [player]',enable:'/scoreboard players enable <player> <trigger>',test:'/scoreboard players test <player> <objective> <min> <max>',operation:'/scoreboard players operation <target> <objective> <operation> <source> <objective>'},teams:{list:'/scoreboard teams list [name]',add:'/scoreboard teams add <name> [displayName...]',remove:'/scoreboard teams remove <name>',empty:'/scoreboard teams empty <name>',join:'/scoreboard teams join <name> [player]',leave:'/scoreboard teams leave [player]',option:'/scoreboard teams option <team> <option> <value>'}},
 worldborder:{set:'/worldborder set <diameter> [time]',add:'/worldborder add <distance> [time]',center:'/worldborder center <x> <z>',damage:{buffer:'/worldborder damage buffer <distance>',amount:'/worldborder damage amount <damage>'},warning:{time:'/worldborder warning time <seconds>',distance:'/worldborder warning distance <blocks>'},get:'/worldborder get'},
 whitelist:{on:'/whitelist on',off:'/whitelist off',list:'/whitelist list',add:'/whitelist add <player>',remove:'/whitelist remove <player>',reload:'/whitelist reload'},
 title:{title:'/title <player> title <raw JSON text>',subtitle:'/title <player> subtitle <raw JSON text>',times:'/title <player> times <fadeIn> <stay> <fadeOut>',clear:'/title <player> clear',reset:'/title <player> reset'},
 replaceitem:{entity:'/replaceitem entity <target> <slot> <item> [count] [data] [dataTag]',block:'/replaceitem block <x> <y> <z> <slot> <item> [count] [data] [dataTag]'},
 stats:{entity:'/stats entity <target> <set|clear> <stat> [selector] [objective]',block:'/stats block <x> <y> <z> <set|clear> <stat> [selector] [objective]'},
 time:{set:'/time set <ticks|day|night>',add:'/time add <ticks>',query:'/time query <daytime|gametime|day>'},
 execute:{detect:'/execute <entity> <x> <y> <z> detect <x> <y> <z> <block> <data> <command>'}
};
export function detailedSyntax(input){
 const parts=takeArguments(String(input||'')),c=commandByName(parts[0]);if(!c)return null;
 let node=DETAILED_FORMS[c.name];
 if(c.name==='title')parts.splice(1,1); // the next token is the recipient; then the action.
 for(const part of parts.slice(1,4)){if(node&&typeof node==='object'&&!Array.isArray(node)){node=node[part];if(typeof node==='string')return node;}else break;}
 return typeof node==='string'?node:c.syntax;
}
export function commandImplementation(name){
 const n=canonicalName(name);
 if(isServerOnly(n))return '서버 미연결';
 if(['help','seed','time','tp','particle','difficulty','weather','toggledownfall','gamerule','give','clear','kill','setblock','fill','testfor','testforblock','testforblocks','clone','summon','setworldspawn','spawnpoint','say','me','msg','tellraw','scoreboard','execute'].includes(n))return '부분 실행';
 return '문법 안내만 지원';
}
export function activeHelp(input){const {name,index}=suggestionLocation(input);const cmd=commandByName(name);return cmd?{...cmd,syntax:detailedSyntax(input),activeArgument:Math.min(Math.max(0,cmd.args.length-1),index)}:null;}
export const COMMAND_CATALOG_REFERENCE=Object.freeze({version:'Java Edition 1.8.9',canonical:59,aliases:3,source:'1.8.9.jar assets/minecraft/lang/en_US.lang'});
