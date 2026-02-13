import { createGoldshoreAstroConfig } from '@goldshore/config/astro';

export default createGoldshoreAstroConfig({
  aliases: {
    '@goldshore/ui': new URL('../../packages/ui', import.meta.url).pathname,
  },
});
