#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DEFAULT_JSON = 'reports/repo-audit.json';
const DEFAULT_SUMMARY = 'reports/repo-audit-summary.md';
const DEFAULT_HISTORY = 'reports/repo-audit-history.json';
const DEFAULT_BASELINE = 'reports/repo-audit-baseline.json';
const IGNORE_DIRS = new Set(['.git', 'node_modules', '.turbo', 'dist', 'build', '.astro', '.next', '.wrangler', '.cache', 'coverage']);
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.astro']);
const PAGE_EXTENSIONS = new Set(['.astro', '.ts', '.tsx', '.js', '.jsx', '.md', '.mdx']);

function parseArgs(argv) {
  const options = {
    jsonPath: DEFAULT_JSON,
    summaryPath: DEFAULT_SUMMARY,
    historyPath: DEFAULT_HISTORY,
    baselinePath: DEFAULT_BASELINE,
    updateHistory: false,
    checkRegression: false,
    writeBaseline: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') options.jsonPath = argv[++i];
    else if (arg === '--summary') options.summaryPath = argv[++i];
    else if (arg === '--history') options.historyPath = argv[++i];
    else if (arg === '--baseline') options.baselinePath = argv[++i];
    else if (arg === '--update-history') options.updateHistory = true;
    else if (arg === '--check-regression') options.checkRegression = true;
    else if (arg === '--write-baseline') options.writeBaseline = true;
  }

  return options;
}

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, filePath), 'utf8'));
  } catch {
    return fallback;
  }
}

function walk(dirRel, output = []) {
  const absolute = path.join(ROOT, dirRel);
  if (!fs.existsSync(absolute)) return output;

  const entries = fs.readdirSync(absolute, { withFileTypes: true });
  for (const entry of entries) {
    const rel = path.join(dirRel, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(rel, output);
      continue;
    }
    output.push(rel);
  }
  return output;
}

function normalizeStem(filePath) {
  const parsed = path.parse(filePath);
  return parsed.name
    .replace(/\.legacy-\d{8}$/, '')
    .replace(/\.(test|spec)$/, '')
    .replace(/index$/, 'index');
}

function detectDuplicateFilenameOverlap(files) {
  const buckets = new Map();
  for (const file of files) {
    const ext = path.extname(file);
    if (!SOURCE_EXTENSIONS.has(ext)) continue;
    const stem = normalizeStem(file);
    const key = `${stem}${ext}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(file);
  }

  const duplicates = [];
  for (const [key, occurrences] of buckets.entries()) {
    if (occurrences.length <= 1) continue;

    const parentDirs = new Set(occurrences.map((occ) => path.dirname(occ)));
    if (parentDirs.size <= 1) continue;

    duplicates.push({
      key,
      count: occurrences.length,
      files: occurrences.sort()
    });
  }

  return duplicates.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function collectPackageInfo() {
  const packageFiles = walk('.').filter((file) => path.basename(file) === 'package.json');
  const packages = [];

  for (const packageFile of packageFiles) {
    const abs = path.join(ROOT, packageFile);
    try {
      const content = JSON.parse(fs.readFileSync(abs, 'utf8'));
      packages.push({
        path: packageFile,
        dir: path.dirname(packageFile),
        name: content.name,
        private: Boolean(content.private),
        dependencies: {
          ...content.dependencies,
          ...content.devDependencies,
          ...content.peerDependencies,
          ...content.optionalDependencies
        }
      });
    } catch {
      // ignore malformed package files from audit
    }
  }

  return packages;
}

function buildCodeCorpus(files) {
  const corpus = new Map();
  for (const file of files) {
    const ext = path.extname(file);
    if (!SOURCE_EXTENSIONS.has(ext) && file !== 'pnpm-workspace.yaml' && file !== 'turbo.json') continue;

    try {
      corpus.set(file, fs.readFileSync(path.join(ROOT, file), 'utf8'));
    } catch {
      // ignore unreadable files
    }
  }
  return corpus;
}

function detectUnreferencedPackages(packageInfo, corpus) {
  const workspacePackages = packageInfo.filter((pkg) => pkg.name && (pkg.dir.startsWith('apps/') || pkg.dir.startsWith('packages/') || pkg.path === 'package.json'));

  const allDeps = new Set();
  for (const pkg of packageInfo) {
    for (const dep of Object.keys(pkg.dependencies || {})) allDeps.add(dep);
  }

  const corpusText = Array.from(corpus.values()).join('\n');
  const unreferenced = [];

  for (const pkg of workspacePackages) {
    if (!pkg.name || pkg.path === 'package.json') continue;

    const explicitDependency = allDeps.has(pkg.name);
    const textualImport = corpusText.includes(pkg.name);

    if (!explicitDependency && !textualImport) {
      unreferenced.push({
        package: pkg.name,
        directory: pkg.dir,
        reason: 'not found in dependency graph or source imports'
      });
    }
  }

  return unreferenced.sort((a, b) => a.package.localeCompare(b.package));
}

function countReferences(corpus, targetFile) {
  const withoutExt = targetFile.replace(path.extname(targetFile), '');
  const normalized = withoutExt.split(path.sep).join('/');
  const baseName = path.basename(withoutExt);

  let references = 0;
  for (const [file, content] of corpus.entries()) {
    if (file === targetFile) continue;

    if (content.includes(normalized) || content.includes(`./${baseName}`) || content.includes(`../${baseName}`) || content.includes(baseName)) {
      references += 1;
    }
  }

  return references;
}

function detectUnreferencedPagesAndComponents(files, corpus) {
  const pages = [];
  const components = [];

  for (const file of files) {
    const ext = path.extname(file);
    if (!PAGE_EXTENSIONS.has(ext)) continue;

    if (file.includes('/src/pages/')) {
      const refs = countReferences(corpus, file);
      if (refs === 0) {
        pages.push({ file, confidence: 'low', reason: 'no source-level references detected; may still be framework-routed' });
      }
    }

    if (file.includes('/src/components/')) {
      const refs = countReferences(corpus, file);
      if (refs === 0) {
        components.push({ file, confidence: 'medium', reason: 'not imported by any source files' });
      }
    }
  }

  return {
    pages: pages.sort((a, b) => a.file.localeCompare(b.file)),
    components: components.sort((a, b) => a.file.localeCompare(b.file))
  };
}

function detectMissingRequiredFiles(packageInfo) {
  const missing = [];

  for (const pkg of packageInfo) {
    if (!(pkg.dir.startsWith('apps/') || pkg.dir.startsWith('packages/'))) continue;

    const template = pkg.dir.startsWith('apps/') ? 'app' : 'package';
    const required = ['package.json', 'README.md'];

    if (template === 'app') {
      required.push('src');
      const hasWorkerConfig = exists(path.join(pkg.dir, 'wrangler.toml'));
      const hasAstroConfig = exists(path.join(pkg.dir, 'astro.config.mjs')) || exists(path.join(pkg.dir, 'astro.config.ts'));
      if (!hasWorkerConfig && !hasAstroConfig) {
        required.push('wrangler.toml|astro.config.mjs');
      }
    }

    if (template === 'package') {
      required.push('src');
    }

    const missingItems = [];
    for (const req of required) {
      if (req.includes('|')) {
        const [a, b] = req.split('|');
        if (!exists(path.join(pkg.dir, a)) && !exists(path.join(pkg.dir, b))) missingItems.push(req);
        continue;
      }

      if (!exists(path.join(pkg.dir, req))) {
        missingItems.push(req);
      }
    }

    if (missingItems.length > 0) {
      missing.push({
        directory: pkg.dir,
        template,
        missing: missingItems
      });
    }
  }

  return missing.sort((a, b) => a.directory.localeCompare(b.directory));
}

function ensureDirectory(filePath) {
  const dir = path.dirname(path.join(ROOT, filePath));
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, payload) {
  ensureDirectory(filePath);
  fs.writeFileSync(path.join(ROOT, filePath), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function writeSummary(filePath, report) {
  const lines = [];
  lines.push('# Repository Audit Summary');
  lines.push('');
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Totals');
  lines.push(`- Duplicate filename overlap candidates: **${report.summary.duplicateFilenameOverlap}**`);
  lines.push(`- Unreferenced packages: **${report.summary.unreferencedPackages}**`);
  lines.push(`- Unreferenced pages: **${report.summary.unreferencedPages}**`);
  lines.push(`- Unreferenced components: **${report.summary.unreferencedComponents}**`);
  lines.push(`- Missing required files: **${report.summary.missingRequiredFiles}**`);
  lines.push('');

  lines.push('## Duplicate Filenames (Top 20)');
  for (const duplicate of report.duplicateFilenameOverlap.slice(0, 20)) {
    lines.push(`- \`${duplicate.key}\` (${duplicate.count})`);
  }
  if (report.duplicateFilenameOverlap.length === 0) lines.push('- None detected.');
  lines.push('');

  lines.push('## Missing Required Files');
  for (const item of report.missingRequiredFiles) {
    lines.push(`- \`${item.directory}\` (${item.template}): missing ${item.missing.join(', ')}`);
  }
  if (report.missingRequiredFiles.length === 0) lines.push('- None detected.');
  lines.push('');

  lines.push('## Unreferenced Artifact Candidates');
  lines.push(`- Packages: ${report.unreferenced.packages.length}`);
  lines.push(`- Pages: ${report.unreferenced.pages.length}`);
  lines.push(`- Components: ${report.unreferenced.components.length}`);

  ensureDirectory(filePath);
  fs.writeFileSync(path.join(ROOT, filePath), `${lines.join('\n')}\n`, 'utf8');
}

function buildReport(options) {
  const files = walk('.');
  const packageInfo = collectPackageInfo();
  const corpus = buildCodeCorpus(files);

  const duplicateFilenameOverlap = detectDuplicateFilenameOverlap(files);
  const unreferencedPackages = detectUnreferencedPackages(packageInfo, corpus);
  const unreferencedArtifacts = detectUnreferencedPagesAndComponents(files, corpus);
  const missingRequiredFiles = detectMissingRequiredFiles(packageInfo);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      duplicateFilenameOverlap: duplicateFilenameOverlap.length,
      unreferencedPackages: unreferencedPackages.length,
      unreferencedPages: unreferencedArtifacts.pages.length,
      unreferencedComponents: unreferencedArtifacts.components.length,
      missingRequiredFiles: missingRequiredFiles.length
    },
    duplicateFilenameOverlap,
    unreferenced: {
      packages: unreferencedPackages,
      pages: unreferencedArtifacts.pages,
      components: unreferencedArtifacts.components
    },
    missingRequiredFiles
  };

  writeJson(options.jsonPath, report);
  writeSummary(options.summaryPath, report);

  if (options.updateHistory) {
    const history = readJson(options.historyPath, []);
    const snapshot = {
      generatedAt: report.generatedAt,
      summary: report.summary
    };
    const nextHistory = Array.isArray(history) ? [...history, snapshot] : [snapshot];
    writeJson(options.historyPath, nextHistory.slice(-180));
  }

  if (options.writeBaseline) {
    writeJson(options.baselinePath, {
      generatedAt: report.generatedAt,
      summary: report.summary
    });
  }

  let hasRegression = false;
  if (options.checkRegression) {
    const baseline = readJson(options.baselinePath, null);
    if (baseline?.summary) {
      const categories = Object.keys(report.summary);
      const regressions = [];
      for (const category of categories) {
        const current = report.summary[category];
        const baselineValue = baseline.summary[category] ?? 0;
        if (current > baselineValue) {
          regressions.push({ category, current, baseline: baselineValue });
        }
      }

      if (regressions.length > 0) {
        hasRegression = true;
        console.error('Regression(s) detected:');
        for (const regression of regressions) {
          console.error(`- ${regression.category}: current=${regression.current}, baseline=${regression.baseline}`);
        }
      }
    } else {
      console.warn(`Baseline not found at ${options.baselinePath}; regression check skipped.`);
    }
  }

  return { report, hasRegression };
}

const options = parseArgs(process.argv.slice(2));
const { report, hasRegression } = buildReport(options);

console.log(`Repository audit complete: ${JSON.stringify(report.summary)}`);
if (hasRegression) process.exit(1);
