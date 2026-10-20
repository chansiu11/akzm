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

## Deployed review and second visual correction
- ec56f0d: Node tests and Pages succeeded. Chromium run 39514170521 opened the public site at 1440x900, 390x844 and 844x390 and passed menu/world/inventory checks. Downloaded and inspected the actual screenshots.
- Visual inspection found two issues beyond those checks: held block mostly below the bottom edge, and the landscape close button partially clipped above the viewport.
- Raised and moved the held block/tool to the lower-right view area, raised the empty arm, and limited touch GUI scale by available height including the external close control. These are independently chosen transforms, not measured vanilla transforms.
- Added an explicit close-button bounds assertion and a short-screen scale regression. Local suite: 181 passed.
- Desktop Chromium screenshots looked vertically upward after pointer lock; they do not validate world terrain appearance. Mobile screenshots show terrain. Camera input and same-seed vanilla screenshot comparison remain open.

## Third correction from screenshot inspection
- 3a79ed9 passed deployed Chromium run 39514569217 in all three sizes. Its screenshots confirm the landscape close button is fully visible and the desktop held block was raised.
- Reviewing those screenshots exposed the pre-existing UV vertex-order error: world quads use perimeter order but Three BoxGeometry uses rows. Corrected the mapping to prevent folded/diagonally stretched textures.
- Portrait screenshots exposed the held item clipped at the right edge. Give the view-model camera a minimum horizontal FOV on narrow screens instead of stretching the model or changing the world camera.
- Local regression: 183 passed. Added UV corner and portrait projection tests. Vanilla pose and exact model transforms remain unverified.
