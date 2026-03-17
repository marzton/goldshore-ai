import cloudflare from '@astrojs/cloudflare';
import { createAstroConfig } from '@goldshore/config/astro';

export default createAstroConfig({
  adapter: cloudflare({
    imageService: 'passthrough',
    mode: 'directory'
  }),
  session: {
    driver: 'memory'
  },
  site: 'https://goldshore.ai',
  redirects: {
    '/developer-hub': '/developer',
  },
});
