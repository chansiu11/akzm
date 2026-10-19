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

WASD move, mouse look, Space jump, F toggle creative flight, Space/Shift ascend/descend, left click break, right click place, E inventory, 1–9 hotbar, T multiplayer chat, Escape menu. Controls can be rebound. Touch controls and drag-to-look are included.

## Implemented

Survival/creative selection, saved 36-slot inventory, 2×2 / 3×3 crafting with exported legacy recipes, shared position-based furnaces, shared chests, four-slot armor with defense/durability, tool repair, swimming/air/drowning/suffocation/fall damage, health/hunger/food, mining and tool durability, simple animals/zombies, day/night, rain, a documented command subset, and classic-inspired UI.

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for exact boundaries. A searchable item ID is not a claim that all of that item's original behaviors work. This is not a complete Minecraft reimplementation.

## Data

`npm run export-data` regenerates `public/catalog.json` from pinned minecraft-data 3.100.0. The committed JSON is served directly; that development dependency is not required at runtime. See THIRD_PARTY_NOTICES.md.

## Render deployment

Use a Node web service linked to `chansiu11/akzm`, branch `main`, build `npm ci`, start `npm start`, health path `/health`. One instance. Select **manual deploy** (auto-deploy off). No secret variables required. The service hosts both the client and WebSocket endpoint, so use the Render URL for both singleplayer and multiplayer. GitHub Pages alone cannot run this server.

## Visual update

Per-face original 16px pixel art now distinguishes grass sides/bottom, log end grain, crafting-table faces and bookshelves. Cutout foliage/glass and separately rendered translucent water replace solid placeholders. Textured isometric inventory/hotbar icons, held blocks with swing animation, a compact classic hotbar and F3-toggle debug display are included. These are original approximations, not pixel-identical Minecraft textures. Browser visual verification remains pending.

## Local resource packs

Settings → Resource Packs accepts an extracted `assets/minecraft/textures` folder. Supported block textures, legacy-named item PNGs, and `gui/widgets.png` button/hotbar crops are applied and stored only in that browser. This is not a full pack loader, and no original assets are included.
