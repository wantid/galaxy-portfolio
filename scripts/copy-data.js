import { cpSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function ensureDir(path) {
    mkdirSync(path, { recursive: true });
}

function copyFile(src, dest) {
    if (existsSync(src)) {
        cpSync(src, dest);
    }
}

function copyDir(src, dest) {
    if (existsSync(src)) {
        cpSync(src, dest, { recursive: true });
    }
}

ensureDir(join(root, 'src', 'data'));
ensureDir(join(root, 'public', 'content'));

copyFile(join(root, 'data', 'planets.json'), join(root, 'src', 'data', 'planets.json'));
copyFile(join(root, 'data', 'tabs.json'), join(root, 'src', 'data', 'tabs.json'));
copyFile(join(root, 'data', 'welcome.json'), join(root, 'src', 'data', 'welcome.json'));
copyDir(join(root, 'content'), join(root, 'public', 'content'));

const docsAssets = ['og-image.png'];
for (const asset of docsAssets) {
    const src = join(root, 'docs', asset);
    if (existsSync(src)) {
        copyFile(src, join(root, 'public', asset));
    }
}
