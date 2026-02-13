/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_NAME?: string;
  readonly CF_PAGES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
