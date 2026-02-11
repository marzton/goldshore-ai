import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export function createAstroConfig(dirname) {
  return defineConfig({
    srcDir: './src',
    output: 'server',
    adapter: cloudflare(),
    integrations: [],
    vite: {
      resolve: {
        alias: {
          '@goldshore/ui': new URL('../../packages/ui', import.meta.url).pathname,
          '@goldshore/theme': new URL('../../packages/theme', import.meta.url).pathname,
          '@theme': new URL('../../packages/theme', import.meta.url).pathname,
          '@ui': new URL('../../packages/ui', import.meta.url).pathname
        }
      },
      ssr: {
        noExternal: ['@goldshore/ui', '@goldshore/theme']
      }
    }
  });
}
