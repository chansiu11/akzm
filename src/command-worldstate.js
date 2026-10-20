// Prototype-only per-world scoreboard/game-rule state. Vanilla server semantics remain partial.
export const DEFAULT_RULES=Object.freeze({commandBlockOutput:true,doDaylightCycle:true,doEntityDrops:true,doFireTick:true,doMobLoot:true,doMobSpawning:true,doTileDrops:true,keepInventory:false,logAdminCommands:true,mobGriefing:true,naturalRegeneration:true,randomTickSpeed:3,reducedDebugInfo:false,sendCommandFeedback:true,showDeathMessages:true});
export class CommandWorldState{
 constructor(saved={}){
  this.rules={...DEFAULT_RULES,...(saved.rules&&typeof saved.rules==='object'?saved.rules:{})};
  this.worldSpawn=Array.isArray(saved.worldSpawn)&&saved.worldSpawn.length===3?saved.worldSpawn:null;
  this.personalSpawn=Array.isArray(saved.personalSpawn)&&saved.personalSpawn.length===3?saved.personalSpawn:null;
  this.board={objectives:new Map(Array.isArray(saved.objectives)?saved.objectives:[]),scores:new Map(Array.isArray(saved.scores)?saved.scores:[]),teams:new Map(Array.isArray(saved.teams)?saved.teams:[])};
 }
 getRule(name){return this.rules[name]}
 setRule(name,value){if(!Object.hasOwn(DEFAULT_RULES,name))return false;this.rules[name]=value;return true;}
 serialize(){return {rules:{...this.rules},worldSpawn:this.worldSpawn?this.worldSpawn.slice():null,personalSpawn:this.personalSpawn?this.personalSpawn.slice():null,objectives:[...this.board.objectives],scores:[...this.board.scores],teams:[...this.board.teams]};}
}
