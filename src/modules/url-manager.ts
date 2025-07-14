import { Config } from '../types';
import { PageViewHandler, NavigationData, PageViewConfig } from '../events';

export class UrlManager {
  private readonly pageViewHandler: PageViewHandler;

  constructor(
    private readonly config: Config,
    private readonly sendPageViewEvent: (fromUrl: string, toUrl: string, referrer?: string, utm?: any) => void,
    private readonly suppressNextScrollEvent?: () => void,
  ) {
    const pageViewConfig: PageViewConfig = {
      trackReferrer: true,
      trackUTM: true,
      onSuppressNextScroll: this.suppressNextScrollEvent,
    };

    this.pageViewHandler = new PageViewHandler(pageViewConfig, this.handleNavigation.bind(this));
  }

  initialize(): void {
    this.pageViewHandler.init();
    const initialNavigation = this.pageViewHandler.handleInitialPageView();
    this.handleNavigation(initialNavigation);
  }

  getCurrentUrl(): string {
    return this.pageViewHandler.getCurrentUrl();
  }

  getUTMParams(): any {
    return this.pageViewHandler.getUTMParams();
  }

  updateUrl(url: string): void {
    this.pageViewHandler.updateUrl(url);
  }

  isRouteExcluded(url: string): boolean {
    return PageViewHandler.isRouteExcluded(url, this.config.excludedUrlPaths || []);
  }

  private handleNavigation(data: NavigationData): void {
    if (!this.isRouteExcluded(data.toUrl)) {
      this.sendPageViewEvent(data.fromUrl, data.toUrl, data.referrer, data.utm);
    }
  }
}
