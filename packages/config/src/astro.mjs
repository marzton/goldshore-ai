import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export function createGoldshoreAstroConfig({ aliases = {} } = {}) {
  return defineConfig({
    output: 'server',
    adapter: cloudflare(),
    vite: {
      resolve: { alias: aliases },
      ssr: {
        noExternal: ['@goldshore/config', '@goldshore/ui', '@goldshore/theme'],
      },
    },
  });
}
