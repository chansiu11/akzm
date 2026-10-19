# AKZM — Block World

Independent browser voxel building game with classic 1.8-inspired menus. User-supplied 1.8.9 textures/models are bundled as the default resource pack. Synthesized audio; no original protocol compatibility.

## Run

Node.js 22 or newer:

```sh
npm ci
npm start
```

Open http://localhost:3000. `npm test` tests deterministic terrain and a real multi-client WebSocket session.

## Multiplayer

1. Create/open a singleplayer world.
2. Escape → LAN 서버 열기. Enter a **4–12 digit room number**.
3. A friend opens the same deployed URL → 멀티플레이 and enters that exact number, including leading zeroes.
4. Positions, building and chat synchronize through the server (up to 12 players).

The number is an application room code, **not a TCP port**. No router configuration is needed. Rooms close when the host disconnects. The host browser saves edits locally every five seconds and when leaving. Export JSON backups from the world menu. Render memory is temporary; no cloud persistence is claimed. Each server instance has its own room registry, so deploy **one instance**.

## Controls

WASD move, mouse look, Space jump, double-tap Space or F toggle creative flight, Space/Shift ascend/descend, left click break, right click place, E inventory, 1–9 hotbar, T multiplayer chat, Escape menu. Controls can be rebound. Touch controls and drag-to-look are included.

## Implemented

Survival/creative selection, saved 36-slot inventory, 2×2 / 3×3 crafting with exported legacy recipes, shared position-based furnaces, shared chests, four-slot armor with defense/durability, tool repair, swimming/air/drowning/suffocation/fall damage, health/hunger/food, mining and tool durability, simple animals/zombies, day/night, rain, a documented command subset, and classic-inspired UI.

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for exact boundaries. A searchable item ID is not a claim that all of that item's original behaviors work. This is not a complete Minecraft reimplementation.

## Data

`npm run export-data` regenerates `public/catalog.json` from pinned minecraft-data 3.100.0. The committed JSON is served directly; that development dependency is not required at runtime. See THIRD_PARTY_NOTICES.md.

## Render deployment

Use a Node web service linked to `chansiu11/akzm`, branch `main`, build `npm ci`, start `npm start`, health path `/health`. One instance. Select **manual deploy** (auto-deploy off). No secret variables required. The service hosts both the client and WebSocket endpoint, so use the Render URL for both singleplayer and multiplayer. GitHub Pages can run singleplayer via the included root entry and vendored Three.js files. It cannot host WebSocket rooms; use the Render URL directly or enter it under Settings → Multiplayer Server on the Pages client.

## Visual update

Per-face original 16px pixel art now distinguishes grass sides/bottom, log end grain, crafting-table faces and bookshelves. Cutout foliage/glass and separately rendered translucent water replace solid placeholders. Textured isometric inventory/hotbar icons, held blocks with swing animation, a compact classic hotbar and F3-toggle debug display are included. The earlier procedural textures remain fallbacks; the built-in pack now supplies original PNGs. Browser visual verification remains pending.

## Local resource packs

Settings → Resource Packs accepts a 1.8 resource-pack ZIP, a local `1.8.9.jar`, or an extracted `assets/minecraft/textures` folder. ZIP entries are decoded locally; no game code is executed or uploaded. Supported block textures, legacy-named item PNGs, and `gui/widgets.png` button/hotbar crops are applied and stored only in that browser. This is not a full pack loader, and original assets from the user-supplied JAR are now included.

## Dimensions, structures and creatures

Create a **new world** for generator 4 seeded structures. Existing worlds keep their original central terrain; their surroundings now stream as well. Overworld structures include a village, desert/jungle temples, witch hut, stronghold, dungeon, mineshaft, ocean monument and desert well. The Nether has lava, quartz and a fortress; the End has an island, pillars, crystals and a Dragon. These are compact independent templates, not original seed-compatible layouts.

- Build a 4×5 obsidian frame (2×3 opening), then use flint and steel inside. Stay in the active portal to travel.
- Fill all twelve stronghold portal frames with Eyes of Ender. Kill the Dragon to open its return portal; living crystals heal it.
- Creative: Escape → 차원 이동, or E → 생물 소환. Spawn eggs work in either game mode. `/summon` accepts legacy names and selected variant tags (`SkeletonType:1`, `Elder:1`, horse `Type`, etc.).
- Extra convenience commands: `/dimension overworld|nether|end`, `/locate stronghold` (or another structure identifier). These extensions are not vanilla 1.8 commands.
- Right-click creatures to milk cows, shear sheep, feed/breed compatible animals, tame wolves/ocelots/horses, saddle/mount horses or use the two basic villager trades. Sneak to dismount. Snow/iron golem and Wither block arrangements can summon their mob.
- Settings → Controls → **PC / 모바일** explicitly selects keyboard/mouse or touch controls, saved per browser.

The registry includes all concrete base mob names in the 1.8.9 dataset and major variants (40 mob/variant entries, plus End crystal). It does **not** mean every original AI behavior, texture, loot table or boss phase is identical. Detailed differences are documented in IMPLEMENTATION_STATUS.md. Redstone remains deferred.

## Static entry fix

The repository root now has `index.html` redirecting to `public/` and `.nojekyll`; it no longer depends on README rendering as the Pages entry. The game uses relative bundled Three.js URLs. `npm run prepare:static` refreshes those vendor files when dependencies change.

## Streaming and mobile controls

Overworld/Nether terrain streams in 16×16 chunks as the player moves, including negative X/Z. Distant meshes unload; up to 400 generated chunks are cached and block edits survive eviction/save/rejoin. X/Z are bounded at ±29,999,984 and terrain height remains 40 blocks. The 1.8-inspired End remains a central island surrounded by void. Generator 4 uses smooth seeded terrain and regional structure candidates filtered by biome/slope. This is not vanilla 1.8.9 seed parity; structures remain compact independent templates.

Mobile uses a left directional pad with sneak in the middle, right jump, and separate build/break buttons. Double-tap jump or use Flight to toggle creative flight; hold jump/sneak to ascend/descend. Canvas touch-action is disabled and one captured pointer owns look independently of movement touches. Input lifecycle tests cover simultaneous fingers/cancellation; physical phone visual testing is still pending.

## Building interaction update

Hold left click to mine; hold right click to place repeatedly (200ms). Creative mining repeats at 200ms; survival mining uses the exported legacy hardness/material/harvest-tool data and 20Hz tool-speed timing, resets on target/tool changes, and waits 250ms between ordinary breaks. A ten-stage crack overlay replaces the separate progress bar; resource-pack destroy stages override the fallback. Mobile short taps use/place at the crosshair; a stationary 350ms hold mines until released. Dragging does not place. Dedicated buttons remain available. Middle click selects a targeted block in creative.

This does not implement every vanilla interaction: underwater/airborne mining penalties, enchantments, dropped-item entities, placement orientation/state and full non-cube geometry remain incomplete. Original source PNGs are now bundled from the user-supplied JAR. Imported single-layer item sprites are displayed unchanged; potion/leather/egg tint layers and animated item models are not fully reproduced. A ZIP import does not guarantee every vanilla texture/model has been implemented.

Mining data: PrismarineJS/minecraft-data 1.8.9, with hardness/tool timing informed by https://github.com/PrismarineJS/prismarine-block .

## Commands, combat and touch HUD

PC T opens chat; `/` opens commands prefilled with slash. Mobile top buttons open chat, pause and commands; Pause also links to commands. Examples fill the input, and Apply/Send executes it. Singleplayer updates save immediately; multiplayer retains host-only command authority. Added `/fill` (4096 blocks, height 1–39), `/kill @e`, and `/kill @e[type=Zombie]` alongside the existing supported subset.

Mobile tapping a targeted mob attacks it; the Attack button also attacks/mines while held. Body hitboxes replace thin model-mesh targeting and validate reach/walls on both paths. A red hurt flash confirms damage. Use remains separate for feeding/trading/milking. Buckets collect and place water/lava, with inventory conservation; Nether water evaporates. Milk clears the implemented poison state.

Fallback pixel sprites now distinguish food, armor, buckets, bow, arrows, bottles, eggs, shears, books and bones instead of lettered boxes. These drawings are original approximations. User-imported resource-pack textures still take precedence; no claim of pixel identity or complete original item mechanics is made. Full bow/fishing/potion/enchantment mechanics and physical mobile visual QA remain outstanding.

## Built-in 1.8.9 resources

The supplied JAR was read as a ZIP without executing Java. All 1058 texture files (1043 PNGs plus 15 metadata files), 1595 model definitions and 340 block-state definitions are extracted into browser JSON bundles. The manifest retains every source path, size and SHA256. Startup automatically applies mapped block faces, item sprites/model icons, entity skins, HUD/widgets, crack stages and dirt menu background; personal packs load afterward. 562 item/metadata icons are prebuilt from the model definitions.

176 previously unavailable modeled block/item variants are appended after the original 57 world IDs. Their element geometry and textures render from the supplied model JSON; solid element bounds drive local player collision. Existing saves retain their IDs. 20 cat/horse/rabbit/villager texture variants can be summoned, use their base species AI and persist through save/rejoin. The catalog already contained all 336 base item IDs and all concrete base mob types, so decorative overlays and GUI images are not invented as new species.

Extraction is complete; rendering/behavior parity is not. Unused assets remain in the bundles for future support: full fonts, banners, armor overlays, paintings and all container screens are not universally wired. Some mob UVs/body geometry remain approximations; additional block orientation, connected states, animation metadata, rotations in collision, non-cube server sight checks and functional workstation behavior are incomplete. Additional stairs/slabs are static model variants. Redstone is deferred. No claim that the JAR’s original Java AI or gameplay has been ported is made.

Re-extract: `python scripts/extract-builtin-pack.py /path/to/1.8.9.jar`; regenerate appended model registry: `node scripts/export-builtin-blocks.mjs`. Keep previously published appended IDs stable when extending the registry.
