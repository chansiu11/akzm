# Implementation status

This is an independently implemented browser game, not a complete or pixel-identical Minecraft 1.8.9 clone. This matrix distinguishes data registration from behavior.

| Area | Implemented | Remaining differences |
| --- | --- | --- |
| Items | 336 legacy item ID records and metadata variants; searchable creative catalog | Most non-block icons are schematic. Specialized item behavior is not universal. |
| Crafting | 1,031 exported recipe records, shaped/mirrored/shapeless matching, 2×2 / nearby workbench 3×3, actual stack consumption, bucket returns | Dynamic NBT recipes (written books, banner designs, firework data), armor dyeing and repair recipes require separate logic. |
| Inventory | 36 slots, stack merging/splitting, nine-slot hotbar, save/load | Drag/drop parity, armor/offhand layouts and original GUI textures not complete. |
| World blocks | 43 non-air voxel entries, face textures and some transparency | Stairs/slabs/doors/fences and all original blocks/states not implemented. Decorative TNT is not explosive. |
| Survival | Health/hunger, food, simple regeneration, mining times, pickaxe harvest tiers, tool durability, respawn | Simplified balance. Death keeps inventory. Singleplayer fall damage only; no underwater air/suffocation/fire system. |
| Furnaces | Fuel duration, 10-second output processing, stack consumption and persisted jobs | Job belongs to player, not a shared world tile entity. Unused fuel time is not retained after batch completion. |
| Chests | Shared 27-slot container transfers and host snapshot persistence | No chest animation/double chests; guest inventory only lives in the active room. |
| Creatures | Pig, cow, sheep and zombie; roaming/chase/melee/drops; server simulation in multiplayer | Other mobs, breeding, navigation parity, ranged attacks, bosses and day burning not implemented. |
| Environment | Deterministic custom terrain, flat world, trees, new-world ores, time cycle, simple rain | 64×64×40 finite map, no original seed algorithm, biomes/caves/structures/dimensions or fluid flow. |
| Commands | /help /seed /give /clear /gamemode /time /tp /setblock /summon /kill /spawnpoint /weather | Only documented subset/options; host-only multiplayer commands; /summon supports four implemented creatures. Thunder is visual rain/darkening only. |
| Multiplayer | 4–12 digit rooms, up to 12 players, shared blocks/chat/chests/mobs, server inventory/crafting validation | Host leaving closes room; no account-based inventory persistence, anti-cheat or cross-instance room service. |
| Visuals | Classic-inspired menus, textured hotbar/hand/block faces, health/hunger/XP and inventory panels | Original art, fonts, layouts and all original screens are not reproduced exactly. |
| Resource packs | Local 1.8 block PNG folder import, first-frame sampling, browser persistence | Not a full resource-pack loader; no zip, custom models, entities, GUI or animation metadata. |
| Advanced systems | Not yet implemented | Redstone simulation, brewing, enchanting, farming, trading, all structures, Nether, End and boss progression. |

## Verification

Node tests cover seed determinism, actual WebSocket room lifecycle, recipe recognition, atomic crafting, returned containers, smelting, survival mining constraints, chest conservation and save restoration. JavaScript syntax checks pass. Browser rendering and pixel comparison have not been verified in this execution environment.
