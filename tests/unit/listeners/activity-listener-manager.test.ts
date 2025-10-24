import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ActivityListenerManager } from '../../../src/listeners/activity-listener-manager';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';

describe('ActivityListenerManager', () => {
  let manager: ActivityListenerManager;
  let onActivityMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();
    onActivityMock = vi.fn();
    manager = new ActivityListenerManager(onActivityMock);
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('constructor', () => {
    it('should create instance with onActivity callback', () => {
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(ActivityListenerManager);
    });
  });

  describe('setup', () => {
    it('should register scroll event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', onActivityMock, { passive: true });
    });

    it('should register resize event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', onActivityMock, { passive: true });
    });

    it('should register focus event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('focus', onActivityMock, { passive: true });
    });

    it('should register all three event listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledTimes(3);
    });

    it('should trigger onActivity callback when scroll event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('scroll'));

      expect(onActivityMock).toHaveBeenCalledTimes(1);
    });

    it('should trigger onActivity callback when resize event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('resize'));

      expect(onActivityMock).toHaveBeenCalledTimes(1);
    });

    it('should trigger onActivity callback when focus event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('focus'));

      expect(onActivityMock).toHaveBeenCalledTimes(1);
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
    it('should remove scroll event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', onActivityMock);
    });

    it('should remove resize event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', onActivityMock);
    });

    it('should remove focus event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', onActivityMock);
    });

    it('should remove all three event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(3);
    });

    it('should not trigger onActivity after cleanup', () => {
      manager.setup();
      manager.cleanup();

      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('focus'));

      expect(onActivityMock).not.toHaveBeenCalled();
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
