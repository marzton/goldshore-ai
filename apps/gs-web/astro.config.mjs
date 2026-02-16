import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  srcDir: './src',
  outDir: './dist',
  prefetch: true,
  adapter: cloudflare(),
  vite: {
    ...baseConfig.vite,
    resolve: {
      ...baseConfig.vite?.resolve,
      alias: {
        ...baseConfig.vite?.resolve?.alias,
        '@goldshore/theme': path.resolve(__dirname, '../../packages/theme'),
        '@goldshore/ui': path.resolve(__dirname, '../../packages/ui'),
  integrations: [
    tailwind({
      applyBaseStyles: false,
      configFile: "../../tailwind.config.mjs"
    })
  ],
  vite: {
    ssr: {
      noExternal: [
        '@goldshore/theme',
        '@goldshore/ui',
        '@goldshore/auth'
      ]
    },
    resolve: {
      alias: {
        '@goldshore/theme': path.resolve(__dirname, '../../packages/theme/src'),
        // '@goldshore/ui': '../../packages/ui',
        // '@goldshore/auth': '../../packages/auth',
      }
    }
  }
});
