import baseConfig from "@goldshore/config/astro";
import { defineConfig } from "astro/config";

export default defineConfig({
  ...baseConfig,
  srcDir: "./src",
  output: "server"
});
