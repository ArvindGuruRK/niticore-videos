// Build assets/icons.json from the site's icon package (@phosphor-icons/react, the same icons the site uses).
// Run from video/:  node <film>/tools/icons.mjs <film> Name Name ...
// Each icon keeps four weights: regular, bold, fill (path lists) and duo (duotone: [path, opacity] pairs).
import fs from 'node:fs';
import path from 'node:path';

const [film, ...names] = process.argv.slice(2);
const DEFS = path.resolve('..', 'node_modules', '@phosphor-icons', 'react', 'dist', 'defs');
const out = {};
for (const name of names) {
  const src = fs.readFileSync(path.join(DEFS, `${name}.es.js`), 'utf8');
  const weights = {};
  for (const m of src.matchAll(/\[\s*"(\w+)",([\s\S]*?)\n  \]/g)) {
    const paths = [...m[2].matchAll(/d: "([^"]+)"(?:,\s*opacity: "([\d.]+)")?/g)].map((p) => [p[1], p[2] ? Number(p[2]) : 1]);
    weights[m[1]] = paths;
  }
  if (!weights.regular) throw new Error(`${name}: no regular weight`);
  out[name] = { regular: weights.regular.map((p) => p[0]), bold: weights.bold.map((p) => p[0]), fill: weights.fill.map((p) => p[0]), duo: weights.duotone };
}
fs.writeFileSync(path.join(film, 'assets', 'icons.json'), JSON.stringify(out));
console.log(`${Object.keys(out).length} icons -> ${film}/assets/icons.json`);
