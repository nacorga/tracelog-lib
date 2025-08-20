import { test, expect } from '@playwright/test';
import { EventType, ErrorType } from '../../src/types';

test.describe('Error Sampling - Demo Mode', () => {
  test('should log errors (basic test)', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByTestId('trigger-js-error-btn').click();
    await page.waitForTimeout(500);

    const errorLogs = consoleLogs.filter((log) => 
      log.includes(`"type":"${EventType.ERROR}"`)
    );

    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
  });

  test('should log promise rejection errors', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.addInitScript(() => {
      Math.random = () => 0.05;
      // @ts-ignore
      window.TraceLogConfig = { errorSampling: 1.0 };
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByTestId('trigger-promise-rejection-btn').click();
    await page.waitForTimeout(500);

    const errorLogs = consoleLogs.filter((log) => 
      log.includes(`"type":"${EventType.ERROR}"`)
    );

    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
  });

  test('should log network errors', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.addInitScript(() => {
      Math.random = () => 0.05;
      // @ts-ignore
      window.TraceLogConfig = { errorSampling: 1.0 };
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByTestId('trigger-network-error-btn').click();
    await page.waitForTimeout(1000);

    const errorLogs = consoleLogs.filter((log) => 
      log.includes(`"type":"${EventType.ERROR}"`)
    );


    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
  });
});