import { createAstroConfig } from '@goldshore/config/astro';

export default createAstroConfig({
  // Keep framework-level aliases here; migration-era edge rules live in public/_redirects.
  redirects: {
    '/developer-hub': '/developer',
    '/dev': '/developer',
  },
});
