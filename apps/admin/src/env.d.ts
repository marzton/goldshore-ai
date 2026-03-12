/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API: string;
  readonly PUBLIC_GATEWAY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
