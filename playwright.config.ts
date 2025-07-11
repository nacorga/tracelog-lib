import { defineConfig, devices } from '@playwright/test';

const defaultLaunchOptions = {
  args: [
    '--disable-dev-shm-usage',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--no-sandbox',
    '--disable-gpu',
  ]
};

/**
 * @see https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0, // Reduced retries for faster feedback
  /* Increased workers for better CI performance */
  workers: process.env.CI ? 6 : undefined, // Increased to 6 workers
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [['github'], ['html']] : 'html',
  /* Global timeout for entire test suite */
  globalTimeout: process.env.CI ? 25 * 60 * 1000 : undefined, // 25 minutes max
  /* Timeout for each test */
  timeout: process.env.CI ? 45 * 1000 : 30 * 1000, // Reduced to 45s in CI
  /* Expect timeout */
  expect: {
    timeout: process.env.CI ? 10 * 1000 : 5 * 1000, // Faster expectations
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure', // Only keep traces on failure
    /* Screenshot only on failure to save time */
    screenshot: 'only-on-failure',
    /* Video only on failure */
    video: process.env.CI ? 'retain-on-failure' : 'off',
    /* Reduced timeout for faster feedback */
    actionTimeout: process.env.CI ? 15 * 1000 : 10 * 1000,
    /* Navigation timeout */
    navigationTimeout: process.env.CI ? 15 * 1000 : 30 * 1000,
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: defaultLaunchOptions,
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: defaultLaunchOptions,
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        launchOptions: defaultLaunchOptions,
      },
    },
    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        launchOptions: defaultLaunchOptions,
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        launchOptions: defaultLaunchOptions,
      },
    },
  ],
  /* Run local dev server before starting the tests */
  webServer: {
    command: 'npm run serve:test',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
  },
});
