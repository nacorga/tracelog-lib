import { EventType } from '../types';
import { normalizeUrl } from '../utils';
import { StateManager } from '../managers/state.manager';
import { EventManager } from '../managers/event.manager';

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
    this.trackInitialPageView();
    this.trackCurrentPage();

    window.addEventListener('popstate', this.trackCurrentPage);
    window.addEventListener('hashchange', this.trackCurrentPage);

    this.patchHistory('pushState');
    this.patchHistory('replaceState');
  }

  stopTracking(): void {
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
    if (method === 'pushState' && !this.originalPushState) {
      this.originalPushState = window.history.pushState;
    } else if (method === 'replaceState' && !this.originalReplaceState) {
      this.originalReplaceState = window.history.replaceState;
    }

    const original = window.history[method];

    window.history[method] = (...args: [unknown, string, string | URL | null | undefined]): void => {
      original.apply(window.history, args);
      this.trackCurrentPage();
    };
  }

  private readonly trackCurrentPage = (): void => {
    const rawUrl = window.location.href;
    const normalizedUrl = normalizeUrl(rawUrl, this.get('config').sensitiveQueryParams);

    if (this.get('pageUrl') !== normalizedUrl) {
      const fromUrl = this.get('pageUrl');

      this.set('pageUrl', normalizedUrl);

      this.eventManager.track({
        type: EventType.PAGE_VIEW,
        page_url: this.get('pageUrl'),
        from_page_url: fromUrl,
      });

      this.onTrack();
    }
  };

  private trackInitialPageView(): void {
    this.eventManager.track({
      type: EventType.PAGE_VIEW,
      page_url: this.get('pageUrl'),
    });

    this.onTrack();
  }
}
