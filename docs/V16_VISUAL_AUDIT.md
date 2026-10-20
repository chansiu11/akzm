# Voxel Frontier v1.6 — visual redesign (original assets)

## What changed

1. Entire menu presentation: original pixel-art scenic background drawn in Canvas, gray beveled rectangular buttons, redesigned title, world selection, settings and pause pages.
2. In-game HUD: 9-slot dark pixel toolbar, explicit selected slot border, CSS-generated heart and food icons, oxygen bubbles, XP bar as a decorative placeholder (no gameplay XP level implemented yet), centered thin crosshair, block-break progress bar.
3. In-world textures: original procedural per-block details for dirt, grass, grass sides, stone, ores, cobblestone, sandstone, bricks, planks, wood bark/endgrain, leaves, water, glass, containers and lamps. No official commercial game textures included.
4. First-person view-model: locally constructed voxel arm, sleeve and held-block cuboid rendered with a depth-clear after the world; simple walking bob and attack swing.
5. Mobile: existing dedicated direction/jump/sneak/menu controls preserved and restyled; game touch gestures unchanged.
6. Cache busting: v1.6 references for CSS, game entry script and atlas module to avoid stale appearances.

## Validated

* `node --test`: 158/158 pass after 6 additional visual-regression tests.
* `node --check` of changed JS modules: pass.
* Actual Chromium screenshots of the static menu and in-game HUD at 1440×900 and 390×844 using an isolated document fixture.

## Limitations / not claimed

* Real WebGL gameplay could not be opened in the automated browser in this container (`net::ERR_BLOCKED_BY_ADMINISTRATOR` on localhost); the three-dimensional world, hand depth/composition, movement, and mobile play were NOT visually verified in-game.
* The menu scenery is an original drawn pixel-landscape, not a direct 3-D copy of another game's panorama.
* The procedural block textures were not copied from commercial texture sheets; exact visual/lighting equivalence is neither claimed nor intended.
* User-progress data stored in localStorage is left intact. World generation and server protocol were not modified.
* Multiplayer, command runtime and gameplay feature completion remain unrelated work.

Additional visual pass: pickaxes use separate original CSS silhouettes in inventory/hotbar and geometric haft/head meshes in first person, instead of displaying ordinary blocks. The held apple and bread icons now use their own atlas indices.
