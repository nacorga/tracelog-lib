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
import { debugLog } from '../utils/logging';

interface ScrollContainer {
  element: Window | HTMLElement;
  lastScrollPos: number;
  lastDepth: number;
  lastDirection: ScrollDirection;
  lastEventTime: number;
  debounceTimer: number | null;
  listener: EventListener;
}

export class ScrollHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly containers: ScrollContainer[] = [];
  private limitWarningLogged = false;
  private minDepthChange = MIN_SCROLL_DEPTH_CHANGE;
  private minIntervalMs = SCROLL_MIN_EVENT_INTERVAL_MS;
  private maxEventsPerSession = MAX_SCROLL_EVENTS_PER_SESSION;

  constructor(eventManager: EventManager) {
    super();

    this.eventManager = eventManager;
  }

  startTracking(): void {
    this.limitWarningLogged = false;
    this.applyConfigOverrides();
    this.set('scrollEventCount', 0);

    const raw = this.get('config').scrollContainerSelectors;
    const selectors = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];

    if (selectors.length === 0) {
      this.setupScrollContainer(window);
    } else {
      this.trySetupContainers(selectors, 0);
    }
  }

  stopTracking(): void {
    for (const container of this.containers) {
      this.clearContainerTimer(container);

      if (container.element instanceof Window) {
        window.removeEventListener('scroll', container.listener);
      } else {
        container.element.removeEventListener('scroll', container.listener);
      }
    }

    this.containers.length = 0;
    this.set('scrollEventCount', 0);
    this.limitWarningLogged = false;
  }

  private trySetupContainers(selectors: string[], attempt: number): void {
    const elements: HTMLElement[] = selectors
      .map((sel) => this.safeQuerySelector(sel))
      .filter((element): element is HTMLElement => element instanceof HTMLElement);

    if (elements.length > 0) {
      for (const element of elements) {
        const isAlreadyTracking = this.containers.some((c) => c.element === element);

        if (!isAlreadyTracking) {
          this.setupScrollContainer(element);
        }
      }

      return;
    }

    if (attempt < 5) {
      setTimeout(() => this.trySetupContainers(selectors, attempt + 1), 200);
      return;
    }

    if (this.containers.length === 0) {
      this.setupScrollContainer(window);
    }
  }

  private setupScrollContainer(element: Window | HTMLElement): void {
    if (element !== window && !this.isElementScrollable(element as HTMLElement)) {
      return;
    }

    const handleScroll = (): void => {
      if (this.get('suppressNextScroll')) {
        return;
      }

      this.clearContainerTimer(container);

      container.debounceTimer = window.setTimeout(() => {
        const scrollData = this.calculateScrollData(container);

        if (scrollData) {
          const now = Date.now();

          this.processScrollEvent(container, scrollData, now);
        }

        container.debounceTimer = null;
      }, SCROLL_DEBOUNCE_TIME_MS);
    };

    const initialScrollTop = this.getScrollTop(element);
    const container: ScrollContainer = {
      element,
      lastScrollPos: initialScrollTop,
      lastDepth: this.calculateScrollDepth(
        initialScrollTop,
        this.getScrollHeight(element),
        this.getViewportHeight(element),
      ),
      lastDirection: ScrollDirection.DOWN,
      lastEventTime: 0,
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

  private processScrollEvent(container: ScrollContainer, scrollData: ScrollData, timestamp: number): void {
    if (!this.shouldEmitScrollEvent(container, scrollData, timestamp)) {
      return;
    }

    container.lastEventTime = timestamp;
    container.lastDepth = scrollData.depth;
    container.lastDirection = scrollData.direction;

    const currentCount = this.get('scrollEventCount') ?? 0;
    this.set('scrollEventCount', currentCount + 1);

    this.eventManager.track({
      type: EventType.SCROLL,
      scroll_data: scrollData,
    });
  }

  private shouldEmitScrollEvent(container: ScrollContainer, scrollData: ScrollData, timestamp: number): boolean {
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
    return currentCount >= this.maxEventsPerSession;
  }

  private hasElapsedMinimumInterval(container: ScrollContainer, timestamp: number): boolean {
    if (container.lastEventTime === 0) {
      return true;
    }
    return timestamp - container.lastEventTime >= this.minIntervalMs;
  }

  private hasSignificantDepthChange(container: ScrollContainer, newDepth: number): boolean {
    return Math.abs(newDepth - container.lastDepth) >= this.minDepthChange;
  }

  private logLimitOnce(): void {
    if (this.limitWarningLogged) {
      return;
    }

    this.limitWarningLogged = true;
    debugLog.warn('ScrollHandler', 'Max scroll events per session reached', {
      limit: this.maxEventsPerSession,
    });
  }

  private applyConfigOverrides(): void {
    this.minDepthChange = MIN_SCROLL_DEPTH_CHANGE;
    this.minIntervalMs = SCROLL_MIN_EVENT_INTERVAL_MS;
    this.maxEventsPerSession = MAX_SCROLL_EVENTS_PER_SESSION;
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

    const hasOverflowContent = element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;

    return hasScrollableOverflow && hasOverflowContent;
  }

  private safeQuerySelector(selector: string): HTMLElement | null {
    try {
      return document.querySelector(selector);
    } catch (error) {
      debugLog.clientWarn('ScrollHandler', 'Invalid CSS selector', {
        selector,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }
}
