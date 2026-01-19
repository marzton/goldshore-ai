import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  srcDir: './src',
  outDir: './dist',
  prefetch: true,
  adapter: cloudflare(),
  integrations: [
    // tailwind({
    //   applyBaseStyles: false,
    //   configFile: "../../tailwind.config.mjs"
    // })
  ],
  vite: {
    publicDir: './openapi',
    ssr: {
      noExternal: [
        '@goldshore/theme',
        '@goldshore/ui',
        '@goldshore/auth'
      ]
    },
    resolve: {
      alias: {
        // '@goldshore/ui': '../../packages/ui',
        // '@goldshore/theme': '../../packages/theme',
        // '@goldshore/auth': '../../packages/auth',
      }
    }
  }
});
