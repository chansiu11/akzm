# AKZM — Block World

Independent browser voxel building game with classic 1.8-inspired menus. Original procedural textures and synthesized audio; no Minecraft assets or protocol compatibility.

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

Per-face original 16px pixel art now distinguishes grass sides/bottom, log end grain, crafting-table faces and bookshelves. Cutout foliage/glass and separately rendered translucent water replace solid placeholders. Textured isometric inventory/hotbar icons, held blocks with swing animation, a compact classic hotbar and F3-toggle debug display are included. These are original approximations, not pixel-identical Minecraft textures. Browser visual verification remains pending.

## Local resource packs

Settings → Resource Packs accepts an extracted `assets/minecraft/textures` folder. Supported block textures, legacy-named item PNGs, and `gui/widgets.png` button/hotbar crops are applied and stored only in that browser. This is not a full pack loader, and no original assets are included.

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
