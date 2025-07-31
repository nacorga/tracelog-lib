import { EventListenerManager } from './listeners.types';

export class VisibilityListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly onVisibilityChange: () => void;
  private readonly isMobile: boolean;
  private readonly options = { passive: true };

  constructor(onActivity: () => void, onVisibilityChange: () => void, isMobile: boolean) {
    this.onActivity = onActivity;
    this.onVisibilityChange = onVisibilityChange;
    this.isMobile = isMobile;
  }

  setup(): void {
    if ('visibilityState' in document) {
      document.addEventListener('visibilitychange', this.onVisibilityChange, this.options);
    }

    window.addEventListener('blur', this.onVisibilityChange, this.options);
    window.addEventListener('focus', this.onActivity, this.options);

    if ('onLine' in navigator) {
      window.addEventListener('online', this.onActivity, this.options);
      window.addEventListener('offline', this.onVisibilityChange, this.options);
    }

    if (this.isMobile) {
      this.setupMobileEvents();
    }
  }

  cleanup(): void {
    if ('visibilityState' in document) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }

    window.removeEventListener('blur', this.onVisibilityChange);
    window.removeEventListener('focus', this.onActivity);

    if ('onLine' in navigator) {
      window.removeEventListener('online', this.onActivity);
      window.removeEventListener('offline', this.onVisibilityChange);
    }

    if (this.isMobile) {
      this.cleanupMobileEvents();
    }
  }

  private setupMobileEvents(): void {
    document.addEventListener('pause', this.onVisibilityChange, this.options);
    document.addEventListener('resume', this.onActivity, this.options);

    if ('orientation' in screen) {
      screen.orientation.addEventListener('change', this.onActivity, this.options);
    }

    window.addEventListener('pageshow', this.onActivity, this.options);
    window.addEventListener('pagehide', this.onActivity, this.options);
  }

  private cleanupMobileEvents(): void {
    document.removeEventListener('pause', this.onVisibilityChange);
    document.removeEventListener('resume', this.onActivity);

    if ('orientation' in screen) {
      screen.orientation.removeEventListener('change', this.onActivity);
    }

    window.removeEventListener('pageshow', this.onActivity);
    window.removeEventListener('pagehide', this.onActivity);
  }
}
