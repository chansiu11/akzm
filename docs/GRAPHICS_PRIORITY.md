# Graphics priority and verification

Target: Minecraft Java Edition 1.12.2 vanilla default resources. Design and graphics take priority over adding gameplay systems. Compare actual rendered screens after deployment and fix observed differences. Do not infer pixel parity from a passing functional test.

## 2026-10-21: held item depth and right arm
- Owner-local item PNG alpha now generates front/back faces and exposed pixel boundary sides, with 1/16 model-unit thickness. Adjacent opaque pixels do not generate hidden internal walls; holes retain their inner sides.
- Empty hand can load the owner's default Steve texture and a single 4:12:4 arm with separate face UVs. The previous separate solid-colored cuff is hidden when this texture is applied.
- Private cache schema is bumped so the saved JAR is re-read automatically for the skin resource. No original image bytes are included in this repository.
- Unit coverage checks depth, internal-edge removal, holes, texture bounds and arm UVs. Public Chromium additionally renders synthetic tool and arm fixtures on all three viewport configurations, with screenshots and triangle checks.

Not verified as vanilla-identical: exact hand pose, equip/swing transforms, first-person lighting, edge merging algorithm, skin overlay layer, inventory player preview, all block/item models, animated textures, biome tinting, world lighting/ambient occlusion, terrain and entities. Matching vanilla runtime screenshots under identical settings are still needed for pixel-difference claims.

Deployed review 39523945412 passed all three browser configurations. The synthetic arm screenshot exposed an inverted shoulder/wrist orientation; the follow-up rotates the textured arm so the sleeve points toward the bottom of the view.

## UI and block texture follow-up
- Fixed a CSS specificity error: the two-ID inventory slot selector overrode the imported GUI transparency rule, leaving generated gray recesses painted over the original inventory/crafting/container PNG. Browser regression checks now inspect computed background and box shadow.
- Hotbar/inventory block icons now render the existing 3D block geometry and per-face atlas UVs into transparent PNGs instead of showing a single flat tile. Partial slab/stair geometry is shared with the world renderer. The +Z-facing furnace/chest front is visible in the icon view. GUI pose, lighting and pixel rasterization remain approximations, not verified vanilla parity.
- Removed the extra 0.44 glass material opacity multiplier, retaining transparency from the imported PNG itself.
- Local original atlas changes regenerate the block icons, so an old procedural tile is not retained after loading the JAR. Non-block item PNGs still take precedence.
- The public default remains generated artwork until a local JAR is selected; it must not be described as original vanilla textures. No proprietary assets were published.

Public run 39525508155 confirmed the slot-background fix but caught an icon application failure. Root cause: double quotes inside `url(...)` prematurely terminated the HTML style attribute. Switched validated data URLs to single-quoted CSS URL syntax. This also fixes the previously added original non-block item icons, not just new block model icons.
