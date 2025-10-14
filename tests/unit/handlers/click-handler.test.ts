import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClickHandler } from '../../../src/handlers/click.handler';
import { EventType } from '../../../src/types';
import { HTML_DATA_ATTR_PREFIX, MAX_TEXT_LENGTH } from '../../../src/constants';
import { setupTestEnvironment, cleanupTestState } from '../../utils/test-setup';

// Mock dependencies
vi.mock('../../../src/utils/logging', () => ({
  debugLog: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ClickHandler', () => {
  let clickHandler: ClickHandler;
  let mockElement: HTMLElement;
  let mockEventManager: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Disable click throttling for tests
    const testEnv = setupTestEnvironment({ clickThrottleMs: 0 });
    mockEventManager = testEnv.eventManager;
    vi.spyOn(mockEventManager, 'track');

    // Create DOM elements for testing
    document.body.innerHTML = `
      <div id="container">
        <button id="test-button" class="btn primary" title="Test Button">Click Me</button>
        <a href="/test" id="test-link">Test Link</a>
        <div id="with-text">Some text content here</div>
        <div ${HTML_DATA_ATTR_PREFIX}-name="custom_event" ${HTML_DATA_ATTR_PREFIX}-value="test_value">
          <span>Tracked Element</span>
        </div>
        <img src="test.jpg" alt="Test Image" />
        <div role="button" aria-label="Accessible Button">Accessible</div>
      </div>
    `;

    mockElement = document.getElementById('test-button') as HTMLElement;
    clickHandler = new ClickHandler(mockEventManager);
  });

  afterEach(() => {
    clickHandler.stopTracking();
    document.body.innerHTML = '';
    cleanupTestState();
  });

  describe('Event Listener Management', () => {
    test('should start click tracking and add event listener', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      clickHandler.startTracking();

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
    });

    test('should not add multiple listeners when called repeatedly', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      clickHandler.startTracking();
      clickHandler.startTracking();

      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
    });

    test('should stop tracking and remove event listener', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      clickHandler.startTracking();
      clickHandler.stopTracking();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
    });

    test('should handle stop tracking when not started', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      clickHandler.stopTracking();

      expect(removeEventListenerSpy).not.toHaveBeenCalled();
    });
  });

  describe('Click Event Handling', () => {
    test('should track basic click events', () => {
      clickHandler.startTracking();

      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 200,
        bubbles: true,
      });

      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: mockElement,
      });

      mockElement.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CLICK,
        click_data: {
          x: 100,
          y: 200,
          relativeX: expect.any(Number),
          relativeY: expect.any(Number),
          tag: 'button',
          id: 'test-button',
          class: 'btn primary',
          text: 'Click Me',
          title: 'Test Button',
          dataAttributes: expect.objectContaining({
            id: 'test-button',
            class: 'btn primary',
            title: 'Test Button',
          }),
        },
      });
    });

    test('should handle clicks on elements without valid target', () => {
      clickHandler.startTracking();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: null,
      });

      window.dispatchEvent(clickEvent);

      expect(mockEventManager.track).not.toHaveBeenCalled();
    });

    test('should handle clicks on text nodes by using parent element', () => {
      clickHandler.startTracking();

      const textNode = document.createTextNode('Text');
      const parentDiv = document.createElement('div');
      parentDiv.id = 'parent-div';
      parentDiv.appendChild(textNode);
      document.body.appendChild(parentDiv);

      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 200,
        bubbles: true,
      });

      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: textNode,
      });

      parentDiv.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CLICK,
        click_data: expect.objectContaining({
          tag: 'div',
          id: 'parent-div',
        }),
      });
    });
  });

  describe('Custom Event Tracking', () => {
    test('should track custom events for elements with tracking attributes', () => {
      clickHandler.startTracking();

      const trackedElement = document.querySelector(`[${HTML_DATA_ATTR_PREFIX}-name="custom_event"]`) as HTMLElement;
      const clickEvent = new MouseEvent('click', { bubbles: true });

      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: trackedElement,
      });

      trackedElement.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CUSTOM,
        custom_event: {
          name: 'custom_event',
          metadata: { value: 'test_value' },
        },
      });

      // Should also track regular click
      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CLICK,
        click_data: expect.any(Object),
      });
    });

    test('should find tracking element in parent hierarchy', () => {
      clickHandler.startTracking();

      const childElement = document.querySelector(`[${HTML_DATA_ATTR_PREFIX}-name="custom_event"] span`) as HTMLElement;
      const clickEvent = new MouseEvent('click', { bubbles: true });

      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: childElement,
      });

      childElement.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CUSTOM,
        custom_event: {
          name: 'custom_event',
          metadata: { value: 'test_value' },
        },
      });
    });

    test('should handle custom events without value attribute', () => {
      const elementWithoutValue = document.createElement('div');
      elementWithoutValue.setAttribute(`${HTML_DATA_ATTR_PREFIX}-name`, 'simple_event');
      document.body.appendChild(elementWithoutValue);

      clickHandler.startTracking();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: elementWithoutValue,
      });

      elementWithoutValue.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CUSTOM,
        custom_event: {
          name: 'simple_event',
        },
      });
    });
  });

  describe('Coordinate Calculations', () => {
    test('should calculate relative coordinates correctly', () => {
      clickHandler.startTracking();

      // Mock getBoundingClientRect for precise coordinate testing
      vi.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
        left: 50,
        top: 100,
        width: 200,
        height: 50,
        right: 250,
        bottom: 150,
        x: 50,
        y: 100,
        toJSON: vi.fn(),
      });

      const clickEvent = new MouseEvent('click', {
        clientX: 150, // Center of element (50 + 200/2)
        clientY: 125, // Center of element (100 + 50/2)
        bubbles: true,
      });

      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: mockElement,
      });

      mockElement.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CLICK,
        click_data: expect.objectContaining({
          x: 150,
          y: 125,
          relativeX: 0.5, // Center of element
          relativeY: 0.5, // Center of element
        }),
      });
    });

    test('should handle edge coordinates correctly', () => {
      clickHandler.startTracking();

      vi.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      });

      const testCases = [
        { clientX: 0, clientY: 0, expectedRelX: 0, expectedRelY: 0 }, // Top-left
        { clientX: 100, clientY: 100, expectedRelX: 1, expectedRelY: 1 }, // Bottom-right
        { clientX: -10, clientY: -10, expectedRelX: 0, expectedRelY: 0 }, // Outside (clamped)
        { clientX: 110, clientY: 110, expectedRelX: 1, expectedRelY: 1 }, // Outside (clamped)
      ];

      testCases.forEach((testCase, index) => {
        const clickEvent = new MouseEvent('click', {
          clientX: testCase.clientX,
          clientY: testCase.clientY,
          bubbles: true,
        });

        Object.defineProperty(clickEvent, 'target', {
          writable: false,
          value: mockElement,
        });

        mockElement.dispatchEvent(clickEvent);

        // Check the call at the correct index (calls are accumulated)
        const callIndex = index;
        expect(mockEventManager.track).toHaveBeenNthCalledWith(
          callIndex + 1,
          expect.objectContaining({
            type: EventType.CLICK,
            click_data: expect.objectContaining({
              relativeX: testCase.expectedRelX,
              relativeY: testCase.expectedRelY,
            }),
          }),
        );
      });
    });

    test('should handle zero-width/height elements', () => {
      clickHandler.startTracking();

      vi.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
        left: 50,
        top: 100,
        width: 0,
        height: 0,
        right: 50,
        bottom: 100,
        x: 50,
        y: 100,
        toJSON: vi.fn(),
      });

      const clickEvent = new MouseEvent('click', {
        clientX: 75,
        clientY: 125,
        bubbles: true,
      });

      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: mockElement,
      });

      mockElement.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CLICK,
        click_data: expect.objectContaining({
          relativeX: 0, // Should default to 0 for zero width
          relativeY: 0, // Should default to 0 for zero height
        }),
      });
    });
  });

  describe('Interactive Element Detection', () => {
    test('should find relevant interactive elements', () => {
      clickHandler.startTracking();

      const linkElement = document.getElementById('test-link') as HTMLElement;
      const clickEvent = new MouseEvent('click', { bubbles: true });

      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: linkElement,
      });

      linkElement.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CLICK,
        click_data: expect.objectContaining({
          tag: 'a',
          id: 'test-link',
          href: '/test',
        }),
      });
    });

    test('should find interactive parent elements', () => {
      // Create nested structure where child is clicked but parent is interactive
      const buttonParent = document.createElement('button');
      buttonParent.id = 'parent-button';
      const spanChild = document.createElement('span');
      spanChild.textContent = 'Child text';
      buttonParent.appendChild(spanChild);
      document.body.appendChild(buttonParent);

      clickHandler.startTracking();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: spanChild,
      });

      spanChild.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CLICK,
        click_data: expect.objectContaining({
          tag: 'button',
          id: 'parent-button',
        }),
      });
    });
  });

  describe('Text Content Handling', () => {
    test('should extract text content correctly', () => {
      clickHandler.startTracking();

      const textElement = document.getElementById('with-text') as HTMLElement;
      const clickEvent = new MouseEvent('click', { bubbles: true });

      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: textElement,
      });

      textElement.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CLICK,
        click_data: expect.objectContaining({
          text: 'Some text content here',
        }),
      });
    });

    test('should truncate long text content', () => {
      const longText = 'A'.repeat(MAX_TEXT_LENGTH + 50);
      const elementWithLongText = document.createElement('div');
      elementWithLongText.textContent = longText;
      document.body.appendChild(elementWithLongText);

      clickHandler.startTracking();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: elementWithLongText,
      });

      elementWithLongText.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CLICK,
        click_data: expect.objectContaining({
          text: expect.stringMatching(/^A+\.\.\.$/),
        }),
      });

      const trackedCall = mockEventManager.track;
      const clickData = trackedCall.mock.calls.find((call: any) => call[0].type === EventType.CLICK)[0].click_data;
      expect(clickData.text.length).toBeLessThanOrEqual(MAX_TEXT_LENGTH);
    });

    test('should handle elements with no text content', () => {
      const imgElement = document.querySelector('img') as HTMLElement;
      clickHandler.startTracking();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: imgElement,
      });

      imgElement.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CLICK,
        click_data: expect.objectContaining({
          tag: 'img',
          alt: 'Test Image',
        }),
      });

      // Should not have text property
      const trackedCall = mockEventManager.track;
      const clickData = trackedCall.mock.calls[0][0].click_data;
      expect(clickData.text).toBeUndefined();
    });
  });

  describe('Attribute Extraction', () => {
    test('should extract common HTML attributes', () => {
      const roleElement = document.querySelector('[role="button"]') as HTMLElement;
      clickHandler.startTracking();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: roleElement,
      });

      roleElement.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CLICK,
        click_data: expect.objectContaining({
          role: 'button',
          ariaLabel: 'Accessible Button',
          dataAttributes: expect.objectContaining({
            role: 'button',
            'aria-label': 'Accessible Button',
          }),
        }),
      });
    });

    test('should handle missing attributes gracefully', () => {
      const simpleDiv = document.createElement('div');
      document.body.appendChild(simpleDiv);

      clickHandler.startTracking();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: simpleDiv,
      });

      simpleDiv.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalledWith({
        type: EventType.CLICK,
        click_data: expect.objectContaining({
          tag: 'div',
          // Should not have properties for missing attributes
        }),
      });

      const trackedCall = mockEventManager.track;
      const clickData = trackedCall.mock.calls[0][0].click_data;
      expect(clickData.id).toBeUndefined();
      expect(clickData.class).toBeUndefined();
      expect(clickData.href).toBeUndefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle elements with null textContent', () => {
      const elementWithNullText = document.createElement('div');
      Object.defineProperty(elementWithNullText, 'textContent', {
        value: null,
        writable: true,
      });
      document.body.appendChild(elementWithNullText);

      clickHandler.startTracking();

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        writable: false,
        value: elementWithNullText,
      });

      elementWithNullText.dispatchEvent(clickEvent);

      expect(mockEventManager.track).toHaveBeenCalled();
    });
  });

  describe('Throttle Cache Pruning (Memory Leak Prevention)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // Set config with clickThrottleMs to enable throttling
      (clickHandler as any).set('config', { clickThrottleMs: 300 });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('should prune old entries after TTL expires', () => {
      clickHandler.startTracking();

      // Create 10 unique elements and click them
      for (let i = 0; i < 10; i++) {
        const element = document.createElement('button');
        element.id = `button-${i}`;
        document.body.appendChild(element);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: element });
        element.dispatchEvent(clickEvent);
      }

      // Verify all entries are in cache
      expect((clickHandler as any).lastClickTimes.size).toBe(10);

      // Fast-forward 6 minutes (beyond 5-minute TTL + 30s prune interval)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Click a new element to trigger pruning
      const newElement = document.createElement('button');
      newElement.id = 'new-button';
      document.body.appendChild(newElement);
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: newElement });
      newElement.dispatchEvent(clickEvent);

      // Old entries should be pruned, only new element remains
      expect((clickHandler as any).lastClickTimes.size).toBe(1);
      expect((clickHandler as any).lastClickTimes.has('#new-button')).toBe(true);
    });

    test('should enforce max cache size limit (1000 entries)', () => {
      clickHandler.startTracking();

      // Create 1050 unique elements (beyond MAX_THROTTLE_CACHE_ENTRIES)
      for (let i = 0; i < 1050; i++) {
        const element = document.createElement('button');
        element.id = `button-${i}`;
        document.body.appendChild(element);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: element });
        element.dispatchEvent(clickEvent);

        // Advance time by 31 seconds every 100 clicks to trigger pruning
        if (i % 100 === 0) {
          vi.advanceTimersByTime(31 * 1000);
        }
      }

      // Cache should not exceed MAX_THROTTLE_CACHE_ENTRIES
      expect((clickHandler as any).lastClickTimes.size).toBeLessThanOrEqual(1000);
    });

    test('should use LRU eviction (oldest entries removed first)', () => {
      clickHandler.startTracking();

      // Add 1001 entries to trigger eviction
      const elementIds: string[] = [];
      for (let i = 0; i < 1001; i++) {
        const element = document.createElement('button');
        element.id = `button-${i}`;
        elementIds.push(`#button-${i}`);
        document.body.appendChild(element);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: element });
        element.dispatchEvent(clickEvent);

        // Trigger pruning check every 50 clicks
        if (i % 50 === 0) {
          vi.advanceTimersByTime(31 * 1000);
        }
      }

      // First element should be evicted (LRU)
      expect((clickHandler as any).lastClickTimes.has(elementIds[0])).toBe(false);

      // Most recent elements should still be present
      const lastIndex = elementIds.length - 1;
      expect((clickHandler as any).lastClickTimes.has(elementIds[lastIndex])).toBe(true);
    });

    test('should rate-limit pruning (once per 30 seconds)', () => {
      clickHandler.startTracking();

      // Create an element and click it
      const element = document.createElement('button');
      element.id = 'test-button';
      document.body.appendChild(element);

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: element });

      // Click multiple times within 30 seconds
      element.dispatchEvent(clickEvent);
      vi.advanceTimersByTime(10 * 1000); // 10 seconds
      element.dispatchEvent(clickEvent);
      vi.advanceTimersByTime(10 * 1000); // 20 seconds total
      element.dispatchEvent(clickEvent);

      // Pruning should only run once (lastPruneTime prevents re-runs)
      const lastPruneTime = (clickHandler as any).lastPruneTime;
      expect(lastPruneTime).toBeGreaterThan(0);

      // Fast-forward 31 seconds to allow next prune
      vi.advanceTimersByTime(31 * 1000);
      element.dispatchEvent(clickEvent);

      // lastPruneTime should be updated
      const newPruneTime = (clickHandler as any).lastPruneTime;
      expect(newPruneTime).toBeGreaterThan(lastPruneTime);
    });

    test('should clear cache and reset prune time on stopTracking', () => {
      clickHandler.startTracking();

      // Add some entries
      for (let i = 0; i < 5; i++) {
        const element = document.createElement('button');
        element.id = `button-${i}`;
        document.body.appendChild(element);

        const clickEvent = new MouseEvent('click', { bubbles: true });
        Object.defineProperty(clickEvent, 'target', { value: element });
        element.dispatchEvent(clickEvent);
      }

      expect((clickHandler as any).lastClickTimes.size).toBe(5);
      expect((clickHandler as any).lastPruneTime).toBeGreaterThan(0);

      // Stop tracking
      clickHandler.stopTracking();

      expect((clickHandler as any).lastClickTimes.size).toBe(0);
      expect((clickHandler as any).lastPruneTime).toBe(0);
    });

    test('should maintain throttling within cache window', () => {
      clickHandler.startTracking();

      const element = document.createElement('button');
      element.id = 'throttled-button';
      document.body.appendChild(element);

      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: element });

      // First click should be tracked
      element.dispatchEvent(clickEvent);
      expect(mockEventManager.track).toHaveBeenCalledTimes(1);

      // Second click within throttle window (300ms) should be suppressed
      vi.advanceTimersByTime(200);
      element.dispatchEvent(clickEvent);
      expect(mockEventManager.track).toHaveBeenCalledTimes(1); // Still 1

      // Third click after throttle window should be tracked
      vi.advanceTimersByTime(150); // Total 350ms
      element.dispatchEvent(clickEvent);
      expect(mockEventManager.track).toHaveBeenCalledTimes(2);
    });
  });
});
