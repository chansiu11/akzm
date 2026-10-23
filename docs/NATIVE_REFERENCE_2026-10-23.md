# Native Java 1.12.2 comparison, 2026-10-23

Observed the running Minecraft 1.12.2 application with a 854x480 client area. Confirmed the Korean FOV labels at normal and maximum, the 150x20 logical FOV slider, and dirt-backed world loading with two centered text lines. Restored the user's native FOV to 92 after inspection. Created a separate native world named UI Reference 1.12.2; existing worlds were from 1.16.1 and were not opened or modified.

Changes: FOV default 70, range 30–110 with unit steps, immediate camera projection update and persistence; native-style full-height slider handle using only browser-loaded owner widgets; loading composition; desktop HUD bottom alignment; transparent vital sprite background; half-heart quantization and diminishing oxygen bubbles. Full existing saved FOV values remain preserved when valid.

Validation: 258 regression tests pass before merging the concurrent mobile test addition. Owner JAR successfully loaded through the public site's file chooser; no original images or JAR committed.

Open: this is not full game parity. World generation, all block registries, recipes/recipe book, equipment, AI/redstone/dimensions and networking remain partial. FOV sprint/potion dynamic multipliers remain separate work. No identical-world or complete visual parity claim.
