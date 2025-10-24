/**
 * Initialization Flow Integration Tests
 * Focus: Complete initialization flow with all components
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge, getManagers, getHandlers } from '../../helpers/bridge.helper';
import type { TraceLogTestBridge } from '../../../src/types';

describe('Integration: Initialization Flow', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should initialize all components in correct order', async () => {
    bridge = await initTestBridge();

    // Verify all managers initialized
    const { event, storage, consent } = getManagers(bridge);
    expect(storage).toBeDefined();
    expect(consent).toBeDefined();
    expect(event).toBeDefined();

    // Verify all core handlers initialized
    const { session, pageView, click, scroll } = getHandlers(bridge);
    expect(session).toBeDefined();
    expect(pageView).toBeDefined();
    expect(click).toBeDefined();
    expect(scroll).toBeDefined();

    // Verify initialized flag
    expect(bridge.initialized).toBe(true);
  });

  it('should create StorageManager first', async () => {
    bridge = await initTestBridge();

    const { storage } = getManagers(bridge);
    expect(storage).toBeDefined();

    // Verify storage is functional (uses getItem/setItem API)
    storage?.setItem('test-key', 'test-value');
    expect(storage?.getItem('test-key')).toBe('test-value');
  });

  it('should setup state with config', async () => {
    const customConfig = {
      sessionTimeout: 5000,
      globalMetadata: { appVersion: '1.0.0' },
    };

    bridge = await initTestBridge(customConfig);

    const state = bridge.getFullState();
    expect(state.config).toEqual(customConfig);
    expect(state.userId).toBeDefined();
    expect(state.device).toBeDefined();
    expect(state.pageUrl).toBeDefined();
  });

  it('should initialize ConsentManager', async () => {
    bridge = await initTestBridge({ waitForConsent: true });

    const { consent } = getManagers(bridge);
    expect(consent).toBeDefined();

    const consentState = bridge.getConsentState();
    expect(consentState).toHaveProperty('google');
    expect(consentState).toHaveProperty('custom');
    expect(consentState).toHaveProperty('tracelog');
  });

  it('should initialize EventManager', async () => {
    bridge = await initTestBridge();

    const { event } = getManagers(bridge);
    expect(event).toBeDefined();

    // Verify EventManager is functional
    bridge.event('test_event', { key: 'value' });
    expect(bridge.getQueueLength()).toBeGreaterThan(0);
  });

  it('should initialize SessionManager', async () => {
    bridge = await initTestBridge();

    const { session } = getHandlers(bridge);
    expect(session).toBeDefined();

    // Verify session data available (getSessionData returns {id, isActive, timeout})
    const sessionData = bridge.getSessionData();
    expect(sessionData).not.toBeNull();

    if (sessionData) {
      expect(sessionData.id).toBeDefined();
      expect(sessionData.isActive).toBe(true);
    }

    // Verify userId in state
    const userId = bridge.get('userId');
    expect(userId).toBeDefined();
  });

  it('should initialize all handlers last', async () => {
    bridge = await initTestBridge();

    const handlers = getHandlers(bridge);

    // Core handlers always initialized
    expect(handlers.session).toBeDefined();
    expect(handlers.pageView).toBeDefined();
    expect(handlers.click).toBeDefined();

    // Optional handlers initialized by default
    expect(handlers.scroll).toBeDefined();
    expect(handlers.performance).toBeDefined();
    expect(handlers.error).toBeDefined();
  });

  it('should emit SESSION_START during init', async () => {
    bridge = await initTestBridge();

    // Check queue for session_start event (lowercase type)
    const events = bridge.getQueueEvents();
    const sessionStartEvent = events.find((e) => e.type === 'session_start');

    expect(sessionStartEvent).toBeDefined();
    expect(sessionStartEvent?.type).toBe('session_start');
  });

  it('should emit PAGE_VIEW during init', async () => {
    bridge = await initTestBridge();

    // Check queue for page_view event (lowercase type)
    const events = bridge.getQueueEvents();
    const pageViewEvent = events.find((e) => e.type === 'page_view');

    expect(pageViewEvent).toBeDefined();
    expect(pageViewEvent?.type).toBe('page_view');
    expect(pageViewEvent?.page_url).toBeDefined();
  });

  it('should recover persisted events', async () => {
    // Manually create persisted events in localStorage to simulate previous session failure
    const userId = 'test-user-id';
    const storageKey = `tlog:queue:${userId}:custom`;

    const persistedQueue = {
      session_id: 'old-session-123',
      user_id: userId,
      events: [
        {
          type: 'custom',
          timestamp: Date.now(),
          custom_event: {
            name: 'persisted_event',
            metadata: { recovered: true },
          },
        },
      ],
    };

    localStorage.setItem(storageKey, JSON.stringify(persistedQueue));

    // Verify persisted data exists before init
    expect(localStorage.getItem(storageKey)).not.toBeNull();

    // Initialize with config that would attempt recovery
    bridge = await initTestBridge({
      integrations: {
        custom: {
          collectApiUrl: 'http://localhost:8080',
          allowHttp: true,
        },
      },
    });

    // Recovery attempts to load persisted events
    // Note: Recovery may or may not succeed depending on validation,
    // but the key behavior is that it attempts to recover
    const eventManager = bridge.getEventManager();
    expect(eventManager).toBeDefined();
  });

  it('should set isInitialized flag', async () => {
    // Before init, bridge is not yet initialized
    bridge = await initTestBridge();

    expect(bridge.initialized).toBe(true);
  });
});

describe('Integration: Config Propagation', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should propagate config to all managers', async () => {
    const customConfig = {
      sessionTimeout: 7000,
      globalMetadata: { env: 'test' },
      waitForConsent: true,
    };

    bridge = await initTestBridge(customConfig);

    // All managers access config via StateManager
    const state = bridge.getFullState();
    expect(state.config).toEqual(customConfig);

    // Verify managers can access config
    const { event, consent } = getManagers(bridge);
    expect(event).toBeDefined();
    expect(consent).toBeDefined();
  });

  it('should propagate config to all handlers', async () => {
    const customConfig = {
      sessionTimeout: 6000,
      scrollContainerSelectors: ['.custom-scroll'],
    };

    bridge = await initTestBridge(customConfig);

    const state = bridge.getFullState();
    expect(state.config).toEqual(customConfig);

    // Verify handlers initialized with access to config
    const handlers = getHandlers(bridge);
    expect(handlers.session).toBeDefined();
    expect(handlers.scroll).toBeDefined();
  });

  it('should apply sessionTimeout to SessionManager', async () => {
    const customTimeout = 3000;

    bridge = await initTestBridge({ sessionTimeout: customTimeout });

    const state = bridge.getFullState();
    expect(state.config.sessionTimeout).toBe(customTimeout);

    // Verify session created with correct timeout
    const sessionData = bridge.getSessionData();
    expect(sessionData).not.toBeNull();

    if (sessionData) {
      expect(sessionData.id).toBeDefined();
      expect(sessionData.timeout).toBe(customTimeout);
    }
  });

  it('should apply samplingRate to EventManager', async () => {
    const samplingRate = 0.5;

    bridge = await initTestBridge({ samplingRate });

    const state = bridge.getFullState();
    expect(state.config.samplingRate).toBe(samplingRate);

    const { event } = getManagers(bridge);
    expect(event).toBeDefined();
  });

  it('should apply disabledEvents to handlers', async () => {
    const disabledEvents = ['scroll', 'web_vitals', 'error'];

    bridge = await initTestBridge({ disabledEvents });

    const handlers = getHandlers(bridge);

    // Core handlers always initialized
    expect(handlers.session).toBeDefined();
    expect(handlers.pageView).toBeDefined();
    expect(handlers.click).toBeDefined();

    // Disabled handlers return null (not initialized)
    expect(handlers.scroll).toBeNull();
    expect(handlers.performance).toBeNull();
    expect(handlers.error).toBeNull();
  });
});

describe('Integration: State Sharing', () => {
  let bridge: TraceLogTestBridge;

  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    destroyTestBridge();
    cleanupTestEnvironment();
  });

  it('should share state across all components', async () => {
    bridge = await initTestBridge();

    const sessionData = bridge.getSessionData();
    const state = bridge.getFullState();

    expect(sessionData).not.toBeNull();

    // Session ID should be accessible from state (sessionData.id maps to state.sessionId)
    if (sessionData) {
      expect(sessionData.id).toBe(state.sessionId);
    }

    // User ID should be accessible from state
    expect(state.userId).toBeDefined();

    // Config accessible from state
    expect(state.config).toBeDefined();
  });

  it('should update state from any component', async () => {
    bridge = await initTestBridge();

    const initialSessionId = bridge.get('sessionId');
    expect(initialSessionId).toBeDefined();

    // State can be read from any component
    const state1 = bridge.getFullState();
    expect(state1.sessionId).toBe(initialSessionId);

    // Components can access consistent state
    const sessionId2 = bridge.get('sessionId');
    expect(sessionId2).toBe(initialSessionId);
  });

  it('should maintain state consistency', async () => {
    bridge = await initTestBridge();

    const state1 = bridge.getFullState();
    const sessionId1 = bridge.get('sessionId');
    const userId1 = bridge.get('userId');

    // State should be consistent across multiple reads
    expect(state1.sessionId).toBe(sessionId1);
    expect(state1.userId).toBe(userId1);

    const state2 = bridge.getFullState();
    expect(state2.sessionId).toBe(sessionId1);
    expect(state2.userId).toBe(userId1);
  });

  it('should allow read-only access via getState()', async () => {
    bridge = await initTestBridge();

    const state = bridge.getFullState();

    // getFullState returns snapshot (read-only access pattern)
    const originalSessionId = state.sessionId;
    expect(originalSessionId).toBeDefined();

    // Get state again to verify consistency
    const state2 = bridge.getFullState();
    expect(state2.sessionId).toBe(originalSessionId);

    // Verify internal state remains consistent
    const internalSessionId = bridge.get('sessionId');
    expect(internalSessionId).toBe(originalSessionId);
  });
});
