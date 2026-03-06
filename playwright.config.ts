import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/playground',
  outputDir: 'tests/output/e2e',
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
  },
  webServer: {
    command: 'npm run dev:web:server',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
