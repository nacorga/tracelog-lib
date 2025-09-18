import { EventListenerManager } from './listeners.types';
import { debugLog } from '../utils/logging';

export class UnloadListenerManager implements EventListenerManager {
  private readonly onInactivity: () => void;
  private readonly options = { passive: true };

  constructor(onInactivity: () => void) {
    this.onInactivity = onInactivity;
  }

  setup(): void {
    try {
      window.addEventListener('beforeunload', this.onInactivity, this.options);
      window.addEventListener('pagehide', this.onInactivity, this.options);
    } catch (error) {
      debugLog.error('UnloadListenerManager', 'Failed to setup unload listeners', { error });
      throw error;
    }
  }

  cleanup(): void {
    try {
      window.removeEventListener('beforeunload', this.onInactivity);
      window.removeEventListener('pagehide', this.onInactivity);
    } catch (error) {
      debugLog.warn('UnloadListenerManager', 'Error during unload listeners cleanup', { error });
    }
  }
}
