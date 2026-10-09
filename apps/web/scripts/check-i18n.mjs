// Fails if a literal t('key') used in src is missing from either locale file, or if the locales differ.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const flat = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) => (typeof v === 'object' && v !== null ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
const load = (l) => new Set(flat(JSON.parse(readFileSync(`src/i18n/locales/${l}.json`, 'utf8'))));
const en = load('en');
const ur = load('ur');
const errors = [];
for (const k of en) if (!ur.has(k)) errors.push(`missing in ur.json: ${k}`);
for (const k of ur) if (!en.has(k)) errors.push(`missing in en.json: ${k}`);

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
});
for (const file of walk('src')) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\bt\(\s*'([^'$`]+)'/g)) if (!en.has(m[1])) errors.push(`${file}: unknown key ${m[1]}`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`i18n OK (${en.size} keys)`);
