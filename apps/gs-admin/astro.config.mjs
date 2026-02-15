import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  srcDir: './src',
  output: 'server',
  adapter: cloudflare(),
  integrations: [tailwind({
    applyBaseStyles: false,
    configFile: "../../tailwind.config.mjs"
  })],
  vite: {
import baseConfig from "@goldshore/config/astro";
import { defineConfig } from "astro/config";

export default defineConfig({
  ...baseConfig,
  // Admin specific overrides
  srcDir: './src', // Redundant if in base, but safe to keep
  output: 'server',
  vite: {
    ...baseConfig.vite,
    resolve: {
      alias: {
        '@packages': new URL('../../packages', import.meta.url).pathname,
        '@apps': new URL('../../apps', import.meta.url).pathname
      }
    },
    ssr: {
      noExternal: ['@goldshore/ui', '@goldshore/theme']
    }
  }
});
