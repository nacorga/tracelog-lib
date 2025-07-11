import { UTM_PARAMS } from '../constants';
import { TracelogEventUtm } from '../types';

export interface NavigationData {
  fromUrl: string;
  toUrl: string;
  referrer?: string;
  utm?: TracelogEventUtm;
}

export interface PageViewConfig {
  trackReferrer?: boolean;
  trackUTM?: boolean;
}

export class PageViewHandler {
  private currentUrl: string = '';
  private utmParams: TracelogEventUtm | null = null;

  constructor(
    private config: PageViewConfig,
    private onNavigationEvent: (data: NavigationData) => void,
  ) {
    this.currentUrl = window.location.href;
    if (this.config.trackUTM !== false) {
      this.utmParams = this.extractUTMParameters();
    }
  }

  init(): void {
    this.setupNavigationTracking();
  }

  getCurrentUrl(): string {
    return this.currentUrl;
  }

  getUTMParams(): TracelogEventUtm | null {
    return this.utmParams;
  }

  handleInitialPageView(): NavigationData {
    const data: NavigationData = {
      fromUrl: '',
      toUrl: this.currentUrl,
    };

    if (this.config.trackReferrer !== false) {
      data.referrer = document.referrer || 'Direct';
    }

    if (this.utmParams) {
      data.utm = this.utmParams;
    }

    return data;
  }

  private setupNavigationTracking(): void {
    // Override history methods to track SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      const fromUrl = this.currentUrl;
      originalPushState.apply(history, args);
      this.handleNavigation(fromUrl, window.location.href);
    };

    history.replaceState = (...args) => {
      const fromUrl = this.currentUrl;
      originalReplaceState.apply(history, args);
      this.handleNavigation(fromUrl, window.location.href);
    };

    // Handle popstate events (back/forward buttons)
    window.addEventListener('popstate', () => {
      const fromUrl = this.currentUrl;
      this.handleNavigation(fromUrl, window.location.href);
    });
  }

  private handleNavigation(fromUrl: string, toUrl: string): void {
    if (fromUrl === toUrl) return;

    this.currentUrl = toUrl;

    const navigationData: NavigationData = {
      fromUrl,
      toUrl,
    };

    this.onNavigationEvent(navigationData);
  }

  private extractUTMParameters(): TracelogEventUtm | null {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams: Partial<Record<keyof TracelogEventUtm, string>> = {};

    UTM_PARAMS.forEach((param) => {
      const value = urlParams.get(param);

      if (value) {
        const key = param.split('utm_')[1] as keyof TracelogEventUtm;
        utmParams[key] = value;
      }
    });

    return Object.keys(utmParams).length ? utmParams : null;
  }

  static isRouteExcluded(url: string, excludedPaths: string[] = []): boolean {
    if (!excludedPaths.length) {
      return false;
    }

    const path = new URL(url, window.location.origin).pathname;

    const isRegExp = (val: unknown): val is RegExp =>
      typeof val === 'object' && val !== null && typeof (val as RegExp).test === 'function';

    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wildcardToRegex = (str: string) => new RegExp('^' + str.split('*').map(escapeRegex).join('.+') + '$');

    return excludedPaths.some((pattern) => {
      if (isRegExp(pattern)) {
        return pattern.test(path);
      }

      if (pattern.includes('*')) {
        return wildcardToRegex(pattern).test(path);
      }

      return pattern === path;
    });
  }

  updateUrl(url: string): void {
    this.currentUrl = url;
  }
}
