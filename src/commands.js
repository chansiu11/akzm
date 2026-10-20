// Java Edition 1.8.9-inspired command syntax. Only the subset documented here is implemented.
import {BLOCK, BLOCK_NAMES, MAX_Y, SEED} from './terrain.js';

export const COMMANDS = Object.freeze([
  {name:'help', syntax:'/help [명령어]', description:'지원하는 명령어와 사용법 확인', example:'/help time', args:[{name:'명령어', choices:['time','tp','setblock','fill','particle'],optional:true}]},
  {name:'time', syntax:'/time <set|add|query> <값>', description:'월드 시간 설정, 증가, 확인 (24000틱 = 하루)', example:'/time set day', args:[{name:'작업',choices:['set','add','query']},{name:'시간 / 틱',choices:['day','night','0','6000','12000','18000']}]},
  {name:'tp', syntax:'/tp <x> <y> <z>', description:'자신을 지정 좌표로 순간이동 (상대좌표 ~ 지원)', example:'/tp ~ ~5 ~', args:[{name:'X',choices:['~','~1','0']},{name:'Y',choices:['~','~5','10']},{name:'Z',choices:['~','~-1','0']}]},
  {name:'setblock', syntax:'/setblock <x> <y> <z> <블록>', description:'한 위치의 블록 변경', example:'/setblock ~ ~-1 ~ stone', args:[{name:'X',choices:['~','~1']},{name:'Y',choices:['~','~-1']},{name:'Z',choices:['~','~1']},{name:'블록',choices:['stone','dirt','grass','sand','air','planks','cobblestone']}]},
  {name:'fill', syntax:'/fill <x1> <y1> <z1> <x2> <y2> <z2> <블록>', description:'직육면체 영역 채우기 (최대 4096블록)', example:'/fill ~ ~-1 ~ ~3 ~-1 ~3 stone', args:[{name:'X1',choices:['~']},{name:'Y1',choices:['~']},{name:'Z1',choices:['~']},{name:'X2',choices:['~3']},{name:'Y2',choices:['~3']},{name:'Z2',choices:['~3']},{name:'블록',choices:['stone','dirt','air','planks']}]},
  {name:'particle', syntax:'/particle <이름> <x> <y> <z> <dx> <dy> <dz> <속도> [개수] [normal|force]', description:'지정 위치에 파티클 생성 (일부 이름만 지원)', example:'/particle flame ~ ~1 ~ 1 1 1 0.1 30', args:[{name:'종류',choices:['flame','smoke','cloud','crit','reddust']},{name:'X',choices:['~']},{name:'Y',choices:['~1']},{name:'Z',choices:['~']},{name:'DX',choices:['0','0.5','1']},{name:'DY',choices:['0','0.5','1']},{name:'DZ',choices:['0','0.5','1']},{name:'속도',choices:['0','0.1','0.5']},{name:'개수',choices:['1','10','30','100'],optional:true},{name:'표시 방식',choices:['normal','force'],optional:true}]},
  {name:'gamerule', syntax:'/gamerule doDaylightCycle [true|false]', description:'낮밤 시간 자동 흐름 켜기·끄기', example:'/gamerule doDaylightCycle false', args:[{name:'규칙',choices:['doDaylightCycle']},{name:'설정',choices:['true','false'],optional:true}]},
  {name:'seed', syntax:'/seed', description:'현재 세계 지형 생성 시드 출력', example:'/seed', args:[]}
]);

const SHORT_BLOCKS=Object.freeze({air:BLOCK.AIR,grass:BLOCK.GRASS,grass_block:BLOCK.GRASS,dirt:BLOCK.DIRT,stone:BLOCK.STONE,sand:BLOCK.SAND,log:BLOCK.LOG,log_oak:BLOCK.LOG,leaves:BLOCK.LEAVES,planks:BLOCK.PLANKS,water:BLOCK.WATER,cobblestone:BLOCK.COBBLE,coal_ore:BLOCK.COAL,snow:BLOCK.SNOW,brick_block:BLOCK.BRICK,bricks:BLOCK.BRICK,bedrock:BLOCK.BEDROCK});
export function blockFromName(value){const text=String(value??'').toLowerCase().replace(/^minecraft:/,'');return Object.hasOwn(SHORT_BLOCKS,text)?SHORT_BLOCKS[text]:null;}
export function coordinate(token,origin){if(typeof token!=='string')throw Error('좌표가 빠졌습니다.');const raw=token.startsWith('~')?token.slice(1):token;const n=raw===''&&token.startsWith('~')?0:Number(raw);if(!Number.isFinite(n)||raw.trim()!==raw||raw===''){
 if(token==='~')return origin;
 throw Error('좌표에는 숫자 또는 ~를 입력하세요.');
 }return token.startsWith('~')?origin+n:n;}
export function position(args,base){if(args.length!==3)throw Error('좌표 X Y Z 3개를 입력하세요.');return args.map((part,i)=>coordinate(part,base[i]));}
export function suggestions(text){const input=String(text||'').replace(/^\//,'');const pieces=input.trimStart().split(/\s+/);const commandName=pieces[0]?.toLowerCase()||'';
 if(pieces.length===1)return COMMANDS.filter(c=>c.name.startsWith(commandName)).map(c=>({label:'/'+c.name,insert:'/'+c.name+' ',description:c.description}));
 const command=COMMANDS.find(c=>c.name===commandName);if(!command)return [];
 const argIndex=pieces.length-2;const arg=command.args[argIndex];if(!arg)return [];
 const prefix=pieces.at(-1)?.toLowerCase()||'';const base=input.slice(0,input.length-prefix.length);
 return (arg.choices||[]).filter(c=>c.toLowerCase().startsWith(prefix)).map(c=>({label:c,insert:'/'+base+c+(argIndex===command.args.length-1?'':' '),description:arg.name}));
}
export function activeHelp(input){const text=String(input||'').replace(/^\//,'').trimStart();const parts=text.split(/\s+/);const cmd=COMMANDS.find(c=>c.name===parts[0]?.toLowerCase());if(!cmd)return null;
 const argIndex=Math.max(0,parts.length-2);return {...cmd,activeArgument:Math.min(cmd.args.length-1,argIndex)};
}
const between=(val,min,max,label)=>{if(!Number.isFinite(val)||val<min||val>max)throw Error(`${label}: ${min}~${max} 범위여야 합니다.`);return val;};
const int=(value,min,max,label)=>{const n=Number(value);if(!/^[-+]?\d+$/.test(String(value))||!Number.isInteger(n))throw Error(`${label}에 정수를 입력하세요.`);return between(n,min,max,label);};
const getCoords=(data,ctx)=>position(data,ctx.position());
const validHeight=y=>{if(!Number.isInteger(y)||y<1||y>MAX_Y)throw Error(`블록 Y 좌표는 1~${MAX_Y}여야 합니다.`);};
function blockArg(value){const id=blockFromName(value);if(id===null)throw Error(`미지원 블록: ${value}. /setblock ~ ~-1 ~ stone 처럼 입력하세요.`);return id;}
export function executeCommand(input,ctx){
 const line=String(input||'').trim();if(!line.startsWith('/'))return {ok:false,message:'명령어는 /로 시작해야 합니다.'};
 const [raw,...args]=line.slice(1).trim().split(/\s+/);const name=raw?.toLowerCase();
 try{
 switch(name){
  case 'help':{
   if(args.length>1)throw Error('/help [명령어]');
   const c=COMMANDS.find(v=>v.name===args[0]?.replace(/^\//,'').toLowerCase());
   if(args.length&& !c)throw Error('지원하지 않는 명령어입니다. /help로 확인하세요.');
   return {ok:true,message:c?`${c.syntax} — ${c.description}`:'명령어: '+COMMANDS.map(c=>'/'+c.name).join(', ')};}
  case 'seed':{if(args.length)throw Error('/seed');return {ok:true,message:'Seed: '+SEED};}
  case 'time':{
   if(args.length!==2)throw Error('/time <set|add|query> <값>');
   const [mode,rawValue]=args;
   if(mode==='query'){
    if(!['daytime','gametime','day'].includes(rawValue))throw Error('query daytime 또는 query gametime을 사용하세요.');
    return {ok:true,message:`현재 시간: ${Math.floor(ctx.getTime())}틱`};
   }
   if(mode==='set'){
    const ticks=({day:1000,night:13000,noon:6000,midnight:18000})[rawValue]??int(rawValue,0,2147483647,'시간');
    ctx.setTime(ticks);return {ok:true,message:`월드 시간을 ${ticks}틱으로 설정했습니다.`};
   }
   if(mode==='add'){
    const n=int(rawValue,0,2147483647,'시간');ctx.setTime(ctx.getTime()+n);return {ok:true,message:`시간을 ${n}틱 증가시켰습니다.`};
   }
   throw Error('time의 작업은 set, add, query 중 하나입니다.');}
  case 'tp':{
   if(args.length!==3)throw Error('/tp <x> <y> <z>');const xyz=getCoords(args,ctx);xyz.forEach((n,i)=>between(n,i===1?1:-30000000,i===1?MAX_Y+6:30000000,'좌표'));
   if(!ctx.teleport(...xyz))throw Error('해당 좌표로 이동할 수 없습니다.');
   return {ok:true,message:`순간이동: ${xyz.map(n=>n.toFixed(1)).join(' / ')}`};}
  case 'setblock':{
   if(args.length!==4)throw Error('/setblock <x> <y> <z> <블록>');const coords=getCoords(args.slice(0,3),ctx).map(Math.floor);validHeight(coords[1]);const id=blockArg(args[3]);
   if(!ctx.setBlock(...coords,id))throw Error('블록 변경 실패');return {ok:true,message:`${coords.join(', ')} → ${BLOCK_NAMES[id]}`};}
  case 'fill':{
   if(args.length!==7)throw Error('/fill <x1> <y1> <z1> <x2> <y2> <z2> <블록>');const p1=getCoords(args.slice(0,3),ctx).map(Math.floor),p2=getCoords(args.slice(3,6),ctx).map(Math.floor);validHeight(p1[1]);validHeight(p2[1]);const id=blockArg(args[6]);
   const from=p1.map((n,i)=>Math.min(n,p2[i])),to=p1.map((n,i)=>Math.max(n,p2[i]));const volume=from.reduce((acc,n,i)=>acc*(to[i]-n+1),1);
   if(volume>4096)throw Error('성능 보호를 위해 한 번에 최대 4096블록만 변경할 수 있습니다.');
   const count=ctx.fill(from,to,id);return {ok:true,message:`${count}개 블록을 ${BLOCK_NAMES[id]}(으)로 변경했습니다.`};}
  case 'gamerule':{
   if(args[0]!=='doDaylightCycle'||args.length>2)throw Error('/gamerule doDaylightCycle [true|false]');
   if(args.length===1)return {ok:true,message:`doDaylightCycle = ${ctx.getDaylightCycle()}`};
   if(!['true','false'].includes(args[1]))throw Error('설정은 true 또는 false입니다.');ctx.setDaylightCycle(args[1]==='true');return {ok:true,message:`doDaylightCycle = ${args[1]}`};}
  case 'particle':{
   if(args.length<8||args.length>10)throw Error('/particle <이름> <x> <y> <z> <dx> <dy> <dz> <속도> [개수] [normal|force]');
   const type=args[0];if(!['flame','smoke','cloud','crit','reddust'].includes(type))throw Error('현재 지원: flame, smoke, cloud, crit, reddust');
   const coords=getCoords(args.slice(1,4),ctx),delta=args.slice(4,7).map(n=>between(Number(n),0,16,'범위'));
   const speed=between(Number(args[7]),0,10,'속도');const count=args[8]!==undefined?int(args[8],0,240,'개수'):1;
   if(args[9]!==undefined&&!['force','normal'].includes(args[9]))throw Error('표시 방식은 force 또는 normal입니다.');
   ctx.particle(type,coords,delta,speed,count);return {ok:true,message:`${type} 파티클 ${count}개 생성`};}
  default: throw Error(`알 수 없는 명령어입니다: /${name||''} · /help로 확인하세요.`);
 }
 }catch(e){return {ok:false,message:e.message||'명령어 오류'};}
}
