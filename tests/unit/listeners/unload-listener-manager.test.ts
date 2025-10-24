import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UnloadListenerManager } from '../../../src/listeners/unload-listener-manager';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';

describe('UnloadListenerManager', () => {
  let manager: UnloadListenerManager;
  let onInactivityMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();
    onInactivityMock = vi.fn();
    manager = new UnloadListenerManager(onInactivityMock);
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('constructor', () => {
    it('should create instance with onInactivity callback', () => {
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(UnloadListenerManager);
    });
  });

  describe('setup', () => {
    it('should register beforeunload event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', onInactivityMock, { passive: true });
    });

    it('should register pagehide event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('pagehide', onInactivityMock, { passive: true });
    });

    it('should register both event listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    });

    it('should trigger onInactivity callback when beforeunload event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('beforeunload'));

      expect(onInactivityMock).toHaveBeenCalledTimes(1);
    });

    it('should trigger onInactivity callback when pagehide event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('pagehide'));

      expect(onInactivityMock).toHaveBeenCalledTimes(1);
    });

    it('should throw error if setup fails', () => {
      vi.spyOn(window, 'addEventListener').mockImplementationOnce(() => {
        throw new Error('Setup failed');
      });

      expect(() => {
        manager.setup();
      }).toThrow('Setup failed');
    });
  });

  describe('cleanup', () => {
    it('should remove beforeunload event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', onInactivityMock);
    });

    it('should remove pagehide event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('pagehide', onInactivityMock);
    });

    it('should remove both event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
    });

    it('should not trigger onInactivity after cleanup', () => {
      manager.setup();
      manager.cleanup();

      window.dispatchEvent(new Event('beforeunload'));
      window.dispatchEvent(new Event('pagehide'));

      expect(onInactivityMock).not.toHaveBeenCalled();
    });

    it('should be safe to call multiple times', () => {
      manager.setup();

      expect(() => {
        manager.cleanup();
        manager.cleanup();
        manager.cleanup();
      }).not.toThrow();
    });

    it('should not throw error if cleanup fails', () => {
      manager.setup();
      vi.spyOn(window, 'removeEventListener').mockImplementationOnce(() => {
        throw new Error('Cleanup failed');
      });

      expect(() => {
        manager.cleanup();
      }).not.toThrow();
    });
  });
});
