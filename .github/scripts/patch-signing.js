const fs = require('fs');
const path = 'android/app/build.gradle';

let s = fs.readFileSync(path, 'utf8');

const signingBlock = `
    signingConfigs {
        release {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
`;

if (!s.includes('signingConfigs {\n        release {')) {
    s = s.replace(/android\s*\{\n/, (m) => m + signingBlock);
}

s = s.replace(
    /signingConfig\s+signingConfigs\.debug/g,
    'signingConfig signingConfigs.release'
);

fs.writeFileSync(path, s);
console.log('Patched', path);
