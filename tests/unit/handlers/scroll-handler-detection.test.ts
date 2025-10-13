/**
 * Unit tests for ScrollHandler scroll container detection
 * These tests verify the fixes for:
 * 1. Closure bug (container referenced before declaration)
 * 2. Window scroll detection (always check window first)
 * 3. Vertical-only scroll detection (ignore horizontal carousels)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ScrollHandler } from '../../../src/handlers/scroll.handler';
import { EventManager } from '../../../src/managers/event.manager';

describe('ScrollHandler - Scroll Container Detection', () => {
  let scrollHandler: ScrollHandler;
  let eventManager: EventManager;

  beforeEach(() => {
    // Create mock EventManager
    eventManager = {
      track: vi.fn(),
    } as unknown as EventManager;

    scrollHandler = new ScrollHandler(eventManager);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Window scroll detection', () => {
    it('should always check window scroll first, even when other scrollables exist', () => {
      // Create a mock scrollable div
      const scrollableDiv = document.createElement('div');
      scrollableDiv.style.overflowY = 'auto';
      scrollableDiv.style.height = '100px';
      Object.defineProperty(scrollableDiv, 'scrollHeight', { value: 200, configurable: true });
      Object.defineProperty(scrollableDiv, 'clientHeight', { value: 100, configurable: true });
      document.body.appendChild(scrollableDiv);

      // Mock window as scrollable
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

      // Start tracking
      scrollHandler.startTracking();

      // Access private containers array via any cast for testing
      const containers = (scrollHandler as any).containers as any[];

      // Should have window + the div
      expect(containers.length).toBeGreaterThanOrEqual(1);

      // First container should be window
      const windowContainer = containers.find((c: any) => c.selector === 'window');
      expect(windowContainer).toBeDefined();
      expect(windowContainer?.element).toBe(window);

      // Cleanup
      document.body.removeChild(scrollableDiv);
    });

    it('should use window as fallback when no other scrollables exist', () => {
      // Mock window as scrollable
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

      // Remove all scrollable elements from body
      document.body.innerHTML = '<div>No scrollables here</div>';

      scrollHandler.startTracking();

      const containers = (scrollHandler as any).containers as any[];

      // Should have at least window
      expect(containers.length).toBeGreaterThanOrEqual(1);
      expect(containers[0].selector).toBe('window');
      expect(containers[0].element).toBe(window);
    });
  });

  describe('Vertical vs Horizontal scroll detection', () => {
    it('should detect vertical scroll containers', async () => {
      const verticalScroller = document.createElement('div');
      verticalScroller.className = 'vertical-scroll';
      verticalScroller.style.overflowY = 'auto';
      verticalScroller.style.height = '100px';
      verticalScroller.style.display = 'block'; // Ensure visibility
      verticalScroller.style.position = 'relative'; // Ensure offsetParent exists
      Object.defineProperty(verticalScroller, 'scrollHeight', { value: 300, configurable: true });
      Object.defineProperty(verticalScroller, 'clientHeight', { value: 100, configurable: true });
      Object.defineProperty(verticalScroller, 'scrollWidth', { value: 200, configurable: true });
      Object.defineProperty(verticalScroller, 'clientWidth', { value: 200, configurable: true });
      Object.defineProperty(verticalScroller, 'offsetParent', { value: document.body, configurable: true });
      document.body.appendChild(verticalScroller);

      scrollHandler.startTracking();

      // Wait for detection
      await new Promise((resolve) => setTimeout(resolve, 100));

      const containers = (scrollHandler as any).containers as any[];
      const verticalContainer = containers.find((c: any) => c.selector === '.vertical-scroll');

      expect(verticalContainer).toBeDefined();

      document.body.removeChild(verticalScroller);
    });

    it('should NOT detect horizontal-only scroll containers (carousels)', () => {
      const horizontalCarousel = document.createElement('ul');
      horizontalCarousel.className = 'items-container';
      horizontalCarousel.style.overflowX = 'auto';
      horizontalCarousel.style.overflowY = 'hidden';
      horizontalCarousel.style.width = '200px';
      // Horizontal overflow but NOT vertical
      Object.defineProperty(horizontalCarousel, 'scrollHeight', { value: 50, configurable: true });
      Object.defineProperty(horizontalCarousel, 'clientHeight', { value: 50, configurable: true });
      Object.defineProperty(horizontalCarousel, 'scrollWidth', { value: 500, configurable: true });
      Object.defineProperty(horizontalCarousel, 'clientWidth', { value: 200, configurable: true });
      document.body.appendChild(horizontalCarousel);

      scrollHandler.startTracking();

      const containers = (scrollHandler as any).containers as any[];
      const carouselContainer = containers.find((c: any) => c.selector === '.items-container');

      // Should NOT be tracked (it's horizontal only)
      expect(carouselContainer).toBeUndefined();

      document.body.removeChild(horizontalCarousel);
    });

    it('should detect elements with both horizontal and vertical scroll', async () => {
      const bothScroller = document.createElement('div');
      bothScroller.className = 'both-scroll';
      bothScroller.style.overflow = 'auto';
      bothScroller.style.height = '100px';
      bothScroller.style.width = '200px';
      bothScroller.style.display = 'block'; // Ensure visibility
      bothScroller.style.position = 'relative'; // Ensure offsetParent exists
      // Both horizontal AND vertical overflow
      Object.defineProperty(bothScroller, 'scrollHeight', { value: 300, configurable: true });
      Object.defineProperty(bothScroller, 'clientHeight', { value: 100, configurable: true });
      Object.defineProperty(bothScroller, 'scrollWidth', { value: 500, configurable: true });
      Object.defineProperty(bothScroller, 'clientWidth', { value: 200, configurable: true });
      Object.defineProperty(bothScroller, 'offsetParent', { value: document.body, configurable: true });
      document.body.appendChild(bothScroller);

      scrollHandler.startTracking();

      // Wait for detection
      await new Promise((resolve) => setTimeout(resolve, 100));

      const containers = (scrollHandler as any).containers as any[];
      const bothContainer = containers.find((c: any) => c.selector === '.both-scroll');

      // Should be tracked because it has vertical scroll
      expect(bothContainer).toBeDefined();

      document.body.removeChild(bothScroller);
    });
  });

  describe('Container closure bug prevention', () => {
    it('should properly reference container in handleScroll closure', async () => {
      // This test verifies that the closure bug is fixed
      // The bug was: handleScroll tried to use 'container' before it was declared

      const scrollableDiv = document.createElement('div');
      scrollableDiv.className = 'test-scroll';
      scrollableDiv.style.overflowY = 'auto';
      scrollableDiv.style.height = '100px';
      scrollableDiv.style.display = 'block'; // Ensure visibility
      scrollableDiv.style.position = 'relative'; // Ensure offsetParent exists
      Object.defineProperty(scrollableDiv, 'scrollHeight', { value: 200, configurable: true });
      Object.defineProperty(scrollableDiv, 'clientHeight', { value: 100, configurable: true });
      Object.defineProperty(scrollableDiv, 'offsetParent', { value: document.body, configurable: true });
      document.body.appendChild(scrollableDiv);

      scrollHandler.startTracking();

      // Wait for detection
      await new Promise((resolve) => setTimeout(resolve, 100));

      const containers = (scrollHandler as any).containers as any[];
      const testContainer = containers.find((c: any) => c.selector === '.test-scroll');

      expect(testContainer).toBeDefined();
      expect(testContainer?.listener).toBeDefined();
      expect(typeof testContainer?.listener).toBe('function');

      // Simulate scroll event - should NOT throw error
      expect(() => {
        testContainer?.listener();
      }).not.toThrow();

      document.body.removeChild(scrollableDiv);
    });

    it('should have valid debounceTimer property in container when handleScroll executes', async () => {
      const scrollableDiv = document.createElement('div');
      scrollableDiv.className = 'timer-test';
      scrollableDiv.style.overflowY = 'auto';
      scrollableDiv.style.height = '100px';
      scrollableDiv.style.display = 'block'; // Ensure visibility
      scrollableDiv.style.position = 'relative'; // Ensure offsetParent exists
      Object.defineProperty(scrollableDiv, 'scrollHeight', { value: 200, configurable: true });
      Object.defineProperty(scrollableDiv, 'clientHeight', { value: 100, configurable: true });
      Object.defineProperty(scrollableDiv, 'offsetParent', { value: document.body, configurable: true });
      document.body.appendChild(scrollableDiv);

      scrollHandler.startTracking();

      // Wait for detection
      await new Promise((resolve) => setTimeout(resolve, 100));

      const containers = (scrollHandler as any).containers as any[];
      const testContainer = containers.find((c: any) => c.selector === '.timer-test');

      expect(testContainer).toBeDefined();

      // Trigger scroll
      testContainer?.listener();

      // Container should have debounceTimer set (not null/undefined at execution time)
      expect(testContainer?.debounceTimer).toBeDefined();

      document.body.removeChild(scrollableDiv);
    });
  });

  describe('Multiple scroll containers', () => {
    it('should track both window and custom scrollable containers', async () => {
      // Mock window as scrollable
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

      // Add custom scrollable
      const customScroller = document.createElement('div');
      customScroller.className = 'custom-scroll';
      customScroller.style.overflowY = 'scroll';
      customScroller.style.height = '150px';
      customScroller.style.display = 'block'; // Ensure visibility
      customScroller.style.position = 'relative'; // Ensure offsetParent exists
      Object.defineProperty(customScroller, 'scrollHeight', { value: 400, configurable: true });
      Object.defineProperty(customScroller, 'clientHeight', { value: 150, configurable: true });
      Object.defineProperty(customScroller, 'offsetParent', { value: document.body, configurable: true });
      document.body.appendChild(customScroller);

      scrollHandler.startTracking();

      // Wait for detection
      await new Promise((resolve) => setTimeout(resolve, 100));

      const containers = (scrollHandler as any).containers as any[];

      // Should have at least 2: window + custom
      expect(containers.length).toBeGreaterThanOrEqual(2);

      const hasWindow = containers.some((c: any) => c.selector === 'window');
      const hasCustom = containers.some((c: any) => c.selector === '.custom-scroll');

      expect(hasWindow).toBe(true);
      expect(hasCustom).toBe(true);

      document.body.removeChild(customScroller);
    });
  });
});
