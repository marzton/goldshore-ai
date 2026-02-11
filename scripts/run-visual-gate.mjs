import { execSync } from 'node:child_process';

const explicit = process.env.UI_AFFECTING_CHANGE;

const isUiFile = (file) =>
  /^(apps\/(gs-web|gs-admin)\/.*\.(astro|tsx?|jsx?|css|scss|png|jpg|jpeg|svg|webp))$/.test(file);

const detectUiChanges = () => {
  const base = process.env.GITHUB_BASE_REF;

  if (!base) {
    return true;
  }

  try {
    execSync(`git fetch --no-tags --depth=1 origin ${base}`, { stdio: 'ignore' });
  } catch {
    return true;
  }

  const diff = execSync(`git diff --name-only origin/${base}...HEAD`, { encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return diff.some(isUiFile);
};

const shouldRun = explicit
  ? ['1', 'true', 'yes'].includes(explicit.toLowerCase())
  : detectUiChanges();

if (!shouldRun) {
  console.log('No UI-affecting files detected. Skipping visual regression gate.');
  process.exit(0);
}

execSync('pnpm --filter @goldshore/web test:e2e', { stdio: 'inherit' });
