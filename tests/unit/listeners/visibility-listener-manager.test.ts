import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VisibilityListenerManager } from '../../../src/listeners/visibility-listener-manager';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';

describe('VisibilityListenerManager', () => {
  let manager: VisibilityListenerManager;
  let onActivityMock: ReturnType<typeof vi.fn>;
  let onVisibilityChangeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();
    onActivityMock = vi.fn();
    onVisibilityChangeMock = vi.fn();
    manager = new VisibilityListenerManager(onActivityMock, onVisibilityChangeMock);
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('constructor', () => {
    it('should create instance with onActivity and onVisibilityChange callbacks', () => {
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(VisibilityListenerManager);
    });
  });

  describe('setup', () => {
    it('should register visibilitychange event listener when Visibility API is supported', () => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', onVisibilityChangeMock, { passive: true });
    });

    it('should register blur event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('blur', onVisibilityChangeMock, { passive: true });
    });

    it('should register focus event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('focus', onActivityMock, { passive: true });
    });

    it('should register online event listener when Navigator.onLine is supported', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', onActivityMock, { passive: true });
    });

    it('should register offline event listener when Navigator.onLine is supported', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', onVisibilityChangeMock, { passive: true });
    });

    it('should trigger onVisibilityChange callback when visibilitychange event fires', () => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      manager.setup();

      document.dispatchEvent(new Event('visibilitychange'));

      expect(onVisibilityChangeMock).toHaveBeenCalledTimes(1);
      expect(onActivityMock).not.toHaveBeenCalled();
    });

    it('should trigger onVisibilityChange callback when blur event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('blur'));

      expect(onVisibilityChangeMock).toHaveBeenCalledTimes(1);
      expect(onActivityMock).not.toHaveBeenCalled();
    });

    it('should trigger onActivity callback when focus event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('focus'));

      expect(onActivityMock).toHaveBeenCalledTimes(1);
      expect(onVisibilityChangeMock).not.toHaveBeenCalled();
    });

    it('should trigger onActivity callback when online event fires', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      manager.setup();

      window.dispatchEvent(new Event('online'));

      expect(onActivityMock).toHaveBeenCalledTimes(1);
      expect(onVisibilityChangeMock).not.toHaveBeenCalled();
    });

    it('should trigger onVisibilityChange callback when offline event fires', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      manager.setup();

      window.dispatchEvent(new Event('offline'));

      expect(onVisibilityChangeMock).toHaveBeenCalledTimes(1);
      expect(onActivityMock).not.toHaveBeenCalled();
    });

    it('should not throw error if setup fails', () => {
      vi.spyOn(window, 'addEventListener').mockImplementationOnce(() => {
        throw new Error('Setup failed');
      });

      expect(() => {
        manager.setup();
      }).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should remove visibilitychange event listener when supported', () => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', onVisibilityChangeMock);
    });

    it('should remove blur event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('blur', onVisibilityChangeMock);
    });

    it('should remove focus event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', onActivityMock);
    });

    it('should remove online event listener when Navigator.onLine is supported', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', onActivityMock);
    });

    it('should remove offline event listener when Navigator.onLine is supported', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', onVisibilityChangeMock);
    });

    it('should not trigger callbacks after cleanup', () => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      manager.setup();
      manager.cleanup();

      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('blur'));
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('offline'));

      expect(onActivityMock).not.toHaveBeenCalled();
      expect(onVisibilityChangeMock).not.toHaveBeenCalled();
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
