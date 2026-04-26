import { defineConfig, devices } from '@playwright/test';

// E2E configuration for the SetTable PWA.
// Run locally:
//   npx playwright install chromium      (one-time)
//   npm run test:e2e
//
// In CI: see .github/workflows/e2e.yml — it builds the web bundle, serves it
// on a local port, and runs these tests against it.

const PORT = Number(process.env.PORT ?? 4173);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 60 * 1000,
  expect: { timeout: 8 * 1000 },
  fullyParallel: false, // tests share Firebase state — keep them serial
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    locale: 'he-IL',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Local dev server: assumes you've run `npx expo export --platform web`
  // first to produce ./dist, then this serves it.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npx serve dist -p ${PORT} --no-clipboard`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 30 * 1000,
      },
});
