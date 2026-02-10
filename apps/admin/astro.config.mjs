import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  srcDir: './src',
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    tailwind({
      applyBaseStyles: false,
      configFile: '../../tailwind.config.mjs',
    }),
  ],
  vite: {
    resolve: {
      alias: {
        '@packages': new URL('../../packages', import.meta.url).pathname,
        '@apps': new URL('../../apps', import.meta.url).pathname,
      },
    },
    ssr: {
      noExternal: ['@goldshore/ui', '@goldshore/theme'],
    },
  },
});
