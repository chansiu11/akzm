# Play audit — 2026-10-23

Observed in the deployed site starting 09:48 UTC. Inspection ended early at the user's subsequent request to begin fixing immediately (before the planned ten minutes).

Observed: creative worlds showed survival inventory/vitals and could die; inventory survived a death transition and blocked title clicks; entering/resuming could request fullscreen; embedded browser pointer-lock failure prevented mouse look; recipe book showed text buttons instead of items; daylight hostile spawning and incorrectly proportioned animals; static water.

Changes: separate 195x136 creative catalogue with search and category tabs, local creative textures and armor placeholders, sprite recipe toggle and item grid with atomic ingredient placement; no automatic fullscreen, explicit video-setting toggle; mouse-drag fallback when pointer lock is unavailable; creative immunity, infinite placement and double-Space flight; close inventory/chat on death; corrected cow/biped geometry, face UVs, limb joints and headings, skeleton bow and arrow fins/textured planes; natural hostile spawns require darkness and distance >=24, exposed undead take daylight damage; scheduled water levels, downward/lateral spread and recession.

Original images remain local to the browser, re-read from the owner's cached JAR. No original PNG, model JSON, language files or JAR is committed. Cache schema version forces local refresh for the additional textures.

Limits: only existing cow/zombie/skeleton surrogate types; no full vanilla AI or all animals; simplified daylight burning, lighting and projectiles; water does not implement the vanilla shortest-drop search, corner slopes or all fluid/block interactions; creative catalogue contains implemented items only and five tabs, not the entire vanilla item registry; armor slots remain visual placeholders; no full vanilla inventory cursor/drag semantics; recipe unlock/filter rules and all vanilla recipes remain incomplete.

Validation: 267 Node tests, including fluid propagation/recession/barriers, creative mob targeting, model dimensions/facing, recipe atomicity and explicit fullscreen policy. Browser verification recorded in the task.
