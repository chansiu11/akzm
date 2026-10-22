// Browser-only accessible command palette. All suggestions use textContent (no user HTML).
import {COMMANDS, suggestions, activeHelp, executeCommand} from './commands.js';
import {commandImplementation} from './command-catalog.js';

export function setupCommandUI({onOpen,onClose,onResult,context}){
 const $=id=>document.getElementById(id);
 const panel=$('commandPanel'), input=$('commandInput'), choices=$('commandChoices'), detail=$('commandDetail'), output=$('commandOutput');
 let open=false,selection=0,matching=[],history=[],historyIndex=-1,tabCycle=null;
 const viewport=window.visualViewport;
 function keyboardInset(){
  if(!open)return;
  const bottom=viewport?Math.max(0,Math.round(window.innerHeight-viewport.height-viewport.offsetTop)):0;
  document.documentElement.style.setProperty('--command-keyboard-inset112',bottom+'px');
 }
 viewport?.addEventListener('resize',keyboardInset);
 viewport?.addEventListener('scroll',keyboardInset);
 function isOpen(){return open}
 function render(){
  if(!open)return;matching=suggestions(input.value,context());selection=Math.min(selection,Math.max(0,matching.length-1));choices.replaceChildren();
  if(!matching.length){const label=document.createElement('div');label.className='command-empty';label.textContent='제안 없음 · /help로 사용 가능한 명령어 확인';choices.append(label)}
  matching.slice(0,8).forEach((m,i)=>{const b=document.createElement('button');b.type='button';b.className='command-choice'+(selection===i?' selected':'');
   const name=document.createElement('b');name.textContent=m.label;const desc=document.createElement('small');desc.textContent=m.description;b.append(name,desc);
   b.addEventListener('pointerdown',e=>e.preventDefault());b.addEventListener('click',()=>{selection=i;complete()});choices.append(b)});
  const cmd=activeHelp(input.value);detail.replaceChildren();
  if(!cmd){const p=document.createElement('div');p.textContent='명령어 이름을 입력하면 세부 인수가 표시됩니다. Tab: 자동완성 · ↑↓: 선택 · Enter: 실행 · Esc: 닫기';detail.append(p);return}
  const title=document.createElement('strong');title.textContent=cmd.syntax;const desc=document.createElement('p');desc.textContent=cmd.description;detail.append(title,desc);const status=document.createElement('small');status.textContent='구현 상태: '+commandImplementation(cmd.name);detail.append(status);
  const group=document.createElement('div');group.className='command-arguments';
  cmd.args.forEach((a,i)=>{const chip=document.createElement('span');chip.className='command-arg'+(cmd.activeArgument===i?' active':'');chip.textContent=(a.optional?'[':'<')+a.name+(a.optional?']':'>');chip.title=a.choices?.join(', ')||'';group.append(chip)});detail.append(group);
  const sample=document.createElement('code');sample.textContent='예: '+cmd.example;detail.append(sample);
 }
 function complete(){const m=matching[selection];if(!m)return;input.value=m.insert;input.focus();selection=0;tabCycle=null;render()}
 function completeTab(backwards=false){
  if(!tabCycle||tabCycle.lastValue!==input.value){tabCycle={options:suggestions(input.value,context()),index:backwards?-1:0,lastValue:input.value};}
  else tabCycle.index=(tabCycle.index+(backwards?-1:1)+tabCycle.options.length)%Math.max(1,tabCycle.options.length);
  if(!tabCycle.options.length)return;
  const candidate=tabCycle.options[tabCycle.index];input.value=candidate.insert;tabCycle.lastValue=input.value;input.focus();
  input.setSelectionRange(input.value.length,input.value.length);render();
 }
 function show(){if(open)return;open=true;selection=0;historyIndex=-1;tabCycle=null;panel.classList.remove('hidden');input.value='/';output.textContent='';onOpen();render();keyboardInset();input.focus({preventScroll:true});input.setSelectionRange(input.value.length,input.value.length)}
 function hide(resume=true){if(!open)return;open=false;panel.classList.add('hidden');document.documentElement.style.removeProperty('--command-keyboard-inset112');input.blur();if(resume)onClose()}
 function submit(){
  const line=input.value.trim();
  if(!line||line==='/'){hide(true);return null;}
  const result=executeCommand(line,context());
  history.unshift(line);history=history.slice(0,30);
  onResult?.(result);
  // 1.12.2 Enter closes chat even if the submitted command is invalid.
  hide(true);return result;
 }
 input.addEventListener('input',()=>{selection=0;tabCycle=null;render()});
 input.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();hide();return}
  if(e.key==='Tab'){e.preventDefault();completeTab(e.shiftKey);return}
  if(e.key==='ArrowDown'){e.preventDefault();if(matching.length)selection=(selection+1)%Math.min(8,matching.length);render();return}
  if(e.key==='ArrowUp'){e.preventDefault();if(matching.length)selection=(selection-1+Math.min(8,matching.length))%Math.min(8,matching.length);render();return}
  if(e.key==='Enter'){if(e.isComposing||e.keyCode===229)return;e.preventDefault();e.stopPropagation();submit();return}
  e.stopPropagation();
 });
 $('commandSubmit').addEventListener('click',submit);
 $('commandClose').addEventListener('click',()=>hide());
 $('commandHelp').addEventListener('click',()=>{input.value='/help ';render();input.focus()});
 return {show,hide,isOpen};
}
