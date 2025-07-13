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

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? [['github'], ['html']] : 'html',
  globalTimeout: process.env.CI ? 15 * 60 * 1000 : undefined,
  timeout: process.env.CI ? 45 * 1000 : 30 * 1000,
  expect: {
    timeout: process.env.CI ? 10 * 1000 : 5 * 1000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    actionTimeout: process.env.CI ? 15 * 1000 : 10 * 1000,
    navigationTimeout: process.env.CI ? 15 * 1000 : 30 * 1000,
  },
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
  webServer: {
    command: 'npm run serve:test',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
  },
});
