import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const workflowDir = path.join(repoRoot, '.github/workflows');

const workflowPattern = /^(deploy|preview)-.*(worker|agent|gateway|control).*\.ya?ml$/;
const workerConfigPattern = /^infra\/cloudflare\/(goldshore-api|goldshore-gateway|goldshore-control|gs-agent)\.wrangler\.toml$/;

function parseWrangler(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const rootName = raw.match(/^name\s*=\s*"([^"]+)"/m)?.[1];
  const envNames = {};
  const envBlocks = [...raw.matchAll(/^\[env\.([a-z]+)\][\s\S]*?(?=^\[env\.|\Z)/gm)];
  for (const block of envBlocks) {
    const env = block[1];
    const envName = block[0].match(/\nname\s*=\s*"([^"]+)"/)?.[1];
    if (envName) envNames[env] = envName;
  }
  return { rootName, envNames };
}

function parseDeployCommand(workflowPath) {
  const raw = fs.readFileSync(workflowPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const commandLine = lines.find((line) => line.includes('wrangler deploy'));
  if (!commandLine) return null;
  const config = commandLine.match(/--config\s+([^\s]+)/)?.[1];
  const staticEnv = commandLine.match(/--env\s+([a-z]+)/)?.[1];
  const dynamicEnv = commandLine.includes('steps.target.outputs.env');
  return { config, staticEnv, dynamicEnv, commandLine: commandLine.trim() };
}

const wranglerFiles = fs
  .readdirSync(path.join(repoRoot, 'infra/cloudflare'))
  .filter((file) => file.endsWith('.wrangler.toml'))
  .map((file) => path.join('infra/cloudflare', file));

const wranglerMap = Object.fromEntries(
  wranglerFiles.map((relativePath) => [relativePath, parseWrangler(path.join(repoRoot, relativePath))]),
);

const workflowFiles = fs
  .readdirSync(workflowDir)
  .filter((name) => workflowPattern.test(name))
  .map((name) => path.join('.github/workflows', name));

const errors = [];
const workflowUsage = new Map();

for (const workflowPath of workflowFiles) {
  const deploy = parseDeployCommand(path.join(repoRoot, workflowPath));
  if (!deploy) {
    errors.push(`${workflowPath}: missing wrangler deploy command`);
    continue;
  }
  if (!deploy.config) {
    errors.push(`${workflowPath}: deploy command missing --config target (${deploy.commandLine})`);
    continue;
  }

  const configPath = deploy.config.replace(/^\.\//, '');
  const wrangler = wranglerMap[configPath];
  if (!wrangler) {
    errors.push(`${workflowPath}: deploy config '${configPath}' is not in infra/cloudflare/*.wrangler.toml`);
    continue;
  }

  if (!workerConfigPattern.test(configPath)) {
    continue;
  }

  const type = path.basename(workflowPath).startsWith('preview-') ? 'preview' : 'deploy';
  const existing = workflowUsage.get(configPath) ?? { deploy: [], preview: [] };
  existing[type].push(workflowPath);
  workflowUsage.set(configPath, existing);

  if (deploy.dynamicEnv) {
    if (!wrangler.envNames.staging || !wrangler.envNames.prod) {
      errors.push(`${workflowPath}: dynamic deploy env requires staging and prod env blocks in ${configPath}`);
    }
  } else if (deploy.staticEnv) {
    if (!wrangler.envNames[deploy.staticEnv]) {
      errors.push(`${workflowPath}: env '${deploy.staticEnv}' not defined in ${configPath}`);
    }
  } else {
    errors.push(`${workflowPath}: deploy command missing --env value (${deploy.commandLine})`);
  }

  if (!wrangler.rootName?.startsWith('goldshore-')) {
    errors.push(`${configPath}: root worker name '${wrangler.rootName}' must start with goldshore-`);
  }
  for (const [envName, deployedName] of Object.entries(wrangler.envNames)) {
    if (!/^goldshore-[a-z-]+-(dev|preview|staging|prod)$/.test(deployedName)) {
      errors.push(`${configPath}: env.${envName}.name '${deployedName}' must match goldshore-<domain>-<env>`);
    }
  }
}

for (const [configPath, usage] of workflowUsage.entries()) {
  if (usage.deploy.length !== 1) {
    errors.push(`${configPath}: expected exactly 1 deploy workflow, found ${usage.deploy.length}`);
  }
  if (usage.preview.length !== 1) {
    errors.push(`${configPath}: expected exactly 1 preview workflow, found ${usage.preview.length}`);
  }
}

for (const configPath of Object.keys(wranglerMap).filter((p) => workerConfigPattern.test(p))) {
  if (!workflowUsage.has(configPath)) {
    errors.push(`${configPath}: missing mapped deploy/preview workflows`);
  }
}

if (errors.length > 0) {
  console.error('Worker/workflow validation failed:\n');
  for (const err of errors) console.error(`- ${err}`);
  process.exit(1);
}

console.log(`Validated ${workflowFiles.length} workflows against ${wranglerFiles.length} wrangler files.`);
