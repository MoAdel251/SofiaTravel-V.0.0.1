import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outfile = join(projectRoot, 'api-dist', 'app.cjs');

mkdirSync(dirname(outfile), { recursive: true });

await build({
  entryPoints: [join(projectRoot, 'server.ts')],
  outfile,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
});

console.log(`[build-vercel-api] bundled server into ${outfile}`);
