// Split single-player world ticking from player input. Screens such as inventory,
// furnaces and chat suspend controls but do NOT suspend the running world.
export function shouldAdvanceWorld({enteredWorld=false,paused=false,dead=false}={}) {
 return Boolean(enteredWorld && !paused && !dead);
}
export function canControlPlayer({enteredWorld=false,paused=false,dead=false,inventoryOpen=false,commandOpen=false}={}) {
 return shouldAdvanceWorld({enteredWorld,paused,dead}) && !inventoryOpen && !commandOpen;
}
