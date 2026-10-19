# Implementation status

This is an independently implemented browser game, not a complete or pixel-identical Minecraft 1.8.9 clone. This matrix distinguishes data registration from behavior.

| Area | Implemented | Remaining differences |
| --- | --- | --- |
| Items | 336 legacy item ID records and metadata variants; searchable creative catalog | Most non-block icons are schematic. Specialized item behavior is not universal. |
| Crafting | 1,031 exported recipe records, shaped/mirrored/shapeless matching, 2×2 / nearby workbench 3×3, actual stack consumption, bucket returns | Two-tool repair now retains repaired durability. Dynamic NBT recipes (written books, banner designs, firework data) and armor dyeing still require separate logic. |
| Inventory | 36 slots, four functional armor slots, stack merging/splitting, nine-slot hotbar, save/load | Drag/drop parity and original GUI textures not complete. No offhand slot: Java 1.8 did not have one. |
| World blocks | 56 non-air voxel entries, face textures and some transparency | Stairs/slabs/doors/fences and all original blocks/states not implemented. Decorative TNT is not explosive. |
| Survival | Health/hunger, food, simple regeneration, mining times, pickaxe harvest tiers, tool/armor durability, armor defense, swimming, air/drowning, suffocation, landing-based fall damage, respawn | Simplified balance. Death keeps inventory. Lava/fire and simple poison added; full status-effect interactions are absent. Multiplayer uses server-sampled positions for environmental damage; movement is not fully server-authoritative. |
| Furnaces | Position-based shared three-slot furnaces, fuel burn timers, 10-second output processing, retained remaining heat, saved input/output/progress, lava-bucket returns | XP yield is simplified to one per output. Legacy per-player pending jobs finish for save compatibility. Lit furnace block art and hoppers are absent. Nonempty furnaces/chests must be emptied before mining. |
| Chests | Shared 27-slot container transfers and host snapshot persistence | No chest animation/double chests; guest inventory only lives in the active room. |
| Creatures | All concrete base mob names in the pinned 1.8.9 entity dataset resolve to models; 40 mob/variant types plus End crystal. Species shapes, melee, ranged projectiles, Creeper explosions, Guardian charging, neutral anger, daylight burning, Slime splitting, simple breeding/taming/milking/shearing/trading, horse saddle/mount, golem/Wither construction, Dragon/crystal/exit loop | Simplified AI, original models/textures/animation not reproduced exactly. No complete pathfinding, all professions/trades, genetics/horse stats, child growth, status effects, boss phase parity, jockey composition or full loot/enchantment tables. |
| Environment | Separate Overworld/Nether/End worlds, portals, per-dimension edits/containers/mobs/host saves; new generator 3 adds nine Overworld structure templates, Nether fortress and End pillars/exit; time/rain and new lava blocks | Each dimension remains 64×64×40. Templates are not original structure layouts/seed placement. No original biome/cave algorithm, portal coordinate scaling/link search, fluid flow or full End credits/progression. Old generators preserve terrain and do not receive new Overworld structures. |
| Commands | /help /seed /give /clear /gamemode /time /tp /setblock /summon /kill /spawnpoint /weather, custom /dimension and /locate | Only documented subset/options; host-only multiplayer commands. /dimension and /locate are convenience extensions, not claims of vanilla 1.8 command parity. /summon supports registered types and selected legacy variant tags. Thunder is visual rain/darkening only. |
| Multiplayer | 4–12 digit rooms, up to 12 players, shared blocks/chat/chests/mobs, dimension-isolated block/entity replication, server inventory/crafting validation | Host leaving closes room; no account-based inventory persistence, anti-cheat or cross-instance room service. |
| Visuals | Classic-inspired menus, textured hotbar/hand/block faces, health/hunger/XP/armor/air HUD, four-slot armor inventory and furnace progress panels, pixel HUD icons, species models and boss bars, PC/mobile control selector | Original art, fonts, layouts and all original screens are not reproduced exactly. |
| Resource packs | Local 1.8 block/item PNG folder import, legacy item filename aliases, widgets.png buttons/hotbar crops and icons.png HUD crops, first-frame block sampling, browser persistence | Not a full resource-pack loader; no zip, custom models, entities, full container GUI, font or animation metadata. Original images must be supplied locally; no original assets are bundled. |
| Advanced systems | Redstone explicitly deferred by user | Brewing, enchanting, farming, full trading and full original engine parity remain incomplete. |

## Verification

Node tests cover seed determinism, actual WebSocket room lifecycle, recipe recognition, atomic crafting, returned containers, smelting, survival mining constraints, chest conservation and save restoration. JavaScript syntax checks pass. Browser rendering and pixel comparison have not been verified in this execution environment.

## Latest validation

The expanded suite additionally covers armor persistence and mitigation, drowning and fall behavior, shared furnace transfers, combined short fuels, retained burn time, blocked output, repaired durability, and container inventory conservation. Client JavaScript syntax passes; browser/pixel visual comparison is still pending.

## Dimension / creature update validation

Tests cover deterministic dimension generation and safe spawn, preserving generators 1/2, twelve-frame End activation, both Nether frame orientations, all base entity-name mappings and model bounds, projectiles/line-of-sight, Creeper blast, creature interactions, constructed mobs and Dragon exit. Real WebSocket clients test dimension-isolated broadcasts, travel, edit retention and snapshot restoration. No browser screenshot comparison was performed.
