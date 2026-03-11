import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const bannedRegexes = [
  /['"`]\/assets\/brand\/logo-penrose\.svg['"`]/,
  /['"`]\/assets\/brand\/logo-horizontal\.svg['"`]/,
  /['"`]\/assets\/brand\/logo\.svg['"`]/,
  /['"`]\/packages\/brand\/logo-penrose\.svg['"`]/,
  /['"`]\/favicon\.svg['"`]/,
  /https:\/\/goldshore\.ai\/assets\/brand\/logo-penrose\.svg/
];

const ignorePrefixes = [
  'archives/',
  'reports/migration/',
  'scripts/check-canonical-logo-paths.mjs',
  'scripts/asset-propagation.js',
  'packages/brand/'
];

const ignoreFiles = new Set(['AGENTS.md', 'docs/logo-asset-inventory.md']);

const files = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .map((f) => f.trim())
  .filter(Boolean)
  .filter((f) => !ignorePrefixes.some((p) => f.startsWith(p)))
  .filter((f) => !ignoreFiles.has(f));

const violations = [];
for (const file of files) {
  let text = '';
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const regex of bannedRegexes) {
    if (regex.test(text)) {
      violations.push(`${file}: matches ${regex}`);
    }
  }
}

if (violations.length) {
  console.error('Non-canonical logo path references found. Use /logo/gs-penrose.svg only.');
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log('Logo path guard OK. Allowed runtime path: /logo/gs-penrose.svg');
