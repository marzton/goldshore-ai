/// <reference types="astro/client" />

// Type definitions for environment variables
interface ImportMetaEnv {
  readonly PUBLIC_API: string;
  readonly PUBLIC_GATEWAY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
