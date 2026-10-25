# Settings and real-time world review — 2026-10-26

## Implemented
- 14 settings were changed through the deployed UI and restored after reloading: FOV, difficulty, render distance, brightness, view bobbing, clouds, GUI scale, coordinate permission, smooth lighting, master volume, chat opacity, sensitivity, auto-jump and mouse inversion. Persistence was verified for every value. FOV camera output and chat element opacity were inspected independently.
- Settings apply on input and persist; range minimums now allow 2 chunks and zero mouse sensitivity/volume. Sound, chat and difficulty controls are functional. Fullscreen remains explicitly user initiated.
- Settings sliders use locally loaded widget thumbs; checkboxes display button-style on/off states. No original assets are included in this commit.
- Block edits no longer synchronously rebuild a whole chunk. Only the edited chunk and directly touching boundary neighbors are queued. Removed faces and newly exposed faces update immediately. Chunk CPU work yields at one-column intervals. Column caches hold 131072 entries rather than 8192 to reduce regeneration during streaming. No measured FPS or percentage speedup is claimed.
- Sand/gravel are continuous falling entities with velocity, landing, render meshes and save/restore; they no longer move in discrete one-block steps.
- Cow, zombie and skeleton animation uses actual displacement, stopping at obstacles. Bipeds use opposite arm/leg phases. Raised arms point toward the face; attacking mobs face their target. Imported arrows no longer overlap fallback shafts/fins.
- New generator 5 blends coast, hills, ridges and river valleys. Generator 3/4 saves retain their original terrain. This is an independent approximation, not Java seed parity.
- In gameplay, cancellable browser navigation/zoom/scroll/save shortcuts are prevented. Text inputs and menus remain usable; focus loss clears held keys. Tab and Ctrl+S were exercised on the live game without navigation or a save dialog.

## Validation and remaining gaps
276 automated tests pass, including continuous falling/landing/save, old terrain preservation, new terrain continuity, zero-valued settings and shortcut scope. The live game loaded and block breaking worked without console errors. A temporary exposed-face gap seen during manual testing was corrected afterwards.

Still incomplete: vanilla skin-layer settings, key rebinding, separate music/sound categories, complete menu translation, full graphics/particle/FPS options, all vanilla mobs and exact mob navigation/poses, exact Java terrain/seeds, falling-block item drops/crushing damage and partial-block landing rules. Smooth lighting switches the existing vertex-light approximation, not Java ambient occlusion. Brightness and difficulty are approximations. Browser/OS reserved shortcuts such as Ctrl+W, Alt+F4 and some browser UI keys cannot reliably be intercepted by a webpage. No claim of completely eliminating lag or completing every vanilla setting.

## Follow-up settings layout
Video options now use 16 slots in the legacy two-column order, 150x20 logical controls with a 10-pixel column gap and 24-pixel row pitch. Fullscreen is in the grid; GUI size and particles use cycling buttons. Titles are 8 logical pixels. Settings values appear directly on controls. GUI size now changes the menu/title layout as well as HUD/inventory. Frame limit, particle density and leaf graphics were connected; unsupported anaglyph, attack indicator, VSync control, mipmap and entity-shadow controls remain explicitly disabled. Fullscreen was manually toggled on and off. Original resources were confirmed loaded from the browser cache. Native Minecraft was not running during this audit, so no live native side-by-side claim is made.
