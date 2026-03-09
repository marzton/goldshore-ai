#!/usr/bin/env node

import crypto from 'node:crypto';

const required = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'];
for (const name of required) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const zoneId = process.env.CLOUDFLARE_ZONE_ID ?? process.env.CF_ZONE_ID;
const kvNamespaceName = process.env.CLOUDFLARE_KV_NAMESPACE_NAME ?? 'GOLDSHORE_KV';
const workerEnv = process.env.CLOUDFLARE_WORKER_ENV ?? 'production';
const secretName = process.env.SECRET_NAME ?? 'AIPROXYSIGNING_KEY';
const kvKey = process.env.KV_KEY ?? 'AIPROXYSIGNING_KEY';
const dryRun = process.argv.includes('--dry-run');

const usingLegacyZoneFallback = !process.env.CLOUDFLARE_ZONE_ID && Boolean(process.env.CF_ZONE_ID);

if (usingLegacyZoneFallback) {
  console.log('ℹ️ Using CF_ZONE_ID fallback; prefer CLOUDFLARE_ZONE_ID');
}

const headers = {
  Authorization: `Bearer ${apiToken}`,
  'Content-Type': 'application/json'
};

async function cfRequest(path, init = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers ?? {})
    }
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok || payload.success === false) {
    const errors = payload?.errors?.map((err) => err.message).join('; ') || response.statusText;
    throw new Error(`Cloudflare API ${response.status} ${path}: ${errors}`);
  }

  return payload.result;
}

async function verifyToken() {
  await cfRequest('/user/tokens/verify');
  console.log('✅ Token verified');
}

async function getAccount() {
  const accounts = await cfRequest('/accounts');
  const account = accounts.find((entry) => entry.id === accountId);
  if (!account) {
    throw new Error(`Account ${accountId} was not found for this token.`);
  }
  console.log(`✅ Account found: ${account.name} (${account.id})`);
}

async function getZoneDetails() {
  if (!zoneId) {
    console.log('ℹ️ CLOUDFLARE_ZONE_ID not set; skipping zone checks.');
    return;
  }
  const zone = await cfRequest(`/zones/${zoneId}`);
  console.log(`✅ Zone found: ${zone.name} (${zone.id})`);
}

async function listWorkers() {
  const services = await cfRequest(`/accounts/${accountId}/workers/services`);
  if (!services.length) {
    throw new Error('No worker services found for account.');
  }
  console.log(`✅ Found ${services.length} worker service(s)`);
  return services;
}

async function resolveKvNamespaceId() {
  const namespaces = await cfRequest(`/accounts/${accountId}/storage/kv/namespaces`);
  const match = namespaces.find((ns) => ns.title.includes(kvNamespaceName));
  if (!match) {
    throw new Error(`KV namespace containing "${kvNamespaceName}" not found.`);
  }
  console.log(`✅ KV namespace found: ${match.title} (${match.id})`);
  return match.id;
}

async function upsertWorkerSecret(serviceName, value) {
  const path = `/accounts/${accountId}/workers/services/${serviceName}/environments/${workerEnv}/secrets`;
  if (dryRun) {
    console.log(`🧪 [dry-run] Would rotate ${secretName} for ${serviceName}`);
    return;
  }

  await cfRequest(path, {
    method: 'PUT',
    body: JSON.stringify({
      name: secretName,
      text: value,
      type: 'secret_text'
    })
  });
  console.log(`✅ Rotated ${secretName} for ${serviceName}`);
}

async function listWorkerSecrets(serviceName) {
  const path = `/accounts/${accountId}/workers/services/${serviceName}/environments/${workerEnv}/secrets`;
  const secrets = await cfRequest(path);
  console.log(`✅ ${serviceName}: ${secrets.length} secret metadata item(s) in ${workerEnv}`);
}

async function listWorkerDeployments(serviceName) {
  const path = `/accounts/${accountId}/workers/services/${serviceName}/environments/${workerEnv}/deployments`;
  const deployments = await cfRequest(path);
  console.log(`✅ ${serviceName}: ${deployments.length} deployment record(s)`);
}

async function upsertKvValue(namespaceId, key, value) {
  const path = `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;
  if (dryRun) {
    console.log(`🧪 [dry-run] Would write KV key ${key}`);
    return;
  }

  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'text/plain'
    },
    body: value
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`KV write failed (${response.status}): ${body}`);
  }

  console.log(`✅ Wrote KV value for ${key}`);
}

async function readKvValue(namespaceId, key) {
  const path = `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`KV read failed (${response.status}): ${body}`);
  }

  const value = await response.text();
  console.log(`✅ Read KV value for ${key} (${value.length} chars)`);
}

async function listWorkerDataUsage() {
  const usage = await cfRequest(`/accounts/${accountId}/workers/data-usage`);
  const seriesLength = Array.isArray(usage?.series) ? usage.series.length : 0;
  console.log(`✅ Worker analytics retrieved (${seriesLength} series item(s))`);
}

async function listHealthChecks() {
  if (!zoneId) return;
  const healthChecks = await cfRequest(`/zones/${zoneId}/healthchecks`);
  console.log(`✅ Retrieved ${healthChecks.length} health check(s)`);
}

async function run() {
  await verifyToken();
  await getAccount();
  await getZoneDetails();

  const newSigningKey = process.env[secretName] ?? crypto.randomBytes(32).toString('base64url');
  if (!process.env[secretName]) {
    console.log(`ℹ️ ${secretName} not set; generated a new value for rotation.`);
  }

  const services = await listWorkers();
  for (const service of services) {
    await listWorkerSecrets(service.name);
    await upsertWorkerSecret(service.name, newSigningKey);
    await listWorkerDeployments(service.name);
  }

  const namespaceId = await resolveKvNamespaceId();
  await upsertKvValue(namespaceId, kvKey, newSigningKey);
  await readKvValue(namespaceId, kvKey);

  await listWorkerDataUsage();
  await listHealthChecks();
  console.log(dryRun ? '✅ Dry run complete.' : '✅ Rotation complete.');
}

run().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
