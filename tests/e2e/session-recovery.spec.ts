import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

test.describe('Session Recovery', () => {
  test('should initialize session recovery manager', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    // Navigate to page and wait for session start
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check that session starts without errors
    const sessionStartLogs = consoleLogs.filter(log =>
      log.includes(`"type":"${EventType.SESSION_START}"`)
    );

    expect(sessionStartLogs).toHaveLength(1);

    // Verify basic session event structure
    const sessionEvent = sessionStartLogs[0];
    const eventJson = sessionEvent.split(`[TraceLog] ${EventType.SESSION_START} event:`)[1];
    const parsedEvent = JSON.parse(eventJson);

    expect(parsedEvent).toHaveProperty('type', EventType.SESSION_START);
    expect(parsedEvent).toHaveProperty('timestamp');
    expect(parsedEvent).toHaveProperty('page_url');
  });

  test('should handle session storage and cleanup', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    // Navigate to page and establish session
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check that session starts
    const sessionStartLogs = consoleLogs.filter(log =>
      log.includes(`"type":"${EventType.SESSION_START}"`)
    );

    expect(sessionStartLogs).toHaveLength(1);

    // Navigate away to trigger session end
    await page.goto('about:blank');
    await page.waitForTimeout(2000);

    // Should have session end event
    const sessionEndLogs = consoleLogs.filter(log =>
      log.includes(`"type":"${EventType.SESSION_END}"`)
    );

    expect(sessionEndLogs.length).toBeGreaterThan(0);
  });

  test('should handle page reload gracefully', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    // Navigate to page and establish session
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    consoleLogs.splice(0);

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Should start session again without errors
    const sessionStartLogs = consoleLogs.filter(log =>
      log.includes(`"type":"${EventType.SESSION_START}"`)
    );

    expect(sessionStartLogs).toHaveLength(1);

    // Verify session event structure
    const sessionEvent = sessionStartLogs[0];
    const eventJson = sessionEvent.split(`[TraceLog] ${EventType.SESSION_START} event:`)[1];
    const parsedEvent = JSON.parse(eventJson);

    expect(parsedEvent).toHaveProperty('type', EventType.SESSION_START);
    expect(parsedEvent).toHaveProperty('timestamp');
  });

  test('should handle localStorage cleanup', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    // Navigate to page and establish session
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Clear localStorage to simulate cleanup scenario
    await page.evaluate(() => {
      localStorage.clear();
    });

    consoleLogs.splice(0);

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Should start new session without errors
    const sessionStartLogs = consoleLogs.filter(log =>
      log.includes(`"type":"${EventType.SESSION_START}"`)
    );

    expect(sessionStartLogs).toHaveLength(1);

    // Should not have error logs
    const errorLogs = consoleLogs.filter(log =>
      log.includes('error') || log.includes('Error') || log.includes('failed')
    );

    expect(errorLogs).toHaveLength(0);
  });
});