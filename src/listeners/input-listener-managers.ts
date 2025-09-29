import { EventListenerManager } from './listeners.types';
import { debugLog } from '../utils/logging';

/**
 * Base class for input listener managers to reduce code duplication
 */
abstract class BaseInputListenerManager implements EventListenerManager {
  protected readonly onActivity: () => void;
  protected readonly options = { passive: true };
  protected abstract readonly events: string[];
  protected abstract readonly logPrefix: string;

  constructor(onActivity: () => void) {
    this.onActivity = onActivity;
  }

  setup(): void {
    try {
      this.events.forEach((event) => {
        window.addEventListener(event, this.onActivity, this.options);
      });
    } catch (error) {
      debugLog.error(this.logPrefix, `Failed to setup ${this.logPrefix.toLowerCase()} listeners`, { error });
    }
  }

  cleanup(): void {
    try {
      this.events.forEach((event) => {
        window.removeEventListener(event, this.onActivity);
      });
    } catch (error) {
      debugLog.warn(this.logPrefix, `Error during ${this.logPrefix.toLowerCase()} listeners cleanup`, { error });
    }
  }
}

export class MouseListenerManager extends BaseInputListenerManager {
  protected readonly events = ['mousemove', 'mousedown', 'wheel'];
  protected readonly logPrefix = 'MouseListenerManager';
}

export class KeyboardListenerManager extends BaseInputListenerManager {
  protected readonly events = ['keydown'];
  protected readonly logPrefix = 'KeyboardListenerManager';
}
