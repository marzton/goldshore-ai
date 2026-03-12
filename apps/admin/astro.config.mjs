import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  srcDir: './src',
  integrations: [],
  vite: {
    resolve: {
      alias: {
        '@goldshore/ui': new URL('../../packages/ui/src', import.meta.url).pathname,
        '@goldshore/theme': new URL('../../packages/theme/src', import.meta.url).pathname
      }
    },
    ssr: {
      // ensure monorepo packages are bundled
      noExternal: ['@goldshore/ui', '@goldshore/theme']
    }
  }
});
