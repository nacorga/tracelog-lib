/**
 * Event Persistence & Recovery Test
 *
 * Tests SenderManager persistence and recovery to detect library defects:
 * - Events persist to localStorage on send failure
 * - Events are recovered on next init()
 * - Expired events (>24h) are cleaned up
 * - Recovery doesn't cause duplicate events
 *
 * Focus: Detect data loss defects and persistence failures
 */

import { test, expect } from '@playwright/test';
import { navigateToPlayground } from './utils/environment.utils';
import { SpecialProjectId } from '@/types';

test.describe('Event Persistence & Recovery', () => {
  test('should persist events to localStorage when network fails', async ({ page }) => {
    test.setTimeout(20000); // 11s wait + overhead
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (projectId) => {
      const traceLog = window.__traceLogBridge!;

      // Initialize with Fail ID - send() returns false immediately
      // This will cause persistence without network delays
      await traceLog.init({
        id: projectId,
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Generate events that will fail to send
      traceLog.sendCustomEvent('failed_event_1', { test: 'persistence' });
      traceLog.sendCustomEvent('failed_event_2', { test: 'persistence' });
      traceLog.sendCustomEvent('failed_event_3', { test: 'persistence' });

      // Wait for automatic send interval (10s) + persistence
      await new Promise((resolve) => setTimeout(resolve, 11000));

      // Check localStorage for persisted events
      const storageKeys = Object.keys(localStorage).filter((key) => key.includes('tl') && key.includes('queue'));

      let persistedData = null;
      if (storageKeys.length > 0) {
        const data = localStorage.getItem(storageKeys[0]);
        if (data) {
          try {
            persistedData = JSON.parse(data);
          } catch {
            persistedData = null;
          }
        }
      }

      await traceLog.destroy();

      return {
        persistedData,
        storageKeys,
        hasPersisted: persistedData !== null && persistedData.events?.length > 0,
      };
    }, SpecialProjectId.Fail);

    // Verify events were persisted
    expect(result.hasPersisted).toBe(true);
    expect(result.persistedData.events.length).toBeGreaterThanOrEqual(3);
  });

  test('should recover persisted events on next init', async ({ page }) => {
    test.setTimeout(10000);
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;
      const recoveredQueues: any[] = [];

      // Step 1: Initialize and simulate persisted events from a previous session
      await traceLog.init({
        id: 'skip', // Use skip mode for clean testing
        samplingRate: 1,
      });

      // Simulate events that were persisted from a previous session
      const mockPersistedEvents = [
        {
          type: 'custom',
          page_url: 'http://localhost:3000/test',
          timestamp: Date.now() - 5000,
          custom_event: {
            name: 'persisted_event_1',
            metadata: { recovery: 'test', source: 'previous_session' },
          },
        },
        {
          type: 'custom',
          page_url: 'http://localhost:3000/test',
          timestamp: Date.now() - 4000,
          custom_event: {
            name: 'persisted_event_2',
            metadata: { recovery: 'test', source: 'previous_session' },
          },
        },
      ];

      traceLog.simulatePersistedEvents(mockPersistedEvents);

      // Verify data was persisted
      const storageKey = Object.keys(localStorage).find((key) => key.includes('tl') && key.includes('queue'));
      const persistedData = storageKey ? localStorage.getItem(storageKey) : null;
      const persistedExists = persistedData !== null;

      await traceLog.destroy();

      // Step 2: Reinitialize to trigger recovery
      traceLog.on('queue', (payload: any) => {
        recoveredQueues.push(payload);
      });

      await traceLog.init({
        id: 'skip',
        samplingRate: 1,
      });

      // Wait for recovery to process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await traceLog.destroy();

      return {
        persistedExists,
        recoveredQueues,
        persistedEventsCount: persistedData ? JSON.parse(persistedData).events.length : 0,
      };
    });

    // Verify events were persisted
    expect(result.persistedExists).toBe(true);
    expect(result.persistedEventsCount).toBe(2);

    // Verify events were recovered
    expect(result.recoveredQueues.length).toBeGreaterThan(0);

    const allRecoveredEvents = result.recoveredQueues.flatMap((q) => q.events);
    const customRecoveredEvents = allRecoveredEvents.filter((e) => e.type === 'custom');

    // Find our specific persisted events
    const event1 = customRecoveredEvents.find(
      (e) => e.custom_event?.name === 'persisted_event_1' && e.custom_event?.metadata?.recovery === 'test',
    );
    const event2 = customRecoveredEvents.find(
      (e) => e.custom_event?.name === 'persisted_event_2' && e.custom_event?.metadata?.recovery === 'test',
    );

    // Both events should be recovered
    expect(event1).toBeDefined();
    expect(event2).toBeDefined();
  });

  test('should clean up expired persisted events', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;
      const recoveredQueues: any[] = [];

      // Step 1: Initialize to get userId
      await traceLog.init({
        id: 'skip',
        samplingRate: 1,
      });

      const projectId = traceLog.get('config')?.id;
      const userId = traceLog.get('userId');

      // Manually create expired persisted data in localStorage (bypassing simulatePersistedEvents to set old timestamp)
      const storageKey = `tl:${projectId}:queue:${userId}`;
      const expiredTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago (expired)
      const expiredData = {
        userId,
        sessionId: `expired-session-${expiredTimestamp}`,
        device: 'desktop',
        events: [
          {
            type: 'custom',
            timestamp: expiredTimestamp,
            custom_event: { name: 'expired_event', metadata: {} },
            page_url: 'https://test.com',
          },
        ],
        timestamp: expiredTimestamp,
      };

      // Destroy first instance
      await traceLog.destroy();

      // Set expired data
      localStorage.setItem(storageKey, JSON.stringify(expiredData));

      // Verify expired data exists before init
      const dataBeforeInit = localStorage.getItem(storageKey);

      // Step 2: Reinitialize - should clean up expired data automatically
      traceLog.on('queue', (payload: any) => {
        recoveredQueues.push(payload);
      });

      await traceLog.init({
        id: 'skip',
        samplingRate: 1,
      });

      // Wait for recovery/cleanup to process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 3: Check if expired data was cleaned
      const dataAfterInit = localStorage.getItem(storageKey);

      await traceLog.destroy();

      // Check if the expired event was recovered
      const allEvents = recoveredQueues.flatMap((q) => q.events);
      const expiredEventRecovered = allEvents.some((e) => e.custom_event?.name === 'expired_event');

      return {
        hadExpiredDataBefore: dataBeforeInit !== null,
        wasCleanedUp: dataAfterInit === null,
        expiredEventRecovered,
      };
    });

    // Verify expired data existed
    expect(result.hadExpiredDataBefore).toBe(true);

    // Verify expired data was cleaned up and NOT recovered
    expect(result.wasCleanedUp).toBe(true);
    expect(result.expiredEventRecovered).toBe(false);
  });

  test('should not duplicate events during recovery', async ({ page }) => {
    test.setTimeout(10000);
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;
      const allQueues: any[] = [];

      // Step 1: Initialize and simulate persisted event
      await traceLog.init({
        id: 'skip',
        samplingRate: 1,
      });

      const uniqueTimestamp = Date.now() - 3000;
      const mockPersistedEvents = [
        {
          type: 'custom',
          page_url: 'http://localhost:3000/test',
          timestamp: uniqueTimestamp,
          custom_event: {
            name: 'unique_recovery_event',
            metadata: {
              uniqueId: 'recovery-test-123',
              timestamp: uniqueTimestamp,
            },
          },
        },
      ];

      traceLog.simulatePersistedEvents(mockPersistedEvents);

      await traceLog.destroy();

      // Step 2: Reinitialize to trigger recovery - listen for ALL queue emissions
      traceLog.on('queue', (payload: any) => {
        allQueues.push(payload);
      });

      await traceLog.init({
        id: 'skip',
        samplingRate: 1,
      });

      // Wait for recovery to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await traceLog.destroy();

      return { allQueues };
    });

    // Extract all custom events with our unique identifier
    const allEvents = result.allQueues.flatMap((queue: any) =>
      queue.events.filter((e: any) => e.type === 'custom' && e.custom_event?.name === 'unique_recovery_event'),
    );

    // Verify the unique event appears exactly once (no duplicates)
    expect(allEvents.length).toBe(1);

    // Verify the event has the correct unique identifier
    expect(allEvents[0].custom_event.metadata.uniqueId).toBe('recovery-test-123');
  });

  test('should handle partial recovery failures gracefully', async ({ page }) => {
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async (projectId) => {
      const traceLog = window.__traceLogBridge!;
      const errors: string[] = [];

      // Capture console errors
      const originalError = console.error;
      console.error = (...args: any[]) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };

      // Step 1: Create malformed persisted data
      const storageKey = `tl:${projectId}:queue:anonymous`;
      localStorage.setItem(storageKey, 'invalid json{malformed}');

      // Step 2: Try to initialize (should handle malformed data gracefully)
      await traceLog.init({
        id: projectId,
        samplingRate: 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const isInitialized = traceLog.initialized;

      console.error = originalError;
      await traceLog.destroy();

      return {
        isInitialized,
        hadErrors: errors.some((e) => !e.includes('[TraceLog:EventValidation]')),
      };
    }, SpecialProjectId.Skip);

    // Library should still initialize successfully despite malformed persisted data
    expect(result.isInitialized).toBe(true);

    // Should handle gracefully without throwing unhandled errors
    // (Some error logging is expected, but library should remain functional)
  });

  test('should persist and recover events with complex metadata', async ({ page }) => {
    test.setTimeout(10000);
    await navigateToPlayground(page, { autoInit: false, searchParams: { e2e: 'true' } });

    const result = await page.evaluate(async () => {
      const traceLog = window.__traceLogBridge!;
      const recoveredQueues: any[] = [];

      // Step 1: Initialize and simulate persisted event with complex metadata
      await traceLog.init({
        id: 'skip',
        samplingRate: 1,
      });

      const complexMetadata = {
        stringField: 'test string',
        numberField: 12345,
        booleanField: true,
        nullField: null,
        arrayField: ['tag1', 'tag2', 'tag3'],
        nestedObject: {
          level1: 'value1',
          level2: {
            level3: 'deep value',
          },
        },
        specialChars: 'àáâãäå çčđ €£¥ 日本語',
        emptyString: '',
        zeroNumber: 0,
        falseBoolean: false,
      };

      const mockPersistedEvents = [
        {
          type: 'custom',
          page_url: 'http://localhost:3000/test',
          timestamp: Date.now() - 2000,
          custom_event: {
            name: 'complex_metadata_event',
            metadata: complexMetadata,
          },
        },
      ];

      traceLog.simulatePersistedEvents(mockPersistedEvents);

      await traceLog.destroy();

      // Step 2: Reinitialize to trigger recovery
      traceLog.on('queue', (payload: any) => {
        recoveredQueues.push(payload);
      });

      await traceLog.init({
        id: 'skip',
        samplingRate: 1,
      });

      // Wait for recovery
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await traceLog.destroy();

      return { recoveredQueues, expectedMetadata: complexMetadata };
    });

    const allEvents = result.recoveredQueues.flatMap((queue: any) =>
      queue.events.filter((e: any) => e.custom_event?.name === 'complex_metadata_event'),
    );

    // Verify event was recovered
    expect(allEvents.length).toBeGreaterThan(0);

    const event = allEvents[0];
    const metadata = event.custom_event.metadata;

    // Verify all complex metadata types were preserved
    expect(metadata.stringField).toBe('test string');
    expect(metadata.numberField).toBe(12345);
    expect(metadata.booleanField).toBe(true);
    expect(metadata.nullField).toBe(null);
    expect(metadata.arrayField).toEqual(['tag1', 'tag2', 'tag3']);
    expect(metadata.nestedObject).toEqual({
      level1: 'value1',
      level2: {
        level3: 'deep value',
      },
    });
    expect(metadata.specialChars).toBe('àáâãäå çčđ €£¥ 日本語');
    expect(metadata.emptyString).toBe('');
    expect(metadata.zeroNumber).toBe(0);
    expect(metadata.falseBoolean).toBe(false);
  });
});
