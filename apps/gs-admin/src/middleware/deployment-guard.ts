import { defineMiddleware } from 'astro:middleware';

type DeploymentGuardCheck = {
  key: string;
  label: string;
  requiredBy: 'gateway' | 'api' | 'both';
  present: boolean;
};

type DeploymentGuardStatus = {
  ready: boolean;
  checkedAt: string;
  checks: DeploymentGuardCheck[];
  missing: string[];
};

const REQUIRED_ENV_KEYS: Array<Omit<DeploymentGuardCheck, 'present'>> = [
  {
    key: 'CF_ACCESS_CLIENT_ID',
    label: 'Cloudflare Access client id',
    requiredBy: 'gateway'
  },
  {
    key: 'CF_ACCESS_CLIENT_SECRET',
    label: 'Cloudflare Access client secret',
    requiredBy: 'gateway'
  },
  {
    key: 'OPENAI_API_KEY',
    label: 'OpenAI API key',
    requiredBy: 'gateway'
  },
  {
    key: 'AI_PROXY_SIGNING_KEY',
    label: 'Gateway/API handshake signing key',
    requiredBy: 'both'
  },
  {
    key: 'GS_API_URL',
    label: 'API origin URL for service fetches',
    requiredBy: 'api'
  }
];

export const deploymentGuardMiddleware = defineMiddleware(async (context, next) => {
  if (!context.url.pathname.startsWith('/admin/workers')) {
    return next();
  }

  const env = (context.locals.runtime?.env ?? {}) as Record<string, unknown>;

  const checks = REQUIRED_ENV_KEYS.map((rule) => ({
    ...rule,
    present: typeof env[rule.key] === 'string' && String(env[rule.key]).trim().length > 0
  }));

  const status: DeploymentGuardStatus = {
    ready: checks.every((check) => check.present),
    checkedAt: new Date().toISOString(),
    checks,
    missing: checks.filter((check) => !check.present).map((check) => check.key)
  };

  context.locals.deploymentGuard = status;

  return next();
});
