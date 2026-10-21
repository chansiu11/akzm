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
