# Graphics priority and verification

Target: Minecraft Java Edition 1.12.2 vanilla default resources. Design and graphics take priority over adding gameplay systems. Compare actual rendered screens after deployment and fix observed differences. Do not infer pixel parity from a passing functional test.

## 2026-10-21: held item depth and right arm
- Owner-local item PNG alpha now generates front/back faces and exposed pixel boundary sides, with 1/16 model-unit thickness. Adjacent opaque pixels do not generate hidden internal walls; holes retain their inner sides.
- Empty hand can load the owner's default Steve texture and a single 4:12:4 arm with separate face UVs. The previous separate solid-colored cuff is hidden when this texture is applied.
- Private cache schema is bumped so the saved JAR is re-read automatically for the skin resource. No original image bytes are included in this repository.
- Unit coverage checks depth, internal-edge removal, holes, texture bounds and arm UVs. Public Chromium additionally renders synthetic tool and arm fixtures on all three viewport configurations, with screenshots and triangle checks.

Not verified as vanilla-identical: exact hand pose, equip/swing transforms, first-person lighting, edge merging algorithm, skin overlay layer, inventory player preview, all block/item models, animated textures, biome tinting, world lighting/ambient occlusion, terrain and entities. Matching vanilla runtime screenshots under identical settings are still needed for pixel-difference claims.
