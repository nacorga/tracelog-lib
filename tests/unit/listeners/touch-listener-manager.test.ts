import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TouchListenerManager } from '../../../src/listeners/touch-listener-manager';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';

describe('TouchListenerManager', () => {
  let manager: TouchListenerManager;
  let onActivityMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();
    onActivityMock = vi.fn();
    manager = new TouchListenerManager(onActivityMock);
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('constructor', () => {
    it('should create instance with onActivity callback', () => {
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(TouchListenerManager);
    });
  });

  describe('setup', () => {
    it('should register touchstart event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', onActivityMock, { passive: true });
    });

    it('should register touchmove event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', onActivityMock, { passive: true });
    });

    it('should register touchend event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', onActivityMock, { passive: true });
    });

    it('should register orientationchange event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('orientationchange', onActivityMock, { passive: true });
    });

    it('should register all four event listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledTimes(4);
    });

    it('should trigger onActivity callback when touchstart event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('touchstart'));

      expect(onActivityMock).toHaveBeenCalledTimes(1);
    });

    it('should trigger onActivity callback when touchmove event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('touchmove'));

      expect(onActivityMock).toHaveBeenCalledTimes(1);
    });

    it('should trigger onActivity callback when touchend event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('touchend'));

      expect(onActivityMock).toHaveBeenCalledTimes(1);
    });

    it('should trigger onActivity callback when orientationchange event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('orientationchange'));

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
    it('should remove touchstart event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', onActivityMock);
    });

    it('should remove touchmove event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', onActivityMock);
    });

    it('should remove touchend event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', onActivityMock);
    });

    it('should remove orientationchange event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', onActivityMock);
    });

    it('should remove all four event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(4);
    });

    it('should not trigger onActivity after cleanup', () => {
      manager.setup();
      manager.cleanup();

      window.dispatchEvent(new Event('touchstart'));
      window.dispatchEvent(new Event('touchmove'));
      window.dispatchEvent(new Event('touchend'));
      window.dispatchEvent(new Event('orientationchange'));

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
