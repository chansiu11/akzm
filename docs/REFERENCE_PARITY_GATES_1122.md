# Java Edition 1.12.2: parity-first order and explicit acceptance gates

The owner wants a game resembling the vanilla Java 1.12.2 experience, not a generic voxel sandbox with similar CSS. The game is independently coded. Private original artwork is loaded only from an owner-provided JAR in their browser; do not commit original resources to this public repository.

## Non-negotiable review loop on EVERY stage

1. **Implement a focused correction** without breaking existing worlds or controls.
2. **Run unit/regression tests.** A passing test is not proof that vanilla parity has been achieved.
3. **Deploy GitHub Pages and open the actual public URL in Chromium** on desktop (1440x900) and mobile (390x844) through the `Deployed akzm browser screenshots` Action; inspect the screenshots/artifact, console and interactive steps. If unavailable, mark SITE REVIEW BLOCKED and never report that the live website was inspected.
4. **Compare against vanilla Java 1.12.2 separately** at matched resolution, mode and GUI scale. Real Java screenshot/gameplay comparison requires running the licensed original client, which is NOT done merely by testing CSS sprites. Mark VANILLA COMPARISON BLOCKED until matched evidence exists.
5. If mismatched, keep the feature OPEN, revise implementation and repeat. Update the issue/gap list; never say “identical” based on similarity.

### Revised build stages ordered by visual impact and complexity

| Stage | Priority/target | Gate |
| --- | --- | --- |
| **V1** | In-game HUD: correct imported sprites, hotbar, crosshair, hearts, hunger, XP, offhand, armor, titles, hit/attack and tooltip states | Matched desktop vanilla screenshots |
| **V2** | Full inventory, 2×2/3×3 crafting, chest/furnace, recipe book, cursor items, equipment and drag interactions | Screenshot and interaction comparison |
| **V3** | World visuals: complete user-local JAR block/item texture import; biome tint, atmosphere, lighting, day/night, weather, animated water/lava, fog and sky | Matched screenshot coordinates |
| **S1** | Deterministic 1.12.2 same-seed Overworld/biomes/caves/ores/structures and dimension generation | Reference seed & coordinate snapshots |
| **S2** | All block states/models, fluids, collision, drops, crafting, smelting, inventory durability | Cross-version behavioral fixtures |
| **S3** | Redstone propagation, scheduled ticks, tile entities, hoppers, pistons, containers | Tick-by-tick circuit comparison |
| **S4** | Full mobs, AI, 1.9+ combat, tool swing, movement, status effects and sound | Paired gameplay test cases |
| **S5** | Survival, XP, advancements, enchanting/brewing, villages/trading, Nether/End, bosses | End-to-end paired scenarios |
| **S6** | Commands, world saves, game modes and multiplayer; test 1.12.2 protocol only if implemented | Actual compatibility validation |
| **FINAL** | Performance and full UI/function matrix; desktop + mobile browser and vanilla side-by-side | No unsupported claims of equivalence |

## 2026-10-21 UI root-class bug

Identified a concrete regression: `src/gui112-assets.js` adds the `gui112-*` marker to `document.documentElement` (`html`), but `gui112.css` was trying to style `body.gui112-*`. Therefore *none* of the owner-loaded HUD/inventory/chest/furnace artwork rules activated. Fixed CSS to target `html.gui112-* body`, added node regression tests, incremented cache version. Headless Chromium live-site checks now run after successful Pages deployments with screenshot artifacts.

Gaps remain in vanilla font/items, actual 1.12.2 screenshot comparison, full block atlas, physical interactions and game content. Those are not complete.
