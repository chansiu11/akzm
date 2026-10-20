# Vanilla Java Edition 1.12.2 conversion: staged work and parity gates

**Top priority is the real in-game HUD**, while later stages are ordered by complexity. The game is still an independent web project, not a copy of original Minecraft Java code.

Original comparison material: the owner's official `1.12.2.jar`, SHA-1 `0f275bc1547d01fa5f56ba34bdc87d981ee12daf`; GUI PNGs were inspected and are 256x256. They are never committed. The user imports their own 1.12.2.jar in the title menu and sprites are applied privately in the browser.

## Stage 1: Gameplay HUD and visual user interface

**1.1 Implemented:** Hotbar background and selection frame from `widgets.png`; crosshair, health, hunger, oxygen and XP from `icons.png`; original UI icon coordinates and logical sizes; fix reversed hunger fill direction and hide block target debug readout in gameplay. Persist user-imported UI in the local browser; also load supported block textures from the same JAR. Test source-level sprite coordinates and input validity.

**Still different from vanilla; do not mark finished:** inventory equipment/crafting layouts, recipe book, XP levels/gain, armor/offhand HUD, status effects, item sprite artwork, first-person hands/animation, boss bars, titles, advanced tooltips, selection animation, font, chat, menus, screenshot-by-screenshot parity. Actual browser visual screenshot comparison has not been completed.

## Stage 2: World simulation (large/high-complexity)

Same-seed biome/height/dimension generation, caves, structures, fluids and block lighting. For each seed, compare vanilla coordinate snapshots and correct differences.

## Stage 3: Registries and mechanics

1.12.2 blocks, variants, items, tools, crafting/smelting, drops, block geometry, material physics and interactions. Compare test vectors item by item.

## Stage 4: Redstone and block entities

Propagation, scheduled ticks, pistons, comparators, hoppers, inventories and serialization; compare tick-by-tick circuits.

## Stage 5: Mobs, AI and combat

All vanilla mobs/AI goals and spawn mechanics, movement/collisions, 1.9+ melee cooldown, armor, potions, enchantments. Verify reference results.

## Stage 6: Progression and dimensions

XP, advancements, farming, breeding, trading, Nether, End, bosses, death and save formats.

## Stage 7: Commands, networking and regression review

Full 1.12.2 command syntax and permissions, online session behavior. The current sample websocket server is *not* protocol compatible.

### Parity gate performed at the END OF EVERY stage

Re-run HUD screenshots at matching resolution/GUI-scale/health/food/air/XP, check inventory and held item, compare actual Java 1.12.2 gameplay, test save and mobile, run automated test suite. Any visual/function mismatch is explicitly **open**, not silently marked identical. Repeat repairs before declaring parity. Keep original JAR/resources out of GitHub. 
