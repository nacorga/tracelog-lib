import { HTML_DATA_ATTR_PREFIX } from '../constants';
import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { EventType } from '../types';
import { ViewportConfig, ViewportEventData } from '../types/viewport.types';
import { log } from '../utils';

interface TrackedElement {
  element: Element;
  selector: string;
  startTime: number | null;
  timeoutId: number | null;
}

/**
 * Handles viewport visibility tracking using IntersectionObserver API.
 * Fires events when elements become visible for a minimum dwell time.
 */
export class ViewportHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly trackedElements = new Map<Element, TrackedElement>();
  private observer: IntersectionObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private mutationDebounceTimer: number | null = null;
  private config: ViewportConfig | null = null;

  constructor(eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
  }

  /**
   * Starts tracking viewport visibility for configured selectors
   */
  startTracking(): void {
    // Get viewport config from state
    const config = this.get('config');
    this.config = config.viewport ?? null;

    if (!this.config?.selectors || this.config.selectors.length === 0) {
      return;
    }

    // Set defaults
    const threshold = this.config.threshold ?? 0.5;
    const minDwellTime = this.config.minDwellTime ?? 1000;

    if (threshold < 0 || threshold > 1) {
      log('warn', 'ViewportHandler: Invalid threshold, must be between 0 and 1');
      return;
    }

    if (minDwellTime < 0) {
      log('warn', 'ViewportHandler: Invalid minDwellTime, must be non-negative');
      return;
    }

    // Check IntersectionObserver support
    if (typeof IntersectionObserver === 'undefined') {
      log('warn', 'ViewportHandler: IntersectionObserver not supported in this browser');
      return;
    }

    // Create observer
    this.observer = new IntersectionObserver(this.handleIntersection, {
      threshold,
    });

    // Find and observe all matching elements
    this.observeElements();

    // Set up MutationObserver to detect dynamically added elements
    this.setupMutationObserver();
  }

  /**
   * Stops tracking and cleans up resources
   */
  stopTracking(): void {
    // Disconnect observers
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    // Clear debounce timer
    if (this.mutationDebounceTimer !== null) {
      window.clearTimeout(this.mutationDebounceTimer);
      this.mutationDebounceTimer = null;
    }

    // Clear all timers and tracked elements
    for (const tracked of this.trackedElements.values()) {
      if (tracked.timeoutId !== null) {
        window.clearTimeout(tracked.timeoutId);
      }
    }

    this.trackedElements.clear();
  }

  /**
   * Query and observe all elements matching configured selectors
   */
  private observeElements(): void {
    if (!this.config || !this.observer) return;

    for (const selector of this.config.selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          // Skip if element has data-tlog-ignore attribute
          if (element.hasAttribute(`${HTML_DATA_ATTR_PREFIX}-ignore`)) {
            return;
          }

          // Skip if already tracked
          if (this.trackedElements.has(element)) {
            return;
          }

          // Track and observe element
          this.trackedElements.set(element, {
            element,
            selector,
            startTime: null,
            timeoutId: null,
          });

          this.observer?.observe(element);
        });
      } catch (error) {
        log('warn', `ViewportHandler: Invalid selector "${selector}"`, { error });
      }
    }
  }

  /**
   * Handles intersection events from IntersectionObserver
   */
  private readonly handleIntersection = (entries: IntersectionObserverEntry[]): void => {
    if (!this.config) return;

    const minDwellTime = this.config.minDwellTime ?? 1000;

    for (const entry of entries) {
      const tracked = this.trackedElements.get(entry.target);
      if (!tracked) continue;

      if (entry.isIntersecting) {
        // Element became visible
        if (tracked.startTime === null) {
          tracked.startTime = performance.now();

          // Set timer to fire event after minDwellTime
          tracked.timeoutId = window.setTimeout(() => {
            this.fireViewportEvent(tracked, entry.intersectionRatio);
          }, minDwellTime);
        }
      } else {
        // Element became hidden
        if (tracked.startTime !== null) {
          // Clear timer if element hidden before minDwellTime elapsed
          if (tracked.timeoutId !== null) {
            window.clearTimeout(tracked.timeoutId);
            tracked.timeoutId = null;
          }
          tracked.startTime = null;
        }
      }
    }
  };

  /**
   * Fires a viewport visible event
   */
  private fireViewportEvent(tracked: TrackedElement, visibilityRatio: number): void {
    if (tracked.startTime === null) return;

    const dwellTime = Math.round(performance.now() - tracked.startTime);

    // Check data-tlog-ignore again (element might have changed)
    if (tracked.element.hasAttribute('data-tlog-ignore')) {
      return;
    }

    const eventData: ViewportEventData = {
      selector: tracked.selector,
      dwellTime,
      visibilityRatio,
    };

    this.eventManager.track({
      type: EventType.VIEWPORT_VISIBLE,
      viewport_data: eventData,
    });

    // Reset tracking state after firing event
    // This allows the element to trigger again if it leaves and re-enters viewport
    tracked.startTime = null;
    tracked.timeoutId = null;
  }

  /**
   * Sets up MutationObserver to detect dynamically added elements
   */
  private setupMutationObserver(): void {
    if (!this.config || typeof MutationObserver === 'undefined') {
      return;
    }

    // Check if document.body exists
    if (!document.body) {
      log('warn', 'ViewportHandler: document.body not available, skipping MutationObserver setup');
      return;
    }

    this.mutationObserver = new MutationObserver((mutations) => {
      let hasAddedNodes = false;

      // Check what changed
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          if (mutation.addedNodes.length > 0) {
            hasAddedNodes = true;
          }
          if (mutation.removedNodes.length > 0) {
            // Clean up removed nodes immediately
            this.cleanupRemovedNodes(mutation.removedNodes);
          }
        }
      }

      // Debounce re-observing for added nodes (batch multiple mutations)
      if (hasAddedNodes) {
        if (this.mutationDebounceTimer !== null) {
          window.clearTimeout(this.mutationDebounceTimer);
        }
        this.mutationDebounceTimer = window.setTimeout(() => {
          this.observeElements();
          this.mutationDebounceTimer = null;
        }, 100); // 100ms debounce
      }
    });

    // Observe the entire document for added/removed nodes
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Cleans up tracking for removed DOM nodes
   */
  private cleanupRemovedNodes(removedNodes: NodeList): void {
    removedNodes.forEach((node) => {
      if (node.nodeType !== 1) return; // 1 = ELEMENT_NODE

      const element = node as Element;
      const tracked = this.trackedElements.get(element);

      if (tracked) {
        // Clear pending timer
        if (tracked.timeoutId !== null) {
          window.clearTimeout(tracked.timeoutId);
        }

        // Unobserve and remove from tracking
        this.observer?.unobserve(element);
        this.trackedElements.delete(element);
      }

      // Also check descendants
      const descendants = Array.from(this.trackedElements.keys()).filter((el) => element.contains(el));
      descendants.forEach((el) => {
        const descendantTracked = this.trackedElements.get(el);
        if (descendantTracked && descendantTracked.timeoutId !== null) {
          window.clearTimeout(descendantTracked.timeoutId);
        }
        this.observer?.unobserve(el);
        this.trackedElements.delete(el);
      });
    });
  }
}
