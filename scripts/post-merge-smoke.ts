import { setTimeout as delay } from 'node:timers/promises';

const DEFAULT_TARGETS = [
  'https://goldshore.org/',
  'https://goldshore.org/status',
  'https://api.goldshore.org/health',
];

const parseTargets = () => {
  const fromEnv = process.env.SMOKE_URLS?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_TARGETS;
};

const withTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
    });
  } finally {
    clearTimeout(timer);
  }
};

const run = async () => {
  const targets = parseTargets();
  const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? 8_000);
  const retries = Number(process.env.SMOKE_RETRIES ?? 2);

  const failures: string[] = [];

  for (const target of targets) {
    let success = false;

    for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
      try {
        const response = await withTimeout(target, timeoutMs);
        if (response.status >= 200 && response.status < 400) {
          console.log(`PASS ${target} -> ${response.status}`);
          success = true;
          break;
        }

        console.log(`WARN ${target} -> ${response.status} (attempt ${attempt})`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`WARN ${target} -> ${message} (attempt ${attempt})`);
      }

      await delay(500 * attempt);
    }

    if (!success) {
      failures.push(target);
    }
  }

  if (failures.length > 0) {
    console.error('\nSmoke tests failed for:');
    failures.forEach((target) => console.error(`- ${target}`));
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
