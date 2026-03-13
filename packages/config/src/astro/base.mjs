import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

const workspaceAlias = {
  "@packages": new URL("../../../packages", import.meta.url).pathname,
  "@apps": new URL("../../../apps", import.meta.url).pathname,
  "@goldshore/theme": new URL("../../../packages/theme", import.meta.url).pathname,
  "@goldshore/ui": new URL("../../../packages/ui", import.meta.url).pathname,
  "@goldshore/auth": new URL("../../../packages/auth", import.meta.url).pathname
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
