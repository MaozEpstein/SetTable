/**
 * Run after `expo export --platform web` to inject PWA-related <link> tags
 * into dist/index.html (apple-touch-icon, manifest, theme-color) and copy
 * the icon files to dist root so iOS Safari can find them.
 *
 * Usage: node scripts/inject-pwa-tags.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const assets = path.join(root, 'assets');

// 1. Copy icon files to dist root
const filesToCopy = [
    { src: 'apple-touch-icon.png', dest: 'apple-touch-icon.png' },
    { src: 'icon.png', dest: 'icon.png' },
];
for (const { src, dest } of filesToCopy) {
    const from = path.join(assets, src);
    const to = path.join(dist, dest);
    if (fs.existsSync(from)) {
        fs.copyFileSync(from, to);
        console.log(`✓ copied ${src} → dist/${dest}`);
    } else {
        console.warn(`! missing source: ${from}`);
    }
}

// 2. Inject head tags into index.html
const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const injections = [
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/manifest.webmanifest">',
    '<meta name="theme-color" content="#C9943B">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
    '<meta name="apple-mobile-web-app-title" content="שולחן ערוך">',
];

const toInject = injections
    .filter((tag) => !html.includes(tag))
    .join('\n  ');

if (toInject) {
    html = html.replace('</head>', `  ${toInject}\n</head>`);
    fs.writeFileSync(indexPath, html);
    console.log(`✓ injected ${injections.length} head tags into dist/index.html`);
} else {
    console.log('✓ head tags already present, skipping');
}
