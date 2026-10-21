# Menu and texture continuation

Base: 8e6f36d52a339b428388fd7af61c09b1240fd8ea.

## Implemented
- Display name changed to Minecraft 1.12.2, with an explicit unofficial web recreation disclosure.
- Title/menu logical layout, main button sizes/spacing and portrait/landscape adaptations replaced the oversized two-line Voxel Frontier layout.
- Owner JAR importer now reads the actual title logo, Java Edition subtitle, options dirt and all six panorama faces. PNG paths, dimensions and title sprite regions were inspected in the supplied JAR; SHA-1 matched the existing 1.12.2 digest. No original bytes are committed.
- Title logo is assembled from its two sprite strips. A CPU cubemap renderer uses the six owner-local panorama images. Menu buttons use the owner's widgets.png normal/hover/disabled rows.
- Existing HUD and container images remain owner-local. Transparent item slots stop painting grey backgrounds over imported container art.
- Standalone item icons use owner JAR PNGs when present, rather than ore-block or CSS pickaxe substitutes. Apple/bread are also loaded into the block/item atlas and retained on reload.
- Furnace side/top, sandstone top/bottom and spruce log ends now have separate atlas entries. Chest faces are cut from the owner-local entity texture; the chest is still a simplified cube, not the vanilla animated chest model.
- Water from this JAR is no longer tinted blue a second time. Spruce leaves receive their own fixed tint. Full biome color matching remains open.
- Six-row atlas with migration of older cached atlases. Import map prevents old five-row atlas dependencies from mixing with the new entrypoint.

## Validation and limits
- 186 Node tests passed, including menu completeness, cubemap cardinal directions, face selection and atlas/water UV bounds.
- Browser workflow now checks title/control bounds in three sizes, and exercises menu resource application using synthetic PNGs. It does not upload or use the owner's actual JAR in Actions.
- Public default screenshots are the no-JAR fallback. Reimport 1.12.2.jar on each device to use the expanded original artwork. Older GUI caches lack the new menu/item assets.
- No running vanilla client was available for exact screenshot comparison. This is NOT a claim that every UI or block is identical.
- Remaining: exact font rendering and localized strings, splash text, all settings/world screens, inventory player model/equipment, full recipe-book layout/behavior, non-cube held block models, every vanilla block/state/animation, biome colormaps, chest shape/animation, exact panorama projection/blur, and unimplemented systems documented in earlier audits.

## Automatic private resource restore
- Verified owner JAR, extracted UI/menu/font images, and six-row atlas are saved together in IndexedDB on this browser origin. No upload endpoint is involved.
- On next visit the bundle is restored without opening the file picker. A resource schema change re-extracts the saved JAR automatically.
- First use on another browser/device, cleared site data, or denied storage still requires one local file selection. Old image-only caches remain compatible, but need one JAR selection to enable future re-extraction.
- Local bitmap font support covers ASCII and selected Unicode pages including Hangul, menu buttons and item counts; this is not a claim that all text rendering matches vanilla.
- Node suite: 187 passing. Public-site browser check now exercises synthetic private resource persistence across reload on desktop, portrait and landscape. Synthetic fixtures contain no original asset bytes.
- Prior stage a6c937 public screenshots were inspected: title controls fit desktop and portrait; landscape inventory fits, but player preview/equipment and world shading still differ substantially from vanilla.

## Vanilla title and in-game asset follow-up
- Reference is Java Edition 1.12.2 vanilla default resources, not Bedrock or a modern resource pack.
- Title uses its own integer GUI scale; mobile gameplay controls no longer inflate the title layout. Removed the additional CSS logo shadow and corrected edition image cropping to the 98x14 opaque region inspected in the owner's 128x16 PNG.
- Removed a legacy `!important` brightness/saturation filter affecting imported panorama images. Panorama view/motion is closer, but its CPU sampling/blur is not a verified match to vanilla's multipass renderer.
- Local JAR splash text now appears; resource import/help controls moved into settings. Multiplayer/Realms buttons route to a truthful development information screen; these services are not implemented.
- Fixed atlas replacement alpha: transparent original glass/leaves previously composited over opaque generated tiles. Grass/foliage now use plains-like baseline tint; biome-specific colormap sampling remains missing.
- Held tools and non-block items now use local original PNGs when present. These are planes; vanilla edge extrusion and exact display transforms remain missing.
- No original game bytes were committed. Full pixel parity is NOT established: no matching vanilla runtime screenshot with identical resolution, GUI scale, language, time, world seed, position, yaw/pitch, graphics and gamma settings is available for image-difference measurement.
- Remaining major differences: procedural fallback art before local import; incomplete block catalog/models; player skin/arm model; inventory player/equipment/recipe behavior; animated textures; biome tints; ambient occlusion and lightmap; terrain/structures/entities; gameplay and multiplayer.
