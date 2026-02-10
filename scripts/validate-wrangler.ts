import fs from 'node:fs';
import path from 'node:path';

// Define expected bindings for each worker
const EXPECTED_BINDINGS: Record<string, string[]> = {
  'apps/api-worker/wrangler.toml': [
    'kv_namespaces',
    'd1_databases',
    'r2_buckets',
    'ai',
  ],
  'apps/control-worker/wrangler.toml': [
    'kv_namespaces',
    'r2_buckets',
    'services',
  ],
  'apps/gateway/wrangler.toml': ['kv_namespaces', 'queues', 'services', 'ai'],
  // gs-agent uses a shared config in infra
  'infra/cloudflare/gs-agent.wrangler.toml': ['queues'],
  // mail-worker doesn't use bindings yet, but we can check for basic config
  'apps/mail-worker/wrangler.toml': [],
};

function validateWranglerToml(filePath: string, expectedBindings: string[]) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const errors: string[] = [];

  for (const binding of expectedBindings) {
    // Simple regex check for section headers like [[kv_namespaces]] or [ai]
    // Also handles nested like [[queues.producers]] matching "queues"
    const regex = new RegExp(`\\[\\[?.*${binding}.*\\]\\]?`, 'i');
    if (!regex.test(content)) {
      errors.push(`Missing binding section: ${binding}`);
    }
  }

  // Check compatibility flags
  if (!content.includes('compatibility_flags = ["nodejs_compat"]')) {
    // Allow flexibility in formatting but check presence
    if (!/compatibility_flags\s*=\s*\[.*"nodejs_compat".*\]/.test(content)) {
      errors.push(
        'Missing or incorrect compatibility_flags = ["nodejs_compat"]',
      );
    }
  }

  if (errors.length > 0) {
    console.error(`❌ Validation failed for ${filePath}:`);
    errors.forEach((e) => console.error(`   - ${e}`));
    return false;
  } else {
    console.log(`✅ ${filePath} is valid.`);
    return true;
  }
}

function main() {
  console.log('Validating wrangler.toml files...');
  let hasError = false;

  for (const [filePath, bindings] of Object.entries(EXPECTED_BINDINGS)) {
    if (!validateWranglerToml(filePath, bindings)) {
      hasError = true;
    }
  }

  if (hasError) {
    process.exit(1);
  }
}

main();
