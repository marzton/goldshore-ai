import fs from 'node:fs';
import { execSync } from 'node:child_process';

const REPORT_PATH = 'docs/ci/CURRENT_STATE.md';

const run = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();
const gitRefExists = (ref) => { try { execSync(`git rev-parse --verify ${ref}`, { stdio: 'ignore' }); return true; } catch { return false; } };
const resolveBaseRef = () => gitRefExists('origin/main') ? 'origin/main' : (gitRefExists('main') ? 'main' : null);

if (!fs.existsSync(REPORT_PATH)) {
  console.error(`Missing report: ${REPORT_PATH}`);
  process.exit(1);
}

const content = fs.readFileSync(REPORT_PATH, 'utf8');
const currentBranch = run('git rev-parse --abbrev-ref HEAD');
const branchMatch = content.match(/\*\*Current Branch:\*\*\s*(.+)/);
const divergenceMatch = content.match(/\*\*Divergence vs (.+):\*\*\s*Behind:\s*(\d+),\s*Ahead:\s*(\d+)/);

if (!branchMatch || !divergenceMatch) {
  console.error('CURRENT_STATE.md missing required branch metadata fields.');
  process.exit(1);
}

if (branchMatch[1].trim() !== currentBranch) {
  console.error('Stale branch metadata detected in CURRENT_STATE.md.');
  process.exit(1);
}

const baseRef = resolveBaseRef();
if (!baseRef) {
  console.log('Skipping divergence freshness check because no main tracking ref is available in this checkout.');
  process.exit(0);
}

const [behind, ahead] = run(`git rev-list --left-right --count ${baseRef}...HEAD`).split(/\s+/);
if (divergenceMatch[1].trim() !== baseRef || divergenceMatch[2].trim() !== behind || divergenceMatch[3].trim() !== ahead) {
  console.error('Stale divergence metadata detected in CURRENT_STATE.md.');
  process.exit(1);
}

console.log('CURRENT_STATE.md branch metadata is fresh.');
