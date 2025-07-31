import { EventType } from '../types/event.types';
import { normalizeUrl } from '../utils/url.utils';
import { getUTMParameters } from '../utils/utm-params.utils';
import { StateManager } from '../services/state-manager';
import { EventManager } from '../services/event-manager';

export class PageViewHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly onTrack: () => void;

  private lastUrl: string;

  constructor(eventManager: EventManager, onTrack: () => void) {
    super();

    this.eventManager = eventManager;
    this.onTrack = onTrack;
    this.lastUrl = '';
  }

  startTracking(): void {
    this.trackCurrentPage();

    window.addEventListener('popstate', this.trackCurrentPage);
    window.addEventListener('hashchange', this.trackCurrentPage);

    this.patchHistory('pushState');
    this.patchHistory('replaceState');
  }

  private patchHistory(method: 'pushState' | 'replaceState'): void {
    const original = window.history[method];

    window.history[method] = (...args: [unknown, string, string | URL | null | undefined]): void => {
      original.apply(window.history, args);
      this.trackCurrentPage();
    };
  }

  private trackCurrentPage(): void {
    const rawUrl = window.location.href;
    const normalizedUrl = normalizeUrl(rawUrl, this.get('config').sensitiveQueryParams);

    if (this.lastUrl !== normalizedUrl) {
      const fromUrl = this.lastUrl;

      this.lastUrl = normalizedUrl;

      this.eventManager.track({
        type: EventType.PAGE_VIEW,
        page_url: this.lastUrl,
        from_page_url: fromUrl,
        utm: getUTMParameters(),
      });

      this.onTrack();
    }
  }
}
