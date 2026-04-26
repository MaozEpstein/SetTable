/**
 * Generates all required icon PNGs from assets/icon-source.svg.
 * Run with: node scripts/build-icons.js
 *
 * Requires: npm i -D sharp
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'assets', 'icon-source.svg');
const out = path.join(root, 'assets');
const svg = fs.readFileSync(src);

const targets = [
    { name: 'icon.png', size: 1024 },
    { name: 'adaptive-icon.png', size: 1024 },
    { name: 'splash-icon.png', size: 1024 },
    { name: 'favicon.png', size: 64 },
    { name: 'apple-touch-icon.png', size: 180 },
];

(async () => {
    for (const t of targets) {
        const dest = path.join(out, t.name);
        await sharp(svg).resize(t.size, t.size).png().toFile(dest);
        console.log(`✓ ${t.name} (${t.size}x${t.size})`);
    }
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
