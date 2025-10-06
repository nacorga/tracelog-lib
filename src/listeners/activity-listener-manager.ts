import { EventListenerManager } from './listeners.types';
import { log } from '../utils';

export class ActivityListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly options = { passive: true };

  constructor(onActivity: () => void) {
    this.onActivity = onActivity;
  }

  setup(): void {
    try {
      window.addEventListener('scroll', this.onActivity, this.options);
      window.addEventListener('resize', this.onActivity, this.options);
      window.addEventListener('focus', this.onActivity, this.options);
    } catch (error) {
      log('error', 'Failed to setup activity listeners', { error });
      throw error;
    }
  }

  cleanup(): void {
    try {
      window.removeEventListener('scroll', this.onActivity);
      window.removeEventListener('resize', this.onActivity);
      window.removeEventListener('focus', this.onActivity);
    } catch (error) {
      log('warn', 'Error during activity listeners cleanup', { error });
    }
  }
}
