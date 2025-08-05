import { SCROLL_DEBOUNCE_TIME_MS, SIGNIFICANT_SCROLL_DELTA } from '../constants';
import { EventType, ScrollData, ScrollDirection } from '../types';
import { EventManager } from '../managers/event.manager';
import { StateManager } from '../managers/state.manager';

interface ScrollContainer {
  element: Window | HTMLElement;
  lastScrollPos: number;
  debounceTimer: ReturnType<typeof setTimeout> | null;
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

    const elements: Array<Window | HTMLElement> = selectors
      .map((sel) => document.querySelector(sel))
      .filter((element): element is HTMLElement => element instanceof HTMLElement);

    if (elements.length === 0) {
      elements.push(window);
    }

    for (const element of elements) {
      this.setupScrollContainer(element);
    }
  }

  stopTracking(): void {
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
  }

  private setupScrollContainer(element: Window | HTMLElement): void {
    const container: ScrollContainer = {
      element,
      lastScrollPos: 0,
      debounceTimer: null,
      listener: () => {}, // Will be set below
    };

    const handleScroll = (): void => {
      if (this.get('suppressNextScroll')) {
        this.set('suppressNextScroll', false);
        return;
      }

      if (container.debounceTimer) {
        clearTimeout(container.debounceTimer);
      }

      container.debounceTimer = setTimeout(() => {
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
}
