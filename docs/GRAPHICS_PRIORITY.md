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

## 2026-10-21: owner item texture path correction
- Cause: item registry IDs are not always PNG basenames in 1.12.2. Wooden and golden pickaxes and redstone dust were looked up as nonexistent files, silently leaving generated icons and handheld-tool silhouettes after a valid owner JAR load.
- The owner-only JAR importer now reads each `models/item/<id>.json` layer0 texture mapping where available, checks local `items/` paths, and falls back to legacy 1.12.2 aliases. Lapis dye metadata stays explicitly blue. Original JSON/PNG bytes remain on the user's browser origin.
- A private cache schema bump automatically re-extracts retained JARs rather than preserving missing item icons from old caches. Regression tests cover aliases, model-defined texture paths, malicious/unusable paths, and cache version.
- One-pixel owner HUD slot inset and selected-frame positioning now align hotbar icons with the 182px background sprite instead of the inherited fallback layout. Full vanilla pixel parity is not claimed.
- Public browser fixtures use synthetic art, not the user's owner JAR; they cannot validate original-resource pixel fidelity.

## 2026-10-21: imported extra-face alpha
- A second alpha compositing defect affected additional per-face atlas tiles (furnace sides/top, sandstone, spruce log end) and the derived chest top: original translucent pixels could retain fallback-art pixels beneath them. Clear each destination tile before drawing owner PNGs.
- Public Chromium synthetic PNG fixture now checks that a fully transparent extra face remains transparent in the atlas, in addition to existing glass coverage. No owner game resources are uploaded into CI.

## 2026-10-21: owner-skin inventory player viewport
- Added an optional 3D player preview in the original inventory character recess. It is made from six body-part boxes and uses the locally extracted user skin, not any published model/texture asset.
- The preview appears only after private owner assets are loaded. No-JAR fallback remains distinct. First-person model and user JAR caching are unchanged.
- Source is an approximate 3D model; precise Minecraft player preview transforms, overlays, armor, body poses, and pixels have not been validated against the vanilla client.

## 2026-10-21: preview visual inspection follow-up
- The first preview smoke check only confirmed canvas size and placement; captured screenshots had an all-transparent synthetic skin, so a passing browser check did not prove model pixels were rendered.
- The fixture now generates an opaque, independently authored two-tone synthetic skin and verifies rendered canvas alpha coverage, not just DOM visibility. This does not constitute vanilla-client screenshot parity or owner-JAR fidelity verification.

## 2026-10-21: use composited browser screenshots for WebGL proof
- The strengthened pixel test found an incorrect assumption in the test: on desktop, the actual screenshot visibly contained the synthetic avatar, while reading back `canvas.toDataURL()` reported zero pixels. Browser compositor screenshots and WebGL drawing-buffer readback are not equivalent.
- Replaced the readback check with a color-pixel assertion on the element screenshot using known blue/orange synthetic fixture colors; now also waits for `src/player-preview112.js` to be deployed before visiting the site.
- Reverted unnecessary WebGL `preserveDrawingBuffer`; the private resource import/privacy mechanism is unchanged.

## 2026-10-21: locally inherited block-item GUI model transforms
- Audited owner JAR SHA-1 `0f275bc1547d01fa5f56ba34bdc87d981ee12daf`. Its item-model JSONs inherit GUI transforms from block-model parents, including a stair-specific rotation absent from previous programmatic icons.
- On owner-local import, traverse each available implemented block item model's safe relative parent chain and record only numeric `display.gui` transforms. Cache them privately, re-extracting the already saved JAR via the bumped version.
- Render icon orientation, offset, and scale using these model transforms instead of imposing the same manually chosen pose on every block. No original JSON or texture bytes were committed.
- WebGL rendering still differs from vanilla GPU lightmap, render-layer handling, and full parent/blockstate geometry. This is narrower, verifiable model-transform progress, not full pixel parity.

## 2026-10-21: held hand and noncube block geometry
- The first-person renderer previously hid the right arm whenever a block/tool/item was selected. The owner-local textured arm now remains visible when holding an object; exact vanilla positioning is not yet verified.
- Slab, stairs and post model kinds no longer inherit the generic full-cube first-person geometry. The existing world quads and atlas face UVs are reused in a dedicated held geometry; cached noncube meshes are disposed on teardown.
- No JAR PNGs, source model files, or skins are committed. Java vanilla screenshot comparison under matched FOV/view conditions remains necessary.

## 2026-10-21: held-model deployed browser regression
- Added WebGL browser check on desktop and both mobile orientations: the held stair must emit more visible triangles than the held cube. Captures a separate synthetic first-person stair/hand screenshot.
- Existing empty-hand textured-skin test remains in place. A passing fixture checks geometry integration but does not establish vanilla-identical transforms or lighting.

## 2026-10-22: 1.12.2 title and block-only continuation
- Constrained this increment to the main menu and supported block/item surfaces. Inspected the owner's SHA-1-verified 1.12.2 JAR locally; none of its image, font, class or model files have been committed.
- Main menu: the options/exit row moves to vanilla buttonY+84; a correctly positioned 20x20 language sprite is sampled from the owner's widgets.png (normal Y=106, hover Y=126). Korean and English title button texts can be changed in Settings, without pretending to implement all vanilla language packs.
- Owner panorama: fixed yaw speed to 0.1 degree per 20 Hz tick; reset its epoch on import; retained the 1.12.2 sinusoidal pitch. Synthetic owner menu screenshot is now captured in deployed Chromium; a no-JAR screenshot is explicitly not original-resource verification.
- Block item render: previously, stair and slab icons used procedural mesh decomposition, ignoring native model JSON element face UVs. The owner-local importer now walks 1.12.2 parent-model chains, resolves inherited texture names and stores only validated face coordinates/UVs in the private IndexedDB asset bundle. The block icon renderer uses these data, retaining synthetic fallback when missing. Existing grass-side compositing is preserved; the duplicate vanilla grass overlay layer is skipped in the icon descriptor.
- The original block atlas used for the world still supports a limited registry; complete blockstates, ambient occlusion, transparent ordering, animated UVs and full 1.12.2 model coverage remain open. No blanket visual or pixel parity claim.

## 2026-10-22: preserving native block face rotation and browser proof
- A block JSON element's north/front face is not interchangeable with the procedural +Z front. The model-driven icon path now retains native GUI Y rotations (e.g., 225° for inherited block transforms) while the legacy fallback path keeps the historical compensated 45°. This fixes a real cause of furnace/crafting-table face orientation errors after enabling native model elements.
- Added a public Chromium synthetic fixture that passes distinct per-element model faces to the actual icon renderer, confirms the result differs from the older procedural stair icon, and captures desktop/mobile screenshots. The fixture contains no Minecraft source textures.
- Limits remain explicit: the full blockstate registry and the Java render pipeline, pixel snapping, lighting, and native-player screenshot comparisons are not implemented. Asset bytes are never published.

## 2026-10-22: owner upload no longer required for bundled site theme
- New standalone `src/site-default112.js` programmatically draws three independent 200x20 pixel menu-button sprites and a small language icon directly on the site. These are original fallback designs, not assets copied/extracted from 1.12.2.jar. CSS enables this `site-default112` theme for every visitor with no local files.
- The existing procedural `src/atlas.js` 8x6 tile atlas was already bundled and remains available without upload. No change to original client code or textures is implied by calling this the site default.
- When the user chooses their own 1.12.2 JAR, its previously private/IndexedDB-based `gui112-assets` styles supersede the public original fallback. The site never distributes that JAR or its original PNGs. Other users continue to receive the independent site graphics.
- The settings page now labels the JAR as optional; the no-cache path describes site-owned textures as automatically loaded instead of telling first-time visitors they must upload a JAR. Added Node tests and deployed desktop/mobile Chromium checks for actual CSS border-image sprites on a fresh context.
- Mojang's published EULA and usage guidelines restrict unauthorized redistribution of original game files and assets. An exact original client bundled site package would require appropriate distribution rights. Pixel parity with official vanilla is **not** claimed.

## 2026-10-22: user-reported gameplay/visual fixes (font, UI, movement, blocks, view and daylight)
- Diagnosed the real delay after a place event: `world.set` changed immediately while `progressChunk(activeBuild,4)` delayed visible mesh replacement; the dirty chunk was also appended to a long FIFO behind distant chunks. A validated local overlay of the new block's actual geometry is now rendered immediately and included in the mouse raycast; urgent dirty chunk jobs move to the front, with stale active jobs marked dirty. Overlays are cleaned after the correct chunk version builds or when that chunk unloads. Column budget is now 28 per desktop frame or 12 on coarse-pointer devices, reducing waiting while balancing frame cost.
- Movement changes use a pure, testable velocity integrator with ground/air acceleration and drag, walk/sprint/crouch speeds of 4.317 / 5.612 / 1.296 blocks/s, jump speed 8.35, gravity 30 blocks/s² and capped terminal speed. Saved world/position collision and damage systems remain intact. Horizontal velocity resets on teleports and respawns.
- Expanded render settings to default 6 chunks (formerly 2) and max 10 (formerly 3); existing saved 1–3 chunk settings migrate once, while newly selected 2–3 chunk values persist. Fog now tracks effective render radius instead of obscuring all blocks past the old fixed ~110m cutoff.
- Increased daytime hemisphere/sun intensities, outdoor side-face brightness, and underground minimum light (without adding true 1.12.2 light propagation). This addresses a double-dim appearance from separate voxel-vertex and Lambert shading. Actual vanilla pixel brightness matching is not claimed.
- Applied a safe Unicode fallback to owner JAR bitmap fonts: only supported Latin ASCII gets bitmap overlays. Korean and other Unicode UI text remain native readable system text; unsupported glyphs also clear any stale bitmap canvas and transparency class. This prevents the misrendered Korean labels reported after importing `1.12.2.jar`, with faithful Unicode rasterization still pending.
- Added source/unit/browser regressions covering font behavior after a synthetic owner restore, setting range, background previews, physical acceleration, fog and dynamic daylight. Owner JAR files are never used in CI and no copyright assets are uploaded.
