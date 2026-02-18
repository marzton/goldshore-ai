import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  srcDir: './src',
  outDir: './dist',
  output: 'server',
  prefetch: true,
  adapter: cloudflare(),
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
        '@goldshore/auth',
        '@goldshore/integrations'
      ]
    },
    resolve: {
      alias: {
        '@packages': new URL('../../packages', import.meta.url).pathname,
        '@apps': new URL('../../apps', import.meta.url).pathname,
        '@goldshore/theme': path.resolve(__dirname, '../../packages/theme'),
        '@goldshore/ui': path.resolve(__dirname, '../../packages/ui'),
      }
    }
  }
});
