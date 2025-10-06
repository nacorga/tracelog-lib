import { EventListenerManager } from './listeners.types';
import { log } from '../utils';

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
      log('error', 'Failed to setup unload listeners', { error });
      throw error;
    }
  }

  cleanup(): void {
    try {
      window.removeEventListener('beforeunload', this.onInactivity);
      window.removeEventListener('pagehide', this.onInactivity);
    } catch (error) {
      log('warn', 'Error during unload listeners cleanup', { error });
    }
  }
}
