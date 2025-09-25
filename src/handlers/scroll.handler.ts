import { SCROLL_DEBOUNCE_TIME_MS, SIGNIFICANT_SCROLL_DELTA } from '../constants';
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

export class ScrollHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly containers: ScrollContainer[] = [];

  constructor(eventManager: EventManager) {
    super();

    this.eventManager = eventManager;
  }

  startTracking(): void {
    const raw = this.get('config').scrollContainerSelectors;
    const selectors = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];

    debugLog.debug('ScrollHandler', 'Starting scroll tracking', { selectorsCount: selectors.length });

    const elements: Array<Window | HTMLElement> = selectors
      .map((sel) => this.safeQuerySelector(sel))
      .filter((element): element is HTMLElement => element instanceof HTMLElement);

    if (elements.length === 0) {
      elements.push(window);
    }

    for (const element of elements) {
      this.setupScrollContainer(element);
    }
  }

  stopTracking(): void {
    debugLog.debug('ScrollHandler', 'Stopping scroll tracking', { containersCount: this.containers.length });

    for (const container of this.containers) {
      this.clearContainerTimer(container);

      if (container.element instanceof Window) {
        window.removeEventListener('scroll', container.listener);
      } else {
        container.element.removeEventListener('scroll', container.listener);
      }
    }

    this.containers.length = 0;
  }

  private setupScrollContainer(element: Window | HTMLElement): void {
    const elementType = element === window ? 'window' : (element as HTMLElement).tagName?.toLowerCase();

    // Skip setup for non-scrollable elements
    if (element !== window && !this.isElementScrollable(element as HTMLElement)) {
      debugLog.debug('ScrollHandler', 'Skipping non-scrollable element', { elementType });
      return;
    }

    debugLog.debug('ScrollHandler', 'Setting up scroll container', { elementType });

    const handleScroll = (): void => {
      if (this.get('suppressNextScroll')) {
        this.set('suppressNextScroll', false);
        return;
      }

      this.clearContainerTimer(container);

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

    const container: ScrollContainer = {
      element,
      lastScrollPos: this.getScrollTop(element),
      debounceTimer: null,
      listener: handleScroll,
    };

    this.containers.push(container);

    if (element instanceof Window) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      element.addEventListener('scroll', handleScroll, { passive: true });
    }
  }

  private isWindowScrollable(): boolean {
    return document.documentElement.scrollHeight > window.innerHeight;
  }

  private clearContainerTimer(container: ScrollContainer): void {
    if (container.debounceTimer !== null) {
      clearTimeout(container.debounceTimer);
      container.debounceTimer = null;
    }
  }

  private getScrollDirection(current: number, previous: number): ScrollDirection {
    return current > previous ? ScrollDirection.DOWN : ScrollDirection.UP;
  }

  private calculateScrollDepth(scrollTop: number, scrollHeight: number, viewportHeight: number): number {
    if (scrollHeight <= viewportHeight) {
      return 0;
    }

    const maxScrollTop = scrollHeight - viewportHeight;
    return Math.min(100, Math.max(0, Math.floor((scrollTop / maxScrollTop) * 100)));
  }

  private calculateScrollData(container: ScrollContainer): ScrollData | null {
    const { element, lastScrollPos } = container;
    const scrollTop = this.getScrollTop(element);

    // Early return: check significant movement first (cheapest check)
    const positionDelta = Math.abs(scrollTop - lastScrollPos);
    if (positionDelta < SIGNIFICANT_SCROLL_DELTA) {
      return null;
    }

    // Early return: check if window is scrollable
    if (element === window && !this.isWindowScrollable()) {
      return null;
    }

    const viewportHeight = this.getViewportHeight(element);
    const scrollHeight = this.getScrollHeight(element);
    const direction = this.getScrollDirection(scrollTop, lastScrollPos);
    const depth = this.calculateScrollDepth(scrollTop, scrollHeight, viewportHeight);

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

  private isElementScrollable(element: HTMLElement): boolean {
    const style = getComputedStyle(element);
    const hasScrollableOverflow =
      style.overflowY === 'auto' ||
      style.overflowY === 'scroll' ||
      style.overflowX === 'auto' ||
      style.overflowX === 'scroll' ||
      style.overflow === 'auto' ||
      style.overflow === 'scroll';

    // Element must have scrollable overflow AND content that exceeds the container
    const hasOverflowContent = element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;

    return hasScrollableOverflow && hasOverflowContent;
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
}
