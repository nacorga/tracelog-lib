import { test, expect } from '@playwright/test';
import { EventType } from '../../src/types';

test.describe('Cross-Tab Session Continuity', () => {
  test('should initialize cross-tab session manager', async ({ page }) => {
    // Navigate to page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Check if cross-tab session data exists
    const crossTabData = await page.evaluate(() => {
      try {
        const data = localStorage.getItem('tl:test:cross_tab_session');
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    });

    // Cross-tab session should be initialized
    expect(crossTabData).toBeTruthy();
    expect(crossTabData.sessionId).toBeTruthy();
    expect(crossTabData.tabCount).toBeGreaterThan(0);
  });

  test('should detect BroadcastChannel support', async ({ page }) => {
    // Navigate to page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Check if BroadcastChannel is supported
    const broadcastChannelSupported = await page.evaluate(() => {
      return typeof window !== 'undefined' && 'BroadcastChannel' in window;
    });

    expect(broadcastChannelSupported).toBe(true);
  });

  test('should handle session activity in single tab', async ({ page }) => {
    // Navigate to page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Get initial activity from cross-tab session
    const initialActivity = await page.evaluate(() => {
      try {
        const data = localStorage.getItem('tl:test:cross_tab_session');
        return data ? JSON.parse(data).lastActivity : 0;
      } catch {
        return 0;
      }
    });

    expect(initialActivity).toBeGreaterThan(0);

    // Wait a bit (simulate some time passing)
    await page.waitForTimeout(5000);

    // Check that cross-tab session activity timestamp is reasonable
    const currentActivity = await page.evaluate(() => {
      try {
        const data = localStorage.getItem('tl:test:cross_tab_session');
        return data ? JSON.parse(data).lastActivity : 0;
      } catch {
        return 0;
      }
    });

    // Activity timestamp should be current (within last few seconds)
    const now = Date.now();
    const timeDiff = now - currentActivity;
    expect(timeDiff).toBeLessThan(10000); // Within 10 seconds
    expect(timeDiff).toBeGreaterThanOrEqual(0);
  });

  test('should maintain session data structure', async ({ page }) => {
    // Navigate to page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Check cross-tab session data structure
    const crossTabData = await page.evaluate(() => {
      try {
        const data = localStorage.getItem('tl:test:cross_tab_session');
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    });

    // Verify data structure
    expect(crossTabData).toHaveProperty('sessionId');
    expect(crossTabData).toHaveProperty('startTime');
    expect(crossTabData).toHaveProperty('lastActivity');
    expect(crossTabData).toHaveProperty('tabCount');
    expect(crossTabData).toHaveProperty('recoveryAttempts');

    // Values should be reasonable
    expect(typeof crossTabData.sessionId).toBe('string');
    expect(crossTabData.sessionId.length).toBeGreaterThan(0);
    expect(crossTabData.tabCount).toBeGreaterThan(0);
    expect(crossTabData.lastActivity).toBeGreaterThan(0);
  });

  test('should handle tab info storage', async ({ page }) => {
    // Navigate to page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Check if tab info is stored
    const tabInfo = await page.evaluate(() => {
      try {
        const data = localStorage.getItem('tl:test:tab_info');
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    });

    // Tab info should exist
    expect(tabInfo).toBeTruthy();
    expect(tabInfo).toHaveProperty('id');
    expect(tabInfo).toHaveProperty('lastHeartbeat');
    expect(tabInfo).toHaveProperty('isLeader');
    expect(tabInfo).toHaveProperty('sessionId');
    expect(tabInfo).toHaveProperty('startTime');

    // Values should be reasonable
    expect(typeof tabInfo.id).toBe('string');
    expect(tabInfo.id.length).toBeGreaterThan(0);
    expect(tabInfo.lastHeartbeat).toBeGreaterThan(0);
    expect(typeof tabInfo.isLeader).toBe('boolean');
  });
});
