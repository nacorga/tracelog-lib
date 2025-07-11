import { TracelogConfig } from '../types';
import { PageViewHandler, NavigationData, PageViewConfig } from '../events/pageview-handler';

export class UrlManager {
  private pageViewHandler: PageViewHandler;

  constructor(
    private config: TracelogConfig,
    private sendPageViewEvent: (fromUrl: string, toUrl: string, referrer?: string, utm?: any) => void,
  ) {
    const pageViewConfig: PageViewConfig = {
      trackReferrer: true,
      trackUTM: true,
    };

    this.pageViewHandler = new PageViewHandler(pageViewConfig, this.handleNavigation.bind(this));
  }

  initialize(): void {
    this.pageViewHandler.init();

    // Send initial page view
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
    // Only send page view if not excluded
    if (!this.isRouteExcluded(data.toUrl)) {
      this.sendPageViewEvent(data.fromUrl, data.toUrl, data.referrer, data.utm);
    }
  }
}
