import { readFileSync } from 'node:fs';
import path from 'node:path';

type Rule = { description: string; pattern: RegExp };

const REQUIRED_RULES: Record<string, Rule[]> = {
  'apps/gs-gateway/wrangler.toml': [
    {
      description: 'preview service binding from gateway to gs-api',
      pattern: /\[\[env\.preview\.services\]\][\s\S]*?binding\s*=\s*"API"[\s\S]*?service\s*=\s*"gs-api"[\s\S]*?environment\s*=\s*"preview"/m,
    },
  ],
  'apps/gs-agent/wrangler.toml': [
    {
      description: 'preview environment block',
      pattern: /\[env\.preview\]/m,
    },
    {
      description: 'preview Workers AI binding',
      pattern: /\[env\.preview\.ai\][\s\S]*?binding\s*=\s*"AI"/m,
    },
    {
      description: 'preview D1 binding',
      pattern: /\[\[env\.preview\.d1_databases\]\][\s\S]*?binding\s*=\s*"DB"[\s\S]*?database_id\s*=\s*"[^"]+"/m,
    },
  ],
  'apps/gs-admin/wrangler.toml': [
    {
      description: 'preview GS_CONFIG KV binding',
      pattern: /\[\[env\.preview\.kv_namespaces\]\][\s\S]*?binding\s*=\s*"GS_CONFIG"[\s\S]*?id\s*=\s*"9cc2209906a94851b704be57543987a9"/m,
    },
    {
      description: 'preview API origin variable',
      pattern: /\[env\.preview\.vars\][\s\S]*?API_ORIGIN\s*=\s*"https:\/\/api-preview\.goldshore\.ai"/m,
    },
  ],
};

const failures: string[] = [];

for (const [relativePath, rules] of Object.entries(REQUIRED_RULES)) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  const content = readFileSync(fullPath, 'utf8');

  for (const rule of rules) {
    if (!rule.pattern.test(content)) {
      failures.push(`${relativePath}: missing ${rule.description}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Preview binding validation failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Preview binding validation passed.');
