// Dependency-free validation of content/diseases/*.json (see ARCHITECTURE.md section 9).
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const dir = 'content/diseases';
const errors = [];
const ids = new Set();
const CROPS = ['maize', 'wheat', 'cotton'];
const hasL10n = (o) => o && typeof o.en === 'string' && typeof o.ur === 'string';
const hasList = (o) => o && Array.isArray(o.en) && Array.isArray(o.ur);

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const where = `${dir}/${file}`;
  let c;
  try { c = JSON.parse(readFileSync(join(dir, file), 'utf8')); } catch { errors.push(`${where}: invalid JSON`); continue; }
  if (c.id !== basename(file, '.json')) errors.push(`${where}: id must equal the file name`);
  if (ids.has(c.id)) errors.push(`${where}: duplicate id`);
  ids.add(c.id);
  if (!CROPS.includes(c.crop)) errors.push(`${where}: invalid crop`);
  if (!c.id.startsWith(`${c.crop}_`)) errors.push(`${where}: id must start with the crop id`);
  for (const k of ['name', 'summary', 'spread', 'whenToCallExpert']) if (!hasL10n(c[k])) errors.push(`${where}: ${k} needs en and ur`);
  for (const k of ['symptoms', 'prevention', 'safety']) if (!hasList(c[k])) errors.push(`${where}: ${k} needs en and ur lists`);
  for (const k of ['cultural', 'organic']) if (!hasList(c.treatment?.[k])) errors.push(`${where}: treatment.${k} needs en and ur lists`);
  if (!Array.isArray(c.treatment?.chemical)) errors.push(`${where}: treatment.chemical must be an array`);
  if (!['draft', 'reviewed'].includes(c.reviewStatus)) errors.push(`${where}: reviewStatus must be draft or reviewed`);
  if (c.reviewStatus !== 'reviewed') {
    for (const ch of c.treatment?.chemical ?? []) if (ch.dosage) errors.push(`${where}: dosage is not allowed on draft content`);
  } else if (!c.reviewedBy || !c.reviewedAt) errors.push(`${where}: reviewed content needs reviewedBy and reviewedAt`);
  if (JSON.stringify(c).match(/\b(brand|™|®)\b/i)) errors.push(`${where}: do not use brand names`);
}

// If a model manifest exists, content ids and model class ids must match (both directions).
const manifestPath = 'apps/web/public/models/v1/manifest.json';
if (existsSync(manifestPath)) {
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const classIds = new Set(m.classes.filter((k) => k.kind !== 'negative').map((k) => k.id));
  for (const id of classIds) if (!ids.has(id)) errors.push(`model class "${id}" has no content file`);
  for (const id of ids) if (!classIds.has(id)) errors.push(`content "${id}" has no model class`);
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`content OK (${ids.size} files)`);
