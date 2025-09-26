import { EventType, PageViewData } from '../types';
import { normalizeUrl } from '../utils';
import { StateManager } from '../managers/state.manager';
import { EventManager } from '../managers/event.manager';
import { debugLog } from '../utils/logging';

export class PageViewHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly onTrack: () => void;

  private originalPushState?: typeof window.history.pushState;
  private originalReplaceState?: typeof window.history.replaceState;

  constructor(eventManager: EventManager, onTrack: () => void) {
    super();

    this.eventManager = eventManager;
    this.onTrack = onTrack;
  }

  startTracking(): void {
    debugLog.debug('PageViewHandler', 'Starting page view tracking');

    this.trackInitialPageView();

    window.addEventListener('popstate', this.trackCurrentPage);
    window.addEventListener('hashchange', this.trackCurrentPage);

    this.patchHistory('pushState');
    this.patchHistory('replaceState');
  }

  stopTracking(): void {
    debugLog.debug('PageViewHandler', 'Stopping page view tracking');

    window.removeEventListener('popstate', this.trackCurrentPage);
    window.removeEventListener('hashchange', this.trackCurrentPage);

    if (this.originalPushState) {
      window.history.pushState = this.originalPushState;
    }

    if (this.originalReplaceState) {
      window.history.replaceState = this.originalReplaceState;
    }
  }

  private patchHistory(method: 'pushState' | 'replaceState'): void {
    const original = window.history[method];

    if (method === 'pushState' && !this.originalPushState) {
      this.originalPushState = original;
    } else if (method === 'replaceState' && !this.originalReplaceState) {
      this.originalReplaceState = original;
    }

    window.history[method] = (...args: [unknown, string, string | URL | null | undefined]): void => {
      original.apply(window.history, args);
      this.trackCurrentPage();
    };
  }

  private readonly trackCurrentPage = async (): Promise<void> => {
    const rawUrl = window.location.href;
    const normalizedUrl = normalizeUrl(rawUrl, this.get('config').sensitiveQueryParams);

    if (this.get('pageUrl') !== normalizedUrl) {
      const fromUrl = this.get('pageUrl');

      debugLog.debug('PageViewHandler', 'Page navigation detected', { from: fromUrl, to: normalizedUrl });

      this.set('pageUrl', normalizedUrl);

      const pageViewData = this.extractPageViewData();
      this.eventManager.track({
        type: EventType.PAGE_VIEW,
        page_url: this.get('pageUrl'),
        from_page_url: fromUrl,
        ...(pageViewData && { page_view: pageViewData }),
      });

      this.onTrack();
    }
  };

  private trackInitialPageView(): void {
    const normalizedUrl = normalizeUrl(window.location.href, this.get('config').sensitiveQueryParams);
    const pageViewData = this.extractPageViewData();

    this.eventManager.track({
      type: EventType.PAGE_VIEW,
      page_url: normalizedUrl,
      ...(pageViewData && { page_view: pageViewData }),
    });

    this.onTrack();
  }

  private extractPageViewData(): PageViewData | undefined {
    const { pathname, search, hash } = window.location;
    const { referrer } = document;
    const { title } = document;

    // Early return if no meaningful data
    if (!referrer && !title && !pathname && !search && !hash) {
      return undefined;
    }

    const data: PageViewData = {
      ...(referrer && { referrer }),
      ...(title && { title }),
      ...(pathname && { pathname }),
      ...(search && { search }),
      ...(hash && { hash }),
    };

    return data;
  }
}
