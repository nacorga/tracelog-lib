import {
  MAX_SCROLL_EVENTS_PER_SESSION,
  MIN_SCROLL_DEPTH_CHANGE,
  SCROLL_DEBOUNCE_TIME_MS,
  SCROLL_MIN_EVENT_INTERVAL_MS,
  SIGNIFICANT_SCROLL_DELTA,
} from '../constants';
import { EventType, ScrollData, ScrollDirection } from '../types';
import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';
import { log } from '../utils';

interface ScrollContainer {
  element: Window | HTMLElement;
  selector: string;
  lastScrollPos: number;
  lastDepth: number;
  lastEventTime: number;
  debounceTimer: number | null;
  listener: EventListener;
}

/**
 * Tracks scroll depth and direction across the window and any detected scrollable containers.
 *
 * **Captured fields**: `depth` (0-100), `direction` (up/down), `container_selector`.
 *
 * **Guardrails**:
 * - Significant movement (minimum 10px position delta)
 * - Depth change (minimum 5% delta between events)
 * - Rate limiting (minimum 500ms interval between events per container)
 * - Session cap (maximum 120 events per session)
 * - Multi-container support with 250ms per-container debouncing
 */
export class ScrollHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly containers: ScrollContainer[] = [];
  private limitWarningLogged = false;
  private containerDiscoveryTimeoutId: number | null = null;

  constructor(eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
  }

  startTracking(): void {
    this.limitWarningLogged = false;
    this.set('scrollEventCount', 0);
    this.tryDetectScrollContainers(0);
  }

  stopTracking(): void {
    if (this.containerDiscoveryTimeoutId !== null) {
      clearTimeout(this.containerDiscoveryTimeoutId);
      this.containerDiscoveryTimeoutId = null;
    }

    for (const container of this.containers) {
      this.clearContainerTimer(container);

      if (container.element === window) {
        window.removeEventListener('scroll', container.listener);
      } else {
        (container.element as HTMLElement).removeEventListener('scroll', container.listener);
      }
    }

    this.containers.length = 0;
    this.set('scrollEventCount', 0);
    this.limitWarningLogged = false;
  }

  private tryDetectScrollContainers(attempt: number): void {
    const elements = this.findScrollableElements();

    if (this.isWindowScrollable()) {
      this.setupScrollContainer(window, 'window');
    }

    if (elements.length > 0) {
      for (const element of elements) {
        const selector = this.getElementSelector(element);
        this.setupScrollContainer(element, selector);
      }
      return;
    }

    if (attempt < 5) {
      this.containerDiscoveryTimeoutId = window.setTimeout(() => {
        this.containerDiscoveryTimeoutId = null;
        this.tryDetectScrollContainers(attempt + 1);
      }, 200);

      return;
    }

    if (this.containers.length === 0) {
      this.setupScrollContainer(window, 'window');
    }
  }

  private findScrollableElements(): HTMLElement[] {
    if (!document.body) {
      return [];
    }

    const elements: HTMLElement[] = [];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        const element = node as HTMLElement;

        if (!element.isConnected || !element.offsetParent) {
          return NodeFilter.FILTER_SKIP;
        }

        const style = getComputedStyle(element);

        const hasVerticalScrollableStyle =
          style.overflowY === 'auto' ||
          style.overflowY === 'scroll' ||
          style.overflow === 'auto' ||
          style.overflow === 'scroll';

        return hasVerticalScrollableStyle ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });

    let node: Node | null;

    while ((node = walker.nextNode()) && elements.length < 10) {
      const element = node as HTMLElement;

      if (this.isElementScrollable(element)) {
        elements.push(element);
      }
    }

    return elements;
  }

  private getElementSelector(element: Window | HTMLElement): string {
    if (element === window) {
      return 'window';
    }

    const htmlElement = element as HTMLElement;

    if (htmlElement.id) {
      return `#${htmlElement.id}`;
    }

    if (htmlElement.className && typeof htmlElement.className === 'string') {
      const firstClass = htmlElement.className.split(' ').filter((c) => c.trim())[0];

      if (firstClass) {
        return `.${firstClass}`;
      }
    }

    return htmlElement.tagName.toLowerCase();
  }

  private setupScrollContainer(element: Window | HTMLElement, selector: string): void {
    const alreadyTracking = this.containers.some((c) => c.element === element);

    if (alreadyTracking) {
      return;
    }

    if (element !== window && !this.isElementScrollable(element as HTMLElement)) {
      return;
    }

    const initialScrollTop = this.getScrollTop(element);

    const initialDepth = this.calculateScrollDepth(
      initialScrollTop,
      this.getScrollHeight(element),
      this.getViewportHeight(element),
    );

    const container: ScrollContainer = {
      element,
      selector,
      lastScrollPos: initialScrollTop,
      lastDepth: initialDepth,
      lastEventTime: 0,
      debounceTimer: null,
      listener: null as unknown as EventListener,
    };

    const handleScroll = (): void => {
      if (this.get('suppressNextScroll')) {
        return;
      }

      this.clearContainerTimer(container);

      container.debounceTimer = window.setTimeout(() => {
        const scrollData = this.calculateScrollData(container);

        if (scrollData) {
          this.processScrollEvent(container, scrollData, Date.now());
        }

        container.debounceTimer = null;
      }, SCROLL_DEBOUNCE_TIME_MS);
    };

    container.listener = handleScroll;
    this.containers.push(container);

    if (element === window) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      (element as HTMLElement).addEventListener('scroll', handleScroll, { passive: true });
    }
  }

  private processScrollEvent(
    container: ScrollContainer,
    scrollData: Omit<ScrollData, 'container_selector'>,
    timestamp: number,
  ): void {
    if (!this.shouldEmitScrollEvent(container, scrollData, timestamp)) {
      return;
    }

    container.lastEventTime = timestamp;
    container.lastDepth = scrollData.depth;

    const currentCount = this.get('scrollEventCount') ?? 0;
    this.set('scrollEventCount', currentCount + 1);

    this.eventManager.track({
      type: EventType.SCROLL,
      scroll_data: {
        ...scrollData,
        container_selector: container.selector,
      },
    });
  }

  private shouldEmitScrollEvent(
    container: ScrollContainer,
    scrollData: Omit<ScrollData, 'container_selector'>,
    timestamp: number,
  ): boolean {
    if (this.hasReachedSessionLimit()) {
      this.logLimitOnce();
      return false;
    }

    if (!this.hasElapsedMinimumInterval(container, timestamp)) {
      return false;
    }

    if (!this.hasSignificantDepthChange(container, scrollData.depth)) {
      return false;
    }

    return true;
  }

  private hasReachedSessionLimit(): boolean {
    const currentCount = this.get('scrollEventCount') ?? 0;
    return currentCount >= MAX_SCROLL_EVENTS_PER_SESSION;
  }

  private hasElapsedMinimumInterval(container: ScrollContainer, timestamp: number): boolean {
    if (container.lastEventTime === 0) {
      return true;
    }
    return timestamp - container.lastEventTime >= SCROLL_MIN_EVENT_INTERVAL_MS;
  }

  private hasSignificantDepthChange(container: ScrollContainer, newDepth: number): boolean {
    return Math.abs(newDepth - container.lastDepth) >= MIN_SCROLL_DEPTH_CHANGE;
  }

  private logLimitOnce(): void {
    if (this.limitWarningLogged) {
      return;
    }

    this.limitWarningLogged = true;

    log('debug', 'Max scroll events per session reached', {
      data: { limit: MAX_SCROLL_EVENTS_PER_SESSION },
    });
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

  private calculateScrollData(container: ScrollContainer): Omit<ScrollData, 'container_selector'> | null {
    const { element, lastScrollPos } = container;
    const scrollTop = this.getScrollTop(element);

    const positionDelta = Math.abs(scrollTop - lastScrollPos);
    if (positionDelta < SIGNIFICANT_SCROLL_DELTA) {
      return null;
    }

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
    return element === window ? window.scrollY : (element as HTMLElement).scrollTop;
  }

  private getViewportHeight(element: Window | HTMLElement): number {
    return element === window ? window.innerHeight : (element as HTMLElement).clientHeight;
  }

  private getScrollHeight(element: Window | HTMLElement): number {
    return element === window ? document.documentElement.scrollHeight : (element as HTMLElement).scrollHeight;
  }

  private isElementScrollable(element: HTMLElement): boolean {
    const style = getComputedStyle(element);

    const hasVerticalScrollableOverflow =
      style.overflowY === 'auto' ||
      style.overflowY === 'scroll' ||
      style.overflow === 'auto' ||
      style.overflow === 'scroll';

    const hasVerticalOverflowContent = element.scrollHeight > element.clientHeight;

    return hasVerticalScrollableOverflow && hasVerticalOverflowContent;
  }
}
