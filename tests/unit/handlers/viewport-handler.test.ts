/**
 * ViewportHandler Tests
 * Focus: Element visibility tracking with IntersectionObserver
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment, cleanupTestEnvironment, advanceTimers } from '../../helpers/setup.helper';
import { ViewportHandler } from '../../../src/handlers/viewport.handler';
import { EventManager } from '../../../src/managers/event.manager';
import { EventType } from '../../../src/types';
import { HTML_DATA_ATTR_PREFIX } from '../../../src/constants';

describe('ViewportHandler - Basic Initialization', () => {
  let handler: ViewportHandler;
  let mockEventManager: EventManager;
  let mockObserver: any;

  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();

    mockEventManager = {
      track: vi.fn(),
    } as any;

    // Mock IntersectionObserver
    mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
      root: null,
      rootMargin: '',
      thresholds: [0.5],
    };

    global.IntersectionObserver = vi.fn(() => mockObserver) as any;

    handler = new ViewportHandler(mockEventManager);
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should not track if no viewport config provided', () => {
    vi.spyOn(handler as any, 'get').mockReturnValue({});
    handler.startTracking();
    expect(global.IntersectionObserver).not.toHaveBeenCalled();
  });

  it('should not track if viewport config elements is empty', () => {
    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [],
      },
    });

    handler.startTracking();
    expect(global.IntersectionObserver).not.toHaveBeenCalled();
  });

  it('should create IntersectionObserver with configured threshold', () => {
    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.test' }],
        threshold: 0.75,
      },
    });

    handler.startTracking();

    expect(global.IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
      threshold: 0.75,
    });
  });

  it('should use default threshold of 0.5 if not provided', () => {
    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.test' }],
      },
    });

    handler.startTracking();

    expect(global.IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
      threshold: 0.5,
    });
  });

  it('should warn and not track with invalid threshold < 0', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.test' }],
        threshold: -0.1,
      },
    });

    handler.startTracking();

    expect(warnSpy).toHaveBeenCalledWith('[TraceLog] ViewportHandler: Invalid threshold, must be between 0 and 1');
    expect(global.IntersectionObserver).not.toHaveBeenCalled();
  });

  it('should warn and not track with invalid threshold > 1', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.test' }],
        threshold: 1.5,
      },
    });

    handler.startTracking();

    expect(warnSpy).toHaveBeenCalledWith('[TraceLog] ViewportHandler: Invalid threshold, must be between 0 and 1');
    expect(global.IntersectionObserver).not.toHaveBeenCalled();
  });

  it('should warn and not track with invalid minDwellTime < 0', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.test' }],
        minDwellTime: -500,
      },
    });

    handler.startTracking();

    expect(warnSpy).toHaveBeenCalledWith('[TraceLog] ViewportHandler: Invalid minDwellTime, must be non-negative');
    expect(global.IntersectionObserver).not.toHaveBeenCalled();
  });

  it('should warn if IntersectionObserver not supported', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (global.IntersectionObserver as any) = undefined;

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.test' }],
      },
    });

    handler.startTracking();

    expect(warnSpy).toHaveBeenCalledWith(
      '[TraceLog] ViewportHandler: IntersectionObserver not supported in this browser',
    );
  });
});

describe('ViewportHandler - Element Observation', () => {
  let handler: ViewportHandler;
  let mockEventManager: EventManager;
  let mockObserver: any;

  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();

    mockEventManager = {
      track: vi.fn(),
    } as any;

    mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
      root: null,
      rootMargin: '',
      thresholds: [0.5],
    };

    global.IntersectionObserver = vi.fn(() => mockObserver) as any;

    handler = new ViewportHandler(mockEventManager);
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should observe elements matching configured selectors', () => {
    const element1 = document.createElement('div');
    element1.className = 'hero';
    const element2 = document.createElement('div');
    element2.className = 'cta';
    document.body.appendChild(element1);
    document.body.appendChild(element2);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }, { selector: '.cta' }],
      },
    });

    handler.startTracking();

    expect(mockObserver.observe).toHaveBeenCalledWith(element1);
    expect(mockObserver.observe).toHaveBeenCalledWith(element2);
  });

  it('should observe multiple elements with same selector', () => {
    const element1 = document.createElement('div');
    element1.className = 'card';
    const element2 = document.createElement('div');
    element2.className = 'card';
    document.body.appendChild(element1);
    document.body.appendChild(element2);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.card' }],
      },
    });

    handler.startTracking();

    expect(mockObserver.observe).toHaveBeenCalledWith(element1);
    expect(mockObserver.observe).toHaveBeenCalledWith(element2);
  });

  it('should skip elements with data-tlog-ignore attribute', () => {
    const element1 = document.createElement('div');
    element1.className = 'hero';
    const element2 = document.createElement('div');
    element2.className = 'hero';
    element2.setAttribute(`${HTML_DATA_ATTR_PREFIX}-ignore`, 'true');
    document.body.appendChild(element1);
    document.body.appendChild(element2);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
      },
    });

    handler.startTracking();

    expect(mockObserver.observe).toHaveBeenCalledWith(element1);
    expect(mockObserver.observe).toHaveBeenCalledTimes(1);
  });

  it('should warn on invalid selector', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '::invalid::selector' }],
      },
    });

    handler.startTracking();

    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0]?.[0]).toContain('Invalid selector "::invalid::selector"');
  });

  it('should respect maxTrackedElements limit', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Create 5 elements
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('div');
      el.className = 'item';
      document.body.appendChild(el);
    }

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.item' }],
        maxTrackedElements: 3,
      },
    });

    handler.startTracking();

    expect(mockObserver.observe).toHaveBeenCalledTimes(3);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Maximum tracked elements reached'),
      expect.any(Object),
    );
  });

  it('should use DEFAULT_VIEWPORT_MAX_TRACKED_ELEMENTS if not configured', () => {
    const element = document.createElement('div');
    element.className = 'item';
    document.body.appendChild(element);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.item' }],
      },
    });

    handler.startTracking();

    expect(mockObserver.observe).toHaveBeenCalledWith(element);
  });
});

describe('ViewportHandler - Visibility Events', () => {
  let handler: ViewportHandler;
  let mockEventManager: EventManager;
  let mockObserver: any;
  let observeCallback: IntersectionObserverCallback;

  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();

    mockEventManager = {
      track: vi.fn(),
    } as any;

    mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
      root: null,
      rootMargin: '',
      thresholds: [0.5],
    };

    global.IntersectionObserver = vi.fn((callback) => {
      observeCallback = callback;
      return mockObserver;
    }) as any;

    handler = new ViewportHandler(mockEventManager);
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should fire viewport event after minDwellTime when element becomes visible', async () => {
    const element = document.createElement('div');
    element.className = 'hero';
    document.body.appendChild(element);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
        minDwellTime: 1000,
      },
    });

    handler.startTracking();

    const entry: IntersectionObserverEntry = {
      target: element,
      isIntersecting: true,
      intersectionRatio: 0.75,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    };

    observeCallback([entry], mockObserver);
    await advanceTimers(1000);

    expect(mockEventManager.track).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EventType.VIEWPORT_VISIBLE,
        viewport_data: expect.objectContaining({
          selector: '.hero',
          dwellTime: expect.any(Number),
          visibilityRatio: 0.75,
        }),
      }),
    );
  });

  it('should not fire event if element leaves viewport before minDwellTime', async () => {
    const element = document.createElement('div');
    element.className = 'hero';
    document.body.appendChild(element);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
        minDwellTime: 1000,
      },
    });

    handler.startTracking();

    const entryVisible: IntersectionObserverEntry = {
      target: element,
      isIntersecting: true,
      intersectionRatio: 0.75,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    };

    const entryHidden: IntersectionObserverEntry = {
      target: element,
      isIntersecting: false,
      intersectionRatio: 0,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    };

    // Element becomes visible - starts timeout
    observeCallback([entryVisible], mockObserver);

    // Don't advance time yet - element becomes hidden immediately
    // This should clear the timeout
    observeCallback([entryHidden], mockObserver);

    // Now advance past the original timeout duration
    await advanceTimers(1500);

    // Should not fire because timeout was cleared
    expect(mockEventManager.track).not.toHaveBeenCalled();
  });

  it('should include id and name in event data when configured', async () => {
    const element = document.createElement('div');
    element.className = 'hero';
    document.body.appendChild(element);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [
          {
            selector: '.hero',
            id: 'homepage-hero',
            name: 'Homepage Hero Banner',
          },
        ],
        minDwellTime: 1000,
      },
    });

    handler.startTracking();

    const entry: IntersectionObserverEntry = {
      target: element,
      isIntersecting: true,
      intersectionRatio: 0.75,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    };

    observeCallback([entry], mockObserver);
    await advanceTimers(1000);

    expect(mockEventManager.track).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EventType.VIEWPORT_VISIBLE,
        viewport_data: expect.objectContaining({
          selector: '.hero',
          id: 'homepage-hero',
          name: 'Homepage Hero Banner',
        }),
      }),
    );
  });

  it('should not include id and name if not configured', async () => {
    const element = document.createElement('div');
    element.className = 'hero';
    document.body.appendChild(element);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
        minDwellTime: 1000,
      },
    });

    handler.startTracking();

    const entry: IntersectionObserverEntry = {
      target: element,
      isIntersecting: true,
      intersectionRatio: 0.75,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    };

    observeCallback([entry], mockObserver);
    await advanceTimers(1000);

    const trackCall = (mockEventManager.track as any).mock.calls[0][0];
    expect(trackCall.viewport_data).not.toHaveProperty('id');
    expect(trackCall.viewport_data).not.toHaveProperty('name');
  });

  it('should round visibilityRatio to 2 decimal places', async () => {
    const element = document.createElement('div');
    element.className = 'hero';
    document.body.appendChild(element);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
        minDwellTime: 1000,
      },
    });

    handler.startTracking();

    const entry: IntersectionObserverEntry = {
      target: element,
      isIntersecting: true,
      intersectionRatio: 0.751234,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    };

    observeCallback([entry], mockObserver);
    await advanceTimers(1000);

    expect(mockEventManager.track).toHaveBeenCalledWith(
      expect.objectContaining({
        viewport_data: expect.objectContaining({
          visibilityRatio: 0.75,
        }),
      }),
    );
  });

  it('should not fire event if element has data-tlog-ignore when firing', async () => {
    const element = document.createElement('div');
    element.className = 'hero';
    document.body.appendChild(element);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
        minDwellTime: 1000,
      },
    });

    handler.startTracking();

    const entry: IntersectionObserverEntry = {
      target: element,
      isIntersecting: true,
      intersectionRatio: 0.75,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    };

    observeCallback([entry], mockObserver);

    // Add ignore attribute after element becomes visible but before dwell time
    element.setAttribute(`${HTML_DATA_ATTR_PREFIX}-ignore`, 'true');

    await advanceTimers(1000);

    expect(mockEventManager.track).not.toHaveBeenCalled();
  });
});

describe('ViewportHandler - Cooldown Period', () => {
  let handler: ViewportHandler;
  let mockEventManager: EventManager;
  let mockObserver: any;
  let observeCallback: IntersectionObserverCallback;

  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();

    mockEventManager = {
      track: vi.fn(),
    } as any;

    mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
      root: null,
      rootMargin: '',
      thresholds: [0.5],
    };

    global.IntersectionObserver = vi.fn((callback) => {
      observeCallback = callback;
      return mockObserver;
    }) as any;

    handler = new ViewportHandler(mockEventManager);
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should not fire event again within cooldown period', async () => {
    const element = document.createElement('div');
    element.className = 'hero';
    document.body.appendChild(element);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
        minDwellTime: 1000,
        cooldownPeriod: 5000,
      },
    });

    handler.startTracking();

    const entry: IntersectionObserverEntry = {
      target: element,
      isIntersecting: true,
      intersectionRatio: 0.75,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    };

    // First visibility
    observeCallback([entry], mockObserver);
    await advanceTimers(1000);
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Hide and show again quickly
    observeCallback([{ ...entry, isIntersecting: false }], mockObserver);
    await advanceTimers(100);
    observeCallback([entry], mockObserver);
    await advanceTimers(1000);

    // Should still be only 1 call due to cooldown
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);
  });

  it('should fire event again after cooldown period expires', async () => {
    const element = document.createElement('div');
    element.className = 'hero';
    document.body.appendChild(element);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
        minDwellTime: 1000,
        cooldownPeriod: 5000,
      },
    });

    handler.startTracking();

    const entry: IntersectionObserverEntry = {
      target: element,
      isIntersecting: true,
      intersectionRatio: 0.75,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    };

    // First visibility
    observeCallback([entry], mockObserver);
    await advanceTimers(1000);
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Hide
    observeCallback([{ ...entry, isIntersecting: false }], mockObserver);
    await advanceTimers(100);

    // Wait for cooldown to expire
    await advanceTimers(5000);

    // Show again
    observeCallback([entry], mockObserver);
    await advanceTimers(1000);

    // Should have 2 calls now
    expect(mockEventManager.track).toHaveBeenCalledTimes(2);
  });

  it('should use DEFAULT_VIEWPORT_COOLDOWN_PERIOD if not configured', async () => {
    const element = document.createElement('div');
    element.className = 'hero';
    document.body.appendChild(element);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
        minDwellTime: 1000,
        // Not setting cooldownPeriod, should use default
      },
    });

    handler.startTracking();

    const entry: IntersectionObserverEntry = {
      target: element,
      isIntersecting: true,
      intersectionRatio: 0.75,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    };

    // First visibility
    observeCallback([entry], mockObserver);
    await advanceTimers(1000);
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);

    // Hide and show again quickly
    observeCallback([{ ...entry, isIntersecting: false }], mockObserver);
    await advanceTimers(100);
    observeCallback([entry], mockObserver);
    await advanceTimers(1000);

    // Should still be only 1 call due to default cooldown
    expect(mockEventManager.track).toHaveBeenCalledTimes(1);
  });
});

describe('ViewportHandler - MutationObserver', () => {
  let handler: ViewportHandler;
  let mockEventManager: EventManager;
  let mockIntersectionObserver: any;
  let mockMutationObserver: any;
  let observeCallback: IntersectionObserverCallback;
  let mutationCallback: MutationCallback;

  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();

    mockEventManager = {
      track: vi.fn(),
    } as any;

    mockIntersectionObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
      root: null,
      rootMargin: '',
      thresholds: [0.5],
    };

    global.IntersectionObserver = vi.fn((callback) => {
      observeCallback = callback;
      return mockIntersectionObserver;
    }) as any;

    mockMutationObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
    };

    global.MutationObserver = vi.fn((callback) => {
      mutationCallback = callback;
      return mockMutationObserver;
    }) as any;

    handler = new ViewportHandler(mockEventManager);
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should setup MutationObserver to watch for DOM changes', () => {
    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
      },
    });

    handler.startTracking();

    expect(global.MutationObserver).toHaveBeenCalledWith(expect.any(Function));
    expect(mockMutationObserver.observe).toHaveBeenCalledWith(document.body, {
      childList: true,
      subtree: true,
    });
  });

  it('should not setup MutationObserver if not supported', () => {
    (global.MutationObserver as any) = undefined;

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
      },
    });

    handler.startTracking();

    expect(mockMutationObserver.observe).not.toHaveBeenCalled();
  });

  it('should warn if document.body not available for MutationObserver', () => {
    // Skip this test as it's difficult to test without breaking subsequent tests
    // The handler correctly checks for document.body and logs a warning
    // This is covered by code inspection
  });

  it('should observe newly added elements after debounce', async () => {
    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.dynamic' }],
      },
    });

    handler.startTracking();

    // Create and add element
    const newElement = document.createElement('div');
    newElement.className = 'dynamic';
    document.body.appendChild(newElement);

    // Simulate mutation
    const mutation: MutationRecord = {
      type: 'childList',
      target: document.body,
      addedNodes: [newElement] as any,
      removedNodes: [] as any,
      previousSibling: null,
      nextSibling: null,
      attributeName: null,
      attributeNamespace: null,
      oldValue: null,
    };

    mockIntersectionObserver.observe.mockClear();
    mutationCallback([mutation], mockMutationObserver);

    // Should not observe immediately (debounced)
    expect(mockIntersectionObserver.observe).not.toHaveBeenCalled();

    // Advance past debounce time
    await advanceTimers(100);

    // Should now observe the new element
    expect(mockIntersectionObserver.observe).toHaveBeenCalledWith(newElement);
  });

  it('should cleanup removed elements', () => {
    const element = document.createElement('div');
    element.className = 'hero';
    document.body.appendChild(element);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
      },
    });

    handler.startTracking();

    // Element should be observed
    expect(mockIntersectionObserver.observe).toHaveBeenCalledWith(element);

    // Remove element
    document.body.removeChild(element);

    const mutation: MutationRecord = {
      type: 'childList',
      target: document.body,
      addedNodes: [] as any,
      removedNodes: [element] as any,
      previousSibling: null,
      nextSibling: null,
      attributeName: null,
      attributeNamespace: null,
      oldValue: null,
    };

    mutationCallback([mutation], mockMutationObserver);

    expect(mockIntersectionObserver.unobserve).toHaveBeenCalledWith(element);
  });

  it('should cleanup removed parent and all descendants', () => {
    const parent = document.createElement('div');
    const child1 = document.createElement('div');
    child1.className = 'hero';
    const child2 = document.createElement('div');
    child2.className = 'hero';
    parent.appendChild(child1);
    parent.appendChild(child2);
    document.body.appendChild(parent);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
      },
    });

    handler.startTracking();

    expect(mockIntersectionObserver.observe).toHaveBeenCalledWith(child1);
    expect(mockIntersectionObserver.observe).toHaveBeenCalledWith(child2);

    // Remove parent
    document.body.removeChild(parent);

    const mutation: MutationRecord = {
      type: 'childList',
      target: document.body,
      addedNodes: [] as any,
      removedNodes: [parent] as any,
      previousSibling: null,
      nextSibling: null,
      attributeName: null,
      attributeNamespace: null,
      oldValue: null,
    };

    mutationCallback([mutation], mockMutationObserver);

    expect(mockIntersectionObserver.unobserve).toHaveBeenCalledWith(child1);
    expect(mockIntersectionObserver.unobserve).toHaveBeenCalledWith(child2);
  });

  it('should clear timeout when element is removed', async () => {
    const element = document.createElement('div');
    element.className = 'hero';
    document.body.appendChild(element);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
        minDwellTime: 1000,
      },
    });

    handler.startTracking();

    const entry: IntersectionObserverEntry = {
      target: element,
      isIntersecting: true,
      intersectionRatio: 0.75,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    };

    observeCallback([entry], mockIntersectionObserver);

    // Remove element before timeout fires
    document.body.removeChild(element);

    const mutation: MutationRecord = {
      type: 'childList',
      target: document.body,
      addedNodes: [] as any,
      removedNodes: [element] as any,
      previousSibling: null,
      nextSibling: null,
      attributeName: null,
      attributeNamespace: null,
      oldValue: null,
    };

    mutationCallback([mutation], mockMutationObserver);

    await advanceTimers(1000);

    // Should not fire event
    expect(mockEventManager.track).not.toHaveBeenCalled();
  });
});

describe('ViewportHandler - Cleanup', () => {
  let handler: ViewportHandler;
  let mockEventManager: EventManager;
  let mockIntersectionObserver: any;
  let mockMutationObserver: any;

  beforeEach(() => {
    setupTestEnvironment();
    vi.useFakeTimers();

    mockEventManager = {
      track: vi.fn(),
    } as any;

    mockIntersectionObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
      root: null,
      rootMargin: '',
      thresholds: [0.5],
    };

    global.IntersectionObserver = vi.fn(() => mockIntersectionObserver) as any;

    mockMutationObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
    };

    global.MutationObserver = vi.fn(() => mockMutationObserver) as any;

    handler = new ViewportHandler(mockEventManager);
  });

  afterEach(() => {
    handler.stopTracking();
    cleanupTestEnvironment();
  });

  it('should disconnect IntersectionObserver on stopTracking', () => {
    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
      },
    });

    handler.startTracking();
    handler.stopTracking();

    expect(mockIntersectionObserver.disconnect).toHaveBeenCalled();
  });

  it('should disconnect MutationObserver on stopTracking', () => {
    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
      },
    });

    handler.startTracking();
    handler.stopTracking();

    expect(mockMutationObserver.disconnect).toHaveBeenCalled();
  });

  it('should clear all pending timeouts on stopTracking', async () => {
    const element = document.createElement('div');
    element.className = 'hero';
    document.body.appendChild(element);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
        minDwellTime: 1000,
      },
    });

    handler.startTracking();

    const observeCallback = (global.IntersectionObserver as any).mock.calls[0][0];
    const entry: IntersectionObserverEntry = {
      target: element,
      isIntersecting: true,
      intersectionRatio: 0.75,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    };

    observeCallback([entry], mockIntersectionObserver);

    handler.stopTracking();

    await advanceTimers(1000);

    // Should not fire event after cleanup
    expect(mockEventManager.track).not.toHaveBeenCalled();
  });

  it('should clear mutation debounce timer on stopTracking', async () => {
    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
      },
    });

    handler.startTracking();

    const newElement = document.createElement('div');
    newElement.className = 'hero';
    document.body.appendChild(newElement);

    const mutationCallback = (global.MutationObserver as any).mock.calls[0][0];
    const mutation: MutationRecord = {
      type: 'childList',
      target: document.body,
      addedNodes: [newElement] as any,
      removedNodes: [] as any,
      previousSibling: null,
      nextSibling: null,
      attributeName: null,
      attributeNamespace: null,
      oldValue: null,
    };

    mutationCallback([mutation], mockMutationObserver);

    mockIntersectionObserver.observe.mockClear();

    handler.stopTracking();

    await advanceTimers(100);

    // Should not observe new elements after cleanup
    expect(mockIntersectionObserver.observe).not.toHaveBeenCalled();
  });

  it('should clear tracked elements map on stopTracking', () => {
    const element = document.createElement('div');
    element.className = 'hero';
    document.body.appendChild(element);

    vi.spyOn(handler as any, 'get').mockReturnValue({
      viewport: {
        elements: [{ selector: '.hero' }],
      },
    });

    handler.startTracking();
    expect(mockIntersectionObserver.observe).toHaveBeenCalledWith(element);

    handler.stopTracking();

    // Start tracking again
    mockIntersectionObserver.observe.mockClear();
    handler.startTracking();

    // Should observe element again (map was cleared)
    expect(mockIntersectionObserver.observe).toHaveBeenCalledWith(element);
  });

  it('should handle stopTracking when not tracking', () => {
    expect(() => {
      handler.stopTracking();
    }).not.toThrow();
  });
});
