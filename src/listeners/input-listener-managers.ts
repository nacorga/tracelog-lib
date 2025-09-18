import { EventListenerManager } from './listeners.types';
import { debugLog } from '../utils/logging';

export class MouseListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly options = { passive: true };

  constructor(onActivity: () => void) {
    this.onActivity = onActivity;
  }

  setup(): void {
    try {
      window.addEventListener('mousemove', this.onActivity, this.options);
      window.addEventListener('mousedown', this.onActivity, this.options);
      window.addEventListener('wheel', this.onActivity, this.options);
    } catch (error) {
      debugLog.error('MouseListenerManager', 'Failed to setup mouse listeners', { error });
      throw error;
    }
  }

  cleanup(): void {
    try {
      window.removeEventListener('mousemove', this.onActivity);
      window.removeEventListener('mousedown', this.onActivity);
      window.removeEventListener('wheel', this.onActivity);
    } catch (error) {
      debugLog.warn('MouseListenerManager', 'Error during mouse listeners cleanup', { error });
    }
  }
}

export class KeyboardListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly options = { passive: true };

  constructor(onActivity: () => void) {
    this.onActivity = onActivity;
  }

  setup(): void {
    try {
      window.addEventListener('keydown', this.onActivity, this.options);
      window.addEventListener('keypress', this.onActivity, this.options);
    } catch (error) {
      debugLog.error('KeyboardListenerManager', 'Failed to setup keyboard listeners', { error });
      throw error;
    }
  }

  cleanup(): void {
    try {
      window.removeEventListener('keydown', this.onActivity);
      window.removeEventListener('keypress', this.onActivity);
    } catch (error) {
      debugLog.warn('KeyboardListenerManager', 'Error during keyboard listeners cleanup', { error });
    }
  }
}
