export function blocksBrowserShortcut112(e,{playing=false,editing=false}={}){
 if(!playing||editing)return false;
 if(e.altKey)return ['ArrowLeft','ArrowRight','Home'].includes(e.code);
 if(e.ctrlKey||e.metaKey)return ['KeyW','KeyR','KeyS','KeyP','KeyF','KeyD','KeyL','KeyO','Equal','Minus','Digit0','NumpadAdd','NumpadSubtract'].includes(e.code);
 return ['Space','Tab','Backspace','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown','F3','F5','F6'].includes(e.code);
}
export const isTextInput112=element=>!!element&&(element.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(element.tagName));
