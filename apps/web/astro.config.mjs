import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  srcDir: './src',
  output: 'server',
  prefetch: true,
  adapter: cloudflare(),
  prefetch: true,
  integrations: [
    // tailwind({
    //   applyBaseStyles: false,
    //   configFile: "../../tailwind.config.mjs"
    // })
  ],
  vite: {
    publicDir: './openapi',
    resolve: {
      alias: {
        '@goldshore/ui': new URL('../../packages/ui', import.meta.url).pathname,
        '@goldshore/theme': new URL('../../packages/theme', import.meta.url).pathname,
        '@packages': new URL('../../packages', import.meta.url).pathname,
        '@apps': new URL('../../apps', import.meta.url).pathname
      }
    },
    ssr: {
      noExternal: ['@goldshore/ui', '@goldshore/theme']
    }
  }
});
