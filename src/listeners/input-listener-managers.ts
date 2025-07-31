import { EventListenerManager } from './listeners.types';

export class MouseListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly options = { passive: true };

  constructor(onActivity: () => void) {
    this.onActivity = onActivity;
  }

  setup(): void {
    window.addEventListener('mousemove', this.onActivity, this.options);
    window.addEventListener('mousedown', this.onActivity, this.options);
    window.addEventListener('wheel', this.onActivity, this.options);
  }

  cleanup(): void {
    window.removeEventListener('mousemove', this.onActivity);
    window.removeEventListener('mousedown', this.onActivity);
    window.removeEventListener('wheel', this.onActivity);
  }
}

export class KeyboardListenerManager implements EventListenerManager {
  private readonly onActivity: () => void;
  private readonly options = { passive: true };

  constructor(onActivity: () => void) {
    this.onActivity = onActivity;
  }

  setup(): void {
    window.addEventListener('keydown', this.onActivity, this.options);
    window.addEventListener('keypress', this.onActivity, this.options);
  }

  cleanup(): void {
    window.removeEventListener('keydown', this.onActivity);
    window.removeEventListener('keypress', this.onActivity);
  }
}
