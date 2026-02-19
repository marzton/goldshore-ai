import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export function createAstroConfig() {
  return defineConfig({
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
          // '@goldshore/ui': '../../packages/ui',
          // '@goldshore/theme': '../../packages/theme',
          // '@goldshore/auth': '../../packages/auth',
        }
      }
    }
  });
}
