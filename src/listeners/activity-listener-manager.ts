import { EventListenerManager } from './listeners.types';

export class ActivityListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly options = { passive: true };

  constructor(onActivity: () => void) {
    this.onActivity = onActivity;
  }

  setup(): void {
    window.addEventListener('scroll', this.onActivity, this.options);
    window.addEventListener('resize', this.onActivity, this.options);
    window.addEventListener('focus', this.onActivity, this.options);
  }

  cleanup(): void {
    window.removeEventListener('scroll', this.onActivity);
    window.removeEventListener('resize', this.onActivity);
    window.removeEventListener('focus', this.onActivity);
  }
}
