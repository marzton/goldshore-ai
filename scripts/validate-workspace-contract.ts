import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();

const expectedWorkerNames: Record<string, string> = {
  'apps/api-worker/package.json': '@goldshore/gs-api',
  'apps/control-worker/package.json': '@goldshore/gs-control',
  'apps/gateway/package.json': '@goldshore/gs-gateway',
  'apps/gs-agent/package.json': '@goldshore/gs-agent',
};

const disallowedWorkerNames = new Set([
  '@goldshore/api',
  '@goldshore/control',
  '@goldshore/gateway',
  '@goldshore/agent',
]);

const errors: string[] = [];

async function readJson(filePath: string) {
  const raw = await readFile(path.join(repoRoot, filePath), 'utf8');
  return JSON.parse(raw) as Record<string, unknown>;
}

async function validateWorkerPackageNames() {
  for (const [pkgPath, expectedName] of Object.entries(expectedWorkerNames)) {
    const pkg = await readJson(pkgPath);
    const actualName = pkg.name;

    if (actualName !== expectedName) {
      errors.push(`${pkgPath}: expected \"name\" to be \"${expectedName}\" but found \"${String(actualName)}\".`);
    }
  }
}

async function validateTurboFilters() {
  const rootPkg = await readJson('package.json');
  const scripts = (rootPkg.scripts ?? {}) as Record<string, string>;

  const requiredFilters = ['@goldshore/gs-api', '@goldshore/gs-control', '@goldshore/gs-gateway'];

  const scriptEntries = Object.entries(scripts).filter(([, value]) =>
    typeof value === 'string' && value.includes('turbo run') && value.includes('--filter='),
  );

  for (const filter of requiredFilters) {
    const used = scriptEntries.some(([, command]) => command.includes(`--filter=${filter}`));

    if (!used) {
      errors.push(`package.json scripts: missing turbo filter usage for ${filter}.`);
    }
  }

  for (const [scriptName, command] of scriptEntries) {
    for (const deprecatedName of disallowedWorkerNames) {
      if (command.includes(`--filter=${deprecatedName}`)) {
        errors.push(
          `package.json scripts.${scriptName}: deprecated turbo filter ${deprecatedName} detected; use @goldshore/gs-* package names.`,
        );
      }
    }
  }
}

async function validateWorkflowCommands() {
  const workflowDir = path.join(repoRoot, '.github', 'workflows');
  const files = await readdir(workflowDir);

  for (const file of files) {
    if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue;

    const content = await readFile(path.join(workflowDir, file), 'utf8');

    for (const deprecatedName of disallowedWorkerNames) {
      if (content.includes(`--filter=${deprecatedName}`)) {
        errors.push(
          `.github/workflows/${file}: deprecated turbo filter ${deprecatedName} detected; use @goldshore/gs-* package names.`,
        );
      }
    }
  }
}

async function main() {
  await validateWorkerPackageNames();
  await validateTurboFilters();
  await validateWorkflowCommands();

  if (errors.length > 0) {
    console.error('Workspace contract validation failed:\n');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Workspace contract validation passed.');
}

main().catch((error) => {
  console.error('Workspace contract validation crashed.');
  console.error(error);
  process.exit(1);
});
