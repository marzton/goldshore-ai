import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  // We are running the server manually in the background
  // webServer: {
  //   command: 'pnpm dev',
  //   port: 4321,
  //   reuseExistingServer: true,
  //   timeout: 120_000,
  // },
});
