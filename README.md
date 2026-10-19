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

- Main menu, world selection/create/rename/delete/import/export, pause, LAN and multiplayer entry screens.
- Functional video/FOV/brightness/render-distance/resolution/cloud/bobbing settings, sound volume, rebinding and touch controls, saved locally.
- Deterministic custom terrain / flat worlds, trees, 25 block entries including air, face-culled chunk meshes, collision and creative flight.
- Block selection/placement/removal, local world persistence and room synchronization.
- Input validation, room collision handling, message size/rate limits, heartbeat, health endpoint.

## Not implemented / compatibility boundaries

This is a creative alpha, not a complete Minecraft 1.8.9 reimplementation. Survival, recipes, inventory stacks, mobs, damage, redstone machinery, physics for fluids/sand, dimensions, original seeds and all original settings/screens are not implemented. The map is finite (64×64×40); decorative TNT/workbench/bookshelf blocks have no machinery behavior. No Minecraft account, client or server protocol compatibility. Multiplayer is casual shared building, not an anti-cheat-secured competitive server. Room numbers are shared join credentials, not account authentication.

## Render deployment

Use a Node web service linked to `chansiu11/akzm`, branch `main`, build `npm ci`, start `npm start`, health path `/health`. One instance. Select **manual deploy** (auto-deploy off). No secret variables required. The service hosts both the client and WebSocket endpoint, so use the Render URL for both singleplayer and multiplayer. GitHub Pages alone cannot run this server.
