import { defineConfig } from '@playwright/test';

const host = '127.0.0.1';
// Use a project-specific high port and refuse to reuse an existing server. Reusing a busy default
// Astro port can silently point the suite at an unrelated local project and produce false results.
const port = Number(process.env.PLAYWRIGHT_PORT || 43917);
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: '../tmp/playwright-results',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  // These are local, immutable-artifact tests. A flaky pass must never unblock a release.
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    browserName: 'chromium',
    headless: true,
    locale: 'en-US',
    timezoneId: 'UTC',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
  webServer: {
    command: `npm run preview -- --host ${host} --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
