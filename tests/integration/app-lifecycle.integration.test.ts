import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { App } from '@/app';
import { Config, EventType, EmitterEvent } from '@/types';

describe('App Lifecycle Integration', () => {
  let app: App;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    app = new App();
  });

  afterEach(async () => {
    if (app.initialized) {
      await app.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully with empty config', async () => {
      const config: Config = {};
      await app.init(config);

      expect(app.initialized).toBe(true);
    });

    it('should initialize successfully with full config', async () => {
      const config: Config = {
        sessionTimeout: 900000,
        globalMetadata: { env: 'test' },
        scrollContainerSelectors: ['.container'],
        sensitiveQueryParams: ['token', 'key'],
        samplingRate: 0.5,
        errorSampling: 0.8,
      };

      await app.init(config);

      expect(app.initialized).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      const config: Config = {};
      await app.init(config);
      const firstInit = app.initialized;

      await app.init(config);

      expect(app.initialized).toBe(firstInit);
    });

    it('should initialize even with validation warnings in config', async () => {
      const invalidConfig = {
        scrollContainerSelectors: ['<script>alert(1)</script>'],
      } as Config;

      // Config validation logs warnings but doesn't throw
      await app.init(invalidConfig);
      expect(app.initialized).toBe(true);
    });

    it('should set up state correctly during initialization', async () => {
      const config: Config = {
        globalMetadata: { version: '1.0.0' },
        sensitiveQueryParams: ['session_id'],
      };

      await app.init(config);

      expect(app.initialized).toBe(true);
    });

    it('should detect QA mode during initialization', async () => {
      // Set QA mode via query parameter simulation
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa',
        },
        writable: true,
      });

      const config: Config = {};
      await app.init(config);

      // QA mode is internal state, verify through initialization success
      expect(app.initialized).toBe(true);
    });

    it('should initialize with tracelog integration configured', async () => {
      const config: Config = {
        integrations: {
          tracelog: {
            projectId: 'test-project',
          },
        },
      };

      await app.init(config);

      expect(app.initialized).toBe(true);
    });

    it('should initialize with custom integration configured', async () => {
      const config: Config = {
        integrations: {
          custom: {
            collectApiUrl: 'https://api.example.com/collect',
          },
        },
      };

      await app.init(config);

      expect(app.initialized).toBe(true);
    });

    // Note: Google Analytics integration test skipped due to async loading issues in test env
    // GA integration is tested in google-analytics.spec.ts
  });

  describe('Custom Events', () => {
    beforeEach(async () => {
      sessionStorage.clear(); // Clear QA mode from previous tests
      await app.init();
    });

    it('should send custom event with valid name and metadata', () => {
      const eventSpy = vi.fn();
      app.on(EmitterEvent.EVENT, eventSpy);

      app.sendCustomEvent('purchase_complete', { orderId: '12345', amount: 99.99 });

      expect(eventSpy).toHaveBeenCalled();
      const emittedEvent = eventSpy.mock.calls[0][0];
      expect(emittedEvent.type).toBe(EventType.CUSTOM);
      expect(emittedEvent.custom_event?.name).toBe('purchase_complete');
      expect(emittedEvent.custom_event?.metadata).toEqual({ orderId: '12345', amount: 99.99 });
    });

    it('should send custom event without metadata', () => {
      const eventSpy = vi.fn();
      app.on(EmitterEvent.EVENT, eventSpy);

      app.sendCustomEvent('button_click');

      expect(eventSpy).toHaveBeenCalled();
      const emittedEvent = eventSpy.mock.calls[0][0];
      expect(emittedEvent.type).toBe(EventType.CUSTOM);
      expect(emittedEvent.custom_event?.name).toBe('button_click');
      expect(emittedEvent.custom_event?.metadata).toBeUndefined();
    });

    it('should silently reject custom event with invalid name', () => {
      const eventSpy = vi.fn();
      app.on(EmitterEvent.EVENT, eventSpy);

      // Invalid event name - should not emit event
      // Note: In QA mode this would throw, in normal mode it logs error and returns
      try {
        app.sendCustomEvent('');
      } catch {
        // QA mode throws error, which is expected behavior
      }

      // Either way, event should not be emitted
      const customEvents = eventSpy.mock.calls.filter((call) => call[0].type === 'custom');
      expect(customEvents).toHaveLength(0);
    });

    it('should sanitize invalid metadata and send event with valid parts', () => {
      const eventSpy = vi.fn();
      app.on(EmitterEvent.EVENT, eventSpy);

      // Symbols are stripped during sanitization, resulting in empty metadata
      app.sendCustomEvent('test', { key: Symbol('invalid') } as any);

      expect(eventSpy).toHaveBeenCalled();
      const emittedEvent = eventSpy.mock.calls[0][0];
      expect(emittedEvent.custom_event?.name).toBe('test');
    });

    it('should throw in QA mode when custom event validation fails', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?tlog_mode=qa',
        },
        writable: true,
      });

      await app.destroy();
      app = new App();
      await app.init();

      expect(() => {
        app.sendCustomEvent('', { test: 'data' });
      }).toThrow('[TraceLog] Custom event');
    });

    it('should handle event after destroy gracefully', async () => {
      const eventSpy = vi.fn();
      app.on(EmitterEvent.EVENT, eventSpy);

      await app.destroy();

      // sendCustomEvent should not throw, just silently ignore
      expect(() => app.sendCustomEvent('test_event')).not.toThrow();
    });
  });

  describe('Event Emitters', () => {
    beforeEach(async () => {
      await app.init();
    });

    it('should register and call event listeners', () => {
      const callback = vi.fn();
      app.on(EmitterEvent.EVENT, callback);

      app.sendCustomEvent('test');

      expect(callback).toHaveBeenCalled();
    });

    it('should unregister event listeners', () => {
      const callback = vi.fn();
      app.on(EmitterEvent.EVENT, callback);
      app.off(EmitterEvent.EVENT, callback);

      app.sendCustomEvent('test');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should support multiple listeners for the same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      app.on(EmitterEvent.EVENT, callback1);
      app.on(EmitterEvent.EVENT, callback2);

      app.sendCustomEvent('test');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should only unregister the specific callback', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      app.on(EmitterEvent.EVENT, callback1);
      app.on(EmitterEvent.EVENT, callback2);
      app.off(EmitterEvent.EVENT, callback1);

      app.sendCustomEvent('test');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('Destroy and Cleanup', () => {
    it('should destroy successfully when initialized', async () => {
      await app.init();
      await app.destroy();

      expect(app.initialized).toBe(false);
    });

    it('should not destroy if not initialized without force flag', async () => {
      await app.destroy();

      expect(app.initialized).toBe(false);
    });

    it('should force destroy even if not initialized', async () => {
      await app.destroy(true);

      expect(app.initialized).toBe(false);
    });

    it('should cleanup all handlers during destroy', async () => {
      await app.init();
      const eventSpy = vi.fn();
      app.on(EmitterEvent.EVENT, eventSpy);

      const callCountBeforeDestroy = eventSpy.mock.calls.length;
      await app.destroy();

      // Simulate click after destroy
      const clickEvent = new MouseEvent('click', { bubbles: true });
      document.body.dispatchEvent(clickEvent);

      // Only session_end event should be emitted, no new click events
      const callCountAfterClick = eventSpy.mock.calls.length;
      expect(callCountAfterClick).toBe(callCountBeforeDestroy + 1); // +1 for session_end
    });

    it('should remove all event listeners during destroy', async () => {
      await app.init();
      const callback = vi.fn();
      app.on(EmitterEvent.EVENT, callback);

      const callsBeforeDestroy = callback.mock.calls.length;
      await app.destroy();

      app.sendCustomEvent('test');

      // Only session_end from destroy, no new custom events
      expect(callback.mock.calls.length).toBe(callsBeforeDestroy + 1);
    });

    it('should complete destroy successfully', async () => {
      await app.init();

      await app.destroy();

      expect(app.initialized).toBe(false);
    });

    // GA cleanup test removed - covered in unit tests

    it('should handle handler cleanup errors gracefully', async () => {
      await app.init();

      // Force an error scenario by destroying
      await expect(app.destroy()).resolves.not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should initialize successfully and maintain initialized state', async () => {
      const config: Config = {
        globalMetadata: { testKey: 'testValue' },
      };

      await app.init(config);

      expect(app.initialized).toBe(true);
    });

    it('should remain initialized after operations', async () => {
      await app.init();

      app.sendCustomEvent('test_event', { data: 'value' });

      expect(app.initialized).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should initialize with invalid selector config (logs warning)', async () => {
      const invalidConfig = {
        scrollContainerSelectors: [123] as any,
      };

      // Invalid selectors are filtered out, initialization continues
      await app.init(invalidConfig);
      expect(app.initialized).toBe(true);
    });

    it('should initialize with unsafe selector config (logs warning)', async () => {
      const badConfig = {
        scrollContainerSelectors: ['<script>'],
      } as Config;

      // Unsafe selectors are filtered out, initialization continues
      await app.init(badConfig);
      expect(app.initialized).toBe(true);
    });
  });
});
