import { EventListenerManager } from './listeners.types';
import { debugLog } from '../utils/logging';

export class TouchListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly options = { passive: true };

  constructor(onActivity: () => void) {
    this.onActivity = onActivity;
  }

  setup(): void {
    try {
      window.addEventListener('touchstart', this.onActivity, this.options);
      window.addEventListener('touchmove', this.onActivity, this.options);
      window.addEventListener('touchend', this.onActivity, this.options);
      window.addEventListener('orientationchange', this.onActivity, this.options);
    } catch (error) {
      debugLog.error('TouchListenerManager', 'Failed to setup touch listeners', { error });
      throw error;
    }
  }

  cleanup(): void {
    try {
      window.removeEventListener('touchstart', this.onActivity);
      window.removeEventListener('touchmove', this.onActivity);
      window.removeEventListener('touchend', this.onActivity);
      window.removeEventListener('orientationchange', this.onActivity);
    } catch (error) {
      debugLog.warn('TouchListenerManager', 'Error during touch listeners cleanup', { error });
    }
  }
}
