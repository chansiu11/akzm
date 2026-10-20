# 2026-10-21 container UI continuation audit

Base: da20dcf4cf129719f401f83c6e4114b6b01b603f.

## Implemented in this increment
- Inventory and crafting table: 176 x 166 logical panel, 27 storage slots and nine hotbar slots; separate 2 x 2 / 3 x 3 crafting coordinates and output positions.
- Single chest: 176 x 168 panel, 27 container slots, player storage and hotbar. Two-part owner-local generic chest background.
- Furnace: separate input/fuel/output slots, progress arrow and remaining-coal flame.
- Item icons and counts replace text buttons. Existing transfers and crafting rules retained.
- Searchable guide for the implemented recipes with pattern and ingredient legend. It is NOT vanilla recipe book parity: no unlock database, ghost ingredients, auto-placement, categories, or vanilla typography.
- Owner-only browser JAR importer now includes chest, furnace and recipe-book PNG paths. Older four-image private caches retain HUD support; reimport is needed for new backgrounds. No original images/JARs were extracted or committed.
- Desktop HUD bottom offset is zero. Touch offset retained.

## Validation
- Node regression: 173 passed, 0 failed. Seven added behavioral tests cover coordinate bounds, non-overlap, output positions, old private caches, optional-asset rejection and recipe filtering.
- The initial 165/166 result was an environment restriction on the default temporary directory. Both server persistence tests pass with TEMP/TMP inside the writable workspace; production persistence code was unchanged.
- JavaScript syntax checked.
- Browser visual validation BLOCKED: provided browser could not reach the local server (ERR_CONNECTION_TIMED_OUT). No actual Java 1.12.2 runtime was accessible through the available browser surfaces. Prior conversation attachments are archived ZIP references, not a running vanilla reference.
- No screenshot parity claim. Coordinates remain subject to real Java screenshot verification.

## Open gates and later stages
1. UI: actual Java screenshots, armor/offhand controls and state, player preview, vanilla font/item rendering, cursor pickup/drag/shift-click behavior, recipe book parity, status effects, XP and attack indicators. Current transfers remain prototype interactions.
2. World/lighting: same-seed terrain, caves/structures, complete fluids and propagated sky/block light remain open; current lighting is approximate.
3. Blocks/items/redstone: full 1.12.2 registries/metadata, recipes, item models, scheduled ticks, pistons/hoppers/comparators remain open.
4. Mobs/combat: complete mob roster/goals/spawning, 1.9+ attack cooldown and full equipment/effects remain open.
5. Survival/dimensions: full XP/advancements, Nether/End, bosses, breeding/trading remain open.
6. Commands/network: current command subset still targets 1.8.9; no vanilla protocol compatibility or Anvil/NBT save compatibility.

The requested final stage has NOT been reached. Later stages cannot be declared vanilla-correct on the basis of these UI/unit tests.

## Public Pages browser follow-up
- Public game rendered with WebGL. Entered a world, opened the new inventory, searched the Korean recipe name, and displayed its pattern/ingredient legend using real browser controls. This used independent fallback images, not the owner JAR.
- Found and fixed a clipped recipe panel at GUI scale 3: opening it shifts the combined panel to fit; narrow screens use an overlay.
- Cache versions updated. Inventory closes the pause overlay; title-screen E and scrolling a recipe panel no longer operate gameplay controls.
- GitHub CI and Pages for db159c0 both succeeded. Real Java/JAR comparison and chest/furnace browser interaction remain open.
