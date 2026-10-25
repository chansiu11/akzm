import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {playerEyeHeight112} from '../src/player-motion112.js';
import {Survival} from '../src/survival.js';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const start=source.indexOf(' // Restore the camera even');
const end=source.indexOf(' renderer.render(scene,camera);',start);
assert.ok(start>0&&end>start);
const frame=source.slice(start,end);
test('saved dead player restores camera and reaches respawn UI without a physics tick',()=>{
 const survival=new Survival({health:0});let deaths=0,position;
 const context={playerEyeHeight112,flight112:false,keys:new Set(),mobileSneak:false,player:{x:12,y:65,z:8,pitch:.2,yaw:.4},camera:{position:{set:(...v)=>position=v},rotation:{z:0,set(){}}},survival,enteredWorld:true,loadingWorld:false,document:{body:{classList:{contains:()=>false}}},showDeath:()=>deaths++};
 vm.runInNewContext(frame,context);
 assert.deepEqual(position,[12,66.62,8]);assert.equal(deaths,1);
 survival.respawn();vm.runInNewContext(frame,context);assert.equal(deaths,1);assert.equal(survival.health,20);
});
test('restored death UI waits for world entry and loading completion',()=>{
 for(const [enteredWorld,loadingWorld,menu] of [[false,false,false],[true,true,false],[true,false,true]]){
 let deaths=0;vm.runInNewContext(frame,{playerEyeHeight112,flight112:false,keys:new Set(),mobileSneak:false,player:{x:1,y:60,z:1,pitch:0,yaw:0},camera:{position:{set(){}},rotation:{z:0,set(){}}},survival:new Survival({health:0}),enteredWorld,loadingWorld,document:{body:{classList:{contains:()=>menu}}},showDeath:()=>deaths++});assert.equal(deaths,0);
 }
});
