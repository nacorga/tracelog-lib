import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

test.describe('Session Destroy - Demo Mode', () => {
  test(`should emit only one ${EventType.SESSION_END} event on destroy`, async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      // @ts-ignore
      window.TraceLog.destroy();
    });
    await page.waitForTimeout(1000);

    const sessionEndLogs = consoleLogs.filter((log) => log.includes(`"type":"${EventType.SESSION_END}"`));
    
    expect(sessionEndLogs).toHaveLength(1);
    expect(sessionEndLogs[0]).toContain(`[TraceLog] ${EventType.SESSION_END} event:`);

    const sessionEndEvent = sessionEndLogs[0];

    expect(sessionEndEvent).toContain('"type"');
    expect(sessionEndEvent).toContain('"timestamp"');
    expect(sessionEndEvent).toContain('"page_url"');
  });

  test(`should include session_end_reason in ${EventType.SESSION_END} event on destroy`, async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      // @ts-ignore
      window.TraceLog.destroy();
    });
    await page.waitForTimeout(1000);

    const sessionEndLogs = consoleLogs.filter((log) => 
      log.includes(`"type":"${EventType.SESSION_END}"`) && 
      log.includes('session_end_reason')
    );
    
    expect(sessionEndLogs).toHaveLength(1);
    expect(sessionEndLogs[0]).toContain('"session_end_reason":"manual_stop"');
  });

  test('should properly format session end event on destroy', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      // @ts-ignore
      window.TraceLog.destroy();
    });
    await page.waitForTimeout(1000);

    const sessionEndLogs = consoleLogs.filter((log) => 
      log.includes(`"type":"${EventType.SESSION_END}"`)
    );

    expect(sessionEndLogs).toHaveLength(1);
    
    const sessionEndEvent = sessionEndLogs[0];
    const eventJson = sessionEndEvent.split(`[TraceLog] ${EventType.SESSION_END} event:`)[1];
    const parsedEvent = JSON.parse(eventJson);

    // Verify event structure
    expect(parsedEvent).toHaveProperty('type', EventType.SESSION_END);
    expect(parsedEvent).toHaveProperty('timestamp');
    expect(parsedEvent).toHaveProperty('page_url');
    expect(parsedEvent).toHaveProperty('session_end_reason', 'manual_stop');
  });

  test('should prevent duplicate session events after destroy', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Call destroy
    await page.evaluate(() => {
      // @ts-ignore
      window.TraceLog.destroy();
    });
    await page.waitForTimeout(500);

    // Try to call destroy again
    await page.evaluate(() => {
      try {
        // @ts-ignore
        window.TraceLog.destroy();
      } catch (error) {
        console.log('[TraceLog] Expected error on second destroy:', error.message);
      }
    });
    await page.waitForTimeout(500);

    const sessionEndLogs = consoleLogs.filter((log) => log.includes(`"type":"${EventType.SESSION_END}"`));
    
    // Should still only have one session end event, even after calling destroy twice
    expect(sessionEndLogs).toHaveLength(1);
  });
});
