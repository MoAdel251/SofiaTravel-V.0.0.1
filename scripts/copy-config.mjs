import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(projectRoot, 'firebase-applet-config.json');
const targetDir = join(projectRoot, 'dist');

if (!existsSync(source)) {
  console.warn(`[copy-config] ${source} not found, skipping.`);
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });
copyFileSync(source, join(targetDir, 'firebase-applet-config.json'));
console.log('[copy-config] firebase-applet-config.json copied to dist/.');
