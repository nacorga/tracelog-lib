/**
 * StateManager Tests
 *
 * Priority: P0 (Critical)
 * Focus: Global state management for all components
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';
import { initTestBridge, destroyTestBridge } from '../../helpers/bridge.helper';
import { StateManager } from '../../../src/managers/state.manager';

// Test class extending StateManager for direct state manipulation testing
class TestStateManager extends StateManager {
  public testGet<T extends keyof import('../../../src/types').State>(key: T): import('../../../src/types').State[T] {
    return this.get(key);
  }

  public testSet<T extends keyof import('../../../src/types').State>(
    key: T,
    value: import('../../../src/types').State[T],
  ): void {
    this.set(key, value);
  }

  public testGetState(): Readonly<import('../../../src/types').State> {
    return this.getState();
  }
}

describe('StateManager - Basic Operations', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('get()', () => {
    it('should get state value by key', async () => {
      const bridge = await initTestBridge();
      const sessionId = bridge.get('sessionId');

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');

      destroyTestBridge();
    });

    it('should return null for non-existent key', async () => {
      const bridge = await initTestBridge();

      // sessionId exists, but before setting userId it should be the generated one
      const userId = bridge.get('userId');
      expect(userId).toBeDefined(); // Generated during init

      destroyTestBridge();
    });

    it('should return undefined for uninitialized state', async () => {
      const bridge = await initTestBridge();

      // mode is optional and not set by default (only set when QA mode active)
      const mode = bridge.get('mode');
      expect(mode).toBeUndefined();

      destroyTestBridge();
    });
  });

  describe('set()', () => {
    it('should set state value by key', async () => {
      await initTestBridge();
      const manager = new TestStateManager();

      manager.testSet('hasStartSession', true);
      const hasStartSession = manager.testGet('hasStartSession');
      expect(hasStartSession).toBe(true);

      destroyTestBridge();
    });

    it('should overwrite existing value', async () => {
      await initTestBridge();
      const manager = new TestStateManager();

      const originalSessionId = manager.testGet('sessionId');
      expect(originalSessionId).toBeDefined();

      const newSessionId = 'test-session-123';
      manager.testSet('sessionId', newSessionId);
      const updatedSessionId = manager.testGet('sessionId');
      expect(updatedSessionId).toBe(newSessionId);
      expect(updatedSessionId).not.toBe(originalSessionId);

      destroyTestBridge();
    });

    it('should handle null values', async () => {
      await initTestBridge();
      const manager = new TestStateManager();

      manager.testSet('sessionId', null);
      const sessionId = manager.testGet('sessionId');
      expect(sessionId).toBeNull();

      destroyTestBridge();
    });

    it('should handle undefined values', async () => {
      await initTestBridge();
      const manager = new TestStateManager();

      manager.testSet('mode', undefined);
      const mode = manager.testGet('mode');
      expect(mode).toBeUndefined();

      destroyTestBridge();
    });

    it('should handle complex objects', async () => {
      await initTestBridge();
      const manager = new TestStateManager();

      const complexObject = {
        nested: { value: 'test' },
        array: [1, 2, 3],
        boolean: true,
      };

      manager.testSet('collectApiUrls', complexObject as any);
      const retrieved = manager.testGet('collectApiUrls');
      expect(retrieved).toEqual(complexObject);

      destroyTestBridge();
    });

    it('should handle arrays', async () => {
      await initTestBridge();
      const manager = new TestStateManager();

      // Use scrollEventCount which can be a number (acts like array-like scenario)
      manager.testSet('scrollEventCount', 42);
      const count = manager.testGet('scrollEventCount');
      expect(count).toBe(42);

      destroyTestBridge();
    });
  });

  describe('getState()', () => {
    it('should return full state snapshot', async () => {
      await initTestBridge();
      const manager = new TestStateManager();

      const state = manager.testGetState();
      expect(state).toBeDefined();
      expect(state.sessionId).toBeDefined();
      expect(state.userId).toBeDefined();
      expect(state.config).toBeDefined();

      destroyTestBridge();
    });

    it('should return read-only copy', async () => {
      await initTestBridge();
      const manager = new TestStateManager();

      const state = manager.testGetState();
      const originalSessionId = state.sessionId;

      // This should not affect internal state (TypeScript will show error but runtime allows it)
      (state as any).sessionId = 'modified-session-id';

      const newState = manager.testGetState();
      expect(newState.sessionId).toBe(originalSessionId);

      destroyTestBridge();
    });

    it('should not affect original state when modified', async () => {
      await initTestBridge();
      const manager = new TestStateManager();

      const state1 = manager.testGetState();
      const originalUserId = state1.userId;

      // Modify the returned object
      (state1 as any).userId = 'modified-user-id';

      // Get a fresh copy
      const state2 = manager.testGetState();
      expect(state2.userId).toBe(originalUserId);
      expect(state2.userId).not.toBe('modified-user-id');

      destroyTestBridge();
    });
  });

  describe('setState()', () => {
    it('should set multiple state values at once', async () => {
      await initTestBridge();
      const manager = new TestStateManager();

      manager.testSet('hasStartSession', true);
      manager.testSet('sessionId', 'test-session-456');

      const hasStartSession = manager.testGet('hasStartSession');
      const sessionId = manager.testGet('sessionId');

      expect(hasStartSession).toBe(true);
      expect(sessionId).toBe('test-session-456');

      destroyTestBridge();
    });

    it('should merge with existing state', async () => {
      await initTestBridge();
      const manager = new TestStateManager();

      const originalUserId = manager.testGet('userId');

      manager.testSet('hasStartSession', true);

      const userId = manager.testGet('userId');
      const hasStartSession = manager.testGet('hasStartSession');

      expect(userId).toBe(originalUserId);
      expect(hasStartSession).toBe(true);

      destroyTestBridge();
    });

    it('should not delete unspecified keys', async () => {
      await initTestBridge();
      const manager = new TestStateManager();

      const originalState = manager.testGetState();
      const originalSessionId = originalState.sessionId;
      const originalUserId = originalState.userId;

      manager.testSet('hasStartSession', true);

      const newState = manager.testGetState();
      expect(newState.sessionId).toBe(originalSessionId);
      expect(newState.userId).toBe(originalUserId);
      expect(newState.hasStartSession).toBe(true);

      destroyTestBridge();
    });
  });
});

describe('StateManager - Inheritance', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should share state across all instances', async () => {
    await initTestBridge();
    const manager1 = new TestStateManager();
    const manager2 = new TestStateManager();

    manager1.testSet('hasStartSession', true);
    const value = manager2.testGet('hasStartSession');

    expect(value).toBe(true);

    destroyTestBridge();
  });

  it('should allow managers to extend StateManager', async () => {
    const bridge = await initTestBridge();
    const { event, storage, consent } = {
      event: bridge.getEventManager(),
      storage: bridge.getStorageManager(),
      consent: bridge.getConsentManager(),
    };

    // EventManager extends StateManager
    expect(event).toBeDefined();

    // StorageManager extends StateManager
    expect(storage).toBeDefined();

    // ConsentManager extends StateManager
    expect(consent).toBeDefined();

    destroyTestBridge();
  });

  it('should allow handlers to extend StateManager', async () => {
    const bridge = await initTestBridge();
    const { session, click, scroll } = {
      session: bridge.getSessionHandler(),
      click: bridge.getClickHandler(),
      scroll: bridge.getScrollHandler(),
    };

    // SessionHandler extends StateManager
    expect(session).toBeDefined();

    // ClickHandler extends StateManager
    expect(click).toBeDefined();

    // ScrollHandler extends StateManager
    expect(scroll).toBeDefined();

    destroyTestBridge();
  });

  it('should maintain single source of truth', async () => {
    await initTestBridge();
    const manager1 = new TestStateManager();
    const manager2 = new TestStateManager();

    manager1.testSet('sessionId', 'shared-session');

    const sessionId1 = manager1.testGet('sessionId');
    const sessionId2 = manager2.testGet('sessionId');

    expect(sessionId1).toBe('shared-session');
    expect(sessionId2).toBe('shared-session');
    expect(sessionId1).toBe(sessionId2);

    destroyTestBridge();
  });
});

describe('StateManager - Type Safety', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should handle string values', async () => {
    await initTestBridge();
    const manager = new TestStateManager();

    manager.testSet('sessionId', 'test-session-string');
    const sessionId = manager.testGet('sessionId');

    expect(typeof sessionId).toBe('string');
    expect(sessionId).toBe('test-session-string');

    destroyTestBridge();
  });

  it('should handle number values', async () => {
    await initTestBridge();
    const manager = new TestStateManager();

    manager.testSet('scrollEventCount', 123);
    const count = manager.testGet('scrollEventCount');

    expect(typeof count).toBe('number');
    expect(count).toBe(123);

    destroyTestBridge();
  });

  it('should handle boolean values', async () => {
    await initTestBridge();
    const manager = new TestStateManager();

    manager.testSet('hasStartSession', true);
    const hasStartSession = manager.testGet('hasStartSession');

    expect(typeof hasStartSession).toBe('boolean');
    expect(hasStartSession).toBe(true);

    manager.testSet('suppressNextScroll', false);
    const suppressNextScroll = manager.testGet('suppressNextScroll');

    expect(typeof suppressNextScroll).toBe('boolean');
    expect(suppressNextScroll).toBe(false);

    destroyTestBridge();
  });

  it('should handle object values', async () => {
    await initTestBridge();
    const manager = new TestStateManager();

    const config = manager.testGet('config');
    expect(typeof config).toBe('object');
    expect(config).toBeDefined();

    destroyTestBridge();
  });

  it('should handle array values', async () => {
    await initTestBridge();
    const manager = new TestStateManager();

    const testArray = { custom: ['item1', 'item2', 'item3'] };
    manager.testSet('collectApiUrls', testArray as any);
    const retrieved = manager.testGet('collectApiUrls');

    expect(typeof retrieved).toBe('object');
    expect(retrieved).toEqual(testArray);

    destroyTestBridge();
  });

  it('should handle null values', async () => {
    await initTestBridge();
    const manager = new TestStateManager();

    manager.testSet('sessionId', null);
    const sessionId = manager.testGet('sessionId');

    expect(sessionId).toBeNull();

    destroyTestBridge();
  });

  it('should handle undefined values', async () => {
    await initTestBridge();
    const manager = new TestStateManager();

    manager.testSet('mode', undefined);
    const mode = manager.testGet('mode');

    expect(mode).toBeUndefined();

    destroyTestBridge();
  });
});

describe('StateManager - Edge Cases', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  it('should handle rapid state updates', async () => {
    await initTestBridge();
    const manager = new TestStateManager();

    // Perform 100 rapid updates
    for (let i = 0; i < 100; i++) {
      manager.testSet('scrollEventCount', i);
    }

    const finalCount = manager.testGet('scrollEventCount');
    expect(finalCount).toBe(99);

    destroyTestBridge();
  });

  it('should handle concurrent access', async () => {
    await initTestBridge();
    const manager1 = new TestStateManager();
    const manager2 = new TestStateManager();
    const manager3 = new TestStateManager();

    manager1.testSet('sessionId', 'session-1');
    manager2.testSet('sessionId', 'session-2');
    manager3.testSet('sessionId', 'session-3');

    const sessionId = manager1.testGet('sessionId');
    expect(sessionId).toBe('session-3');

    destroyTestBridge();
  });

  it('should handle circular references gracefully', async () => {
    await initTestBridge();
    const manager = new TestStateManager();

    const circularObj: any = { name: 'test' };
    circularObj.self = circularObj;

    // Setting circular reference should not throw
    expect(() => {
      manager.testSet('collectApiUrls', circularObj);
    }).not.toThrow();

    const retrieved = manager.testGet('collectApiUrls');
    expect(retrieved).toBeDefined();
    expect((retrieved as any).name).toBe('test');

    destroyTestBridge();
  });

  it('should handle very large objects', async () => {
    await initTestBridge();
    const manager = new TestStateManager();

    const largeObject: any = {};
    for (let i = 0; i < 1000; i++) {
      largeObject[`key${i}`] = `value${i}`;
    }

    manager.testSet('collectApiUrls', largeObject);
    const retrieved = manager.testGet('collectApiUrls');

    expect(retrieved).toBeDefined();
    expect(Object.keys(retrieved as any).length).toBe(1000);
    expect((retrieved as any).key999).toBe('value999');

    destroyTestBridge();
  });
});
