import { readFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = (await Promise.all(['index.html','brand.html'].map(p=>readFile(resolve(root,p),'utf8')))).join('\n');
const refs = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m => m[1]).filter(p => !p.startsWith('https://'));
await Promise.all(refs.map(p => access(resolve(root, p))));
for (const file of ['src/app.js', 'src/styles.css']) {
  const s = await readFile(resolve(root, file), 'utf8');
  if (s.includes('/Users/')) throw new Error(`Local personal path in ${file}`);
}
console.log(`Static check passed: ${refs.length} local entry assets resolve; no personal absolute paths in frontend sources.`);
