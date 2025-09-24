import { EventListenerManager } from './listeners.types';
import { debugLog } from '../utils/logging';

export class VisibilityListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly onVisibilityChange: () => void;
  private readonly onNetworkRestored?: () => void;
  private readonly isMobile: boolean;
  private readonly options = { passive: true };

  constructor(
    onActivity: () => void,
    onVisibilityChange: () => void,
    isMobile: boolean,
    onNetworkRestored?: () => void,
  ) {
    this.onActivity = onActivity;
    this.onVisibilityChange = onVisibilityChange;
    this.onNetworkRestored = onNetworkRestored;
    this.isMobile = isMobile;
  }

  setup(): void {
    try {
      const hasVisibilityAPI = 'visibilityState' in document;
      if (hasVisibilityAPI) {
        document.addEventListener('visibilitychange', this.onVisibilityChange, this.options);
      }

      window.addEventListener('blur', this.onVisibilityChange, this.options);
      window.addEventListener('focus', this.onActivity, this.options);

      const hasNetworkAPI = 'onLine' in navigator;
      if (hasNetworkAPI) {
        window.addEventListener('online', this.handleOnline, this.options);
        window.addEventListener('offline', this.onVisibilityChange, this.options);
      }

      if (this.isMobile) {
        this.setupMobileEvents();
      }
    } catch (error) {
      debugLog.error('VisibilityListenerManager', 'Failed to setup visibility listeners', { error });
      throw error;
    }
  }

  cleanup(): void {
    try {
      if ('visibilityState' in document) {
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
      }

      window.removeEventListener('blur', this.onVisibilityChange);
      window.removeEventListener('focus', this.onActivity);

      if ('onLine' in navigator) {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.onVisibilityChange);
      }

      if (this.isMobile) {
        this.cleanupMobileEvents();
      }
    } catch (error) {
      debugLog.warn('VisibilityListenerManager', 'Error during visibility listeners cleanup', { error });
    }
  }

  private setupMobileEvents(): void {
    try {
      document.addEventListener('pause', this.onVisibilityChange, this.options);
      document.addEventListener('resume', this.onActivity, this.options);

      const hasOrientationAPI = 'orientation' in screen;
      if (hasOrientationAPI) {
        screen.orientation.addEventListener('change', this.onActivity, this.options);
      }

      window.addEventListener('pageshow', this.onActivity, this.options);
      window.addEventListener('pagehide', this.onActivity, this.options);
    } catch (error) {
      debugLog.warn('VisibilityListenerManager', 'Failed to setup mobile listeners', { error });
    }
  }

  private cleanupMobileEvents(): void {
    try {
      document.removeEventListener('pause', this.onVisibilityChange);
      document.removeEventListener('resume', this.onActivity);

      if ('orientation' in screen) {
        screen.orientation.removeEventListener('change', this.onActivity);
      }

      window.removeEventListener('pageshow', this.onActivity);
      window.removeEventListener('pagehide', this.onActivity);
    } catch (error) {
      debugLog.warn('VisibilityListenerManager', 'Error during mobile listeners cleanup', { error });
    }
  }

  private readonly handleOnline = (): void => {
    this.onActivity();
    this.onNetworkRestored?.();
  };
}
