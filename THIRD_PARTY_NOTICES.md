# Third-party data

`public/catalog.json` is exported from the 1.8.9 dataset exposed by `minecraft-data` npm version 3.100.0, a PrismarineJS project (package license: MIT).

- https://github.com/PrismarineJS/node-minecraft-data
- https://github.com/PrismarineJS/minecraft-data

The file contains item, block, food and crafting recipe facts. Item names remain English where a Korean translation is not provided. Some upstream metadata includes cross-version annotations; only the exported 1.8 item IDs and recipe entries are used. This is not a certification of exact engine parity. Proprietary Minecraft textures, sound recordings, fonts and logos are not included. Resource packs selected by a player are decoded and stored only in that player's browser.

Three.js and ws retain their own license notices in npm dependencies.

## MIT permission notice (minecraft-data package)

Copyright (c) Romain Beaumont and contributors.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Vendored Three.js browser build

`public/vendor/three.module.min.js` and `three.core.min.js` are copied from the installed Three.js 0.180.0 npm package for GitHub Pages to run without a CDN. Copyright 2010–2025 Three.js Authors. MIT license text is included at `public/vendor/LICENSE.three.txt`. Regenerate with `npm run prepare:static`.
