import { MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS, SCROLL_DEBOUNCE_TIME_MS, SIGNIFICANT_SCROLL_DELTA } from '../constants';
import { EventType, ScrollData, ScrollDirection } from '../types';
import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { debugLog } from '../utils/logging';

interface ScrollContainer {
  element: Window | HTMLElement;
  lastScrollPos: number;
  debounceTimer: number | null;
  listener: EventListener;
}

interface PendingSelector {
  selector: string;
  retryCount: number;
}

export class ScrollHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly containers: ScrollContainer[] = [];
  private readonly pendingSelectors: PendingSelector[] = [];

  private mutationObserver: MutationObserver | null = null;
  private windowFallbackNeeded = false;

  constructor(eventManager: EventManager) {
    super();

    this.eventManager = eventManager;
  }

  startTracking(): void {
    const raw = this.get('config').scrollContainerSelectors;
    const selectors = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];

    debugLog.debug('ScrollHandler', 'Starting scroll tracking', { selectorsCount: selectors.length });

    // No custom selectors: track window immediately
    if (selectors.length === 0) {
      this.setupScrollContainer(window);
      return;
    }

    const foundElements: Array<Window | HTMLElement> = [];
    const notFoundSelectors: string[] = [];

    for (const selector of selectors) {
      const element = this.safeQuerySelector(selector);

      if (element instanceof HTMLElement) {
        foundElements.push(element);
      } else if (element === null) {
        notFoundSelectors.push(selector);
      }
    }

    // Setup found elements
    for (const element of foundElements) {
      this.setupScrollContainer(element);
    }

    // If we have pending selectors, set up retry logic
    if (notFoundSelectors.length > 0) {
      this.windowFallbackNeeded = true;
      this.setupPendingSelectors(notFoundSelectors);
    } else if (this.containers.length === 0) {
      // No elements found and none pending: use window fallback immediately
      this.setupScrollContainer(window);
    }
  }

  stopTracking(): void {
    debugLog.debug('ScrollHandler', 'Stopping scroll tracking', { containersCount: this.containers.length });

    for (const container of this.containers) {
      if (container.debounceTimer) {
        clearTimeout(container.debounceTimer);
      }

      if (container.element instanceof Window) {
        window.removeEventListener('scroll', container.listener);
      } else {
        container.element.removeEventListener('scroll', container.listener);
      }
    }

    this.containers.length = 0;

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    this.pendingSelectors.length = 0;
  }

  private setupScrollContainer(element: Window | HTMLElement): void {
    // Skip if already tracking this element
    if (this.containers.some((c) => c.element === element)) {
      return;
    }

    const container: ScrollContainer = {
      element,
      lastScrollPos: this.getScrollTop(element),
      debounceTimer: null,
      listener: () => {},
    };

    const handleScroll = (): void => {
      if (this.get('suppressNextScroll')) {
        this.set('suppressNextScroll', false);
        return;
      }

      if (container.debounceTimer) {
        clearTimeout(container.debounceTimer);
      }

      container.debounceTimer = window.setTimeout(() => {
        const scrollData = this.calculateScrollData(container);

        if (scrollData) {
          this.eventManager.track({
            type: EventType.SCROLL,
            scroll_data: scrollData,
          });
        }

        container.debounceTimer = null;
      }, SCROLL_DEBOUNCE_TIME_MS);
    };

    container.listener = handleScroll;
    this.containers.push(container);

    if (element instanceof Window) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      element.addEventListener('scroll', handleScroll, { passive: true });
    }
  }

  private calculateScrollData(container: ScrollContainer): ScrollData | null {
    const { element, lastScrollPos } = container;
    const scrollTop = this.getScrollTop(element);
    const viewportHeight = this.getViewportHeight(element);
    const scrollHeight = this.getScrollHeight(element);
    const viewportWidth = this.getViewportWidth(element);
    const scrollWidth = this.getScrollWidth(element);

    // Dynamic validation: check if element is scrollable at runtime
    if (element instanceof HTMLElement) {
      // Check if element has scrollable overflow style (can change dynamically)
      if (!this.hasScrollableOverflow(element)) {
        return null;
      }

      // Check if content exceeds viewport (vertical OR horizontal)
      const hasVerticalScroll = scrollHeight > viewportHeight;
      const hasHorizontalScroll = scrollWidth > viewportWidth;

      if (!hasVerticalScroll && !hasHorizontalScroll) {
        return null;
      }
    }

    // For Window: check if content is scrollable (vertical or horizontal)
    if (element instanceof Window) {
      const hasVerticalScroll = scrollHeight > viewportHeight;
      const hasHorizontalScroll = scrollWidth > viewportWidth;

      if (!hasVerticalScroll && !hasHorizontalScroll) {
        return null;
      }
    }

    const direction = scrollTop > lastScrollPos ? ScrollDirection.DOWN : ScrollDirection.UP;
    const depth =
      scrollHeight > viewportHeight
        ? Math.min(100, Math.max(0, Math.floor((scrollTop / (scrollHeight - viewportHeight)) * 100)))
        : 0;

    // Only update if scroll position changed significantly
    const positionDelta = Math.abs(scrollTop - lastScrollPos);
    if (positionDelta < SIGNIFICANT_SCROLL_DELTA) {
      return null;
    }

    container.lastScrollPos = scrollTop;

    return { depth, direction };
  }

  private getScrollTop(element: Window | HTMLElement): number {
    return element instanceof Window ? window.scrollY : element.scrollTop;
  }

  private getViewportHeight(element: Window | HTMLElement): number {
    return element instanceof Window ? window.innerHeight : element.clientHeight;
  }

  private getScrollHeight(element: Window | HTMLElement): number {
    return element instanceof Window ? document.documentElement.scrollHeight : element.scrollHeight;
  }

  private getViewportWidth(element: Window | HTMLElement): number {
    return element instanceof Window ? window.innerWidth : element.clientWidth;
  }

  private getScrollWidth(element: Window | HTMLElement): number {
    return element instanceof Window ? document.documentElement.scrollWidth : element.scrollWidth;
  }

  private hasScrollableOverflow(element: HTMLElement): boolean {
    const style = getComputedStyle(element);
    return (
      style.overflowY === 'auto' ||
      style.overflowY === 'scroll' ||
      style.overflowX === 'auto' ||
      style.overflowX === 'scroll' ||
      style.overflow === 'auto' ||
      style.overflow === 'scroll'
    );
  }

  private safeQuerySelector(selector: string): HTMLElement | null {
    try {
      return document.querySelector(selector);
    } catch (error) {
      // Invalid CSS selector - log warning and continue
      debugLog.clientWarn('ScrollHandler', 'Invalid CSS selector', {
        selector,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  private setupPendingSelectors(selectors: string[]): void {
    debugLog.debug('ScrollHandler', 'Setting up pending selectors with retry logic', {
      selectors,
      maxRetries: MAX_RETRY_ATTEMPTS,
    });

    for (const selector of selectors) {
      this.pendingSelectors.push({ selector, retryCount: 0 });
    }

    this.startMutationObserver();
    this.retryPendingSelectors();
  }

  private startMutationObserver(): void {
    if (this.mutationObserver) return;

    this.mutationObserver = new MutationObserver(() => {
      this.checkPendingSelectors();
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    debugLog.debug('ScrollHandler', 'MutationObserver started for pending selectors');
  }

  private checkPendingSelectors(): void {
    const remaining: PendingSelector[] = [];

    for (const pending of this.pendingSelectors) {
      const element = this.safeQuerySelector(pending.selector);

      if (element instanceof HTMLElement) {
        debugLog.debug('ScrollHandler', 'Found pending selector', { selector: pending.selector });
        this.setupScrollContainer(element);
      } else {
        remaining.push(pending);
      }
    }

    this.pendingSelectors.length = 0;
    this.pendingSelectors.push(...remaining);

    if (this.pendingSelectors.length === 0 && this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;

      debugLog.debug('ScrollHandler', 'All pending selectors resolved, MutationObserver stopped');
    }
  }

  private retryPendingSelectors(): void {
    setTimeout(() => {
      if (this.pendingSelectors.length === 0) return;

      const remaining: PendingSelector[] = [];

      for (const pending of this.pendingSelectors) {
        pending.retryCount++;

        const element = this.safeQuerySelector(pending.selector);

        if (element instanceof HTMLElement) {
          debugLog.debug('ScrollHandler', 'Retry found pending selector', {
            selector: pending.selector,
            retryCount: pending.retryCount,
          });

          this.setupScrollContainer(element);
        } else if (pending.retryCount < MAX_RETRY_ATTEMPTS) {
          remaining.push(pending);
        } else {
          debugLog.clientWarn('ScrollHandler', 'Selector not found after max retries', {
            selector: pending.selector,
            maxRetries: MAX_RETRY_ATTEMPTS,
          });
        }
      }

      this.pendingSelectors.length = 0;
      this.pendingSelectors.push(...remaining);

      if (this.pendingSelectors.length > 0) {
        this.retryPendingSelectors();
      } else {
        // All retries complete
        if (this.mutationObserver) {
          this.mutationObserver.disconnect();
          this.mutationObserver = null;
        }

        // Apply window fallback if needed and no containers were set up
        if (this.windowFallbackNeeded && this.containers.length === 0) {
          debugLog.debug('ScrollHandler', 'No scroll containers found, using window fallback');
          this.setupScrollContainer(window);
        }

        debugLog.debug('ScrollHandler', 'All pending selectors resolved or timed out', {
          containersCount: this.containers.length,
        });
      }
    }, RETRY_DELAY_MS);
  }
}
