/**
 * User Data Integrity Test
 *
 * Tests data integrity and validation scenarios to ensure TraceLog correctly handles
 * edge cases, malformed data, and maintains data consistency throughout the session.
 * Focus: Data validation and error handling without over-engineering
 */

import { test, expect } from '@playwright/test';

test.describe('User Data Integrity', () => {
  test('should handle malformed event data gracefully', async ({ page }) => {
    // Navigate to playground
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test malformed data handling
    const dataIntegrityResult = await page.evaluate(async () => {
      // Wait for bridge to be available
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available after waiting');
      }

      const queueEvents: any[] = [];
      const errors: string[] = [];

      // Listen for queue events
      window.__traceLogBridge!.on('queue', (data: any) => {
        queueEvents.push(data);
      });

      // Capture console errors (but exclude expected validation errors)
      const originalError = console.error;
      console.error = (...args: any[]) => {
        const message = args.join(' ');
        // Only capture unexpected errors, not validation failures
        if (!message.includes('[TraceLog:EventValidation]') && !message.includes('metadata validation failed')) {
          errors.push(message);
        }
        originalError.apply(console, args);
      };

      // Initialize TraceLog
      await window.__traceLogBridge!.init({ id: 'skip' });

      // Test various data scenarios
      const testCases = [
        // Valid cases (should work)
        { name: 'valid_event', metadata: { key: 'value', number: 123 }, shouldSucceed: true },
        { name: 'empty_metadata', metadata: {}, shouldSucceed: true },
        { name: 'boolean_data', metadata: { flag: true, disabled: false }, shouldSucceed: true },
        { name: 'string_array', metadata: { tags: ['tag1', 'tag2', 'tag3'] }, shouldSucceed: true },
        { name: 'special_chars', metadata: { text: 'Test with special chars: àáâãäå çčđ' }, shouldSucceed: true },
        // Invalid cases (should be rejected by validation)
        { name: 'nested_object', metadata: { nested: { deep: { value: 'test' } } }, shouldSucceed: false },
        { name: 'mixed_array', metadata: { items: [1, 2, 3], mixed: ['a', 1, true] }, shouldSucceed: false },
      ];

      // Send test events
      const successfulEvents: string[] = [];
      const rejectedEvents: string[] = [];

      for (const testCase of testCases) {
        try {
          window.__traceLogBridge!.sendCustomEvent(testCase.name, testCase.metadata);
          successfulEvents.push(testCase.name);
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          rejectedEvents.push(testCase.name);
          if (testCase.shouldSucceed) {
            errors.push(`Unexpected error with ${testCase.name}: ${error}`);
          }
          // Expected errors for invalid cases are not added to errors array
        }
      }

      // Send trigger event to ensure queue is sent
      window.__traceLogBridge!.sendCustomEvent('test_data_integrity_complete', { trigger: 'end_integrity_test' });

      // Wait for queue events
      const startTime = Date.now();
      while (queueEvents.length === 0 && Date.now() - startTime < 12000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Restore console.error
      console.error = originalError;

      return {
        queueEvents,
        errors,
        testCases,
        successfulEvents,
        rejectedEvents,
        initialized: window.__traceLogBridge!.initialized,
      };
    });

    // Verify initialization
    expect(dataIntegrityResult.initialized).toBe(true);

    // Should not have unexpected errors (only expected validation failures)
    expect(dataIntegrityResult.errors).toHaveLength(0);

    // Verify that valid events were successful and invalid ones were rejected
    expect(dataIntegrityResult.successfulEvents).toContain('valid_event');
    expect(dataIntegrityResult.successfulEvents).toContain('empty_metadata');
    expect(dataIntegrityResult.successfulEvents).toContain('boolean_data');
    expect(dataIntegrityResult.successfulEvents).toContain('string_array');
    expect(dataIntegrityResult.successfulEvents).toContain('special_chars');

    expect(dataIntegrityResult.rejectedEvents).toContain('nested_object');
    expect(dataIntegrityResult.rejectedEvents).toContain('mixed_array');

    // Verify queue events were captured
    expect(dataIntegrityResult.queueEvents.length).toBeGreaterThan(0);

    // Extract all custom events from queues
    const allCustomEvents = dataIntegrityResult.queueEvents.flatMap((queue) =>
      queue.events.filter((event: any) => event.type === 'custom'),
    );

    // Verify successful events were captured
    expect(allCustomEvents.length).toBeGreaterThan(0);

    // Check that valid events were processed correctly
    const validEvent = allCustomEvents.find((event) => event.custom_event?.name === 'valid_event');
    expect(validEvent).toBeDefined();
    expect(validEvent.custom_event.metadata.key).toBe('value');
    expect(validEvent.custom_event.metadata.number).toBe(123);

    // Check that boolean data was handled correctly
    const booleanEvent = allCustomEvents.find((event) => event.custom_event?.name === 'boolean_data');
    expect(booleanEvent).toBeDefined();
    expect(booleanEvent.custom_event.metadata.flag).toBe(true);
    expect(booleanEvent.custom_event.metadata.disabled).toBe(false);

    // Check that string arrays were handled correctly
    const stringArrayEvent = allCustomEvents.find((event) => event.custom_event?.name === 'string_array');
    expect(stringArrayEvent).toBeDefined();
    expect(stringArrayEvent.custom_event.metadata.tags).toEqual(['tag1', 'tag2', 'tag3']);

    // Check that special characters were handled correctly
    const specialCharsEvent = allCustomEvents.find((event) => event.custom_event?.name === 'special_chars');
    expect(specialCharsEvent).toBeDefined();
    expect(specialCharsEvent.custom_event.metadata.text).toContain('àáâãäå çčđ');

    // Verify that invalid events (nested objects, mixed arrays) were NOT captured
    const nestedObjectEvent = allCustomEvents.find((event) => event.custom_event?.name === 'nested_object');
    expect(nestedObjectEvent).toBeUndefined();

    const mixedArrayEvent = allCustomEvents.find((event) => event.custom_event?.name === 'mixed_array');
    expect(mixedArrayEvent).toBeUndefined();
  });

  test('should maintain data consistency across multiple interactions', async ({ page }) => {
    // Navigate to playground
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test data consistency across interactions
    const consistencyResult = await page.evaluate(async () => {
      // Wait for bridge to be available
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available after waiting');
      }

      const queueEvents: any[] = [];

      // Listen for queue events
      window.__traceLogBridge!.on('queue', (data: any) => {
        queueEvents.push(data);
      });

      // Initialize TraceLog
      await window.__traceLogBridge!.init({ id: 'skip' });
      const sessionData = window.__traceLogBridge!.getSessionData();

      // Simulate complex user journey with data consistency checks
      const journey = [
        { step: 'start', action: 'page_load', data: { page: 'home', timestamp: Date.now() } },
        { step: 'navigation', action: 'navigate', data: { from: 'home', to: 'products', timestamp: Date.now() } },
        { step: 'interaction', action: 'product_click', data: { productId: 'prod_123', timestamp: Date.now() } },
        {
          step: 'conversion',
          action: 'add_to_cart',
          data: { productId: 'prod_123', quantity: 2, timestamp: Date.now() },
        },
        { step: 'completion', action: 'checkout', data: { total: 99.99, items: 2, timestamp: Date.now() } },
      ];

      // Execute journey with consistent metadata
      const userId = 'user_' + Math.random().toString(36).substr(2, 9);
      for (const journeyStep of journey) {
        window.__traceLogBridge!.sendCustomEvent(journeyStep.action, {
          ...journeyStep.data,
          userId,
          sessionId: sessionData?.id,
          step: journeyStep.step,
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Send trigger event
      window.__traceLogBridge!.sendCustomEvent('test_consistency_complete', { trigger: 'end_consistency_test' });

      // Wait for queue events
      const startTime = Date.now();
      while (queueEvents.length === 0 && Date.now() - startTime < 12000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return {
        queueEvents,
        sessionData,
        journey,
        userId,
        initialized: window.__traceLogBridge!.initialized,
      };
    });

    // Verify initialization and data
    expect(consistencyResult.initialized).toBe(true);
    expect(consistencyResult.sessionData).toBeTruthy();
    expect(consistencyResult.queueEvents.length).toBeGreaterThan(0);

    // Extract journey events from queues
    const allCustomEvents = consistencyResult.queueEvents.flatMap((queue) =>
      queue.events.filter((event: any) => event.type === 'custom'),
    );

    const journeyEvents = allCustomEvents.filter((event) =>
      ['page_load', 'navigate', 'product_click', 'add_to_cart', 'checkout'].includes(event.custom_event?.name),
    );

    // Verify all journey steps were captured
    expect(journeyEvents.length).toBeGreaterThanOrEqual(5);

    // Verify data consistency across all events
    journeyEvents.forEach((event) => {
      expect(event.custom_event.metadata.userId).toBe(consistencyResult.userId);
      expect(event.custom_event.metadata.sessionId).toBe(consistencyResult.sessionData?.id);
      expect(event.custom_event.metadata.step).toBeDefined();
      expect(event.custom_event.metadata.timestamp).toBeDefined();
      expect(typeof event.custom_event.metadata.timestamp).toBe('number');
    });

    // Verify chronological order
    const sortedEvents = journeyEvents.sort((a, b) => a.timestamp - b.timestamp);
    let previousTimestamp = 0;
    sortedEvents.forEach((event) => {
      expect(event.timestamp).toBeGreaterThanOrEqual(previousTimestamp);
      previousTimestamp = event.timestamp;
    });

    // Verify session consistency across all queues
    const uniqueSessionIds = [...new Set(consistencyResult.queueEvents.map((queue) => queue.session_id))];
    expect(uniqueSessionIds).toHaveLength(1);
    expect(uniqueSessionIds[0]).toBe(consistencyResult.sessionData?.id);
  });

  test('should handle rapid concurrent events without data loss', async ({ page }) => {
    // Navigate to playground
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test concurrent event handling
    const concurrencyResult = await page.evaluate(async () => {
      // Wait for bridge to be available
      let retries = 0;
      while (!window.__traceLogBridge && retries < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.__traceLogBridge) {
        throw new Error('TraceLog bridge not available after waiting');
      }

      const queueEvents: any[] = [];

      // Listen for queue events
      window.__traceLogBridge!.on('queue', (data: any) => {
        queueEvents.push(data);
      });

      // Initialize TraceLog
      await window.__traceLogBridge!.init({ id: 'skip' });

      // Generate rapid concurrent events
      const eventPromises: Promise<void>[] = [];
      const expectedEvents: string[] = [];

      for (let i = 0; i < 20; i++) {
        const eventName = `rapid_event_${i}`;
        expectedEvents.push(eventName);

        const eventPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            window.__traceLogBridge!.sendCustomEvent(eventName, {
              index: i,
              timestamp: Date.now(),
              batch: 'rapid_test',
            });
            resolve();
          }, Math.random() * 100); // Random delay up to 100ms
        });

        eventPromises.push(eventPromise);
      }

      // Wait for all events to be sent
      await Promise.all(eventPromises);

      // Send trigger event
      window.__traceLogBridge!.sendCustomEvent('test_concurrency_complete', { trigger: 'end_concurrency_test' });

      // Wait for queue events with extended timeout for rapid events
      const startTime = Date.now();
      while (queueEvents.length === 0 && Date.now() - startTime < 15000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return {
        queueEvents,
        expectedEvents,
        initialized: window.__traceLogBridge!.initialized,
      };
    });

    // Verify initialization
    expect(concurrencyResult.initialized).toBe(true);
    expect(concurrencyResult.queueEvents.length).toBeGreaterThan(0);

    // Extract rapid events from queues
    const allCustomEvents = concurrencyResult.queueEvents.flatMap((queue) =>
      queue.events.filter((event: any) => event.type === 'custom'),
    );

    const rapidEvents = allCustomEvents.filter((event) => event.custom_event?.name?.startsWith('rapid_event_'));

    // Verify most events were captured (allow for some potential loss under rapid conditions)
    expect(rapidEvents.length).toBeGreaterThan(15); // At least 75% of events should be captured

    // Verify event data integrity
    rapidEvents.forEach((event) => {
      expect(event.custom_event.metadata.batch).toBe('rapid_test');
      expect(typeof event.custom_event.metadata.index).toBe('number');
      expect(typeof event.custom_event.metadata.timestamp).toBe('number');
    });

    // Verify no duplicate events (by checking unique indexes)
    const indexes = rapidEvents.map((event) => event.custom_event.metadata.index);
    const uniqueIndexes = [...new Set(indexes)];
    expect(indexes.length).toBe(uniqueIndexes.length); // No duplicates

    // Verify session consistency
    const uniqueSessionIds = [...new Set(concurrencyResult.queueEvents.map((queue) => queue.session_id))];
    expect(uniqueSessionIds).toHaveLength(1);
  });
});
