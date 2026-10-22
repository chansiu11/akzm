// Block and shape data for the independently written sandbox.
// Keep numeric 0..13 IDs stable for previously saved worlds and inventories.
const cube = Object.freeze([[0,0,0,1,1,1]]);
const none = Object.freeze([]);
const base = [
 [0,'Air','minecraft:air',0,'none','empty',false],
 [1,'Grass','minecraft:grass',0,'opaque','cube',true],
 [2,'Dirt','minecraft:dirt',1,'opaque','cube',true],
 [3,'Stone','minecraft:stone',2,'opaque','cube',true],
 [4,'Sand','minecraft:sand',3,'opaque','cube',true],
 [5,'Oak Log','minecraft:log',4,'opaque','cube',true],
 [6,'Oak Leaves','minecraft:leaves',5,'cutout','cube',true],
 [7,'Oak Planks','minecraft:planks',6,'opaque','cube',true],
 [8,'Water','minecraft:water',7,'water','cube',false],
 [9,'Cobblestone','minecraft:cobblestone',8,'opaque','cube',true],
 [10,'Coal Ore','minecraft:coal_ore',9,'opaque','cube',true],
 [11,'Snow Block','minecraft:snow',10,'opaque','cube',true],
 [12,'Bricks','minecraft:brick_block',11,'opaque','cube',true],
 [13,'Bedrock','minecraft:bedrock',12,'opaque','cube',true],
 [14,'Glass','minecraft:glass',15,'glass','cube',true],
 [15,'Oak Slab','minecraft:wooden_slab',6,'opaque','slab',true],
 [16,'Oak Stairs','minecraft:oak_stairs',6,'opaque','stairs',true],
 [17,'Crafting Table','minecraft:crafting_table',16,'opaque','cube',true],
 [18,'Iron Ore','minecraft:iron_ore',19,'opaque','cube',true],
 [19,'Gold Ore','minecraft:gold_ore',20,'opaque','cube',true],
 [20,'Diamond Ore','minecraft:diamond_ore',21,'opaque','cube',true],
 [21,'Gravel','minecraft:gravel',22,'opaque','cube',true],
 [22,'Sandstone','minecraft:sandstone',23,'opaque','cube',true],
 [23,'Clay','minecraft:clay',24,'opaque','cube',true],
 [24,'Spruce Log','minecraft:log',25,'opaque','cube',true],
 [25,'Spruce Leaves','minecraft:leaves',26,'cutout','cube',true],
 [26,'Lapis Ore','minecraft:lapis_ore',27,'opaque','cube',true],
 [27,'Redstone Ore','minecraft:redstone_ore',28,'opaque','cube',true],
 [28,'Emerald Ore','minecraft:emerald_ore',29,'opaque','cube',true],
 [29,'Chest','minecraft:chest',30,'opaque','cube',true],
 [30,'Furnace','minecraft:furnace',31,'opaque','cube',true],
 [31,'Lever','minecraft:lever',32,'cutout','post',false],
 [32,'Lamp','minecraft:redstone_lamp',33,'opaque','cube',true]
];
export const BLOCK=Object.freeze({AIR:0,GRASS:1,DIRT:2,STONE:3,SAND:4,LOG:5,LEAVES:6,PLANKS:7,WATER:8,COBBLE:9,COAL:10,SNOW:11,BRICK:12,BEDROCK:13,GLASS:14,SLAB:15,STAIRS:16,CRAFTING_TABLE:17,IRON_ORE:18,GOLD_ORE:19,DIAMOND:20,GRAVEL:21,SANDSTONE:22,CLAY:23,SPRUCE_LOG:24,SPRUCE_LEAVES:25,LAPIS_ORE:26,REDSTONE_ORE:27,EMERALD_ORE:28,CHEST:29,FURNACE:30,LEVER:31,LAMP:32});
const hardness=Object.freeze({1:.6,2:.5,3:1.5,4:.5,5:2,6:.2,7:2,9:2,10:3,11:.2,12:2,13:-1,14:.3,15:2,16:2,17:2.5,18:3,19:3,20:3,21:.6,22:.8,23:.6,24:2,25:.2,26:3,27:3,28:3,29:2.5,30:3.5,31:.5,32:.3});
export const BLOCK_DEFS=Object.freeze(base.map(([id,name,key,tile,layer,model,solid])=>Object.freeze({
 id,name,key,tile,layer,model,solid,hardness:hardness[id]??0,
 interact:id===BLOCK.CRAFTING_TABLE?'crafting':id===BLOCK.CHEST?'chest':id===BLOCK.FURNACE?'furnace':id===BLOCK.LEVER?'lever':null,
 states:model==='slab'?Object.freeze({half:['bottom','top']}):model==='stairs'?Object.freeze({facing:['north','south','east','west']}):id===BLOCK.LEVER||id===BLOCK.LAMP?Object.freeze({powered:[false,true]}):Object.freeze({})
})));
export const BLOCK_NAMES=Object.freeze(BLOCK_DEFS.map(d=>d.name));
export function definition(id){return BLOCK_DEFS[id]??null}
export function validBlock(id){return Number.isInteger(id)&&!!definition(id)}
export function normalizeState(id,state={}){
 const d=definition(id);if(!d)return null;
 const input=state&&typeof state==='object'&&!Array.isArray(state)?state:{};
 const result={};for(const [key,choices] of Object.entries(d.states))result[key]=choices.includes(input[key])?input[key]:choices[0];
 return result;
}
export function isValidState(id,state){
 const def=definition(id);if(!def||!state||typeof state!=='object'||Array.isArray(state))return false;
 const allowed=Object.keys(def.states);
 return Object.keys(state).every(k=>allowed.includes(k)&&def.states[k].includes(state[k]));
}
export function blockBoxes(block){
 const id=typeof block==='number'?block:block?.id;const d=definition(id);
 if(!d||!d.solid)return none;
 const s=normalizeState(id,typeof block==='number'?{}:block.state);
 if(d.model==='post')return [[.35,0,.35,.65,.48,.65]];
 if(d.model==='slab')return s.half==='top'?[[0,.5,0,1,1,1]]:[[0,0,0,1,.5,1]];
 if(d.model==='stairs'){
  const step={north:[0,.5,0,1,1,.5],south:[0,.5,.5,1,1,1],east:[.5,.5,0,1,1,1],west:[0,.5,0,.5,1,1]};
  return [[0,0,0,1,.5,1],step[s.facing]];
 }
 return cube;
}
// Water occupies a full shape for drawing but is not collision-solid.
export function renderBoxes(block){
 const def=definition(typeof block==='number'?block:block?.id);
 if(!def||def.model==='empty')return none;
 if(def.model==='post')return [[.35,0,.35,.65,.48,.65]];
 return def.layer==='water'?cube:blockBoxes(block);
}
export function occupied(boxes,x,y,z){return boxes.some(b=>x>=b[0]&&x<b[3]&&y>=b[1]&&y<b[4]&&z>=b[2]&&z<b[5])}
export function intersectsAABB(boxes,bx,by,bz,ax0,ay0,az0,ax1,ay1,az1){
 return boxes.some(b=>ax0<bx+b[3]&&ax1>bx+b[0]&&ay0<by+b[4]&&ay1>by+b[1]&&az0<bz+b[5]&&az1>bz+b[2]);
}
export function tileForBlock(id,normal){
 if(id===BLOCK.GRASS)return normal[1]===1?0:normal[1]===-1?1:13;
 if(id===BLOCK.LOG)return normal[1]!==0?14:4;
 if(id===BLOCK.SPRUCE_LOG)return normal[1]!==0?40:25;
 if(id===BLOCK.FURNACE)return normal[1]!==0?37:normal[2]===1?31:36;
 if(id===BLOCK.SANDSTONE)return normal[1]===1?38:normal[1]===-1?39:23;
 if(id===BLOCK.CHEST)return normal[1]!==0?42:normal[2]===1?43:41;
 if(id===BLOCK.CRAFTING_TABLE)return normal[1]===1?16:normal[1]===-1?6:normal[2]===1?18:17;
 return definition(id)?.tile??2;
}
