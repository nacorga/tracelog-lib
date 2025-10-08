import { vi } from 'vitest';
import { EventManager } from '../../src/managers/event.manager';
import { SessionManager } from '../../src/managers/session.manager';
import { StorageManager } from '../../src/managers/storage.manager';
import { StateManager, resetGlobalState } from '../../src/managers/state.manager';
import { Config } from '../../src/types';
import { DEFAULT_SESSION_TIMEOUT } from '../../src/constants';
import { GoogleAnalyticsIntegration } from '../../src/integrations/google-analytics.integration';
import { Emitter } from '../../src/utils';

vi.mock('../../src/managers/sender.manager', () => {
  class MockSenderManager {
    sendEventsQueue = vi.fn(async () => true);
    sendEventsQueueSync = vi.fn(() => true);
    recoverPersistedEvents = vi.fn(async () => undefined);
    stop = vi.fn();
  }

  return {
    SenderManager: MockSenderManager,
  };
});

/**
 * Test configuration factory
 */
export const createTestConfig = (overrides: Partial<Config> = {}): Config => ({
  sessionTimeout: DEFAULT_SESSION_TIMEOUT,
  samplingRate: 1,
  ...overrides,
});

/**
 * Mock StorageManager factory
 */
export const createMockStorageManager = (): StorageManager =>
  ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    getSessionItem: vi.fn(),
    setSessionItem: vi.fn(),
    removeSessionItem: vi.fn(),
    clearSessionStorage: vi.fn(),
  }) as unknown as StorageManager;

/**
 * Mock GoogleAnalyticsIntegration factory
 */
export const createMockGoogleAnalytics = (): GoogleAnalyticsIntegration =>
  ({
    initialize: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn(),
    trackEvent: vi.fn(),
  }) as unknown as GoogleAnalyticsIntegration;

/**
 * Mock Emitter factory
 */
export const createMockEmitter = (): Emitter =>
  ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    removeAllListeners: vi.fn(),
  }) as unknown as Emitter;

/**
 * Setup global state for testing
 */
export const setupTestState = async (config: Config = createTestConfig()): Promise<void> => {
  resetGlobalState();

  // Create a temporary StateManager to set up global state
  const tempStateManager = new (class extends StateManager {
    setConfig(config: Config): void {
      this.set('config', config);
    }
    setPageUrl(url: string): void {
      this.set('pageUrl', url);
    }
    setSessionId(id: string): void {
      this.set('sessionId', id);
    }
  })();

  tempStateManager.setConfig(config);
  tempStateManager.setPageUrl('https://example.com');
  tempStateManager.setSessionId('test-session');
};

/**
 * Create EventManager with proper dependencies for testing
 */
export const createTestEventManager = (
  storageManager?: StorageManager,
  googleAnalytics?: GoogleAnalyticsIntegration | null,
  emitter?: Emitter | null,
): EventManager => {
  return new EventManager(storageManager || createMockStorageManager(), googleAnalytics || null, emitter || null);
};

/**
 * Create SessionManager with proper dependencies for testing
 */
export const createTestSessionManager = (
  storageManager?: StorageManager,
  eventManager?: EventManager,
  projectId?: string,
): SessionManager => {
  return new SessionManager(
    storageManager || createMockStorageManager(),
    eventManager || createTestEventManager(),
    projectId || 'test-project',
  );
};

/**
 * Clean up after tests
 */
export const cleanupTestState = (): void => {
  resetGlobalState();
  vi.clearAllMocks();
};

/**
 * Setup common test environment
 */
export const setupTestEnvironment = async (
  config?: Partial<Config>,
): Promise<{
  config: Config;
  storageManager: StorageManager;
  eventManager: EventManager;
  sessionManager: SessionManager;
}> => {
  const testConfig = createTestConfig(config);
  await setupTestState(testConfig);

  const storageManager = createMockStorageManager();
  const eventManager = createTestEventManager(storageManager);
  const sessionManager = createTestSessionManager(storageManager, eventManager, 'default');

  return {
    config: testConfig,
    storageManager,
    eventManager,
    sessionManager,
  };
};
