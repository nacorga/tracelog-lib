import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MouseListenerManager, KeyboardListenerManager } from '../../../src/listeners/input-listener-managers';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../helpers/setup.helper';

describe('MouseListenerManager', () => {
  let manager: MouseListenerManager;
  let onActivityMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();
    onActivityMock = vi.fn();
    manager = new MouseListenerManager(onActivityMock);
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('constructor', () => {
    it('should create instance with onActivity callback', () => {
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(MouseListenerManager);
    });
  });

  describe('setup', () => {
    it('should register mousemove event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', onActivityMock, { passive: true });
    });

    it('should register mousedown event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', onActivityMock, { passive: true });
    });

    it('should register wheel event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('wheel', onActivityMock, { passive: true });
    });

    it('should register all three event listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledTimes(3);
    });

    it('should trigger onActivity callback when mousemove event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('mousemove'));

      expect(onActivityMock).toHaveBeenCalledTimes(1);
    });

    it('should trigger onActivity callback when mousedown event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('mousedown'));

      expect(onActivityMock).toHaveBeenCalledTimes(1);
    });

    it('should trigger onActivity callback when wheel event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('wheel'));

      expect(onActivityMock).toHaveBeenCalledTimes(1);
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
    it('should remove mousemove event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', onActivityMock);
    });

    it('should remove mousedown event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', onActivityMock);
    });

    it('should remove wheel event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', onActivityMock);
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

      window.dispatchEvent(new Event('mousemove'));
      window.dispatchEvent(new Event('mousedown'));
      window.dispatchEvent(new Event('wheel'));

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

describe('KeyboardListenerManager', () => {
  let manager: KeyboardListenerManager;
  let onActivityMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setupTestEnvironment();
    onActivityMock = vi.fn();
    manager = new KeyboardListenerManager(onActivityMock);
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('constructor', () => {
    it('should create instance with onActivity callback', () => {
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(KeyboardListenerManager);
    });
  });

  describe('setup', () => {
    it('should register keydown event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', onActivityMock, { passive: true });
    });

    it('should trigger onActivity callback when keydown event fires', () => {
      manager.setup();

      window.dispatchEvent(new Event('keydown'));

      expect(onActivityMock).toHaveBeenCalledTimes(1);
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
    it('should remove keydown event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      manager.setup();

      manager.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', onActivityMock);
    });

    it('should not trigger onActivity after cleanup', () => {
      manager.setup();
      manager.cleanup();

      window.dispatchEvent(new Event('keydown'));

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
