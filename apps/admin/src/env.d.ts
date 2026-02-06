/// <reference types="astro/client" />

// Type definitions for environment variables
interface ImportMetaEnv {
  readonly PUBLIC_API: string;
  readonly PUBLIC_GATEWAY: string;

  // Auth Configuration
  readonly PUBLIC_AUTH_TOKEN_URL: string;
  readonly PUBLIC_AUTH_CLIENT_ID: string;

  /**
   * @deprecated SECURITY RISK: Do not use PUBLIC_ prefix for secrets. Use AUTH_CLIENT_SECRET instead.
   */
  readonly PUBLIC_AUTH_CLIENT_SECRET?: string;

  /**
   * Secure Client Secret (Server-side only)
   */
  readonly AUTH_CLIENT_SECRET?: string;

  readonly PUBLIC_ADMIN_AUDIT_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
