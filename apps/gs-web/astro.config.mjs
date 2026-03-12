import { createAstroConfig } from '@goldshore/config/astro';

export default createAstroConfig({
  // Astro handles minimal framework-level aliases; migration-era edge redirects live in public/_redirects.
  redirects: {
    '/developer-hub': '/developer',
    '/dev': '/developer',
  },
});
