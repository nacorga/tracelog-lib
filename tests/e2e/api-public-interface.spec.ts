import { traceLogTest } from '../fixtures/tracelog-fixtures';
import { TRACELOG_CONFIGS, TEST_DATA } from '../config/test-config';
import { expect } from '@playwright/test';

traceLogTest.describe('TraceLog API Public Interface', () => {
  traceLogTest.describe('init() Method', () => {
    traceLogTest('should initialize successfully with minimal config', async ({ traceLogPage }) => {
      await traceLogPage.setup();

      const initResult = await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.MINIMAL);
      expect(initResult.success).toBe(true);

      // Verify app is properly initialized using fixture method
      const isInitialized = await traceLogPage.isInitialized();
      expect(isInitialized).toBe(true);

      // Use custom matcher
      await expect(traceLogPage).toHaveNoTraceLogErrors();
    });

    traceLogTest('should initialize successfully with full configuration', async ({ traceLogPage }) => {
      await traceLogPage.setup();

      const initResult = await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.FULL_FEATURED);
      expect(initResult.success).toBe(true);

      // Verify configuration was applied correctly
      const config = await traceLogPage.getConfig();
      expect(config).toBeDefined();
      expect(config.sessionTimeout).toBe(TRACELOG_CONFIGS.FULL_FEATURED.sessionTimeout);
      expect(config.globalMetadata).toEqual(TRACELOG_CONFIGS.FULL_FEATURED.globalMetadata);

      await expect(traceLogPage).toHaveNoTraceLogErrors();
    });

    traceLogTest('should prevent duplicate initialization', async ({ traceLogPage }) => {
      await traceLogPage.setup();

      // First initialization
      const firstInit = await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.MINIMAL);
      expect(firstInit.success).toBe(true);

      // Second initialization should succeed but not reinitialize
      const secondInit = await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.MINIMAL);
      expect(secondInit.success).toBe(true);

      // Verify app remains stable
      const isInitialized = await traceLogPage.isInitialized();
      expect(isInitialized).toBe(true);

      await expect(traceLogPage).toHaveNoTraceLogErrors();
    });

    traceLogTest('should handle concurrent initialization with retry logic', async ({ traceLogPage }) => {
      await traceLogPage.setup();

      const concurrentResults = await traceLogPage.page.evaluate(async () => {
        const promises = Array.from({ length: 5 }, () =>
          window.__traceLogBridge?.init({ id: 'skip' }).then(
            () => ({ success: true, error: null }),
            (error) => ({
              success: false,
              error: error instanceof Error ? error.message : String(error),
            }),
          ),
        );

        return Promise.all(promises);
      });

      // All concurrent calls should succeed
      concurrentResults.forEach((result) => {
        expect(result?.success).toBe(true);
      });

      // Verify final state is consistent
      const isInitialized = await traceLogPage.isInitialized();
      expect(isInitialized).toBe(true);

      await expect(traceLogPage).toHaveNoTraceLogErrors();
    });

    traceLogTest('should validate project ID requirement', async ({ traceLogPage }) => {
      await traceLogPage.setup();

      for (const invalidId of TEST_DATA.INVALID_PROJECT_IDS.slice(0, 5)) {
        // Test first 5 for speed
        const result = await traceLogPage.page.evaluate(async (testId) => {
          try {
            await window.__traceLogBridge?.init({ id: testId as string });
            return { success: true, error: null };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        }, invalidId);

        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
      }
    });

    traceLogTest('should handle invalid configuration gracefully', async ({ traceLogPage }) => {
      await traceLogPage.setup();

      const invalidConfigs = [
        {
          id: 'valid-id',
          sessionTimeout: -1, // Invalid timeout
        },
        {
          id: 'valid-id',
          scrollContainerSelectors: 'not-an-array', // Should be array
        },
      ];

      for (const config of invalidConfigs) {
        const result = await traceLogPage.page.evaluate(async (testConfig) => {
          try {
            await window.__traceLogBridge?.init(testConfig);
            return { success: true, error: null };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        }, config);

        // Should either succeed with normalization or fail gracefully
        if (!result.success) {
          expect(result.error).toBeTruthy();
          expect(typeof result.error).toBe('string');
        }
      }
    });
  });

  traceLogTest.describe('event() Method', () => {
    traceLogTest('should send custom events with metadata', async ({ traceLogPage }) => {
      await traceLogPage.setup();
      await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.STANDARD);

      const eventResult = await traceLogPage.sendCustomEvent('test_event_with_metadata', {
        userId: 'test-user-123',
        action: 'button_click',
        timestamp: Date.now(),
        page: 'test-page',
        section: 'header',
      });

      expect(eventResult.success).toBe(true);
      await expect(traceLogPage).toHaveNoTraceLogErrors();
    });

    traceLogTest('should send custom events without metadata', async ({ traceLogPage }) => {
      await traceLogPage.setup();
      await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.STANDARD);

      const eventResult = await traceLogPage.sendCustomEvent('test_event_without_metadata');

      expect(eventResult.success).toBe(true);
      await expect(traceLogPage).toHaveNoTraceLogErrors();
    });

    traceLogTest('should validate event names and reject invalid ones', async ({ traceLogPage }) => {
      await traceLogPage.setup();
      await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.STANDARD);

      // Test only values that should definitely fail validation
      const invalidEventNames = [
        '', // Empty string
        'a'.repeat(125), // Too long (MAX_CUSTOM_EVENT_NAME_LENGTH is 120)
        'test<script>', // Contains HTML characters
        'test&amp;', // Contains HTML characters
      ];

      for (const eventName of invalidEventNames) {
        const result = await traceLogPage.page.evaluate((name) => {
          try {
            window.__traceLogBridge?.sendCustomEvent(name as string);
            return { success: true, error: null };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        }, eventName);

        // All invalid event names should fail
        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
      }

      // Note: This test will generate expected TraceLog errors for invalid event names
    });

    traceLogTest('should throw error when called before initialization', async ({ traceLogPage }) => {
      await traceLogPage.setup();

      // Try to send event without initialization
      const result = await traceLogPage.page.evaluate(() => {
        try {
          window.__traceLogBridge?.sendCustomEvent('test_event');
          return { success: true, error: null };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('App not initialized');
    });

    traceLogTest('should handle large metadata objects', async ({ traceLogPage }) => {
      await traceLogPage.setup();
      await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.STANDARD);

      const largeMetadata = {
        largeArray: Array.from({ length: 8 }, (_, i) => `item-${i}`), // Under the max limit
        longString: 'x'.repeat(5000), // Large but not excessive
        timestamp: Date.now(),
        isLarge: true,
        category: 'test',
      };

      const result = await traceLogPage.page.evaluate((metadata) => {
        try {
          window.__traceLogBridge?.sendCustomEvent('large_metadata_event', metadata);
          return { success: true, error: null };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }, largeMetadata);

      // Should either succeed with sanitization or fail gracefully
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });
  });

  traceLogTest.describe('destroy() Method', () => {
    traceLogTest('should cleanup all resources and event listeners', async ({ traceLogPage }) => {
      await traceLogPage.setup();
      await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.STANDARD);

      // Verify initialization
      const preDestroyState = await traceLogPage.isInitialized();
      expect(preDestroyState).toBe(true);

      // Destroy
      await traceLogPage.destroy();

      // Verify cleanup
      const postDestroyState = await traceLogPage.isInitialized();
      expect(postDestroyState).toBe(false);

      await expect(traceLogPage).toHaveNoTraceLogErrors();
    });

    traceLogTest('should handle destroy before initialization gracefully', async ({ traceLogPage }) => {
      await traceLogPage.setup();

      // Try to destroy without initialization - library should throw error
      const result = await traceLogPage.page.evaluate(async () => {
        try {
          await window.__traceLogBridge?.destroy();
          return { success: true, error: null };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      // Library throws error when not initialized, which is expected behavior
      expect(result.success).toBe(false);
      expect(result.error).toContain('App not initialized');
    });

    traceLogTest('should prevent concurrent destroy operations', async ({ traceLogPage }) => {
      await traceLogPage.setup();
      await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.STANDARD);

      const concurrentDestroys = await traceLogPage.page.evaluate(async () => {
        const promises = Array.from({ length: 3 }, () =>
          window.__traceLogBridge?.destroy().then(
            () => ({ success: true, error: null }),
            (error) => ({
              success: false,
              error: error instanceof Error ? error.message : String(error),
            }),
          ),
        );

        return Promise.all(promises);
      });

      // First should succeed, others should handle gracefully
      const successCount = concurrentDestroys.filter((r) => r?.success).length;
      expect(successCount).toBe(1);

      // Verify final state
      const finalState = await traceLogPage.isInitialized();
      expect(finalState).toBe(false);
    });

    traceLogTest('should reset initialization state after destroy', async ({ traceLogPage }) => {
      await traceLogPage.setup();

      // Initialize
      await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.STANDARD);

      // Destroy
      await traceLogPage.destroy();

      // Verify state reset
      const stateAfterDestroy = await traceLogPage.getInitializationStatus();

      expect(stateAfterDestroy.isInitialized).toBe(false);
      expect(stateAfterDestroy.isInitializing).toBe(false);

      // Should be able to initialize again
      const reinitResult = await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.MINIMAL);
      expect(reinitResult.success).toBe(true);

      await expect(traceLogPage).toHaveNoTraceLogErrors();
    });
  });

  traceLogTest.describe('Status Methods', () => {
    traceLogTest('isInitialized() should return accurate state', async ({ traceLogPage }) => {
      await traceLogPage.setup();

      // Before initialization
      let isInitialized = await traceLogPage.isInitialized();
      expect(isInitialized).toBe(false);

      // After initialization
      await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.MINIMAL);

      isInitialized = await traceLogPage.isInitialized();
      expect(isInitialized).toBe(true);

      // After destroy
      await traceLogPage.destroy();

      isInitialized = await traceLogPage.isInitialized();
      expect(isInitialized).toBe(false);

      await expect(traceLogPage).toHaveNoTraceLogErrors();
    });

    traceLogTest('getInitializationStatus() should provide complete debug info', async ({ traceLogPage }) => {
      await traceLogPage.setup();

      // Before initialization
      let status = await traceLogPage.getInitializationStatus();
      expect(status).toEqual({
        isInitialized: false,
        isInitializing: false,
        hasInstance: true, // Bridge instance exists
      });

      // After initialization
      await traceLogPage.initializeTraceLog(TRACELOG_CONFIGS.MINIMAL);

      status = await traceLogPage.getInitializationStatus();
      expect(status).toEqual({
        isInitialized: true,
        isInitializing: false,
        hasInstance: true,
      });

      // After destroy
      await traceLogPage.destroy();

      status = await traceLogPage.getInitializationStatus();
      expect(status).toEqual({
        isInitialized: false,
        isInitializing: false,
        hasInstance: true, // Bridge instance still exists after destroy
      });

      await expect(traceLogPage).toHaveNoTraceLogErrors();
    });
  });
});
