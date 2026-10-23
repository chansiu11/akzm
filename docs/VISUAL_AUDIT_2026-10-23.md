# Deployed 1.12.2 visual/interaction audit — 2026-10-23

Public site: https://chansiu11.github.io/akzm/
Reviewed deployment commits: b9a1749 (game code unchanged), 63b6106 (initial screenshot harness), 38297ab (extended gameplay screenshot harness).

## Procedure
- Used Playwright Chromium through GitHub Actions to open **the actual public Pages site** in desktop 1365×768, mobile portrait 390×844, mobile landscape 844×390.
- Recorded a screenshot before clicking, after menu changes, and at timed intervals after clicking Play/Create.
- Run 1: https://github.com/chansiu11/akzm/actions/runs/39907151953 (title, world list, create, settings, 25-second loading).
- Run 2: https://github.com/chansiu11/akzm/actions/runs/39907859687 (title, world list, Play, 420-second loading).
- Screenshots and JSON observations are in the GitHub Actions artifact archives for each viewport. Artifacts are retained for 7 days.
- Owner-only Minecraft JAR was **not uploaded** to Actions, GitHub, or Pages. These findings apply to the public fallback assets only.

## Confirmed outcomes
| Topic | Observation | Status |
|---|---|---|
| Public deployment | HTTP 200; documentElement.dataset.appReady true in all viewports | PASS |
| Menu navigation | Title → world list → create → back → settings → back all clickable; screenshots present | PASS |
| Menu positions | Latest title is centered; previous top-left placement failure no longer reproduced | PASS |
| Normal fallback button sprites | No half-blue seam observed in inspected normal button screenshots | PASS in inspected cases only |
| Original-owner sprite hover/disabled states | No private JAR injected; not directly compared | NOT VERIFIED |
| Pixel-perfect 1.12.2 parity | Public fallback logo/panorama and HTML world-creation select/checkbox still differ in appearance/layout | DIFFERENT |
| Font doubling in public fallback menus | No obvious duplicate text from screenshots | NOT REPRODUCED; local JAR bitmap mode not verified |
| Touch vs desktop mode | Desktop reports touchUi=false, touch-screen viewports touchUi=true | PASS class gating only |
| Resource requests | One to two HTTP 404 console messages per run; URL not captured | NEEDS INVESTIGATION |
| 12-chunk world readiness | All tests remained on loading overlay after 420 seconds, despite progress increasing | FAIL performance/interaction gate |

## Quantified loading progress
Target 25×25 = **625 chunk meshes**. Measured in a fresh browser profile after the Play action:

| Elapsed (seconds) | Desktop | Mobile portrait | Mobile landscape |
|---|---|---|---|
| 30 | 63 / 625 (10%) | 82 / 625 (13%) | 82 / 625 (13%) |
| 120 | 157 / 625 (25%) | 207 / 625 (33%) | 188 / 625 (30%) |
| 240 | 225 / 625 (36%) | 319 / 625 (51%) | 275 / 625 (44%) |
| 420 | **307 / 625 (49%)** | **457 / 625 (73%)** | **375 / 625 (60%)** |

The loading gate prevents any playable interaction until all 625 chunks are meshed; the slowdown becomes more pronounced as chunk count grows. Do **not** claim the gameplay systems work on the basis of passing syntax/unit tests.

## Not verified (blocked by loading or by unavailable private assets)
- Fully visible HUD (hearts/hunger/XP/hotbar) at normal gameplay brightness and original pixel alignment.
- Empty-hand animation, held block/tool/item visuals and all imported first-person model transforms.
- Left-button drag vs mining hold, survival hardness timing, creative immediate break, live chunk mesh/particles.
- Mob skin UVs, hit reaction, knockback and collision under live interaction.
- Simultaneous touch movement, camera/look, jump and block break in a live world.
- Inventory, chat, command screen, pause, reload/persistence during active gameplay.
- Original private JAR font and button pixels, including hover/disabled states and bitmap glyph fallbacks.

## Next highest-priority engineering work
Optimize the 12-chunk-preload architecture **without silently reducing the required radius**: instrument per-chunk CPU mesh time and GPU draw-call cost; move heavy mesh computation off the main thread where feasible; de-duplicate chunk rebuild work and reduce rendering during preload; maintain visible loading progress and a responsive cancel path. Then repeat the same screenshot → compare → click → screenshot sequence to verify play systems and original assets on the owner's browser.
