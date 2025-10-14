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
  isPrimary: boolean;
  lastScrollPos: number;
  lastDepth: number;
  lastDirection: ScrollDirection;
  lastEventTime: number;
  maxDepthReached: number;
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
  private retryTimeoutId: number | null = null;

  constructor(eventManager: EventManager) {
    super();

    this.eventManager = eventManager;
  }

  startTracking(): void {
    this.limitWarningLogged = false;
    this.applyConfigOverrides();
    this.set('scrollEventCount', 0);
    this.tryDetectScrollContainers(0);
  }

  stopTracking(): void {
    if (this.retryTimeoutId !== null) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
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

      this.applyPrimaryScrollSelectorIfConfigured();

      return;
    }

    if (attempt < 5) {
      this.retryTimeoutId = window.setTimeout(() => {
        this.retryTimeoutId = null;
        this.tryDetectScrollContainers(attempt + 1);
      }, 200);

      return;
    }

    if (this.containers.length === 0) {
      this.setupScrollContainer(window, 'window');
    }

    this.applyPrimaryScrollSelectorIfConfigured();
  }

  private applyPrimaryScrollSelectorIfConfigured(): void {
    const config = this.get('config');

    if (config?.primaryScrollSelector) {
      this.applyPrimaryScrollSelector(config.primaryScrollSelector);
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

  private determineIfPrimary(element: Window | HTMLElement): boolean {
    // Window scrollable → window is primary
    if (this.isWindowScrollable()) {
      return element === window;
    }

    // Window not scrollable → first detected container is primary
    return this.containers.length === 0;
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

    const isPrimary = this.determineIfPrimary(element);

    const container: ScrollContainer = {
      element,
      selector,
      isPrimary,
      lastScrollPos: initialScrollTop,
      lastDepth: initialDepth,
      lastDirection: ScrollDirection.DOWN,
      lastEventTime: 0,
      maxDepthReached: initialDepth,
      debounceTimer: null,
      listener: null as any, // Will be assigned after handleScroll is defined
    };

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

    // Assign the listener to the container
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
    scrollData: Omit<ScrollData, 'container_selector' | 'is_primary'>,
    timestamp: number,
  ): void {
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
      scroll_data: {
        ...scrollData,
        container_selector: container.selector,
        is_primary: container.isPrimary,
      },
    });
  }

  private shouldEmitScrollEvent(
    container: ScrollContainer,
    scrollData: Omit<ScrollData, 'container_selector' | 'is_primary'>,
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

    log('warn', 'Max scroll events per session reached', {
      data: { limit: this.maxEventsPerSession },
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

  private calculateScrollData(
    container: ScrollContainer,
  ): Omit<ScrollData, 'container_selector' | 'is_primary'> | null {
    const { element, lastScrollPos, lastEventTime } = container;
    const scrollTop = this.getScrollTop(element);
    const now = Date.now();

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

    const timeDelta = lastEventTime > 0 ? now - lastEventTime : 0;
    const velocity = timeDelta > 0 ? Math.round((positionDelta / timeDelta) * 1000) : 0;

    if (depth > container.maxDepthReached) {
      container.maxDepthReached = depth;
    }

    container.lastScrollPos = scrollTop;

    return {
      depth,
      direction,
      velocity,
      max_depth_reached: container.maxDepthReached,
    };
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

  private applyPrimaryScrollSelector(selector: string): void {
    let targetElement: Window | HTMLElement;

    if (selector === 'window') {
      targetElement = window;
    } else {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) {
        log('warn', `Selector "${selector}" did not match an HTMLElement`);
        return;
      }
      targetElement = element;
    }

    this.containers.forEach((container) => {
      this.updateContainerPrimary(container, container.element === targetElement);
    });

    const targetAlreadyTracked = this.containers.some((c) => c.element === targetElement);
    if (!targetAlreadyTracked && targetElement instanceof HTMLElement) {
      if (this.isElementScrollable(targetElement)) {
        this.setupScrollContainer(targetElement, selector);
      }
    }
  }

  private updateContainerPrimary(container: ScrollContainer, isPrimary: boolean): void {
    container.isPrimary = isPrimary;
  }
}
