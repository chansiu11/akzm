# Visual continuation, 2026-10-21

Base: 94ed8f6d15868ad6ee79a37b733a78131d1d30d5 (includes the work after 542b600).

## Findings and changes
- The latest prior unit workflow and Pages deployment succeeded, but browser run 39513077733 failed: desktop inventory still showed the HUD; mobile passed. The run overlapped deployment. This is consistent with a stale deployment, not proof of a CSS defect. Browser review now waits for matching SHA-256 contents of the checkout's entry point and visual modules and records the hashes.
- First-person objects were all initially visible, and selecting empty ID 0 returned before setting visibility. Initialize visibility explicitly so empty hands do not show a block or pickaxe.
- Held grass/log/crafting-table blocks used a single icon tile on all six faces. Use the existing world face texture mapping for each BoxGeometry face.
- Non-block items now have thin depth instead of full cube depth; textures, item transforms and geometry are still approximations. Hide the separate arm when holding an object; arm pose and skin remain independent placeholders.
- Do not display exhausted stacks in hotbar, inventory or the hand. Replenish overflow before selecting the visible held item.
- Browser review now checks panel bounds and close/reopen behavior, and adds mobile landscape alongside desktop and portrait.

## Validation
- Local Node regression: 180 passed, zero failures. New behavioral checks cover unknown/empty items, grass/log/crafting-table face assignments, food and tool model selection.
- Direct cloud-browser visit to public Pages: title renders; WebGL context creation fails in that browser, so gameplay cannot be assessed there. This is a browser limitation, not a verified game rendering failure on supported devices.
- Deployed Chromium workflow verification is recorded separately after the upload. A workflow pass is a functional smoke check, not visual equivalence to Java.

## Remaining visual differences / unverified areas
- No running vanilla Java 1.12.2 reference was available for side-by-side screenshots. No claim of pixel parity.
- Arm skin, pose, bob/swing/equip animation, item model JSON transforms, generated-item extrusion, inventory player preview, armor/offhand, tooltip/font rendering remain incomplete.
- Non-cube block items still use a cube in hand. Item textures still include placeholder atlas tiles. Imported JAR GUI/block textures remain local to the owner's browser; no JAR or extracted assets were added.
- Inventory interactions, recipe book, terrain generation, light propagation, redstone, mobs, dimensions and multiplayer retain the outstanding gates in CONTINUATION_112_2026-10-21.md.
