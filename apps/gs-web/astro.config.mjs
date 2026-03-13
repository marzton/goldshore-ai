import baseConfig from "@goldshore/config/astro";
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  srcDir: "./src",
  outDir: "./dist",
  prefetch: true,
  adapter: cloudflare(),
  integrations: [
    tailwind({
      applyBaseStyles: false,
      configFile: "../../tailwind.config.mjs",
    }),
  ],
  vite: {
    ssr: {
      noExternal: ["@goldshore/theme", "@goldshore/ui", "@goldshore/auth"],
    },
  },
});
