import cloudflare from '@astrojs/cloudflare';
import { createAstroConfig } from '@goldshore/config/astro';

export default createAstroConfig({
  adapter: cloudflare({
    imageService: 'passthrough',
    mode: 'directory'
  }),
  site: 'https://goldshore.ai',
  redirects: {
    '/developer-hub': '/developer',
  },
});
