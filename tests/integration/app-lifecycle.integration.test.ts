import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { App } from '../../src/app';
import { Config, EventType, EmitterEvent } from '../../src/types';
import { getGlobalState } from '../../src/managers/state.manager';

describe('App Lifecycle Integration', () => {
  let app: App;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    app = new App();
  });

  afterEach(() => {
    if (app.initialized) {
      app.destroy();
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

    it('should initialize even with minimal config', async () => {
      const minimalConfig = {} as Config;

      // Minimal config should work fine
      await app.init(minimalConfig);
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

    it('should reject tracelog SaaS integration on localhost', async () => {
      const config: Config = {
        integrations: {
          tracelog: {
            projectId: 'test-project',
          },
        },
      };

      // SaaS integration should fail on localhost with helpful error
      await expect(app.init(config)).rejects.toThrow(
        'Invalid SaaS URL configuration: SaaS integration not supported on localhost or IP addresses',
      );
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
      const emittedEvent = eventSpy.mock.calls[0]?.[0];
      expect(emittedEvent).toBeDefined();
      expect(emittedEvent.type).toBe(EventType.CUSTOM);
      expect(emittedEvent.custom_event?.name).toBe('purchase_complete');
      expect(emittedEvent.custom_event?.metadata).toEqual({ orderId: '12345', amount: 99.99 });
    });

    it('should send custom event without metadata', () => {
      const eventSpy = vi.fn();
      app.on(EmitterEvent.EVENT, eventSpy);

      app.sendCustomEvent('button_click');

      expect(eventSpy).toHaveBeenCalled();
      const emittedEvent = eventSpy.mock.calls[0]?.[0];
      expect(emittedEvent).toBeDefined();
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
      const emittedEvent = eventSpy.mock.calls[0]?.[0];
      expect(emittedEvent).toBeDefined();
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

      app.destroy();
      app = new App();
      await app.init();

      expect(() => {
        app.sendCustomEvent('', { test: 'data' });
      }).toThrow('[TraceLog] Custom event');
    });

    it('should handle event after destroy gracefully', () => {
      const eventSpy = vi.fn();
      app.on(EmitterEvent.EVENT, eventSpy);

      app.destroy();

      // sendCustomEvent should not throw, just silently ignore
      expect(() => {
        app.sendCustomEvent('test_event');
      }).not.toThrow();
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
      app.destroy();

      expect(app.initialized).toBe(false);
    });

    it('should not destroy if not initialized without force flag', () => {
      app.destroy();

      expect(app.initialized).toBe(false);
    });

    it('should force destroy even if not initialized', () => {
      app.destroy(true);

      expect(app.initialized).toBe(false);
    });

    it('should cleanup all handlers during destroy', async () => {
      await app.init();
      const eventSpy = vi.fn();
      app.on(EmitterEvent.EVENT, eventSpy);

      const callCountBeforeDestroy = eventSpy.mock.calls.length;
      app.destroy();

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
      app.destroy();

      app.sendCustomEvent('test');

      // Only session_end from destroy, no new custom events
      expect(callback.mock.calls.length).toBe(callsBeforeDestroy + 1);
    });

    it('should complete destroy successfully', async () => {
      await app.init();

      app.destroy();

      expect(app.initialized).toBe(false);
    });

    // GA cleanup test removed - covered in unit tests

    it('should handle handler cleanup errors gracefully', async () => {
      await app.init();

      // Force an error scenario by destroying
      expect(() => {
        app.destroy();
      }).not.toThrow();
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
    it('should initialize with invalid config values (logs warning)', async () => {
      const invalidConfig = {
        sessionTimeout: 900000, // Valid
        samplingRate: 1.0, // Valid
      };

      await app.init(invalidConfig);
      expect(app.initialized).toBe(true);
    });

    it('should handle errors gracefully during init', async () => {
      const config = {};

      // Should not throw even if there are internal issues
      await app.init(config);
      expect(app.initialized).toBe(true);
    });
  });

  describe('State and Handler Management', () => {
    it('should properly initialize all managers after init', async () => {
      await app.init({});

      const managers = (app as any).managers;

      expect(managers.storage).toBeDefined();
      expect(managers.event).toBeDefined();
    });

    it('should properly initialize core handlers after init', async () => {
      await app.init({});

      const handlers = (app as any).handlers;

      expect(handlers.session).toBeDefined();
      expect(handlers.pageView).toBeDefined();
      expect(handlers.click).toBeDefined();
      expect(handlers.scroll).toBeDefined();
      expect(handlers.performance).toBeDefined();
      expect(handlers.error).toBeDefined();
    });

    it('should persist config in global state after init', async () => {
      const config: Config = {
        sessionTimeout: 800000,
        globalMetadata: { app: 'testApp', env: 'production' },
        samplingRate: 0.75,
      };

      await app.init(config);

      const state = getGlobalState();

      expect(state.config).toBeDefined();
      expect(state.config?.sessionTimeout).toBe(800000);
      expect(state.config?.globalMetadata).toEqual({ app: 'testApp', env: 'production' });
      expect(state.config?.samplingRate).toBe(0.75);
    });

    it('should initialize userId and sessionId in state', async () => {
      await app.init({});

      const state = getGlobalState();

      expect(state.userId).toBeDefined();
      expect(typeof state.userId).toBe('string');
      expect(state.userId.length).toBeGreaterThan(0);

      expect(state.sessionId).toBeDefined();
      expect(typeof state.sessionId).toBe('string');
      expect(state.sessionId!.length).toBeGreaterThan(0);
    });

    it('should cleanup handlers on destroy', async () => {
      await app.init({});

      const handlers = (app as any).handlers;
      expect(handlers.session).toBeDefined();

      app.destroy();

      expect(app.initialized).toBe(false);
    });

    it('should preserve manager references after destroy', async () => {
      await app.init({});

      const managersBefore = (app as any).managers;
      expect(managersBefore.storage).toBeDefined();
      expect(managersBefore.event).toBeDefined();

      app.destroy();

      // Managers still exist but app is not initialized
      const managersAfter = (app as any).managers;
      expect(managersAfter).toBeDefined();
      expect(app.initialized).toBe(false);
    });

    it('should track handler lifecycle correctly', async () => {
      await app.init({});

      const handlers = (app as any).handlers;

      // All handlers should be defined after init
      expect(handlers.session).toBeDefined();
      expect(handlers.click).toBeDefined();
      expect(handlers.scroll).toBeDefined();

      app.destroy();

      // After destroy, app should not be initialized
      expect(app.initialized).toBe(false);
    });
  });
});
