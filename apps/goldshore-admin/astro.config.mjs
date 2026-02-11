// @ts-check
import { defineConfig } from 'astro/config';
import { createGoldshoreAstroConfig } from '@goldshore/config/astro';

// https://astro.build/config
export default defineConfig(createGoldshoreAstroConfig());
import { sharedNoExternal } from '../../packages/config/astro-shared.mjs';

// https://astro.build/config
export default defineConfig({
  vite: {
    ssr: {
      // Include shared packages in the SSR build
      noExternal: sharedNoExternal,
    },
  },
});
