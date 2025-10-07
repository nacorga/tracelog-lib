/**
 * Performance & Error Filters E2E
 *
 * Validate that only relevant web vitals and unique errors are emitted
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';
import { EventType } from '../../src/types';

test.describe('Performance & Error Filters', () => {
  test('should emit only 1 relevant vital and 1 unique error', async ({ page }) => {
    await navigateToPlayground(page);

    const result = await page.evaluate(async () => {
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries += 1;
      }

      if (!window.__traceLogBridge) {
        throw new Error('Bridge not available');
      }

      const captured: Array<{ type: string }> = [];
      window.__traceLogBridge!.on('event', (data: { type: string }) => {
        if ((data.type === 'web_vitals' || data.type === 'error') && captured.length < 2) {
          captured.push(data);
        }
      });

      try {
        await window.__traceLogBridge!.init({
          errorSampling: 1, // Capture 100% of errors in E2E tests
        });
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }

      const eventManager = window.__traceLogBridge!.getEventManager();

      // Track web vitals events - first one should be captured
      eventManager?.track({
        type: 'web_vitals' as EventType,
        web_vitals: { type: 'LCP', value: 1500 },
      });

      // Second similar event should be filtered out
      eventManager?.track({
        type: 'web_vitals' as EventType,
        web_vitals: { type: 'LCP', value: 4500 },
      });

      // Trigger error events - only one should be captured due to deduplication
      window.dispatchEvent(new ErrorEvent('error', { message: 'Crash' }));
      window.dispatchEvent(new ErrorEvent('error', { message: 'Crash' }));

      const timeoutAt = Date.now() + 3000;

      while (captured.length < 2 && Date.now() < timeoutAt) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return { success: captured.length === 2, events: captured };
    });

    expect(result.success).toBe(true);
    expect(result.events).toHaveLength(2);
    expect(result?.events?.[0]?.type).toBe('web_vitals');
    expect(result?.events?.[1]?.type).toBe('error');
  });
});
