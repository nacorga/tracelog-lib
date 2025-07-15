import { UTM_PARAMS } from '../constants';
import { UTM } from '../types';

export interface NavigationData {
  fromUrl: string;
  toUrl: string;
  referrer?: string;
  utm?: UTM;
}

export interface PageViewConfig {
  trackReferrer?: boolean;
  trackUTM?: boolean;
  onSuppressNextScroll?: () => void;
}

// Helper functions moved to module scope for better performance
const isRegularExpression = (value: unknown): value is RegExp =>
  typeof value === 'object' && value !== undefined && typeof (value as RegExp).test === 'function';

const escapeRegexString = (string_: string): string => string_.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');

const wildcardToRegex = (string_: string): RegExp =>
  new RegExp(
    '^' +
      string_
        .split('*')
        .map((element) => escapeRegexString(element))
        .join('.+') +
      '$',
  );

export class PageViewHandler {
  private currentUrl = '';
  private readonly utmParams: UTM | undefined = undefined;
  private originalPushState?: typeof history.pushState;
  private originalReplaceState?: typeof history.replaceState;
  private popstateHandler?: (event: PopStateEvent) => void;

  constructor(
    private readonly config: PageViewConfig,
    private readonly onNavigationEvent: (data: NavigationData) => void,
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

  getUTMParams(): UTM | undefined {
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
    this.originalPushState = history.pushState;
    this.originalReplaceState = history.replaceState;

    history.pushState = (...arguments_: Parameters<typeof history.pushState>): void => {
      const fromUrl = this.currentUrl;
      this.originalPushState!.apply(history, arguments_);
      this.handleNavigation(fromUrl, window.location.href);
    };

    history.replaceState = (...arguments_: Parameters<typeof history.replaceState>): void => {
      const fromUrl = this.currentUrl;
      this.originalReplaceState!.apply(history, arguments_);
      this.handleNavigation(fromUrl, window.location.href);
    };

    // Handle popstate events (back/forward buttons)
    this.popstateHandler = () => {
      const fromUrl = this.currentUrl;
      this.handleNavigation(fromUrl, window.location.href);
    };

    window.addEventListener('popstate', this.popstateHandler);
  }

  private handleNavigation(fromUrl: string, toUrl: string): void {
    if (fromUrl === toUrl) return;

    this.currentUrl = toUrl;

    const navigationData: NavigationData = {
      fromUrl,
      toUrl,
    };

    this.onNavigationEvent(navigationData);

    if (this.config.onSuppressNextScroll) {
      this.config.onSuppressNextScroll();
    }
  }

  private extractUTMParameters(): UTM | undefined {
    const urlParameters = new URLSearchParams(window.location.search);
    const utmParameters: Partial<Record<keyof UTM, string>> = {};

    for (const parameter of UTM_PARAMS) {
      const value = urlParameters.get(parameter);

      if (value) {
        const key = parameter.split('utm_')[1] as keyof UTM;
        utmParameters[key] = value;
      }
    }

    return Object.keys(utmParameters).length > 0 ? utmParameters : undefined;
  }

  static isRouteExcluded(url: string, excludedPaths: string[] = []): boolean {
    if (excludedPaths.length === 0) {
      return false;
    }

    const path = new URL(url, window.location.origin).pathname;

    return excludedPaths.some((pattern) => {
      if (isRegularExpression(pattern)) {
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

  cleanup(): void {
    if (this.originalPushState) {
      history.pushState = this.originalPushState;
      this.originalPushState = undefined;
    }

    if (this.originalReplaceState) {
      history.replaceState = this.originalReplaceState;
      this.originalReplaceState = undefined;
    }

    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = undefined;
    }
  }
}
