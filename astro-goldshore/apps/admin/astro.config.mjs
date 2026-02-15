import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  srcDir: "src",
  publicDir: "public",
  server: {
    host: true,
    port: 4322
  },
  vite: {
    resolve: {
      alias: {
        "@theme": "../../packages/theme",
        "@ui": "../../packages/ui",
        "@schema": "../../packages/schema",
      }
    }
  }
});
