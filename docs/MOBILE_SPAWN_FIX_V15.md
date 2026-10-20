# v1.5 - Safe spawn and Minecraft-style mobile controls

Scope: independently coded web voxel project `chansiu11/akzm`. Existing world/seed/blocks and game saves are not deleted or rewritten. No proprietary Minecraft mobile control artwork/assets included.

## Spawn fix
- New world start searches for a stable location with a free player-sized AABB, stable floor and dry space. If the immediate area is ocean, it performs a wider sparse-ring land search up to 256 blocks.
- If an earlier saved position overlaps a solid block, load moves the character to a nearby safe position while leaving terrain data untouched.
- Respawn coordinates are also checked before placement.
- Raycast fallback resolves the mineable block occupying the player's body even when the regular front-face raycast cannot see it.

## Touch layout
- Removed legacy round joystick and separate break/place buttons.
- Added left four-way directional pad, right jump hold and sneak toggle, small top menu/chat(in cheat-allowed worlds)/bag controls.
- Gesture on world screen: drag = rotate camera, short tap = interact/place or attack an entity, long press (0.42 seconds) = mine, release = stop mining.
- UI control artwork is original CSS/Unicode symbols and is not copied from the proprietary mobile Minecraft assets.

## Verification
- `npm test`: 152 tests passed, including spawn collision across 100 seeds, trapped save recovery, emergency block selection and mobile button structure.
- `node --check src/main.js`: passed.
- Mobile 390x844 viewport static HTML/CSS render verified via Playwright using `page.set_content` (not the actual WebGL runtime).
- Real local-host browser gameplay navigation failed with `ERR_BLOCKED_BY_ADMINISTRATOR`; real 3D gameplay and hardware touch E2E not verified.

## Limitations
- The touch arrangement is functional inspiration, not a pixel-identical reproduction of the original game.
- Full 1.8.9 physics and UI equivalence not claimed.
- The engine still relies on CDN-delivered Three.js for live play.
