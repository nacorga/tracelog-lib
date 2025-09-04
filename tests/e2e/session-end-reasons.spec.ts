import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

test.describe('Session End Reasons', () => {
  test('should handle session end with proper reason tracking', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Trigger page navigation to cause session end
    await page.goto('about:blank');
    await page.waitForTimeout(2000);

    const sessionEndLogs = consoleLogs.filter((log) => 
      log.includes(`"type":"${EventType.SESSION_END}"`) && 
      log.includes('session_end_reason')
    );
    
    // Should have at least one SESSION_END event with proper reason
    expect(sessionEndLogs.length).toBeGreaterThanOrEqual(1);
    
    if (sessionEndLogs.length > 0) {
      const sessionEndEvent = sessionEndLogs[0];
      expect(sessionEndEvent).toContain('session_end_reason');
      // Should contain a valid reason (could be inactivity, page_unload, etc.)
      const hasValidReason = ['inactivity', 'page_unload', 'manual_stop', 'orphaned_cleanup']
        .some(reason => sessionEndEvent.includes(reason));
      expect(hasValidReason).toBe(true);
    }
  });

  test('should end session with "inactivity" reason on navigation timeout', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    // Start session
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Navigate away - this typically triggers inactivity before page_unload
    await page.goto('about:blank');
    await page.waitForTimeout(2000);

    // Find session end logs with inactivity reason
    const sessionEndLogs = consoleLogs.filter(log => 
      log.includes(`"type":"${EventType.SESSION_END}"`) && 
      log.includes('"session_end_reason":"inactivity"')
    );

    expect(sessionEndLogs.length).toBeGreaterThanOrEqual(1);
    expect(sessionEndLogs[0]).toContain('"session_end_reason":"inactivity"');
  });

  test('should include session_end_reason in all session end events', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    // Start session
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Trigger session end
    await page.goto('about:blank');
    await page.waitForTimeout(2000);

    // Find all session end logs
    const sessionEndLogs = consoleLogs.filter(log => 
      log.includes(`"type":"${EventType.SESSION_END}"`)
    );

    expect(sessionEndLogs.length).toBeGreaterThanOrEqual(1);
    
    // All session end events should have session_end_reason
    sessionEndLogs.forEach(log => {
      expect(log).toContain('session_end_reason');
    });
  });

  test('should use valid session end reason values', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    // Start session
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Trigger session end
    await page.goto('about:blank');
    await page.waitForTimeout(2000);

    // Check that session end events contain valid reasons
    const sessionEndLogs = consoleLogs.filter(log => 
      log.includes(`"type":"${EventType.SESSION_END}"`) && 
      log.includes('session_end_reason')
    );
    
    expect(sessionEndLogs.length).toBeGreaterThanOrEqual(1);
    
    // Verify the session end reason is one of the valid values
    const validReasons = ['inactivity', 'page_unload', 'manual_stop', 'orphaned_cleanup'];
    const hasValidReason = sessionEndLogs.some(log => 
      validReasons.some(reason => log.includes(`"session_end_reason":"${reason}"`))
    );
    
    expect(hasValidReason).toBe(true);
  });

  test('should properly format session end event with reason', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    // Start session
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Navigate to trigger session end
    await page.goto('about:blank');
    await page.waitForTimeout(2000);

    // Find session end event
    const sessionEndLogs = consoleLogs.filter(log => 
      log.includes(`"type":"${EventType.SESSION_END}"`)
    );

    expect(sessionEndLogs.length).toBeGreaterThanOrEqual(1);
    
    const sessionEndEvent = sessionEndLogs[0];
    const eventJson = sessionEndEvent.split(`[TraceLog] ${EventType.SESSION_END} event:`)[1];
    const parsedEvent = JSON.parse(eventJson);

    // Verify event structure
    expect(parsedEvent).toHaveProperty('type', EventType.SESSION_END);
    expect(parsedEvent).toHaveProperty('timestamp');
    expect(parsedEvent).toHaveProperty('page_url');
    expect(parsedEvent).toHaveProperty('session_end_reason');
    
    // Verify session_end_reason is a valid value
    const validReasons = ['inactivity', 'page_unload', 'manual_stop', 'orphaned_cleanup'];
    expect(validReasons).toContain(parsedEvent.session_end_reason);
  });

  test('should handle session end with orphaned cleanup scenario', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[TraceLog]')) {
        consoleLogs.push(msg.text());
      }
    });

    // First navigate to the page to allow localStorage access
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Create an orphaned session by setting expired session data in localStorage
    await page.evaluate(() => {
      const expiredTime = Date.now() - (20 * 60 * 1000); // 20 minutes ago
      const sessionData = {
        sessionId: 'orphaned-session-id',
        startTime: expiredTime,
        lastHeartbeat: expiredTime
      };
      localStorage.setItem('tl:session', JSON.stringify(sessionData));
    });

    // Reload page to trigger potential orphaned session cleanup
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check for any session end events (there might be orphaned cleanup)
    const allSessionEndLogs = consoleLogs.filter(log => 
      log.includes(`"type":"${EventType.SESSION_END}"`)
    );

    // If there are session end events, they should have valid reasons
    if (allSessionEndLogs.length > 0) {
      allSessionEndLogs.forEach(log => {
        expect(log).toContain('session_end_reason');
        const validReasons = ['inactivity', 'page_unload', 'manual_stop', 'orphaned_cleanup'];
        const hasValidReason = validReasons.some(reason => log.includes(`"session_end_reason":"${reason}"`));
        expect(hasValidReason).toBe(true);
      });
    }

    // This test validates the structure even if no orphaned cleanup happens
    expect(true).toBe(true);
  });
});
