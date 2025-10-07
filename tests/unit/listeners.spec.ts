import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivityListenerManager } from '../../src/listeners/activity-listener-manager';
import { VisibilityListenerManager } from '../../src/listeners/visibility-listener-manager';
import { UnloadListenerManager } from '../../src/listeners/unload-listener-manager';
import { TouchListenerManager } from '../../src/listeners/touch-listener-manager';
import { MouseListenerManager, KeyboardListenerManager } from '../../src/listeners/input-listener-managers';

describe('Listener Managers', () => {
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCallback = vi.fn();
  });

  describe('ActivityListenerManager', () => {
    it('should setup scroll listener', () => {
      const manager = new ActivityListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('scroll', mockCallback, expect.objectContaining({ passive: true }));
    });

    it('should setup resize listener', () => {
      const manager = new ActivityListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('resize', mockCallback, expect.objectContaining({ passive: true }));
    });

    it('should setup focus listener', () => {
      const manager = new ActivityListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('focus', mockCallback, expect.objectContaining({ passive: true }));
    });

    it('should cleanup all listeners', () => {
      const manager = new ActivityListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'removeEventListener');

      manager.setup();
      manager.cleanup();

      expect(spy).toHaveBeenCalledWith('scroll', mockCallback);
      expect(spy).toHaveBeenCalledWith('resize', mockCallback);
      expect(spy).toHaveBeenCalledWith('focus', mockCallback);
    });

    it('should trigger callback on scroll', () => {
      const manager = new ActivityListenerManager(mockCallback);
      manager.setup();

      window.dispatchEvent(new Event('scroll'));

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should trigger callback on resize', () => {
      const manager = new ActivityListenerManager(mockCallback);
      manager.setup();

      window.dispatchEvent(new Event('resize'));

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should trigger callback on focus', () => {
      const manager = new ActivityListenerManager(mockCallback);
      manager.setup();

      window.dispatchEvent(new Event('focus'));

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should not trigger callback after cleanup', () => {
      const manager = new ActivityListenerManager(mockCallback);
      manager.setup();
      manager.cleanup();

      window.dispatchEvent(new Event('scroll'));

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('TouchListenerManager', () => {
    it('should setup touchstart listener', () => {
      const manager = new TouchListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('touchstart', mockCallback, expect.objectContaining({ passive: true }));
    });

    it('should setup touchmove listener', () => {
      const manager = new TouchListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('touchmove', mockCallback, expect.objectContaining({ passive: true }));
    });

    it('should setup touchend listener', () => {
      const manager = new TouchListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('touchend', mockCallback, expect.objectContaining({ passive: true }));
    });

    it('should setup orientationchange listener', () => {
      const manager = new TouchListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('orientationchange', mockCallback, expect.objectContaining({ passive: true }));
    });

    it('should cleanup all listeners', () => {
      const manager = new TouchListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'removeEventListener');

      manager.setup();
      manager.cleanup();

      expect(spy).toHaveBeenCalledWith('touchstart', mockCallback);
      expect(spy).toHaveBeenCalledWith('touchmove', mockCallback);
      expect(spy).toHaveBeenCalledWith('touchend', mockCallback);
      expect(spy).toHaveBeenCalledWith('orientationchange', mockCallback);
    });

    it('should trigger callback on touchstart', () => {
      const manager = new TouchListenerManager(mockCallback);
      manager.setup();

      window.dispatchEvent(new Event('touchstart'));

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should not trigger callback after cleanup', () => {
      const manager = new TouchListenerManager(mockCallback);
      manager.setup();
      manager.cleanup();

      window.dispatchEvent(new Event('touchstart'));

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('UnloadListenerManager', () => {
    it('should setup beforeunload listener', () => {
      const manager = new UnloadListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('beforeunload', mockCallback, expect.objectContaining({ passive: true }));
    });

    it('should setup pagehide listener', () => {
      const manager = new UnloadListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('pagehide', mockCallback, expect.objectContaining({ passive: true }));
    });

    it('should cleanup all listeners', () => {
      const manager = new UnloadListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'removeEventListener');

      manager.setup();
      manager.cleanup();

      expect(spy).toHaveBeenCalledWith('beforeunload', mockCallback);
      expect(spy).toHaveBeenCalledWith('pagehide', mockCallback);
    });

    it('should trigger callback on beforeunload', () => {
      const manager = new UnloadListenerManager(mockCallback);
      manager.setup();

      window.dispatchEvent(new Event('beforeunload'));

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should not trigger callback after cleanup', () => {
      const manager = new UnloadListenerManager(mockCallback);
      manager.setup();
      manager.cleanup();

      window.dispatchEvent(new Event('beforeunload'));

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('VisibilityListenerManager', () => {
    let onVisibilityChange: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      onVisibilityChange = vi.fn();
    });

    it('should setup visibilitychange listener', () => {
      const manager = new VisibilityListenerManager(mockCallback, onVisibilityChange);
      const spy = vi.spyOn(document, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith(
        'visibilitychange',
        onVisibilityChange,
        expect.objectContaining({ passive: true }),
      );
    });

    it('should setup blur listener', () => {
      const manager = new VisibilityListenerManager(mockCallback, onVisibilityChange);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('blur', onVisibilityChange, expect.objectContaining({ passive: true }));
    });

    it('should setup focus listener', () => {
      const manager = new VisibilityListenerManager(mockCallback, onVisibilityChange);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('focus', mockCallback, expect.objectContaining({ passive: true }));
    });

    it('should cleanup all listeners', () => {
      const manager = new VisibilityListenerManager(mockCallback, onVisibilityChange);
      manager.setup();

      const docSpy = vi.spyOn(document, 'removeEventListener');
      const winSpy = vi.spyOn(window, 'removeEventListener');

      manager.cleanup();

      expect(docSpy).toHaveBeenCalledWith('visibilitychange', onVisibilityChange);
      expect(winSpy).toHaveBeenCalledWith('blur', onVisibilityChange);
      expect(winSpy).toHaveBeenCalledWith('focus', mockCallback);
    });

    it('should trigger callback on visibilitychange', () => {
      const manager = new VisibilityListenerManager(mockCallback, onVisibilityChange);
      manager.setup();

      document.dispatchEvent(new Event('visibilitychange'));

      expect(onVisibilityChange).toHaveBeenCalled();
    });

    it('should not trigger callback after cleanup', () => {
      const manager = new VisibilityListenerManager(mockCallback, onVisibilityChange);
      manager.setup();
      manager.cleanup();

      document.dispatchEvent(new Event('visibilitychange'));

      expect(onVisibilityChange).not.toHaveBeenCalled();
    });
  });

  describe('MouseListenerManager', () => {
    it('should setup mousemove listener', () => {
      const manager = new MouseListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('mousemove', mockCallback, expect.objectContaining({ passive: true }));
    });

    it('should setup mousedown listener', () => {
      const manager = new MouseListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('mousedown', mockCallback, expect.objectContaining({ passive: true }));
    });

    it('should setup wheel listener', () => {
      const manager = new MouseListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('wheel', mockCallback, expect.objectContaining({ passive: true }));
    });

    it('should cleanup all listeners', () => {
      const manager = new MouseListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'removeEventListener');

      manager.setup();
      manager.cleanup();

      expect(spy).toHaveBeenCalledWith('mousemove', mockCallback);
      expect(spy).toHaveBeenCalledWith('mousedown', mockCallback);
      expect(spy).toHaveBeenCalledWith('wheel', mockCallback);
    });

    it('should trigger callback on mousemove', () => {
      const manager = new MouseListenerManager(mockCallback);
      manager.setup();

      window.dispatchEvent(new Event('mousemove'));

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should not trigger callback after cleanup', () => {
      const manager = new MouseListenerManager(mockCallback);
      manager.setup();
      manager.cleanup();

      window.dispatchEvent(new Event('mousemove'));

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('KeyboardListenerManager', () => {
    it('should setup keydown listener', () => {
      const manager = new KeyboardListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'addEventListener');

      manager.setup();

      expect(spy).toHaveBeenCalledWith('keydown', mockCallback, expect.objectContaining({ passive: true }));
    });

    it('should cleanup keydown listener', () => {
      const manager = new KeyboardListenerManager(mockCallback);
      const spy = vi.spyOn(window, 'removeEventListener');

      manager.setup();
      manager.cleanup();

      expect(spy).toHaveBeenCalledWith('keydown', mockCallback);
    });

    it('should trigger callback on keydown', () => {
      const manager = new KeyboardListenerManager(mockCallback);
      manager.setup();

      window.dispatchEvent(new Event('keydown'));

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should not trigger callback after cleanup', () => {
      const manager = new KeyboardListenerManager(mockCallback);
      manager.setup();
      manager.cleanup();

      window.dispatchEvent(new Event('keydown'));

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
});
