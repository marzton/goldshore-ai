import { fileURLToPath } from "node:url";
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

const workspaceAlias = {
  "@packages": fileURLToPath(new URL("../../../packages", import.meta.url)),
  "@apps": fileURLToPath(new URL("../../../apps", import.meta.url)),
  "@goldshore/theme": fileURLToPath(new URL("../../../packages/theme", import.meta.url)),
  "@goldshore/ui": fileURLToPath(new URL("../../../packages/ui", import.meta.url)),
  "@goldshore/auth": fileURLToPath(new URL("../../../packages/auth", import.meta.url))
};

export default defineConfig({
  srcDir: "./src",
  outDir: "./dist",
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
      noExternal: ["@goldshore/theme", "@goldshore/ui", "@goldshore/auth"]
    },
    resolve: {
      alias: workspaceAlias
    }
  }
});
