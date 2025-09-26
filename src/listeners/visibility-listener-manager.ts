import { EventListenerManager } from './listeners.types';
import { debugLog } from '../utils/logging';

export class VisibilityListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly onVisibilityChange: () => void;
  private readonly options = { passive: true };

  constructor(onActivity: () => void, onVisibilityChange: () => void) {
    this.onActivity = onActivity;
    this.onVisibilityChange = onVisibilityChange;
  }

  setup(): void {
    try {
      // Core visibility API support
      if ('visibilityState' in document) {
        document.addEventListener('visibilitychange', this.onVisibilityChange, this.options);
      }

      // Window focus/blur events
      window.addEventListener('blur', this.onVisibilityChange, this.options);
      window.addEventListener('focus', this.onActivity, this.options);

      // Basic network status detection
      if ('onLine' in navigator) {
        window.addEventListener('online', this.onActivity, this.options);
        window.addEventListener('offline', this.onVisibilityChange, this.options);
      }
    } catch (error) {
      debugLog.error('VisibilityListenerManager', 'Failed to setup visibility listeners', { error });
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
        window.removeEventListener('online', this.onActivity);
        window.removeEventListener('offline', this.onVisibilityChange);
      }
    } catch (error) {
      debugLog.warn('VisibilityListenerManager', 'Error during visibility listeners cleanup', { error });
    }
  }
}
