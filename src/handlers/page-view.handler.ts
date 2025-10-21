import { EventType, PageViewData } from '../types';
import { normalizeUrl } from '../utils';
import { StateManager } from '../managers/state.manager';
import { EventManager } from '../managers/event.manager';
import { DEFAULT_PAGE_VIEW_THROTTLE_MS } from '../constants/config.constants';

/**
 * Tracks page navigation and route changes in single-page applications.
 *
 * **Events Generated**: `page_view`
 *
 * **Features**:
 * - Tracks initial page load, browser navigation, hash changes, and History API calls
 * - URL normalization with automatic filtering of sensitive query parameters
 * - Deduplication to prevent consecutive duplicate events
 * - Configurable throttling (default: 1 second)
 * - SPA navigation detection via History API patching
 *
 * **Privacy Protection**:
 * - Automatically removes 15 common sensitive params (token, auth, key, password, etc.)
 * - User-configurable additional sensitive parameters via config
 *
 * @see src/handlers/README.md (lines 5-63) for detailed documentation
 */
export class PageViewHandler extends StateManager {
  private readonly eventManager: EventManager;
  private readonly onTrack: () => void;

  private originalPushState?: typeof window.history.pushState;
  private originalReplaceState?: typeof window.history.replaceState;
  private lastPageViewTime = 0;

  constructor(eventManager: EventManager, onTrack: () => void) {
    super();

    this.eventManager = eventManager;
    this.onTrack = onTrack;
  }

  /**
   * Starts tracking page views.
   *
   * - Tracks initial page load immediately
   * - Patches History API methods (pushState, replaceState)
   * - Listens to popstate and hashchange events
   */
  startTracking(): void {
    this.trackInitialPageView();

    window.addEventListener('popstate', this.trackCurrentPage, true);
    window.addEventListener('hashchange', this.trackCurrentPage, true);

    this.patchHistory('pushState');
    this.patchHistory('replaceState');
  }

  /**
   * Stops tracking page views and restores original History API methods.
   *
   * - Removes event listeners (popstate, hashchange)
   * - Restores original pushState and replaceState methods
   * - Resets throttling state
   */
  stopTracking(): void {
    window.removeEventListener('popstate', this.trackCurrentPage, true);
    window.removeEventListener('hashchange', this.trackCurrentPage, true);

    if (this.originalPushState) {
      window.history.pushState = this.originalPushState;
    }

    if (this.originalReplaceState) {
      window.history.replaceState = this.originalReplaceState;
    }

    this.lastPageViewTime = 0;
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

  private readonly trackCurrentPage = (): void => {
    const rawUrl = window.location.href;
    const normalizedUrl = normalizeUrl(rawUrl, this.get('config').sensitiveQueryParams);

    if (this.get('pageUrl') === normalizedUrl) {
      return;
    }

    // Throttle: Prevent rapid navigation spam
    const now = Date.now();
    const throttleMs = this.get('config').pageViewThrottleMs ?? DEFAULT_PAGE_VIEW_THROTTLE_MS;

    if (now - this.lastPageViewTime < throttleMs) {
      return;
    }

    this.lastPageViewTime = now;

    this.onTrack();

    const fromUrl = this.get('pageUrl');

    this.set('pageUrl', normalizedUrl);

    const pageViewData = this.extractPageViewData();
    this.eventManager.track({
      type: EventType.PAGE_VIEW,
      page_url: this.get('pageUrl'),
      from_page_url: fromUrl,
      ...(pageViewData && { page_view: pageViewData }),
    });
  };

  private trackInitialPageView(): void {
    const normalizedUrl = normalizeUrl(window.location.href, this.get('config').sensitiveQueryParams);
    const pageViewData = this.extractPageViewData();

    this.lastPageViewTime = Date.now();

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
