/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Type definitions for environment variables
interface ImportMetaEnv {
    readonly PUBLIC_API: string;
    readonly PUBLIC_AUTH_TOKEN_URL: string;
    readonly PUBLIC_AUTH_CLIENT_ID: string;
    readonly AUTH_CLIENT_SECRET: string;
    // Add other env vars as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
