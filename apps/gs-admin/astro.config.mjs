import { createAstroConfig } from '@goldshore/config/astro';

export default createAstroConfig({
  vite: {
    ssr: {
      noExternal: ['@goldshore/integrations']
    }
  }
});
