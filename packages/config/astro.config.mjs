import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

export function createAstroConfig(options = {}) {
  const { ssrNoExternal = [] } = options;
  return defineConfig({
    srcDir: './src',
    outDir: './dist',
    prefetch: true,
    adapter: cloudflare(),
    integrations: [
      tailwind({
        applyBaseStyles: false,
        configFile: '../../tailwind.config.mjs',
      }),
    ],
    vite: {
      ssr: {
        noExternal: ['@goldshore/theme', '@goldshore/ui', '@goldshore/auth', ...ssrNoExternal],
      },
      resolve: {
        alias: {
          '@packages': new URL('../../packages', import.meta.url).pathname,
          '@apps': new URL('../../apps', import.meta.url).pathname,
        },
      },
    },
    ...options,
  });
}
