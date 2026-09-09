import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'dist');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const file of readdirSync(root)) {
  if (/\.(html|js|css)$/.test(file)) cpSync(join(root, file), join(out, file));
}
for (const asset of ['kirkland-house', 'dollhouse']) {
  cpSync(join(root, '../apps/web/public/models', asset), join(out, 'models', asset), { recursive: true });
}
console.log('Static scene prepared with house and Blender dollhouse assets.');
