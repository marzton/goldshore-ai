const sharedNoExternalPackages = ['@goldshore/auth', '@goldshore/config', '@goldshore/ui', '@goldshore/utils'];

export function createGoldshoreAstroConfig(overrides = {}) {
  return {
    vite: {
      ssr: {
        noExternal: sharedNoExternalPackages,
      },
    },
    ...overrides,
  };
}
