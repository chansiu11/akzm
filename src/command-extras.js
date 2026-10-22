// Strict 1.8.9-compatible command subset. All unimplemented operations fail closed.
import {BLOCK_DEFS} from './block-registry.js';
import {ITEM_DEFS} from './item-registry.js';
import {COMMANDS,ALIASES,commandByName,isServerOnly} from './command-catalog.js';
import {position,coordinate,executeCommand} from './commands.js';

const ERROR_UNAVAILABLE='이 명령어의 1.12.2 동작에 필요한 게임/서버 시스템이 아직 구현되지 않았습니다. 등록된 문법·Tab 안내만 이용할 수 있습니다.';
const ok=(message,extra={})=>({ok:true,message,...extra});
const fail=(message)=>({ok:false,message});
const requireContext=(ctx,key)=>{if(typeof ctx[key]!=='function')throw Error(`현재 게임에서 지원하지 않는 동작: ${key}`);return ctx[key]};
const number=(v,min,max,label='값')=>{if(v===undefined||v===''||!Number.isFinite(Number(v)))throw Error(`${label}: 숫자가 필요합니다.`);const n=Number(v);if(n<min||n>max)throw Error(`${label}: ${min}~${max} 범위`);return n;};
const integer=(v,min,max,label)=>{const n=number(v,min,max,label);if(!Number.isInteger(n))throw Error(`${label||'값'}: 정수여야 합니다.`);return n;};
const modeValue={survival:'survival',creative:'creative',adventure:'adventure',spectator:'spectator',0:'survival',1:'creative',2:'adventure',3:'spectator'};
const difficultyValue={peaceful:'peaceful',easy:'easy',normal:'normal',hard:'hard',0:'peaceful',1:'easy',2:'normal',3:'hard'};
function getItemId(s){const v=String(s||'').toLowerCase();const entry=ITEM_DEFS.find(i=>i.key.toLowerCase()===v||i.key.replace(/^minecraft:/,'').toLowerCase()===v);return entry?.id??null;}
function getBlockId(s){const v=String(s||'').toLowerCase();if(v==='air'||v==='minecraft:air')return 0;const entry=BLOCK_DEFS.find(i=>i.key.toLowerCase()===v||i.key.replace(/^minecraft:/,'').toLowerCase()===v);return entry?.id??null;}
function singlePlayer(token,ctx){const players=ctx.players?.()||['Player'];return token===undefined||token==='@p'||token==='@a'||token==='@r'||token===players[0]||token==='Player';}
function target(token,ctx){if(!singlePlayer(token,ctx))throw Error('현재 로컬 세계에서는 자기 자신만 대상으로 지정할 수 있습니다.');}
function three(tokens,ctx){const p=position(tokens,ctx.position());return p.map(Math.floor);}
function box(a,b){const from=a.map((n,i)=>Math.min(n,b[i])),to=a.map((n,i)=>Math.max(n,b[i]));return {from,to,volume:from.reduce((s,n,i)=>s*(to[i]-n+1),1)};}
const requireVolume=v=>{if(v>4096)throw Error('성능 보호: 한 번에 최대 4096블록을 처리합니다.');};
const ensureHeight=(p,ctx)=>{if(p[1]<1||p[1]>(ctx.maxY?.()??255))throw Error('월드 범위를 벗어난 Y 좌표입니다.');};
function worldBlock(ctx,x,y,z){return requireContext(ctx,'getBlock')(x,y,z);}
function worldSet(ctx,x,y,z,id){return requireContext(ctx,'setBlock')(x,y,z,id);}
function namedBlock(value){const id=getBlockId(value);if(id===null)throw Error('미구현 블록 ID: '+value);return id;}
function namedItem(value){const id=getItemId(value);if(id===null)throw Error('미구현 아이템 ID: '+value);return id;}
function nbtUnsupported(args){if(args.some(s=>s.trim().startsWith('{')))throw Error('NBT 데이터 태그는 아직 실행되지 않습니다.');}

export function executeExtended(input,ctx={}){
 const line=String(input||'').trim();if(!line.startsWith('/'))return fail('명령어는 /로 시작해야 합니다.');
 const [raw,...a]=line.slice(1).split(/\s+/);const name=ALIASES[raw?.toLowerCase()]||raw?.toLowerCase();
 const meta=commandByName(name);if(!meta)return fail('Java 1.8.9에 없는 명령어: /'+(raw||''));
 if(isServerOnly(name))return fail(`/`+name+': 서버 관리 명령어입니다. 현재 연결된 바닐라 멀티플레이 서버/권한 시스템이 없어 실행하지 않습니다.');
 try{
 switch(name){
 case 'help':case '?':{
  if(a.length>1)throw Error(meta.syntax);
  if(!a.length)return ok(`${COMMANDS.length}개 원작 명령어 + 별칭 3개를 등록했습니다. 상세 문법: /help <명령어> (일부만 실제 실행 가능)`);
  const c=commandByName(a[0]);if(!c)throw Error('지원하지 않는 명령어: '+a[0]);return ok(`${c.syntax} — ${c.description}${c.serverOnly?' (서버 전용)':''}`);
 }
 case 'seed':if(a.length)throw Error(meta.syntax);return ok('Seed: '+(ctx.getSeed?.()??18909));
 case 'effect':{
  if(a.length<2||a.length>5)throw Error(meta.syntax);
  target(a[0],ctx);
  if(a[1]==='clear'){
   if(a.length!==2)throw Error(meta.syntax);
   requireContext(ctx,'setNightVision')(0);
   return ok('Applied potion effects cleared');
  }
  const name=a[1].toLowerCase();
  if(!['16','night_vision','minecraft:night_vision'].includes(name))
   throw Error('Only Minecraft Java 1.12.2 night_vision is supported in this web client.');
  const seconds=a[2]===undefined?30:integer(a[2],0,1000000,'seconds');
  const amplifier=a[3]===undefined?0:integer(a[3],0,255,'amplifier');
  if(amplifier!==0)throw Error('Night vision supports amplifier 0 only.');
  if(a[4]!==undefined&&!['true','false'].includes(a[4]))throw Error(meta.syntax);
  requireContext(ctx,'setNightVision')(seconds);
  return ok(seconds===0?'Night vision removed':'Night vision: '+seconds+'s');
 }
 case 'difficulty':{
  if(a.length!==1||!Object.hasOwn(difficultyValue,a[0]))throw Error(meta.syntax);
  requireContext(ctx,'setDifficulty')(difficultyValue[a[0]]);return ok('난이도: '+difficultyValue[a[0]]);
 }
 case 'weather':{
  if(a.length<1||a.length>2||!['clear','rain','thunder'].includes(a[0]))throw Error(meta.syntax);
  const seconds=a[1]===undefined?600:integer(a[1],1,1000000,'기간');requireContext(ctx,'setWeather')(a[0],seconds);return ok('날씨: '+a[0]);
 }
 case 'toggledownfall':{
  if(a.length)throw Error(meta.syntax);const old=requireContext(ctx,'getWeather')();const w=old==='clear'?'rain':'clear';requireContext(ctx,'setWeather')(w,600);return ok('날씨: '+w);
 }
 case 'gamerule':{
  if(a.length<1||a.length>2)throw Error(meta.syntax);
  const names=['commandBlockOutput','doDaylightCycle','doEntityDrops','doFireTick','doMobLoot','doMobSpawning','doTileDrops','keepInventory','logAdminCommands','mobGriefing','naturalRegeneration','randomTickSpeed','reducedDebugInfo','sendCommandFeedback','showDeathMessages'];
  if(!names.includes(a[0]))throw Error('Java 1.8.9 규칙 이름을 사용하세요.');
  if(!['doDaylightCycle','keepInventory'].includes(a[0]))throw Error('현재 이 게임에서는 해당 규칙이 실제 동작에 연결되지 않았습니다.');
  if(a.length===1)return ok(a[0]+' = '+(ctx.getRule?.(a[0])??(a[0]==='doDaylightCycle'?ctx.getDaylightCycle?.():'지원하지 않음')));
  if(a[0]==='randomTickSpeed'){integer(a[1],0,65535);throw Error('randomTickSpeed의 실제 블록 랜덤 틱 시스템이 아직 없습니다.');}
  if(!['true','false'].includes(a[1]))throw Error('true 또는 false를 입력하세요.');
  if(a[0]==='doDaylightCycle'&&!ctx.setRule)requireContext(ctx,'setDaylightCycle')(a[1]==='true');else requireContext(ctx,'setRule')(a[0],a[1]==='true');return ok(`${a[0]} = ${a[1]}`);
 }
 case 'tp':{
  if(![1,2,4,6].includes(a.length))throw Error(meta.syntax);
  if(a.length<=2)throw Error('대상 플레이어로 이동하는 명령어는 이 세계에 단일 플레이어만 있어 실행할 수 없습니다.');
  target(a[0],ctx);const pos=position(a.slice(1,4),ctx.position());
  if(a.length===6){number(a[4],-36000,36000,'Yaw');number(a[5],-36000,36000,'Pitch');}
  requireContext(ctx,'teleport')(...pos);return ok('순간이동: '+pos.join(' / '));
 }
 case 'execute':{
  if(a.length<5)throw Error(meta.syntax);target(a[0],ctx);
  if((ctx._commandDepth??0)>5)throw Error('명령어 재귀 실행 제한');
  const p=position(a.slice(1,4),ctx.position());let offset=4;
  if(a[4]==='detect'){
   if(a.length<11)throw Error(meta.syntax);
   const q=position(a.slice(5,8),p).map(Math.floor),id=namedBlock(a[8]),data=a[9];
   if(data!=='-1'&&data!=='0')throw Error('블록 메타데이터 감지 미지원');
   if(worldBlock(ctx,...q)!==id)throw Error('execute detect 조건 불일치');offset=10;
  }
  const nested=a.slice(offset).join(' ');if(!nested)throw Error('실행할 명령어가 필요합니다.');
  return executeCommand('/'+nested.replace(/^\//,''),{...ctx,position:()=>p,_commandDepth:(ctx._commandDepth??0)+1});
 }
 case 'give':{
  if(a.length<2||a.length>5)throw Error(meta.syntax);target(a[0],ctx);nbtUnsupported(a.slice(4));const id=namedItem(a[1]);
  if(a[3]!==undefined&&a[3]!=='0')throw Error('데이터 값별 변형은 아직 지원하지 않습니다.');
  const count=a[2]===undefined?1:integer(a[2],1,2304,'수량');
  const left=requireContext(ctx,'giveItem')(id,count);return ok(`${ITEM_DEFS.find(i=>i.id===id).name}: ${count-left}개 지급`);
 }
 case 'clear':{
  if(a.length>5)throw Error(meta.syntax);if(a[0])target(a[0],ctx);if(a[2]!==undefined&&a[2]!=='-1'&&a[2]!=='0')throw Error('아이템 데이터 값별 제거 미지원');nbtUnsupported(a.slice(4));
  const item=a[1]===undefined?null:namedItem(a[1]);const limit=a[3]===undefined?Infinity:integer(a[3],0,99999,'수량');
  const removed=requireContext(ctx,'clearItem')(item,limit);return ok('인벤토리에서 '+removed+'개 제거');
 }
 case 'kill':{
  if(a.length>1)throw Error(meta.syntax);target(a[0],ctx);requireContext(ctx,'killSelf')();return ok('플레이어 제거 요청');
 }
 case 'setworldspawn':{
  if(a.length!==0&&a.length!==3)throw Error(meta.syntax);const p=a.length?three(a,ctx):ctx.position().map(Math.floor);ensureHeight(p,ctx);requireContext(ctx,'setWorldSpawn')(p);return ok('월드 스폰 위치: '+p.join(' '));
 }
 case 'spawnpoint':{
  const offset=a.length===4?1:0;if(![0,1,3,4].includes(a.length))throw Error(meta.syntax);if(offset||a.length===1)target(a[0],ctx);
  const p=a.length>=3?three(a.slice(offset),ctx):ctx.position().map(Math.floor);ensureHeight(p,ctx);requireContext(ctx,'setSpawnpoint')(p);return ok('부활 위치: '+p.join(' '));
 }
 case 'testfor':{
  if(a.length!==1)throw Error(meta.syntax);
  if(a[0]==='@e'){const count=ctx.entities?.().length??0;if(!count)throw Error('대상 엔티티 없음');return ok(`엔티티 ${count}개 감지`);}
  target(a[0],ctx);return ok('대상을 찾았습니다.');
 }
 case 'testforblock':{
  if(a.length<4||a.length>6)throw Error(meta.syntax);nbtUnsupported(a.slice(5));const p=three(a.slice(0,3),ctx),id=namedBlock(a[3]);ensureHeight(p,ctx);
  if(a[4]!==undefined&&a[4]!=='-1'&&a[4]!=='0')throw Error('메타데이터 검사 미지원');
  if(worldBlock(ctx,...p)!==id)throw Error('블록 불일치');return ok('블록 검사 성공: '+p.join(' '));
 }
 case 'testforblocks':{
  if(a.length<9||a.length>10)throw Error(meta.syntax);const m=a[9]??'all';if(!['all','masked'].includes(m))throw Error(meta.syntax);
  const v=box(three(a.slice(0,3),ctx),three(a.slice(3,6),ctx)),dest=three(a.slice(6,9),ctx);requireVolume(v.volume);let count=0;
  for(let x=v.from[0];x<=v.to[0];x++)for(let y=v.from[1];y<=v.to[1];y++)for(let z=v.from[2];z<=v.to[2];z++){
   const id=worldBlock(ctx,x,y,z);if(m==='masked'&&id===0)continue;
   const other=worldBlock(ctx,dest[0]+x-v.from[0],dest[1]+y-v.from[1],dest[2]+z-v.from[2]);if(id!==other)throw Error('영역 비교 불일치');count++;
  }return ok(`${count}개 블록이 일치합니다.`);
 }
 case 'clone':{
  if(a.length<9||a.length>12)throw Error(meta.syntax);const mask=a[9]??'replace',mode=a[10]??'normal';if(!['replace','masked'].includes(mask)||!['normal','force','move'].includes(mode))throw Error('현재 clone의 filtered는 블록 상태 필터 부족으로 미지원');if(a[11])throw Error('추가 블록 필터 미지원');
  const v=box(three(a.slice(0,3),ctx),three(a.slice(3,6),ctx)),dest=three(a.slice(6,9),ctx);requireVolume(v.volume);ensureHeight(v.from,ctx);ensureHeight(v.to,ctx);
  const targetBox={from:dest,to:dest.map((n,i)=>n+v.to[i]-v.from[i])};ensureHeight(targetBox.from,ctx);ensureHeight(targetBox.to,ctx);
  const overlaps=v.from.every((n,i)=>n<=targetBox.to[i]&&v.to[i]>=targetBox.from[i]);if(overlaps&&mode==='normal')throw Error('겹치는 영역: force 또는 move를 지정하세요.');
  const snapshot=[];for(let x=v.from[0];x<=v.to[0];x++)for(let y=v.from[1];y<=v.to[1];y++)for(let z=v.from[2];z<=v.to[2];z++){
   const id=worldBlock(ctx,x,y,z);if(id!==0||mask==='replace')snapshot.push([x,y,z,id]);
  }
  if(mode==='move')for(const [x,y,z] of snapshot)worldSet(ctx,x,y,z,0);
  let changed=0;for(const [x,y,z,id] of snapshot){if(worldSet(ctx,dest[0]+x-v.from[0],dest[1]+y-v.from[1],dest[2]+z-v.from[2],id))changed++;}return ok(`${changed}개 블록 복사`);
 }
 case 'setblock':{
  if(a.length<4||a.length>7)throw Error(meta.syntax);
  const p=three(a.slice(0,3),ctx),id=namedBlock(a[3]);ensureHeight(p,ctx);const data=a[4]??'0',how=a[5]??'replace';
  if(data!=='0')throw Error('블록 메타데이터 값은 아직 완전 지원하지 않습니다.');
  if(!['replace','keep','destroy'].includes(how))throw Error(meta.syntax);if(a[6])throw Error('블록 NBT 실행 미지원');
  if(how==='keep'&&worldBlock(ctx,...p)!==0)throw Error('대상 위치가 비어 있지 않습니다.');
  if(how==='destroy'&&worldBlock(ctx,...p)!==0)throw Error('destroy 모드의 블록 드롭 처리가 미완성입니다.');
  if(!worldSet(ctx,...p,id))throw Error('블록 변경 실패');return ok(p.join(', ')+' → '+a[3]);
 }
 case 'fill':{
  if(a.length<7||a.length>10)throw Error(meta.syntax);const v=box(three(a.slice(0,3),ctx),three(a.slice(3,6),ctx)),id=namedBlock(a[6]);requireVolume(v.volume);ensureHeight(v.from,ctx);ensureHeight(v.to,ctx);
  if((a[7]??'0')!=='0')throw Error('메타데이터 값 미지원');const how=a[8]??'replace';if(!['replace','keep','hollow','outline','destroy'].includes(how))throw Error(meta.syntax);if(a[9])throw Error('필터·NBT 미지원');if(how==='destroy')throw Error('destroy 드롭 처리 미지원');
  let changed=0;for(let x=v.from[0];x<=v.to[0];x++)for(let y=v.from[1];y<=v.to[1];y++)for(let z=v.from[2];z<=v.to[2];z++){
   const inside=x>v.from[0]&&x<v.to[0]&&y>v.from[1]&&y<v.to[1]&&z>v.from[2]&&z<v.to[2];
   if(how==='outline'&&inside)continue;
   if(how==='keep'&&worldBlock(ctx,x,y,z)!==0)continue;
   const finalId=how==='hollow'&&inside?0:id;if(worldBlock(ctx,x,y,z)!==finalId&&worldSet(ctx,x,y,z,finalId))changed++;
  }return ok(`${changed}개 블록 변경`);
 }
 case 'summon':{
  if(a.length<1||a.length>5)throw Error(meta.syntax);if(a.length!==1&&a.length<4)throw Error(meta.syntax);nbtUnsupported(a.slice(4));
  const coords=a.length>=4?position(a.slice(1,4),ctx.position()):ctx.position();
  requireContext(ctx,'spawnEntity')(a[0],coords);return ok('엔티티 생성: '+a[0]);
 }
 case 'say':case 'me':{
  if(!a.length)throw Error(meta.syntax);requireContext(ctx,'announce')(name==='me'?'* '+a.join(' '):a.join(' '));return ok('메시지 표시');
 }
 case 'msg':{
  if(a.length<2)throw Error(meta.syntax);target(a[0],ctx);requireContext(ctx,'announce')('[귓속말] '+a.slice(1).join(' '));return ok('메시지 전송');
 }
 case 'tellraw':{
  if(a.length<2)throw Error(meta.syntax);target(a[0],ctx);let json;try{json=JSON.parse(a.slice(1).join(' '))}catch{throw Error('올바른 JSON 텍스트가 아닙니다.');}
  // No HTML insertion; plain text only. Rich JSON text components are not yet supported.
  const text=typeof json==='string'?json:typeof json?.text==='string'?json.text:null;if(text===null)throw Error('복잡한 JSON 텍스트 컴포넌트는 미지원');requireContext(ctx,'announce')(text);return ok('텍스트 전송');
 }
 case 'playsound':{
  if(a.length<2||a.length>8)throw Error(meta.syntax);target(a[1],ctx);throw Error('1.8.9 사운드 리소스 ID·공간 음향 미연결: 아직 실행 불가');
 }
 case 'scoreboard':{
  if(a.length<2)throw Error(meta.syntax);const board=requireContext(ctx,'scoreboard')();const kind=a[0],action=a[1];
  if(kind==='objectives'){
   if(action==='list'&&a.length===2)return ok('목표: '+[...board.objectives.keys()].join(', '));
   if(action==='add'&&a.length>=4&&a[3]==='dummy'){if(board.objectives.has(a[2]))throw Error('이미 존재하는 목표');board.objectives.set(a[2],{criteria:a[3],label:a.slice(4).join(' ')||a[2]});return ok('목표 추가: '+a[2]);}
   if(action==='remove'&&a.length===3){if(!board.objectives.delete(a[2]))throw Error('없는 목표');return ok('목표 제거: '+a[2]);}
   throw Error('현재 목표는 list/add <name> dummy/remove만 실행할 수 있습니다.');
  }
  if(kind==='players'){
   if(['set','add','remove'].includes(action)&&a.length===5){const player=a[2],objective=a[3],n=integer(a[4],0,2147483647,'점수');if(!board.objectives.has(objective))throw Error('먼저 목표를 추가하세요.');const key=player+'\0'+objective,old=board.scores.get(key)??0;board.scores.set(key,action==='set'?n:action==='add'?old+n:old-n);return ok('점수: '+board.scores.get(key));}
   if(action==='list'&&a.length<=3)return ok('점수: '+[...board.scores.entries()].map(([k,v])=>k.replace('\0',' / ')+'='+v).join(', '));
   if(action==='reset'&&a.length>=3){for(const key of [...board.scores.keys()])if(key.startsWith(a[2]+'\0')&&(!a[3]||key.endsWith('\0'+a[3])))board.scores.delete(key);return ok('점수 초기화');}
   throw Error('이 scoreboard players 세부 문법은 아직 실행되지 않습니다.');
  }
  if(kind==='teams'){
   if(action==='list')return ok('팀: '+[...board.teams.keys()].join(', '));
   if(action==='add'&&a.length>=3){if(board.teams.has(a[2]))throw Error('이미 존재하는 팀');board.teams.set(a[2],{name:a.slice(3).join(' ')||a[2],players:[]});return ok('팀 추가: '+a[2]);}
   if(action==='remove'&&a.length===3){if(!board.teams.delete(a[2]))throw Error('없는 팀');return ok('팀 삭제: '+a[2]);}
   throw Error('이 scoreboard teams 세부 문법은 아직 실행되지 않습니다.');
  }
  throw Error(meta.syntax);
 }
 case 'trigger':{
  if(a.length!==3)throw Error(meta.syntax);const board=requireContext(ctx,'scoreboard')();const objective=board.objectives.get(a[0]);if(!objective||objective.criteria!=='trigger')throw Error('활성화된 trigger 목표가 필요합니다.');throw Error('서버가 플레이어별 트리거를 활성화하는 시스템이 아직 없습니다.');
 }
 default:throw Error(ERROR_UNAVAILABLE);
 }
 }catch(e){return fail(e?.message||'명령어 실행 실패');}
}
