import { createAstroConfig } from '@goldshore/config/astro';

export default createAstroConfig({
  // Keep framework-level aliases here; migration-era edge rules live in public/_redirects.
  redirects: {
    // Keep Astro redirects limited to framework-level aliases for active Astro routes.
    // Legacy migration/cutover mappings should live in `public/_redirects` (Cloudflare source of truth).
    '/developer': '/developer-hub',
    '/apps/risk-radar': '/risk-radar',
  },
});
