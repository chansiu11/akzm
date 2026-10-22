// Only caller-supplied original Java 1.12.2 language entries are displayed.
// Do not bundle Mojang locale text in the public game.
const EXACT_KEYS=Object.freeze({
 fall:'death.attack.fall',
 drown:'death.attack.drown',
 starve:'death.attack.starve',
 void:'death.attack.outOfWorld',
 mob:'death.attack.mob',
 generic:'death.attack.generic'
});
export function deathMessageKey112(cause,attacker=null){
 if(cause==='mob'&&!attacker)return EXACT_KEYS.generic;
 return EXACT_KEYS[cause]??EXACT_KEYS.generic;
}
export function formatOwnerDeath112(translations,cause,{name='Player',attacker=null}={}){
 const key=deathMessageKey112(cause,attacker);
 const message=translations?.[key];
 if(typeof message!=='string'||message.length>220)return '';
 if(key==='death.attack.mob'&&!attacker)return '';
 const vars=[name,attacker??''];
 // Vanilla lang files use Java MessageFormat-style numbered %1$s / %2$s.
 return message.replace(/%(?:(\d+)\$)?s|%%/g,(part,n)=>{
  if(part==='%%')return '%';
  const index=n?Number(n)-1:0;
  if(!Number.isInteger(index)||index<0||index>=vars.length)return '';
  return String(vars[index]).slice(0,64);
 });
}
