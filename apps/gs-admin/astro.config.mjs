import baseConfig from "@goldshore/config/astro";
import { defineConfig } from "astro/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  ...baseConfig,
  // Admin specific overrides
  srcDir: './src', // Redundant if in base, but safe to keep
  output: 'server',
  vite: {
    ...baseConfig.vite,
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
    resolve: {
      alias: {
        '@packages': new URL('../../packages', import.meta.url).pathname,
        '@apps': new URL('../../apps', import.meta.url).pathname,
        '@goldshore/theme': path.resolve(__dirname, '../../packages/theme'),
        '@goldshore/ui': path.resolve(__dirname, '../../packages/ui'),
      }
    },
    ssr: {
      noExternal: ['@goldshore/ui', '@goldshore/theme']
    }
  }
});
