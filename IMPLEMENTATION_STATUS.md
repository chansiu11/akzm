# Implementation status

This is an independently implemented browser game, not a complete or pixel-identical Minecraft 1.8.9 clone. This matrix distinguishes data registration from behavior.

| Area | Implemented | Remaining differences |
| --- | --- | --- |
| Items | 336 legacy item ID records and metadata variants; searchable creative catalog | Most non-block icons are schematic. Specialized item behavior is not universal. |
| Crafting | 1,031 exported recipe records, shaped/mirrored/shapeless matching, 2×2 / nearby workbench 3×3, actual stack consumption, bucket returns | Two-tool repair now retains repaired durability. Dynamic NBT recipes (written books, banner designs, firework data) and armor dyeing still require separate logic. |
| Inventory | 36 slots, four functional armor slots, stack merging/splitting, nine-slot hotbar, save/load | Drag/drop parity and original GUI textures not complete. No offhand slot: Java 1.8 did not have one. |
| World blocks | 43 non-air voxel entries, face textures and some transparency | Stairs/slabs/doors/fences and all original blocks/states not implemented. Decorative TNT is not explosive. |
| Survival | Health/hunger, food, simple regeneration, mining times, pickaxe harvest tiers, tool/armor durability, armor defense, swimming, air/drowning, suffocation, landing-based fall damage, respawn | Simplified balance. Death keeps inventory. No fire/lava/status-effect system. Multiplayer uses server-sampled positions for environmental damage; movement is not fully server-authoritative. |
| Furnaces | Position-based shared three-slot furnaces, fuel burn timers, 10-second output processing, retained remaining heat, saved input/output/progress, lava-bucket returns | XP yield is simplified to one per output. Legacy per-player pending jobs finish for save compatibility. Lit furnace block art and hoppers are absent. Nonempty furnaces/chests must be emptied before mining. |
| Chests | Shared 27-slot container transfers and host snapshot persistence | No chest animation/double chests; guest inventory only lives in the active room. |
| Creatures | Pig, cow, sheep and zombie; roaming/chase/melee/drops; server simulation in multiplayer | Other mobs, breeding, navigation parity, ranged attacks, bosses and day burning not implemented. |
| Environment | Deterministic custom terrain, flat world, trees, new-world ores, time cycle, simple rain | 64×64×40 finite map, no original seed algorithm, biomes/caves/structures/dimensions or fluid flow. |
| Commands | /help /seed /give /clear /gamemode /time /tp /setblock /summon /kill /spawnpoint /weather | Only documented subset/options; host-only multiplayer commands; /summon supports four implemented creatures. Thunder is visual rain/darkening only. |
| Multiplayer | 4–12 digit rooms, up to 12 players, shared blocks/chat/chests/mobs, server inventory/crafting validation | Host leaving closes room; no account-based inventory persistence, anti-cheat or cross-instance room service. |
| Visuals | Classic-inspired menus, textured hotbar/hand/block faces, health/hunger/XP/armor/air HUD, four-slot armor inventory and furnace progress panels | Original art, fonts, layouts and all original screens are not reproduced exactly. |
| Resource packs | Local 1.8 block/item PNG folder import, legacy item filename aliases, widgets.png buttons/hotbar crops, first-frame block sampling, browser persistence | Not a full resource-pack loader; no zip, custom models, entities, full container GUI, font or animation metadata. Original images must be supplied locally; no original assets are bundled. |
| Advanced systems | Not yet implemented | Redstone simulation, brewing, enchanting, farming, trading, all structures, Nether, End and boss progression. |

## Verification

Node tests cover seed determinism, actual WebSocket room lifecycle, recipe recognition, atomic crafting, returned containers, smelting, survival mining constraints, chest conservation and save restoration. JavaScript syntax checks pass. Browser rendering and pixel comparison have not been verified in this execution environment.

## Latest validation

The expanded suite additionally covers armor persistence and mitigation, drowning and fall behavior, shared furnace transfers, combined short fuels, retained burn time, blocked output, repaired durability, and container inventory conservation. Client JavaScript syntax passes; browser/pixel visual comparison is still pending.
