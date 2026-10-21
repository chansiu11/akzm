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
