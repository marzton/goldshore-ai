import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export function createAstroConfig(overrides = {}) {
  const baseNoExternal = [
    '@goldshore/theme',
    '@goldshore/ui',
    '@goldshore/auth'
  ];

  const extraNoExternal = overrides?.vite?.ssr?.noExternal || [];
  // Deduplicate just in case
  const mergedNoExternal = [...new Set([...baseNoExternal, ...extraNoExternal])];

  const config = {
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
        noExternal: mergedNoExternal
      },
      resolve: {
        alias: {
          // '@goldshore/ui': '../../packages/ui',
          // '@goldshore/theme': '../../packages/theme',
          // '@goldshore/auth': '../../packages/auth',
        }
      }
    }
  };

  // Merge integrations
  if (overrides.integrations) {
    config.integrations.push(...overrides.integrations);
  }

  // Helper to merge objects shallowly (except vite)
  const finalConfig = {
    ...config,
    ...overrides,
    // Merge vite config carefully
    vite: {
      ...config.vite,
      ...(overrides.vite || {}),
      ssr: {
        ...config.vite.ssr,
        ...(overrides.vite?.ssr || {}),
        noExternal: mergedNoExternal
      },
      resolve: {
        ...config.vite.resolve,
        ...(overrides.vite?.resolve || {}),
        alias: {
            ...config.vite.resolve.alias,
            ...(overrides.vite?.resolve?.alias || {})
        }
      }
    }
  };

  // Remove integrations from overrides in final spread if we handled it manually?
  // Actually spread `...overrides` overwrites `integrations`.
  // So we need to ensure `finalConfig.integrations` is correct.
  finalConfig.integrations = [
      ...config.integrations,
      ...(overrides.integrations || [])
  ];

  return defineConfig(finalConfig);
}

export default createAstroConfig();
