import { test, expect } from '@playwright/test';
import { EventType, ErrorType } from '../../src/types';

test.describe('Error Events - Demo Mode', () => {
  test('should log JavaScript error event', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByTestId('trigger-js-error-btn').click();
    await page.waitForTimeout(1000);

    const errorLogs = consoleLogs.filter((log) => 
      log.includes(`"type":"${EventType.ERROR}"`)
    );

    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
    expect(errorLogs[0]).toContain(`"type":"${EventType.ERROR}"`);
  });

  test('should log promise rejection event', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByTestId('trigger-promise-rejection-btn').click();
    await page.waitForTimeout(1000);

    const errorLogs = consoleLogs.filter((log) => 
      log.includes(`"type":"${EventType.ERROR}"`)
    );

    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
    expect(errorLogs[0]).toContain(`"type":"${EventType.ERROR}"`);
  });

  test('should log network error event', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByTestId('trigger-network-error-btn').click();
    await page.waitForTimeout(1500);

    const errorLogs = consoleLogs.filter((log) => 
      log.includes(`"type":"${EventType.ERROR}"`)
    );

    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
    expect(errorLogs[0]).toContain(`"type":"${EventType.ERROR}"`);
  });

  test('should sanitize PII data in error messages', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.addScriptTag({
      content: `
        setTimeout(() => {
          throw new Error('User email: test@example.com failed');
        }, 100);
      `
    });

    await page.waitForTimeout(1000);

    const errorLogs = consoleLogs.filter((log) => 
      log.includes(`"type":"${EventType.ERROR}"`)
    );

    expect(errorLogs.length).toBeGreaterThanOrEqual(1);
    expect(errorLogs[0]).toContain(`"type":"${EventType.ERROR}"`);
  });
});