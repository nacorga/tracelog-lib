import { SCROLL_DEBOUNCE_TIME } from '../constants';
import { ScrollDirection, EventScrollData } from '../types';

export interface ScrollContainer {
  element: Window | HTMLElement;
  lastScrollPos: number;
  debounceTimer: ReturnType<typeof setTimeout> | null;
  listener: EventListener;
}

export interface ScrollConfig {
  containerSelectors?: string | string[];
  debounceTime?: number;
}

export class ScrollHandler {
  private containers: ScrollContainer[] = [];
  private suppressNext = false;

  constructor(
    private readonly config: ScrollConfig,
    private readonly onScrollEvent: (data: EventScrollData) => void,
  ) {}

  init(): void {
    const raw = this.config.containerSelectors;
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

  suppressNextEvent(): void {
    this.suppressNext = true;

    setTimeout(
      () => {
        this.suppressNext = false;
      },
      (this.config.debounceTime || SCROLL_DEBOUNCE_TIME) * 2,
    );
  }

  private setupScrollContainer(element: Window | HTMLElement): void {
    const handleScroll = () => {
      if (this.suppressNext) {
        this.suppressNext = false;
        return;
      }

      if (container.debounceTimer) {
        clearTimeout(container.debounceTimer);
      }

      container.debounceTimer = setTimeout(() => {
        const scrollData = this.calculateScrollData(container);

        if (scrollData) {
          this.onScrollEvent(scrollData);
        }
        container.debounceTimer = null;
      }, this.config.debounceTime || SCROLL_DEBOUNCE_TIME);
    };

    const container: ScrollContainer = {
      element,
      lastScrollPos: 0,
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

  private calculateScrollData(container: ScrollContainer): EventScrollData | null {
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
    if (positionDelta < 10) {
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

  cleanup(): void {
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

    this.containers = [];
  }
}
