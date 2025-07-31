import { EventListenerManager } from './listeners.types';

export class UnloadListenerManager implements EventListenerManager {
  private readonly onInactivity: () => void;
  private readonly options = { passive: true };

  constructor(onInactivity: () => void) {
    this.onInactivity = onInactivity;
  }

  setup(): void {
    window.addEventListener('beforeunload', this.onInactivity, this.options);
    window.addEventListener('pagehide', this.onInactivity, this.options);
  }

  cleanup(): void {
    window.removeEventListener('beforeunload', this.onInactivity);
    window.removeEventListener('pagehide', this.onInactivity);
  }
}
