// Survival eating rules for the current native food subset (no game assets bundled).
// 1.8-era food points and saturation modifiers; this is not the complete food registry.
export const FOODS=Object.freeze({115:Object.freeze({hunger:4,saturation:.3,seconds:1.6}),116:Object.freeze({hunger:5,saturation:.6,seconds:1.6})});
export const foodFor=id=>FOODS[id]??null;
export function eatHeld(inventory,index,survival){
 const slot=inventory?.[index],food=foodFor(slot?.id);
 if(!food||!Number.isInteger(slot?.count)||slot.count<=0||survival?.dead||survival.hunger>=20)return false;
 survival.consume(food.hunger,food.saturation);slot.count-=1;
 if(slot.count===0){slot.id=0;slot.count=0;delete slot.damage;}
 return true;
}
