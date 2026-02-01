import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const findings = [];

files.forEach((file) => {
  const content = readFileSync(file, 'utf8');
  let match;
  const regex = /^(<<<<<<< .*|=======|>>>>>>> .*)/gm;
  while ((match = regex.exec(content)) !== null) {
    const line = content.slice(0, match.index).split('\n').length;
    findings.push({ file, line, marker: match[1] });
  }
});

if (findings.length === 0) {
  console.log('No merge conflict markers found.');
  process.exit(0);
}

console.error('Merge conflict markers detected:');
findings.forEach(({ file, line, marker }) => {
  console.error(`${file}:${line}: ${marker}`);
});
process.exit(1);
