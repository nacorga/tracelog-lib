import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ViewportHandler } from '../../../src/handlers/viewport.handler';
import { EventManager } from '../../../src/managers/event.manager';
import { EventType } from '../../../src/types';
import { resetGlobalState } from '../../../src/managers/state.manager';

// Mock IntersectionObserver
class MockIntersectionObserver {
  private readonly callback: IntersectionObserverCallback;
  private readonly observedElements = new Set<Element>();

  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    this.callback = callback;
  }

  observe(element: Element): void {
    this.observedElements.add(element);
  }

  unobserve(element: Element): void {
    this.observedElements.delete(element);
  }

  disconnect(): void {
    this.observedElements.clear();
  }

  // Test helper to trigger intersection
  triggerIntersection(entries: Partial<IntersectionObserverEntry>[]): void {
    const fullEntries = entries.map((entry) => ({
      time: 0,
      rootBounds: null,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      intersectionRatio: entry.intersectionRatio ?? 0,
      isIntersecting: entry.isIntersecting ?? false,
      target: entry.target as Element,
    })) as IntersectionObserverEntry[];

    this.callback(fullEntries, this as unknown as IntersectionObserver);
  }
}

describe('ViewportHandler', () => {
  let handler: ViewportHandler;
  let eventManager: EventManager;
  let observerInstance: MockIntersectionObserver | null = null;

  beforeEach(() => {
    resetGlobalState();

    // Mock IntersectionObserver globally
    global.IntersectionObserver = vi.fn((callback, options) => {
      observerInstance = new MockIntersectionObserver(callback, options);
      return observerInstance as unknown as IntersectionObserver;
    }) as unknown as typeof IntersectionObserver;

    // Mock performance.now()
    vi.spyOn(performance, 'now').mockReturnValue(0);

    // Mock setTimeout/clearTimeout
    vi.useFakeTimers();

    // Create mock event manager
    eventManager = {
      track: vi.fn(),
    } as unknown as EventManager;

    handler = new ViewportHandler(eventManager);

    // Set up basic state
    handler['set']('config', {
      viewport: {
        selectors: ['.test-element'],
        threshold: 0.5,
        minDwellTime: 1000,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    observerInstance = null;
  });

  describe('startTracking', () => {
    it('should create IntersectionObserver with correct threshold', () => {
      handler.startTracking();

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ threshold: 0.5 }),
      );
    });

    it('should observe all elements matching configured selectors', () => {
      // Create test elements
      const element1 = document.createElement('div');
      element1.className = 'test-element';
      document.body.appendChild(element1);

      const element2 = document.createElement('div');
      element2.className = 'test-element';
      document.body.appendChild(element2);

      handler.startTracking();

      expect(observerInstance?.['observedElements'].size).toBe(2);
      expect(observerInstance?.['observedElements'].has(element1)).toBe(true);
      expect(observerInstance?.['observedElements'].has(element2)).toBe(true);

      // Cleanup
      document.body.removeChild(element1);
      document.body.removeChild(element2);
    });

    it('should skip elements with data-tlog-ignore attribute', () => {
      const element1 = document.createElement('div');
      element1.className = 'test-element';
      document.body.appendChild(element1);

      const element2 = document.createElement('div');
      element2.className = 'test-element';
      element2.setAttribute('data-tlog-ignore', 'true');
      document.body.appendChild(element2);

      handler.startTracking();

      expect(observerInstance?.['observedElements'].size).toBe(1);
      expect(observerInstance?.['observedElements'].has(element1)).toBe(true);
      expect(observerInstance?.['observedElements'].has(element2)).toBe(false);

      // Cleanup
      document.body.removeChild(element1);
      document.body.removeChild(element2);
    });

    it('should not start tracking when no selectors configured', () => {
      handler['set']('config', { viewport: { selectors: [] } });
      handler.startTracking();

      expect(global.IntersectionObserver).not.toHaveBeenCalled();
    });

    it('should not start tracking when viewport config is missing', () => {
      handler['set']('config', {});
      handler.startTracking();

      expect(global.IntersectionObserver).not.toHaveBeenCalled();
    });

    it('should not start tracking when threshold is invalid', () => {
      handler['set']('config', {
        viewport: { selectors: ['.test'], threshold: 1.5 },
      });
      handler.startTracking();

      expect(global.IntersectionObserver).not.toHaveBeenCalled();
    });

    it('should not start tracking when minDwellTime is negative', () => {
      handler['set']('config', {
        viewport: { selectors: ['.test'], minDwellTime: -100 },
      });
      handler.startTracking();

      expect(global.IntersectionObserver).not.toHaveBeenCalled();
    });

    it('should handle invalid selectors gracefully', () => {
      handler['set']('config', {
        viewport: { selectors: ['[invalid', '.valid'] },
      });

      const validElement = document.createElement('div');
      validElement.className = 'valid';
      document.body.appendChild(validElement);

      expect(() => {
        handler.startTracking();
      }).not.toThrow();

      // Should still observe valid selector
      expect(observerInstance?.['observedElements'].size).toBe(1);

      // Cleanup
      document.body.removeChild(validElement);
    });
  });

  describe('stopTracking', () => {
    it('should disconnect observer', () => {
      handler.startTracking();
      const disconnectSpy = vi.spyOn(observerInstance as MockIntersectionObserver, 'disconnect');

      handler.stopTracking();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should clear all pending timers', () => {
      const element = document.createElement('div');
      element.className = 'test-element';
      document.body.appendChild(element);

      handler.startTracking();

      // Trigger visibility
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);

      // Stop tracking before timer fires
      handler.stopTracking();

      // Advance timer - event should not fire
      vi.advanceTimersByTime(1000);
      expect(eventManager.track).not.toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(element);
    });

    it('should be safe to call multiple times', () => {
      handler.startTracking();

      expect(() => {
        handler.stopTracking();
        handler.stopTracking();
      }).not.toThrow();
    });
  });

  describe('viewport visibility events', () => {
    let element: HTMLDivElement;

    beforeEach(() => {
      element = document.createElement('div');
      element.className = 'test-element';
      document.body.appendChild(element);
      handler.startTracking();
    });

    afterEach(() => {
      if (document.body.contains(element)) {
        document.body.removeChild(element);
      }
    });

    it('should fire event after minDwellTime elapsed', () => {
      // Element becomes visible
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);

      // Advance time to exactly minDwellTime
      vi.advanceTimersByTime(1000);

      expect(eventManager.track).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.VIEWPORT_VISIBLE,
          viewport_data: expect.objectContaining({
            selector: '.test-element',
            dwellTime: 1000,
            visibilityRatio: 0.6,
          }),
        }),
      );
    });

    it('should NOT fire event if element hidden before minDwellTime', () => {
      // Element becomes visible
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);

      // Element becomes hidden after 500ms
      vi.advanceTimersByTime(500);
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: false, intersectionRatio: 0 }]);

      // Advance past original minDwellTime
      vi.advanceTimersByTime(600);

      expect(eventManager.track).not.toHaveBeenCalled();
    });

    it('should calculate correct dwellTime', () => {
      // Element becomes visible at t=0
      vi.spyOn(performance, 'now').mockReturnValue(0);
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.7 }]);

      // Advance time and trigger event
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      vi.advanceTimersByTime(1000);

      expect(eventManager.track).toHaveBeenCalledWith(
        expect.objectContaining({
          viewport_data: expect.objectContaining({
            dwellTime: 1000,
          }),
        }),
      );
    });

    it('should include correct visibility ratio in event', () => {
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.75 }]);

      vi.advanceTimersByTime(1000);

      expect(eventManager.track).toHaveBeenCalledWith(
        expect.objectContaining({
          viewport_data: expect.objectContaining({
            visibilityRatio: 0.75,
          }),
        }),
      );
    });

    it('should include correct selector in event', () => {
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);

      vi.advanceTimersByTime(1000);

      expect(eventManager.track).toHaveBeenCalledWith(
        expect.objectContaining({
          viewport_data: expect.objectContaining({
            selector: '.test-element',
          }),
        }),
      );
    });

    it('should handle element already visible on page load', () => {
      // Create new handler and element
      handler.stopTracking();
      const newElement = document.createElement('div');
      newElement.className = 'test-element';
      document.body.appendChild(newElement);

      handler.startTracking();

      // Simulate element already in viewport
      observerInstance?.triggerIntersection([{ target: newElement, isIntersecting: true, intersectionRatio: 0.8 }]);

      vi.advanceTimersByTime(1000);

      expect(eventManager.track).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.VIEWPORT_VISIBLE,
        }),
      );

      // Cleanup
      document.body.removeChild(newElement);
    });

    it('should skip elements with data-tlog-ignore attribute', () => {
      element.setAttribute('data-tlog-ignore', 'true');

      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);

      vi.advanceTimersByTime(1000);

      expect(eventManager.track).not.toHaveBeenCalled();
    });

    it('should allow element to trigger again after leaving and re-entering viewport', () => {
      // First visibility
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);
      vi.advanceTimersByTime(1000);

      expect(eventManager.track).toHaveBeenCalledTimes(1);

      // Element leaves viewport
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: false, intersectionRatio: 0 }]);

      // Element re-enters viewport
      vi.spyOn(performance, 'now').mockReturnValue(2000);
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.7 }]);

      vi.spyOn(performance, 'now').mockReturnValue(3000);
      vi.advanceTimersByTime(1000);

      // Should fire event again
      expect(eventManager.track).toHaveBeenCalledTimes(2);
    });
  });

  describe('multiple elements', () => {
    it('should track multiple elements independently', () => {
      const element1 = document.createElement('div');
      element1.className = 'test-element';
      document.body.appendChild(element1);

      const element2 = document.createElement('div');
      element2.className = 'test-element';
      document.body.appendChild(element2);

      handler.startTracking();

      // Both elements become visible
      observerInstance?.triggerIntersection([
        { target: element1, isIntersecting: true, intersectionRatio: 0.5 },
        { target: element2, isIntersecting: true, intersectionRatio: 0.6 },
      ]);

      vi.advanceTimersByTime(1000);

      // Both should fire events
      expect(eventManager.track).toHaveBeenCalledTimes(2);

      // Cleanup
      document.body.removeChild(element1);
      document.body.removeChild(element2);
    });

    it('should handle rapid scroll (element visible < minDwellTime)', () => {
      const element = document.createElement('div');
      element.className = 'test-element';
      document.body.appendChild(element);

      handler.startTracking();

      // Element becomes visible
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);

      // Element becomes hidden after 100ms (less than minDwellTime)
      vi.advanceTimersByTime(100);
      observerInstance?.triggerIntersection([{ target: element, isIntersecting: false, intersectionRatio: 0 }]);

      // Advance past original minDwellTime
      vi.advanceTimersByTime(1000);

      // Event should NOT fire
      expect(eventManager.track).not.toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(element);
    });
  });

  describe('custom threshold', () => {
    it('should respect custom threshold value', () => {
      handler.stopTracking();
      handler['set']('config', {
        viewport: {
          selectors: ['.test-element'],
          threshold: 0.75,
          minDwellTime: 1000,
        },
      });

      handler.startTracking();

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ threshold: 0.75 }),
      );
    });

    it('should use default threshold when not specified', () => {
      handler.stopTracking();
      handler['set']('config', {
        viewport: {
          selectors: ['.test-element'],
          minDwellTime: 1000,
        },
      });

      handler.startTracking();

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ threshold: 0.5 }),
      );
    });
  });

  describe('custom minDwellTime', () => {
    it('should respect custom minDwellTime value', () => {
      handler.stopTracking();
      handler['set']('config', {
        viewport: {
          selectors: ['.test-element'],
          threshold: 0.5,
          minDwellTime: 2000,
        },
      });

      const element = document.createElement('div');
      element.className = 'test-element';
      document.body.appendChild(element);

      handler.startTracking();

      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);

      // After 1 second, event should NOT fire
      vi.advanceTimersByTime(1000);
      expect(eventManager.track).not.toHaveBeenCalled();

      // After 2 seconds total, event should fire
      vi.advanceTimersByTime(1000);
      expect(eventManager.track).toHaveBeenCalledTimes(1);

      // Cleanup
      document.body.removeChild(element);
    });

    it('should use default minDwellTime when not specified', () => {
      handler.stopTracking();
      handler['set']('config', {
        viewport: {
          selectors: ['.test-element'],
          threshold: 0.5,
        },
      });

      const element = document.createElement('div');
      element.className = 'test-element';
      document.body.appendChild(element);

      handler.startTracking();

      observerInstance?.triggerIntersection([{ target: element, isIntersecting: true, intersectionRatio: 0.6 }]);

      // Should fire after default 1000ms
      vi.advanceTimersByTime(1000);
      expect(eventManager.track).toHaveBeenCalledTimes(1);

      // Cleanup
      document.body.removeChild(element);
    });
  });

  describe('browser compatibility', () => {
    it('should handle missing IntersectionObserver gracefully', () => {
      // @ts-expect-error - Testing browser compatibility
      global.IntersectionObserver = undefined;

      expect(() => {
        handler.startTracking();
      }).not.toThrow();
      expect(eventManager.track).not.toHaveBeenCalled();
    });

    it('should handle missing document.body gracefully', () => {
      const originalBody = document.body;
      delete (document as { body?: HTMLElement }).body;

      expect(() => {
        handler.startTracking();
      }).not.toThrow();

      // Restore
      (document as { body?: HTMLElement }).body = originalBody;
    });
  });

  describe('MutationObserver optimizations', () => {
    it('should clear debounce timer on stopTracking', () => {
      handler.startTracking();

      // Manually trigger the mutation observer callback to set a debounce timer
      const mutationObserver = (handler as any).mutationObserver;
      if (mutationObserver) {
        // Simulate a DOM mutation that would trigger debounce
        const element = document.createElement('div');
        element.className = 'test-element';
        document.body.appendChild(element);

        // Wait a tiny bit for MutationObserver to trigger
        vi.advanceTimersByTime(1);

        // Stop tracking
        handler.stopTracking();

        // Verify debounce timer was cleared (should always be null after stop)
        const debounceTimerAfterStop = (handler as any).mutationDebounceTimer;
        expect(debounceTimerAfterStop).toBeNull();

        // Cleanup
        document.body.removeChild(element);
      } else {
        // If no mutation observer, just verify stopTracking works
        handler.stopTracking();
        expect((handler as any).mutationDebounceTimer).toBeNull();
      }
    });

    it('should setup MutationObserver when available', () => {
      // Verify MutationObserver was set up
      handler.startTracking();

      // Access private property to verify MutationObserver exists
      const mutationObserver = (handler as any).mutationObserver;
      expect(mutationObserver).not.toBeNull();
    });

    it('should disconnect MutationObserver on stopTracking', () => {
      handler.startTracking();

      // Verify MutationObserver exists
      const mutationObserver = (handler as any).mutationObserver;
      expect(mutationObserver).not.toBeNull();

      // Stop tracking
      handler.stopTracking();

      // Verify MutationObserver was disconnected
      const mutationObserverAfterStop = (handler as any).mutationObserver;
      expect(mutationObserverAfterStop).toBeNull();
    });

    it('should handle missing document.body in setupMutationObserver', () => {
      const originalBody = document.body;

      // Remove body temporarily
      Object.defineProperty(document, 'body', {
        value: null,
        writable: true,
        configurable: true,
      });

      // Should not throw
      expect(() => {
        handler.startTracking();
      }).not.toThrow();

      // Restore body
      Object.defineProperty(document, 'body', {
        value: originalBody,
        writable: true,
        configurable: true,
      });
    });
  });
});
